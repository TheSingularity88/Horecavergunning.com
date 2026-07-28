'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClientRecord } from '@/app/lib/actions/clients';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Select } from '@/app/components/ui/Select';
import { Spinner } from '@/app/components/ui/Spinner';
import { getClientStatusOptions } from '@/app/lib/constants/dashboard';
import Link from 'next/link';

export default function NewClientPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // No admin gate. The database has always allowed any staff member to create
  // a client (clients_insert WITH CHECK (is_staff())) and to edit one, so
  // gating creation in browser JavaScript denied employees a capability they
  // already had — while enforcing nothing, since this page sits outside
  // /dashboard/admin/** and the middleware never saw it.
  //
  // The redirect that used to live here also ran during RENDER, which React 19
  // flags: it fired on every render for as long as the flag was false, so a
  // transient profile-fetch failure bounced a real admin in a loop.

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
      // Through the server action, not straight to the table: that is where the
      // guard, the schema and the activity_log entry live.
      const result = await createClientRecord(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (!result.data) {
        setError('Failed to create client. Please try again.');
        return;
      }
      router.push(`/dashboard/clients/${result.data.id}`);
    } catch (err) {
      console.error('Error creating client:', err);
      setError('Failed to create client. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = getClientStatusOptions(t.dashboard);

  return (
    <DashboardPage title={t.dashboard?.clients?.newClient || 'New Client'}>
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
    </DashboardPage>
  );
}
