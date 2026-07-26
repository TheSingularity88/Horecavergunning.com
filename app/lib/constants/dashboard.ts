import type { translations } from '@/app/lib/translations';
import type {
  CaseStatus,
  CaseType,
  ClientStatus,
  TaskStatus,
  Priority,
} from '@/app/lib/types/database';

type DashboardTranslations = (typeof translations)['en']['dashboard'];

export type SelectOption<T extends string = string> = {
  value: T | '';
  label: string;
};

/**
 * Select option builders shared by eight dashboard pages.
 *
 * These used to carry their own hardcoded English label maps —
 * caseStatusLabels, taskStatusLabels, priorityLabels — so every status
 * dropdown in the dashboard read "Waiting for Government" whatever the
 * language, and those labels also disagreed with the badge rendered next to
 * them ("Review" here, "Final review" there). Only client status was ever
 * translated.
 *
 * Labels now come from dashboard.enums, the same map lib/dashboard-labels.ts
 * reads, so a dropdown and the badge beside it cannot say different things.
 *
 * ORDER stays here: it is presentation rather than translation, and the
 * sequence a status filter offers is a deliberate workflow order, not the
 * arbitrary key order of an object literal.
 */

const CASE_STATUS_ORDER: CaseStatus[] = [
  'intake',
  'in_progress',
  'waiting_client',
  'waiting_government',
  'review',
  'approved',
  'rejected',
  'completed',
  'cancelled',
];

/** The statuses that mean a case is still being worked on. */
const CASE_STATUS_LIVE: CaseStatus[] = [
  'intake',
  'in_progress',
  'waiting_client',
  'waiting_government',
  'review',
];

const CASE_TYPE_ORDER: CaseType[] = [
  'exploitatievergunning',
  'alcoholvergunning',
  'terrasvergunning',
  'bibob',
  'overname',
  'verbouwing',
  'other',
];

const TASK_STATUS_ORDER: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

const PRIORITY_ORDER: Priority[] = ['low', 'normal', 'high', 'urgent'];

const CLIENT_STATUS_ORDER: ClientStatus[] = ['active', 'inactive', 'pending'];

/** Look a value up in dashboard.enums, falling back to the de-underscored enum. */
function label(
  dashboard: DashboardTranslations | undefined,
  group: string,
  value: string
): string {
  const groups = dashboard?.enums as
    | Record<string, Record<string, string> | undefined>
    | undefined;
  return groups?.[group]?.[value] ?? value.replace(/_/g, ' ');
}

function build<T extends string>(
  dashboard: DashboardTranslations | undefined,
  group: string,
  order: readonly T[],
  includeAll: boolean,
  allLabel: string
): SelectOption<T>[] {
  const options = order.map((value) => ({
    value: value as T | '',
    label: label(dashboard, group, value),
  }));
  return includeAll ? [{ value: '', label: allLabel }, ...options] : options;
}

const allStatuses = (d?: DashboardTranslations) => d?.common?.allStatuses || 'All statuses';
const allTypes = (d?: DashboardTranslations) => d?.common?.allTypes || 'All types';

export const getCaseStatusOptions = (
  dashboard?: DashboardTranslations,
  includeAll = false,
  includeFinal = true
): SelectOption<CaseStatus>[] =>
  build(
    dashboard,
    'caseStatus',
    includeFinal ? CASE_STATUS_ORDER : CASE_STATUS_LIVE,
    includeAll,
    allStatuses(dashboard)
  );

export const getCaseTypeOptions = (
  dashboard?: DashboardTranslations,
  includeAll = false
): SelectOption<CaseType>[] =>
  build(dashboard, 'caseType', CASE_TYPE_ORDER, includeAll, allTypes(dashboard));

export const getTaskStatusOptions = (
  dashboard?: DashboardTranslations,
  includeAll = false
): SelectOption<TaskStatus>[] =>
  build(dashboard, 'taskStatus', TASK_STATUS_ORDER, includeAll, allStatuses(dashboard));

export const getClientStatusOptions = (
  dashboard?: DashboardTranslations,
  includeAll = false
): SelectOption<ClientStatus>[] =>
  build(dashboard, 'clientStatus', CLIENT_STATUS_ORDER, includeAll, allStatuses(dashboard));

export const getPriorityOptions = (
  dashboard?: DashboardTranslations
): SelectOption<Priority>[] => build(dashboard, 'priority', PRIORITY_ORDER, false, '');
