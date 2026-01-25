import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  director_character_name: string | null;
  reference_photo_url?: string | null;

  // Hero / character consistency fields
  character_height?: string | null;
  character_weight?: string | null;
  character_build?: string | null;
  character_features?: string | null;
  hero_image_url?: string | null;
  hero_image_side_url?: string | null;
  hero_image_back_url?: string | null;

  // Cover image for Director Banner (cross-device persistence)
  cover_image_url?: string | null;

  chief_aim_what: string | null;
  chief_aim_by_when: string | null;
  chief_aim_exchange: string | null;
  chief_aim_plan: string | null;
  chief_aim_song_url?: string | null;
  current_act: string | null;
  mind_movie_url: string | null;
  current_streak: number | null;
  best_streak: number | null;
  last_viewing_date: string | null;
  day_number: number | null;
  show_on_leaderboard: boolean;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;

  // Collaboration fields for Director's Corner
  public_vision?: string | null;
  skills?: string[] | null;
  looking_for?: string | null;
  can_offer?: string | null;
  show_collaboration_info?: boolean | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            display_name: user.email?.split("@")[0] || "Director",
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    if (user) {
      fetchProfileData();
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const recordViewing = async (durationSeconds?: number) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("viewing_history").insert({
        user_id: user.id,
        duration_seconds: durationSeconds,
      });

      if (error && !error.message.includes("duplicate")) {
        throw error;
      }

      // Refresh profile to get updated streak
      const { data: updatedProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (err) {
      console.error("Error recording viewing:", err);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    recordViewing,
    refetch,
  };
};
