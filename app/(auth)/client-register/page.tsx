'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building2, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Spinner } from '@/app/components/ui/Spinner';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  company_name: string;
  contact_name: string;
  kvk_number: string;
  phone: string;
}

function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    company_name: '',
    contact_name: '',
    kvk_number: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.contact_name.trim()) {
      newErrors.contact_name = 'Contact name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            user_type: 'client',
            company_name: formData.company_name.trim(),
            contact_name: formData.contact_name.trim(),
            kvk_number: formData.kvk_number.trim() || null,
            phone: formData.phone.trim() || null,
          },
        },
      });

      if (error) {
        setSubmitError(error.message);
      } else {
        setIsSuccess(true);
      }
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t.clientPortal?.auth?.registrationSuccess || 'Registration Successful!'}
          </h1>
          <p className="text-slate-600 mb-6">
            {t.clientPortal?.auth?.checkEmail ||
              'Please check your email to verify your account. Once verified, you can log in to your client portal.'}
          </p>
          <Link href="/login">
            <Button>
              {t.clientPortal?.auth?.goToLogin || 'Go to Login'}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-slate-900">
              Horeca<span className="text-amber-500">Vergunning</span>
            </h1>
          </Link>
          <p className="mt-2 text-slate-600">
            {t.clientPortal?.auth?.registerSubtitle || 'Create your client account'}
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </motion.div>
            )}

            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-slate-900">
                {t.clientPortal?.auth?.companyInfo || 'Company Information'}
              </h3>
              <Input
                label={t.dashboard?.clients?.companyName || 'Company Name'}
                value={formData.company_name}
                onChange={handleChange('company_name')}
                placeholder="Your company name"
                icon={<Building2 className="w-4 h-4" />}
                error={errors.company_name}
                required
              />
              <Input
                label={t.dashboard?.clients?.kvkNumber || 'KVK Number (optional)'}
                value={formData.kvk_number}
                onChange={handleChange('kvk_number')}
                placeholder="12345678"
                icon={<Building2 className="w-4 h-4" />}
              />
            </div>

            {/* Contact Info */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-medium text-slate-900">
                {t.clientPortal?.auth?.contactInfo || 'Contact Information'}
              </h3>
              <Input
                label={t.dashboard?.clients?.contactName || 'Contact Name'}
                value={formData.contact_name}
                onChange={handleChange('contact_name')}
                placeholder="Your full name"
                icon={<User className="w-4 h-4" />}
                error={errors.contact_name}
                required
              />
              <Input
                label={t.dashboard?.clients?.phone || 'Phone (optional)'}
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                placeholder="+31 6 12345678"
                icon={<Phone className="w-4 h-4" />}
              />
            </div>

            {/* Account Info */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-medium text-slate-900">
                {t.clientPortal?.auth?.accountInfo || 'Account Information'}
              </h3>
              <Input
                label={t.dashboard?.auth?.email || 'Email'}
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="name@company.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email}
                required
                autoComplete="email"
              />
              <Input
                label={t.dashboard?.auth?.password || 'Password'}
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                placeholder="Min. 8 characters"
                icon={<Lock className="w-4 h-4" />}
                error={errors.password}
                required
                autoComplete="new-password"
              />
              <Input
                label={t.clientPortal?.auth?.confirmPassword || 'Confirm Password'}
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                placeholder="Repeat your password"
                icon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" className="text-slate-900" />
                  {t.clientPortal?.auth?.creating || 'Creating account...'}
                </span>
              ) : (
                t.clientPortal?.auth?.register || 'Create Account'
              )}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              {t.clientPortal?.auth?.termsNote ||
                'By creating an account, you agree to our terms of service and privacy policy.'}
            </p>
          </form>
        </div>

        {/* Already have account */}
        <p className="mt-6 text-center text-sm text-slate-600">
          {t.clientPortal?.auth?.alreadyHaveAccount || 'Already have an account?'}{' '}
          <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
            {t.dashboard?.auth?.login || 'Sign in'}
          </Link>
        </p>

        {/* Back to home */}
        <p className="mt-2 text-center text-sm text-slate-600">
          <Link href="/" className="text-amber-600 hover:text-amber-700 font-medium">
            &larr; {t.dashboard?.auth?.backToHome || 'Back to homepage'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function RegisterFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}

export default function ClientRegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
