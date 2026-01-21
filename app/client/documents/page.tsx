'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Modal } from '@/app/components/ui/Modal';
import { Spinner } from '@/app/components/ui/Spinner';
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    case_id: preselectedCaseId || '',
    category: 'general' as DocumentCategory,
    notes: '',
  });
  const supabase = useMemo(() => createClient(), []);

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
      setUploadForm((prev) => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !clientData?.id || !user?.id) return;

    setIsUploading(true);
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

      // Create document record
      const { error: insertError } = await supabase.from('documents').insert({
        name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        category: uploadForm.category,
        notes: uploadForm.notes || null,
        case_id: uploadForm.case_id || null,
        client_id: clientData.id,
        uploaded_by: user.id,
      } as never);

      if (insertError) throw insertError;

      // Refresh documents list
      await fetchDocuments();
      setShowUploadModal(false);
      setUploadForm({
        file: null,
        case_id: preselectedCaseId || '',
        category: 'general',
        notes: '',
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
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
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([doc.file_path]);

      // Delete record
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);

      if (error) throw error;

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document.');
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : documents.length === 0 ? (
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
          {documents.map((doc, index) => {
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
                  {t.clientPortal?.documents?.maxSize || 'Maximum file size: 10MB'}
                </p>
              </>
            )}
            <input
              type="file"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ position: 'relative' }}
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
                setUploadForm((prev) => ({ ...prev, case_id: e.target.value }))
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
