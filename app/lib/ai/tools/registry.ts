import 'server-only';

import { createAdminClient } from '@/app/lib/supabase/admin';
import type { AiToolDefinition } from '@/app/lib/ai/provider';

/**
 * What an AI employee can do at the dashboard.
 *
 * The whole design rests on one line: `access`. It is not documentation — the
 * executor reads it, the audit trail records it, and the chat prompt is built
 * from it. Three tiers, decided by the owner:
 *
 *   'read'     — look at internal data. Free.
 *   'write'    — reversible internal work a colleague does without asking:
 *                create a task, tick a checklist item. Attributed to the AI,
 *                visible in the activity log, undoable by hand.
 *   'propose'  — anything customer-visible or consequential. Produces a
 *                PENDING PROPOSAL, never a change. A human approves it in the
 *                review queue, exactly as before.
 *
 * The dividing line is "can a customer see it, or is it hard to undo". A task
 * is neither. A status change emails the client, so it is.
 *
 * NOTHING here can email, message, or otherwise reach a customer. There is no
 * such tool, which is a stronger guarantee than a rule saying not to.
 */

export type ToolAccess = 'read' | 'write' | 'propose';

export interface ToolContext {
  admin: ReturnType<typeof createAdminClient>;
  /** The AI employee acting. Every write is attributed to it. */
  aiProfileId: string;
  /** The staff member whose chat triggered this. Co-attributed. */
  staffId: string;
}

export interface AiTool {
  name: string;
  access: ToolAccess;
  description: string;
  inputSchema: Record<string, unknown>;
  run(input: Record<string, unknown>, ctx: ToolContext): Promise<unknown>;
}

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : null;

/** Rows are capped so one tool call cannot flood the context window. */
const LIMIT = 25;

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------

const listLeads: AiTool = {
  name: 'list_leads',
  access: 'read',
  description:
    'List incoming leads (contact form submissions) with their status. Call this when the colleague asks about leads, new enquiries, or who has gotten in touch — including when they name a person ("the lead from Lucy").',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['new', 'contacted', 'converted', 'closed'],
        description: 'Only leads with this status. Omit for all.',
      },
      search: {
        type: 'string',
        description: 'Match on name, email or company name. Use when a person is named.',
      },
    },
  },
  async run(input, ctx) {
    let query = ctx.admin
      .from('leads')
      .select('id, source, name, email, phone, company_name, message, status, locale, created_at')
      .order('created_at', { ascending: false })
      .limit(LIMIT);

    const status = str(input.status);
    if (status) query = query.eq('status', status);
    const search = str(input.search);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw new Error(`could not read leads: ${error.message}`);
    return { leads: data ?? [] };
  },
};

const listCases: AiTool = {
  name: 'list_cases',
  access: 'read',
  description:
    'List cases (dossiers) with status, type and municipality. Call this when asked what is open, what needs attention, or to find a case by name.',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: [
          'intake', 'in_progress', 'waiting_client', 'waiting_government',
          'review', 'approved', 'rejected', 'completed', 'cancelled',
        ],
        description: 'Filter by case status.',
      },
      search: { type: 'string', description: 'Match on the case title.' },
    },
  },
  async run(input, ctx) {
    let query = ctx.admin
      .from('cases')
      .select('id, title, case_type, status, priority, municipality, deadline, created_at')
      .order('created_at', { ascending: false })
      .limit(LIMIT);

    const status = str(input.status);
    if (status) query = query.eq('status', status);
    const search = str(input.search);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error } = await query;
    if (error) throw new Error(`could not read cases: ${error.message}`);
    return { cases: data ?? [] };
  },
};

const getCase: AiTool = {
  name: 'get_case',
  access: 'read',
  description:
    'Full detail for one case: its fields, document checklist, and uploaded document names. Call this before advising on a specific case — list_cases alone does not show the checklist.',
  inputSchema: {
    type: 'object',
    properties: { case_id: { type: 'string', description: 'The case id from list_cases.' } },
    required: ['case_id'],
  },
  async run(input, ctx) {
    const caseId = str(input.case_id);
    if (!caseId) throw new Error('case_id is required');

    const [{ data: row }, { data: checklist }, { data: documents }] = await Promise.all([
      ctx.admin
        .from('cases')
        .select('id, title, case_type, status, priority, municipality, description, deadline, reference_number')
        .eq('id', caseId)
        .maybeSingle(),
      ctx.admin
        .from('case_documents')
        .select('id, name, status, review_note')
        .eq('case_id', caseId)
        .order('sort_order'),
      // Names and categories only — file CONTENTS are never sent.
      ctx.admin.from('documents').select('name, category').eq('case_id', caseId),
    ]);

    if (!row) throw new Error('case not found');
    return { case: row, checklist: checklist ?? [], documents: documents ?? [] };
  },
};

const listTasks: AiTool = {
  name: 'list_tasks',
  access: 'read',
  description:
    'List tasks, newest first. Call this when asked what is outstanding, or before creating a task, to avoid duplicating one that already exists.',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        description: 'Filter by task status.',
      },
      case_id: { type: 'string', description: 'Only tasks on this case.' },
    },
  },
  async run(input, ctx) {
    let query = ctx.admin
      .from('tasks')
      .select('id, title, status, priority, due_date, case_id, created_at')
      .order('created_at', { ascending: false })
      .limit(LIMIT);

    const status = str(input.status);
    if (status) query = query.eq('status', status);
    const caseId = str(input.case_id);
    if (caseId) query = query.eq('case_id', caseId);

    const { data, error } = await query;
    if (error) throw new Error(`could not read tasks: ${error.message}`);
    return { tasks: data ?? [] };
  },
};

const listRequests: AiTool = {
  name: 'list_client_requests',
  access: 'read',
  description:
    'List requests submitted by existing clients through the portal, with their review status. Call this when asked what clients have asked for or what is awaiting review.',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'reviewing', 'approved', 'converted', 'rejected'],
        description: 'Filter by request status.',
      },
    },
  },
  async run(input, ctx) {
    let query = ctx.admin
      .from('client_requests')
      .select('id, request_type, description, status, created_at, converted_to_case_id')
      .order('created_at', { ascending: false })
      .limit(LIMIT);

    const status = str(input.status);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new Error(`could not read client requests: ${error.message}`);
    return { requests: data ?? [] };
  },
};

// ---------------------------------------------------------------------------
// WRITE — internal, reversible, no customer contact
// ---------------------------------------------------------------------------

const createTask: AiTool = {
  name: 'create_task',
  access: 'write',
  description:
    'Create an internal task for the team. Call this when the colleague asks for follow-up work to be recorded, or when handling something produces obvious next steps. The task is visible to everyone and can be edited or deleted by hand. It is never assigned to an AI.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Short imperative title, in Dutch.' },
      description: { type: 'string', description: 'What needs doing and why.' },
      case_id: { type: 'string', description: 'Link to this case when relevant.' },
      priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
      due_date: { type: 'string', description: 'YYYY-MM-DD, when there is a deadline.' },
    },
    required: ['title'],
  },
  async run(input, ctx) {
    const title = str(input.title);
    if (!title) throw new Error('title is required');

    const { data, error } = await ctx.admin
      .from('tasks')
      .insert({
        title,
        description: str(input.description),
        case_id: str(input.case_id),
        priority: str(input.priority) ?? 'normal',
        due_date: str(input.due_date),
        status: 'pending',
        // Deliberately unassigned: migration 016 forbids assigning a task to an
        // AI, and picking a human for them is the team's call, not the AI's.
        assigned_to: null,
        created_by: ctx.aiProfileId,
      })
      .select('id, title')
      .single();

    if (error) throw new Error(`could not create the task: ${error.message}`);
    return { created: data, note: 'Task created, unassigned. A human should pick it up.' };
  },
};

const updateChecklistItem: AiTool = {
  name: 'update_checklist_item',
  access: 'write',
  description:
    'Set the status of one document-checklist item on a case (pending, uploaded, in_review, approved or rejected), with a short Dutch note. Call this when the colleague confirms what has or has not been received. Use get_case first to get the item id.',
  inputSchema: {
    type: 'object',
    properties: {
      case_document_id: { type: 'string', description: 'Checklist item id from get_case.' },
      status: {
        type: 'string',
        enum: ['pending', 'uploaded', 'in_review', 'approved', 'rejected'],
      },
      note: { type: 'string', description: 'One line in Dutch explaining the change.' },
    },
    required: ['case_document_id', 'status'],
  },
  async run(input, ctx) {
    const id = str(input.case_document_id);
    const status = str(input.status);
    if (!id || !status) throw new Error('case_document_id and status are required');

    const { data, error } = await ctx.admin
      .from('case_documents')
      .update({
        status,
        review_note: str(input.note),
        reviewed_by: ctx.staffId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, status')
      .maybeSingle();

    if (error) throw new Error(`could not update the checklist: ${error.message}`);
    if (!data) throw new Error('checklist item not found');
    return { updated: data };
  },
};

// ---------------------------------------------------------------------------
// PROPOSE — customer-visible or consequential; a human approves
// ---------------------------------------------------------------------------

const proposeCaseAction: AiTool = {
  name: 'propose_case_action',
  access: 'propose',
  description:
    'Propose something that reaches the customer or changes the case itself: a status change, or a draft reply. This does NOT perform the action — it files a proposal in the review queue for a human to approve or reject. Call this instead of claiming you changed a case or contacted anyone. You cannot email or message customers under any circumstances.',
  inputSchema: {
    type: 'object',
    properties: {
      case_id: { type: 'string', description: 'The case this concerns.' },
      kind: {
        type: 'string',
        enum: ['status_change', 'draft_reply'],
        description: 'status_change moves the case; draft_reply writes text a human may send.',
      },
      title: { type: 'string', description: 'Short Dutch summary shown in the review queue.' },
      rationale: { type: 'string', description: 'Why, grounded in the rulebook or the case.' },
      to_status: {
        type: 'string',
        enum: [
          'intake', 'in_progress', 'waiting_client', 'waiting_government',
          'review', 'approved', 'rejected', 'completed', 'cancelled',
        ],
        description: 'For status_change: the new case status.',
      },
      reply_nl: { type: 'string', description: 'For draft_reply: the full Dutch draft.' },
    },
    required: ['case_id', 'kind', 'title', 'rationale'],
  },
  async run(input, ctx) {
    const caseId = str(input.case_id);
    const kind = str(input.kind);
    const title = str(input.title);
    const rationale = str(input.rationale);
    if (!caseId || !kind || !title || !rationale) {
      throw new Error('case_id, kind, title and rationale are required');
    }

    const payload =
      kind === 'status_change'
        ? { to_status: str(input.to_status), reason_nl: rationale }
        : { subject_nl: title, body_nl: str(input.reply_nl) ?? '', channel: 'email' as const };

    if (kind === 'status_change' && !str(input.to_status)) {
      throw new Error('to_status is required for a status_change proposal');
    }
    if (kind === 'draft_reply' && !str(input.reply_nl)) {
      throw new Error('reply_nl is required for a draft_reply proposal');
    }

    const { data, error } = await ctx.admin
      .from('ai_proposals')
      .insert({
        ai_profile_id: ctx.aiProfileId,
        case_id: caseId,
        proposal_type: kind,
        title,
        payload,
        rationale,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) throw new Error(`could not file the proposal: ${error.message}`);
    return {
      proposed: data,
      note: 'Filed as a PENDING proposal. Nothing has changed and no one has been contacted; a human must approve it in the review queue.',
    };
  },
};

export const AI_TOOLS: AiTool[] = [
  listLeads,
  listCases,
  getCase,
  listTasks,
  listRequests,
  createTask,
  updateChecklistItem,
  proposeCaseAction,
];

export const toolByName = new Map(AI_TOOLS.map((tool) => [tool.name, tool]));

export function toolDefinitions(): AiToolDefinition[] {
  return AI_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}
