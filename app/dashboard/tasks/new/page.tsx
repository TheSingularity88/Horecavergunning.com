'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Select } from '@/app/components/ui/Select';
import { Spinner } from '@/app/components/ui/Spinner';
import { getPriorityOptions } from '@/app/lib/constants/dashboard';
import Link from 'next/link';
type CaseOption = { id: string; title: string };
type EmployeeOption = { id: string; full_name: string; email: string };

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCaseId = searchParams.get('case');
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    case_id: preselectedCaseId || '',
    assigned_to: '',
    due_date: '',
    priority: 'normal',
    status: 'pending',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesRes, employeesRes] = await Promise.all([
          supabase.from('cases').select('id, title').order('created_at', { ascending: false }),
          supabase.from('profiles').select('id, full_name, email').eq('is_active', true),
        ]);

        setCases((casesRes.data as CaseOption[]) || []);
        setEmployees((employeesRes.data as EmployeeOption[]) || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [supabase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...formData,
          case_id: formData.case_id || null,
          assigned_to: formData.assigned_to || null,
          due_date: formData.due_date || null,
          created_by: profile?.id,
        } as unknown as never)
        .select()
        .single();

      if (error) throw error;

      router.push(`/dashboard/tasks/${(data as { id: string }).id}`);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const caseOptions = [
    { value: '', label: 'No case (standalone task)' },
    ...cases.map((c) => ({ value: c.id, label: c.title })),
  ];

  const employeeOptions = [
    { value: '', label: 'Unassigned' },
    ...employees.map((e) => ({ value: e.id, label: e.full_name })),
  ];

  const priorityOptions = getPriorityOptions();

  return (
    <DashboardPage title={t.dashboard?.tasks?.newTask || 'New Task'}>
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

          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <Input
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="What needs to be done?"
                  required
                />

                <Textarea
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Additional details..."
                />

                <Select
                  label="Related Case"
                  name="case_id"
                  value={formData.case_id}
                  onChange={handleChange}
                  options={caseOptions}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Assign To"
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

                <Select
                  label="Priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  options={priorityOptions}
                />

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/tasks')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" className="text-slate-900" />
                        Creating...
                      </span>
                    ) : (
                      'Create Task'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
      </motion.div>
    </DashboardPage>
  );
}
