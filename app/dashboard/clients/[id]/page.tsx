'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText, Trash2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
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
import { getClientStatusOptions } from '@/app/lib/constants/dashboard';
import Link from 'next/link';
import type { Client, Case } from '@/app/lib/types/database';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (clientError) throw clientError;

        const typedClient = clientData as Client;
        setClient(typedClient);
        setFormData({
          company_name: typedClient.company_name || '',
          contact_name: typedClient.contact_name || '',
          email: typedClient.email || '',
          phone: typedClient.phone || '',
          address: typedClient.address || '',
          city: typedClient.city || '',
          postal_code: typedClient.postal_code || '',
          kvk_number: typedClient.kvk_number || '',
          notes: typedClient.notes || '',
          status: typedClient.status || 'active',
        });

        // Fetch associated cases
        const { data: casesData } = await supabase
          .from('cases')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        setCases((casesData as Case[]) || []);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError('Failed to load client');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [supabase, clientId]);

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
        .from('clients')
        .update(formData as unknown as never)
        .eq('id', clientId);

      if (error) throw error;

      setClient((prev) => (prev ? { ...prev, ...formData } as Client : null));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating client:', err);
      setError('Failed to update client');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);

      if (error) throw error;

      router.push('/dashboard/clients');
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client');
      setIsDeleting(false);
    }
  };

  const statusOptions = getClientStatusOptions(t.dashboard);

  if (isLoading) {
    return (
      <DashboardPage contentClassName="flex items-center justify-center p-0 lg:p-0">
        <Spinner size="lg" />
      </DashboardPage>
    );
  }

  if (!client) {
    return (
      <DashboardPage contentClassName="flex items-center justify-center p-0 lg:p-0">
        <p className="text-slate-600">Client not found</p>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title={client.company_name}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
          {/* Back link */}
          <Link
            href="/dashboard/clients"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.dashboard?.common?.back || 'Back to clients'}
          </Link>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {t.dashboard?.clients?.clientDetails || 'Client Details'}
                  </CardTitle>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(false)}
                        >
                          {t.dashboard?.common?.cancel || 'Cancel'}
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                          {isSaving ? 'Saving...' : t.dashboard?.common?.save || 'Save'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        {t.dashboard?.common?.edit || 'Edit'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Company Name"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleChange}
                          required
                        />
                        <Input
                          label="Contact Name"
                          name="contact_name"
                          value={formData.contact_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                        <Input
                          label="Phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <Input
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="City"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                        />
                        <Input
                          label="Postal Code"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleChange}
                        />
                        <Input
                          label="KVK Number"
                          name="kvk_number"
                          value={formData.kvk_number}
                          onChange={handleChange}
                        />
                      </div>
                      <Select
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={statusOptions}
                      />
                      <Textarea
                        label="Notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-slate-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {client.company_name}
                          </h3>
                          <p className="text-slate-600">{client.contact_name}</p>
                          <Badge
                            variant={getStatusBadgeVariant(client.status)}
                            className="mt-2"
                          >
                            {client.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center gap-2 text-slate-600 md:col-span-2">
                            <MapPin className="w-4 h-4" />
                            {client.address}
                            {client.city && `, ${client.city}`}
                            {client.postal_code && ` ${client.postal_code}`}
                          </div>
                        )}
                      </div>

                      {client.kvk_number && (
                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-sm text-slate-500">KVK Number</p>
                          <p className="font-medium text-slate-900">{client.kvk_number}</p>
                        </div>
                      )}

                      {client.notes && (
                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-sm text-slate-500 mb-1">Notes</p>
                          <p className="text-slate-600 whitespace-pre-wrap">
                            {client.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cases */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {t.dashboard?.cases?.title || 'Cases'} ({cases.length})
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/cases/new?client=${clientId}`)
                    }
                  >
                    {t.dashboard?.cases?.addCase || 'Add Case'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {cases.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">
                      No cases yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cases.map((caseItem) => (
                        <Link
                          key={caseItem.id}
                          href={`/dashboard/cases/${caseItem.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="font-medium text-slate-900">
                                {caseItem.title}
                              </p>
                              <p className="text-sm text-slate-500">
                                {caseItem.case_type}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                            {caseItem.status.replace('_', ' ')}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">
                      {t.dashboard?.common?.dangerZone || 'Danger Zone'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.dashboard?.clients?.deleteClient || 'Delete Client'}
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
        title={t.dashboard?.clients?.deleteClient || 'Delete Client'}
        message={
          t.dashboard?.clients?.deleteConfirm ||
          'Are you sure you want to delete this client? This action cannot be undone and will also delete all associated cases and documents.'
        }
        confirmText={t.dashboard?.common?.delete || 'Delete'}
        variant="danger"
        isLoading={isDeleting}
      />
    </DashboardPage>
  );
}
