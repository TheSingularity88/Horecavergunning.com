'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, KeyRound, Pause, Play, Pencil, Plus } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import {
  getAiAdminData,
  saveAiProvider,
  deactivateAiProvider,
  createAiEmployee,
  updateAiEmployee,
  type AiProviderView,
  type AiEmployeeView,
} from '@/app/lib/actions/ai-admin';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Modal, ConfirmModal } from '@/app/components/ui/Modal';
import { Spinner } from '@/app/components/ui/Spinner';
import { useToast } from '@/app/components/ui/Toast';

/**
 * Admin control room for the AI system: provider API keys (Route 1) and the
 * AI employees that use them. All data flows through admin-guarded server
 * actions — the underlying tables are deny-all at RLS, and a provider key is
 * visible in the browser exactly once: while the admin is typing it.
 */
export default function AiAdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { showError } = useToast();
  const ai = t.dashboard?.ai;

  const [providers, setProviders] = useState<AiProviderView[]>([]);
  const [employees, setEmployees] = useState<AiEmployeeView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [providerForm, setProviderForm] = useState({
    provider: 'anthropic' as const,
    label: '',
    api_key: '',
    default_model: 'claude-opus-5',
  });
  const [pendingDeactivate, setPendingDeactivate] = useState<AiProviderView | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<AiEmployeeView | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    job_description: '',
    provider_id: '',
    model: '',
    max_runs_per_day: 20,
    is_paused: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/dashboard');
  }, [authLoading, isAdmin, router]);

  const fetchData = useCallback(async () => {
    const result = await getAiAdminData();
    if (result.success && result.data) {
      setProviders(result.data.providers);
      setEmployees(result.data.employees);
    } else if (!result.success) {
      showError(result.error);
    }
    setIsLoading(false);
  }, [showError]);

  useEffect(() => {
    if (!isAdmin) return;
    // Load inline (not by calling the useCallback directly) so the React
    // Compiler treats the setState as the async-subscription callback rather
    // than a synchronous effect-body update.
    let cancelled = false;
    const load = async () => {
      const result = await getAiAdminData();
      if (cancelled) return;
      if (result.success && result.data) {
        setProviders(result.data.providers);
        setEmployees(result.data.employees);
      } else if (!result.success) {
        showError(result.error);
      }
      setIsLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, showError]);

  const submitProvider = async () => {
    setIsSaving(true);
    const result = await saveAiProvider(providerForm);
    if (!result.success) showError(result.error);
    else {
      setShowProviderModal(false);
      setProviderForm({ provider: 'anthropic', label: '', api_key: '', default_model: 'claude-opus-5' });
      await fetchData();
    }
    setIsSaving(false);
  };

  const performDeactivate = async () => {
    if (!pendingDeactivate) return;
    setIsSaving(true);
    const result = await deactivateAiProvider({ id: pendingDeactivate.id });
    if (!result.success) showError(result.error);
    else await fetchData();
    setIsSaving(false);
    setPendingDeactivate(null);
  };

  const openCreateEmployee = () => {
    setEditEmployee(null);
    setEmployeeForm({
      name: '',
      job_description: '',
      provider_id: providers.find((p) => p.is_active)?.id ?? '',
      model: '',
      max_runs_per_day: 20,
      is_paused: false,
    });
    setShowEmployeeModal(true);
  };

  const openEditEmployee = (employee: AiEmployeeView) => {
    setEditEmployee(employee);
    setEmployeeForm({
      name: employee.full_name,
      job_description: employee.config.job_description,
      provider_id: employee.config.provider_id ?? '',
      model: employee.config.model ?? '',
      max_runs_per_day: employee.config.max_runs_per_day,
      is_paused: employee.config.is_paused,
    });
    setShowEmployeeModal(true);
  };

  const submitEmployee = async () => {
    setIsSaving(true);
    const base = {
      job_description: employeeForm.job_description,
      provider_id: employeeForm.provider_id,
      model: employeeForm.model.trim() || null,
      max_runs_per_day: employeeForm.max_runs_per_day,
    };
    const result = editEmployee
      ? await updateAiEmployee({
          ...base,
          profile_id: editEmployee.profile_id,
          is_paused: employeeForm.is_paused,
        })
      : await createAiEmployee({ ...base, name: employeeForm.name });
    if (!result.success) showError(result.error);
    else {
      setShowEmployeeModal(false);
      await fetchData();
    }
    setIsSaving(false);
  };

  const togglePause = async (employee: AiEmployeeView) => {
    const result = await updateAiEmployee({
      profile_id: employee.profile_id,
      job_description: employee.config.job_description,
      provider_id: employee.config.provider_id ?? '',
      model: employee.config.model,
      max_runs_per_day: employee.config.max_runs_per_day,
      is_paused: !employee.config.is_paused,
    });
    if (!result.success) showError(result.error);
    else await fetchData();
  };

  if (!isAdmin) return null;

  const activeProviders = providers.filter((p) => p.is_active);

  return (
    <DashboardPage title={ai?.title || 'AI employees'}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="mb-6 max-w-2xl text-sm text-slate-600">{ai?.intro}</p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Providers */}
            <section>
              <div className="mb-2 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <KeyRound className="h-5 w-5 text-slate-500" />
                  {ai?.tabProviders || 'AI providers'}
                </h2>
                <Button size="sm" onClick={() => setShowProviderModal(true)} className="gap-1">
                  <Plus className="h-4 w-4" />
                  {ai?.addProvider || 'Add provider key'}
                </Button>
              </div>
              <p className="mb-4 max-w-2xl text-sm text-slate-500">{ai?.providersIntro}</p>

              {providers.length === 0 ? (
                <Card className="p-6 text-center text-slate-500">{ai?.noProviders}</Card>
              ) : (
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <Card key={provider.id} className="flex items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">{provider.label}</span>
                          <Badge variant="info">{provider.provider}</Badge>
                          {!provider.is_active && (
                            <Badge variant="default">{ai?.inactiveBadge || 'Inactive'}</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 font-mono text-sm text-slate-500">
                          {provider.key_prefix} · {provider.default_model}
                        </p>
                      </div>
                      {provider.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPendingDeactivate(provider)}
                        >
                          {ai?.deactivate || 'Deactivate'}
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Employees */}
            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Bot className="h-5 w-5 text-slate-500" />
                  {ai?.tabEmployees || 'AI employees'}
                </h2>
                <Button
                  size="sm"
                  onClick={openCreateEmployee}
                  disabled={activeProviders.length === 0}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  {ai?.createEmployee || 'Create AI employee'}
                </Button>
              </div>

              {employees.length === 0 ? (
                <Card className="p-6 text-center text-slate-500">{ai?.noEmployees}</Card>
              ) : (
                <div className="space-y-2">
                  {employees.map((employee) => (
                    <Card key={employee.profile_id} className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-900">{employee.full_name}</span>
                            <Badge variant="info">
                              {t.dashboard?.enums?.role?.ai || 'AI employee'}
                            </Badge>
                            {employee.config.is_paused && (
                              <Badge variant="warning">{ai?.pausedBadge || 'Paused'}</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {employee.email} · {employee.config.max_runs_per_day}{' '}
                            {ai?.runsPerDayShort || 'runs/day'}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                            {employee.config.job_description}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePause(employee)}
                            className="gap-1"
                          >
                            {employee.config.is_paused ? (
                              <>
                                <Play className="h-4 w-4" />
                                {ai?.resume || 'Resume'}
                              </>
                            ) : (
                              <>
                                <Pause className="h-4 w-4" />
                                {ai?.pause || 'Pause'}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditEmployee(employee)}
                            title={ai?.edit || 'Edit'}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </motion.div>

      {/* Add provider */}
      <Modal
        isOpen={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        title={ai?.addProvider || 'Add provider key'}
      >
        <div className="space-y-4">
          <Select
            label="Provider"
            value={providerForm.provider}
            onChange={(e) =>
              setProviderForm((f) => ({ ...f, provider: e.target.value as 'anthropic' }))
            }
            options={[
              { value: 'anthropic', label: 'Anthropic (Claude)' },
              { value: 'openai', label: 'OpenAI (binnenkort / soon)' },
              { value: 'google', label: 'Google (binnenkort / soon)' },
            ]}
          />
          <Input
            label={ai?.providerLabel || 'Label'}
            placeholder={ai?.providerLabelPlaceholder}
            value={providerForm.label}
            onChange={(e) => setProviderForm((f) => ({ ...f, label: e.target.value }))}
          />
          <div>
            <Input
              label={ai?.providerKey || 'API key'}
              type="password"
              value={providerForm.api_key}
              onChange={(e) => setProviderForm((f) => ({ ...f, api_key: e.target.value }))}
            />
            <p className="mt-1 text-sm text-slate-500">{ai?.providerKeyHint}</p>
          </div>
          <Input
            label={ai?.providerModel || 'Default model'}
            value={providerForm.default_model}
            onChange={(e) => setProviderForm((f) => ({ ...f, default_model: e.target.value }))}
          />
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setShowProviderModal(false)}>
              {t.dashboard?.common?.cancel || 'Cancel'}
            </Button>
            <Button onClick={submitProvider} disabled={isSaving}>
              {isSaving ? <Spinner size="sm" /> : t.dashboard?.common?.save || 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create / edit employee */}
      <Modal
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        title={
          editEmployee
            ? `${ai?.edit || 'Edit'} — ${editEmployee.full_name}`
            : ai?.createEmployee || 'Create AI employee'
        }
        size="lg"
      >
        <div className="space-y-4">
          {!editEmployee && (
            <Input
              label={ai?.employeeName || 'Name'}
              placeholder={ai?.employeeNamePlaceholder}
              value={employeeForm.name}
              onChange={(e) => setEmployeeForm((f) => ({ ...f, name: e.target.value }))}
            />
          )}
          <div>
            <Textarea
              label={ai?.jobDescription || 'Job description'}
              placeholder={ai?.jobDescriptionPlaceholder}
              value={employeeForm.job_description}
              onChange={(e) =>
                setEmployeeForm((f) => ({ ...f, job_description: e.target.value }))
              }
              rows={5}
            />
            <p className="mt-1 text-sm text-slate-500">{ai?.jobDescriptionHint}</p>
          </div>
          <Select
            label={ai?.tabProviders || 'AI provider'}
            value={employeeForm.provider_id}
            onChange={(e) => setEmployeeForm((f) => ({ ...f, provider_id: e.target.value }))}
            options={activeProviders.map((p) => ({
              value: p.id,
              label: `${p.label} (${p.default_model})`,
            }))}
          />
          <Input
            label={ai?.modelOverride || 'Model (optional)'}
            value={employeeForm.model}
            onChange={(e) => setEmployeeForm((f) => ({ ...f, model: e.target.value }))}
          />
          <div>
            <Input
              label={ai?.maxRunsPerDay || 'Max runs per day'}
              type="number"
              value={String(employeeForm.max_runs_per_day)}
              onChange={(e) =>
                setEmployeeForm((f) => ({
                  ...f,
                  max_runs_per_day: Math.max(1, parseInt(e.target.value, 10) || 1),
                }))
              }
            />
            <p className="mt-1 text-sm text-slate-500">{ai?.maxRunsHint}</p>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setShowEmployeeModal(false)}>
              {t.dashboard?.common?.cancel || 'Cancel'}
            </Button>
            <Button onClick={submitEmployee} disabled={isSaving}>
              {isSaving ? <Spinner size="sm" /> : ai?.saveEmployee || 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={pendingDeactivate !== null}
        onClose={() => setPendingDeactivate(null)}
        onConfirm={performDeactivate}
        isLoading={isSaving}
        variant="danger"
        title={ai?.confirmDeactivateTitle || 'Deactivate provider key'}
        message={(ai?.confirmDeactivate || '"{label}" will stop working immediately.').replace(
          '{label}',
          pendingDeactivate?.label ?? '',
        )}
        confirmText={ai?.deactivate || 'Deactivate'}
        cancelText={t.dashboard?.common?.cancel || 'Cancel'}
        loadingText={t.dashboard?.common?.loading || 'Loading...'}
      />
    </DashboardPage>
  );
}
