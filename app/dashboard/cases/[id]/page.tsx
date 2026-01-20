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
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { Header } from '@/app/components/dashboard/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Select } from '@/app/components/ui/Select';
import { Badge, getStatusBadgeVariant } from '@/app/components/ui/Badge';
import { Spinner } from '@/app/components/ui/Spinner';
import { ConfirmModal } from '@/app/components/ui/Modal';
import Link from 'next/link';
import type { Case, Task, Document, Client } from '@/app/lib/types/database';

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

    try {
      const { error } = await supabase
        .from('cases')
        .update({
          ...formData,
          deadline: formData.deadline || null,
        } as unknown as never)
        .eq('id', caseId);

      if (error) throw error;

      setCaseData((prev) => (prev ? { ...prev, ...formData } as Case : null));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating case:', err);
      setError('Failed to update case');
    } finally {
      setIsSaving(false);
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

  const caseTypeOptions = [
    { value: 'exploitatievergunning', label: 'Exploitatievergunning' },
    { value: 'alcoholvergunning', label: 'Alcoholvergunning' },
    { value: 'terrasvergunning', label: 'Terrasvergunning' },
    { value: 'bibob', label: 'Bibob' },
    { value: 'overname', label: 'Overname' },
    { value: 'verbouwing', label: 'Verbouwing' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
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

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-600">Case not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title={caseData.title} />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
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
            Back to cases
          </Link>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Case Details */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Case Details</CardTitle>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <Input
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                      <Textarea
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Case Type"
                          name="case_type"
                          value={formData.case_type}
                          onChange={handleChange}
                          options={caseTypeOptions}
                        />
                        <Select
                          label="Status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          options={statusOptions}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Priority"
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          options={priorityOptions}
                        />
                        <Input
                          label="Deadline"
                          name="deadline"
                          type="date"
                          value={formData.deadline}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Municipality"
                          name="municipality"
                          value={formData.municipality}
                          onChange={handleChange}
                        />
                        <Input
                          label="Reference Number"
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
                          <p className="text-slate-600">{caseData.case_type}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={getStatusBadgeVariant(caseData.status)}>
                              {caseData.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(caseData.priority)}>
                              {caseData.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {caseData.description && (
                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-sm text-slate-500 mb-1">Description</p>
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
                    Add Task
                  </Button>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No tasks yet</p>
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
                            {task.status}
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
                    Upload
                  </Button>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No documents yet</p>
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
                              <p className="text-sm text-slate-500">{doc.category}</p>
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
                    <CardTitle>Client</CardTitle>
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

              {/* Danger Zone */}
              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Case
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Case"
        message="Are you sure you want to delete this case? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
