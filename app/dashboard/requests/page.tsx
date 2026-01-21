'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, X, ArrowRight } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Badge } from '@/app/components/ui/Badge';
import { Table, Pagination } from '@/app/components/ui/Table';
import { Spinner } from '@/app/components/ui/Spinner';
import type {
  Client,
  ClientRequest,
  ClientRequestStatus,
  Priority,
  RequestUrgency,
} from '@/app/lib/types/database';

const ITEMS_PER_PAGE = 10;

type RequestWithClient = ClientRequest & {
  clients?: Pick<Client, 'id' | 'company_name' | 'contact_name' | 'email'> | null;
};

export default function RequestsPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<RequestWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientRequestStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('client_requests')
          .select('*, clients (id, company_name, contact_name, email)', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (statusFilter) {
          query = query.eq('status', statusFilter);
        }

        if (search) {
          query = query.or(
            `title.ilike.%${search}%,request_type.ilike.%${search}%,municipality.ilike.%${search}%`
          );
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;

        setRequests((data as RequestWithClient[]) || []);
        setTotalCount(count || 0);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [supabase, search, statusFilter, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusVariant = (status: ClientRequestStatus) => {
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

  const getUrgencyVariant = (urgency: RequestUrgency) => {
    return urgency === 'urgent' ? 'error' : 'info';
  };

  const mapPriority = (urgency: RequestUrgency): Priority => {
    return urgency === 'urgent' ? 'urgent' : 'normal';
  };

  const setRowLoading = (id: string, loading: boolean) => {
    setActionLoading((prev) => ({ ...prev, [id]: loading }));
  };

  const handleApprove = async (request: RequestWithClient) => {
    setRowLoading(request.id, true);
    try {
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert({
          client_id: request.client_id,
          title: request.title,
          description: request.description,
          case_type: request.request_type,
          status: 'intake',
          priority: mapPriority(request.urgency),
          municipality: request.municipality,
          assigned_employee_id: profile?.id || null,
        } as unknown as never)
        .select('id')
        .single();

      if (caseError) throw caseError;

      const { error: updateError } = await supabase
        .from('client_requests')
        .update({
          status: 'converted',
          reviewed_by: profile?.id || null,
          converted_to_case_id: (caseData as { id: string }).id,
        } as unknown as never)
        .eq('id', request.id);

      if (updateError) throw updateError;

      setRequests((prev) =>
        prev.map((item) =>
          item.id === request.id
            ? {
              ...item,
              status: 'converted',
              reviewed_by: profile?.id || null,
              converted_to_case_id: (caseData as { id: string }).id,
            }
            : item
        )
      );
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    } finally {
      setRowLoading(request.id, false);
    }
  };

  const handleReject = async (request: RequestWithClient) => {
    setRowLoading(request.id, true);
    try {
      const { error } = await supabase
        .from('client_requests')
        .update({
          status: 'rejected',
          reviewed_by: profile?.id || null,
        } as unknown as never)
        .eq('id', request.id);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((item) =>
          item.id === request.id
            ? { ...item, status: 'rejected', reviewed_by: profile?.id || null }
            : item
        )
      );
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setRowLoading(request.id, false);
    }
  };

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'approved', label: 'Approved' },
    { value: 'converted', label: 'Converted' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const columns = [
    {
      key: 'request',
      header: 'Request',
      render: (request: RequestWithClient) => (
        <div>
          <p className="font-medium text-slate-900">{request.title}</p>
          <p className="text-sm text-slate-500">{request.request_type.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (request: RequestWithClient) => (
        <div>
          <p className="font-medium text-slate-900">
            {request.clients?.company_name || '-'}
          </p>
          <p className="text-sm text-slate-500">
            {request.clients?.contact_name || request.clients?.email || ''}
          </p>
        </div>
      ),
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (request: RequestWithClient) => (
        <Badge variant={getUrgencyVariant(request.urgency)}>
          {request.urgency}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (request: RequestWithClient) => (
        <Badge variant={getStatusVariant(request.status)}>
          {request.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Submitted',
      render: (request: RequestWithClient) => formatDate(request.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (request: RequestWithClient) => {
        const isProcessing = actionLoading[request.id];
        const canReview = request.status === 'pending' || request.status === 'reviewing';

        if (request.status === 'converted' && request.converted_to_case_id) {
          return (
            <Link
              href={`/dashboard/cases/${request.converted_to_case_id}`}
              className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              View case
              <ArrowRight className="w-4 h-4" />
            </Link>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleApprove(request)}
              disabled={!canReview || isProcessing}
              className="gap-1"
            >
              {isProcessing ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReject(request)}
              disabled={!canReview || isProcessing}
              className="gap-1"
            >
              {isProcessing ? <Spinner size="sm" /> : <X className="w-4 h-4" />}
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardPage title={t.dashboard?.nav?.requests || 'Requests'}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search requests..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ClientRequestStatus | '');
              setCurrentPage(1);
            }}
            options={statusOptions}
            className="w-48"
          />
        </div>

        <Card padding="none">
          <Table
            columns={columns}
            data={requests}
            loading={isLoading}
            emptyMessage="No requests found"
            keyExtractor={(request) => request.id}
          />
        </Card>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </DashboardPage>
  );
}
