'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search, UserCog, Mail, Phone, Shield, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase/client';
import { createStaffUser, changeUserRole, setUserActive } from '@/app/lib/actions/admin-users';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Badge, getStatusBadgeVariant } from '@/app/components/ui/Badge';
import { Avatar } from '@/app/components/ui/Avatar';
import { Table } from '@/app/components/ui/Table';
import { Modal } from '@/app/components/ui/Modal';
import { Spinner } from '@/app/components/ui/Spinner';
import type { Client, Profile } from '@/app/lib/types/database';
import { useToast } from '@/app/components/ui/Toast';
import { useLanguage } from '@/app/context/LanguageContext';
import { clientStatusLabel, roleLabel } from '@/app/lib/dashboard-labels';

export default function UsersPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { showError } = useToast();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'employee',
    password: '',
  });

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (search) {
          query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        if (roleFilter) {
          query = query.eq('role', roleFilter);
        }

        const { data, error } = await query;
        if (error) throw error;
        setUsers((data as Profile[]) || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [supabase, search, roleFilter]);

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        let query = supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (clientSearch) {
          query = query.or(
            `company_name.ilike.%${clientSearch}%,contact_name.ilike.%${clientSearch}%,email.ilike.%${clientSearch}%`
          );
        }

        const { data, error } = await query;
        if (error) throw error;
        setClients((data as Client[]) || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, [supabase, clientSearch]);

  const handleCreateUser = async () => {
    setError(null);
    setIsCreating(true);

    // Server action: runs with the service role after verifying the caller
    // is an admin. Does NOT touch this browser's session (the old client-side
    // signUp used to log the admin out and log the new user in).
    const result = await createStaffUser({
      email: newUser.email,
      full_name: newUser.full_name,
      password: newUser.password,
      role: newUser.role as 'employee' | 'admin',
    });

    if (!result.success) {
      setError(result.error);
      setIsCreating(false);
      return;
    }

    // Refresh user list
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) || []);

    setShowCreateModal(false);
    setNewUser({ email: '', full_name: '', role: 'employee', password: '' });
    setIsCreating(false);
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    const result = await setUserActive({ userId, isActive: !isActive });
    if (!result.success) {
      showError(result.error);
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: !isActive } : u))
    );
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const result = await changeUserRole({
      userId,
      role: newRole as 'employee' | 'admin',
    });
    if (!result.success) {
      showError(result.error);
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole as 'admin' | 'employee' } : u))
    );
  };

  const roleOptions = [
    { value: '', label: t.dashboard?.users?.allRoles || 'All roles' },
    { value: 'admin', label: roleLabel('admin', t) },
    { value: 'employee', label: roleLabel('employee', t) },
  ];

  const columns = [
    {
      key: 'user',
      header: t.dashboard?.users?.colUser || 'User',
      render: (user: Profile) => (
        <div className="flex items-center gap-3">
          <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{user.full_name}</p>
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: t.dashboard?.users?.colRole || 'Role',
      render: (user: Profile) => (
        <Select
          value={user.role}
          onChange={(e) => handleRoleChange(user.id, e.target.value)}
          options={[
            { value: 'employee', label: roleLabel('employee', t) },
            { value: 'admin', label: roleLabel('admin', t) },
          ]}
          className="w-32"
        />
      ),
    },
    {
      key: 'status',
      header: t.dashboard?.common?.status || 'Status',
      render: (user: Profile) => (
        <Badge variant={user.is_active ? 'success' : 'default'}>
          {user.is_active ? clientStatusLabel('active', t) : clientStatusLabel('inactive', t)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t.dashboard?.common?.actions || 'Actions',
      render: (user: Profile) => (
        <Button
          variant={user.is_active ? 'outline' : 'primary'}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive(user.id, user.is_active);
          }}
        >
          {user.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  const clientColumns = [
    {
      key: 'company_name',
      header: t.dashboard?.users?.colCompany || 'Company',
      render: (client: Client) => (
        <div className="flex items-center gap-3">
          <Avatar name={client.company_name} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{client.company_name}</p>
            <p className="text-sm text-slate-500">{client.contact_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: t.dashboard?.users?.colContact || 'Contact',
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
      key: 'status',
      header: t.dashboard?.common?.status || 'Status',
      render: (client: Client) => (
        <Badge variant={getStatusBadgeVariant(client.status)}>
          {clientStatusLabel(client.status, t)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t.dashboard?.common?.actions || 'Actions',
      render: (client: Client) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/clients/${client.id}`)}
        >
          {t.dashboard?.common?.view || 'View'}
        </Button>
      ),
    },
  ];

  if (!isAdmin) return null;

  return (
    <DashboardPage title={t.dashboard?.users?.title || 'User management'}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder={t.dashboard?.users?.searchUsers || 'Search users...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={roleOptions}
              className="w-36"
            />
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t.dashboard?.users?.addUser || 'Add user'}
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card padding="none">
          <Table
            columns={columns}
            data={users}
            loading={isLoading}
            emptyMessage={t.dashboard?.users?.noUsers || 'No users found'}
            keyExtractor={(user) => user.id}
          />
        </Card>

        {/* Clients Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t.dashboard?.nav?.clients || 'Clients'}
          </h2>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder={t.dashboard?.users?.searchClients || 'Search clients...'}
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>

          <Card padding="none">
            <Table
              columns={clientColumns}
              data={clients}
              loading={isLoadingClients}
              emptyMessage={t.dashboard?.users?.noClients || 'No clients found'}
              keyExtractor={(client) => client.id}
            />
          </Card>
        </div>
      </motion.div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t.dashboard?.users?.createUser || 'Create new user'}
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <Input
            label={t.dashboard?.common?.fullName || 'Full name'}
            value={newUser.full_name}
            onChange={(e) => setNewUser((prev) => ({ ...prev, full_name: e.target.value }))}
            required
          />

          <Input
            label={t.dashboard?.clients?.email || 'Email'}
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
            required
          />

          <Input
            label={t.dashboard?.auth?.password || 'Password'}
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
            required
          />

          <Select
            label={t.dashboard?.common?.role || 'Role'}
            value={newUser.role}
            onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
            options={[
              { value: 'employee', label: roleLabel('employee', t) },
              { value: 'admin', label: roleLabel('admin', t) },
            ]}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              {t.dashboard?.common?.cancel || 'Cancel'}
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" className="text-slate-900" />
                  Creating...
                </span>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardPage>
  );
}
