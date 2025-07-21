export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          faq_id: string | null
          id: string
          is_automated: boolean | null
          message_text: string
          message_type: string | null
          sender_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          faq_id?: string | null
          id?: string
          is_automated?: boolean | null
          message_text: string
          message_type?: string | null
          sender_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          faq_id?: string | null
          id?: string
          is_automated?: boolean | null
          message_text?: string
          message_type?: string | null
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "faqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          agent_id: string | null
          ended_at: string | null
          id: string
          session_metadata: Json | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          ended_at?: string | null
          id?: string
          session_metadata?: Json | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          ended_at?: string | null
          id?: string
          session_metadata?: Json | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          order_id: string | null
          participants: string[]
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          order_id?: string | null
          participants: string[]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          order_id?: string | null
          participants?: string[]
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          created_at: string
          event_properties: Json | null
          event_type: string
          funnel_stage: string
          id: string
          order_id: string | null
          product_id: string | null
          session_id: string
          user_id: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          event_properties?: Json | null
          event_type: string
          funnel_stage: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          session_id: string
          user_id?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          event_properties?: Json | null
          event_type?: string
          funnel_stage?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          session_id?: string
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "optimized_product_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_analytics: {
        Row: {
          created_at: string
          date: string
          dimensions: Json | null
          id: string
          metric_type: string
          metric_value: number
        }
        Insert: {
          created_at?: string
          date: string
          dimensions?: Json | null
          id?: string
          metric_type: string
          metric_value?: number
        }
        Update: {
          created_at?: string
          date?: string
          dimensions?: Json | null
          id?: string
          metric_type?: string
          metric_value?: number
        }
        Relationships: []
      }
      delivery_logs: {
        Row: {
          driver_id: string | null
          id: string
          location: Json | null
          log_type: string
          metadata: Json | null
          notes: string | null
          order_id: string | null
          timestamp: string
        }
        Insert: {
          driver_id?: string | null
          id?: string
          location?: Json | null
          log_type: string
          metadata?: Json | null
          notes?: string | null
          order_id?: string | null
          timestamp?: string
        }
        Update: {
          driver_id?: string | null
          id?: string
          location?: Json | null
          log_type?: string
          metadata?: Json | null
          notes?: string | null
          order_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_evidence: {
        Row: {
          created_at: string
          description: string | null
          dispute_id: string
          evidence_type: string
          file_url: string | null
          id: string
          metadata: Json | null
          submitted_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dispute_id: string
          evidence_type: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          submitted_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dispute_id?: string
          evidence_type?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_votes: {
        Row: {
          created_at: string
          dispute_id: string
          id: string
          mediator_id: string
          reasoning: string | null
          vote: string
        }
        Insert: {
          created_at?: string
          dispute_id: string
          id?: string
          mediator_id: string
          reasoning?: string | null
          vote: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          id?: string
          mediator_id?: string
          reasoning?: string | null
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_votes_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_votes_mediator_id_fkey"
            columns: ["mediator_id"]
            isOneToOne: false
            referencedRelation: "mediators"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          assigned_mediator_id: string | null
          created_at: string
          description: string
          dispute_type: string
          filed_by: string
          id: string
          order_id: string
          priority: string
          resolution_notes: string | null
          resolution_tier: string
          resolved_at: string | null
          respondent_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_mediator_id?: string | null
          created_at?: string
          description: string
          dispute_type: string
          filed_by: string
          id?: string
          order_id: string
          priority?: string
          resolution_notes?: string | null
          resolution_tier?: string
          resolved_at?: string | null
          respondent_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_mediator_id?: string | null
          created_at?: string
          description?: string
          dispute_type?: string
          filed_by?: string
          id?: string
          order_id?: string
          priority?: string
          resolution_notes?: string | null
          resolution_tier?: string
          resolved_at?: string | null
          respondent_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_disputes: {
        Row: {
          created_at: string
          dispute_description: string | null
          dispute_reason: string
          filed_by: string | null
          id: string
          order_id: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dispute_description?: string | null
          dispute_reason: string
          filed_by?: string | null
          id?: string
          order_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dispute_description?: string | null
          dispute_reason?: string
          filed_by?: string | null
          id?: string
          order_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_disputes_filed_by_fkey"
            columns: ["filed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount_held: number
          auto_release_date: string | null
          created_at: string
          currency: string
          escrow_status: string
          id: string
          order_id: string
          platform_fee: number | null
          release_reason: string | null
          released_by: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_held: number
          auto_release_date?: string | null
          created_at?: string
          currency?: string
          escrow_status?: string
          id?: string
          order_id: string
          platform_fee?: number | null
          release_reason?: string | null
          released_by?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_held?: number
          auto_release_date?: string | null
          created_at?: string
          currency?: string
          escrow_status?: string
          id?: string
          order_id?: string
          platform_fee?: number | null
          release_reason?: string | null
          released_by?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          helpful_count: number | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          question: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          feedback_type: string
          helpful_count: number | null
          id: string
          is_anonymous: boolean | null
          order_id: string | null
          rating: number
          reviewee_id: string | null
          reviewer_id: string | null
          reviewer_type: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          feedback_type: string
          helpful_count?: number | null
          id?: string
          is_anonymous?: boolean | null
          order_id?: string | null
          rating: number
          reviewee_id?: string | null
          reviewer_id?: string | null
          reviewer_type: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: string
          helpful_count?: number | null
          id?: string
          is_anonymous?: boolean | null
          order_id?: string | null
          rating?: number
          reviewee_id?: string | null
          reviewer_id?: string | null
          reviewer_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_prompts: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_completed: boolean | null
          last_reminded_at: string | null
          order_id: string | null
          prompt_type: string
          reminded_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_reminded_at?: string | null
          order_id?: string | null
          prompt_type: string
          reminded_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_reminded_at?: string | null
          order_id?: string | null
          prompt_type?: string
          reminded_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_prompts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          assigned_to: string | null
          auto_generated: boolean | null
          created_at: string
          description: string
          evidence: Json
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          rule_id: string | null
          severity: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          assigned_to?: string | null
          auto_generated?: boolean | null
          created_at?: string
          description: string
          evidence: Json
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          rule_id?: string | null
          severity: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          assigned_to?: string | null
          auto_generated?: boolean | null
          created_at?: string
          description?: string
          evidence?: Json
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          rule_id?: string | null
          severity?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "fraud_detection_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_detection_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          rule_name: string
          rule_type: string
          severity: string | null
          threshold_timeframe: unknown | null
          threshold_value: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          rule_name: string
          rule_type: string
          severity?: string | null
          threshold_timeframe?: unknown | null
          threshold_value?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          rule_name?: string
          rule_type?: string
          severity?: string | null
          threshold_timeframe?: unknown | null
          threshold_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fraud_reports: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          evidence: Json | null
          id: string
          report_type: string
          reported_user_id: string
          reporter_id: string | null
          resolution_notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          evidence?: Json | null
          id?: string
          report_type: string
          reported_user_id: string
          reporter_id?: string | null
          resolution_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          evidence?: Json | null
          id?: string
          report_type?: string
          reported_user_id?: string
          reporter_id?: string | null
          resolution_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          kyc_verification_id: string
          mime_type: string | null
          processing_results: Json | null
          upload_status: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          kyc_verification_id: string
          mime_type?: string | null
          processing_results?: Json | null
          upload_status?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          kyc_verification_id?: string
          mime_type?: string | null
          processing_results?: Json | null
          upload_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_kyc_verification_id_fkey"
            columns: ["kyc_verification_id"]
            isOneToOne: false
            referencedRelation: "kyc_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_requirements: {
        Row: {
          created_at: string
          daily_transaction_limit: number | null
          id: string
          is_active: boolean | null
          max_transaction_amount: number | null
          monthly_transaction_limit: number | null
          required_documents: string[]
          requirement_level: string
        }
        Insert: {
          created_at?: string
          daily_transaction_limit?: number | null
          id?: string
          is_active?: boolean | null
          max_transaction_amount?: number | null
          monthly_transaction_limit?: number | null
          required_documents: string[]
          requirement_level: string
        }
        Update: {
          created_at?: string
          daily_transaction_limit?: number | null
          id?: string
          is_active?: boolean | null
          max_transaction_amount?: number | null
          monthly_transaction_limit?: number | null
          required_documents?: string[]
          requirement_level?: string
        }
        Relationships: []
      }
      kyc_verification_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          kyc_verification_id: string
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          performed_by: string | null
          reason: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          kyc_verification_id: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          performed_by?: string | null
          reason?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          kyc_verification_id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          performed_by?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_verification_logs_kyc_verification_id_fkey"
            columns: ["kyc_verification_id"]
            isOneToOne: false
            referencedRelation: "kyc_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_verifications: {
        Row: {
          confidence_score: number | null
          created_at: string
          document_country: string | null
          document_expiry_date: string | null
          document_number: string | null
          document_type: string | null
          expires_at: string | null
          id: string
          last_attempt_date: string | null
          provider_verification_id: string | null
          rejected_at: string | null
          rejection_reason: string | null
          updated_at: string
          user_id: string
          verification_attempts: number | null
          verification_level: string
          verification_provider: string | null
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          document_country?: string | null
          document_expiry_date?: string | null
          document_number?: string | null
          document_type?: string | null
          expires_at?: string | null
          id?: string
          last_attempt_date?: string | null
          provider_verification_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          updated_at?: string
          user_id: string
          verification_attempts?: number | null
          verification_level?: string
          verification_provider?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          document_country?: string | null
          document_expiry_date?: string | null
          document_number?: string | null
          document_type?: string | null
          expires_at?: string | null
          id?: string
          last_attempt_date?: string | null
          provider_verification_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          updated_at?: string
          user_id?: string
          verification_attempts?: number | null
          verification_level?: string
          verification_provider?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_rtl: boolean | null
          name: string
          native_name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_rtl?: boolean | null
          name: string
          native_name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_rtl?: boolean | null
          name?: string
          native_name?: string
        }
        Relationships: []
      }
      mediators: {
        Row: {
          certified_at: string | null
          created_at: string
          id: string
          is_active: boolean
          rating: number | null
          specializations: string[] | null
          successful_resolutions: number | null
          total_cases: number | null
          user_id: string
        }
        Insert: {
          certified_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          rating?: number | null
          specializations?: string[] | null
          successful_resolutions?: number | null
          total_cases?: number | null
          user_id: string
        }
        Update: {
          certified_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          rating?: number | null
          specializations?: string[] | null
          successful_resolutions?: number | null
          total_cases?: number | null
          user_id?: string
        }
        Relationships: []
      }
      message_translations: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          language_code: string
          message_id: string
          translated_text: string
          translation_service: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          language_code: string
          message_id: string
          translated_text: string
          translation_service?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          language_code?: string
          message_id?: string
          translated_text?: string
          translation_service?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "message_translations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          conversation_id: string
          created_at: string
          encryption_key_id: string | null
          id: string
          is_encrypted: boolean | null
          is_read: boolean | null
          message_text: string | null
          message_type: string | null
          order_id: string | null
          recipient_id: string | null
          sender_id: string | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          conversation_id: string
          created_at?: string
          encryption_key_id?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_read?: boolean | null
          message_text?: string | null
          message_type?: string | null
          order_id?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          conversation_id?: string
          created_at?: string
          encryption_key_id?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_read?: boolean | null
          message_text?: string | null
          message_type?: string | null
          order_id?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          email_sent: boolean | null
          expires_at: string | null
          id: string
          message: string
          priority: string | null
          push_sent: boolean | null
          read: boolean | null
          read_at: string | null
          sms_sent: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          email_sent?: boolean | null
          expires_at?: string | null
          id?: string
          message: string
          priority?: string | null
          push_sent?: boolean | null
          read?: boolean | null
          read_at?: string | null
          sms_sent?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          email_sent?: boolean | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          push_sent?: boolean | null
          read?: boolean | null
          read_at?: string | null
          sms_sent?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          location_data: Json | null
          new_stage: string | null
          new_status: string | null
          order_id: string | null
          previous_stage: string | null
          previous_status: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          location_data?: Json | null
          new_stage?: string | null
          new_status?: string | null
          order_id?: string | null
          previous_stage?: string | null
          previous_status?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          location_data?: Json | null
          new_stage?: string | null
          new_status?: string | null
          order_id?: string | null
          previous_stage?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string | null
          created_at: string
          current_stage: string | null
          driver_id: string | null
          driver_to_shop_qr: string | null
          escrow_release_date: string | null
          id: string
          order_status: string
          payment_status: string
          product_name: string
          product_price: number
          quantity: number
          seller_id: string | null
          seller_to_driver_qr: string | null
          shipping_address: Json
          shop_id: string | null
          shop_to_buyer_qr: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          current_stage?: string | null
          driver_id?: string | null
          driver_to_shop_qr?: string | null
          escrow_release_date?: string | null
          id?: string
          order_status?: string
          payment_status?: string
          product_name: string
          product_price: number
          quantity?: number
          seller_id?: string | null
          seller_to_driver_qr?: string | null
          shipping_address: Json
          shop_id?: string | null
          shop_to_buyer_qr?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          current_stage?: string | null
          driver_id?: string | null
          driver_to_shop_qr?: string | null
          escrow_release_date?: string | null
          id?: string
          order_status?: string
          payment_status?: string
          product_name?: string
          product_price?: number
          quantity?: number
          seller_id?: string | null
          seller_to_driver_qr?: string | null
          shipping_address?: Json
          shop_id?: string | null
          shop_to_buyer_qr?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          page_title: string | null
          page_url: string
          referrer: string | null
          scroll_depth: number | null
          session_id: string
          time_on_page: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          page_title?: string | null
          page_url: string
          referrer?: string | null
          scroll_depth?: number | null
          session_id: string
          time_on_page?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          page_title?: string | null
          page_url?: string
          referrer?: string | null
          scroll_depth?: number | null
          session_id?: string
          time_on_page?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_notifications: {
        Row: {
          created_at: string
          email_sent: boolean | null
          id: string
          in_app_read: boolean | null
          message_body: string
          message_title: string
          notification_type: string
          order_id: string | null
          recipient_type: string
          sms_sent: boolean | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          in_app_read?: boolean | null
          message_body: string
          message_title: string
          notification_type: string
          order_id?: string | null
          recipient_type: string
          sms_sent?: boolean | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          in_app_read?: boolean | null
          message_body?: string
          message_title?: string
          notification_type?: string
          order_id?: string | null
          recipient_type?: string
          sms_sent?: boolean | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_notifications_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          escrow_status: string
          held_at: string
          id: string
          order_id: string | null
          payment_method: string
          released_at: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          escrow_status?: string
          held_at?: string
          id?: string
          order_id?: string | null
          payment_method: string
          released_at?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          escrow_status?: string
          held_at?: string
          id?: string
          order_id?: string | null
          payment_method?: string
          released_at?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_analytics: {
        Row: {
          category: string | null
          created_at: string
          event_properties: Json | null
          event_type: string
          id: string
          price: number | null
          product_id: string | null
          referrer: string | null
          search_query: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          event_properties?: Json | null
          event_type: string
          id?: string
          price?: number | null
          product_id?: string | null
          referrer?: string | null
          search_query?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          event_properties?: Json | null
          event_type?: string
          id?: string
          price?: number | null
          product_id?: string | null
          referrer?: string | null
          search_query?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "optimized_product_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_translations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_auto_translated: boolean | null
          language_code: string
          name: string
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_auto_translated?: boolean | null
          language_code: string
          name: string
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_auto_translated?: boolean | null
          language_code?: string
          name?: string
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "optimized_product_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          currency: string | null
          description: string | null
          featured: boolean | null
          id: string
          images: Json | null
          is_active: boolean | null
          listing_created_at: string | null
          listing_qr_code: string | null
          location: Json | null
          name: string
          price: number
          seller_id: string | null
          stock_quantity: number | null
          tags: string[] | null
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          listing_created_at?: string | null
          listing_qr_code?: string | null
          location?: Json | null
          name: string
          price: number
          seller_id?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          listing_created_at?: string | null
          listing_qr_code?: string | null
          location?: Json | null
          name?: string
          price?: number
          seller_id?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auto_translate_messages: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          detect_language_automatically: boolean | null
          first_name: string | null
          id: string
          is_active: boolean | null
          kyc_level: string | null
          kyc_status: string | null
          last_name: string | null
          location: Json | null
          phone_number: string | null
          preferred_language: string | null
          rating: number | null
          total_ratings: number | null
          two_factor_backup_codes: string[] | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          two_factor_verified_at: string | null
          updated_at: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"] | null
          user_type: string
          verification_documents: Json | null
          verification_expires_at: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          auto_translate_messages?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          detect_language_automatically?: boolean | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          kyc_level?: string | null
          kyc_status?: string | null
          last_name?: string | null
          location?: Json | null
          phone_number?: string | null
          preferred_language?: string | null
          rating?: number | null
          total_ratings?: number | null
          two_factor_backup_codes?: string[] | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          two_factor_verified_at?: string | null
          updated_at?: string
          user_id: string
          user_role?: Database["public"]["Enums"]["user_role"] | null
          user_type: string
          verification_documents?: Json | null
          verification_expires_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          auto_translate_messages?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          detect_language_automatically?: boolean | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          kyc_level?: string | null
          kyc_status?: string | null
          last_name?: string | null
          location?: Json | null
          phone_number?: string | null
          preferred_language?: string | null
          rating?: number | null
          total_ratings?: number | null
          two_factor_backup_codes?: string[] | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          two_factor_verified_at?: string | null
          updated_at?: string
          user_id?: string
          user_role?: Database["public"]["Enums"]["user_role"] | null
          user_type?: string
          verification_documents?: Json | null
          verification_expires_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_language_fkey"
            columns: ["preferred_language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      qr_scans: {
        Row: {
          id: string
          location_data: Json | null
          notes: string | null
          order_id: string | null
          qr_code: string
          scan_stage: string
          scanned_at: string
          scanned_by: string | null
        }
        Insert: {
          id?: string
          location_data?: Json | null
          notes?: string | null
          order_id?: string | null
          qr_code: string
          scan_stage: string
          scanned_at?: string
          scanned_by?: string | null
        }
        Update: {
          id?: string
          location_data?: Json | null
          notes?: string | null
          order_id?: string | null
          qr_code?: string
          scan_stage?: string
          scanned_at?: string
          scanned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_verification_logs: {
        Row: {
          expires_at: string
          id: string
          location_data: Json | null
          order_id: string
          qr_code: string
          scan_stage: string
          scanned_at: string
          scanned_by: string
          security_hash: string
          verification_status: string
        }
        Insert: {
          expires_at: string
          id?: string
          location_data?: Json | null
          order_id: string
          qr_code: string
          scan_stage: string
          scanned_at?: string
          scanned_by: string
          security_hash: string
          verification_status?: string
        }
        Update: {
          expires_at?: string
          id?: string
          location_data?: Json | null
          order_id?: string
          qr_code?: string
          scan_stage?: string
          scanned_at?: string
          scanned_by?: string
          security_hash?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_verification_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action_performed: string
          admin_id: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          severity: string
          target_id: string | null
          target_resource: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_performed: string
          admin_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity?: string
          target_id?: string | null
          target_resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_performed?: string
          admin_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity?: string
          target_id?: string | null
          target_resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          product_id: string | null
          read_at: string | null
          seller_id: string | null
          threshold_quantity: number | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          product_id?: string | null
          read_at?: string | null
          seller_id?: string | null
          threshold_quantity?: number | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          product_id?: string | null
          read_at?: string | null
          seller_id?: string | null
          threshold_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "optimized_product_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_responses: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_internal_note: boolean | null
          responder_id: string
          response_text: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal_note?: boolean | null
          responder_id: string
          response_text: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal_note?: boolean | null
          responder_id?: string
          response_text?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          first_response_at: string | null
          id: string
          metadata: Json | null
          priority: string
          resolved_at: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_qr_codes: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          order_id: string | null
          payment_id: string | null
          product_id: string | null
          qr_code_identifier: string
          qr_data_url: string | null
          scan_count: number | null
          transaction_id: string
          transaction_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          order_id?: string | null
          payment_id?: string | null
          product_id?: string | null
          qr_code_identifier: string
          qr_data_url?: string | null
          scan_count?: number | null
          transaction_id: string
          transaction_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          order_id?: string | null
          payment_id?: string | null
          product_id?: string | null
          qr_code_identifier?: string
          qr_data_url?: string | null
          scan_count?: number | null
          transaction_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_qr_codes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_qr_codes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_qr_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "optimized_product_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_qr_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          auto_release_date: string | null
          created_at: string
          currency: string | null
          escrow_locked_at: string | null
          escrow_release_reason: string | null
          escrow_released_at: string | null
          external_transaction_id: string | null
          gateway_provider: string | null
          gateway_response: Json | null
          gateway_transaction_id: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          payment_method: string | null
          status: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          auto_release_date?: string | null
          created_at?: string
          currency?: string | null
          escrow_locked_at?: string | null
          escrow_release_reason?: string | null
          escrow_released_at?: string | null
          external_transaction_id?: string | null
          gateway_provider?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method?: string | null
          status?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          auto_release_date?: string | null
          created_at?: string
          currency?: string | null
          escrow_locked_at?: string | null
          escrow_release_reason?: string | null
          escrow_released_at?: string | null
          external_transaction_id?: string | null
          gateway_provider?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          context: string | null
          created_at: string | null
          id: string
          is_auto_translated: boolean | null
          language_code: string
          translated_text: string
          translation_key: string
          updated_at: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: string
          is_auto_translated?: boolean | null
          language_code: string
          translated_text: string
          translation_key: string
          updated_at?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: string
          is_auto_translated?: boolean | null
          language_code?: string
          translated_text?: string
          translation_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      two_factor_logs: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_used: boolean | null
          used_at: string | null
          user_id: string
          verification_code: string | null
          verification_method: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          user_id: string
          verification_code?: string | null
          verification_method: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          user_id?: string
          verification_code?: string | null
          verification_method?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          geolocation: Json | null
          id: string
          ip_address: unknown
          risk_score: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          geolocation?: Json | null
          id?: string
          ip_address: unknown
          risk_score?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          geolocation?: Json | null
          id?: string
          ip_address?: unknown
          risk_score?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          event_properties: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          os: string | null
          page_url: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name: string
          event_properties?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          os?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          event_properties?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          os?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      user_restrictions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          reason: string
          restricted_by: string | null
          restriction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          restricted_by?: string | null
          restriction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          restricted_by?: string | null
          restriction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          city: string | null
          conversion_value: number | null
          converted: boolean | null
          country: string | null
          device_type: string | null
          duration: number | null
          ended_at: string | null
          entry_page: string | null
          events_count: number | null
          exit_page: string | null
          id: string
          ip_address: unknown | null
          is_bounce: boolean | null
          os: string | null
          page_views_count: number | null
          referrer: string | null
          session_id: string
          started_at: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          country?: string | null
          device_type?: string | null
          duration?: number | null
          ended_at?: string | null
          entry_page?: string | null
          events_count?: number | null
          exit_page?: string | null
          id?: string
          ip_address?: unknown | null
          is_bounce?: boolean | null
          os?: string | null
          page_views_count?: number | null
          referrer?: string | null
          session_id: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          country?: string | null
          device_type?: string | null
          duration?: number | null
          ended_at?: string | null
          entry_page?: string | null
          events_count?: number | null
          exit_page?: string | null
          id?: string
          ip_address?: unknown | null
          is_bounce?: boolean | null
          os?: string | null
          page_views_count?: number | null
          referrer?: string | null
          session_id?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      optimized_product_listings: {
        Row: {
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          featured: boolean | null
          id: string | null
          images: Json | null
          location: Json | null
          name: string | null
          price: number | null
          seller_id: string | null
          seller_name: string | null
          seller_rating: number | null
          stock_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      assign_mediator_to_dispute: {
        Args: { dispute_uuid: string }
        Returns: string
      }
      can_user_transact: {
        Args: { p_user_id: string; p_transaction_amount?: number }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_message: string
          p_data?: Json
          p_priority?: string
        }
        Returns: string
      }
      create_payment_notification: {
        Args: {
          p_transaction_id: string
          p_order_id: string
          p_notification_type: string
          p_recipient_type: string
          p_title: string
          p_body: string
        }
        Returns: string
      }
      create_two_factor_code: {
        Args: {
          p_user_id: string
          p_method?: string
          p_expires_minutes?: number
        }
        Returns: string
      }
      detect_browser_language: {
        Args: { accept_language: string }
        Returns: string
      }
      detect_ip_fraud: {
        Args: { p_ip_address: unknown; p_timeframe?: unknown }
        Returns: Json
      }
      detect_velocity_fraud: {
        Args: {
          p_user_id: string
          p_transaction_amount: number
          p_timeframe?: unknown
        }
        Returns: Json
      }
      expire_kyc_verifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_daily_analytics: {
        Args: { target_date?: string }
        Returns: undefined
      }
      generate_qr_identifier: {
        Args: { order_uuid: string; stage: string }
        Returns: string
      }
      generate_secure_qr: {
        Args: { p_order_id: string; p_stage: string; p_expires_hours?: number }
        Returns: string
      }
      generate_transaction_qr: {
        Args: {
          p_transaction_type: string
          p_transaction_id: string
          p_product_id?: string
          p_order_id?: string
          p_payment_id?: string
          p_metadata?: Json
        }
        Returns: string
      }
      generate_verification_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_language: {
        Args: { user_uuid?: string }
        Returns: string
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      log_activity_and_check_fraud: {
        Args: {
          p_user_id: string
          p_ip_address: unknown
          p_activity_type: string
          p_activity_data?: Json
          p_user_agent?: string
          p_session_id?: string
        }
        Returns: Json
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_severity?: string
          p_user_id?: string
          p_admin_id?: string
          p_target_resource?: string
          p_target_id?: string
          p_action_performed?: string
          p_metadata?: Json
        }
        Returns: string
      }
      match_faq_response: {
        Args: { p_message_text: string }
        Returns: string
      }
      refresh_stats_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      resolve_dispute_by_votes: {
        Args: { dispute_uuid: string }
        Returns: string
      }
      track_page_view: {
        Args: {
          p_user_id?: string
          p_session_id?: string
          p_page_url?: string
          p_page_title?: string
          p_referrer?: string
          p_user_agent?: string
          p_ip_address?: unknown
        }
        Returns: string
      }
      track_product_event: {
        Args: {
          p_product_id?: string
          p_user_id?: string
          p_session_id?: string
          p_event_type?: string
          p_search_query?: string
          p_category?: string
          p_price?: number
          p_event_properties?: Json
        }
        Returns: string
      }
      track_user_event: {
        Args: {
          p_user_id?: string
          p_session_id?: string
          p_event_type?: string
          p_event_name?: string
          p_page_url?: string
          p_event_properties?: Json
          p_user_agent?: string
          p_ip_address?: unknown
        }
        Returns: string
      }
      verify_qr_scan: {
        Args: { p_qr_code: string; p_scanner_id: string; p_location?: Json }
        Returns: boolean
      }
      verify_two_factor_code: {
        Args: { p_user_id: string; p_code: string; p_method?: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "moderator" | "user"
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
    Enums: {
      user_role: ["admin", "moderator", "user"],
    },
  },
} as const
