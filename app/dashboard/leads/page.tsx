'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Building2, MessageSquare } from 'lucide-react';
import { createClient } from '@/app/lib/supabase/client';
import { updateLeadStatus } from '@/app/lib/actions/leads';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Select } from '@/app/components/ui/Select';
import { Badge } from '@/app/components/ui/Badge';
import { Spinner } from '@/app/components/ui/Spinner';
import type { Lead, LeadStatus } from '@/app/lib/types/database';
import { useToast } from '@/app/components/ui/Toast';
import { useLanguage } from '@/app/context/LanguageContext';
import { enumOptions, leadSourceLabel, leadStatusLabel } from '@/app/lib/dashboard-labels';

/** Order only — labels come from the shared enum map. */
const LEAD_STATUS_ORDER = ['new', 'contacted', 'converted', 'closed'] as const;
const LEAD_SOURCE_ORDER = ['quiz', 'contact', 'newsletter'] as const;

function statusVariant(status: LeadStatus) {
  switch (status) {
    case 'new':
      return 'warning';
    case 'contacted':
      return 'info';
    case 'converted':
      return 'success';
    default:
      return 'default';
  }
}

export default function LeadsPage() {
  const { showError } = useToast();
  const { t } = useLanguage();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const supabase = useMemo(() => createClient(), []);

  const sourceOptions = useMemo(
    () =>
      enumOptions('leadSource', LEAD_SOURCE_ORDER, t, t.dashboard?.leads?.allSources || 'All sources'),
    [t],
  );
  const statusFilterOptions = useMemo(
    () =>
      enumOptions(
        'leadStatus',
        LEAD_STATUS_ORDER,
        t,
        t.dashboard?.common?.allStatuses || 'All statuses',
      ),
    [t],
  );
  // Same list without the "all" entry: this one sets a lead's status, so a
  // blank option would offer to clear it.
  const statusOptions = useMemo(() => enumOptions('leadStatus', LEAD_STATUS_ORDER, t), [t]);

  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoading(true);
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (sourceFilter) query = query.eq('source', sourceFilter);
      if (statusFilter) query = query.eq('status', statusFilter);
      const { data } = await query;
      setLeads((data as Lead[]) || []);
      setIsLoading(false);
    };
    fetchLeads();
  }, [supabase, sourceFilter, statusFilter]);

  const handleStatus = async (leadId: string, status: LeadStatus) => {
    const result = await updateLeadStatus({ leadId, status });
    if (!result.success) {
      showError(result.error);
      return;
    }
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <DashboardPage title={t.dashboard?.leads?.title || 'Leads'}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            options={sourceOptions}
            className="w-48"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusFilterOptions}
            className="w-48"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : leads.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">{t.dashboard?.leads?.empty || 'No leads yet.'}</Card>
        ) : (
          <div className="space-y-3">
            {leads.map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">
                          {lead.name || lead.email}
                        </span>
                        <Badge variant="default">{leadSourceLabel(lead.source, t)}</Badge>
                        <Badge variant={statusVariant(lead.status)}>
                          {leadStatusLabel(lead.status, t)}
                        </Badge>
                        <span className="text-xs text-slate-400 ml-auto">
                          {formatDate(lead.created_at)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 mt-2 text-sm text-slate-600">
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-amber-600">
                          <Mail className="w-3.5 h-3.5" /> {lead.email}
                        </a>
                        {lead.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> {lead.phone}
                          </span>
                        )}
                        {lead.company_name && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" /> {lead.company_name}
                          </span>
                        )}
                        {lead.message && (
                          <span className="flex items-start gap-1.5 text-slate-500">
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span className="whitespace-pre-wrap">{lead.message}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <Select
                      value={lead.status}
                      onChange={(e) => handleStatus(lead.id, e.target.value as LeadStatus)}
                      options={statusOptions}
                      className="w-40 flex-shrink-0"
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardPage>
  );
}
