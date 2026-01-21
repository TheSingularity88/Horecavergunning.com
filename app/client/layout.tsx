'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import { LanguageProvider } from '@/app/context/LanguageContext';
import { ClientSidebar } from '@/app/components/client/ClientSidebar';
import { DashboardShell } from '@/app/components/dashboard/DashboardShell';
import { Spinner } from '@/app/components/ui/Spinner';

function ClientContent({ children }: { children: React.ReactNode }) {
  const { user, isClient, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in - redirect to login
        router.push('/login?redirect=/client');
      } else if (!isClient) {
        // Logged in but not a client - redirect to employee dashboard
        router.push('/dashboard');
      }
    }
  }, [user, isClient, isLoading, router]);

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user or not a client, show redirecting state
  if (!user || !isClient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell sidebar={<ClientSidebar />}>{children}</DashboardShell>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ClientContent>{children}</ClientContent>
      </AuthProvider>
    </LanguageProvider>
  );
}
