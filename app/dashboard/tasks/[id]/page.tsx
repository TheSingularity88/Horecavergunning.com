'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckSquare, Calendar, User, FolderOpen, Trash2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase/client';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Select } from '@/app/components/ui/Select';
import { Badge, getStatusBadgeVariant } from '@/app/components/ui/Badge';
import { Spinner } from '@/app/components/ui/Spinner';
import { ConfirmModal } from '@/app/components/ui/Modal';
import { getPriorityOptions, getTaskStatusOptions } from '@/app/lib/constants/dashboard';
import Link from 'next/link';
import type { Task, Case, Profile } from '@/app/lib/types/database';
import { priorityLabel, taskStatusLabel } from '@/app/lib/dashboard-labels';
import { useLanguage } from '@/app/context/LanguageContext';

type EmployeeOption = { id: string; full_name: string };

export default function TaskDetailPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useParams();
  const taskId = params.id as string;
  const { isAdmin, profile } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [relatedCase, setRelatedCase] = useState<Case | null>(null);
  const [assignee, setAssignee] = useState<Profile | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
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
    status: 'pending',
    priority: 'normal',
    due_date: '',
    assigned_to: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single();

        if (taskError) throw taskError;

        const typedTask = taskData as Task;
        setTask(typedTask);
        setFormData({
          title: typedTask.title || '',
          description: typedTask.description || '',
          status: typedTask.status || 'pending',
          priority: typedTask.priority || 'normal',
          due_date: typedTask.due_date || '',
          assigned_to: typedTask.assigned_to || '',
        });

        if (typedTask.case_id) {
          const { data: caseData } = await supabase
            .from('cases')
            .select('*')
            .eq('id', typedTask.case_id)
            .single();
          if (caseData) setRelatedCase(caseData as Case);
        }

        if (typedTask.assigned_to) {
          const { data: assigneeData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', typedTask.assigned_to)
            .single();
          if (assigneeData) setAssignee(assigneeData as Profile);
        }

        const { data: employeesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('is_active', true);
        setEmployees((employeesData as EmployeeOption[]) || []);
      } catch (err) {
        console.error('Error fetching task:', err);
        setError('Failed to load task');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, taskId]);

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
        .from('tasks')
        .update({
          ...formData,
          due_date: formData.due_date || null,
          assigned_to: formData.assigned_to || null,
          completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
        } as unknown as never)
        .eq('id', taskId);

      if (error) throw error;

      setTask((prev) => (prev ? { ...prev, ...formData } as Task : null));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      router.push('/dashboard/tasks');
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
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

  const statusOptions = getTaskStatusOptions(t.dashboard);
  const priorityOptions = getPriorityOptions(t.dashboard);

  const employeeOptions = [
    { value: '', label: t.dashboard?.common?.unassigned || 'Unassigned' },
    ...employees.map((e) => ({ value: e.id, label: e.full_name })),
  ];

  const canEdit = isAdmin || task?.created_by === profile?.id || task?.assigned_to === profile?.id;
  const canDelete = isAdmin || task?.created_by === profile?.id;

  if (isLoading) {
    return (
      <DashboardPage contentClassName="flex items-center justify-center p-0 lg:p-0">
        <Spinner size="lg" />
      </DashboardPage>
    );
  }

  if (!task) {
    return (
      <DashboardPage contentClassName="flex items-center justify-center p-0 lg:p-0">
        <p className="text-slate-600">{t.dashboard?.tasks?.notFound || 'Task not found'}</p>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title={task.title}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
          <Link
            href="/dashboard/tasks"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.dashboard?.tasks?.backToTasks || 'Back to tasks'}
          </Link>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t.dashboard?.tasks?.taskDetails || 'Task details'}</CardTitle>
              {canEdit && (
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
              )}
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
                      label={t.dashboard?.common?.status || 'Status'}
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      options={statusOptions}
                    />
                    <Select
                      label={t.dashboard?.common?.priority || 'Priority'}
                      name="priority"
                      value={priorityLabel(formData.priority, t)}
                      onChange={handleChange}
                      options={priorityOptions}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label={t.dashboard?.common?.assignedTo || 'Assigned to'}
                      name="assigned_to"
                      value={formData.assigned_to}
                      onChange={handleChange}
                      options={employeeOptions}
                    />
                    <Input
                      label={t.dashboard?.common?.dueDate || 'Due date'}
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{task.title}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {taskStatusLabel(task.status, t)}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(task.priority)}>
                          {priorityLabel(task.priority, t)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {task.description && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-500 mb-1">{t.dashboard?.common?.description || 'Description'}</p>
                      <p className="text-slate-600 whitespace-pre-wrap">{task.description}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {formatDate(task.due_date)}</span>
                    </div>
                    {assignee && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4" />
                        <span>Assigned to: {assignee.full_name}</span>
                      </div>
                    )}
                    {relatedCase && (
                      <Link
                        href={`/dashboard/cases/${relatedCase.id}`}
                        className="flex items-center gap-2 text-amber-600 hover:text-amber-700"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Case: {relatedCase.title}</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {canDelete && (
            <Card className="mt-6">
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
                  {t.dashboard?.tasks?.deleteTask || 'Delete task'}
                </Button>
              </CardContent>
            </Card>
          )}
      </motion.div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t.dashboard?.tasks?.deleteTask || 'Delete task'}
        message="Are you sure you want to delete this task?"
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </DashboardPage>
  );
}
