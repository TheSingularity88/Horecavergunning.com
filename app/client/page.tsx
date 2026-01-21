'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  FileText,
  Clock,
  ArrowRight,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { StatsCard } from '@/app/components/dashboard/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/app/components/ui/Badge';
import { Spinner } from '@/app/components/ui/Spinner';
import Link from 'next/link';
import { dashboardRoutes } from '@/app/lib/routes/dashboard';
import type { Case, ClientRequest } from '@/app/lib/types/database';

interface ClientStats {
  activeCases: number;
  completedCases: number;
  totalDocuments: number;
  pendingRequests: number;
}

export default function ClientDashboardPage() {
  const { clientData } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<ClientStats>({
    activeCases: 0,
    completedCases: 0,
    totalDocuments: 0,
    pendingRequests: 0,
  });
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [recentRequests, setRecentRequests] = useState<ClientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!clientData?.id) return;

      try {
        // Fetch stats
        const [activeCasesRes, completedCasesRes, documentsRes, requestsRes] = await Promise.all([
          supabase
            .from('cases')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientData.id)
            .not('status', 'in', '("completed","cancelled","rejected")'),
          supabase
            .from('cases')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientData.id)
            .eq('status', 'completed'),
          supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientData.id),
          supabase
            .from('client_requests')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientData.id)
            .eq('status', 'pending'),
        ]);

        setStats({
          activeCases: activeCasesRes.count || 0,
          completedCases: completedCasesRes.count || 0,
          totalDocuments: documentsRes.count || 0,
          pendingRequests: requestsRes.count || 0,
        });

        // Fetch recent cases
        const { data: cases } = await supabase
          .from('cases')
          .select('*')
          .eq('client_id', clientData.id)
          .order('updated_at', { ascending: false })
          .limit(5);
        setRecentCases((cases as Case[]) || []);

        // Fetch recent requests
        const { data: requests } = await supabase
          .from('client_requests')
          .select('*')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentRequests((requests as ClientRequest[]) || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, clientData?.id]);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.dashboard?.greeting?.morning || 'Good morning';
    if (hour < 18) return t.dashboard?.greeting?.afternoon || 'Good afternoon';
    return t.dashboard?.greeting?.evening || 'Good evening';
  };

  const getRequestStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewing':
        return 'info';
      case 'approved':
      case 'converted':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <DashboardPage>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-slate-900">
          {getGreeting()}, {clientData?.contact_name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-slate-600 mt-1">
          {t.clientPortal?.dashboard?.subtitle || "Here's the status of your permit applications."}
        </p>
        {clientData?.company_name && (
          <p className="text-sm text-slate-500 mt-1">{clientData.company_name}</p>
        )}
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            <StatsCard
              title={t.clientPortal?.dashboard?.activeCases || 'Active Cases'}
              value={stats.activeCases}
              icon={<FolderOpen className="w-5 h-5" />}
              iconColor="bg-amber-100 text-amber-600"
            />
            <StatsCard
              title={t.clientPortal?.dashboard?.completedCases || 'Completed'}
              value={stats.completedCases}
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconColor="bg-green-100 text-green-600"
            />
            <StatsCard
              title={t.clientPortal?.dashboard?.documents || 'Documents'}
              value={stats.totalDocuments}
              icon={<FileText className="w-5 h-5" />}
              iconColor="bg-blue-100 text-blue-600"
            />
            <StatsCard
              title={t.clientPortal?.dashboard?.pendingRequests || 'Pending Requests'}
              value={stats.pendingRequests}
              icon={<Clock className="w-5 h-5" />}
              iconColor="bg-purple-100 text-purple-600"
            />
          </motion.div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Cases */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {t.clientPortal?.dashboard?.recentCases || 'My Cases'}
                  </CardTitle>
                  <Link
                    href={dashboardRoutes.client.cases}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                  >
                    {t.dashboard?.common?.viewAll || 'View all'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentCases.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">
                      {t.clientPortal?.dashboard?.noCases || 'No cases yet'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentCases.map((caseItem) => (
                        <Link
                          key={caseItem.id}
                          href={`${dashboardRoutes.client.cases}/${caseItem.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">
                              {caseItem.title}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span>{caseItem.case_type.replace(/_/g, ' ')}</span>
                              {caseItem.deadline && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(caseItem.deadline)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                            {caseItem.status.replace(/_/g, ' ')}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {t.clientPortal?.dashboard?.recentRequests || 'My Requests'}
                  </CardTitle>
                  <Link
                    href={dashboardRoutes.client.requests}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                  >
                    {t.dashboard?.common?.viewAll || 'View all'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentRequests.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-slate-500 text-sm mb-3">
                        {t.clientPortal?.dashboard?.noRequests || 'No requests yet'}
                      </p>
                      <Link
                        href={`${dashboardRoutes.client.requests}/new`}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        {t.clientPortal?.requests?.submitNew || 'Submit a new request'}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">
                              {request.title}
                            </p>
                            <p className="text-sm text-slate-500">
                              {request.request_type.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <Badge variant={getRequestStatusVariant(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {t.clientPortal?.dashboard?.quickActions || 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link
                    href={`${dashboardRoutes.client.requests}/new`}
                    className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-amber-100">
                      <FolderOpen className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {t.clientPortal?.actions?.newRequest || 'New Permit Request'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {t.clientPortal?.actions?.newRequestDesc || 'Start a new application'}
                      </p>
                    </div>
                  </Link>
                  <Link
                    href={dashboardRoutes.client.documents}
                    className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-blue-100">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {t.clientPortal?.actions?.uploadDocument || 'Upload Document'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {t.clientPortal?.actions?.uploadDocumentDesc || 'Add required files'}
                      </p>
                    </div>
                  </Link>
                  <Link
                    href={dashboardRoutes.client.profile}
                    className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-green-100">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {t.clientPortal?.actions?.updateProfile || 'Update Profile'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {t.clientPortal?.actions?.updateProfileDesc || 'Edit contact info'}
                      </p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </DashboardPage>
  );
}
