'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { Header } from '@/app/components/dashboard/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Select } from '@/app/components/ui/Select';
import { Spinner } from '@/app/components/ui/Spinner';
import Link from 'next/link';
type ClientOption = { id: string; company_name: string };

export default function NewCasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('client');
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const [formData, setFormData] = useState({
    client_id: preselectedClientId || '',
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
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, company_name')
          .eq('status', 'active')
          .order('company_name');

        if (error) throw error;
        setClients((data as ClientOption[]) || []);
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
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
        .from('cases')
        .insert({
          ...formData,
          deadline: formData.deadline || null,
          assigned_employee_id: profile?.id,
        } as unknown as never)
        .select()
        .single();

      if (error) throw error;

      router.push(`/dashboard/cases/${(data as { id: string }).id}`);
    } catch (err) {
      console.error('Error creating case:', err);
      setError('Failed to create case. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.company_name,
  }));

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
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  return (
    <div className="flex flex-col h-screen">
      <Header title={t.dashboard?.cases?.newCase || 'New Case'} />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Back link */}
          <Link
            href="/dashboard/cases"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.dashboard?.common?.back || 'Back to cases'}
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>
                {t.dashboard?.cases?.caseDetails || 'Case Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <Select
                  label={t.dashboard?.cases?.client || 'Client'}
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  options={clientOptions}
                  placeholder={isLoadingClients ? 'Loading...' : 'Select a client'}
                  required
                />

                <Input
                  label={t.dashboard?.cases?.title || 'Title'}
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Amsterdam Cafe Permit Application"
                  required
                />

                <Textarea
                  label={t.dashboard?.cases?.description || 'Description'}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label={t.dashboard?.cases?.caseType || 'Case Type'}
                    name="case_type"
                    value={formData.case_type}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label={t.dashboard?.common?.priority || 'Priority'}
                    name="priority"
                    value={formData.priority}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t.dashboard?.cases?.municipality || 'Municipality'}
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleChange}
                    placeholder="e.g., Amsterdam"
                  />
                  <Input
                    label={t.dashboard?.cases?.referenceNumber || 'Reference Number'}
                    name="reference_number"
                    value={formData.reference_number}
                    onChange={handleChange}
                    placeholder="Government reference"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/cases')}
                  >
                    {t.dashboard?.common?.cancel || 'Cancel'}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" className="text-slate-900" />
                        {t.dashboard?.common?.saving || 'Saving...'}
                      </span>
                    ) : (
                      t.dashboard?.common?.create || 'Create Case'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
