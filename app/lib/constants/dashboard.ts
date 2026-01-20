import type { translations } from '@/app/lib/translations';
import type {
  CaseStatus,
  CaseType,
  ClientStatus,
  TaskStatus,
  Priority,
} from '@/app/lib/types/database';

type DashboardTranslations = typeof translations['en']['dashboard'];

export type SelectOption<T extends string = string> = {
  value: T | '';
  label: string;
};

const caseStatusOrder: CaseStatus[] = [
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

const caseStatusLabels: Record<CaseStatus, string> = {
  intake: 'Intake',
  in_progress: 'In Progress',
  waiting_client: 'Waiting for Client',
  waiting_government: 'Waiting for Government',
  review: 'Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const caseTypeLabels: Record<CaseType, string> = {
  exploitatievergunning: 'Exploitatievergunning',
  alcoholvergunning: 'Alcoholvergunning',
  terrasvergunning: 'Terrasvergunning',
  bibob: 'Bibob',
  overname: 'Overname',
  verbouwing: 'Verbouwing',
  other: 'Other',
};

const taskStatusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

const toOptions = <T extends string>(
  labels: Record<T, string>
): SelectOption<T>[] => {
  const entries = Object.entries(labels) as Array<[T, string]>;
  return entries.map(([value, label]) => ({
    value,
    label,
  }));
};

export const getCaseStatusOptions = (
  dashboard?: DashboardTranslations,
  includeAll = false,
  includeFinal = true
): SelectOption<CaseStatus>[] => {
  const allowed = includeFinal
    ? caseStatusOrder
    : caseStatusOrder.filter((status) =>
        ['intake', 'in_progress', 'waiting_client', 'waiting_government', 'review'].includes(
          status
        )
      );
  const options = allowed.map((status) => ({
    value: status,
    label: caseStatusLabels[status],
  }));
  if (!includeAll) return options;

  return [
    {
      value: '',
      label: dashboard?.common?.allStatuses || 'All Statuses',
    },
    ...options,
  ];
};

export const getCaseTypeOptions = (
  dashboard?: DashboardTranslations,
  includeAll = false
): SelectOption<CaseType>[] => {
  const options = toOptions(caseTypeLabels);
  if (!includeAll) return options;

  return [
    {
      value: '',
      label: dashboard?.common?.allTypes || 'All Types',
    },
    ...options,
  ];
};

export const getTaskStatusOptions = (
  dashboard?: DashboardTranslations,
  includeAll = false
): SelectOption<TaskStatus>[] => {
  const options = toOptions(taskStatusLabels);
  if (!includeAll) return options;

  return [
    {
      value: '',
      label: dashboard?.common?.allStatuses || 'All Statuses',
    },
    ...options,
  ];
};

export const getClientStatusOptions = (
  dashboard?: DashboardTranslations,
  includeAll = false
): SelectOption<ClientStatus>[] => {
  const labels: Record<ClientStatus, string> = {
    active: dashboard?.clients?.statusActive || 'Active',
    inactive: dashboard?.clients?.statusInactive || 'Inactive',
    pending: dashboard?.clients?.statusPending || 'Pending',
  };
  const options = toOptions(labels);
  if (!includeAll) return options;

  return [
    {
      value: '',
      label: dashboard?.common?.allStatuses || 'All Statuses',
    },
    ...options,
  ];
};

export const getPriorityOptions = (): SelectOption<Priority>[] =>
  toOptions(priorityLabels);
