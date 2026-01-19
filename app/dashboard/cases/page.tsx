'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search, FolderOpen, Calendar } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { Header } from '@/app/components/dashboard/Header';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Badge, getStatusBadgeVariant } from '@/app/components/ui/Badge';
import { Table, Pagination } from '@/app/components/ui/Table';
import type { Case } from '@/app/lib/types/database';

const ITEMS_PER_PAGE = 10;

export default function CasesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('cases')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (search) {
          query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        if (statusFilter) {
          query = query.eq('status', statusFilter);
        }

        if (typeFilter) {
          query = query.eq('case_type', typeFilter);
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        setCases(data || []);
        setTotalCount(count || 0);
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, [supabase, search, statusFilter, typeFilter, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusOptions = [
    { value: '', label: t.dashboard?.common?.allStatuses || 'All Statuses' },
    { value: 'intake', label: 'Intake' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting_client', label: 'Waiting for Client' },
    { value: 'waiting_government', label: 'Waiting for Government' },
    { value: 'review', label: 'Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const typeOptions = [
    { value: '', label: t.dashboard?.common?.allTypes || 'All Types' },
    { value: 'exploitatievergunning', label: 'Exploitatievergunning' },
    { value: 'alcoholvergunning', label: 'Alcoholvergunning' },
    { value: 'terrasvergunning', label: 'Terrasvergunning' },
    { value: 'bibob', label: 'Bibob' },
    { value: 'overname', label: 'Overname' },
    { value: 'verbouwing', label: 'Verbouwing' },
    { value: 'other', label: 'Other' },
  ];

  const columns = [
    {
      key: 'title',
      header: t.dashboard?.cases?.caseTitle || 'Case',
      render: (caseItem: Case) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{caseItem.title}</p>
            <p className="text-sm text-slate-500">{caseItem.case_type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t.dashboard?.common?.status || 'Status',
      render: (caseItem: Case) => (
        <Badge variant={getStatusBadgeVariant(caseItem.status)}>
          {caseItem.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: t.dashboard?.common?.priority || 'Priority',
      render: (caseItem: Case) => (
        <Badge variant={getStatusBadgeVariant(caseItem.priority)}>
          {caseItem.priority}
        </Badge>
      ),
    },
    {
      key: 'deadline',
      header: t.dashboard?.cases?.deadline || 'Deadline',
      render: (caseItem: Case) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Calendar className="w-4 h-4" />
          {formatDate(caseItem.deadline)}
        </div>
      ),
    },
    {
      key: 'municipality',
      header: t.dashboard?.cases?.municipality || 'Municipality',
      render: (caseItem: Case) => (
        <span className="text-slate-600">{caseItem.municipality || '-'}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-screen">
      <Header title={t.dashboard?.nav?.cases || 'Cases'} />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Actions Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder={t.dashboard?.common?.searchPlaceholder || 'Search cases...'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={statusOptions}
                className="w-40"
              />
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={typeOptions}
                className="w-48"
              />
              <Button
                onClick={() => router.push('/dashboard/cases/new')}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.dashboard?.cases?.addCase || 'Add Case'}
              </Button>
            </div>
          </div>

          {/* Cases Table */}
          <Card padding="none">
            <Table
              columns={columns}
              data={cases}
              loading={isLoading}
              emptyMessage={t.dashboard?.cases?.noCases || 'No cases found'}
              onRowClick={(caseItem) => router.push(`/dashboard/cases/${caseItem.id}`)}
              keyExtractor={(caseItem) => caseItem.id}
            />
          </Card>

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
