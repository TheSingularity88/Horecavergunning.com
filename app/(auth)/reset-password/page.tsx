'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/app/lib/supabase/client';
import { useLanguage } from '@/app/context/LanguageContext';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Spinner } from '@/app/components/ui/Spinner';

/**
 * Target of the password-recovery email (see forgot-password/page.tsx).
 * The recovery link signs the user in with a temporary session; this page
 * lets them set a new password via supabase.auth.updateUser.
 */
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // The recovery link must have produced a session; otherwise the link is
  // invalid or expired.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(
        t.dashboard?.auth?.passwordTooShort || 'Password must be at least 8 characters.'
      );
      return;
    }
    if (password !== confirmPassword) {
      setError(t.dashboard?.auth?.passwordMismatch || 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2500);
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
            {t.dashboard?.auth?.chooseNewPassword || 'Choose a new password'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {hasSession === null ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : !hasSession ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {t.dashboard?.auth?.invalidResetLink || 'Invalid or expired link'}
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                {t.dashboard?.auth?.requestNewLink ||
                  'This password reset link is invalid or has expired. Please request a new one.'}
              </p>
              <Link href="/forgot-password">
                <Button variant="outline" className="w-full">
                  {t.dashboard?.auth?.sendResetLink || 'Send reset link'}
                </Button>
              </Link>
            </div>
          ) : success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {t.dashboard?.auth?.passwordUpdated || 'Password updated'}
              </h2>
              <p className="text-slate-600 text-sm">
                {t.dashboard?.auth?.redirectingToLogin ||
                  'Your password has been changed. Redirecting to login…'}
              </p>
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

              <Input
                label={t.dashboard?.auth?.newPassword || 'New password'}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                required
                autoComplete="new-password"
              />

              <Input
                label={t.dashboard?.auth?.confirmPassword || 'Confirm password'}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                required
                autoComplete="new-password"
              />

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" className="text-slate-900" />
                    {t.dashboard?.common?.loading || 'Loading...'}
                  </span>
                ) : (
                  t.dashboard?.auth?.updatePassword || 'Update password'
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
            &larr; {t.dashboard?.auth?.backToLogin || 'Back to login'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
