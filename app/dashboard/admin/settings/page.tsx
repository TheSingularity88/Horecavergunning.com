'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Save, Phone, Users } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase/client';
import { saveSystemSettings } from '@/app/lib/actions/settings';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Spinner } from '@/app/components/ui/Spinner';
import type { SystemSetting } from '@/app/lib/types/database';
import { useToast } from '@/app/components/ui/Toast';

type FieldType = 'text' | 'textarea' | 'select';

interface Setting {
  key: string;
  value: string;
  label: string;
  description: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
}

const DEFAULT_SETTINGS: Setting[] = [
  // General
  { key: 'company_name', value: 'HorecaVergunning', label: 'Company name', description: 'Shown in emails and documents.' },
  { key: 'notification_email', value: '', label: 'Notification email', description: 'Where system notifications are sent.' },
  { key: 'default_deadline_days', value: '30', label: 'Default deadline (days)', description: 'Default number of days for case deadlines.' },
  // Public contact (shown on the website — key must stay public_*)
  { key: 'public_contact_email', value: '', label: 'Public contact email', description: 'Shown in the website footer and contact page. Leave empty to keep the placeholder.' },
  { key: 'public_contact_phone', value: '', label: 'Public phone number', description: 'Shown in the footer and contact page (as a tel: link).' },
  { key: 'public_contact_address', value: '', label: 'Public address', description: 'Shown in the footer. Filling this in also enables LocalBusiness data for Google.' },
  { key: 'public_whatsapp_number', value: '', label: 'WhatsApp number (digits only)', description: 'For the floating WhatsApp button, e.g. 31612345678.' },
  // Social proof
  {
    key: 'public_socialproof_mode',
    value: 'facts',
    label: 'Social proof style',
    description: 'Show trust facts, or a row of client company names.',
    type: 'select',
    options: [
      { value: 'facts', label: 'Trust facts (recommended)' },
      { value: 'companies', label: 'Client company names' },
    ],
  },
  {
    key: 'public_socialproof_companies',
    value: '',
    label: 'Client company names',
    description: 'One per line. Only shown when the style above is set to "Client company names". Only add clients who gave permission.',
    type: 'textarea',
  },
];

const SECTIONS: { title: string; icon: typeof Settings; keys: string[] }[] = [
  { title: 'General', icon: Settings, keys: ['company_name', 'notification_email', 'default_deadline_days'] },
  { title: 'Public contact details', icon: Phone, keys: ['public_contact_email', 'public_contact_phone', 'public_contact_address', 'public_whatsapp_number'] },
  { title: 'Social proof', icon: Users, keys: ['public_socialproof_mode', 'public_socialproof_companies'] },
];

export default function SettingsPage() {
  const router = useRouter();
  const { showError } = useToast();
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<Setting[]>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('system_settings').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          const typedData = data as SystemSetting[];
          setSettings((prev) =>
            prev.map((s) => {
              const found = typedData.find((d) => d.key === s.key);
              return found ? { ...s, value: String(found.value ?? '') } : s;
            })
          );
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [isAdmin, router, supabase]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveSystemSettings({
      settings: settings.map((s) => ({ key: s.key, value: s.value, description: s.description })),
    });
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      showError(result.error);
    }
    setIsSaving(false);
  };

  if (!isAdmin) return null;

  const byKey = (key: string) => settings.find((s) => s.key === key);

  return (
    <DashboardPage title="System Settings">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="text-slate-900" />
                    Saving...
                  </>
                ) : saved ? (
                  'Saved!'
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

            {SECTIONS.map((section) => (
              <Card key={section.title}>
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {section.keys.map((key) => {
                      const setting = byKey(key);
                      if (!setting) return null;
                      const showCompanies =
                        key !== 'public_socialproof_companies' ||
                        byKey('public_socialproof_mode')?.value === 'companies';
                      if (!showCompanies) return null;
                      return (
                        <div key={key}>
                          {setting.type === 'select' ? (
                            <Select
                              label={setting.label}
                              value={setting.value}
                              onChange={(e) => handleChange(key, e.target.value)}
                              options={setting.options || []}
                            />
                          ) : setting.type === 'textarea' ? (
                            <Textarea
                              label={setting.label}
                              value={setting.value}
                              onChange={(e) => handleChange(key, e.target.value)}
                              rows={4}
                            />
                          ) : (
                            <Input
                              label={setting.label}
                              value={setting.value}
                              onChange={(e) => handleChange(key, e.target.value)}
                            />
                          )}
                          <p className="mt-1 text-sm text-slate-500">{setting.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </motion.div>
    </DashboardPage>
  );
}
