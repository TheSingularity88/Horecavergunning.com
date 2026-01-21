'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Spinner } from '@/app/components/ui/Spinner';
import Link from 'next/link';
import { dashboardRoutes } from '@/app/lib/routes/dashboard';
import type { CaseType, RequestUrgency } from '@/app/lib/types/database';

const REQUEST_TYPES: { value: CaseType; label: string; description: string }[] = [
  {
    value: 'exploitatievergunning',
    label: 'Exploitatievergunning',
    description: 'Operating permit for hospitality businesses',
  },
  {
    value: 'alcoholvergunning',
    label: 'Alcoholvergunning',
    description: 'License to serve alcoholic beverages',
  },
  {
    value: 'terrasvergunning',
    label: 'Terrasvergunning',
    description: 'Permit for outdoor seating/terrace',
  },
  {
    value: 'bibob',
    label: 'Bibob Screening',
    description: 'Integrity assessment for permit applications',
  },
  {
    value: 'overname',
    label: 'Business Takeover',
    description: 'Transfer permits to new owner',
  },
  {
    value: 'verbouwing',
    label: 'Renovation',
    description: 'Building/renovation permits',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other permit-related requests',
  },
];

interface FormData {
  request_type: CaseType | '';
  title: string;
  description: string;
  municipality: string;
  urgency: RequestUrgency;
}

export default function NewRequestPage() {
  const router = useRouter();
  const { clientData } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    request_type: '',
    title: '',
    description: '',
    municipality: '',
    urgency: 'normal',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const supabase = useMemo(() => createClient(), []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.request_type) {
      newErrors.request_type = t.clientPortal?.requests?.errors?.typeRequired || 'Please select a request type';
    }
    if (!formData.title.trim()) {
      newErrors.title = t.clientPortal?.requests?.errors?.titleRequired || 'Please enter a title';
    }
    if (!formData.description.trim()) {
      newErrors.description = t.clientPortal?.requests?.errors?.descriptionRequired || 'Please provide a description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !clientData?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('client_requests').insert({
        client_id: clientData.id,
        request_type: formData.request_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        municipality: formData.municipality.trim() || null,
        urgency: formData.urgency,
        status: 'pending',
      } as never);

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <DashboardPage>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center py-12"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t.clientPortal?.requests?.submitted || 'Request Submitted!'}
          </h1>
          <p className="text-slate-600 mb-6">
            {t.clientPortal?.requests?.submittedDesc ||
              'Thank you for your request. Our team will review it and get back to you within 2 business days.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={dashboardRoutes.client.requests}>
              <Button variant="outline">
                {t.clientPortal?.requests?.viewRequests || 'View My Requests'}
              </Button>
            </Link>
            <Link href={dashboardRoutes.client.base}>
              <Button>
                {t.clientPortal?.requests?.backToDashboard || 'Back to Dashboard'}
              </Button>
            </Link>
          </div>
        </motion.div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Link
          href={dashboardRoutes.client.requests}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t.dashboard?.common?.back || 'Back'}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {t.clientPortal?.requests?.newRequestTitle || 'Submit New Request'}
        </h1>
        <p className="text-slate-600 mt-1">
          {t.clientPortal?.requests?.newRequestSubtitle ||
            'Tell us about the permit you need and we\'ll get started'}
        </p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t.clientPortal?.requests?.selectType || 'What type of permit do you need?'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {REQUEST_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, request_type: type.value }))
                        }
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          formData.request_type === type.value
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-medium text-slate-900">{type.label}</p>
                        <p className="text-sm text-slate-500 mt-1">{type.description}</p>
                      </button>
                    ))}
                  </div>
                  {errors.request_type && (
                    <p className="text-red-500 text-sm mt-2">{errors.request_type}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Request Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t.clientPortal?.requests?.details || 'Request Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label={t.clientPortal?.requests?.titleLabel || 'Request Title'}
                    placeholder={t.clientPortal?.requests?.titlePlaceholder || 'e.g., New restaurant opening permit'}
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    error={errors.title}
                  />
                  <Textarea
                    label={t.clientPortal?.requests?.descriptionLabel || 'Description'}
                    placeholder={t.clientPortal?.requests?.descriptionPlaceholder ||
                      'Please describe your request in detail. Include any relevant information about your business, location, or specific requirements.'}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    error={errors.description}
                    rows={5}
                  />
                  <Input
                    label={t.clientPortal?.requests?.municipalityLabel || 'Municipality (optional)'}
                    placeholder={t.clientPortal?.requests?.municipalityPlaceholder || 'e.g., Amsterdam, Rotterdam'}
                    value={formData.municipality}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, municipality: e.target.value }))
                    }
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Urgency */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t.clientPortal?.requests?.urgency || 'Urgency'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, urgency: 'normal' }))}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        formData.urgency === 'normal'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-medium text-slate-900">
                        {t.clientPortal?.requests?.normalUrgency || 'Normal'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {t.clientPortal?.requests?.normalUrgencyDesc || 'Standard processing time'}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, urgency: 'urgent' }))}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        formData.urgency === 'urgent'
                          ? 'border-red-500 bg-red-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-medium text-slate-900">
                        {t.clientPortal?.requests?.urgentUrgency || 'Urgent'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {t.clientPortal?.requests?.urgentUrgencyDesc || 'Prioritized review (may incur additional fees)'}
                      </p>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        {t.clientPortal?.requests?.submitting || 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t.clientPortal?.requests?.submit || 'Submit Request'}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 text-center mt-3">
                    {t.clientPortal?.requests?.submitNote ||
                      'By submitting, you agree to our terms of service'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Help Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="pt-6">
                  <h4 className="font-medium text-slate-900 mb-2">
                    {t.clientPortal?.requests?.needHelp || 'Need Help?'}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {t.clientPortal?.requests?.needHelpDesc ||
                      'Not sure which permit you need? Our team is here to help. Contact us via WhatsApp or email.'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </form>
    </DashboardPage>
  );
}
