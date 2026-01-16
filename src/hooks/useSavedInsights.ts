import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface SavedInsight {
  id: string;
  user_id: string;
  insight_type: string;
  title: string;
  content: string;
  created_at: string;
}

export type InsightType = "progress" | "accountability" | "entry_analysis";

export function useSavedInsights() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [insights, setInsights] = useState<SavedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = useCallback(async (type?: InsightType) => {
    if (!user) return [];

    setIsLoading(true);
    try {
      let query = supabase
        .from("saved_insights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (type) {
        query = query.eq("insight_type", type);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const typedData = (data || []) as SavedInsight[];
      setInsights(typedData);
      return typedData;
    } catch (error) {
      console.error("Error fetching saved insights:", error);
      toast({
        title: "Error",
        description: "Failed to load saved insights",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const saveInsight = useCallback(async (
    type: InsightType,
    title: string,
    content: string
  ): Promise<SavedInsight | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("saved_insights")
        .insert({
          user_id: user.id,
          insight_type: type,
          title,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      const typedData = data as SavedInsight;
      setInsights(prev => [typedData, ...prev]);
      
      toast({
        title: "Insight saved",
        description: "You can review this insight anytime in your saved notes.",
      });

      return typedData;
    } catch (error) {
      console.error("Error saving insight:", error);
      toast({
        title: "Error",
        description: "Failed to save insight",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  const deleteInsight = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("saved_insights")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setInsights(prev => prev.filter(i => i.id !== id));
      
      toast({
        title: "Insight deleted",
        description: "The saved insight has been removed.",
      });

      return true;
    } catch (error) {
      console.error("Error deleting insight:", error);
      toast({
        title: "Error",
        description: "Failed to delete insight",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

  return {
    insights,
    isLoading,
    fetchInsights,
    saveInsight,
    deleteInsight,
  };
}
