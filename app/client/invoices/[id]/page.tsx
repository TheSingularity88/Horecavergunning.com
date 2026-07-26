'use client';
import { invoiceStatusLabel } from '@/app/lib/status-labels';
import { actionErrorMessage, networkErrorMessage } from '@/app/lib/action-messages';
import { useToast } from '@/app/components/ui/Toast';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { payMyInvoice } from '@/app/lib/actions/billing';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Spinner } from '@/app/components/ui/Spinner';
import type { Invoice, InvoiceStatus } from '@/app/lib/types/database';

/**
 * Mollie redirects the client here after checkout. The webhook is the source
 * of truth for the status; this page just reflects the current invoice state
 * (and lets them retry if still open).
 */
export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { clientData } = useAuth();
  const { t } = useLanguage();
  const { showError } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!clientData?.id) return;
    const fetchInvoice = async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .maybeSingle();
      setInvoice((data as Invoice) || null);
      setIsLoading(false);
    };
    fetchInvoice();
  }, [supabase, invoiceId, clientData?.id]);

  const euro = (cents: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const handlePay = async () => {
    setPaying(true);
    try {
      const result = await payMyInvoice(invoiceId);
      if (result.success && result.data?.checkoutUrl) {
        // assign() rather than `location.href =`: identical behaviour, but the
        // React Compiler lint reads the assignment as mutating outside state.
        window.location.assign(result.data.checkoutUrl);
        return; // keep the spinner while the browser navigates away
      }
      // Succeeded but gave us no checkout url: Mollie accepted nothing to pay.
      showError(
        result.success
          ? t.clientPortal?.errors?.paymentUnavailable ||
              'This invoice cannot be paid online right now.'
          : actionErrorMessage(result, t),
      );
    } catch {
      // Server-action calls REJECT (not resolve) on a dropped connection or
      // after a redeploy invalidates the action id — without this the button
      // would stay disabled on its spinner until a full page reload.
      showError(networkErrorMessage(t));
    }
    setPaying(false);
  };

  // Icon and colour per status; the label always comes from the shared map so
  // draft/expired/canceled can't stay English while the rest is translated.
  const statusUi: Record<InvoiceStatus, { icon: typeof CheckCircle; color: string }> = {
    paid: { icon: CheckCircle, color: 'text-green-600' },
    open: { icon: Clock, color: 'text-amber-600' },
    draft: { icon: Clock, color: 'text-slate-400' },
    failed: { icon: XCircle, color: 'text-red-600' },
    expired: { icon: XCircle, color: 'text-red-600' },
    canceled: { icon: XCircle, color: 'text-red-600' },
  };

  return (
    <DashboardPage>
      <Link
        href="/client/invoices"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.clientPortal?.invoices?.title || 'Invoices'}
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !invoice ? (
        <Card className="p-8 text-center text-slate-500">Invoice not found.</Card>
      ) : (
        <motion.div initial={{ opacity: 1, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 max-w-xl">
            {(() => {
              const ui = statusUi[invoice.status];
              const Icon = ui.icon;
              return (
                <div className="flex items-center gap-3 mb-6">
                  <Icon className={`w-8 h-8 ${ui.color}`} />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {invoiceStatusLabel(invoice.status, t)}
                    </p>
                    <p className="text-sm text-slate-500">{invoice.invoice_number}</p>
                  </div>
                  <Badge
                    variant={invoice.status === 'paid' ? 'success' : invoice.status === 'open' ? 'warning' : 'error'}
                    className="ml-auto"
                  >
                    {invoiceStatusLabel(invoice.status, t)}
                  </Badge>
                </div>
              );
            })()}

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{invoice.description || '—'}</span>
                <span className="font-medium text-slate-900">{euro(invoice.amount_cents)}</span>
              </div>
            </div>

            {invoice.status === 'open' && invoice.amount_cents > 0 && (
              <Button onClick={handlePay} disabled={paying} className="w-full mt-6">
                {paying ? <Spinner size="sm" className="text-slate-900" /> : (t.clientPortal?.invoices?.payNow || 'Pay now')}
              </Button>
            )}
          </Card>
        </motion.div>
      )}
    </DashboardPage>
  );
}
