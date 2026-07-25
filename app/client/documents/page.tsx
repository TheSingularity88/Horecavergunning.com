'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Image,
  File,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import {
  validateUploadFile,
  FILE_INPUT_ACCEPT,
  ALLOWED_EXTENSIONS_LABEL,
  MAX_FILE_SIZE_LABEL,
} from '@/app/lib/validation/upload';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Modal } from '@/app/components/ui/Modal';
import { Spinner } from '@/app/components/ui/Spinner';
import { dashboardRoutes } from '@/app/lib/routes/dashboard';
import type { Document, Case, DocumentCategory } from '@/app/lib/types/database';

const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'identification', label: 'Identification' },
  { value: 'financial', label: 'Financial' },
  { value: 'contract', label: 'Contract' },
  { value: 'permit', label: 'Permit' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'general', label: 'General' },
];

export default function ClientDocumentsPage() {
  const searchParams = useSearchParams();
  const preselectedCaseId = searchParams.get('case');

  const { clientData, user } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    case_id: preselectedCaseId || '',
    category: 'general' as DocumentCategory,
    notes: '',
    // Which required-document item this upload satisfies (optional).
    checklist_item_id: '',
  });
  // Outstanding checklist items for the case selected in the upload form.
  const [checklistItems, setChecklistItems] = useState<{ id: string; name: string }[]>([]);
  const supabase = useMemo(() => createClient(), []);

  // When arriving from a case ("View all"), show only that case's documents.
  const visibleDocuments = useMemo(
    () =>
      preselectedCaseId
        ? documents.filter((d) => d.case_id === preselectedCaseId)
        : documents,
    [documents, preselectedCaseId]
  );

  // Load the still-outstanding checklist items whenever the upload form's case
  // changes, so the customer can say which requirement this file answers.
  useEffect(() => {
    const caseId = uploadForm.case_id;
    if (!caseId) {
      setChecklistItems([]);
      return;
    }
    let cancelled = false;
    supabase
      .from('case_documents')
      .select('id, name')
      .eq('case_id', caseId)
      .in('status', ['pending', 'rejected'])
      .order('sort_order')
      .then(({ data }) => {
        if (!cancelled) setChecklistItems((data as { id: string; name: string }[]) || []);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, uploadForm.case_id]);

  const fetchDocuments = useCallback(async () => {
    if (!clientData?.id) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data as Document[]) || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, [supabase, clientData?.id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!clientData?.id) return;

      setIsLoading(true);
      try {
        // Fetch documents and cases in parallel
        const [, casesRes] = await Promise.all([
          fetchDocuments(),
          supabase
            .from('cases')
            .select('id, title')
            .eq('client_id', clientData.id)
            .order('title'),
        ]);

        setCases((casesRes.data as Case[]) || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, clientData?.id, fetchDocuments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const check = validateUploadFile(file);
      if (!check.ok) {
        setUploadError(check.error);
        return;
      }
      setUploadError(null);
      setUploadForm((prev) => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !clientData?.id || !user?.id) return;

    // Validate again right before uploading (bucket enforces the same limits).
    const check = validateUploadFile(uploadForm.file);
    if (!check.ok) {
      setUploadError(check.error);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const file = uploadForm.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `clients/${clientData.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record. uploaded_by stays NULL for client uploads:
      // it references profiles (staff only) and RLS marks NULL as
      // "uploaded by the client".
      const { data: insertedDoc, error: insertError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          category: uploadForm.category,
          notes: uploadForm.notes || null,
          case_id: uploadForm.case_id || null,
          client_id: clientData.id,
          uploaded_by: null,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Tick off the checklist item this upload answers. Without this the
      // checklist could never advance: nothing linked an uploaded file back to
      // case_documents, so every item stayed "pending" no matter what the
      // customer supplied. The column grants let a client set only document_id
      // and status here — approval stays with staff.
      if (uploadForm.checklist_item_id && insertedDoc) {
        const { error: linkError } = await supabase
          .from('case_documents')
          .update({ document_id: insertedDoc.id, status: 'uploaded' })
          .eq('id', uploadForm.checklist_item_id);
        if (linkError) {
          console.error('Document uploaded but checklist link failed:', linkError);
        }
      }

      // Refresh documents list
      await fetchDocuments();
      setShowUploadModal(false);
      setUploadForm({
        file: null,
        case_id: preselectedCaseId || '',
        category: 'general',
        notes: '',
        checklist_item_id: '',
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadError('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document.');
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(t.clientPortal?.documents?.confirmDelete || 'Are you sure you want to delete this document?')) {
      return;
    }

    try {
      // Delete the ROW FIRST. It is the RLS-checked, authoritative step.
      //
      // This used to remove the storage object first and only then delete the
      // row, so when RLS refused the row delete — which it does for anything
      // staff uploaded — the file was already destroyed. The customer lost the
      // permit we sent them, the card reappeared on refresh, and it pointed at
      // a file that no longer existed. Deleting the row first means a refusal
      // costs nothing.
      const { error, count } = await supabase
        .from('documents')
        .delete({ count: 'exact' })
        .eq('id', doc.id);

      if (error) throw error;
      if (!count) {
        // RLS silently matched zero rows: not ours to delete.
        alert(
          t.clientPortal?.documents?.deleteNotAllowed ||
            'This document was added by our team, so it cannot be deleted here.'
        );
        return;
      }

      // Row is gone; now clean up the object. A failure here only leaves an
      // orphaned file, which is recoverable — unlike losing the customer's.
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path]);
      if (storageError) {
        console.error('Document row deleted but storage cleanup failed:', storageError);
      }

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(t.clientPortal?.documents?.deleteFailed || 'Failed to delete document.');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <DashboardPage>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t.clientPortal?.documents?.title || 'My Documents'}
          </h1>
          <p className="text-slate-600 mt-1">
            {t.clientPortal?.documents?.subtitle || 'Manage and upload documents for your cases'}
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          {t.clientPortal?.documents?.upload || 'Upload Document'}
        </Button>
      </motion.div>

      {/* `?case=` used to only preselect the upload form, so the "View all" link
          from a case landed here showing every document with no indication of
          which case they belonged to. It now actually filters. */}
      {preselectedCaseId && (
        <div className="mb-4 flex flex-wrap items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <span className="text-sm text-amber-800">
            {(t.clientPortal?.documents?.filteredByCase || 'Showing documents for: {case}').replace(
              '{case}',
              cases.find((c) => c.id === preselectedCaseId)?.title || '—'
            )}
          </span>
          <Link
            href={dashboardRoutes.client.documents}
            className="text-sm font-medium text-amber-700 hover:text-amber-800 underline"
          >
            {t.clientPortal?.documents?.showAll || 'Show all documents'}
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : visibleDocuments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">
              {t.clientPortal?.documents?.noDocuments || 'You haven\'t uploaded any documents yet'}
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              {t.clientPortal?.documents?.uploadFirst || 'Upload your first document'}
            </Button>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {visibleDocuments.map((doc, index) => {
            const FileIcon = getFileIcon(doc.file_type);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                      <FileIcon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate" title={doc.name}>
                        {doc.name}
                      </h3>
                      <p className="text-sm text-slate-500 capitalize">
                        {doc.category}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {t.clientPortal?.documents?.download || 'Download'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={t.clientPortal?.documents?.uploadTitle || 'Upload Document'}
      >
        <div className="space-y-4">
          {uploadError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {uploadError}
            </div>
          )}

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              uploadForm.file
                ? 'border-amber-300 bg-amber-50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            {uploadForm.file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-amber-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">{uploadForm.file.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatFileSize(uploadForm.file.size)}
                  </p>
                </div>
                <button
                  onClick={() => setUploadForm((prev) => ({ ...prev, file: null }))}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">
                  {t.clientPortal?.documents?.dropzone || 'Drag and drop or click to select'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {`${ALLOWED_EXTENSIONS_LABEL} · max ${MAX_FILE_SIZE_LABEL}`}
                </p>
              </>
            )}
            {/* The inline `position: relative` used to override the
                `absolute inset-0` class, so the input sat BELOW the dropzone
                text instead of covering it — the visible "click to select"
                prompt did nothing. */}
            <input
              type="file"
              accept={FILE_INPUT_ACCEPT}
              onChange={handleFileSelect}
              aria-label={t.clientPortal?.documents?.dropzone || 'Select a file to upload'}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Category */}
          <Select
            label={t.clientPortal?.documents?.category || 'Category'}
            options={DOCUMENT_CATEGORIES}
            value={uploadForm.category}
            onChange={(e) =>
              setUploadForm((prev) => ({
                ...prev,
                category: e.target.value as DocumentCategory,
              }))
            }
          />

          {/* Case */}
          {cases.length > 0 && (
            <Select
              label={t.clientPortal?.documents?.relatedCase || 'Related Case (optional)'}
              options={[
                { value: '', label: 'None' },
                ...cases.map((c) => ({ value: c.id, label: c.title })),
              ]}
              value={uploadForm.case_id}
              onChange={(e) =>
                // Changing case invalidates the chosen checklist item.
                setUploadForm((prev) => ({
                  ...prev,
                  case_id: e.target.value,
                  checklist_item_id: '',
                }))
              }
            />
          )}

          {/* Which required document does this answer? Only shown when the
              selected case still has outstanding checklist items. */}
          {checklistItems.length > 0 && (
            <Select
              label={t.clientPortal?.documents?.answersRequirement || 'Which required document is this? (optional)'}
              options={[
                { value: '', label: t.clientPortal?.documents?.notInChecklist || 'Not on the list' },
                ...checklistItems.map((i) => ({ value: i.id, label: i.name })),
              ]}
              value={uploadForm.checklist_item_id}
              onChange={(e) =>
                setUploadForm((prev) => ({ ...prev, checklist_item_id: e.target.value }))
              }
            />
          )}

          {/* Notes */}
          <Textarea
            label={t.clientPortal?.documents?.notes || 'Notes (optional)'}
            placeholder={t.clientPortal?.documents?.notesPlaceholder || 'Add any notes about this document...'}
            value={uploadForm.notes}
            onChange={(e) =>
              setUploadForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={3}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              {t.dashboard?.common?.cancel || 'Cancel'}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadForm.file || isUploading}
            >
              {isUploading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {t.clientPortal?.documents?.uploading || 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t.clientPortal?.documents?.upload || 'Upload'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardPage>
  );
}
