export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ephemeris_daily: {
        Row: {
          date_ut: string
          is_retrograde: boolean
          longitude: number
          planet_name: string
          speed: number
          zodiac_degree: number
          zodiac_sign: string
        }
        Insert: {
          date_ut: string
          is_retrograde: boolean
          longitude: number
          planet_name: string
          speed: number
          zodiac_degree: number
          zodiac_sign: string
        }
        Update: {
          date_ut?: string
          is_retrograde?: boolean
          longitude?: number
          planet_name?: string
          speed?: number
          zodiac_degree?: number
          zodiac_sign?: string
        }
        Relationships: []
      }
      mundane_entities: {
        Row: {
          capital_lat: number | null
          capital_lon: number | null
          created_at: string
          flag_emoji: string | null
          founding_date: string
          founding_time: string
          founding_utc: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          capital_lat?: number | null
          capital_lon?: number | null
          created_at?: string
          flag_emoji?: string | null
          founding_date: string
          founding_time?: string
          founding_utc?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          capital_lat?: number | null
          capital_lon?: number | null
          created_at?: string
          flag_emoji?: string | null
          founding_date?: string
          founding_time?: string
          founding_utc?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      natal_charts: {
        Row: {
          acg_lines: Json
          chart_type: string
          created_at: string
          entity_id: string | null
          ephemeris_data: Json
          house_placements: Json
          id: string
          partner_id: string | null
          user_id: string | null
        }
        Insert: {
          acg_lines?: Json
          chart_type?: string
          created_at?: string
          entity_id?: string | null
          ephemeris_data?: Json
          house_placements?: Json
          id?: string
          partner_id?: string | null
          user_id?: string | null
        }
        Update: {
          acg_lines?: Json
          chart_type?: string
          created_at?: string
          entity_id?: string | null
          ephemeris_data?: Json
          house_placements?: Json
          id?: string
          partner_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "natal_charts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "mundane_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "natal_charts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "natal_charts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          birth_city: string
          birth_date: string
          birth_lat: number | null
          birth_lon: number | null
          birth_time: string
          birth_time_known: boolean
          created_at: string
          first_name: string
          id: string
          label: string
          owner_id: string
        }
        Insert: {
          birth_city: string
          birth_date: string
          birth_lat?: number | null
          birth_lon?: number | null
          birth_time?: string
          birth_time_known?: boolean
          created_at?: string
          first_name: string
          id?: string
          label?: string
          owner_id: string
        }
        Update: {
          birth_city?: string
          birth_date?: string
          birth_lat?: number | null
          birth_lon?: number | null
          birth_time?: string
          birth_time_known?: boolean
          created_at?: string
          first_name?: string
          id?: string
          label?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_city: string | null
          birth_date: string | null
          birth_lat: number | null
          birth_lon: number | null
          birth_time: string
          birth_time_known: boolean
          birth_utc: string | null
          created_at: string
          first_name: string | null
          id: string
          is_subscribed: boolean
          last_login_date: string | null
          last_name: string | null
          life_goals: Json
          stripe_customer_id: string | null
          subscription_ends_at: string | null
          subscription_id: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          birth_city?: string | null
          birth_date?: string | null
          birth_lat?: number | null
          birth_lon?: number | null
          birth_time?: string
          birth_time_known?: boolean
          birth_utc?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          is_subscribed?: boolean
          last_login_date?: string | null
          last_name?: string | null
          life_goals?: Json
          stripe_customer_id?: string | null
          subscription_ends_at?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          birth_city?: string | null
          birth_date?: string | null
          birth_lat?: number | null
          birth_lon?: number | null
          birth_time?: string
          birth_time_known?: boolean
          birth_utc?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_subscribed?: boolean
          last_login_date?: string | null
          last_name?: string | null
          life_goals?: Json
          stripe_customer_id?: string | null
          subscription_ends_at?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          product: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      readings: {
        Row: {
          category: Database["public"]["Enums"]["reading_category"]
          created_at: string
          details: Json
          id: string
          partner_id: string | null
          reading_date: string
          reading_score: number | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["reading_category"]
          created_at?: string
          details?: Json
          id?: string
          partner_id?: string | null
          reading_date?: string
          reading_score?: number | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["reading_category"]
          created_at?: string
          details?: Json
          id?: string
          partner_id?: string | null
          reading_date?: string
          reading_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      searches: {
        Row: {
          created_at: string
          dest_lat: number | null
          dest_lon: number | null
          destination: string
          id: string
          macro_score: number | null
          score_detail: Json | null
          travel_date: string | null
          travel_type: string
          user_id: string
          verdict: string | null
        }
        Insert: {
          created_at?: string
          dest_lat?: number | null
          dest_lon?: number | null
          destination: string
          id?: string
          macro_score?: number | null
          score_detail?: Json | null
          travel_date?: string | null
          travel_type?: string
          user_id: string
          verdict?: string | null
        }
        Update: {
          created_at?: string
          dest_lat?: number | null
          dest_lon?: number | null
          destination?: string
          id?: string
          macro_score?: number | null
          score_detail?: Json | null
          travel_date?: string | null
          travel_type?: string
          user_id?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zodiac_ingresses: {
        Row: {
          entered_sign: string
          exact_timestamp_ut: string
          exited_sign: string
          id: number
          is_retrograde_dip: boolean
          planet_name: string
        }
        Insert: {
          entered_sign: string
          exact_timestamp_ut: string
          exited_sign: string
          id?: number
          is_retrograde_dip: boolean
          planet_name: string
        }
        Update: {
          entered_sign?: string
          exact_timestamp_ut?: string
          exited_sign?: string
          id?: number
          is_retrograde_dip?: boolean
          planet_name?: string
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
      reading_category:
        | "natal"
        | "synastry"
        | "astrocartography"
        | "solar_return"
        | "mundane"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      reading_category: [
        "natal",
        "synastry",
        "astrocartography",
        "solar_return",
        "mundane",
      ],
    },
  },
} as const

