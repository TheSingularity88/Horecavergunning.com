'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FolderOpen,
  CheckSquare,
  Clock,
  ArrowRight,
  Calendar,
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
import type { Case, Task } from '@/app/lib/types/database';

interface DashboardStats {
  totalClients: number;
  activeCases: number;
  pendingTasks: number;
  upcomingDeadlines: number;
}

export default function EmployeeDashboardPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeCases: 0,
    pendingTasks: 0,
    upcomingDeadlines: 0,
  });
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const [clientsRes, casesRes, tasksRes] = await Promise.all([
          supabase.from('clients').select('id', { count: 'exact', head: true }),
          supabase
            .from('cases')
            .select('id', { count: 'exact', head: true })
            .not('status', 'in', '("completed","cancelled")'),
          supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
        ]);

        // Fetch upcoming deadlines (cases with deadline in next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const deadlinesRes = await supabase
          .from('cases')
          .select('id', { count: 'exact', head: true })
          .lte('deadline', nextWeek.toISOString())
          .gte('deadline', new Date().toISOString())
          .not('status', 'in', '("completed","cancelled")');

        setStats({
          totalClients: clientsRes.count || 0,
          activeCases: casesRes.count || 0,
          pendingTasks: tasksRes.count || 0,
          upcomingDeadlines: deadlinesRes.count || 0,
        });

        // Fetch recent cases
        const { data: cases } = await supabase
          .from('cases')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentCases(cases || []);

        // Fetch upcoming tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('status', 'pending')
          .order('due_date', { ascending: true })
          .limit(5);
        setUpcomingTasks(tasks || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase]);

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

  return (
    <DashboardPage>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-slate-900">
          {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-slate-600 mt-1">
          {t.dashboard?.subtitle || "Here's what's happening with your cases today."}
        </p>
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
              title={t.dashboard?.stats?.totalClients || 'Total Clients'}
              value={stats.totalClients}
              icon={<Users className="w-5 h-5" />}
              iconColor="bg-blue-100 text-blue-600"
            />
            <StatsCard
              title={t.dashboard?.stats?.activeCases || 'Active Cases'}
              value={stats.activeCases}
              icon={<FolderOpen className="w-5 h-5" />}
              iconColor="bg-amber-100 text-amber-600"
            />
            <StatsCard
              title={t.dashboard?.stats?.pendingTasks || 'Pending Tasks'}
              value={stats.pendingTasks}
              icon={<CheckSquare className="w-5 h-5" />}
              iconColor="bg-green-100 text-green-600"
            />
            <StatsCard
              title={t.dashboard?.stats?.upcomingDeadlines || 'Upcoming Deadlines'}
              value={stats.upcomingDeadlines}
              icon={<Clock className="w-5 h-5" />}
              iconColor="bg-red-100 text-red-600"
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
                    {t.dashboard?.recentCases || 'Recent Cases'}
                  </CardTitle>
                  <Link
                    href="/dashboard/cases"
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                  >
                    {t.dashboard?.common?.viewAll || 'View all'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentCases.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">
                      {t.dashboard?.common?.noData || 'No cases yet'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentCases.map((caseItem) => (
                        <Link
                          key={caseItem.id}
                          href={`/dashboard/cases/${caseItem.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">
                              {caseItem.title}
                            </p>
                            <p className="text-sm text-slate-500">
                              {caseItem.case_type}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                            {caseItem.status.replace('_', ' ')}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {t.dashboard?.upcomingTasks || 'Upcoming Tasks'}
                  </CardTitle>
                  <Link
                    href="/dashboard/tasks"
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                  >
                    {t.dashboard?.common?.viewAll || 'View all'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {upcomingTasks.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">
                      {t.dashboard?.common?.noTasks || 'No pending tasks'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingTasks.map((task) => (
                        <Link
                          key={task.id}
                          href={`/dashboard/tasks/${task.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">
                              {task.title}
                            </p>
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-sm text-slate-500">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(task.due_date)}
                              </div>
                            )}
                          </div>
                          <Badge variant={getStatusBadgeVariant(task.priority)}>
                            {task.priority}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </DashboardPage>
  );
}
