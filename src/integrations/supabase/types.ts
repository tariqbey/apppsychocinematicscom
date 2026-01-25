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
      access_code_redemptions: {
        Row: {
          access_code_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          access_code_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          access_code_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_code_redemptions_access_code_id_fkey"
            columns: ["access_code_id"]
            isOneToOne: false
            referencedRelation: "access_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      access_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          role_granted: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          role_granted?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          role_granted?: string
        }
        Relationships: []
      }
      adversity_challenges: {
        Row: {
          action_taken: string | null
          affirmation: string | null
          at_peace: boolean | null
          challenge_date: string
          completed: boolean | null
          completed_at: string | null
          created_at: string
          cut_notes: string | null
          did_cut: boolean | null
          emotional_trigger: string
          episode_id: string | null
          feeling: string | null
          id: string
          ideal_response: string | null
          insight_gained: string | null
          part_challenged: string | null
          response_type: string | null
          scenario_type: string
          situation_description: string
          storyboard_created_at: string | null
          storyboard_reference_photo: string | null
          storyboard_scenes: Json | null
          target_trait: string
          trait_xp_earned: number | null
          updated_at: string
          user_id: string
          visualization_script: string | null
        }
        Insert: {
          action_taken?: string | null
          affirmation?: string | null
          at_peace?: boolean | null
          challenge_date?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          cut_notes?: string | null
          did_cut?: boolean | null
          emotional_trigger: string
          episode_id?: string | null
          feeling?: string | null
          id?: string
          ideal_response?: string | null
          insight_gained?: string | null
          part_challenged?: string | null
          response_type?: string | null
          scenario_type: string
          situation_description: string
          storyboard_created_at?: string | null
          storyboard_reference_photo?: string | null
          storyboard_scenes?: Json | null
          target_trait: string
          trait_xp_earned?: number | null
          updated_at?: string
          user_id: string
          visualization_script?: string | null
        }
        Update: {
          action_taken?: string | null
          affirmation?: string | null
          at_peace?: boolean | null
          challenge_date?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          cut_notes?: string | null
          did_cut?: boolean | null
          emotional_trigger?: string
          episode_id?: string | null
          feeling?: string | null
          id?: string
          ideal_response?: string | null
          insight_gained?: string | null
          part_challenged?: string | null
          response_type?: string | null
          scenario_type?: string
          situation_description?: string
          storyboard_created_at?: string | null
          storyboard_reference_photo?: string | null
          storyboard_scenes?: Json | null
          target_trait?: string
          trait_xp_earned?: number | null
          updated_at?: string
          user_id?: string
          visualization_script?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adversity_challenges_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      annual_awards: {
        Row: {
          award_category: string
          award_year: number
          awarded_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          movie_id: string | null
          total_score: number | null
          total_votes: number | null
          user_id: string
        }
        Insert: {
          award_category: string
          award_year: number
          awarded_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          movie_id?: string | null
          total_score?: number | null
          total_votes?: number | null
          user_id: string
        }
        Update: {
          award_category?: string
          award_year?: number
          awarded_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          movie_id?: string | null
          total_score?: number | null
          total_votes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annual_awards_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "mind_movie_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_soundtracks: {
        Row: {
          archetype_id: string | null
          audio_url: string | null
          challenge_id: string
          character_traits: Json | null
          created_at: string
          id: string
          lyrics: string | null
          metadata: Json | null
          music_style: string | null
          status: string | null
          suno_task_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archetype_id?: string | null
          audio_url?: string | null
          challenge_id: string
          character_traits?: Json | null
          created_at?: string
          id?: string
          lyrics?: string | null
          metadata?: Json | null
          music_style?: string | null
          status?: string | null
          suno_task_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archetype_id?: string | null
          audio_url?: string | null
          challenge_id?: string
          character_traits?: Json | null
          created_at?: string
          id?: string
          lyrics?: string | null
          metadata?: Json | null
          music_style?: string | null
          status?: string | null
          suno_task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_soundtracks_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "adversity_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      character_profiles: {
        Row: {
          archetype: string
          archetype_score: Json
          created_at: string
          id: string
          light_shadow_state: string | null
          survey_responses: Json
          transformation_analysis: Json | null
          transformation_chief_aim_snapshot: Json | null
          transformation_cycle_number: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archetype: string
          archetype_score?: Json
          created_at?: string
          id?: string
          light_shadow_state?: string | null
          survey_responses?: Json
          transformation_analysis?: Json | null
          transformation_chief_aim_snapshot?: Json | null
          transformation_cycle_number?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archetype?: string
          archetype_score?: Json
          created_at?: string
          id?: string
          light_shadow_state?: string | null
          survey_responses?: Json
          transformation_analysis?: Json | null
          transformation_chief_aim_snapshot?: Json | null
          transformation_cycle_number?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      character_scorecards: {
        Row: {
          created_at: string
          id: string
          max_possible_score: number | null
          reflection: string | null
          required_character_name: string | null
          scorecard_date: string
          total_score: number | null
          trait_scores: Json | null
          traits: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_possible_score?: number | null
          reflection?: string | null
          required_character_name?: string | null
          scorecard_date?: string
          total_score?: number | null
          trait_scores?: Json | null
          traits?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_possible_score?: number | null
          reflection?: string | null
          required_character_name?: string | null
          scorecard_date?: string
          total_score?: number | null
          trait_scores?: Json | null
          traits?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      community_movies: {
        Row: {
          chief_aim_preview: string | null
          description: string | null
          id: string
          is_public: boolean | null
          movie_id: string
          movie_url: string
          submitted_at: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          votes_count: number | null
        }
        Insert: {
          chief_aim_preview?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          movie_id: string
          movie_url: string
          submitted_at?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          votes_count?: number | null
        }
        Update: {
          chief_aim_preview?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          movie_id?: string
          movie_url?: string
          submitted_at?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          votes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_movies_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: true
            referencedRelation: "mind_movie_scripts"
            referencedColumns: ["id"]
          },
        ]
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
      cycle_reviews: {
        Row: {
          act_number: number
          ai_progress_report: string | null
          archetype_at_end: string | null
          archetype_at_start: string | null
          archetype_shifted: boolean | null
          avg_behavior_execution: number | null
          avg_emotional_regulation: number | null
          avg_forward_progress: number | null
          avg_identity_alignment: number | null
          avg_total_score: number | null
          biggest_challenge: string | null
          biggest_win: string | null
          character_trait_averages: Json | null
          commitment_for_next_cycle: string | null
          created_at: string
          cycle_number: number
          days_completed: number | null
          id: string
          review_date: string
          streak_during_cycle: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          act_number: number
          ai_progress_report?: string | null
          archetype_at_end?: string | null
          archetype_at_start?: string | null
          archetype_shifted?: boolean | null
          avg_behavior_execution?: number | null
          avg_emotional_regulation?: number | null
          avg_forward_progress?: number | null
          avg_identity_alignment?: number | null
          avg_total_score?: number | null
          biggest_challenge?: string | null
          biggest_win?: string | null
          character_trait_averages?: Json | null
          commitment_for_next_cycle?: string | null
          created_at?: string
          cycle_number: number
          days_completed?: number | null
          id?: string
          review_date?: string
          streak_during_cycle?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          act_number?: number
          ai_progress_report?: string | null
          archetype_at_end?: string | null
          archetype_at_start?: string | null
          archetype_shifted?: boolean | null
          avg_behavior_execution?: number | null
          avg_emotional_regulation?: number | null
          avg_forward_progress?: number | null
          avg_identity_alignment?: number | null
          avg_total_score?: number | null
          biggest_challenge?: string | null
          biggest_win?: string | null
          character_trait_averages?: Json | null
          commitment_for_next_cycle?: string | null
          created_at?: string
          cycle_number?: number
          days_completed?: number | null
          id?: string
          review_date?: string
          streak_during_cycle?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_character_checkins: {
        Row: {
          character_rating: number | null
          checkin_date: string
          chose_transformation: boolean | null
          clarity_received: string | null
          created_at: string
          did_cut: boolean | null
          emotional_awareness: string | null
          episode_id: string | null
          hit_midpoint_conflict: boolean | null
          id: string
          midpoint_description: string | null
          old_pattern_description: string | null
          old_pattern_triggered: boolean | null
          reflection_notes: string | null
          transformation_action: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          character_rating?: number | null
          checkin_date?: string
          chose_transformation?: boolean | null
          clarity_received?: string | null
          created_at?: string
          did_cut?: boolean | null
          emotional_awareness?: string | null
          episode_id?: string | null
          hit_midpoint_conflict?: boolean | null
          id?: string
          midpoint_description?: string | null
          old_pattern_description?: string | null
          old_pattern_triggered?: boolean | null
          reflection_notes?: string | null
          transformation_action?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          character_rating?: number | null
          checkin_date?: string
          chose_transformation?: boolean | null
          clarity_received?: string | null
          created_at?: string
          did_cut?: boolean | null
          emotional_awareness?: string | null
          episode_id?: string | null
          hit_midpoint_conflict?: boolean | null
          id?: string
          midpoint_description?: string | null
          old_pattern_description?: string | null
          old_pattern_triggered?: boolean | null
          reflection_notes?: string | null
          transformation_action?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_character_checkins_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_points: {
        Row: {
          bonus_points: number
          created_at: string
          id: string
          journal_points: number
          penalty_points: number
          points_date: string
          ritual_points: number
          scorecard_points: number
          task_points: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_points?: number
          created_at?: string
          id?: string
          journal_points?: number
          penalty_points?: number
          points_date?: string
          ritual_points?: number
          scorecard_points?: number
          task_points?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_points?: number
          created_at?: string
          id?: string
          journal_points?: number
          penalty_points?: number
          points_date?: string
          ritual_points?: number
          scorecard_points?: number
          task_points?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_rituals: {
        Row: {
          action_execution: boolean
          chief_aim_listened: boolean | null
          created_at: string
          evening_review: boolean
          id: string
          journal_entry: boolean | null
          morning_screening: boolean
          ritual_date: string
          script_review: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          action_execution?: boolean
          chief_aim_listened?: boolean | null
          created_at?: string
          evening_review?: boolean
          id?: string
          journal_entry?: boolean | null
          morning_screening?: boolean
          ritual_date?: string
          script_review?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          action_execution?: boolean
          chief_aim_listened?: boolean | null
          created_at?: string
          evening_review?: boolean
          id?: string
          journal_entry?: boolean | null
          morning_screening?: boolean
          ritual_date?: string
          script_review?: boolean
          updated_at?: string
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
          incomplete_reason: string | null
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
          incomplete_reason?: string | null
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
          incomplete_reason?: string | null
          is_completed?: boolean
          priority?: number
          task_date?: string
          task_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dfy_orders: {
        Row: {
          amount_paid: number
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          ghl_webhook_sent: boolean | null
          id: string
          notes: string | null
          status: string
          stripe_session_id: string | null
          subscription_starts_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          ghl_webhook_sent?: boolean | null
          id?: string
          notes?: string | null
          status?: string
          stripe_session_id?: string | null
          subscription_starts_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          ghl_webhook_sent?: boolean | null
          id?: string
          notes?: string | null
          status?: string
          stripe_session_id?: string | null
          subscription_starts_at?: string | null
          updated_at?: string
          user_id?: string | null
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
      episode_soundtracks: {
        Row: {
          audio_url: string | null
          character_traits: Json | null
          created_at: string
          episode_id: string
          id: string
          lyrics: string | null
          metadata: Json | null
          music_style: string | null
          status: string | null
          suno_task_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          character_traits?: Json | null
          created_at?: string
          episode_id: string
          id?: string
          lyrics?: string | null
          metadata?: Json | null
          music_style?: string | null
          status?: string | null
          suno_task_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          character_traits?: Json | null
          created_at?: string
          episode_id?: string
          id?: string
          lyrics?: string | null
          metadata?: Json | null
          music_style?: string | null
          status?: string | null
          suno_task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_soundtracks_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          alignment_reasoning: string | null
          alignment_score: number | null
          character_transformation: Json | null
          completed_at: string | null
          created_at: string
          deadline: string
          duration_type: string
          id: string
          mind_movie_script_id: string | null
          objective: string
          status: string
          title: string
          updated_at: string
          user_id: string
          vision_answers: Json | null
        }
        Insert: {
          alignment_reasoning?: string | null
          alignment_score?: number | null
          character_transformation?: Json | null
          completed_at?: string | null
          created_at?: string
          deadline: string
          duration_type?: string
          id?: string
          mind_movie_script_id?: string | null
          objective: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          vision_answers?: Json | null
        }
        Update: {
          alignment_reasoning?: string | null
          alignment_score?: number | null
          character_transformation?: Json | null
          completed_at?: string | null
          created_at?: string
          deadline?: string
          duration_type?: string
          id?: string
          mind_movie_script_id?: string | null
          objective?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          vision_answers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_mind_movie_script_id_fkey"
            columns: ["mind_movie_script_id"]
            isOneToOne: false
            referencedRelation: "mind_movie_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_content: {
        Row: {
          banner_image_url: string | null
          created_at: string
          description: string | null
          feature_period_end: string
          feature_period_start: string
          feature_type: string
          id: string
          is_active: boolean | null
          movie_id: string | null
          movie_url: string | null
          thumbnail_url: string | null
          title: string
          total_votes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          feature_period_end: string
          feature_period_start: string
          feature_type: string
          id?: string
          is_active?: boolean | null
          movie_id?: string | null
          movie_url?: string | null
          thumbnail_url?: string | null
          title: string
          total_votes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          feature_period_end?: string
          feature_period_start?: string
          feature_type?: string
          id?: string
          is_active?: boolean | null
          movie_id?: string | null
          movie_url?: string | null
          thumbnail_url?: string | null
          title?: string
          total_votes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_content_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "mind_movie_scripts"
            referencedColumns: ["id"]
          },
        ]
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
      journal_entries: {
        Row: {
          ai_analysis: string | null
          ai_analyzed_at: string | null
          content: string
          created_at: string
          id: string
          mood: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_analyzed_at?: string | null
          content: string
          created_at?: string
          id?: string
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          ai_analyzed_at?: string | null
          content?: string
          created_at?: string
          id?: string
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_entries: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          source_id: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          source_id?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          source_id?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_entries_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          author: string | null
          created_at: string
          id: string
          notes: string | null
          title: string
          type: string
          updated_at: string
          year: string | null
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          title: string
          type?: string
          updated_at?: string
          year?: string | null
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          title?: string
          type?: string
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      mind_movie_scripts: {
        Row: {
          aspect_ratio: string | null
          chief_aim_snapshot: Json | null
          created_at: string | null
          elements: Json | null
          id: string
          input_mode: string | null
          is_active: boolean | null
          movie_url: string | null
          music_style: string | null
          reference_photo_url: string | null
          scenes: Json | null
          script_input: string | null
          song_lyrics: string | null
          soundtrack_url: string | null
          status: string | null
          suno_task_id: string | null
          target_duration: number | null
          title: string | null
          updated_at: string | null
          user_id: string
          vision_answers: Json | null
          visual_style: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          chief_aim_snapshot?: Json | null
          created_at?: string | null
          elements?: Json | null
          id?: string
          input_mode?: string | null
          is_active?: boolean | null
          movie_url?: string | null
          music_style?: string | null
          reference_photo_url?: string | null
          scenes?: Json | null
          script_input?: string | null
          song_lyrics?: string | null
          soundtrack_url?: string | null
          status?: string | null
          suno_task_id?: string | null
          target_duration?: number | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          vision_answers?: Json | null
          visual_style?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          chief_aim_snapshot?: Json | null
          created_at?: string | null
          elements?: Json | null
          id?: string
          input_mode?: string | null
          is_active?: boolean | null
          movie_url?: string | null
          music_style?: string | null
          reference_photo_url?: string | null
          scenes?: Json | null
          script_input?: string | null
          song_lyrics?: string | null
          soundtrack_url?: string | null
          status?: string | null
          suno_task_id?: string | null
          target_duration?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          vision_answers?: Json | null
          visual_style?: string | null
        }
        Relationships: []
      }
      movie_votes: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          user_id: string
          vote_period: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          user_id: string
          vote_period: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          user_id?: string
          vote_period?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_votes_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "mind_movie_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          points: number
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points: number
          transaction_date?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points?: number
          transaction_date?: string
          transaction_type?: string
          user_id?: string
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      radio_featured_tracks: {
        Row: {
          artist: string | null
          audio_url: string
          featured_at: string
          featured_by: string | null
          id: string
          is_now_playing: boolean | null
          track_title: string
        }
        Insert: {
          artist?: string | null
          audio_url: string
          featured_at?: string
          featured_by?: string | null
          id?: string
          is_now_playing?: boolean | null
          track_title: string
        }
        Update: {
          artist?: string | null
          audio_url?: string
          featured_at?: string
          featured_by?: string | null
          id?: string
          is_now_playing?: boolean | null
          track_title?: string
        }
        Relationships: []
      }
      radio_playlist_tracks: {
        Row: {
          artist: string | null
          audio_url: string
          created_at: string
          duration_seconds: number | null
          id: string
          playlist_id: string
          source_media_id: string | null
          source_type: string | null
          title: string
          track_order: number | null
        }
        Insert: {
          artist?: string | null
          audio_url: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          playlist_id: string
          source_media_id?: string | null
          source_type?: string | null
          title: string
          track_order?: number | null
        }
        Update: {
          artist?: string | null
          audio_url?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          playlist_id?: string
          source_media_id?: string | null
          source_type?: string | null
          title?: string
          track_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "radio_playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "radio_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      radio_playlists: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      radio_stations: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          is_live: boolean | null
          name: string
          source_type: string | null
          stream_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          is_live?: boolean | null
          name: string
          source_type?: string | null
          stream_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          is_live?: boolean | null
          name?: string
          source_type?: string | null
          stream_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      radio_submissions: {
        Row: {
          admin_notes: string | null
          artist_name: string | null
          audio_url: string
          id: string
          media_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          track_title: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          artist_name?: string | null
          audio_url: string
          id?: string
          media_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          track_title: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          artist_name?: string | null
          audio_url?: string
          id?: string
          media_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          track_title?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_character_analyses: {
        Row: {
          analysis: Json
          chief_aim_snapshot: Json | null
          created_at: string
          id: string
          metrics: Json
          napoleon_hill_laws: Json | null
          user_id: string
        }
        Insert: {
          analysis: Json
          chief_aim_snapshot?: Json | null
          created_at?: string
          id?: string
          metrics: Json
          napoleon_hill_laws?: Json | null
          user_id: string
        }
        Update: {
          analysis?: Json
          chief_aim_snapshot?: Json | null
          created_at?: string
          id?: string
          metrics?: Json
          napoleon_hill_laws?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      saved_insights: {
        Row: {
          content: string
          created_at: string
          id: string
          insight_type: string
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          insight_type: string
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          insight_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          admin_notes: string | null
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          media_url: string | null
          result_highlight: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          testimonial_type: string
          text_content: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          user_title: string | null
        }
        Insert: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          media_url?: string | null
          result_highlight?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          testimonial_type: string
          text_content?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          user_title?: string | null
        }
        Update: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          media_url?: string | null
          result_highlight?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          testimonial_type?: string
          text_content?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          user_title?: string | null
        }
        Relationships: []
      }
      timeline_projects: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          thumbnail_url: string | null
          timeline_data: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          thumbnail_url?: string | null
          timeline_data: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          thumbnail_url?: string | null
          timeline_data?: Json
          title?: string
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
      user_integrations: {
        Row: {
          api_key: string | null
          created_at: string
          id: string
          service_name: string
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: string
          service_name: string
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: string
          service_name?: string
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_playlist_tracks: {
        Row: {
          artist: string | null
          audio_url: string
          created_at: string
          duration_seconds: number | null
          id: string
          metadata: Json | null
          playlist_id: string
          source_id: string | null
          source_type: string | null
          title: string
          track_order: number | null
          user_id: string
        }
        Insert: {
          artist?: string | null
          audio_url: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          playlist_id: string
          source_id?: string | null
          source_type?: string | null
          title: string
          track_order?: number | null
          user_id: string
        }
        Update: {
          artist?: string | null
          audio_url?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          playlist_id?: string
          source_id?: string | null
          source_type?: string | null
          title?: string
          track_order?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "user_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_playlists: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          total_duration_seconds: number | null
          track_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          total_duration_seconds?: number | null
          track_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          total_duration_seconds?: number | null
          track_count?: number | null
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
          can_offer: string | null
          character_build: string | null
          character_features: string | null
          character_height: string | null
          character_style_sheet_url: string | null
          character_weight: string | null
          chat_summary: string | null
          chat_summary_updated_at: string | null
          chief_aim_by_when: string | null
          chief_aim_exchange: string | null
          chief_aim_plan: string | null
          chief_aim_song_url: string | null
          chief_aim_what: string | null
          coaching_call_enabled: boolean | null
          coaching_call_time: string | null
          coaching_call_timezone: string | null
          cover_image_url: string | null
          created_at: string
          current_act: string | null
          current_cycle: number | null
          current_cycle_day: number | null
          current_streak: number | null
          cycles_completed: number | null
          day_number: number | null
          director_character_name: string | null
          display_name: string | null
          evening_scorecard_reminder_time: string | null
          hero_image_back_url: string | null
          hero_image_side_url: string | null
          hero_image_url: string | null
          id: string
          journal_reminder_time: string | null
          last_viewing_date: string | null
          looking_for: string | null
          mind_movie_url: string | null
          morning_ritual_reminder_time: string | null
          phone_number: string | null
          public_vision: string | null
          push_notifications_enabled: boolean | null
          reference_photo_url: string | null
          show_collaboration_info: boolean | null
          show_on_leaderboard: boolean
          skills: string[] | null
          style_sheet_approved: boolean | null
          transformation_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          best_streak?: number | null
          bio?: string | null
          can_offer?: string | null
          character_build?: string | null
          character_features?: string | null
          character_height?: string | null
          character_style_sheet_url?: string | null
          character_weight?: string | null
          chat_summary?: string | null
          chat_summary_updated_at?: string | null
          chief_aim_by_when?: string | null
          chief_aim_exchange?: string | null
          chief_aim_plan?: string | null
          chief_aim_song_url?: string | null
          chief_aim_what?: string | null
          coaching_call_enabled?: boolean | null
          coaching_call_time?: string | null
          coaching_call_timezone?: string | null
          cover_image_url?: string | null
          created_at?: string
          current_act?: string | null
          current_cycle?: number | null
          current_cycle_day?: number | null
          current_streak?: number | null
          cycles_completed?: number | null
          day_number?: number | null
          director_character_name?: string | null
          display_name?: string | null
          evening_scorecard_reminder_time?: string | null
          hero_image_back_url?: string | null
          hero_image_side_url?: string | null
          hero_image_url?: string | null
          id?: string
          journal_reminder_time?: string | null
          last_viewing_date?: string | null
          looking_for?: string | null
          mind_movie_url?: string | null
          morning_ritual_reminder_time?: string | null
          phone_number?: string | null
          public_vision?: string | null
          push_notifications_enabled?: boolean | null
          reference_photo_url?: string | null
          show_collaboration_info?: boolean | null
          show_on_leaderboard?: boolean
          skills?: string[] | null
          style_sheet_approved?: boolean | null
          transformation_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          best_streak?: number | null
          bio?: string | null
          can_offer?: string | null
          character_build?: string | null
          character_features?: string | null
          character_height?: string | null
          character_style_sheet_url?: string | null
          character_weight?: string | null
          chat_summary?: string | null
          chat_summary_updated_at?: string | null
          chief_aim_by_when?: string | null
          chief_aim_exchange?: string | null
          chief_aim_plan?: string | null
          chief_aim_song_url?: string | null
          chief_aim_what?: string | null
          coaching_call_enabled?: boolean | null
          coaching_call_time?: string | null
          coaching_call_timezone?: string | null
          cover_image_url?: string | null
          created_at?: string
          current_act?: string | null
          current_cycle?: number | null
          current_cycle_day?: number | null
          current_streak?: number | null
          cycles_completed?: number | null
          day_number?: number | null
          director_character_name?: string | null
          display_name?: string | null
          evening_scorecard_reminder_time?: string | null
          hero_image_back_url?: string | null
          hero_image_side_url?: string | null
          hero_image_url?: string | null
          id?: string
          journal_reminder_time?: string | null
          last_viewing_date?: string | null
          looking_for?: string | null
          mind_movie_url?: string | null
          morning_ritual_reminder_time?: string | null
          phone_number?: string | null
          public_vision?: string | null
          push_notifications_enabled?: boolean | null
          reference_photo_url?: string | null
          show_collaboration_info?: boolean | null
          show_on_leaderboard?: boolean
          skills?: string[] | null
          style_sheet_approved?: boolean | null
          transformation_start_date?: string | null
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          best_streak: number | null
          current_streak: number | null
          display_name: string | null
          show_on_leaderboard: boolean | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          best_streak?: number | null
          current_streak?: number | null
          display_name?: string | null
          show_on_leaderboard?: boolean | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          best_streak?: number | null
          current_streak?: number | null
          display_name?: string | null
          show_on_leaderboard?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      allocate_credits_atomic: {
        Args: {
          p_credits: number
          p_description: string
          p_session_id: string
          p_user_id: string
        }
        Returns: Json
      }
      calculate_activity_streak: {
        Args: { p_user_id: string }
        Returns: {
          best_streak: number
          current_streak: number
          days_inactive: number
          last_activity_date: string
        }[]
      }
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
      get_points_leaderboard: {
        Args: { time_period?: string }
        Returns: {
          avatar_url: string
          best_streak: number
          current_streak: number
          display_name: string
          rank: number
          total_points: number
          user_id: string
        }[]
      }
      get_user_points_summary: {
        Args: { p_user_id: string; time_period?: string }
        Returns: {
          bonus_points: number
          days_active: number
          journal_points: number
          penalty_points: number
          ritual_points: number
          scorecard_points: number
          task_points: number
          total_points: number
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
      redeem_access_code: { Args: { p_code: string }; Returns: Json }
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
