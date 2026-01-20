'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import { LanguageProvider } from '@/app/context/LanguageContext';
import { Sidebar } from '@/app/components/dashboard/Sidebar';
import { Spinner } from '@/app/components/ui/Spinner';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect when we're sure there's no user and loading is complete
    if (mounted && !isLoading && !user && !redirecting) {
      setRedirecting(true);
      router.push('/login');
    }
  }, [user, isLoading, router, mounted, redirecting]);

  // Don't render anything on server
  if (!mounted) {
    return null;
  }

  // Show loading while auth is being checked
  if (isLoading || redirecting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, show nothing (redirect will happen)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
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
