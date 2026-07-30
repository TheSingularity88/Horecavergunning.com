'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Check, Copy, KeyRound, Plus, Trash2 } from 'lucide-react';
import { dashboardRoutes } from '@/app/lib/routes/dashboard';
import { SITE_URL } from '@/app/lib/site';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import {
  getAgentKeys,
  mintAgentKey,
  revokeAgentKey,
  type AgentKeyView,
} from '@/app/lib/actions/agent-keys';
import { getAiAdminData, type AiEmployeeView } from '@/app/lib/actions/ai-admin';
import { AGENT_SCOPES, DEFAULT_KEY_DAYS, type AgentScope } from '@/app/lib/validation/agent-keys';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Modal, ConfirmModal } from '@/app/components/ui/Modal';
import { Spinner } from '@/app/components/ui/Spinner';
import { useToast } from '@/app/components/ui/Toast';

/**
 * Keys an EXTERNAL AI employee uses to reach this platform (route 2).
 *
 * These are the opposite of the provider keys on the AI employees page: those
 * are ours, encrypted, and spent calling Anthropic. These are ours to GIVE,
 * stored only as a hash, and spent by somebody else's agent calling us. The
 * copy has to keep that straight or an admin will paste one into the other.
 */
export default function AgentKeysPage() {
  const { t } = useLanguage();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const k = t.dashboard?.aiKeys;

  const [keys, setKeys] = useState<AgentKeyView[]>([]);
  const [employees, setEmployees] = useState<AiEmployeeView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMint, setShowMint] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<AgentKeyView | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  /** The plaintext, held only until the admin dismisses the panel. */
  const [freshKey, setFreshKey] = useState<{ token: string; label: string } | null>(null);

  const [form, setForm] = useState({
    aiProfileId: '',
    label: '',
    scopes: [...AGENT_SCOPES] as AgentScope[],
    expiresInDays: DEFAULT_KEY_DAYS,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace(dashboardRoutes.employee.base);
  }, [authLoading, isAdmin, router]);

  const fetchData = useCallback(async () => {
    const [keysResult, adminResult] = await Promise.all([getAgentKeys(), getAiAdminData()]);
    if (keysResult.success && keysResult.data) setKeys(keysResult.data.keys);
    else if (!keysResult.success) showError(keysResult.error);
    if (adminResult.success && adminResult.data) setEmployees(adminResult.data.employees);
    setIsLoading(false);
  }, [showError]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      await fetchData();
    };
    load();
  }, [isAdmin, fetchData]);

  // Only external employees can hold a key — a platform employee is one we call
  // out to, and the database refuses the pairing anyway.
  const eligible = useMemo(
    () => employees.filter((e) => e.config.employment_type === 'external' && e.is_active),
    [employees],
  );

  const openMint = () => {
    setForm({
      aiProfileId: eligible[0]?.profile_id ?? '',
      label: '',
      scopes: [...AGENT_SCOPES],
      expiresInDays: DEFAULT_KEY_DAYS,
    });
    setShowMint(true);
  };

  const submitMint = async () => {
    setIsSaving(true);
    const result = await mintAgentKey(form);
    if (!result.success) showError(result.error);
    else if (result.data) {
      setShowMint(false);
      setCopied(false);
      setCopyFailed(false);
      setFreshKey({ token: result.data.token, label: result.data.label });
      await fetchData();
    }
    setIsSaving(false);
  };

  const performRevoke = async () => {
    if (!pendingRevoke) return;
    setIsSaving(true);
    const result = await revokeAgentKey({ id: pendingRevoke.id });
    if (!result.success) showError(result.error);
    else {
      showSuccess(k?.revoked || 'Key revoked.');
      await fetchData();
    }
    setIsSaving(false);
    setPendingRevoke(null);
  };

  const [copiedUrl, setCopiedUrl] = useState(false);
  const schemaUrl = `${SITE_URL}/api/agent/v1/openapi.json`;

  const copySchemaUrl = async () => {
    try {
      await navigator.clipboard.writeText(schemaUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Same reasoning as the key: a silent failure on a copy button is worse
      // than none, but this one is recoverable — the URL is on screen to select.
      setCopiedUrl(false);
    }
  };

  const copyKey = async () => {
    if (!freshKey) return;
    try {
      await navigator.clipboard.writeText(freshKey.token);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      // Never swallow this. The key is shown once; if the copy silently failed
      // the admin would close the panel believing they had it.
      setCopyFailed(true);
    }
  };

  const toggleScope = (scope: AgentScope) =>
    setForm((f) => ({
      ...f,
      scopes: f.scopes.includes(scope)
        ? f.scopes.filter((s) => s !== scope)
        : [...f.scopes, scope],
    }));

  const scopeLabel = (scope: string) =>
    ({
      read: k?.scopeRead || 'Read',
      write: k?.scopeWrite || 'Change internal work',
      propose: k?.scopePropose || 'Propose (needs approval)',
    })[scope] ?? scope;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

  const setupGuide = (
    <div className="max-w-3xl space-y-4 text-sm text-slate-700">
      <p>{k?.setupIntro}</p>

      <div>
        <p className="font-medium text-slate-900">{k?.setupChatgptTitle}</p>
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          <li>{k?.setupChatgptStep1}</li>
          <li>
            {k?.setupChatgptStep2}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <code className="break-all rounded bg-white px-2 py-1 font-mono text-xs text-slate-800 ring-1 ring-slate-200">
                {schemaUrl}
              </code>
              <Button variant="outline" size="sm" onClick={copySchemaUrl} className="gap-1">
                {copiedUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedUrl ? k?.copied || 'Copied' : k?.copy || 'Copy'}
              </Button>
            </div>
          </li>
          <li>{k?.setupChatgptStep3}</li>
        </ol>
        {/* The imported schema is public and identical for every key — it
            cannot reflect the scopes ticked above. Saying so here is the only
            warning an admin gets before their agent plans against operations
            it will be refused mid-task. */}
        <p className="mt-2 rounded-md bg-amber-50 p-2.5 text-slate-700 ring-1 ring-amber-200">
          {k?.setupChatgptScopeWarning}
        </p>
      </div>

      <div>
        <p className="font-medium text-slate-900">{k?.setupClaudeTitle}</p>
        <p className="mt-1">{k?.setupClaudeBody}</p>
      </div>

      <p className="text-slate-500">{k?.setupNote}</p>
    </div>
  );

  if (!isAdmin) return null;

  const status = (key: AgentKeyView) => {
    if (key.revokedAt) return { label: k?.statusRevoked || 'Revoked', variant: 'default' as const };
    if (key.isExpired) return { label: k?.statusExpired || 'Expired', variant: 'warning' as const };
    return { label: k?.statusActive || 'Active', variant: 'success' as const };
  };

  return (
    <DashboardPage title={k?.title || 'Agent API keys'}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href={dashboardRoutes.employee.admin.ai}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {k?.backToEmployees || 'Back to AI employees'}
        </Link>

        <p className="mb-6 max-w-3xl text-sm text-slate-600">{k?.intro}</p>

        {/* Shown once. Everything about this panel assumes the admin may never
            see this string again — including the copy-failure branch. */}
        {freshKey && (
          <Card className="mb-6 border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">
                  {(k?.showOnceTitle || 'Copy "{label}" now — it is not shown again.').replace(
                    '{label}',
                    freshKey.label,
                  )}
                </p>
                <p className="mt-1 text-sm text-slate-600">{k?.showOnceHint}</p>
                <code className="mt-3 block w-full overflow-x-auto rounded-lg border border-amber-200 bg-white p-3 font-mono text-sm text-slate-800">
                  {freshKey.token}
                </code>
                {copyFailed && (
                  <p className="mt-2 text-sm font-medium text-red-700">{k?.copyFailed}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={copyKey} className="gap-1">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? k?.copied || 'Copied' : k?.copy || 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setFreshKey(null)}>
                    {k?.savedIt || 'I have saved it'}
                  </Button>
                </div>
                {/* Shown at the moment the key is in hand: this is when someone
                    needs to know what to do with it, and the only moment they
                    will still have it. */}
                <div className="mt-4 border-t border-amber-200 pt-4">{setupGuide}</div>
              </div>
            </div>
          </Card>
        )}

        {/* The same guide, standing: findable before anyone mints anything.
            Hidden while the show-once panel is up, which already carries it —
            otherwise an admin who had this open reads it twice on one screen. */}
        {!freshKey && (
          <details className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-900">
              {k?.setupTitle || 'How to connect an agent to this key'}
            </summary>
            <div className="mt-3">{setupGuide}</div>
          </details>
        )}

        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <KeyRound className="h-5 w-5 text-slate-500" />
            {k?.listTitle || 'Keys'}
          </h2>
          <Button size="sm" onClick={openMint} disabled={eligible.length === 0} className="gap-1">
            <Plus className="h-4 w-4" />
            {k?.mint || 'Create key'}
          </Button>
        </div>

        {/* An admin with no route-2 employee cannot mint anything, and the
            reason is one screen away — say so rather than leaving a dead
            button with no explanation. */}
        {eligible.length === 0 && !isLoading && (
          <Card className="mb-4 border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
            {k?.noEligibleEmployees}
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : keys.length === 0 ? (
          <Card className="p-6 text-center text-slate-500">{k?.noKeys || 'No keys yet.'}</Card>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => {
              const s = status(key);
              return (
                <Card key={key.id} className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">{key.label}</span>
                        <Badge variant={s.variant}>{s.label}</Badge>
                        <Badge variant="info">{key.aiName}</Badge>
                      </div>
                      <p className="mt-0.5 font-mono text-sm text-slate-500">{key.keyPrefix}…</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {key.scopes.map((scope) => (
                          <Badge key={scope} variant="default">
                            {scopeLabel(scope)}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {(k?.expiresOn || 'Expires {date}').replace(
                          '{date}',
                          formatDate(key.expiresAt),
                        )}
                        {' · '}
                        {key.lastUsedAt
                          ? (k?.lastUsed || 'last used {date}').replace(
                              '{date}',
                              formatDate(key.lastUsedAt),
                            )
                          : k?.neverUsed || 'never used'}
                        {key.requestCount > 0 &&
                          ` · ${(k?.requestCount || '{n} requests').replace('{n}', String(key.requestCount))}`}
                        {key.lastUsedIp && ` · ${key.lastUsedIp}`}
                      </p>
                    </div>
                    {!key.revokedAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingRevoke(key)}
                        className="shrink-0 gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        {k?.revoke || 'Revoke'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      <Modal
        isOpen={showMint}
        onClose={() => setShowMint(false)}
        title={k?.mint || 'Create key'}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label={k?.employeeLabel || 'Acts as'}
            value={form.aiProfileId}
            onChange={(e) => setForm((f) => ({ ...f, aiProfileId: e.target.value }))}
            options={eligible.map((e) => ({ value: e.profile_id, label: e.full_name }))}
          />
          <div>
            <Input
              label={k?.labelLabel || 'Label'}
              placeholder={k?.labelPlaceholder}
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
            <p className="mt-1 text-sm text-slate-500">{k?.labelHint}</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              {k?.scopesLabel || 'Permissions'}
            </p>
            <div className="space-y-2">
              {AGENT_SCOPES.map((scope) => (
                <label key={scope} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.scopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                  />
                  <span>
                    <span className="font-medium text-slate-800">{scopeLabel(scope)}</span>
                    <span className="block text-slate-500">
                      {scope === 'read'
                        ? k?.scopeReadHint
                        : scope === 'write'
                          ? k?.scopeWriteHint
                          : k?.scopeProposeHint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Input
              label={k?.expiryLabel || 'Valid for (days)'}
              type="number"
              value={String(form.expiresInDays)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  expiresInDays: Math.min(365, Math.max(1, parseInt(e.target.value, 10) || 1)),
                }))
              }
            />
            <p className="mt-1 text-sm text-slate-500">{k?.expiryHint}</p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setShowMint(false)}>
              {t.dashboard?.common?.cancel || 'Cancel'}
            </Button>
            <Button onClick={submitMint} disabled={isSaving}>
              {isSaving ? <Spinner size="sm" /> : k?.mint || 'Create key'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={pendingRevoke !== null}
        onClose={() => setPendingRevoke(null)}
        onConfirm={performRevoke}
        title={k?.revokeTitle || 'Revoke this key?'}
        message={(k?.revokeMessage || 'The agent holding "{label}" stops working immediately.').replace(
          '{label}',
          pendingRevoke?.label ?? '',
        )}
        confirmText={k?.revoke || 'Revoke'}
        cancelText={t.dashboard?.common?.cancel || 'Cancel'}
        variant="danger"
        isLoading={isSaving}
      />
    </DashboardPage>
  );
}
