import type { translations } from '@/app/lib/translations';

type T = (typeof translations)['nl'];

/**
 * Readable labels for the staff dashboard.
 *
 * The dashboard printed raw database enums everywhere — `waiting_government`,
 * `in_progress`, `client_requests` — which is the same defect already fixed
 * twice in the client portal. Rather than a helper per page (which is exactly
 * how the portal's versions drifted apart), every enum resolves through one
 * generic lookup against a single translations section.
 *
 * Every label falls back to the de-underscored raw value, so a status added to
 * the database later degrades to something readable instead of blank.
 */

type EnumGroup =
  | 'caseType'
  | 'caseStatus'
  | 'taskStatus'
  | 'priority'
  | 'clientStatus'
  | 'requestStatus'
  | 'urgency'
  | 'leadStatus'
  | 'leadSource'
  | 'role'
  | 'docCategory'
  | 'entityType';

/**
 * `value` is typed loosely on purpose: it comes from the database, and the
 * point of the fallback is to survive a value TypeScript does not know about.
 */
export function enumLabel(group: EnumGroup, value: string | null | undefined, t: T): string {
  if (!value) return '—';
  const groups = t.dashboard?.enums as
    | Record<string, Record<string, string> | undefined>
    | undefined;
  return groups?.[group]?.[value] ?? value.replace(/_/g, ' ');
}

/** Convenience wrappers — these read better at the call site than enumLabel('caseStatus', …). */
export const caseTypeLabel = (v: string | null | undefined, t: T) => enumLabel('caseType', v, t);
export const caseStatusLabel = (v: string | null | undefined, t: T) => enumLabel('caseStatus', v, t);
export const taskStatusLabel = (v: string | null | undefined, t: T) => enumLabel('taskStatus', v, t);
export const priorityLabel = (v: string | null | undefined, t: T) => enumLabel('priority', v, t);
export const clientStatusLabel = (v: string | null | undefined, t: T) =>
  enumLabel('clientStatus', v, t);
export const requestStatusLabel = (v: string | null | undefined, t: T) =>
  enumLabel('requestStatus', v, t);
export const urgencyLabel = (v: string | null | undefined, t: T) => enumLabel('urgency', v, t);
export const leadStatusLabel = (v: string | null | undefined, t: T) =>
  enumLabel('leadStatus', v, t);
export const leadSourceLabel = (v: string | null | undefined, t: T) =>
  enumLabel('leadSource', v, t);
export const roleLabel = (v: string | null | undefined, t: T) => enumLabel('role', v, t);
export const docCategoryLabel = (v: string | null | undefined, t: T) =>
  enumLabel('docCategory', v, t);
export const entityTypeLabel = (v: string | null | undefined, t: T) =>
  enumLabel('entityType', v, t);

/**
 * Build the {value,label} option list a <Select> needs, in the order given.
 *
 * Filter dropdowns were the last place English survived the portal cleanup,
 * because their options lived in module-level constants outside the component
 * where `t` is not in scope. Passing the order and resolving labels here keeps
 * that from happening again.
 */
export function enumOptions(
  group: EnumGroup,
  order: readonly string[],
  t: T,
  allLabel?: string,
): { value: string; label: string }[] {
  const options = order.map((value) => ({ value, label: enumLabel(group, value, t) }));
  return allLabel ? [{ value: '', label: allLabel }, ...options] : options;
}
