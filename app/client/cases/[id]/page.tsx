'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hourglass,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { Spinner } from '@/app/components/ui/Spinner';
import Link from 'next/link';
import { dashboardRoutes } from '@/app/lib/routes/dashboard';
import type { Case, Document, Task } from '@/app/lib/types/database';

// Case status timeline order
const STATUS_ORDER = [
  'intake',
  'in_progress',
  'waiting_client',
  'waiting_government',
  'review',
  'approved',
  'completed',
];

interface TimelineStep {
  status: string;
  label: string;
  icon: React.ElementType;
  isCompleted: boolean;
  isCurrent: boolean;
}

export default function ClientCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { clientData } = useAuth();
  const { t } = useLanguage();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const caseId = params.id as string;

  useEffect(() => {
    const fetchCaseData = async () => {
      if (!clientData?.id || !caseId) return;

      setIsLoading(true);
      try {
        // Fetch case
        const { data: caseResult, error: caseError } = await supabase
          .from('cases')
          .select('*')
          .eq('id', caseId)
          .eq('client_id', clientData.id)
          .single();

        if (caseError) {
          if (caseError.code === 'PGRST116') {
            setError('Case not found');
          } else {
            throw caseError;
          }
          return;
        }

        setCaseData(caseResult as Case);

        // Fetch related documents
        const { data: docsResult } = await supabase
          .from('documents')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false });

        setDocuments((docsResult as Document[]) || []);

        // Fetch related tasks (read-only view)
        const { data: tasksResult } = await supabase
          .from('tasks')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false });

        setTasks((tasksResult as Task[]) || []);
      } catch (error) {
        console.error('Error fetching case:', error);
        setError('Failed to load case');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseData();
  }, [supabase, clientData?.id, caseId]);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getTimelineSteps = (): TimelineStep[] => {
    if (!caseData) return [];

    const currentIndex = STATUS_ORDER.indexOf(caseData.status);
    const isRejectedOrCancelled = ['rejected', 'cancelled'].includes(caseData.status);

    return STATUS_ORDER.map((status, index) => {
      let icon = Clock;
      if (status === 'completed' || status === 'approved') icon = CheckCircle2;
      if (status === 'waiting_client' || status === 'waiting_government') icon = Hourglass;

      return {
        status,
        label: status.replace(/_/g, ' '),
        icon,
        isCompleted: !isRejectedOrCancelled && index < currentIndex,
        isCurrent: status === caseData.status,
      };
    });
  };

  if (isLoading) {
    return (
      <DashboardPage>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </DashboardPage>
    );
  }

  if (error || !caseData) {
    return (
      <DashboardPage>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-slate-600">{error || 'Case not found'}</p>
          <Button
            variant="outline"
            onClick={() => router.push(dashboardRoutes.client.cases)}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.dashboard?.common?.back || 'Back to cases'}
          </Button>
        </div>
      </DashboardPage>
    );
  }

  const timelineSteps = getTimelineSteps();

  return (
    <DashboardPage>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Link
          href={dashboardRoutes.client.cases}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t.dashboard?.common?.back || 'Back to cases'}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{caseData.title}</h1>
            <p className="text-slate-600 capitalize mt-1">
              {caseData.case_type.replace(/_/g, ' ')}
            </p>
          </div>
          <Badge
            variant={getStatusBadgeVariant(caseData.status)}
            className="self-start sm:self-auto text-sm px-3 py-1"
          >
            {caseData.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {t.clientPortal?.cases?.progress || 'Progress'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-slate-200" />

                  <div className="space-y-6">
                    {timelineSteps.map((step, index) => (
                      <div key={step.status} className="relative flex items-start gap-4">
                        <div
                          className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                            step.isCurrent
                              ? 'bg-amber-500 text-white'
                              : step.isCompleted
                              ? 'bg-green-500 text-white'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          <step.icon className="w-4 h-4" />
                        </div>
                        <div className="pt-1">
                          <p
                            className={`font-medium capitalize ${
                              step.isCurrent
                                ? 'text-amber-600'
                                : step.isCompleted
                                ? 'text-green-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.isCurrent && (
                            <p className="text-sm text-slate-500 mt-0.5">
                              {t.clientPortal?.cases?.currentStatus || 'Current status'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special status messages */}
                {caseData.status === 'waiting_client' && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 font-medium">
                      {t.clientPortal?.cases?.actionRequired || 'Action required from you'}
                    </p>
                    <p className="text-amber-700 text-sm mt-1">
                      {t.clientPortal?.cases?.actionRequiredDesc || 'Please check if there are any documents you need to upload or information you need to provide.'}
                    </p>
                    <Link
                      href={dashboardRoutes.client.documents}
                      className="inline-block mt-2 text-amber-600 hover:text-amber-700 font-medium text-sm"
                    >
                      {t.clientPortal?.cases?.uploadDocuments || 'Upload documents'}
                    </Link>
                  </div>
                )}

                {caseData.status === 'rejected' && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">
                      {t.clientPortal?.cases?.rejected || 'Application Rejected'}
                    </p>
                    <p className="text-red-700 text-sm mt-1">
                      {t.clientPortal?.cases?.rejectedDesc || 'Your application has been rejected. Please contact us for more information.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Case Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {t.clientPortal?.cases?.details || 'Case Details'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caseData.description && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-500 mb-1">
                      {t.dashboard?.cases?.description || 'Description'}
                    </p>
                    <p className="text-slate-900">{caseData.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {caseData.municipality && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">
                          {t.dashboard?.cases?.municipality || 'Municipality'}
                        </p>
                        <p className="font-medium text-slate-900">{caseData.municipality}</p>
                      </div>
                    </div>
                  )}
                  {caseData.deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">
                          {t.dashboard?.cases?.deadline || 'Deadline'}
                        </p>
                        <p className="font-medium text-slate-900">{formatDate(caseData.deadline)}</p>
                      </div>
                    </div>
                  )}
                  {caseData.reference_number && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">
                          {t.dashboard?.cases?.referenceNumber || 'Reference'}
                        </p>
                        <p className="font-medium text-slate-900">{caseData.reference_number}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">
                        {t.clientPortal?.cases?.lastUpdated || 'Last Updated'}
                      </p>
                      <p className="font-medium text-slate-900">{formatDate(caseData.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tasks */}
          {tasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t.clientPortal?.cases?.tasks || 'Tasks'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              task.status === 'completed'
                                ? 'bg-green-500'
                                : task.status === 'in_progress'
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-slate-900">{task.title}</span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {task.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Documents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {t.clientPortal?.cases?.documents || 'Documents'}
                </CardTitle>
                <Link
                  href={`${dashboardRoutes.client.documents}?case=${caseId}`}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  {t.clientPortal?.cases?.uploadNew || 'Upload'}
                </Link>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">
                    {t.clientPortal?.cases?.noDocuments || 'No documents yet'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.slice(0, 5).map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50"
                      >
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-900 truncate">{doc.name}</span>
                      </div>
                    ))}
                    {documents.length > 5 && (
                      <Link
                        href={`${dashboardRoutes.client.documents}?case=${caseId}`}
                        className="block text-sm text-amber-600 hover:text-amber-700 text-center pt-2"
                      >
                        {t.dashboard?.common?.viewAll || 'View all'} ({documents.length})
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {t.clientPortal?.cases?.quickActions || 'Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href={`${dashboardRoutes.client.documents}?case=${caseId}`}
                  className="block w-full"
                >
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    {t.clientPortal?.actions?.uploadDocument || 'Upload Document'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardPage>
  );
}
