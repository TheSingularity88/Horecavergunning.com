'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Receipt, ExternalLink } from 'lucide-react';
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

function statusVariant(status: InvoiceStatus) {
  switch (status) {
    case 'paid':
      return 'success';
    case 'open':
      return 'warning';
    case 'failed':
    case 'expired':
    case 'canceled':
      return 'error';
    default:
      return 'default';
  }
}

export default function ClientInvoicesPage() {
  const { clientData } = useAuth();
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!clientData?.id) return;
    const fetchInvoices = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientData.id)
        .order('issued_at', { ascending: false });
      setInvoices((data as Invoice[]) || []);
      setIsLoading(false);
    };
    fetchInvoices();
  }, [supabase, clientData?.id]);

  const euro = (cents: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

  const handlePay = async (invoiceId: string) => {
    setPayingId(invoiceId);
    try {
      const result = await payMyInvoice(invoiceId);
      if (result.success && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
        return; // keep the spinner while the browser navigates away
      }
      alert(result.success ? 'Payment is not available for this invoice.' : result.error);
    } catch {
      // Server-action calls REJECT (not resolve) on a dropped connection or
      // after a redeploy invalidates the action id — without this the button
      // would stay disabled on its spinner until a full page reload.
      alert('Could not start the payment. Please check your connection and try again.');
    }
    setPayingId(null);
  };

  return (
    <DashboardPage>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-slate-900">
          {t.clientPortal?.invoices?.title || 'Invoices'}
        </h1>
        <p className="text-slate-600 mt-1">
          {t.clientPortal?.invoices?.subtitle || 'Your invoices and payment status'}
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : invoices.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">
            {t.clientPortal?.invoices?.empty || 'You have no invoices yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{inv.invoice_number}</p>
                    <Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {inv.description || '—'} · {formatDate(inv.issued_at)}
                  </p>
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {euro(inv.amount_cents)}
                </div>
                {inv.status === 'open' && inv.amount_cents > 0 && (
                  <Button
                    size="sm"
                    onClick={() => handlePay(inv.id)}
                    disabled={payingId === inv.id}
                    className="gap-1"
                  >
                    {payingId === inv.id ? (
                      <Spinner size="sm" className="text-slate-900" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    {t.clientPortal?.invoices?.payNow || 'Pay now'}
                  </Button>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardPage>
  );
}
