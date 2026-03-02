export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string
          plan: 'free' | 'creator' | 'pro' | 'studio'
          minutes_used: number
          minutes_limit: number
          stripe_customer_id: string | null
          preferred_accent: 'fr-standard' | 'fr-quebec' | 'fr-africa' | 'fr-belgium' | 'fr-swiss'
          preferred_language: string
          onboarding_completed: boolean
          usage_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          avatar_url?: string
          plan?: 'free' | 'creator' | 'pro' | 'studio'
          minutes_used?: number
          minutes_limit?: number
          stripe_customer_id?: string | null
          preferred_accent?: 'fr-standard' | 'fr-quebec' | 'fr-africa' | 'fr-belgium' | 'fr-swiss'
          preferred_language?: string
          onboarding_completed?: boolean
          usage_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string
          plan?: 'free' | 'creator' | 'pro' | 'studio'
          minutes_used?: number
          minutes_limit?: number
          stripe_customer_id?: string | null
          preferred_accent?: 'fr-standard' | 'fr-quebec' | 'fr-africa' | 'fr-belgium' | 'fr-swiss'
          preferred_language?: string
          onboarding_completed?: boolean
          usage_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          color?: string
          description?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      transcriptions: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          file_url: string
          file_name: string | null
          file_size: number | null
          file_duration: number | null
          file_type: string | null
          language: string
          accent: 'fr-standard' | 'fr-quebec' | 'fr-africa' | 'fr-belgium' | 'fr-swiss'
          status: 'pending' | 'processing' | 'completed' | 'error'
          error_message: string | null
          word_count: number
          confidence_avg: number | null
          search_vector: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title?: string
          file_url: string
          file_name?: string | null
          file_size?: number | null
          file_duration?: number | null
          file_type?: string | null
          language?: string
          accent?: 'fr-standard' | 'fr-quebec' | 'fr-africa' | 'fr-belgium' | 'fr-swiss'
          status?: 'pending' | 'processing' | 'completed' | 'error'
          error_message?: string | null
          word_count?: number
          confidence_avg?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          project_id?: string | null
          file_duration?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'error'
          error_message?: string | null
          word_count?: number
          confidence_avg?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transcriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transcriptions_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      transcription_segments: {
        Row: {
          id: string
          transcription_id: string
          position: number
          start_time: number
          end_time: number
          text: string
          speaker: string | null
          confidence: number | null
          is_edited: boolean
        }
        Insert: {
          id?: string
          transcription_id: string
          position: number
          start_time: number
          end_time: number
          text: string
          speaker?: string | null
          confidence?: number | null
          is_edited?: boolean
        }
        Update: {
          text?: string
          speaker?: string | null
          is_edited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'transcription_segments_transcription_id_fkey'
            columns: ['transcription_id']
            isOneToOne: false
            referencedRelation: 'transcriptions'
            referencedColumns: ['id']
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_price_id: string | null
          plan_name: 'creator' | 'pro' | 'studio'
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          stripe_price_id?: string | null
          plan_name: 'creator' | 'pro' | 'studio'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
        }
        Update: {
          plan_name?: 'creator' | 'pro' | 'studio'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          transcription_id: string | null
          minutes_consumed: number
          action: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transcription_id?: string | null
          minutes_consumed: number
          action?: string
          metadata?: Json
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: 'usage_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'usage_logs_transcription_id_fkey'
            columns: ['transcription_id']
            isOneToOne: false
            referencedRelation: 'transcriptions'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      check_quota: {
        Args: { p_user_id: string; p_minutes: number }
        Returns: boolean
      }
      consume_minutes: {
        Args: {
          p_user_id: string
          p_transcription_id: string
          p_minutes: number
          p_metadata?: Json
        }
        Returns: void
      }
      reset_monthly_usage: {
        Args: Record<string, never>
        Returns: void
      }
      update_user_plan: {
        Args: { p_user_id: string; p_plan: string }
        Returns: void
      }
      search_transcriptions: {
        Args: { p_user_id: string; p_query: string }
        Returns: Database['public']['Tables']['transcriptions']['Row'][]
      }
      get_user_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      plan_type: 'free' | 'creator' | 'pro' | 'studio'
      transcription_status: 'pending' | 'processing' | 'completed' | 'error'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
      accent_type: 'fr-standard' | 'fr-quebec' | 'fr-africa' | 'fr-belgium' | 'fr-swiss'
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
