'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Building2, Mail, Phone, MapPin, Save } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Spinner } from '@/app/components/ui/Spinner';

interface ProfileForm {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  kvk_number: string;
}

export default function ClientProfilePage() {
  const { clientData, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    kvk_number: '',
  });
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (clientData) {
      setFormData({
        company_name: clientData.company_name || '',
        contact_name: clientData.contact_name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        city: clientData.city || '',
        postal_code: clientData.postal_code || '',
        kvk_number: clientData.kvk_number || '',
      });
    }
  }, [clientData]);

  const handleSave = async () => {
    if (!clientData?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          company_name: formData.company_name,
          contact_name: formData.contact_name,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          postal_code: formData.postal_code || null,
        } as never)
        .eq('id', clientData.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (clientData) {
      setFormData({
        company_name: clientData.company_name || '',
        contact_name: clientData.contact_name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        city: clientData.city || '',
        postal_code: clientData.postal_code || '',
        kvk_number: clientData.kvk_number || '',
      });
    }
    setIsEditing(false);
  };

  if (!clientData) {
    return (
      <DashboardPage>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t.clientPortal?.profile?.title || 'My Profile'}
          </h1>
          <p className="text-slate-600 mt-1">
            {t.clientPortal?.profile?.subtitle || 'View and update your company information'}
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            {t.dashboard?.common?.edit || 'Edit'}
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {t.clientPortal?.profile?.companyInfo || 'Company Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={t.dashboard?.clients?.companyName || 'Company Name'}
                value={formData.company_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company_name: e.target.value }))
                }
                disabled={!isEditing}
              />
              <Input
                label={t.dashboard?.clients?.kvkNumber || 'KVK Number'}
                value={formData.kvk_number}
                disabled
                icon={<Building2 className="w-4 h-4" />}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t.clientPortal?.profile?.contactInfo || 'Contact Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={t.dashboard?.clients?.contactName || 'Contact Name'}
                value={formData.contact_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contact_name: e.target.value }))
                }
                disabled={!isEditing}
              />
              <Input
                label={t.dashboard?.clients?.email || 'Email'}
                type="email"
                value={formData.email}
                disabled
                icon={<Mail className="w-4 h-4" />}
              />
              <Input
                label={t.dashboard?.clients?.phone || 'Phone'}
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                disabled={!isEditing}
                icon={<Phone className="w-4 h-4" />}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t.clientPortal?.profile?.addressInfo || 'Address'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 lg:col-span-3">
                  <Input
                    label={t.dashboard?.clients?.address || 'Street Address'}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, address: e.target.value }))
                    }
                    disabled={!isEditing}
                  />
                </div>
                <Input
                  label={t.dashboard?.clients?.postalCode || 'Postal Code'}
                  value={formData.postal_code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, postal_code: e.target.value }))
                  }
                  disabled={!isEditing}
                />
                <div className="sm:col-span-1 lg:col-span-2">
                  <Input
                    label={t.dashboard?.clients?.city || 'City'}
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-3 mt-6"
        >
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            {t.dashboard?.common?.cancel || 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {t.dashboard?.common?.saving || 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t.dashboard?.common?.save || 'Save Changes'}
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Account Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {t.clientPortal?.profile?.accountStatus || 'Account Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600">
                  {t.clientPortal?.profile?.memberSince || 'Member since'}
                </p>
                <p className="font-medium text-slate-900">
                  {new Date(clientData.created_at).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  clientData.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : clientData.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {clientData.status === 'active'
                  ? t.dashboard?.clients?.statusActive || 'Active'
                  : clientData.status === 'pending'
                  ? t.dashboard?.clients?.statusPending || 'Pending'
                  : t.dashboard?.clients?.statusInactive || 'Inactive'}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardPage>
  );
}
