import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Scene {
  order: number;
  title: string;
  narrative: string;
  prompt: string;
  duration: number;
  emotionalTone: string;
  generatedImageUrl?: string | null;
  generatedVideoUrl?: string | null;
}

export interface MindMovieScript {
  id: string;
  user_id: string;
  title: string | null;
  chief_aim_snapshot: {
    what?: string;
    byWhen?: string;
    exchange?: string;
    plan?: string;
  } | null;
  visual_style: string | null;
  scenes: Scene[];
  status: string;
  created_at: string;
  updated_at: string;
  // Soundtrack fields
  soundtrack_url?: string | null;
  song_lyrics?: string | null;
  music_style?: string | null;
  suno_task_id?: string | null;
  // Reference photo for AI generation
  reference_photo_url?: string | null;
}

export function useMindMovieScript() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentScript, setCurrentScript] = useState<MindMovieScript | null>(null);

  const fetchLatestScript = useCallback(async () => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("mind_movie_scripts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching script:", error);
        return null;
      }

      if (data) {
        const script: MindMovieScript = {
          ...data,
          scenes: (data.scenes as unknown as Scene[]) || [],
          chief_aim_snapshot: data.chief_aim_snapshot as MindMovieScript["chief_aim_snapshot"],
        };
        setCurrentScript(script);
        return script;
      }
      return null;
    } catch (error) {
      console.error("Error fetching script:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchScriptById = useCallback(async (scriptId: string) => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("mind_movie_scripts")
        .select("*")
        .eq("id", scriptId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching script:", error);
        return null;
      }

      if (data) {
        const script: MindMovieScript = {
          ...data,
          scenes: (data.scenes as unknown as Scene[]) || [],
          chief_aim_snapshot: data.chief_aim_snapshot as MindMovieScript["chief_aim_snapshot"],
        };
        setCurrentScript(script);
        return script;
      }
      return null;
    } catch (error) {
      console.error("Error fetching script:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const generateStoryboard = useCallback(async (
    chiefAim: { what?: string; byWhen?: string; exchange?: string; plan?: string },
    visualStyle: string,
    userDescription: string,
    existingScenes?: Scene[],
    transformationAnalysis?: {
      currentSelf?: { archetype?: string };
      requiredCharacter?: {
        name?: string;
        traits?: string[];
        behaviors?: string[];
        mindset?: string;
      };
      gap?: {
        whatMustDie?: string[];
        whatMustEmerge?: string[];
      };
      script?: {
        role?: string;
        arc?: string;
      };
    },
    episodeMode?: boolean,
    episodeData?: {
      id: string;
      title: string;
      objective: string;
      deadline: string;
      alignment_score?: number | null;
    }
  ) => {
    if (!user) {
      toast.error("Please sign in to generate a storyboard");
      return null;
    }

    setIsGenerating(true);
    try {
      // Use supabase.functions.invoke to automatically use the authenticated session token
      const { data, error } = await supabase.functions.invoke("generate-storyboard", {
        body: {
          chiefAim,
          visualStyle,
          userDescription,
          existingScenes: existingScenes || undefined,
          addMoreScenes: existingScenes ? true : false,
          transformationAnalysis: transformationAnalysis || undefined,
          episodeMode: episodeMode || false,
          episodeData: episodeData || undefined,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to generate storyboard");
      }

      return data as { title: string; scenes: Scene[] };
    } catch (error) {
      console.error("Error generating storyboard:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate storyboard");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const saveScript = useCallback(async (
    title: string,
    scenes: Scene[],
    chiefAimSnapshot: MindMovieScript["chief_aim_snapshot"],
    visualStyle: string,
    existingId?: string
  ) => {
    if (!user) {
      toast.error("Please sign in to save");
      return null;
    }

    setIsLoading(true);
    try {
      if (existingId) {
        const { data, error } = await supabase
          .from("mind_movie_scripts")
          .update({
            title,
            scenes: scenes as any,
            visual_style: visualStyle,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        
        const script: MindMovieScript = {
          ...data,
          scenes: (data.scenes as unknown as Scene[]) || [],
          chief_aim_snapshot: data.chief_aim_snapshot as MindMovieScript["chief_aim_snapshot"],
        };
        setCurrentScript(script);
        toast.success("Storyboard saved!");
        return script;
      } else {
        const { data, error } = await supabase
          .from("mind_movie_scripts")
          .insert({
            user_id: user.id,
            title,
            scenes: scenes as any,
            chief_aim_snapshot: chiefAimSnapshot as any,
            visual_style: visualStyle,
            status: "draft",
          })
          .select()
          .single();

        if (error) throw error;
        
        const script: MindMovieScript = {
          ...data,
          scenes: (data.scenes as unknown as Scene[]) || [],
          chief_aim_snapshot: data.chief_aim_snapshot as MindMovieScript["chief_aim_snapshot"],
        };
        setCurrentScript(script);
        toast.success("Storyboard created!");
        return script;
      }
    } catch (error) {
      console.error("Error saving script:", error);
      toast.error("Failed to save storyboard");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateScene = useCallback(async (
    scriptId: string,
    sceneOrder: number,
    updates: Partial<Scene>
  ) => {
    if (!user || !currentScript) return false;

    const updatedScenes = currentScript.scenes.map((scene) =>
      scene.order === sceneOrder ? { ...scene, ...updates } : scene
    );

    try {
      const { error } = await supabase
        .from("mind_movie_scripts")
        .update({
          scenes: updatedScenes as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scriptId)
        .eq("user_id", user.id);

      if (error) throw error;

      setCurrentScript({ ...currentScript, scenes: updatedScenes });
      return true;
    } catch (error) {
      console.error("Error updating scene:", error);
      toast.error("Failed to update scene");
      return false;
    }
  }, [user, currentScript]);

  return {
    isLoading,
    isGenerating,
    currentScript,
    fetchLatestScript,
    fetchScriptById,
    generateStoryboard,
    saveScript,
    updateScene,
    setCurrentScript,
  };
}
