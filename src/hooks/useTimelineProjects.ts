import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TimelineState, TimelineClip, TimelineTrack, TimelineTransition } from "./useTimelineEditor";

export interface TimelineProject {
  id: string;
  user_id: string;
  title: string;
  timeline_data: TimelineProjectData;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineProjectData {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  transitions: TimelineTransition[];
  masterVolume: number;
  backgroundAudio: {
    url: string | null;
    name: string;
    volume: number;
    muted: boolean;
  };
}

export function useTimelineProjects() {
  const [projects, setProjects] = useState<TimelineProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch all projects for the current user
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to view your projects",
          variant: "destructive",
        });
        return [];
      }

      const { data, error } = await supabase
        .from("timeline_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const typedProjects = (data || []).map((p) => ({
        ...p,
        timeline_data: p.timeline_data as unknown as TimelineProjectData,
      }));

      setProjects(typedProjects);
      return typedProjects;
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error loading projects",
        description: "Failed to load your timeline projects",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save a new project
  const saveProject = useCallback(async (
    title: string,
    state: TimelineState,
    thumbnailUrl?: string
  ): Promise<string | null> => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to save your project",
          variant: "destructive",
        });
        return null;
      }

      const projectData: TimelineProjectData = {
        tracks: state.tracks,
        clips: state.clips,
        transitions: state.transitions,
        masterVolume: state.masterVolume,
        backgroundAudio: state.backgroundAudio,
      };

      const { data, error } = await supabase
        .from("timeline_projects")
        .insert([{
          user_id: user.id,
          title,
          timeline_data: JSON.parse(JSON.stringify(projectData)),
          thumbnail_url: thumbnailUrl || null,
          duration_seconds: state.duration,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Project saved",
        description: `"${title}" has been saved successfully`,
      });

      await fetchProjects();
      return data.id;
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error saving project",
        description: "Failed to save your timeline project",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [toast, fetchProjects]);

  // Update an existing project
  const updateProject = useCallback(async (
    projectId: string,
    title: string,
    state: TimelineState,
    thumbnailUrl?: string
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const projectData: TimelineProjectData = {
        tracks: state.tracks,
        clips: state.clips,
        transitions: state.transitions,
        masterVolume: state.masterVolume,
        backgroundAudio: state.backgroundAudio,
      };

      const { error } = await supabase
        .from("timeline_projects")
        .update({
          title,
          timeline_data: JSON.parse(JSON.stringify(projectData)),
          thumbnail_url: thumbnailUrl || null,
          duration_seconds: state.duration,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Project updated",
        description: `"${title}" has been updated`,
      });

      await fetchProjects();
      return true;
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error updating project",
        description: "Failed to update your timeline project",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [toast, fetchProjects]);

  // Delete a project
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("timeline_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Project deleted",
        description: "The project has been deleted",
      });

      await fetchProjects();
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error deleting project",
        description: "Failed to delete the project",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, fetchProjects]);

  // Load a project by ID
  const loadProject = useCallback(async (projectId: string): Promise<TimelineProjectData | null> => {
    try {
      const { data, error } = await supabase
        .from("timeline_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;

      return data.timeline_data as unknown as TimelineProjectData;
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        title: "Error loading project",
        description: "Failed to load the timeline project",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  return {
    projects,
    isLoading,
    isSaving,
    fetchProjects,
    saveProject,
    updateProject,
    deleteProject,
    loadProject,
  };
}
