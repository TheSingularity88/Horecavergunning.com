'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import { LanguageProvider, useLanguage } from '@/app/context/LanguageContext';
import { Sidebar } from '@/app/components/dashboard/Sidebar';
import { DashboardShell } from '@/app/components/dashboard/DashboardShell';
import { Spinner } from '@/app/components/ui/Spinner';
import { ToastProvider } from '@/app/components/ui/Toast';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isClient } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const shouldRedirectToLogin = !isLoading && !user;
  const shouldRedirectToClient = !isLoading && user && isClient;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.push('/login');
    } else if (shouldRedirectToClient) {
      // Client users should not access employee dashboard
      router.push('/client');
    }
  }, [router, shouldRedirectToLogin, shouldRedirectToClient]);

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-600">{t.dashboard?.common?.loading || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // If no user after loading or user is a client, show redirecting state
  if (shouldRedirectToLogin || shouldRedirectToClient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-600">{t.dashboard?.common?.redirecting || 'Redirecting...'}</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider dismissLabel={t.dashboard?.common?.close || 'Close'}>
      <DashboardShell sidebar={<Sidebar />}>{children}</DashboardShell>
    </ToastProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DashboardContent>{children}</DashboardContent>
      </AuthProvider>
    </LanguageProvider>
  );
}
