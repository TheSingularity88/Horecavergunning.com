'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Save } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { Header } from '@/app/components/dashboard/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Spinner } from '@/app/components/ui/Spinner';
import type { SystemSetting } from '@/app/lib/types/database';

interface Setting {
  key: string;
  value: string;
  description: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { isAdmin, profile } = useAuth();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<Setting[]>([
    { key: 'company_name', value: 'HorecaVergunning', description: 'Company name displayed in emails and documents' },
    { key: 'support_email', value: 'info@horecavergunning.com', description: 'Support email address' },
    { key: 'default_deadline_days', value: '30', description: 'Default number of days for case deadlines' },
    { key: 'notification_email', value: '', description: 'Email for system notifications' },
  ]);
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
          const loadedSettings = settings.map((s) => {
            const found = typedData.find((d) => d.key === s.key);
            return found ? { ...s, value: String(found.value) } : s;
          });
          setSettings(loadedSettings);
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
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updated_by: profile?.id,
          } as unknown as never, { onConflict: 'key' });

        if (error) throw error;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col h-screen">
      <Header title="System Settings" />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-slate-600" />
                  </div>
                  <CardTitle>General Settings</CardTitle>
                </div>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {settings.map((setting) => (
                    <div key={setting.key}>
                      <Input
                        label={setting.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        value={setting.value}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                      />
                      <p className="mt-1 text-sm text-slate-500">{setting.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
