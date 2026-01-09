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
      coaching_call_logs: {
        Row: {
          call_date: string
          call_sid: string | null
          call_status: string
          conversation_summary: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          tasks_reviewed: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          call_date?: string
          call_sid?: string | null
          call_status?: string
          conversation_summary?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          tasks_reviewed?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          call_date?: string
          call_sid?: string | null
          call_status?: string
          conversation_summary?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          tasks_reviewed?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          api_cost_usd: number | null
          created_at: string
          description: string | null
          generation_id: string | null
          id: string
          media_type: string | null
          stripe_session_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          api_cost_usd?: number | null
          created_at?: string
          description?: string | null
          generation_id?: string | null
          id?: string
          media_type?: string | null
          stripe_session_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          api_cost_usd?: number | null
          created_at?: string
          description?: string | null
          generation_id?: string | null
          id?: string
          media_type?: string | null
          stripe_session_id?: string | null
          transaction_type?: string
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
      director_posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          likes_count: number
          media_type: string | null
          media_url: string | null
          post_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          media_type?: string | null
          media_url?: string | null
          post_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          media_type?: string | null
          media_url?: string | null
          post_type?: string
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
      mind_movie_scripts: {
        Row: {
          chief_aim_snapshot: Json | null
          created_at: string | null
          id: string
          music_style: string | null
          scenes: Json | null
          song_lyrics: string | null
          soundtrack_url: string | null
          status: string | null
          suno_task_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          visual_style: string | null
        }
        Insert: {
          chief_aim_snapshot?: Json | null
          created_at?: string | null
          id?: string
          music_style?: string | null
          scenes?: Json | null
          song_lyrics?: string | null
          soundtrack_url?: string | null
          status?: string | null
          suno_task_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          visual_style?: string | null
        }
        Update: {
          chief_aim_snapshot?: Json | null
          created_at?: string | null
          id?: string
          music_style?: string | null
          scenes?: Json | null
          song_lyrics?: string | null
          soundtrack_url?: string | null
          status?: string | null
          suno_task_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          visual_style?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "director_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "director_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      production_credits: {
        Row: {
          created_at: string
          id: string
          monthly_allowance_limit: number
          monthly_allowance_used: number
          monthly_credits: number
          monthly_credits_reset_at: string | null
          purchased_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_allowance_limit?: number
          monthly_allowance_used?: number
          monthly_credits?: number
          monthly_credits_reset_at?: string | null
          purchased_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_allowance_limit?: number
          monthly_allowance_used?: number
          monthly_credits?: number
          monthly_credits_reset_at?: string | null
          purchased_credits?: number
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
          avatar_url: string | null
          best_streak: number | null
          bio: string | null
          chat_summary: string | null
          chat_summary_updated_at: string | null
          chief_aim_by_when: string | null
          chief_aim_exchange: string | null
          chief_aim_plan: string | null
          chief_aim_what: string | null
          coaching_call_enabled: boolean | null
          coaching_call_time: string | null
          coaching_call_timezone: string | null
          created_at: string
          current_act: string | null
          current_streak: number | null
          day_number: number | null
          director_character_name: string | null
          display_name: string | null
          id: string
          last_viewing_date: string | null
          mind_movie_url: string | null
          phone_number: string | null
          show_on_leaderboard: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          best_streak?: number | null
          bio?: string | null
          chat_summary?: string | null
          chat_summary_updated_at?: string | null
          chief_aim_by_when?: string | null
          chief_aim_exchange?: string | null
          chief_aim_plan?: string | null
          chief_aim_what?: string | null
          coaching_call_enabled?: boolean | null
          coaching_call_time?: string | null
          coaching_call_timezone?: string | null
          created_at?: string
          current_act?: string | null
          current_streak?: number | null
          day_number?: number | null
          director_character_name?: string | null
          display_name?: string | null
          id?: string
          last_viewing_date?: string | null
          mind_movie_url?: string | null
          phone_number?: string | null
          show_on_leaderboard?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          best_streak?: number | null
          bio?: string | null
          chat_summary?: string | null
          chat_summary_updated_at?: string | null
          chief_aim_by_when?: string | null
          chief_aim_exchange?: string | null
          chief_aim_plan?: string | null
          chief_aim_what?: string | null
          coaching_call_enabled?: boolean | null
          coaching_call_time?: string | null
          coaching_call_timezone?: string | null
          created_at?: string
          current_act?: string | null
          current_streak?: number | null
          day_number?: number | null
          director_character_name?: string | null
          display_name?: string | null
          id?: string
          last_viewing_date?: string | null
          mind_movie_url?: string | null
          phone_number?: string | null
          show_on_leaderboard?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
