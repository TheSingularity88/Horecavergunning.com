'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookLock,
  Download,
  FileText,
  Settings2,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import {
  insertKbDocument,
  updateKbDocumentFlags,
  deleteKbDocument,
} from '@/app/lib/actions/kb';
import {
  validateKbFile,
  KB_FILE_INPUT_ACCEPT,
} from '@/app/lib/validation/kb';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Textarea } from '@/app/components/ui/Textarea';
import { Modal, ConfirmModal } from '@/app/components/ui/Modal';
import { Spinner } from '@/app/components/ui/Spinner';
import { useToast } from '@/app/components/ui/Toast';
import type { KbDocument } from '@/app/lib/types/database';

/**
 * Admin-only knowledge base: the confidential source documents the AI system
 * learns from. Uploads go straight from the browser to the private 'kb'
 * bucket under the admin's own session — storage RLS (migration 013) is what
 * makes that admin-only, and the middleware already gates this route.
 */

/** sha256 of a File via WebCrypto, hex-encoded. */
async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Storage object keys are safest as plain ASCII; display keeps the original name. */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180);
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { showError } = useToast();
  const kb = t.dashboard?.kb;

  const [documents, setDocuments] = useState<KbDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<KbDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settingsDoc, setSettingsDoc] = useState<KbDocument | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    notes: '',
    contains_pii: false,
    redaction_terms: '',
    include_images: false,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  const fetchDocuments = useCallback(async () => {
    const { data } = await supabase
      .from('kb_documents')
      .select('*')
      .order('filename');
    setDocuments((data as KbDocument[]) || []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (isAdmin) fetchDocuments();
  }, [isAdmin, fetchDocuments]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file after a failure
    if (!file) return;

    const check = validateKbFile(file);
    if (!check.ok) {
      showError(check.error);
      return;
    }

    setIsUploading(true);
    try {
      const id = crypto.randomUUID();
      const storagePath = `${id}/${sanitizeFilename(file.name)}`;
      const sha256 = await sha256Hex(file);

      const { error: uploadError } = await supabase.storage
        .from('kb')
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      const result = await insertKbDocument({
        id,
        filename: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
        sha256,
      });

      if (!result.success) {
        // Registration failed: remove the orphaned object so a retry starts clean.
        await supabase.storage.from('kb').remove([storagePath]);
        showError(kb?.registerFailed || 'The file was uploaded but could not be registered.');
        return;
      }

      await fetchDocuments();
    } catch (error) {
      console.error('KB upload failed:', error);
      showError(kb?.uploadFailed || 'The upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: KbDocument) => {
    try {
      const { data, error } = await supabase.storage.from('kb').download(doc.storage_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('KB download failed:', error);
      showError(t.clientPortal?.errors?.downloadFailed || 'The document could not be downloaded.');
    }
  };

  const performDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    const result = await deleteKbDocument({ id: pendingDelete.id });
    if (!result.success) showError(result.error);
    else await fetchDocuments();
    setIsDeleting(false);
    setPendingDelete(null);
  };

  const openSettings = (doc: KbDocument) => {
    setSettingsForm({
      notes: doc.notes ?? '',
      contains_pii: doc.contains_pii,
      redaction_terms: doc.redaction_terms.join('\n'),
      include_images: doc.include_images,
    });
    setSettingsDoc(doc);
  };

  const saveSettings = async () => {
    if (!settingsDoc) return;
    setIsSavingSettings(true);
    const result = await updateKbDocumentFlags({
      id: settingsDoc.id,
      notes: settingsForm.notes.trim() || null,
      contains_pii: settingsForm.contains_pii,
      redaction_terms: settingsForm.redaction_terms
        .split('\n')
        .map((term) => term.trim())
        .filter((term) => term.length >= 2),
      include_images: settingsForm.include_images,
    });
    if (!result.success) showError(result.error);
    else await fetchDocuments();
    setIsSavingSettings(false);
    setSettingsDoc(null);
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

  if (!isAdmin) return null;

  return (
    <DashboardPage title={kb?.title || 'Knowledge base'}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Confidentiality banner */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">
              {kb?.confidentialBadge || 'Confidential'}
            </p>
            <p className="text-sm text-slate-600">{kb?.intro}</p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">{kb?.replaceHint}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={KB_FILE_INPUT_ACCEPT}
            onChange={handleFileSelected}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2 flex-shrink-0"
          >
            {isUploading ? <Spinner size="sm" /> : <Upload className="h-4 w-4" />}
            {kb?.uploadDocument || 'Upload document'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : documents.length === 0 ? (
          <Card className="p-8 text-center">
            <BookLock className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">{kb?.empty}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="rounded-lg bg-slate-100 p-2">
                      <FileText className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{doc.filename}</p>
                      <p className="text-sm text-slate-500">
                        {formatSize(doc.file_size)} · {formatDate(doc.created_at)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {doc.contains_pii && (
                          <Badge variant="warning">{kb?.piiBadge || 'Contains personal data'}</Badge>
                        )}
                        {doc.include_images && (
                          <Badge variant="info">{kb?.imagesBadge || 'Images included'}</Badge>
                        )}
                      </div>
                      {doc.notes && (
                        <p className="mt-1 truncate text-sm text-slate-500">{doc.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSettings(doc)}
                      className="gap-1"
                    >
                      <Settings2 className="h-4 w-4" />
                      {kb?.settingsTitle || 'Analysis settings'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      title={t.dashboard?.common?.download || 'Download'}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete(doc)}
                      title={t.dashboard?.common?.delete || 'Delete'}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* Per-document analysis settings */}
      <Modal
        isOpen={settingsDoc !== null}
        onClose={() => setSettingsDoc(null)}
        title={`${kb?.settingsTitle || 'Analysis settings'} — ${settingsDoc?.filename ?? ''}`}
      >
        <div className="space-y-5">
          <Textarea
            label={kb?.notes || 'Notes (optional)'}
            placeholder={kb?.notesPlaceholder}
            value={settingsForm.notes}
            onChange={(e) => setSettingsForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
          />

          <div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={settingsForm.contains_pii}
                onChange={(e) =>
                  setSettingsForm((f) => ({ ...f, contains_pii: e.target.checked }))
                }
                className="mt-1"
              />
              <span>
                <span className="text-sm font-medium text-slate-900">
                  {kb?.containsPii || 'Contains personal data'}
                </span>
                <span className="block text-sm text-slate-500">{kb?.containsPiiHint}</span>
              </span>
            </label>
          </div>

          <Textarea
            label={kb?.redactionTerms || 'Redaction list'}
            value={settingsForm.redaction_terms}
            onChange={(e) =>
              setSettingsForm((f) => ({ ...f, redaction_terms: e.target.value }))
            }
            rows={4}
          />
          <p className="-mt-3 text-sm text-slate-500">{kb?.redactionTermsHint}</p>

          <div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={settingsForm.include_images}
                onChange={(e) =>
                  setSettingsForm((f) => ({ ...f, include_images: e.target.checked }))
                }
                className="mt-1"
              />
              <span>
                <span className="text-sm font-medium text-slate-900">
                  {kb?.includeImages || 'Also send embedded images to the AI'}
                </span>
                <span className="block text-sm text-slate-500">{kb?.includeImagesHint}</span>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setSettingsDoc(null)}>
              {t.dashboard?.common?.cancel || 'Cancel'}
            </Button>
            <Button onClick={saveSettings} disabled={isSavingSettings}>
              {isSavingSettings ? <Spinner size="sm" /> : t.dashboard?.common?.save || 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={performDelete}
        isLoading={isDeleting}
        variant="danger"
        title={kb?.confirmDeleteTitle || 'Delete document'}
        message={(kb?.confirmDelete || 'Are you sure? "{name}" will be removed.').replace(
          '{name}',
          pendingDelete?.filename ?? '',
        )}
        confirmText={t.dashboard?.common?.delete || 'Delete'}
        cancelText={t.dashboard?.common?.cancel || 'Cancel'}
        loadingText={t.dashboard?.common?.loading || 'Loading...'}
      />
    </DashboardPage>
  );
}
