import { z } from 'zod';

/**
 * The "bible": the machine-readable rulebook the analysis produces from the
 * confidential source documents, and the contract every case-assessing AI
 * consumes later.
 *
 * Design rules:
 *
 *  - STABLE IDS. Ruleset/criterion/threshold ids are slugs the prompt asks the
 *    model to keep stable across versions, so the version diff view can key on
 *    them instead of text comparison.
 *  - PROVENANCE EVERYWHERE. Every criterion and threshold names the source
 *    document (by filename) and quotes or cites where it came from, so a human
 *    reviewing a draft can spot-check claims against the originals.
 *  - MACHINE-USABLE WHERE IT COUNTS. severity/comparator/answer_type are
 *    enums a program can branch on; the assessment guidance itself stays Dutch
 *    prose, because that is what a case-assessment prompt needs.
 *  - STRUCTURED-OUTPUTS COMPATIBLE. No recursion, strict objects, no numeric
 *    bounds — the schema is sent to the provider as the response format.
 *
 * This module must stay importable from client components (the version viewer
 * renders typed rules), so no 'server-only'.
 */

const legalBasis = z.strictObject({
  law: z.string(),
  article: z.string(),
});

const sourceRef = z.strictObject({
  /** Filename of the source document the fact came from. */
  document: z.string(),
  /** Short verbatim quote or cell/section reference backing the fact. */
  reference: z.string(),
});

const checklistItem = z.strictObject({
  id: z.string(),
  label_nl: z.string(),
  required: z.boolean(),
  /** Maps onto documents.category where possible. */
  document_category: z.enum([
    'contract',
    'permit',
    'identification',
    'financial',
    'correspondence',
    'bibob',
    'general',
  ]),
  /** How this item can be verified. */
  verification: z.enum(['presence', 'content', 'external']),
  notes_nl: z.string().nullable(),
});

const criterion = z.strictObject({
  id: z.string(),
  question_nl: z.string(),
  answer_type: z.enum(['boolean', 'enum', 'number', 'text']),
  enum_values: z.array(z.string()).nullable(),
  severity: z.enum(['blocking', 'advisory']),
  assessment: z.strictObject({
    pass_if_nl: z.string(),
    fail_if_nl: z.string(),
    escalate_if_nl: z.string().nullable(),
  }),
  source: sourceRef,
});

const threshold = z.strictObject({
  id: z.string(),
  name_nl: z.string(),
  value: z.number(),
  unit: z.string(),
  comparator: z.enum(['>', '>=', '<', '<=', '==']),
  action_if_met_nl: z.string(),
  source: sourceRef,
});

const routingRule = z.strictObject({
  trigger_nl: z.string(),
  action_nl: z.string(),
  recipient: z.string(),
});

const procedure = z.strictObject({
  id: z.string(),
  name_nl: z.string(),
  steps_nl: z.array(z.string()),
});

const ruleset = z.strictObject({
  id: z.string(),
  title_nl: z.string(),
  applies_to: z.strictObject({
    case_types: z.array(
      z.enum([
        'exploitatievergunning',
        'alcoholvergunning',
        'terrasvergunning',
        'bibob',
        'overname',
        'verbouwing',
        'other',
      ]),
    ),
    scenario: z.enum(['new', 'renewal', 'transfer', 'any']),
  }),
  legal_basis: z.array(legalBasis),
  checklist: z.array(checklistItem),
  criteria: z.array(criterion),
  thresholds: z.array(threshold),
  routing: z.array(routingRule),
  procedures: z.array(procedure),
});

export const bibleSchema = z.strictObject({
  schema_version: z.literal('1'),
  rulesets: z.array(ruleset),
  glossary: z.array(
    z.strictObject({
      term: z.string(),
      definition_nl: z.string(),
    }),
  ),
  /**
   * The model's own uncertainties — contradictions between documents, rules it
   * could not ground in a source, ambiguities a human should resolve. Surfaced
   * prominently on the review screen; an honest "I am not sure about X" beats
   * a confidently wrong rule.
   */
  open_questions: z.array(z.string()),
});

export type BibleRules = z.infer<typeof bibleSchema>;
export type BibleRuleset = z.infer<typeof ruleset>;

export const rulesetSchema = ruleset;

/** JSON Schema form, sent to the provider as the required response format. */
export function bibleJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(bibleSchema) as Record<string, unknown>;
}

/**
 * One ruleset at a time.
 *
 * The whole-bible schema is rejected by Anthropic's structured outputs with
 * "the compiled grammar is too large" — rulesets[] nests five more arrays of
 * strict objects inside it, and the grammar compiler multiplies that out. A
 * single ruleset is a fraction of the size and compiles fine, so the analysis
 * asks for one ruleset per call and assembles the bible here.
 */
export function rulesetJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(ruleset) as Record<string, unknown>;
}

/** The small planning call: which rulesets should exist for this corpus. */
export const rulesetPlanSchema = z.strictObject({
  rulesets: z.array(
    z.strictObject({
      id: z.string(),
      title_nl: z.string(),
      scope_nl: z.string(),
    }),
  ),
});

export function rulesetPlanJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(rulesetPlanSchema) as Record<string, unknown>;
}

/** The closing call: glossary + the model's own open questions. */
export const bibleTailSchema = z.strictObject({
  glossary: z.array(z.strictObject({ term: z.string(), definition_nl: z.string() })),
  open_questions: z.array(z.string()),
});

export function bibleTailJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(bibleTailSchema) as Record<string, unknown>;
}
