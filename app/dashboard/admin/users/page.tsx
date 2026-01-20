'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search, UserCog, Mail, Shield, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { Header } from '@/app/components/dashboard/Header';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Badge } from '@/app/components/ui/Badge';
import { Avatar } from '@/app/components/ui/Avatar';
import { Table } from '@/app/components/ui/Table';
import { Modal } from '@/app/components/ui/Modal';
import { Spinner } from '@/app/components/ui/Spinner';
import type { Profile } from '@/app/lib/types/database';

export default function UsersPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
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

  const handleCreateUser = async () => {
    setError(null);
    setIsCreating(true);

    try {
      // Create auth user with metadata
      const { error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            role: newUser.role,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Refresh user list
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers((data as Profile[]) || []);

      setShowCreateModal(false);
      setNewUser({ email: '', full_name: '', role: 'employee', password: '' });
    } catch (err: unknown) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive } as unknown as never)
        .eq('id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !isActive } : u))
      );
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole } as unknown as never)
        .eq('id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as 'admin' | 'employee' } : u))
      );
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'employee', label: 'Employee' },
  ];

  const columns = [
    {
      key: 'user',
      header: 'User',
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
      header: 'Role',
      render: (user: Profile) => (
        <Select
          value={user.role}
          onChange={(e) => handleRoleChange(user.id, e.target.value)}
          options={[
            { value: 'employee', label: 'Employee' },
            { value: 'admin', label: 'Admin' },
          ]}
          className="w-32"
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: Profile) => (
        <Badge variant={user.is_active ? 'success' : 'default'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
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

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col h-screen">
      <Header title="User Management" />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Actions Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search users..."
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
                Add User
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <Card padding="none">
            <Table
              columns={columns}
              data={users}
              loading={isLoading}
              emptyMessage="No users found"
              keyExtractor={(user) => user.id}
            />
          </Card>
        </motion.div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            value={newUser.full_name}
            onChange={(e) => setNewUser((prev) => ({ ...prev, full_name: e.target.value }))}
            required
          />

          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
            required
          />

          <Input
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
            required
          />

          <Select
            label="Role"
            value={newUser.role}
            onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
            options={[
              { value: 'employee', label: 'Employee' },
              { value: 'admin', label: 'Admin' },
            ]}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
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
    </div>
  );
}
