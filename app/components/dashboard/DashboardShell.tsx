'use client';

import React from 'react';

interface DashboardShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({ sidebar, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebar}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
