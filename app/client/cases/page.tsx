'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Calendar, Search } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/app/components/ui/Badge';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Spinner } from '@/app/components/ui/Spinner';
import Link from 'next/link';
import { dashboardRoutes } from '@/app/lib/routes/dashboard';
import type { Case, CaseStatus } from '@/app/lib/types/database';

const CASE_STATUSES: { value: CaseStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'intake', label: 'Intake' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_client', label: 'Waiting for You' },
  { value: 'waiting_government', label: 'Waiting for Government' },
  { value: 'review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
];

export default function ClientCasesPage() {
  const { clientData } = useAuth();
  const { t } = useLanguage();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchCases = async () => {
      if (!clientData?.id) return;

      setIsLoading(true);
      try {
        let query = supabase
          .from('cases')
          .select('*')
          .eq('client_id', clientData.id)
          .order('updated_at', { ascending: false });

        if (search) {
          query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        if (statusFilter) {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        setCases((data as Case[]) || []);
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, [supabase, clientData?.id, search, statusFilter]);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <DashboardPage>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-slate-900">
          {t.clientPortal?.cases?.title || 'My Cases'}
        </h1>
        <p className="text-slate-600 mt-1">
          {t.clientPortal?.cases?.subtitle || 'Track the progress of your permit applications'}
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="flex-1">
          <Input
            placeholder={t.dashboard?.common?.searchPlaceholder || 'Search cases...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={CASE_STATUSES.map(s => ({ value: s.value, label: s.label }))}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Cases List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : cases.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {search || statusFilter
                ? t.clientPortal?.cases?.noResults || 'No cases found matching your filters'
                : t.clientPortal?.cases?.noCases || 'You don\'t have any cases yet'}
            </p>
            {!search && !statusFilter && (
              <Link
                href={`${dashboardRoutes.client.requests}/new`}
                className="inline-block mt-4 text-amber-600 hover:text-amber-700 font-medium"
              >
                {t.clientPortal?.cases?.submitRequest || 'Submit a permit request'}
              </Link>
            )}
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {cases.map((caseItem, index) => (
            <motion.div
              key={caseItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link href={`${dashboardRoutes.client.cases}/${caseItem.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
                        <FolderOpen className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">
                          {caseItem.title}
                        </h3>
                        <p className="text-sm text-slate-500 capitalize">
                          {caseItem.case_type.replace(/_/g, ' ')}
                        </p>
                        {caseItem.municipality && (
                          <p className="text-sm text-slate-500">
                            {caseItem.municipality}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                      {caseItem.deadline && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(caseItem.deadline)}
                        </div>
                      )}
                      <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                        {caseItem.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  {caseItem.description && (
                    <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                      {caseItem.description}
                    </p>
                  )}
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardPage>
  );
}
