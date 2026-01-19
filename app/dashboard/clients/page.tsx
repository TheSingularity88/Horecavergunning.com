'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search, Building2, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { Header } from '@/app/components/dashboard/Header';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Badge, getStatusBadgeVariant } from '@/app/components/ui/Badge';
import { Table, Pagination } from '@/app/components/ui/Table';
import { Spinner } from '@/app/components/ui/Spinner';
import type { Client } from '@/app/lib/types/database';

const ITEMS_PER_PAGE = 10;

export default function ClientsPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('clients')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (search) {
          query = query.or(
            `company_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`
          );
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        setClients(data || []);
        setTotalCount(count || 0);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [supabase, search, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const columns = [
    {
      key: 'company_name',
      header: t.dashboard?.clients?.companyName || 'Company',
      render: (client: Client) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{client.company_name}</p>
            <p className="text-sm text-slate-500">{client.contact_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: t.dashboard?.clients?.contact || 'Contact',
      render: (client: Client) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Mail className="w-3.5 h-3.5" />
            {client.email}
          </div>
          {client.phone && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              {client.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'city',
      header: t.dashboard?.clients?.location || 'Location',
      render: (client: Client) => (
        <span className="text-slate-600">
          {client.city || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t.dashboard?.common?.status || 'Status',
      render: (client: Client) => (
        <Badge variant={getStatusBadgeVariant(client.status)}>
          {client.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-screen">
      <Header title={t.dashboard?.nav?.clients || 'Clients'} />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder={t.dashboard?.common?.searchPlaceholder || 'Search clients...'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            {isAdmin && (
              <Button
                onClick={() => router.push('/dashboard/clients/new')}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.dashboard?.clients?.addClient || 'Add Client'}
              </Button>
            )}
          </div>

          {/* Clients Table */}
          <Card padding="none">
            <Table
              columns={columns}
              data={clients}
              loading={isLoading}
              emptyMessage={t.dashboard?.clients?.noClients || 'No clients found'}
              onRowClick={(client) => router.push(`/dashboard/clients/${client.id}`)}
              keyExtractor={(client) => client.id}
            />
          </Card>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </motion.div>
      </div>
    </div>
  );
}
