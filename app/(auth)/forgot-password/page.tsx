'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/app/lib/supabase/client';
import { useLanguage } from '@/app/context/LanguageContext';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Spinner } from '@/app/components/ui/Spinner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-slate-900">
              Horeca<span className="text-amber-500">Vergunning</span>
            </h1>
          </Link>
          <p className="mt-2 text-slate-600">
            {t.dashboard?.auth?.resetPasswordSubtitle || 'Reset your password'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {t.dashboard?.auth?.checkEmail || 'Check your email'}
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                {t.dashboard?.auth?.resetEmailSent ||
                  "We've sent a password reset link to your email address."}
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  {t.dashboard?.auth?.backToLogin || 'Back to login'}
                </Button>
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <p className="text-sm text-slate-600">
                {t.dashboard?.auth?.forgotPasswordInstructions ||
                  'Enter your email address and we will send you a link to reset your password.'}
              </p>

              <Input
                label={t.dashboard?.auth?.email || 'Email'}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                icon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" className="text-slate-900" />
                    {t.dashboard?.common?.loading || 'Loading...'}
                  </span>
                ) : (
                  t.dashboard?.auth?.sendResetLink || 'Send reset link'
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Back to login */}
        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
            &larr; {t.dashboard?.auth?.backToLogin || 'Back to login'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
