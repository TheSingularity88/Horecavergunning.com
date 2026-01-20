'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckSquare, Calendar, User, FolderOpen, Trash2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
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
import type { Task, Case, Profile } from '@/app/lib/types/database';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const { isAdmin, profile } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [relatedCase, setRelatedCase] = useState<Case | null>(null);
  const [assignee, setAssignee] = useState<Profile | null>(null);
  const [employees, setEmployees] = useState<Profile[]>([]);
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
        setEmployees((employeesData as Profile[]) || []);
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

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const employeeOptions = [
    { value: '', label: 'Unassigned' },
    ...employees.map((e) => ({ value: e.id, label: e.full_name })),
  ];

  const canEdit = isAdmin || task?.created_by === profile?.id || task?.assigned_to === profile?.id;
  const canDelete = isAdmin || task?.created_by === profile?.id;

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

  if (!task) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-600">Task not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title={task.title} />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
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
            Back to tasks
          </Link>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Task Details</CardTitle>
              {canEdit && (
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
              )}
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
                      label="Status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      options={statusOptions}
                    />
                    <Select
                      label="Priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      options={priorityOptions}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Assigned To"
                      name="assigned_to"
                      value={formData.assigned_to}
                      onChange={handleChange}
                      options={employeeOptions}
                    />
                    <Input
                      label="Due Date"
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
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {task.description && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-500 mb-1">Description</p>
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
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Task
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
