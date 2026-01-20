'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewClientPage() {
  const router = useRouter();
  const { profile, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    kvk_number: '',
    notes: '',
    status: 'active',
  });

  // Redirect non-admins
  if (!isAdmin) {
    router.push('/dashboard/clients');
    return null;
  }

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
        .from('clients')
        .insert({
          ...formData,
          assigned_employee_id: profile?.id,
        } as unknown as never)
        .select()
        .single();

      if (error) throw error;

      router.push(`/dashboard/clients/${(data as { id: string }).id}`);
    } catch (err) {
      console.error('Error creating client:', err);
      setError('Failed to create client. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    { value: 'active', label: t.dashboard?.clients?.statusActive || 'Active' },
    { value: 'inactive', label: t.dashboard?.clients?.statusInactive || 'Inactive' },
    { value: 'pending', label: t.dashboard?.clients?.statusPending || 'Pending' },
  ];

  return (
    <div className="flex flex-col h-screen">
      <Header title={t.dashboard?.clients?.newClient || 'New Client'} />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Back link */}
          <Link
            href="/dashboard/clients"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.dashboard?.common?.back || 'Back to clients'}
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>
                {t.dashboard?.clients?.clientDetails || 'Client Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t.dashboard?.clients?.companyName || 'Company Name'}
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label={t.dashboard?.clients?.contactName || 'Contact Name'}
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t.dashboard?.clients?.email || 'Email'}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label={t.dashboard?.clients?.phone || 'Phone'}
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <Input
                  label={t.dashboard?.clients?.address || 'Address'}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label={t.dashboard?.clients?.city || 'City'}
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                  <Input
                    label={t.dashboard?.clients?.postalCode || 'Postal Code'}
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                  />
                  <Input
                    label={t.dashboard?.clients?.kvkNumber || 'KVK Number'}
                    name="kvk_number"
                    value={formData.kvk_number}
                    onChange={handleChange}
                  />
                </div>

                <Select
                  label={t.dashboard?.common?.status || 'Status'}
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={statusOptions}
                />

                <Textarea
                  label={t.dashboard?.clients?.notes || 'Notes'}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                />

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/clients')}
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
                      t.dashboard?.common?.create || 'Create Client'
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
