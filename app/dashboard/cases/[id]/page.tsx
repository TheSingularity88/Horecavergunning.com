'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FolderOpen,
  Calendar,
  MapPin,
  Hash,
  FileText,
  CheckSquare,
  Trash2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { billCase } from '@/app/lib/actions/billing';
import { updateCaseStatus } from '@/app/lib/actions/cases';
import { requestCaseAssessment } from '@/app/lib/actions/ai-run';
import { dashboardRoutes } from '@/app/lib/routes/dashboard';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Select } from '@/app/components/ui/Select';
import { Badge, getStatusBadgeVariant } from '@/app/components/ui/Badge';
import { Spinner } from '@/app/components/ui/Spinner';
import { ConfirmModal } from '@/app/components/ui/Modal';
import {
  getCaseStatusOptions,
  getCaseTypeOptions,
  getPriorityOptions,
} from '@/app/lib/constants/dashboard';
import Link from 'next/link';
import type { Case, Task, Document, Client } from '@/app/lib/types/database';
import { caseStatusLabel, caseTypeLabel, docCategoryLabel, priorityLabel, taskStatusLabel } from '@/app/lib/dashboard-labels';

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBilling, setIsBilling] = useState(false);
  const [billingMessage, setBillingMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [aiMessage, setAiMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [openProposalCount, setOpenProposalCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    case_type: 'exploitatievergunning',
    status: 'intake',
    priority: 'normal',
    deadline: '',
    municipality: '',
    reference_number: '',
  });

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const { data: caseResult, error: caseError } = await supabase
          .from('cases')
          .select('*')
          .eq('id', caseId)
          .single();

        if (caseError) throw caseError;

        const typedCase = caseResult as Case;
        setCaseData(typedCase);
        setFormData({
          title: typedCase.title || '',
          description: typedCase.description || '',
          case_type: typedCase.case_type || 'exploitatievergunning',
          status: typedCase.status || 'intake',
          priority: typedCase.priority || 'normal',
          deadline: typedCase.deadline || '',
          municipality: typedCase.municipality || '',
          reference_number: typedCase.reference_number || '',
        });

        // Fetch client
        if (typedCase.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('id', typedCase.client_id)
            .single();
          if (clientData) setClient(clientData as Client);
        }

        // Fetch tasks
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false });
        setTasks((tasksData as Task[]) || []);

        // Fetch documents
        const { data: docsData } = await supabase
          .from('documents')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false });
        setDocuments((docsData as Document[]) || []);

        // How many AI proposals for this case are still awaiting review.
        const { count } = await supabase
          .from('ai_proposals')
          .select('*', { count: 'exact', head: true })
          .eq('case_id', caseId)
          .eq('status', 'pending');
        setOpenProposalCount(count ?? 0);
      } catch (err) {
        console.error('Error fetching case:', err);
        setError('Failed to load case');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCase();
  }, [supabase, caseId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    setStatusMessage(null);

    const statusChanged = caseData?.status !== formData.status;

    try {
      // Everything except status is a plain field edit; status is handled
      // below so the customer gets told about it.
      const { error } = await supabase
        .from('cases')
        .update({
          title: formData.title,
          description: formData.description,
          case_type: formData.case_type,
          priority: formData.priority,
          municipality: formData.municipality,
          reference_number: formData.reference_number,
          deadline: formData.deadline || null,
        } as unknown as never)
        .eq('id', caseId);

      if (error) throw error;

      // Status goes through a server action so the customer is actually told.
      // Updating it straight from the browser meant a case could sit in
      // "waiting_client" with the customer never finding out they were the
      // hold-up.
      if (statusChanged) {
        const result = await updateCaseStatus({ caseId, status: formData.status });
        if (!result.success) {
          setError(result.error);
          return;
        }
        setStatusMessage(
          result.data?.notified
            ? 'Status bijgewerkt en de klant is per e-mail geïnformeerd.'
            : 'Status bijgewerkt. Er is geen e-mail verstuurd (geen e-mailadres bekend of mail niet geconfigureerd).'
        );
      }

      setCaseData((prev) => (prev ? { ...prev, ...formData } as Case : null));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating case:', err);
      setError('Failed to update case');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Ask an AI employee to assess this case. The result is a PROPOSAL in the
   * review queue — this button never changes the case itself.
   */
  const handleRequestAssessment = async () => {
    setIsAssessing(true);
    setAiMessage(null);
    try {
      const result = await requestCaseAssessment({ caseId });
      if (!result.success) {
        setAiMessage({ ok: false, text: result.error });
        return;
      }
      setAiMessage({
        ok: true,
        text: t.dashboard?.aiReview?.assessmentDone || 'Assessment ready — see AI proposals.',
      });
      setOpenProposalCount((count) => count + 1);
    } catch {
      // An assessment can run for a while; a dropped connection rejects the
      // action call even though the server may still have finished it.
      setAiMessage({
        ok: false,
        text:
          t.clientPortal?.errors?.network ||
          'Connection lost. Check the AI proposals page for the result.',
      });
    } finally {
      setIsAssessing(false);
    }
  };

  const handleBillCase = async () => {
    setIsBilling(true);
    setBillingMessage(null);
    try {
      const result = await billCase(caseId);
      if (!result.success) {
        setBillingMessage({ ok: false, text: result.error });
        return;
      }
      setBillingMessage({
        ok: true,
        text: result.data?.checkoutUrl
          ? 'Factuur aangemaakt en betaallink naar de klant gemaild.'
          : 'Factuur aangemaakt. Er is geen betaallink verstuurd (Mollie niet geconfigureerd of bedrag is €0).',
      });
    } catch {
      setBillingMessage({
        ok: false,
        text: 'Aanmaken van de factuur is mislukt. Controleer de verbinding en probeer het opnieuw.',
      });
    } finally {
      setIsBilling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('cases').delete().eq('id', caseId);
      if (error) throw error;
      router.push('/dashboard/cases');
    } catch (err) {
      console.error('Error deleting case:', err);
      setError('Failed to delete case');
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const caseTypeOptions = getCaseTypeOptions(t.dashboard);
  const statusOptions = getCaseStatusOptions(t.dashboard);
  const priorityOptions = getPriorityOptions(t.dashboard);

  if (isLoading) {
    return (
      <DashboardPage contentClassName="flex items-center justify-center p-0 lg:p-0">
        <Spinner size="lg" />
      </DashboardPage>
    );
  }

  if (!caseData) {
    return (
      <DashboardPage contentClassName="flex items-center justify-center p-0 lg:p-0">
        <p className="text-slate-600">{t.dashboard?.cases?.notFound || 'Case not found'}</p>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title={caseData.title}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
          <Link
            href="/dashboard/cases"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.dashboard?.cases?.backToCases || 'Back to cases'}
          </Link>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {statusMessage && (
            <div className="mb-6 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
              {statusMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Case Details */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t.dashboard?.cases?.caseDetails || 'Case details'}</CardTitle>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                          {t.dashboard?.common?.cancel || 'Cancel'}
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        {t.dashboard?.common?.edit || 'Edit'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <Input
                        label={t.dashboard?.common?.titleField || 'Title'}
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                      <Textarea
                        label={t.dashboard?.common?.description || 'Description'}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label={t.dashboard?.cases?.caseType || 'Case type'}
                          name="case_type"
                          value={caseTypeLabel(formData.case_type, t)}
                          onChange={handleChange}
                          options={caseTypeOptions}
                        />
                        <Select
                          label={t.dashboard?.common?.status || 'Status'}
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          options={statusOptions}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label={t.dashboard?.common?.priority || 'Priority'}
                          name="priority"
                          value={priorityLabel(formData.priority, t)}
                          onChange={handleChange}
                          options={priorityOptions}
                        />
                        <Input
                          label={t.dashboard?.cases?.deadline || 'Deadline'}
                          name="deadline"
                          type="date"
                          value={formData.deadline}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label={t.dashboard?.cases?.municipality || 'Municipality'}
                          name="municipality"
                          value={formData.municipality}
                          onChange={handleChange}
                        />
                        <Input
                          label={t.dashboard?.cases?.referenceNumber || 'Reference number'}
                          name="reference_number"
                          value={formData.reference_number}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                          <FolderOpen className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{caseData.title}</h3>
                          </div>
                          <p className="text-slate-600">{caseTypeLabel(caseData.case_type, t)}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={getStatusBadgeVariant(caseData.status)}>
                              {caseStatusLabel(caseData.status, t)}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(caseData.priority)}>
                              {priorityLabel(caseData.priority, t)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {caseData.description && (
                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-sm text-slate-500 mb-1">{t.dashboard?.common?.description || 'Description'}</p>
                          <p className="text-slate-600 whitespace-pre-wrap">{caseData.description}</p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>Deadline: {formatDate(caseData.deadline)}</span>
                        </div>
                        {caseData.municipality && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-4 h-4" />
                            <span>{caseData.municipality}</span>
                          </div>
                        )}
                        {caseData.reference_number && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Hash className="w-4 h-4" />
                            <span>{caseData.reference_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tasks */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Tasks ({tasks.length})</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/dashboard/tasks/new?case=${caseId}`)}
                  >
                    {t.dashboard?.tasks?.addTask || 'Add task'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">{t.dashboard?.cases?.noTasksYet || 'No tasks yet'}</p>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <Link
                          key={task.id}
                          href={`/dashboard/tasks/${task.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <CheckSquare className="w-5 h-5 text-slate-400" />
                            <span className="font-medium text-slate-900">{task.title}</span>
                          </div>
                          <Badge variant={getStatusBadgeVariant(task.status)}>
                            {taskStatusLabel(task.status, t)}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Documents ({documents.length})</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/dashboard/documents?case=${caseId}`)}
                  >
                    {t.dashboard?.common?.upload || 'Upload'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">{t.dashboard?.cases?.noDocumentsYet || 'No documents yet'}</p>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="font-medium text-slate-900">{doc.name}</p>
                              <p className="text-sm text-slate-500">{docCategoryLabel(doc.category, t)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Client Info */}
              {client && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t.dashboard?.cases?.client || 'Client'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="block p-3 rounded-lg hover:bg-slate-50 transition-colors -m-3"
                    >
                      <p className="font-medium text-slate-900">{client.company_name}</p>
                      <p className="text-sm text-slate-500">{client.contact_name}</p>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* AI assessment — produces a PROPOSAL for the review queue.
                  Deliberately changes nothing about the case itself. */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.dashboard?.nav?.aiReview || 'AI proposals'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiMessage && (
                    <p className={aiMessage.ok ? 'text-sm text-green-700' : 'text-sm text-red-600'}>
                      {aiMessage.text}
                    </p>
                  )}
                  {openProposalCount > 0 && (
                    <Link
                      href={dashboardRoutes.employee.aiReview}
                      className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
                    >
                      {openProposalCount}{' '}
                      {t.dashboard?.aiReview?.openProposals || 'open AI proposal(s)'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2"
                    disabled={isAssessing}
                    onClick={handleRequestAssessment}
                  >
                    {isAssessing ? (
                      <>
                        <Spinner size="sm" />
                        {t.dashboard?.aiReview?.assessmentRunning || 'Assessing...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {t.dashboard?.aiReview?.requestAssessment || 'Ask AI to assess'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Billing — the only way to invoice a case that did not come
                  in through the request-approval flow (phone/email customers). */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.dashboard?.cases?.billing || 'Billing'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {billingMessage && (
                    <p
                      className={
                        billingMessage.ok
                          ? 'text-sm text-green-700'
                          : 'text-sm text-red-600'
                      }
                    >
                      {billingMessage.text}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    disabled={isBilling}
                    onClick={handleBillCase}
                  >
                    {isBilling ? (
                      <Spinner size="sm" />
                    ) : (
                      'Factuur aanmaken & betaallink mailen'
                    )}
                  </Button>
                  <p className="text-xs text-slate-500">
                    Maakt een factuur voor het vaste tarief van dit vergunningtype en
                    mailt de klant een betaallink. Bestaat er al een openstaande
                    factuur, dan wordt die hergebruikt.
                  </p>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">{t.dashboard?.common?.dangerZone || 'Danger zone'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.dashboard?.cases?.deleteCase || 'Delete case'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
      </motion.div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t.dashboard?.cases?.deleteCase || 'Delete case'}
        message="Are you sure you want to delete this case? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </DashboardPage>
  );
}
