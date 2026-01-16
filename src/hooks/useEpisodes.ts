import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Episode {
  id: string;
  user_id: string;
  title: string;
  objective: string;
  deadline: string;
  duration_type: "week" | "two-weeks" | "30-days" | "custom";
  status: "active" | "completed" | "paused" | "abandoned";
  alignment_score: number | null;
  alignment_reasoning: string | null;
  vision_answers: Record<string, string> | null;
  mind_movie_script_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateEpisodeInput {
  title: string;
  objective: string;
  deadline: string;
  duration_type: "week" | "two-weeks" | "30-days" | "custom";
  vision_answers?: Record<string, string>;
}

export function useEpisodes() {
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  const fetchEpisodes = useCallback(async () => {
    if (!user) {
      setEpisodes([]);
      setActiveEpisode(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedEpisodes = (data || []) as Episode[];
      setEpisodes(typedEpisodes);
      
      // Find the active episode
      const active = typedEpisodes.find(ep => ep.status === "active");
      setActiveEpisode(active || null);
    } catch (error) {
      console.error("Error fetching episodes:", error);
      toast.error("Failed to load episodes");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const validateAlignment = useCallback(async (
    objective: string,
    chiefAim: { what: string; byWhen: string; exchange: string; plan: string }
  ): Promise<{ score: number; reasoning: string } | null> => {
    if (!user) return null;

    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-episode-alignment", {
        body: { objective, chiefAim }
      });

      if (error) throw error;
      return data as { score: number; reasoning: string };
    } catch (error) {
      console.error("Error validating alignment:", error);
      toast.error("Failed to validate episode alignment");
      return null;
    } finally {
      setValidating(false);
    }
  }, [user]);

  const createEpisode = useCallback(async (input: CreateEpisodeInput): Promise<Episode | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("episodes")
        .insert({
          user_id: user.id,
          title: input.title,
          objective: input.objective,
          deadline: input.deadline,
          duration_type: input.duration_type,
          vision_answers: input.vision_answers || null,
          status: "active"
        })
        .select()
        .single();

      if (error) throw error;

      const newEpisode = data as Episode;
      await fetchEpisodes();
      toast.success("Episode created! Time to make it happen.");
      return newEpisode;
    } catch (error) {
      console.error("Error creating episode:", error);
      toast.error("Failed to create episode");
      return null;
    }
  }, [user, fetchEpisodes]);

  const updateEpisode = useCallback(async (
    episodeId: string,
    updates: Partial<Pick<Episode, "title" | "objective" | "deadline" | "status" | "alignment_score" | "alignment_reasoning" | "vision_answers" | "mind_movie_script_id" | "completed_at">>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("episodes")
        .update(updates)
        .eq("id", episodeId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchEpisodes();
      return true;
    } catch (error) {
      console.error("Error updating episode:", error);
      toast.error("Failed to update episode");
      return false;
    }
  }, [user, fetchEpisodes]);

  const completeEpisode = useCallback(async (episodeId: string): Promise<boolean> => {
    const success = await updateEpisode(episodeId, {
      status: "completed",
      completed_at: new Date().toISOString()
    });

    if (success) {
      toast.success("Episode completed! 🎬 That's a wrap!");
    }
    return success;
  }, [updateEpisode]);

  const pauseEpisode = useCallback(async (episodeId: string): Promise<boolean> => {
    const success = await updateEpisode(episodeId, { status: "paused" });
    if (success) {
      toast.info("Episode paused");
    }
    return success;
  }, [updateEpisode]);

  const resumeEpisode = useCallback(async (episodeId: string): Promise<boolean> => {
    const success = await updateEpisode(episodeId, { status: "active" });
    if (success) {
      toast.success("Episode resumed!");
    }
    return success;
  }, [updateEpisode]);

  const abandonEpisode = useCallback(async (episodeId: string): Promise<boolean> => {
    const success = await updateEpisode(episodeId, { status: "abandoned" });
    if (success) {
      toast.info("Episode abandoned");
    }
    return success;
  }, [updateEpisode]);

  const deleteEpisode = useCallback(async (episodeId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("episodes")
        .delete()
        .eq("id", episodeId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchEpisodes();
      toast.success("Episode deleted");
      return true;
    } catch (error) {
      console.error("Error deleting episode:", error);
      toast.error("Failed to delete episode");
      return false;
    }
  }, [user, fetchEpisodes]);

  const getDaysRemaining = useCallback((deadline: string): number => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const getProgress = useCallback((episode: Episode): number => {
    const createdDate = new Date(episode.created_at);
    const deadlineDate = new Date(episode.deadline);
    const today = new Date();
    
    const totalDays = Math.max(1, Math.ceil((deadlineDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  }, []);

  return {
    episodes,
    activeEpisode,
    loading,
    validating,
    fetchEpisodes,
    validateAlignment,
    createEpisode,
    updateEpisode,
    completeEpisode,
    pauseEpisode,
    resumeEpisode,
    abandonEpisode,
    deleteEpisode,
    getDaysRemaining,
    getProgress
  };
}
