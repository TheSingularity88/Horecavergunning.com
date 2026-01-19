export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
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
          status: ClientStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_name: string;
          email: string;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          kvk_number?: string | null;
          notes?: string | null;
          assigned_employee_id?: string | null;
          status?: ClientStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          contact_name?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          kvk_number?: string | null;
          notes?: string | null;
          assigned_employee_id?: string | null;
          status?: ClientStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      cases: {
        Row: {
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
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          description?: string | null;
          case_type: CaseType;
          status?: CaseStatus;
          priority?: Priority;
          assigned_employee_id?: string | null;
          deadline?: string | null;
          municipality?: string | null;
          reference_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          title?: string;
          description?: string | null;
          case_type?: CaseType;
          status?: CaseStatus;
          priority?: Priority;
          assigned_employee_id?: string | null;
          deadline?: string | null;
          municipality?: string | null;
          reference_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
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
        };
        Insert: {
          id?: string;
          case_id?: string | null;
          client_id?: string | null;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: Priority;
          assigned_to?: string | null;
          created_by?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string | null;
          client_id?: string | null;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: Priority;
          assigned_to?: string | null;
          created_by?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
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
        };
        Insert: {
          id?: string;
          case_id?: string | null;
          client_id?: string | null;
          name: string;
          file_path: string;
          file_type: string;
          file_size?: number | null;
          category?: DocumentCategory;
          uploaded_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string | null;
          client_id?: string | null;
          name?: string;
          file_path?: string;
          file_type?: string;
          file_size?: number | null;
          category?: DocumentCategory;
          uploaded_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Case = Database['public']['Tables']['cases']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_log']['Row'];
export type SystemSetting = Database['public']['Tables']['system_settings']['Row'];
