export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      datasets: {
        Row: {
          created_at: string
          date_max: string | null
          date_min: string | null
          detected_format: string
          file_name: string
          id: string
          mode: string
          owner_id: string
          row_count: number
        }
        Insert: {
          created_at?: string
          date_max?: string | null
          date_min?: string | null
          detected_format?: string
          file_name: string
          id?: string
          mode?: string
          owner_id: string
          row_count?: number
        }
        Update: {
          created_at?: string
          date_max?: string | null
          date_min?: string | null
          detected_format?: string
          file_name?: string
          id?: string
          mode?: string
          owner_id?: string
          row_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "datasets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          case_id: string | null
          channel: string | null
          created_at: string
          customer_id: string
          customer_name: string
          dataset_id: string | null
          event_key: string
          event_name: string
          event_time: string
          feature: string
          id: string
          metadata_json: string | null
          owner_id: string
          product: string
          session_id: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          channel?: string | null
          created_at?: string
          customer_id: string
          customer_name: string
          dataset_id?: string | null
          event_key: string
          event_name: string
          event_time: string
          feature?: string
          id?: string
          metadata_json?: string | null
          owner_id: string
          product?: string
          session_id?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          channel?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          dataset_id?: string | null
          event_key?: string
          event_name?: string
          event_time?: string
          feature?: string
          id?: string
          metadata_json?: string | null
          owner_id?: string
          product?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_token: string
          approved: boolean
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          approval_token?: string
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          approval_token?: string
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          category: string
          created_at: string
          customer_visibility: string
          description: string
          feature_source: string
          feature_type: string
          id: string
          jira_link: string
          linked_customers: string[]
          notes: string
          owner: string
          owner_id: string
          priority: string
          product_type: string
          release_quarter: string | null
          score_common_customer_ask: number
          score_competitor_market_research: number
          score_executive_input: number
          score_seller_prospect_input: number
          score_technical_debt: number
          sprint: string
          status: string
          target_bucket: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          customer_visibility?: string
          description?: string
          feature_source?: string
          feature_type?: string
          id?: string
          jira_link?: string
          linked_customers?: string[]
          notes?: string
          owner?: string
          owner_id: string
          priority?: string
          product_type?: string
          release_quarter?: string | null
          score_common_customer_ask?: number
          score_competitor_market_research?: number
          score_executive_input?: number
          score_seller_prospect_input?: number
          score_technical_debt?: number
          sprint?: string
          status?: string
          target_bucket?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          customer_visibility?: string
          description?: string
          feature_source?: string
          feature_type?: string
          id?: string
          jira_link?: string
          linked_customers?: string[]
          notes?: string
          owner?: string
          owner_id?: string
          priority?: string
          product_type?: string
          release_quarter?: string | null
          score_common_customer_ask?: number
          score_competitor_market_research?: number
          score_executive_input?: number
          score_seller_prospect_input?: number
          score_technical_debt?: number
          sprint?: string
          status?: string
          target_bucket?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      scoring_weights: {
        Row: {
          id: string
          owner_id: string
          product_type: string
          w_common_customer_ask: number
          w_competitor_market_research: number
          w_executive_input: number
          w_seller_prospect_input: number
          w_technical_debt: number
        }
        Insert: {
          id?: string
          owner_id: string
          product_type?: string
          w_common_customer_ask?: number
          w_competitor_market_research?: number
          w_executive_input?: number
          w_seller_prospect_input?: number
          w_technical_debt?: number
        }
        Update: {
          id?: string
          owner_id?: string
          product_type?: string
          w_common_customer_ask?: number
          w_competitor_market_research?: number
          w_executive_input?: number
          w_seller_prospect_input?: number
          w_technical_debt?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
