import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: React.ReactNode;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  iconColor = 'bg-amber-100 text-amber-600',
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {change && (
            <div className="mt-2 flex items-center gap-1">
              {change.type === 'increase' ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {change.value}%
              </span>
              <span className="text-sm text-slate-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', iconColor)}>{icon}</div>
      </div>
    </div>
  );
}
