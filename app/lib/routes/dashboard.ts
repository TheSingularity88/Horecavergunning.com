export type DashboardRole = 'employee' | 'client';

export const dashboardRoutes = {
  employee: {
    base: '/dashboard',
    clients: '/dashboard/clients',
    cases: '/dashboard/cases',
    requests: '/dashboard/requests',
    tasks: '/dashboard/tasks',
    documents: '/dashboard/documents',
    profile: '/dashboard/profile',
    admin: {
      users: '/dashboard/admin/users',
      settings: '/dashboard/admin/settings',
      activity: '/dashboard/admin/activity',
    },
  },
  client: {
    base: '/client',
    cases: '/client/cases',
    requests: '/client/requests',
    documents: '/client/documents',
    profile: '/client/profile',
  },
} as const;
