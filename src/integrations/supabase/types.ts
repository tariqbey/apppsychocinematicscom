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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_scorecards: {
        Row: {
          behavior_execution: number
          created_at: string
          emotional_regulation: number
          forward_progress: number
          id: string
          identity_alignment: number
          scorecard_date: string
          total_score: number | null
          user_id: string
        }
        Insert: {
          behavior_execution: number
          created_at?: string
          emotional_regulation: number
          forward_progress: number
          id?: string
          identity_alignment: number
          scorecard_date?: string
          total_score?: number | null
          user_id: string
        }
        Update: {
          behavior_execution?: number
          created_at?: string
          emotional_regulation?: number
          forward_progress?: number
          id?: string
          identity_alignment?: number
          scorecard_date?: string
          total_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          priority: number
          task_date: string
          task_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          priority?: number
          task_date?: string
          task_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          priority?: number
          task_date?: string
          task_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_media: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          media_type: string
          media_url: string | null
          metadata: Json | null
          model_used: string
          prediction_id: string | null
          prompt: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          media_type: string
          media_url?: string | null
          metadata?: Json | null
          model_used: string
          prediction_id?: string | null
          prompt: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          media_type?: string
          media_url?: string | null
          metadata?: Json | null
          model_used?: string
          prediction_id?: string | null
          prompt?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_awards: {
        Row: {
          award_name: string
          award_type: string
          description: string | null
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          award_name: string
          award_type: string
          description?: string | null
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          award_name?: string
          award_type?: string
          description?: string | null
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits: number
          id: string
          lifetime_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          lifetime_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          lifetime_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          best_streak: number | null
          chat_summary: string | null
          chat_summary_updated_at: string | null
          chief_aim_by_when: string | null
          chief_aim_exchange: string | null
          chief_aim_plan: string | null
          chief_aim_what: string | null
          created_at: string
          current_act: string | null
          current_streak: number | null
          day_number: number | null
          director_character_name: string | null
          display_name: string | null
          id: string
          last_viewing_date: string | null
          mind_movie_url: string | null
          show_on_leaderboard: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number | null
          chat_summary?: string | null
          chat_summary_updated_at?: string | null
          chief_aim_by_when?: string | null
          chief_aim_exchange?: string | null
          chief_aim_plan?: string | null
          chief_aim_what?: string | null
          created_at?: string
          current_act?: string | null
          current_streak?: number | null
          day_number?: number | null
          director_character_name?: string | null
          display_name?: string | null
          id?: string
          last_viewing_date?: string | null
          mind_movie_url?: string | null
          show_on_leaderboard?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number | null
          chat_summary?: string | null
          chat_summary_updated_at?: string | null
          chief_aim_by_when?: string | null
          chief_aim_exchange?: string | null
          chief_aim_plan?: string | null
          chief_aim_what?: string | null
          created_at?: string
          current_act?: string | null
          current_streak?: number | null
          day_number?: number | null
          director_character_name?: string | null
          display_name?: string | null
          id?: string
          last_viewing_date?: string | null
          mind_movie_url?: string | null
          show_on_leaderboard?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      viewing_history: {
        Row: {
          duration_seconds: number | null
          id: string
          user_id: string
          view_date: string
          viewed_at: string
        }
        Insert: {
          duration_seconds?: number | null
          id?: string
          user_id: string
          view_date?: string
          viewed_at?: string
        }
        Update: {
          duration_seconds?: number | null
          id?: string
          user_id?: string
          view_date?: string
          viewed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: never
        Returns: {
          best_streak: number
          credits: number
          current_streak: number
          display_name: string
          lifetime_credits: number
          rank: number
        }[]
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
