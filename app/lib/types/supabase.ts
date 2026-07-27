// ============================================================================
// MACHINE-GENERATED — do not edit by hand.
// Regenerate after every migration:
//   npx supabase gen types typescript --project-id llpkcmfpijzevbmujfkq
// (or via the Supabase MCP generate_typescript_types tool)
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_employee_config: {
        Row: {
          created_at: string
          is_paused: boolean
          job_description: string
          max_runs_per_day: number
          model: string | null
          profile_id: string
          provider_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          is_paused?: boolean
          job_description: string
          max_runs_per_day?: number
          model?: string | null
          profile_id: string
          provider_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          is_paused?: boolean
          job_description?: string
          max_runs_per_day?: number
          model?: string | null
          profile_id?: string
          provider_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_employee_config_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_employee_config_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          ai_profile_id: string
          author: string
          content: string
          created_at: string
          id: string
          staff_id: string | null
        }
        Insert: {
          ai_profile_id: string
          author: string
          content: string
          created_at?: string
          id?: string
          staff_id?: string | null
        }
        Update: {
          ai_profile_id?: string
          author?: string
          content?: string
          created_at?: string
          id?: string
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_proposals: {
        Row: {
          ai_profile_id: string
          case_id: string | null
          client_id: string | null
          created_at: string
          executed_at: string | null
          execution_result: Json | null
          id: string
          kb_version_id: string | null
          kb_version_number: number | null
          payload: Json
          proposal_type: string
          rationale: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_profile_id: string
          case_id?: string | null
          client_id?: string | null
          created_at?: string
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          kb_version_id?: string | null
          kb_version_number?: number | null
          payload: Json
          proposal_type: string
          rationale?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_profile_id?: string
          case_id?: string | null
          client_id?: string | null
          created_at?: string
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          kb_version_id?: string | null
          kb_version_number?: number | null
          payload?: Json
          proposal_type?: string
          rationale?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_proposals_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_proposals_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_proposals_kb_version_id_fkey"
            columns: ["kb_version_id"]
            isOneToOne: false
            referencedRelation: "kb_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_proposals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tool_calls: {
        Row: {
          access: string
          ai_profile_id: string
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          input: Json
          ok: boolean
          result_summary: string | null
          staff_id: string | null
          tool_name: string
        }
        Insert: {
          access: string
          ai_profile_id: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json
          ok: boolean
          result_summary?: string | null
          staff_id?: string | null
          tool_name: string
        }
        Update: {
          access?: string
          ai_profile_id?: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json
          ok?: boolean
          result_summary?: string | null
          staff_id?: string | null
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tool_calls_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tool_calls_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          created_at: string
          created_by: string | null
          default_model: string
          encrypted_key: string
          id: string
          is_active: boolean
          key_prefix: string
          label: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_model: string
          encrypted_key: string
          id?: string
          is_active?: boolean
          key_prefix: string
          label: string
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_model?: string
          encrypted_key?: string
          id?: string
          is_active?: boolean
          key_prefix?: string
          label?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_providers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_runs: {
        Row: {
          ai_profile_id: string | null
          cost_estimate_cents: number | null
          cache_write_tokens: number | null
          cache_read_tokens: number | null
          created_at: string
          error: string | null
          id: string
          input_tokens: number | null
          kb_version_id: string | null
          latency_ms: number | null
          model: string
          output_tokens: number | null
          proposal_id: string | null
          provider: string
          run_type: string
          status: string
        }
        Insert: {
          ai_profile_id?: string | null
          cost_estimate_cents?: number | null
          cache_write_tokens?: number | null
          cache_read_tokens?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          kb_version_id?: string | null
          latency_ms?: number | null
          model: string
          output_tokens?: number | null
          proposal_id?: string | null
          provider: string
          run_type: string
          status: string
        }
        Update: {
          ai_profile_id?: string | null
          cost_estimate_cents?: number | null
          cache_write_tokens?: number | null
          cache_read_tokens?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          kb_version_id?: string | null
          latency_ms?: number | null
          model?: string
          output_tokens?: number | null
          proposal_id?: string | null
          provider?: string
          run_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_runs_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_runs_kb_version_id_fkey"
            columns: ["kb_version_id"]
            isOneToOne: false
            referencedRelation: "kb_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_runs_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "ai_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      case_documents: {
        Row: {
          case_id: string
          created_at: string
          document_id: string | null
          id: string
          name: string
          required_document_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          document_id?: string | null
          id?: string
          name: string
          required_document_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          document_id?: string | null
          id?: string
          name?: string
          required_document_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_documents_required_document_id_fkey"
            columns: ["required_document_id"]
            isOneToOne: false
            referencedRelation: "required_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_employee_id: string | null
          case_type: string
          client_id: string
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string
          municipality: string | null
          permit_type_id: string | null
          priority: string | null
          reference_number: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_employee_id?: string | null
          case_type: string
          client_id: string
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          municipality?: string | null
          permit_type_id?: string | null
          priority?: string | null
          reference_number?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_employee_id?: string | null
          case_type?: string
          client_id?: string
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          municipality?: string | null
          permit_type_id?: string | null
          priority?: string | null
          reference_number?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_permit_type_id_fkey"
            columns: ["permit_type_id"]
            isOneToOne: false
            referencedRelation: "permit_types"
            referencedColumns: ["id"]
          },
        ]
      }
      client_requests: {
        Row: {
          client_id: string
          converted_to_case_id: string | null
          created_at: string | null
          description: string | null
          id: string
          municipality: string | null
          notes: string | null
          permit_type_id: string | null
          request_type: string
          reviewed_by: string | null
          status: string | null
          title: string
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          client_id: string
          converted_to_case_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          municipality?: string | null
          notes?: string | null
          permit_type_id?: string | null
          request_type: string
          reviewed_by?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          client_id?: string
          converted_to_case_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          municipality?: string | null
          notes?: string | null
          permit_type_id?: string | null
          request_type?: string
          reviewed_by?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requests_converted_to_case_id_fkey"
            columns: ["converted_to_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requests_permit_type_id_fkey"
            columns: ["permit_type_id"]
            isOneToOne: false
            referencedRelation: "permit_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          assigned_employee_id: string | null
          city: string | null
          company_name: string
          contact_name: string
          created_at: string | null
          email: string
          id: string
          kvk_number: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          assigned_employee_id?: string | null
          city?: string | null
          company_name: string
          contact_name: string
          created_at?: string | null
          email: string
          id?: string
          kvk_number?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          assigned_employee_id?: string | null
          city?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string | null
          email?: string
          id?: string
          kvk_number?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          case_id: string | null
          category: string | null
          client_id: string | null
          created_at: string | null
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          name: string
          notes: string | null
          uploaded_by: string | null
        }
        Insert: {
          case_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          name: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          name?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          case_id: string | null
          client_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          invoice_number: string
          issued_at: string
          mollie_payment_id: string | null
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          case_id?: string | null
          client_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          invoice_number: string
          issued_at?: string
          mollie_payment_id?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          case_id?: string | null
          client_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          mollie_payment_id?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_documents: {
        Row: {
          contains_pii: boolean
          created_at: string
          file_size: number
          filename: string
          id: string
          include_images: boolean
          mime_type: string
          notes: string | null
          redaction_terms: string[]
          sha256: string
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          contains_pii?: boolean
          created_at?: string
          file_size: number
          filename: string
          id?: string
          include_images?: boolean
          mime_type: string
          notes?: string | null
          redaction_terms?: string[]
          sha256: string
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          contains_pii?: boolean
          created_at?: string
          file_size?: number
          filename?: string
          id?: string
          include_images?: boolean
          mime_type?: string
          notes?: string | null
          redaction_terms?: string[]
          sha256?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_versions: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          created_at: string
          created_by: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string
          output_tokens: number | null
          prompt_version: string
          provider: string
          redactions_applied: Json | null
          rendered_markdown: string
          rules: Json
          source_documents: Json
          status: string
          version: number
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model: string
          output_tokens?: number | null
          prompt_version: string
          provider: string
          redactions_applied?: Json | null
          rendered_markdown: string
          rules: Json
          source_documents: Json
          status?: string
          version: number
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string
          output_tokens?: number | null
          prompt_version?: string
          provider?: string
          redactions_applied?: Json | null
          rendered_markdown?: string
          rules?: Json
          source_documents?: Json
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "kb_versions_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          id: string
          locale: string
          message: string | null
          name: string | null
          permit_type_id: string | null
          phone: string | null
          quiz_answers: Json | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          locale?: string
          message?: string | null
          name?: string | null
          permit_type_id?: string | null
          phone?: string | null
          quiz_answers?: Json | null
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          locale?: string
          message?: string | null
          name?: string | null
          permit_type_id?: string | null
          phone?: string | null
          quiz_answers?: Json | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_permit_type_id_fkey"
            columns: ["permit_type_id"]
            isOneToOne: false
            referencedRelation: "permit_types"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          invoice_id: string
          method: string | null
          mollie_payment_id: string
          mollie_status: string
          raw: Json | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string | null
          mollie_payment_id: string
          mollie_status: string
          raw?: Json | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string | null
          mollie_payment_id?: string
          mollie_status?: string
          raw?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_types: {
        Row: {
          base_fee_cents: number
          created_at: string
          description_en: string | null
          description_nl: string | null
          id: string
          is_active: boolean
          name_en: string
          name_nl: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          base_fee_cents?: number
          created_at?: string
          description_en?: string | null
          description_nl?: string | null
          id?: string
          is_active?: boolean
          name_en: string
          name_nl: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          base_fee_cents?: number
          created_at?: string
          description_en?: string | null
          description_nl?: string | null
          id?: string
          is_active?: boolean
          name_en?: string
          name_nl?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      required_documents: {
        Row: {
          auto_check_config: Json | null
          created_at: string
          description_en: string | null
          description_nl: string | null
          id: string
          is_required: boolean
          name_en: string
          name_nl: string
          permit_type_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          auto_check_config?: Json | null
          created_at?: string
          description_en?: string | null
          description_nl?: string | null
          id?: string
          is_required?: boolean
          name_en: string
          name_nl: string
          permit_type_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          auto_check_config?: Json | null
          created_at?: string
          description_en?: string | null
          description_nl?: string | null
          id?: string
          is_required?: boolean
          name_en?: string
          name_nl?: string
          permit_type_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "required_documents_permit_type_id_fkey"
            columns: ["permit_type_id"]
            isOneToOne: false
            referencedRelation: "permit_types"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          case_id: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          case_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          case_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_kb_version: {
        Args: { p_admin: string; p_id: string }
        Returns: boolean
      }
      active_kb_version: { Args: never; Returns: number }
      ai_usage_daily: {
        Args: { p_days?: number }
        Returns: {
          day: string
          ai_profile_id: string | null
          run_type: string
          runs: number
          errors: number
          input_tokens: number
          output_tokens: number
          cost_cents: number
        }[]
      }
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window: string }
        Returns: boolean
      }
      get_client_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_client: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      next_invoice_number: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
