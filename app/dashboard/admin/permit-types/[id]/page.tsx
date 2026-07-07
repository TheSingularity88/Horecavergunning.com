'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase/client';
import { savePermitType, saveRequiredDocuments } from '@/app/lib/actions/permit-types';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Spinner } from '@/app/components/ui/Spinner';
import type { PermitType, RequiredDocument } from '@/app/lib/types/database';

interface DocRow {
  id?: string;
  name_nl: string;
  name_en: string;
  is_required: boolean;
}

export default function EditPermitTypePage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';
  const permitTypeId = params.id as string;
  const { isAdmin } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    slug: '',
    name_nl: '',
    name_en: '',
    description_nl: '',
    description_en: '',
    fee_euros: 0,
    is_active: true,
    sort_order: 0,
  });
  const [docs, setDocs] = useState<DocRow[]>([]);

  useEffect(() => {
    if (!isAdmin) router.push('/dashboard');
  }, [isAdmin, router]);

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      const [{ data: pt }, { data: rd }] = await Promise.all([
        supabase.from('permit_types').select('*').eq('id', permitTypeId).maybeSingle(),
        supabase
          .from('required_documents')
          .select('*')
          .eq('permit_type_id', permitTypeId)
          .order('sort_order'),
      ]);
      if (pt) {
        const p = pt as PermitType;
        setForm({
          slug: p.slug,
          name_nl: p.name_nl,
          name_en: p.name_en,
          description_nl: p.description_nl || '',
          description_en: p.description_en || '',
          fee_euros: p.base_fee_cents / 100,
          is_active: p.is_active,
          sort_order: p.sort_order,
        });
      }
      setDocs(
        ((rd as RequiredDocument[]) || []).map((d) => ({
          id: d.id,
          name_nl: d.name_nl,
          name_en: d.name_en,
          is_required: d.is_required,
        }))
      );
      setIsLoading(false);
    };
    load();
  }, [supabase, permitTypeId, isNew]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    const result = await savePermitType({
      id: isNew ? undefined : permitTypeId,
      slug: form.slug,
      name_nl: form.name_nl,
      name_en: form.name_en,
      description_nl: form.description_nl,
      description_en: form.description_en,
      fee_euros: Number(form.fee_euros),
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
    });

    if (!result.success) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    const savedId = result.data!.id;
    const docResult = await saveRequiredDocuments({
      permitTypeId: savedId,
      documents: docs.map((d, i) => ({
        id: d.id,
        name_nl: d.name_nl,
        name_en: d.name_en,
        is_required: d.is_required,
        sort_order: i,
      })),
    });
    if (!docResult.success) {
      setError(docResult.error);
      setIsSaving(false);
      return;
    }

    router.push('/dashboard/admin/permit-types');
  };

  if (!isAdmin) return null;

  return (
    <DashboardPage title={isNew ? 'New Permit Type' : 'Edit Permit Type'}>
      <button
        onClick={() => router.push('/dashboard/admin/permit-types')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to permit types
      </button>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl space-y-6"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Slug (internal id, lowercase)"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="exploitatievergunning"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Name (NL)"
                  value={form.name_nl}
                  onChange={(e) => setForm((f) => ({ ...f, name_nl: e.target.value }))}
                />
                <Input
                  label="Name (EN)"
                  value={form.name_en}
                  onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                />
              </div>
              <Textarea
                label="Description (NL)"
                value={form.description_nl}
                onChange={(e) => setForm((f) => ({ ...f, description_nl: e.target.value }))}
                rows={2}
              />
              <Textarea
                label="Description (EN)"
                value={form.description_en}
                onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
                rows={2}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Fee (€, one-time)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.fee_euros}
                  onChange={(e) => setForm((f) => ({ ...f, fee_euros: Number(e.target.value) }))}
                />
                <Input
                  label="Sort order"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                />
                <label className="flex items-end gap-2 pb-2.5">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700">Active (shown publicly)</span>
                </label>
              </div>
              <p className="text-xs text-slate-400">
                Set the fee to 0 to show &quot;Custom / on request&quot; on the pricing page.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Required documents (checklist)</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDocs((d) => [...d, { name_nl: '', name_en: '', is_required: true }])
                }
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {docs.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No documents yet. These become the client&apos;s checklist when a case of this
                  type is created.
                </p>
              ) : (
                <div className="space-y-3">
                  {docs.map((doc, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                        <Input
                          placeholder="Naam (NL)"
                          value={doc.name_nl}
                          onChange={(e) =>
                            setDocs((prev) =>
                              prev.map((d, idx) =>
                                idx === i ? { ...d, name_nl: e.target.value } : d
                              )
                            )
                          }
                        />
                        <Input
                          placeholder="Name (EN)"
                          value={doc.name_en}
                          onChange={(e) =>
                            setDocs((prev) =>
                              prev.map((d, idx) =>
                                idx === i ? { ...d, name_en: e.target.value } : d
                              )
                            )
                          }
                        />
                      </div>
                      <label className="flex items-center gap-1 pt-2.5 text-xs text-slate-500 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={doc.is_required}
                          onChange={(e) =>
                            setDocs((prev) =>
                              prev.map((d, idx) =>
                                idx === i ? { ...d, is_required: e.target.checked } : d
                              )
                            )
                          }
                          className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                        Req.
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDocs((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-red-600 hover:bg-red-50 pt-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard/admin/permit-types')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Spinner size="sm" className="text-slate-900" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </div>
        </motion.div>
      )}
    </DashboardPage>
  );
}
