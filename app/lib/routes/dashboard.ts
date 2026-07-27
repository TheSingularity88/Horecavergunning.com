export type DashboardRole = 'employee' | 'client';

export const dashboardRoutes = {
  employee: {
    base: '/dashboard',
    clients: '/dashboard/clients',
    cases: '/dashboard/cases',
    requests: '/dashboard/requests',
    tasks: '/dashboard/tasks',
    aiReview: '/dashboard/ai-review',
    aiChat: '/dashboard/ai-chat',
    documents: '/dashboard/documents',
    leads: '/dashboard/leads',
    profile: '/dashboard/profile',
    admin: {
      users: '/dashboard/admin/users',
      permitTypes: '/dashboard/admin/permit-types',
      knowledgeBase: '/dashboard/admin/knowledge-base',
      ai: '/dashboard/admin/ai',
      /** AI usage/cost monitoring — distinct from `activity`, the general audit log. */
      aiActivity: '/dashboard/admin/ai/activity',
      settings: '/dashboard/admin/settings',
      activity: '/dashboard/admin/activity',
    },
  },
  client: {
    base: '/client',
    cases: '/client/cases',
    requests: '/client/requests',
    documents: '/client/documents',
    invoices: '/client/invoices',
    profile: '/client/profile',
  },
} as const;
