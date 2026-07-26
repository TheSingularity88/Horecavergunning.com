'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';

/**
 * Non-blocking notifications, replacing window.alert() in the portal.
 *
 * alert() was wrong here for three reasons, not one: it freezes the page until
 * dismissed, it is unstyled browser chrome in the middle of an otherwise
 * designed product, and on iOS Safari it can be suppressed entirely — so a
 * failed upload could report nothing at all and look like success.
 *
 * Errors are the reason this exists, so they behave differently from the rest:
 * they linger long enough to be read and re-read (10s vs 4s). Everything is
 * dismissible by hand regardless.
 */

type ToastVariant = 'error' | 'success' | 'info';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastApi {
  /** Show a message. Errors stay on screen longer; all are dismissible. */
  showToast: (message: string, variant?: ToastVariant) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DURATION_MS: Record<ToastVariant, number> = {
  error: 10_000,
  success: 4_000,
  info: 6_000,
};

const VARIANT_STYLES: Record<ToastVariant, { wrap: string; icon: string }> = {
  error: { wrap: 'border-red-200 bg-red-50', icon: 'text-red-600' },
  success: { wrap: 'border-green-200 bg-green-50', icon: 'text-green-600' },
  info: { wrap: 'border-blue-200 bg-blue-50', icon: 'text-blue-600' },
};

const VARIANT_ICONS: Record<ToastVariant, typeof AlertCircle> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export function ToastProvider({
  children,
  dismissLabel = 'Sluiten',
}: {
  children: React.ReactNode;
  /** aria-label for the dismiss button; pass the translated string. */
  dismissLabel?: string;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // A ref, not a module-level counter: two portals mounted in one page would
  // otherwise share (and fight over) the same id sequence.
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'error') => {
      // An empty message would render a blank box the user cannot interpret;
      // better to drop it than to show chrome around nothing.
      if (!message) return;

      nextId.current += 1;
      const id = nextId.current;
      setToasts((current) => [...current, { id, variant, message }]);
      setTimeout(() => dismiss(id), DURATION_MS[variant]);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      showToast,
      showError: (message: string) => showToast(message, 'error'),
      showSuccess: (message: string) => showToast(message, 'success'),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/*
        Above the modal layer (z-50) on purpose: a failure raised from inside a
        dialog has to be visible, and the dialog stays open behind it.
        aria-live is on the persistent container, not the individual toast, so
        screen readers announce items as they are inserted.
      */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = VARIANT_ICONS[toast.variant];
            const styles = VARIANT_STYLES[toast.variant];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                // role="alert" only on errors: it interrupts the screen reader,
                // which is right for a failure and rude for a confirmation.
                role={toast.variant === 'error' ? 'alert' : 'status'}
                className={cn(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg',
                  styles.wrap,
                )}
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', styles.icon)} />
                <p className="min-w-0 flex-1 text-sm text-slate-800">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label={dismissLabel}
                  className="-m-1 shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a <ToastProvider>.');
  }
  return context;
}
