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
  created_at: string;
  updated_at: string;
}
