import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DirectorProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  public_vision: string | null;
  skills: string[] | null;
  looking_for: string | null;
  can_offer: string | null;
  current_streak: number | null;
  best_streak: number | null;
  cover_image_url: string | null;
}

export function useDirectorProfiles() {
  const [profiles, setProfiles] = useState<DirectorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      // Fetch profiles that have collaboration info enabled
      const { data, error } = await supabase
        .from("user_profiles")
        .select(`
          user_id,
          display_name,
          avatar_url,
          bio,
          public_vision,
          skills,
          looking_for,
          can_offer,
          current_streak,
          best_streak,
          cover_image_url
        `)
        .eq("show_collaboration_info", true)
        .order("current_streak", { ascending: false, nullsFirst: false })
        .limit(50);

      if (error) throw error;

      // Filter out profiles that don't have any collaboration info
      const filteredProfiles = (data || []).filter(
        (p) => p.public_vision || (p.skills && p.skills.length > 0) || p.looking_for || p.can_offer
      );

      setProfiles(filteredProfiles);
    } catch (error) {
      console.error("Error fetching director profiles:", error);
      toast.error("Failed to load director profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Filter profiles based on search query
  const filteredProfiles = profiles.filter((profile) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesName = profile.display_name?.toLowerCase().includes(query);
    const matchesBio = profile.bio?.toLowerCase().includes(query);
    const matchesVision = profile.public_vision?.toLowerCase().includes(query);
    const matchesSkills = profile.skills?.some((s) => s.toLowerCase().includes(query));
    const matchesLookingFor = profile.looking_for?.toLowerCase().includes(query);
    const matchesCanOffer = profile.can_offer?.toLowerCase().includes(query);

    return matchesName || matchesBio || matchesVision || matchesSkills || matchesLookingFor || matchesCanOffer;
  });

  return {
    profiles: filteredProfiles,
    loading,
    searchQuery,
    setSearchQuery,
    refetch: fetchProfiles,
  };
}