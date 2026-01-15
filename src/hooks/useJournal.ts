import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  tags: string[] | null;
  ai_analysis: string | null;
  ai_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Mood = "excited" | "focused" | "challenged" | "breakthrough" | "struggling" | "grateful" | "reflective";

export const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: "excited", label: "Excited", emoji: "🔥" },
  { value: "focused", label: "Focused", emoji: "🎯" },
  { value: "breakthrough", label: "Breakthrough", emoji: "💡" },
  { value: "grateful", label: "Grateful", emoji: "🙏" },
  { value: "reflective", label: "Reflective", emoji: "🪞" },
  { value: "challenged", label: "Challenged", emoji: "💪" },
  { value: "struggling", label: "Struggling", emoji: "🌧️" },
];

export const TAG_OPTIONS = [
  "mindset",
  "action",
  "visualization",
  "chief-aim",
  "breakthrough",
  "obstacle",
  "gratitude",
  "lesson",
  "win",
  "reflection",
];

export function useJournal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchEntries = useCallback(async (limit = 50) => {
    if (!user) return [];

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Type assertion since we know the shape matches
      const typedData = (data || []) as unknown as JournalEntry[];
      setEntries(typedData);
      return typedData;
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      toast({
        title: "Error",
        description: "Failed to load journal entries",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const createEntry = useCallback(async (entry: {
    title?: string;
    content: string;
    mood?: string;
    tags?: string[];
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          title: entry.title || null,
          content: entry.content,
          mood: entry.mood || null,
          tags: entry.tags || null,
        })
        .select()
        .single();

      if (error) throw error;

      const typedData = data as unknown as JournalEntry;
      setEntries(prev => [typedData, ...prev]);
      
      toast({
        title: "Entry saved",
        description: "Your journal entry has been recorded.",
      });

      return typedData;
    } catch (error) {
      console.error("Error creating journal entry:", error);
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  const updateEntry = useCallback(async (id: string, updates: Partial<JournalEntry>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      const typedData = data as unknown as JournalEntry;
      setEntries(prev => prev.map(e => e.id === id ? typedData : e));
      
      return typedData;
    } catch (error) {
      console.error("Error updating journal entry:", error);
      toast({
        title: "Error",
        description: "Failed to update journal entry",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== id));
      
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been removed.",
      });

      return true;
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete journal entry",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

  const analyzeEntry = useCallback(async (entryId: string) => {
    if (!user) return null;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-journal", {
        body: { entryId, analysisType: "single" },
      });

      if (error) throw error;

      // Update local state with the analysis
      if (data?.analysis) {
        setEntries(prev => prev.map(e => 
          e.id === entryId 
            ? { ...e, ai_analysis: data.analysis, ai_analyzed_at: new Date().toISOString() }
            : e
        ));
      }

      return data?.analysis;
    } catch (error) {
      console.error("Error analyzing entry:", error);
      toast({
        title: "Analysis failed",
        description: "Could not generate AI feedback. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, toast]);

  const getProgressReport = useCallback(async () => {
    if (!user) return null;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-journal", {
        body: { analysisType: "progress" },
      });

      if (error) throw error;
      return data?.analysis;
    } catch (error) {
      console.error("Error getting progress report:", error);
      toast({
        title: "Error",
        description: "Could not generate progress report.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, toast]);

  const getAccountabilityReport = useCallback(async () => {
    if (!user) return null;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-journal", {
        body: { analysisType: "accountability" },
      });

      if (error) throw error;
      return data?.analysis;
    } catch (error) {
      console.error("Error getting accountability report:", error);
      toast({
        title: "Error",
        description: "Could not generate accountability report.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, toast]);

  return {
    entries,
    isLoading,
    isAnalyzing,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    analyzeEntry,
    getProgressReport,
    getAccountabilityReport,
  };
}