import 'server-only';

import type { AiTool } from '@/app/lib/ai/tools/registry';

/**
 * The rest of the employee dashboard.
 *
 * The first eight tools covered leads, cases, tasks and requests at a glance.
 * An audit against the brief found roughly eight tools against thirty dashboard
 * actions — the AI could not see a client at all, could not complete a task it
 * had created, and could not mark the very lead its own prompt told it to
 * handle. These close that gap.
 *
 * Tiering follows the same rule: check where a field is RENDERED before calling
 * it internal — by grepping app/client/** and the RLS policies, not by
 * intuition. Each of these was traced:
 *   - A client record carries no login (user_id stays null) and appears in no
 *     portal, so creating one is internal work → write.
 *   - A lead is pre-customer CRM state, read nowhere under app/client/ and with
 *     no anon policy → write.
 *   - A task is SPLIT. `tasks_select_client` (002_security_fixes.sql) lets a
 *     customer read every task on their own case, and the portal prints
 *     task.title and colours a badge from task.status — so those two are
 *     propose, while priority/due_date/description/assigned_to are write.
 *     This file originally claimed "a task is internal by construction"; an
 *     adversarial review proved otherwise, which is why the rule above says to
 *     grep rather than reason.
 *   - Case fields are printed on the customer's own case page → propose.
 */

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : null;

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

/**
 * The `inputSchema` on a tool is a HINT TO THE MODEL, not a contract. Nothing
 * validates tool arguments server-side — run-tools.ts hands `tool.run` the raw
 * JSON the provider emitted. So every enumerated field has to be re-checked
 * here, and the database is not a backstop: a CHECK constraint is *satisfied*
 * by NULL, so `status: null` sails past `CHECK (status IN (...))` and lands.
 */
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], field: string): T => {
  const s = str(v);
  if (!s || !(allowed as readonly string[]).includes(s)) {
    throw new Error(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return s as T;
};

/**
 * A real YYYY-MM-DD calendar date. Postgres `date` accepts much looser input
 * and resolves ambiguous forms by server locale, so "08/09/2026" could store a
 * different day than the human read and approved.
 */
const isoDate = (v: unknown, field: string): string => {
  const s = str(v);
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`${field} must be YYYY-MM-DD`);
  const parsed = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== s) {
    throw new Error(`${field} is not a real date`);
  }
  return s;
};

/**
 * Today in Amsterdam. `toISOString()` is UTC by specification — no TZ env var
 * can change it — so for the first one to two hours of every Dutch day it names
 * yesterday, which would make "overdue" and "due this week" wrong exactly when
 * someone checks first thing in the morning.
 */
const amsterdamToday = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());

/** Days after an Amsterdam date, anchored at midday so a DST shift cannot slip a day. */
const daysAfter = (isoDay: string, days: number): string =>
  new Date(new Date(`${isoDay}T12:00:00Z`).getTime() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);

/**
 * PostgREST parses `or=(...)` as a boolean tree and supabase-js appends the
 * string unescaped, so a search term containing a comma or a parenthesis does
 * not get searched for — it edits the filter. Strip the grammar characters.
 */
const likeTerm = (v: unknown): string | null => {
  const s = str(v);
  if (!s) return null;
  return s.replace(/[,()\\"*]/g, ' ').trim() || null;
};

/**
 * Presence with an explicit null means "clear this field"; presence with an
 * empty string is a model slip, not an instruction. Collapsing both to null (as
 * `str` does) turns a sloppy `title: ""` into a silent proposal to ERASE the
 * case title, which a reviewer sees only as "→ leeg".
 */
const nullableField = (v: unknown, field: string): string | null => {
  if (v === null) return null;
  const s = str(v);
  if (!s) throw new Error(`${field} must be text, or null to clear it`);
  return s;
};

/**
 * Page size for every list tool. Paired with an `offset` argument — the first
 * eight tools capped at 25 with no way past it, which silently hid rows once
 * there was real volume and gave the model no way to know it.
 */
const LIMIT = 25;

const page = (input: Record<string, unknown>) => {
  const offset = Math.max(0, num(input.offset) ?? 0);
  return { from: offset, to: offset + LIMIT - 1, offset };
};

/** Uniform shape so the model can always tell whether more rows exist. */
const paged = <T>(key: string, rows: T[] | null, count: number | null, offset: number) => ({
  [key]: rows ?? [],
  total: count ?? 0,
  offset,
  returned: rows?.length ?? 0,
  has_more: (count ?? 0) > offset + (rows?.length ?? 0),
});

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------

export const listClients: AiTool = {
  name: 'list_clients',
  access: 'read',
  description:
    'List clients with their company, contact details and status. Call this to find a client by name or company, to see who a case belongs to, or when asked about a customer by name.',
  inputSchema: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Match on company name, contact name or email.' },
      status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
      offset: { type: 'number', description: 'Skip this many rows. Use with has_more to page.' },
    },
  },
  async run(input, ctx) {
    const { from, to, offset } = page(input);
    let query = ctx.admin
      .from('clients')
      .select('id, company_name, contact_name, email, phone, city, kvk_number, status, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(from, to);

    if ('status' in input) {
      query = query.eq('status', oneOf(input.status, ['active', 'inactive', 'pending'], 'status'));
    }
    const search = likeTerm(input.search);
    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }

    const { data, count, error } = await query;
    if (error) throw new Error(`could not read clients: ${error.message}`);
    return paged('clients', data, count, offset);
  },
};

export const getClient: AiTool = {
  name: 'get_client',
  access: 'read',
  description:
    'Full detail for one client: contact details, address, KvK number, notes, and all their cases. Call this before advising on anything client-specific.',
  inputSchema: {
    type: 'object',
    properties: { client_id: { type: 'string', description: 'Client id from list_clients.' } },
    required: ['client_id'],
  },
  async run(input, ctx) {
    const clientId = str(input.client_id);
    if (!clientId) throw new Error('client_id is required');

    const [clientResult, casesResult] = await Promise.all([
      ctx.admin
        .from('clients')
        .select(
          'id, company_name, contact_name, email, phone, address, city, postal_code, kvk_number, notes, status, created_at',
        )
        .eq('id', clientId)
        .maybeSingle(),
      ctx.admin
        .from('cases')
        .select('id, title, case_type, status, deadline')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(LIMIT),
    ]);

    // Report failures as failures. Dropping `error` on the floor turns a
    // connection blip into "client not found" or a silently empty case list,
    // and the model then advises the colleague on a client it never read.
    if (clientResult.error) throw new Error(`could not read the client: ${clientResult.error.message}`);
    if (casesResult.error) throw new Error(`could not read the cases: ${casesResult.error.message}`);
    if (!clientResult.data) throw new Error('client not found');
    return { client: clientResult.data, cases: casesResult.data ?? [] };
  },
};

export const listDocuments: AiTool = {
  name: 'list_documents',
  access: 'read',
  description:
    'List uploaded document METADATA — name, category, size, which case and client. File contents are never available to you. Call this to check what has actually been received.',
  inputSchema: {
    type: 'object',
    properties: {
      case_id: { type: 'string', description: 'Only documents on this case.' },
      client_id: { type: 'string', description: 'Only documents for this client.' },
      // Enumerated on purpose: a free-text category the database does not know
      // returns zero rows, which the model would read as "nothing uploaded".
      category: {
        type: 'string',
        enum: [
          'contract',
          'permit',
          'identification',
          'financial',
          'correspondence',
          'bibob',
          'general',
        ],
      },
      offset: { type: 'number', description: 'Skip this many rows.' },
    },
  },
  async run(input, ctx) {
    const { from, to, offset } = page(input);
    let query = ctx.admin
      .from('documents')
      .select('id, name, category, file_type, file_size, case_id, client_id, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(from, to);

    const caseId = str(input.case_id);
    if (caseId) query = query.eq('case_id', caseId);
    const clientId = str(input.client_id);
    if (clientId) query = query.eq('client_id', clientId);
    if ('category' in input) {
      query = query.eq(
        'category',
        oneOf(
          input.category,
          ['contract', 'permit', 'identification', 'financial', 'correspondence', 'bibob', 'general'],
          'category',
        ),
      );
    }

    const { data, count, error } = await query;
    if (error) throw new Error(`could not read documents: ${error.message}`);
    return paged('documents', data, count, offset);
  },
};

export const getOverview: AiTool = {
  name: 'get_overview',
  access: 'read',
  description:
    'What needs attention right now: overdue tasks, deadlines in the next 7 days, unreviewed client requests, new leads, and open AI proposals. Call this first when asked something broad like "what is urgent", "what should I do today" or "how are we doing".',
  inputSchema: { type: 'object', properties: {} },
  async run(_input, ctx) {
    const today = amsterdamToday();
    const inAWeek = daysAfter(today, 7);

    const [overdueTasks, dueSoon, openTasks, newLeads, pendingRequests, openProposals, activeCases] =
      await Promise.all([
        ctx.admin
          .from('tasks')
          .select('id, title, due_date, case_id')
          .in('status', ['pending', 'in_progress'])
          .lt('due_date', today)
          .order('due_date')
          .limit(LIMIT),
        ctx.admin
          .from('cases')
          .select('id, title, deadline, status')
          .not('deadline', 'is', null)
          .gte('deadline', today)
          .lte('deadline', inAWeek)
          .order('deadline')
          .limit(LIMIT),
        ctx.admin
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'in_progress']),
        ctx.admin.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        ctx.admin
          .from('client_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        ctx.admin
          .from('ai_proposals')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        ctx.admin
          .from('cases')
          .select('id', { count: 'exact', head: true })
          .not('status', 'in', '(completed,cancelled,rejected)'),
      ]);

    return {
      overdue_tasks: overdueTasks.data ?? [],
      deadlines_next_7_days: dueSoon.data ?? [],
      counts: {
        open_tasks: openTasks.count ?? 0,
        new_leads: newLeads.count ?? 0,
        requests_awaiting_review: pendingRequests.count ?? 0,
        ai_proposals_awaiting_review: openProposals.count ?? 0,
        active_cases: activeCases.count ?? 0,
      },
      today,
    };
  },
};

// ---------------------------------------------------------------------------
// WRITE — internal, reversible, invisible to any customer
// ---------------------------------------------------------------------------

export const updateTask: AiTool = {
  name: 'update_task',
  access: 'write',
  description:
    'Update the internal planning of an existing task: its priority, due date, description, or which human colleague owns it. Only fields you name are changed. To change a task TITLE or mark it done, use propose_task_update instead — the customer can see those.',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: { type: 'string', description: 'Task id from list_tasks.' },
      priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
      due_date: { type: 'string', description: 'YYYY-MM-DD, or null to clear it.' },
      description: { type: 'string', description: 'Internal detail. Not shown to the customer.' },
      assigned_to: {
        type: 'string',
        description:
          'Profile id of a HUMAN colleague. You cannot assign a task to an AI — the database refuses it.',
      },
    },
    required: ['task_id'],
  },
  async run(input, ctx) {
    const taskId = str(input.task_id);
    if (!taskId) throw new Error('task_id is required');

    // title and status are deliberately absent: the client portal prints both
    // on the customer's own case page (app/client/cases/[id]/page.tsx renders
    // task.title and colours a badge from task.status). Say so rather than
    // ignoring them, so the model routes to the proposal instead of assuming
    // the change landed.
    if ('title' in input || 'status' in input) {
      throw new Error(
        'title and status are visible to the customer — use propose_task_update for those. This tool only changes internal planning fields.',
      );
    }

    const patch: Record<string, string | null> = {};
    if ('priority' in input) {
      patch.priority = oneOf(input.priority, ['low', 'normal', 'high', 'urgent'], 'priority');
    }
    if ('description' in input) patch.description = nullableField(input.description, 'description');
    if ('assigned_to' in input) patch.assigned_to = nullableField(input.assigned_to, 'assigned_to');
    if ('due_date' in input) {
      patch.due_date = input.due_date === null ? null : isoDate(input.due_date, 'due_date');
    }

    if (Object.keys(patch).length === 0) throw new Error('name at least one field to change');

    const { data, error } = await ctx.admin
      .from('tasks')
      .update(patch)
      .eq('id', taskId)
      .select('id, title, status, priority, due_date')
      .maybeSingle();

    if (error) throw new Error(`could not update the task: ${error.message}`);
    if (!data) throw new Error('task not found');
    return { updated: data };
  },
};

export const setLeadStatus: AiTool = {
  name: 'set_lead_status',
  access: 'write',
  description:
    'Move a lead through the pipeline: new → contacted → converted, or closed if it went nowhere. Call this after a colleague tells you a lead has been contacted or converted. Leads are internal CRM state and no customer sees this.',
  inputSchema: {
    type: 'object',
    properties: {
      lead_id: { type: 'string', description: 'Lead id from list_leads.' },
      status: { type: 'string', enum: ['new', 'contacted', 'converted', 'closed'] },
    },
    required: ['lead_id', 'status'],
  },
  async run(input, ctx) {
    const leadId = str(input.lead_id);
    if (!leadId) throw new Error('lead_id is required');
    const status = oneOf(input.status, ['new', 'contacted', 'converted', 'closed'], 'status');

    const { data, error } = await ctx.admin
      .from('leads')
      .update({ status })
      .eq('id', leadId)
      .select('id, name, status')
      .maybeSingle();

    if (error) throw new Error(`could not update the lead: ${error.message}`);
    if (!data) throw new Error('lead not found');
    return { updated: data };
  },
};

export const createClient: AiTool = {
  name: 'create_client',
  access: 'write',
  description:
    'Create a client record — the usual next step when a lead converts. This is an internal record only: it creates no login and sends nothing to anyone. Check list_clients first so you do not create a duplicate.',
  inputSchema: {
    type: 'object',
    properties: {
      company_name: { type: 'string', description: 'The business name.' },
      contact_name: { type: 'string', description: 'The person to deal with. Required.' },
      email: { type: 'string', description: 'Contact email. Required.' },
      phone: { type: 'string' },
      city: { type: 'string' },
      kvk_number: { type: 'string' },
      notes: { type: 'string', description: 'Anything useful from the lead, in Dutch.' },
    },
    required: ['company_name', 'contact_name', 'email'],
  },
  async run(input, ctx) {
    const companyName = str(input.company_name);
    // All three are NOT NULL in the schema. Reject here with a message the
    // model can act on, rather than letting Postgres reject it opaquely.
    const contactName = str(input.contact_name);
    const email = str(input.email);
    if (!companyName || !contactName || !email) {
      throw new Error('company_name, contact_name and email are all required');
    }

    const { data, error } = await ctx.admin
      .from('clients')
      .insert({
        company_name: companyName,
        contact_name: contactName,
        email,
        phone: str(input.phone),
        city: str(input.city),
        kvk_number: str(input.kvk_number),
        notes: str(input.notes),
        status: 'pending',
        // Left unassigned on purpose: which colleague owns a client is a
        // people decision, not one an AI should make.
        assigned_employee_id: null,
      })
      .select('id, company_name')
      .single();

    if (error) throw new Error(`could not create the client: ${error.message}`);
    return {
      created: data,
      note: 'Client created with status "pending" and no assigned employee. A human should assign an owner.',
    };
  },
};

// ---------------------------------------------------------------------------
// PROPOSE — customer-visible
// ---------------------------------------------------------------------------

export const proposeCaseUpdate: AiTool = {
  name: 'propose_case_update',
  access: 'propose',
  description:
    "Propose changing a case's own fields — title, description, municipality, reference number, priority or deadline. This does NOT change anything: the customer sees all of these on their own case page, so a human approves first. Name only the fields that should change.",
  inputSchema: {
    type: 'object',
    properties: {
      case_id: { type: 'string' },
      title_summary: { type: 'string', description: 'Short Dutch summary for the review queue.' },
      rationale: { type: 'string', description: 'Why, grounded in the case or the rulebook.' },
      title: { type: 'string' },
      description: { type: 'string' },
      municipality: { type: 'string' },
      reference_number: { type: 'string', description: 'The municipality’s own reference.' },
      priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
      deadline: { type: 'string', description: 'YYYY-MM-DD.' },
    },
    required: ['case_id', 'title_summary', 'rationale'],
  },
  async run(input, ctx) {
    const caseId = str(input.case_id);
    const summary = str(input.title_summary);
    const rationale = str(input.rationale);
    if (!caseId || !summary || !rationale) {
      throw new Error('case_id, title_summary and rationale are required');
    }

    // Only the keys actually named. approveProposal keys off this too, so a
    // proposal about a deadline can never blank the municipality.
    //
    // Each value is validated HERE, not just at approval: a reviewer reads the
    // rendered diff and clicks approve, so anything that would be rejected or
    // silently reinterpreted later must be refused before a human is asked to
    // vouch for it.
    const payload: Record<string, string | null> = {};
    for (const key of ['title', 'description', 'municipality', 'reference_number'] as const) {
      if (key in input) payload[key] = nullableField(input[key], key);
    }
    if ('priority' in input) {
      payload.priority =
        input.priority === null
          ? null
          : oneOf(input.priority, ['low', 'normal', 'high', 'urgent'], 'priority');
    }
    if ('deadline' in input) {
      payload.deadline = input.deadline === null ? null : isoDate(input.deadline, 'deadline');
    }
    if (Object.keys(payload).length === 0) {
      throw new Error('name at least one case field to change');
    }

    const { data, error } = await ctx.admin
      .from('ai_proposals')
      .insert({
        ai_profile_id: ctx.aiProfileId,
        case_id: caseId,
        proposal_type: 'case_update',
        title: summary,
        payload: payload as never,
        rationale,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) throw new Error(`could not file the proposal: ${error.message}`);
    return {
      proposed: data,
      note: 'Filed as a PENDING proposal. The case is unchanged until a human approves it.',
    };
  },
};

export const proposeTaskUpdate: AiTool = {
  name: 'propose_task_update',
  access: 'propose',
  description:
    "Propose renaming a task or changing whether it is done. This does NOT change anything: the customer sees their case's task list, including each task's title and whether it is completed, so a human approves first. Use update_task for priority, dates and internal detail.",
  inputSchema: {
    type: 'object',
    properties: {
      task_id: { type: 'string', description: 'Task id from list_tasks.' },
      title_summary: { type: 'string', description: 'Short Dutch summary for the review queue.' },
      rationale: { type: 'string', description: 'Why, grounded in what the colleague told you.' },
      title: { type: 'string', description: 'New task title, in Dutch.' },
      status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
    },
    required: ['task_id', 'title_summary', 'rationale'],
  },
  async run(input, ctx) {
    const taskId = str(input.task_id);
    const summary = str(input.title_summary);
    const rationale = str(input.rationale);
    if (!taskId || !summary || !rationale) {
      throw new Error('task_id, title_summary and rationale are required');
    }

    // Resolve the task's case now, so the proposal lands on the right case in
    // the review queue and a reviewer can see which customer it touches.
    const { data: task, error: taskError } = await ctx.admin
      .from('tasks')
      .select('id, case_id, title, status')
      .eq('id', taskId)
      .maybeSingle();
    if (taskError) throw new Error(`could not read the task: ${taskError.message}`);
    if (!task) throw new Error('task not found');

    const payload: Record<string, string> = { task_id: taskId };
    if ('title' in input) {
      const title = str(input.title);
      if (!title) throw new Error('title must be text');
      payload.title = title;
    }
    if ('status' in input) {
      payload.status = oneOf(
        input.status,
        ['pending', 'in_progress', 'completed', 'cancelled'],
        'status',
      );
    }
    if (!payload.title && !payload.status) {
      throw new Error('name a new title, a new status, or both');
    }

    const { data, error } = await ctx.admin
      .from('ai_proposals')
      .insert({
        ai_profile_id: ctx.aiProfileId,
        case_id: (task as { case_id: string | null }).case_id,
        proposal_type: 'task_update',
        title: summary,
        payload: payload as never,
        rationale,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) throw new Error(`could not file the proposal: ${error.message}`);
    return {
      proposed: data,
      current: { title: (task as { title: string }).title, status: (task as { status: string | null }).status },
      note: 'Filed as a PENDING proposal. The task is unchanged until a human approves it.',
    };
  },
};

export const DASHBOARD_TOOLS: AiTool[] = [
  listClients,
  getClient,
  listDocuments,
  getOverview,
  updateTask,
  setLeadStatus,
  createClient,
  proposeCaseUpdate,
  proposeTaskUpdate,
];
