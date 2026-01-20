'use client';

import React from 'react';
import { Header } from '@/app/components/dashboard/Header';
import { cn } from '@/app/lib/utils/cn';

interface DashboardPageProps {
  title?: string;
  children: React.ReactNode;
  header?: React.ReactNode;
  contentClassName?: string;
}

export function DashboardPage({
  title,
  children,
  header,
  contentClassName,
}: DashboardPageProps) {
  return (
    <div className="flex flex-col h-screen">
      {header ?? <Header title={title} />}
      <div className={cn('flex-1 overflow-y-auto p-4 lg:p-6', contentClassName)}>
        {children}
      </div>
    </div>
  );
}
