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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          active: boolean
          id: number
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          id?: number
          name: string
          user_id: string
        }
        Update: {
          active?: boolean
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_values: {
        Row: {
          activity_id: number
          effective_from: string
          id: number
          value: number
        }
        Insert: {
          activity_id: number
          effective_from?: string
          id?: number
          value: number
        }
        Update: {
          activity_id?: number
          effective_from?: string
          id?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "activity_values_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      log: {
        Row: {
          activity_id: number
          date: string
          deleted_at: string | null
          id: number
          notes: string | null
          paid_out: string | null
          user_id: string
          value: number
        }
        Insert: {
          activity_id: number
          date?: string
          deleted_at?: string | null
          id?: number
          notes?: string | null
          paid_out?: string | null
          user_id?: string
          value: number
        }
        Update: {
          activity_id?: number
          date?: string
          deleted_at?: string | null
          id?: number
          notes?: string | null
          paid_out?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "log_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_interest: {
        Row: {
          created_at: string
          email: string | null
          id: number
          notified_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: never
          notified_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: never
          notified_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pro_subscribers: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          currency_code: string
          locale: string
          minor_unit_digits: number
          region_code: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency_code: string
          locale: string
          minor_unit_digits?: number
          region_code: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          locale?: string
          minor_unit_digits?: number
          region_code?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_activity: {
        Args: { p_name: string; p_value: number }
        Returns: number
      }
      currency_unit_amount: { Args: { _currency: string }; Returns: number }
      delete_activity: { Args: { p_activity_id: number }; Returns: undefined }
      is_pro: { Args: { _user_id: string }; Returns: boolean }
      mark_unpaid_as_paid: { Args: never; Returns: number }
      soft_delete_log_entry: {
        Args: { p_log_id: number }
        Returns: {
          activity_id: number
          date: string
          deleted_at: string | null
          id: number
          notes: string | null
          paid_out: string | null
          user_id: string
          value: number
        }
        SetofOptions: {
          from: "*"
          to: "log"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_activity: {
        Args: {
          p_active: boolean
          p_activity_id: number
          p_name: string
          p_value: number
        }
        Returns: undefined
      }
      update_log_activity: {
        Args: { p_activity_id: number; p_log_id: number }
        Returns: {
          activity_id: number
          date: string
          deleted_at: string | null
          id: number
          notes: string | null
          paid_out: string | null
          user_id: string
          value: number
        }[]
        SetofOptions: {
          from: "*"
          to: "log"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      update_log_notes: {
        Args: { p_log_id: number; p_notes: string }
        Returns: {
          activity_id: number
          date: string
          deleted_at: string | null
          id: number
          notes: string | null
          paid_out: string | null
          user_id: string
          value: number
        }
        SetofOptions: {
          from: "*"
          to: "log"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
