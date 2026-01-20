import React from 'react';
import { cn } from '@/app/lib/utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Utility function to get badge variant based on status
export function getStatusBadgeVariant(
  status: string
): BadgeVariant {
  const statusMap: Record<string, BadgeVariant> = {
    // Case statuses
    intake: 'default',
    in_progress: 'info',
    waiting_client: 'warning',
    waiting_government: 'warning',
    review: 'info',
    approved: 'success',
    rejected: 'error',
    completed: 'success',
    cancelled: 'default',
    // Task statuses
    pending: 'default',
    // in_progress already defined
    // completed already defined
    // cancelled already defined
    // Client statuses
    active: 'success',
    inactive: 'default',
    // pending already defined
    // Priority
    low: 'default',
    normal: 'info',
    high: 'warning',
    urgent: 'error',
  };

  return statusMap[status] || 'default';
}
