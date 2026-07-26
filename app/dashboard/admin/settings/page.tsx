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
import { useLanguage } from '@/app/context/LanguageContext';

type FieldType = 'text' | 'textarea' | 'select';

/**
 * `labelKey` rather than a literal label, because this array is module-level:
 * `t` does not exist out here, and an earlier attempt to inline it produced a
 * reference error at import time. The label is resolved at render.
 *
 * `description` deliberately stays a plain English string — handleSave writes
 * it to system_settings.description, so it is stored data, not UI text, and
 * translating it would change what lands in the database depending on the
 * language the admin happened to be using.
 */
interface Setting {
  key: string;
  value: string;
  labelKey: string;
  labelFallback: string;
  description: string;
  type?: FieldType;
  options?: { value: string; labelKey: string; labelFallback: string }[];
}

const DEFAULT_SETTINGS: Setting[] = [
  // General
  { key: 'company_name', value: 'HorecaVergunning', labelKey: 'companyName', labelFallback: 'Company name', description: 'Shown in emails and documents.' },
  { key: 'notification_email', value: '', labelKey: 'notificationEmail', labelFallback: 'Notification email', description: 'Where system notifications are sent.' },
  { key: 'default_deadline_days', value: '30', labelKey: 'defaultDeadline', labelFallback: 'Default deadline (days)', description: 'Default number of days for case deadlines.' },
  // Public contact (shown on the website — key must stay public_*)
  { key: 'public_contact_email', value: '', labelKey: 'publicEmail', labelFallback: 'Public contact email', description: 'Shown in the website footer and contact page. Leave empty to keep the placeholder.' },
  { key: 'public_contact_phone', value: '', labelKey: 'publicPhone', labelFallback: 'Public phone number', description: 'Shown in the footer and contact page (as a tel: link).' },
  { key: 'public_contact_address', value: '', labelKey: 'publicAddress', labelFallback: 'Public address', description: 'Shown in the footer. Filling this in also enables LocalBusiness data for Google.' },
  { key: 'public_whatsapp_number', value: '', labelKey: 'whatsapp', labelFallback: 'WhatsApp number (digits only)', description: 'For the floating WhatsApp button, e.g. 31612345678.' },
  // Social proof
  {
    key: 'public_socialproof_mode',
    value: 'facts',
    labelKey: 'socialProofStyle',
    labelFallback: 'Social proof style',
    description: 'Show trust facts, or a row of client company names.',
    type: 'select',
    options: [
      { value: 'facts', labelKey: 'trustFacts', labelFallback: 'Trust facts (recommended)' },
      { value: 'companies', labelKey: 'clientCompanyNames', labelFallback: 'Client company names' },
    ],
  },
  {
    key: 'public_socialproof_companies',
    value: '',
    labelKey: 'clientCompanyNames',
    labelFallback: 'Client company names',
    description: 'One per line. Only shown when the style above is set to "Client company names". Only add clients who gave permission.',
    type: 'textarea',
  },
];

const SECTIONS: {
  titleKey: string;
  titleFallback: string;
  icon: typeof Settings;
  keys: string[];
}[] = [
  { titleKey: 'tabGeneral', titleFallback: 'General', icon: Settings, keys: ['company_name', 'notification_email', 'default_deadline_days'] },
  { titleKey: 'tabContact', titleFallback: 'Public contact details', icon: Phone, keys: ['public_contact_email', 'public_contact_phone', 'public_contact_address', 'public_whatsapp_number'] },
  { titleKey: 'tabSocial', titleFallback: 'Social proof', icon: Users, keys: ['public_socialproof_mode', 'public_socialproof_companies'] },
];

export default function SettingsPage() {
  const router = useRouter();
  const { showError } = useToast();
  const { t } = useLanguage();
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

  // Resolve a settings label/section title from its key, falling back to the
  // English text carried alongside it.
  const label = (key: string, fallback: string) =>
    (t.dashboard?.settings as unknown as Record<string, string> | undefined)?.[key] ?? fallback;

  // The helper line under each field. `setting.description` is what gets
  // WRITTEN to the database, so it stays English and stable; this is only what
  // the admin reads.
  const describe = (setting: Setting) =>
    (t.dashboard?.settings?.descriptions as Record<string, string> | undefined)?.[setting.key] ??
    setting.description;

  return (
    <DashboardPage title={t.dashboard?.settings?.title || 'System settings'}>
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
                    {t.dashboard?.common?.saving || 'Saving...'}
                  </>
                ) : saved ? (
                  t.dashboard?.common?.saved || 'Saved!'
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t.dashboard?.common?.saveChanges || 'Save changes'}
                  </>
                )}
              </Button>
            </div>

            {SECTIONS.map((section) => (
              <Card key={section.titleKey}>
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <CardTitle>{label(section.titleKey, section.titleFallback)}</CardTitle>
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
                              label={label(setting.labelKey, setting.labelFallback)}
                              value={setting.value}
                              onChange={(e) => handleChange(key, e.target.value)}
                              options={(setting.options || []).map((o) => ({ value: o.value, label: label(o.labelKey, o.labelFallback) }))}
                            />
                          ) : setting.type === 'textarea' ? (
                            <Textarea
                              label={label(setting.labelKey, setting.labelFallback)}
                              value={setting.value}
                              onChange={(e) => handleChange(key, e.target.value)}
                              rows={4}
                            />
                          ) : (
                            <Input
                              label={label(setting.labelKey, setting.labelFallback)}
                              value={setting.value}
                              onChange={(e) => handleChange(key, e.target.value)}
                            />
                          )}
                          <p className="mt-1 text-sm text-slate-500">{describe(setting)}</p>
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
