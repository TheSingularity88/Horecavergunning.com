'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, User, FolderOpen, CheckSquare, FileText, Users } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { Header } from '@/app/components/dashboard/Header';
import { Card } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Badge } from '@/app/components/ui/Badge';
import { Avatar } from '@/app/components/ui/Avatar';
import { Spinner } from '@/app/components/ui/Spinner';
import { Pagination } from '@/app/components/ui/Table';
import type { ActivityLog, Profile } from '@/app/lib/types/database';

const ITEMS_PER_PAGE = 20;

interface ActivityWithUser extends ActivityLog {
  user?: Profile;
}

export default function ActivityPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userFilter, setUserFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch users first
        const { data: usersData } = await supabase.from('profiles').select('*');
        setUsers(usersData || []);

        // Fetch activities
        let query = supabase
          .from('activity_log')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (userFilter) {
          query = query.eq('user_id', userFilter);
        }

        if (entityFilter) {
          query = query.eq('entity_type', entityFilter);
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        // Merge with user data
        const activitiesWithUsers = (data || []).map((activity) => ({
          ...activity,
          user: usersData?.find((u) => u.id === activity.user_id),
        }));

        setActivities(activitiesWithUsers);
        setTotalCount(count || 0);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, router, supabase, userFilter, entityFilter, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'case':
        return <FolderOpen className="w-4 h-4" />;
      case 'client':
        return <Users className="w-4 h-4" />;
      case 'task':
        return <CheckSquare className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'success';
    if (action.includes('delete') || action.includes('remove')) return 'error';
    if (action.includes('update') || action.includes('edit')) return 'info';
    return 'default';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const userOptions = [
    { value: '', label: 'All Users' },
    ...users.map((u) => ({ value: u.id, label: u.full_name })),
  ];

  const entityOptions = [
    { value: '', label: 'All Types' },
    { value: 'case', label: 'Cases' },
    { value: 'client', label: 'Clients' },
    { value: 'task', label: 'Tasks' },
    { value: 'document', label: 'Documents' },
  ];

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col h-screen">
      <Header title="Activity Log" />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={userOptions}
              className="w-48"
            />
            <Select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={entityOptions}
              className="w-40"
            />
          </div>

          {/* Activity List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : activities.length === 0 ? (
            <Card className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No activity found</p>
            </Card>
          ) : (
            <Card padding="none">
              <div className="divide-y divide-slate-100">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <Avatar
                      src={activity.user?.avatar_url}
                      name={activity.user?.full_name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">
                          {activity.user?.full_name || 'Unknown'}
                        </span>
                        <Badge variant={getActionColor(activity.action) as 'success' | 'error' | 'info' | 'default'}>
                          {activity.action}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        {getEntityIcon(activity.entity_type)}
                        <span className="capitalize">{activity.entity_type}</span>
                        <span>•</span>
                        <span>{formatDate(activity.created_at)}</span>
                      </div>
                      {activity.details && (
                        <p className="mt-1 text-sm text-slate-600">
                          {JSON.stringify(activity.details)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </motion.div>
      </div>
    </div>
  );
}
