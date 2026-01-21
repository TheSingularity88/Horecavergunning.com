'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Clock, CheckCircle2, XCircle, FileSearch } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Spinner } from '@/app/components/ui/Spinner';
import Link from 'next/link';
import { dashboardRoutes } from '@/app/lib/routes/dashboard';
import type { ClientRequest } from '@/app/lib/types/database';

export default function ClientRequestsPage() {
  const { clientData } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!clientData?.id) return;

      try {
        const { data, error } = await supabase
          .from('client_requests')
          .select('*')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests((data as ClientRequest[]) || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [supabase, clientData?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewing':
        return <FileSearch className="w-4 h-4" />;
      case 'approved':
      case 'converted':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return t.clientPortal?.requests?.statusPending || 'Pending Review';
      case 'reviewing':
        return t.clientPortal?.requests?.statusReviewing || 'Under Review';
      case 'approved':
        return t.clientPortal?.requests?.statusApproved || 'Approved';
      case 'converted':
        return t.clientPortal?.requests?.statusConverted || 'Converted to Case';
      case 'rejected':
        return t.clientPortal?.requests?.statusRejected || 'Rejected';
      default:
        return status;
    }
  };

  const formatDate = (date: string) => {
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
        className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t.clientPortal?.requests?.title || 'My Requests'}
          </h1>
          <p className="text-slate-600 mt-1">
            {t.clientPortal?.requests?.subtitle || 'View and submit permit application requests'}
          </p>
        </div>
        <Link href={`${dashboardRoutes.client.requests}/new`}>
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            {t.clientPortal?.requests?.newRequest || 'New Request'}
          </Button>
        </Link>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : requests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 text-center">
            <PlusCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">
              {t.clientPortal?.requests?.noRequests || 'You haven\'t submitted any requests yet'}
            </p>
            <Link href={`${dashboardRoutes.client.requests}/new`}>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                {t.clientPortal?.requests?.submitFirst || 'Submit your first request'}
              </Button>
            </Link>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        request.status === 'pending'
                          ? 'bg-amber-100'
                          : request.status === 'reviewing'
                          ? 'bg-blue-100'
                          : request.status === 'approved' || request.status === 'converted'
                          ? 'bg-green-100'
                          : request.status === 'rejected'
                          ? 'bg-red-100'
                          : 'bg-slate-100'
                      }`}
                    >
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-slate-900">{request.title}</h3>
                      <p className="text-sm text-slate-500 capitalize">
                        {request.request_type.replace(/_/g, ' ')}
                      </p>
                      {request.municipality && (
                        <p className="text-sm text-slate-500">{request.municipality}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {t.clientPortal?.requests?.submittedOn || 'Submitted on'}{' '}
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {request.urgency === 'urgent' && (
                      <Badge variant="error">
                        {t.clientPortal?.requests?.urgent || 'Urgent'}
                      </Badge>
                    )}
                    <Badge variant={getStatusVariant(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </div>
                </div>
                {request.description && (
                  <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                    {request.description}
                  </p>
                )}
                {request.status === 'converted' && request.converted_to_case_id && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Link
                      href={`${dashboardRoutes.client.cases}/${request.converted_to_case_id}`}
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      {t.clientPortal?.requests?.viewCase || 'View Case'} →
                    </Link>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {t.clientPortal?.requests?.howItWorks || 'How It Works'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
                  <span className="text-amber-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {t.clientPortal?.requests?.step1Title || 'Submit Request'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t.clientPortal?.requests?.step1Desc || 'Fill out the form with your permit details'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {t.clientPortal?.requests?.step2Title || 'We Review'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t.clientPortal?.requests?.step2Desc || 'Our team reviews your request within 2 business days'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-100 flex-shrink-0">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {t.clientPortal?.requests?.step3Title || 'Case Created'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t.clientPortal?.requests?.step3Desc || 'Once approved, we create a case and start working'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardPage>
  );
}
