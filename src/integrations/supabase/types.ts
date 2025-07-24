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
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_amount: number
          order_id: string | null
          paid_at: string | null
          referral_id: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_amount?: number
          order_id?: string | null
          paid_at?: string | null
          referral_id?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_amount?: number
          order_id?: string | null
          paid_at?: string | null
          referral_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          admin_notes: string | null
          affiliate_id: string
          id: string
          payment_details: Json | null
          payment_method: string
          processed_at: string | null
          processed_by: string | null
          requested_amount: number
          requested_at: string
          status: string
        }
        Insert: {
          admin_notes?: string | null
          affiliate_id: string
          id?: string
          payment_details?: Json | null
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_amount: number
          requested_at?: string
          status?: string
        }
        Update: {
          admin_notes?: string | null
          affiliate_id?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_amount?: number
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          conversion_status: string
          converted_at: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          referral_code: string
          referred_user_id: string | null
          source_url: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          conversion_status?: string
          converted_at?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          referral_code: string
          referred_user_id?: string | null
          source_url?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          conversion_status?: string
          converted_at?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          referral_code?: string
          referred_user_id?: string | null
          source_url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_tiers: {
        Row: {
          benefits: Json | null
          commission_rate: number
          created_at: string
          id: string
          is_active: boolean
          min_referrals: number
          min_sales: number
          tier_name: string
        }
        Insert: {
          benefits?: Json | null
          commission_rate: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_referrals?: number
          min_sales?: number
          tier_name: string
        }
        Update: {
          benefits?: Json | null
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_referrals?: number
          min_sales?: number
          tier_name?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          commission_tier: string
          created_at: string
          id: string
          paid_earnings: number
          pending_earnings: number
          referral_code: string
          status: string
          total_earnings: number
          total_referrals: number
          total_sales: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_tier?: string
          created_at?: string
          id?: string
          paid_earnings?: number
          pending_earnings?: number
          referral_code: string
          status?: string
          total_earnings?: number
          total_referrals?: number
          total_sales?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_tier?: string
          created_at?: string
          id?: string
          paid_earnings?: number
          pending_earnings?: number
          referral_code?: string
          status?: string
          total_earnings?: number
          total_referrals?: number
          total_sales?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alert_settings: {
        Row: {
          id: string
          is_active: boolean
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      auction_bids: {
        Row: {
          auction_id: string
          bid_amount: number
          bid_time: string
          bidder_id: string
          id: string
          invalidation_reason: string | null
          ip_address: unknown | null
          is_valid: boolean
          is_winning_bid: boolean
          max_bid: number | null
          user_agent: string | null
        }
        Insert: {
          auction_id: string
          bid_amount: number
          bid_time?: string
          bidder_id: string
          id?: string
          invalidation_reason?: string | null
          ip_address?: unknown | null
          is_valid?: boolean
          is_winning_bid?: boolean
          max_bid?: number | null
          user_agent?: string | null
        }
        Update: {
          auction_id?: string
          bid_amount?: number
          bid_time?: string
          bidder_id?: string
          id?: string
          invalidation_reason?: string | null
          ip_address?: unknown | null
          is_valid?: boolean
          is_winning_bid?: boolean
          max_bid?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_escrow: {
        Row: {
          auction_id: string
          created_at: string
          escrow_status: string
          funded_at: string | null
          id: string
          payment_intent_id: string | null
          platform_fee: number
          refunded_at: string | null
          released_at: string | null
          seller_id: string
          updated_at: string
          winner_id: string
          winning_bid: number
        }
        Insert: {
          auction_id: string
          created_at?: string
          escrow_status?: string
          funded_at?: string | null
          id?: string
          payment_intent_id?: string | null
          platform_fee?: number
          refunded_at?: string | null
          released_at?: string | null
          seller_id: string
          updated_at?: string
          winner_id: string
          winning_bid: number
        }
        Update: {
          auction_id?: string
          created_at?: string
          escrow_status?: string
          funded_at?: string | null
          id?: string
          payment_intent_id?: string | null
          platform_fee?: number
          refunded_at?: string | null
          released_at?: string | null
          seller_id?: string
          updated_at?: string
          winner_id?: string
          winning_bid?: number
        }
        Relationships: [
          {
            foreignKeyName: "auction_escrow_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_notifications: {
        Row: {
          auction_id: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          notification_type: string
          title: string
          user_id: string
        }
        Insert: {
          auction_id: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          title: string
          user_id: string
        }
        Update: {
          auction_id?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_notifications_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_watchers: {
        Row: {
          auction_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          auction_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          auction_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_watchers_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          auto_extend_on_bid: boolean | null
          bid_increment: number
          bid_increment_type: Database["public"]["Enums"]["bid_increment_type"]
          cancelled_at: string | null
          cancelled_by: string | null
          cancelled_reason: string | null
          category: string | null
          created_at: string
          current_bid: number
          description: string
          end_time: string
          extension_time_minutes: number | null
          id: string
          images: Json | null
          location: string | null
          product_id: string | null
          reserve_price: number | null
          seller_id: string
          shipping_details: Json | null
          start_time: string
          starting_bid: number
          status: Database["public"]["Enums"]["auction_status"]
          terms_conditions: string | null
          title: string
          total_bids: number
          updated_at: string
          watchers_count: number
          winner_id: string | null
        }
        Insert: {
          auto_extend_on_bid?: boolean | null
          bid_increment?: number
          bid_increment_type?: Database["public"]["Enums"]["bid_increment_type"]
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          category?: string | null
          created_at?: string
          current_bid?: number
          description: string
          end_time: string
          extension_time_minutes?: number | null
          id?: string
          images?: Json | null
          location?: string | null
          product_id?: string | null
          reserve_price?: number | null
          seller_id: string
          shipping_details?: Json | null
          start_time?: string
          starting_bid?: number
          status?: Database["public"]["Enums"]["auction_status"]
          terms_conditions?: string | null
          title: string
          total_bids?: number
          updated_at?: string
          watchers_count?: number
          winner_id?: string | null
        }
        Update: {
          auto_extend_on_bid?: boolean | null
          bid_increment?: number
          bid_increment_type?: Database["public"]["Enums"]["bid_increment_type"]
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          category?: string | null
          created_at?: string
          current_bid?: number
          description?: string
          end_time?: string
          extension_time_minutes?: number | null
          id?: string
          images?: Json | null
          location?: string | null
          product_id?: string | null
          reserve_price?: number | null
          seller_id?: string
          shipping_details?: Json | null
          start_time?: string
          starting_bid?: number
          status?: Database["public"]["Enums"]["auction_status"]
          terms_conditions?: string | null
          title?: string
          total_bids?: number
          updated_at?: string
          watchers_count?: number
          winner_id?: string | null
        }
        Relationships: []
      }
      automated_messages: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_status: string
          failure_reason: string | null
          id: string
          message_content: string
          message_type: string
          metadata: Json | null
          order_id: string | null
          recipient_id: string
          recipient_type: string
          retry_count: number
          sent_at: string | null
          subject: string
          template_used: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          failure_reason?: string | null
          id?: string
          message_content: string
          message_type: string
          metadata?: Json | null
          order_id?: string | null
          recipient_id: string
          recipient_type: string
          retry_count?: number
          sent_at?: string | null
          subject: string
          template_used?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          failure_reason?: string | null
          id?: string
          message_content?: string
          message_type?: string
          metadata?: Json | null
          order_id?: string | null
          recipient_id?: string
          recipient_type?: string
          retry_count?: number
          sent_at?: string | null
          subject?: string
          template_used?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automated_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_logs: {
        Row: {
          backup_duration_seconds: number | null
          backup_type: string
          created_at: string
          error_message: string | null
          file_path: string | null
          file_size: number | null
          id: string
          metadata: Json | null
          status: string
        }
        Insert: {
          backup_duration_seconds?: number | null
          backup_type: string
          created_at?: string
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          status: string
        }
        Update: {
          backup_duration_seconds?: number | null
          backup_type?: string
          created_at?: string
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          status?: string
        }
        Relationships: []
      }
      brand_followers: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_followers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_products: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "optimized_product_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          average_rating: number | null
          category: string | null
          country: string | null
          created_at: string | null
          description: string | null
          founded_year: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          name: string
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          total_products: number | null
          total_ratings: number | null
          total_sales: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          average_rating?: number | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          name: string
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          total_products?: number | null
          total_ratings?: number | null
          total_sales?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          average_rating?: number | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          name?: string
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          total_products?: number | null
          total_ratings?: number | null
          total_sales?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
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
      content_translations: {
        Row: {
          confidence_score: number | null
          content_id: string | null
          content_type: string | null
          created_at: string
          id: string
          original_text: string
          source_language: string
          target_language: string
          translated_text: string
          translation_service: string | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          original_text: string
          source_language?: string
          target_language: string
          translated_text: string
          translation_service?: string | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          original_text?: string
          source_language?: string
          target_language?: string
          translated_text?: string
          translation_service?: string | null
          updated_at?: string
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
      data_classification: {
        Row: {
          classification_level: string
          column_name: string
          compliance_tags: string[] | null
          created_at: string
          encryption_required: boolean
          id: string
          retention_period: unknown | null
          table_name: string
          updated_at: string
        }
        Insert: {
          classification_level: string
          column_name: string
          compliance_tags?: string[] | null
          created_at?: string
          encryption_required?: boolean
          id?: string
          retention_period?: unknown | null
          table_name: string
          updated_at?: string
        }
        Update: {
          classification_level?: string
          column_name?: string
          compliance_tags?: string[] | null
          created_at?: string
          encryption_required?: boolean
          id?: string
          retention_period?: unknown | null
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_checkpoints: {
        Row: {
          checkpoint_location: string | null
          checkpoint_time: string
          checkpoint_type: string
          created_at: string
          delivery_tracking_id: string | null
          id: string
          location_coordinates: Json | null
          notes: string | null
          photos: Json | null
          qr_code_used: string | null
          scanned_by: string | null
          signature_data: string | null
          weather_conditions: string | null
        }
        Insert: {
          checkpoint_location?: string | null
          checkpoint_time?: string
          checkpoint_type: string
          created_at?: string
          delivery_tracking_id?: string | null
          id?: string
          location_coordinates?: Json | null
          notes?: string | null
          photos?: Json | null
          qr_code_used?: string | null
          scanned_by?: string | null
          signature_data?: string | null
          weather_conditions?: string | null
        }
        Update: {
          checkpoint_location?: string | null
          checkpoint_time?: string
          checkpoint_type?: string
          created_at?: string
          delivery_tracking_id?: string | null
          id?: string
          location_coordinates?: Json | null
          notes?: string | null
          photos?: Json | null
          qr_code_used?: string | null
          scanned_by?: string | null
          signature_data?: string | null
          weather_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_checkpoints_delivery_tracking_id_fkey"
            columns: ["delivery_tracking_id"]
            isOneToOne: false
            referencedRelation: "delivery_tracking"
            referencedColumns: ["id"]
          },
        ]
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
      delivery_tracking: {
        Row: {
          actual_delivery_time: string | null
          created_at: string
          current_holder_id: string | null
          current_holder_type: string | null
          current_location: string | null
          delivery_instructions: string | null
          estimated_delivery_time: string | null
          id: string
          order_id: string | null
          priority_level: string | null
          special_handling_notes: string | null
          tracking_number: string
          updated_at: string
        }
        Insert: {
          actual_delivery_time?: string | null
          created_at?: string
          current_holder_id?: string | null
          current_holder_type?: string | null
          current_location?: string | null
          delivery_instructions?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_id?: string | null
          priority_level?: string | null
          special_handling_notes?: string | null
          tracking_number: string
          updated_at?: string
        }
        Update: {
          actual_delivery_time?: string | null
          created_at?: string
          current_holder_id?: string | null
          current_holder_type?: string | null
          current_location?: string | null
          delivery_instructions?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_id?: string | null
          priority_level?: string | null
          special_handling_notes?: string | null
          tracking_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_order_id_fkey"
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
      email_verifications: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          updated_at: string
          user_data: Json | null
          user_id: string
          user_type: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          updated_at?: string
          user_data?: Json | null
          user_id: string
          user_type?: string
          verification_token: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          updated_at?: string
          user_data?: Json | null
          user_id?: string
          user_type?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      encryption_audit_logs: {
        Row: {
          client_ip: unknown | null
          created_at: string
          error_message: string | null
          id: string
          key_id: string | null
          operation_metadata: Json | null
          operation_type: string
          performed_by: string | null
          record_id: string | null
          success: boolean
          table_name: string
          user_agent: string | null
        }
        Insert: {
          client_ip?: unknown | null
          created_at?: string
          error_message?: string | null
          id?: string
          key_id?: string | null
          operation_metadata?: Json | null
          operation_type: string
          performed_by?: string | null
          record_id?: string | null
          success: boolean
          table_name: string
          user_agent?: string | null
        }
        Update: {
          client_ip?: unknown | null
          created_at?: string
          error_message?: string | null
          id?: string
          key_id?: string | null
          operation_metadata?: Json | null
          operation_type?: string
          performed_by?: string | null
          record_id?: string | null
          success?: boolean
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      encryption_keys: {
        Row: {
          algorithm: string
          created_at: string
          created_by: string | null
          encrypted_key_data: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_id: string
          key_purpose: string
          last_used_at: string | null
          usage_count: number
        }
        Insert: {
          algorithm?: string
          created_at?: string
          created_by?: string | null
          encrypted_key_data: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_id: string
          key_purpose: string
          last_used_at?: string | null
          usage_count?: number
        }
        Update: {
          algorithm?: string
          created_at?: string
          created_by?: string | null
          encrypted_key_data?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_id?: string
          key_purpose?: string
          last_used_at?: string | null
          usage_count?: number
        }
        Relationships: []
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
      flash_sale_purchases: {
        Row: {
          created_at: string | null
          flash_sale_id: string
          id: string
          order_id: string | null
          purchase_price: number
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          flash_sale_id: string
          id?: string
          order_id?: string | null
          purchase_price: number
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          flash_sale_id?: string
          id?: string
          order_id?: string | null
          purchase_price?: number
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_sale_purchases_flash_sale_id_fkey"
            columns: ["flash_sale_id"]
            isOneToOne: false
            referencedRelation: "flash_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sale_purchases_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_percentage: number | null
          end_time: string
          featured: boolean | null
          id: string
          is_active: boolean | null
          original_price: number
          product_id: string | null
          quantity_available: number | null
          quantity_sold: number | null
          sale_price: number
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_percentage?: number | null
          end_time: string
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          original_price: number
          product_id?: string | null
          quantity_available?: number | null
          quantity_sold?: number | null
          sale_price: number
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_percentage?: number | null
          end_time?: string
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          original_price?: number
          product_id?: string | null
          quantity_available?: number | null
          quantity_sold?: number | null
          sale_price?: number
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flash_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "optimized_product_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      localized_content: {
        Row: {
          content_key: string
          content_text: string
          content_type: string
          created_at: string
          id: string
          language_code: string
          region: string | null
          updated_at: string
        }
        Insert: {
          content_key: string
          content_text: string
          content_type?: string
          created_at?: string
          id?: string
          language_code: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          content_key?: string
          content_text?: string
          content_type?: string
          created_at?: string
          id?: string
          language_code?: string
          region?: string | null
          updated_at?: string
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
      message_templates: {
        Row: {
          content_template: string
          created_at: string
          id: string
          is_active: boolean
          message_type: string
          recipient_type: string
          subject_template: string
          template_name: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          content_template: string
          created_at?: string
          id?: string
          is_active?: boolean
          message_type: string
          recipient_type: string
          subject_template: string
          template_name: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          content_template?: string
          created_at?: string
          id?: string
          is_active?: boolean
          message_type?: string
          recipient_type?: string
          subject_template?: string
          template_name?: string
          updated_at?: string
          variables?: Json | null
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
      notification_deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_channel: string
          delivery_status: string
          error_message: string | null
          id: string
          notification_id: string
          provider_id: string | null
          read_at: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_channel: string
          delivery_status?: string
          error_message?: string | null
          id?: string
          notification_id: string
          provider_id?: string | null
          read_at?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_channel?: string
          delivery_status?: string
          error_message?: string | null
          id?: string
          notification_id?: string
          provider_id?: string | null
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          marketing_notifications: boolean
          phone_number: string | null
          push_enabled: boolean
          security_notifications: boolean
          sms_enabled: boolean
          transfer_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          marketing_notifications?: boolean
          phone_number?: string | null
          push_enabled?: boolean
          security_notifications?: boolean
          sms_enabled?: boolean
          transfer_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          marketing_notifications?: boolean
          phone_number?: string | null
          push_enabled?: boolean
          security_notifications?: boolean
          sms_enabled?: boolean
          transfer_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          created_at: string
          email_template: string | null
          id: string
          is_active: boolean
          message_template: string
          notification_type: string
          sms_template: string | null
          template_name: string
          title_template: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          email_template?: string | null
          id?: string
          is_active?: boolean
          message_template: string
          notification_type: string
          sms_template?: string | null
          template_name: string
          title_template: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          email_template?: string | null
          id?: string
          is_active?: boolean
          message_template?: string
          notification_type?: string
          sms_template?: string | null
          template_name?: string
          title_template?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
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
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
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
      product_tags: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_system_tag: boolean | null
          name: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_tag?: boolean | null
          name: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_tag?: boolean | null
          name?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
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
          auto_tags_generated: boolean | null
          category: string
          category_confidence: number | null
          created_at: string
          currency: string | null
          description: string | null
          featured: boolean | null
          id: string
          images: Json | null
          is_active: boolean | null
          last_categorized_at: string | null
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
          auto_tags_generated?: boolean | null
          category: string
          category_confidence?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          last_categorized_at?: string | null
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
          auto_tags_generated?: boolean | null
          category?: string
          category_confidence?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          last_categorized_at?: string | null
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
          encrypted_personal_data: Json | null
          encryption_key_id: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          is_encrypted: boolean | null
          kyc_level: string | null
          kyc_status: string | null
          last_encrypted_at: string | null
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
          encrypted_personal_data?: Json | null
          encryption_key_id?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          is_encrypted?: boolean | null
          kyc_level?: string | null
          kyc_status?: string | null
          last_encrypted_at?: string | null
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
          encrypted_personal_data?: Json | null
          encryption_key_id?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          is_encrypted?: boolean | null
          kyc_level?: string | null
          kyc_status?: string | null
          last_encrypted_at?: string | null
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
      rate_limit_tracking: {
        Row: {
          action_type: string
          attempt_count: number | null
          blocked_until: string | null
          first_attempt: string | null
          id: string
          identifier: string
          is_blocked: boolean | null
          last_attempt: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          blocked_until?: string | null
          first_attempt?: string | null
          id?: string
          identifier: string
          is_blocked?: boolean | null
          last_attempt?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          blocked_until?: string | null
          first_attempt?: string | null
          id?: string
          identifier?: string
          is_blocked?: boolean | null
          last_attempt?: string | null
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actor_id: string | null
          alert_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          message: string
          metadata: Json | null
          notified_channels: Json | null
          severity: string
          status: string
          target_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actor_id?: string | null
          alert_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          message: string
          metadata?: Json | null
          notified_channels?: Json | null
          severity?: string
          status?: string
          target_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actor_id?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          message?: string
          metadata?: Json | null
          notified_channels?: Json | null
          severity?: string
          status?: string
          target_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_audit: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      security_health_checks: {
        Row: {
          check_type: string
          created_at: string
          details: Json | null
          error_message: string | null
          fix_suggestions: string[] | null
          id: string
          status: string
        }
        Insert: {
          check_type: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          fix_suggestions?: string[] | null
          id?: string
          status: string
        }
        Update: {
          check_type?: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          fix_suggestions?: string[] | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      security_policies: {
        Row: {
          compliance_frameworks: string[] | null
          created_at: string
          id: string
          implementation_status: string
          policy_description: string
          policy_name: string
          policy_type: string
          priority_level: string
          updated_at: string
        }
        Insert: {
          compliance_frameworks?: string[] | null
          created_at?: string
          id?: string
          implementation_status?: string
          policy_description: string
          policy_name: string
          policy_type: string
          priority_level?: string
          updated_at?: string
        }
        Update: {
          compliance_frameworks?: string[] | null
          created_at?: string
          id?: string
          implementation_status?: string
          policy_description?: string
          policy_name?: string
          policy_type?: string
          priority_level?: string
          updated_at?: string
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
      transaction_fees: {
        Row: {
          created_at: string
          fee_type: string
          fee_value: number
          id: string
          is_active: boolean
          maximum_fee: number | null
          minimum_fee: number
          transaction_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee_type?: string
          fee_value: number
          id?: string
          is_active?: boolean
          maximum_fee?: number | null
          minimum_fee?: number
          transaction_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee_type?: string
          fee_value?: number
          id?: string
          is_active?: boolean
          maximum_fee?: number | null
          minimum_fee?: number
          transaction_type?: string
          updated_at?: string
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
      transaction_receipts: {
        Row: {
          download_count: number
          downloaded_at: string | null
          generated_at: string
          id: string
          pdf_url: string | null
          receipt_data: Json
          receipt_number: string
          transfer_id: string
        }
        Insert: {
          download_count?: number
          downloaded_at?: string | null
          generated_at?: string
          id?: string
          pdf_url?: string | null
          receipt_data: Json
          receipt_number: string
          transfer_id: string
        }
        Update: {
          download_count?: number
          downloaded_at?: string | null
          generated_at?: string
          id?: string
          pdf_url?: string | null
          receipt_data?: Json
          receipt_number?: string
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_receipts_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "wallet_transfers"
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
          encrypted_transaction_data: Json | null
          encryption_key_id: string | null
          escrow_locked_at: string | null
          escrow_release_reason: string | null
          escrow_released_at: string | null
          external_transaction_id: string | null
          gateway_provider: string | null
          gateway_response: Json | null
          gateway_transaction_id: string | null
          id: string
          is_encrypted: boolean | null
          last_encrypted_at: string | null
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
          encrypted_transaction_data?: Json | null
          encryption_key_id?: string | null
          escrow_locked_at?: string | null
          escrow_release_reason?: string | null
          escrow_released_at?: string | null
          external_transaction_id?: string | null
          gateway_provider?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          is_encrypted?: boolean | null
          last_encrypted_at?: string | null
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
          encrypted_transaction_data?: Json | null
          encryption_key_id?: string | null
          escrow_locked_at?: string | null
          escrow_release_reason?: string | null
          escrow_released_at?: string | null
          external_transaction_id?: string | null
          gateway_provider?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          is_encrypted?: boolean | null
          last_encrypted_at?: string | null
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
      transfer_limits: {
        Row: {
          created_at: string
          daily_limit: number
          daily_spent: number
          id: string
          last_reset_date: string
          monthly_limit: number
          monthly_spent: number
          single_transaction_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number
          daily_spent?: number
          id?: string
          last_reset_date?: string
          monthly_limit?: number
          monthly_spent?: number
          single_transaction_limit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_limit?: number
          daily_spent?: number
          id?: string
          last_reset_date?: string
          monthly_limit?: number
          monthly_spent?: number
          single_transaction_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      translation_usage_logs: {
        Row: {
          character_count: number
          content_type: string | null
          created_at: string
          id: string
          source_language: string
          target_language: string
          translation_service: string | null
        }
        Insert: {
          character_count?: number
          content_type?: string | null
          created_at?: string
          id?: string
          source_language: string
          target_language: string
          translation_service?: string | null
        }
        Update: {
          character_count?: number
          content_type?: string | null
          created_at?: string
          id?: string
          source_language?: string
          target_language?: string
          translation_service?: string | null
        }
        Relationships: []
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
      user_language_preferences: {
        Row: {
          auto_detect_language: boolean
          browser_languages: Json | null
          created_at: string
          detected_language: string | null
          detected_region: string | null
          id: string
          preferred_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_detect_language?: boolean
          browser_languages?: Json | null
          created_at?: string
          detected_language?: string | null
          detected_region?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_detect_language?: boolean
          browser_languages?: Json | null
          created_at?: string
          detected_language?: string | null
          detected_region?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
          user_id?: string
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
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      user_wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          escrow_balance: number
          id: string
          is_active: boolean
          total_received: number
          total_sent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          escrow_balance?: number
          id?: string
          is_active?: boolean
          total_received?: number
          total_sent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          escrow_balance?: number
          id?: string
          is_active?: boolean
          total_received?: number
          total_sent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transfers: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          failed_at: string | null
          failure_reason: string | null
          id: string
          message: string | null
          net_amount: number
          recipient_id: string
          reference_number: string
          requires_2fa: boolean
          sender_id: string
          status: string
          transaction_fee: number
          transfer_type: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          message?: string | null
          net_amount: number
          recipient_id: string
          reference_number: string
          requires_2fa?: boolean
          sender_id: string
          status?: string
          transaction_fee?: number
          transfer_type?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          message?: string | null
          net_amount?: number
          recipient_id?: string
          reference_number?: string
          requires_2fa?: boolean
          sender_id?: string
          status?: string
          transaction_fee?: number
          transfer_type?: string
          updated_at?: string
          verified_at?: string | null
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
      calculate_next_minimum_bid: {
        Args: { p_auction_id: string }
        Returns: number
      }
      calculate_transaction_fee: {
        Args: { p_amount: number; p_transaction_type: string }
        Returns: number
      }
      can_user_transact: {
        Args: { p_user_id: string; p_transaction_amount?: number }
        Returns: boolean
      }
      can_user_transfer: {
        Args: { p_user_id: string; p_amount: number }
        Returns: boolean
      }
      check_encryption_compliance: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          column_name: string
          classification_level: string
          encryption_required: boolean
          current_encryption_status: string
          compliance_status: string
        }[]
      }
      cleanup_new_arrival_tags: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      detect_and_save_user_language: {
        Args: {
          p_user_id: string
          p_accept_language?: string
          p_detected_region?: string
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
      encrypt_sensitive_data: {
        Args: { p_data: Json; p_key_purpose?: string }
        Returns: Json
      }
      end_auction: {
        Args: { p_auction_id: string }
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
        Args: { p_order_id: string; p_stage: string }
        Returns: string
      }
      generate_receipt_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_secure_qr: {
        Args: { p_order_id: string; p_stage: string; p_expires_hours?: number }
        Returns: string
      }
      generate_short_lived_otp: {
        Args: Record<PropertyKey, never>
        Returns: {
          code: string
          expires_at: string
        }[]
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
      generate_transfer_reference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_verification_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_verification_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_flash_sales: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          description: string
          product_id: string
          product_name: string
          product_image: string
          original_price: number
          sale_price: number
          discount_percentage: number
          start_time: string
          end_time: string
          quantity_available: number
          quantity_sold: number
          featured: boolean
          time_remaining: unknown
        }[]
      }
      get_localized_content: {
        Args: { p_content_key: string; p_language_code?: string }
        Returns: string
      }
      get_user_language: {
        Args: { user_uuid?: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      initialize_user_wallet: {
        Args: { p_user_id: string }
        Returns: string
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      is_admin_role: {
        Args: { _user_id?: string }
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
      place_auction_bid: {
        Args: {
          p_auction_id: string
          p_bidder_id: string
          p_bid_amount: number
          p_max_bid?: number
        }
        Returns: Json
      }
      refresh_stats_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      resolve_dispute_by_votes: {
        Args: { dispute_uuid: string }
        Returns: string
      }
      schedule_verification_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      track_affiliate_referral: {
        Args: {
          p_referral_code: string
          p_user_id?: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_source_url?: string
        }
        Returns: string
      }
      track_page_view: {
        Args:
          | {
              p_user_id?: string
              p_session_id?: string
              p_page_url?: string
              p_page_title?: string
              p_referrer?: string
              p_user_agent?: string
            }
          | {
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
        Args:
          | {
              p_product_id?: string
              p_user_id?: string
              p_session_id?: string
              p_event_type?: string
              p_category?: string
              p_price?: number
              p_event_properties?: Json
            }
          | {
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
        Args:
          | {
              p_user_id?: string
              p_session_id?: string
              p_event_type?: string
              p_event_name?: string
              p_page_url?: string
              p_event_properties?: Json
              p_user_agent?: string
            }
          | {
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
      update_affiliate_tier: {
        Args: { affiliate_uuid: string }
        Returns: string
      }
      update_delivery_status: {
        Args: {
          p_order_id: string
          p_checkpoint_type: string
          p_scanned_by: string
          p_location?: string
          p_notes?: string
          p_coordinates?: Json
        }
        Returns: Json
      }
      update_product_performance_tags: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verify_email_and_complete_registration: {
        Args: { p_token: string }
        Returns: Json
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
      app_role: "admin" | "moderator" | "user"
      auction_status: "draft" | "active" | "ended" | "cancelled" | "suspended"
      bid_increment_type: "fixed" | "percentage" | "dynamic"
      product_category_enhanced:
        | "fruits"
        | "vegetables"
        | "grains"
        | "dairy"
        | "meat"
        | "seafood"
        | "spices"
        | "beverages"
        | "electronics"
        | "clothing"
        | "accessories"
        | "home_garden"
        | "books_media"
        | "sports_fitness"
        | "beauty_health"
        | "toys_games"
        | "crafts"
        | "tools"
        | "automotive"
        | "other"
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
      app_role: ["admin", "moderator", "user"],
      auction_status: ["draft", "active", "ended", "cancelled", "suspended"],
      bid_increment_type: ["fixed", "percentage", "dynamic"],
      product_category_enhanced: [
        "fruits",
        "vegetables",
        "grains",
        "dairy",
        "meat",
        "seafood",
        "spices",
        "beverages",
        "electronics",
        "clothing",
        "accessories",
        "home_garden",
        "books_media",
        "sports_fitness",
        "beauty_health",
        "toys_games",
        "crafts",
        "tools",
        "automotive",
        "other",
      ],
      user_role: ["admin", "moderator", "user"],
    },
  },
} as const
