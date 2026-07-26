// ============================================================================
// Domain types for the app.
// The `Database` type (used by the Supabase clients) is machine-generated in
// ./supabase.ts — regenerate it after every migration. The interfaces below
// are the app-facing domain models with narrowed enum/string types.
// ============================================================================

export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './supabase';

export type UserRole = 'employee' | 'admin';
export type ClientStatus = 'active' | 'inactive' | 'pending';
export type CaseType =
  | 'exploitatievergunning'
  | 'alcoholvergunning'
  | 'terrasvergunning'
  | 'bibob'
  | 'overname'
  | 'verbouwing'
  | 'other';
export type CaseStatus =
  | 'intake'
  | 'in_progress'
  | 'waiting_client'
  | 'waiting_government'
  | 'review'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type DocumentCategory =
  | 'contract'
  | 'permit'
  | 'identification'
  | 'financial'
  | 'correspondence'
  | 'bibob'
  | 'general';

// Client portal types
export type ClientRequestStatus = 'pending' | 'reviewing' | 'approved' | 'converted' | 'rejected';
export type RequestUrgency = 'normal' | 'urgent';

// Catalog + billing types
export type CaseDocumentStatus = 'pending' | 'uploaded' | 'in_review' | 'approved' | 'rejected';
export type LeadSource = 'quiz' | 'contact' | 'newsletter';
export type LeadStatus = 'new' | 'contacted' | 'converted' | 'closed';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'failed' | 'expired' | 'canceled';
export type Locale = 'nl' | 'en';

// ----------------------------------------------------------------------------
// Domain models (narrowed versions of the generated Row types)
// ----------------------------------------------------------------------------

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  kvk_number: string | null;
  notes: string | null;
  assigned_employee_id: string | null;
  user_id: string | null;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  case_type: CaseType;
  status: CaseStatus;
  priority: Priority;
  assigned_employee_id: string | null;
  deadline: string | null;
  municipality: string | null;
  reference_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  case_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assigned_to: string | null;
  created_by: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  case_id: string | null;
  client_id: string | null;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  category: DocumentCategory;
  uploaded_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: import('./supabase').Json | null;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: import('./supabase').Json;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface ClientRequest {
  id: string;
  client_id: string;
  request_type: CaseType;
  title: string;
  description: string | null;
  status: ClientRequestStatus;
  municipality: string | null;
  urgency: RequestUrgency;
  notes: string | null;
  reviewed_by: string | null;
  converted_to_case_id: string | null;
  permit_type_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermitType {
  id: string;
  slug: string;
  name_nl: string;
  name_en: string;
  description_nl: string | null;
  description_en: string | null;
  base_fee_cents: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RequiredDocument {
  id: string;
  permit_type_id: string;
  name_nl: string;
  name_en: string;
  description_nl: string | null;
  description_en: string | null;
  is_required: boolean;
  sort_order: number;
  auto_check_config: import('./supabase').Json | null;
  created_at: string;
  updated_at: string;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  required_document_id: string | null;
  name: string;
  status: CaseDocumentStatus;
  document_id: string | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  source: LeadSource;
  name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  message: string | null;
  permit_type_id: string | null;
  quiz_answers: import('./supabase').Json | null;
  locale: Locale;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  case_id: string | null;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  mollie_payment_id: string | null;
  description: string | null;
  issued_at: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  mollie_payment_id: string;
  mollie_status: string;
  amount_cents: number;
  method: string | null;
  raw: import('./supabase').Json | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Knowledge base (admin-only confidential documents + versioned AI rulebook)
// ---------------------------------------------------------------------------

export type KbVersionStatus = 'draft' | 'active' | 'archived';

export interface KbDocument {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  sha256: string;
  notes: string | null;
  contains_pii: boolean;
  redaction_terms: string[];
  include_images: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface KbVersion {
  id: string;
  version: number;
  status: KbVersionStatus;
  rules: import('./supabase').Json;
  rendered_markdown: string;
  provider: string;
  model: string;
  prompt_version: string;
  source_documents: import('./supabase').Json;
  redactions_applied: import('./supabase').Json | null;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number | null;
  created_by: string | null;
  created_at: string;
  activated_at: string | null;
  activated_by: string | null;
}
