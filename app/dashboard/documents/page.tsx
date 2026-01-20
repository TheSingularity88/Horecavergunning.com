'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Upload, FileText, Download, Trash2, File, Image, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { Header } from '@/app/components/dashboard/Header';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Badge } from '@/app/components/ui/Badge';
import { Modal, ConfirmModal } from '@/app/components/ui/Modal';
import { Spinner } from '@/app/components/ui/Spinner';
import type { Document } from '@/app/lib/types/database';

type CaseOption = { id: string; title: string };
type ClientOption = { id: string; company_name: string };

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const preselectedCaseId = searchParams.get('case');
  const { isAdmin, profile } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    case_id: preselectedCaseId || '',
    client_id: '',
    category: 'general',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }

        if (categoryFilter) {
          query = query.eq('category', categoryFilter);
        }

        const [docsRes, casesRes, clientsRes] = await Promise.all([
          query,
          supabase.from('cases').select('id, title'),
          supabase.from('clients').select('id, company_name'),
        ]);

        setDocuments((docsRes.data as Document[]) || []);
        setCases((casesRes.data as CaseOption[]) || []);
        setClients((clientsRes.data as ClientOption[]) || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, search, categoryFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm((prev) => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) return;

    setIsUploading(true);
    try {
      const file = uploadForm.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${profile?.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          category: uploadForm.category,
          notes: uploadForm.notes || null,
          case_id: uploadForm.case_id || null,
          client_id: uploadForm.client_id || null,
          uploaded_by: profile?.id,
        } as unknown as never)
        .select()
        .single();

      if (dbError) throw dbError;

      setDocuments((prev) => [data as Document, ...prev]);
      setShowUploadModal(false);
      setUploadForm({
        file: null,
        case_id: '',
        client_id: '',
        category: 'general',
        notes: '',
      });
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;

    setIsDeleting(true);
    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([selectedDocument.file_path]);

      // Delete from database
      const { error } = await supabase.from('documents').delete().eq('id', selectedDocument.id);

      if (error) throw error;

      setDocuments((prev) => prev.filter((d) => d.id !== selectedDocument.id));
      setShowDeleteModal(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setIsDeleting(false);
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
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel'))
      return <FileSpreadsheet className="w-5 h-5" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'contract', label: 'Contract' },
    { value: 'permit', label: 'Permit' },
    { value: 'identification', label: 'Identification' },
    { value: 'financial', label: 'Financial' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'bibob', label: 'Bibob' },
    { value: 'general', label: 'General' },
  ];

  const caseOptions = [
    { value: '', label: 'No case' },
    ...cases.map((c) => ({ value: c.id, label: c.title })),
  ];

  const clientOptions = [
    { value: '', label: 'No client' },
    ...clients.map((c) => ({ value: c.id, label: c.company_name })),
  ];

  return (
    <div className="flex flex-col h-screen">
      <Header title={t.dashboard?.nav?.documents || 'Documents'} />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Actions Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categoryOptions}
                className="w-40"
              />
              <Button onClick={() => setShowUploadModal(true)} className="gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
          </div>

          {/* Documents Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : documents.length === 0 ? (
            <Card className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No documents found</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} hover className="relative">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{doc.name}</p>
                      <p className="text-sm text-slate-500">
                        {formatFileSize(doc.file_size)}
                      </p>
                      <Badge className="mt-2">{doc.category}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    {(isAdmin || doc.uploaded_by === profile?.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
        size="md"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-600">
                {uploadForm.file ? uploadForm.file.name : 'Click to select a file'}
              </span>
            </label>
          </div>

          <Select
            label="Category"
            value={uploadForm.category}
            onChange={(e) => setUploadForm((prev) => ({ ...prev, category: e.target.value }))}
            options={categoryOptions.filter((o) => o.value !== '')}
          />

          <Select
            label="Related Case (optional)"
            value={uploadForm.case_id}
            onChange={(e) => setUploadForm((prev) => ({ ...prev, case_id: e.target.value }))}
            options={caseOptions}
          />

          <Select
            label="Related Client (optional)"
            value={uploadForm.client_id}
            onChange={(e) => setUploadForm((prev) => ({ ...prev, client_id: e.target.value }))}
            options={clientOptions}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!uploadForm.file || isUploading}>
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" className="text-slate-900" />
                  Uploading...
                </span>
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${selectedDocument?.name}"?`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
