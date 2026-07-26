'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Pencil, Tag } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase/client';
import { setPermitTypeActive } from '@/app/lib/actions/permit-types';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Spinner } from '@/app/components/ui/Spinner';
import type { PermitType } from '@/app/lib/types/database';
import { useToast } from '@/app/components/ui/Toast';

export default function PermitTypesPage() {
  const router = useRouter();
  const { showError } = useToast();
  const { isAdmin } = useAuth();
  const [permitTypes, setPermitTypes] = useState<PermitType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data } = await supabase
        .from('permit_types')
        .select('*')
        .order('sort_order');
      setPermitTypes((data as PermitType[]) || []);
      setIsLoading(false);
    };
    fetchTypes();
  }, [supabase]);

  const euro = (cents: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const handleToggle = async (pt: PermitType) => {
    const result = await setPermitTypeActive(pt.id, !pt.is_active);
    if (!result.success) {
      showError(result.error);
      return;
    }
    setPermitTypes((prev) =>
      prev.map((p) => (p.id === pt.id ? { ...p, is_active: !p.is_active } : p))
    );
  };

  if (!isAdmin) return null;

  return (
    <DashboardPage title="Permit Types & Pricing">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-600 text-sm max-w-xl">
            Edit the fee, names and required documents for each permit type. Fees and
            active types are shown live on the public pricing section.
          </p>
          <Button
            onClick={() => router.push('/dashboard/admin/permit-types/new')}
            className="gap-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add type
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permitTypes.map((pt, i) => (
              <motion.div
                key={pt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
                      <Tag className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 truncate">{pt.name_nl}</h3>
                        <Badge variant={pt.is_active ? 'success' : 'default'}>
                          {pt.is_active ? 'Active' : 'Hidden'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{pt.slug}</p>
                      <p className="text-lg font-semibold text-slate-900 mt-1">
                        {pt.base_fee_cents > 0 ? euro(pt.base_fee_cents) : 'Custom / on request'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/admin/permit-types/${pt.id}`)}
                      className="gap-1 flex-1"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant={pt.is_active ? 'ghost' : 'primary'}
                      size="sm"
                      onClick={() => handleToggle(pt)}
                    >
                      {pt.is_active ? 'Hide' : 'Show'}
                    </Button>
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
