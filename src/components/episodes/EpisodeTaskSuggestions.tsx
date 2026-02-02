import { useState } from "react";
import { Sparkles, Loader2, Plus, Target, Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Episode } from "@/hooks/useEpisodes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import { format } from "date-fns";

interface Suggestion {
  task: string;
  reason: string;
}

interface EpisodeTaskSuggestionsProps {
  episode: Episode;
}

export function EpisodeTaskSuggestions({ episode }: EpisodeTaskSuggestionsProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const getDaysRemaining = () => {
    const deadlineDate = new Date(episode.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const generateSuggestions = async () => {
    if (!user) return;

    setIsLoading(true);
    setSuggestions([]);

    try {
      // Get existing tasks for today
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: existingTasks } = await supabase
        .from("daily_tasks")
        .select("task_text")
        .eq("user_id", user.id)
        .eq("task_date", today);

      const { data, error } = await supabase.functions.invoke("suggest-tasks", {
        body: {
          chiefAim: {
            what: profile?.chief_aim_what,
            byWhen: profile?.chief_aim_by_when,
            exchange: profile?.chief_aim_exchange,
            plan: profile?.chief_aim_plan,
          },
          existingTasks: existingTasks?.map((t) => t.task_text) || [],
          dayOfWeek: format(new Date(), "EEEE"),
          activeEpisode: {
            title: episode.title,
            objective: episode.objective,
            daysRemaining: getDaysRemaining(),
            alignmentScore: episode.alignment_score,
          },
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        setHasGenerated(true);
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("Failed to generate suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addSuggestionToTasks = async (suggestion: Suggestion) => {
    if (!user) return;

    try {
      // Get existing tasks count for today
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: existingTasks } = await supabase
        .from("daily_tasks")
        .select("id")
        .eq("user_id", user.id)
        .eq("task_date", today);

      if ((existingTasks?.length || 0) >= 3) {
        toast.error("You already have 3 tasks for today. Complete or remove one first.");
        return;
      }

      const { error } = await supabase.from("daily_tasks").insert({
        user_id: user.id,
        task_text: suggestion.task,
        task_date: today,
        priority: (existingTasks?.length || 0) + 1,
      });

      if (error) throw error;

      toast.success("Task added to your Three Things!");
      setSuggestions((prev) => prev.filter((s) => s.task !== suggestion.task));
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task. Please try again.");
    }
  };

  return (
    <div className="glass-card p-4 border border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">AI Episode Suggestions</h3>
            <p className="text-xs text-muted-foreground">
              Get task ideas based on your episode objective
            </p>
          </div>
        </div>
      </div>

      {/* Episode Context */}
      <div className="bg-muted/30 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{episode.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {episode.objective}
            </p>
          </div>
        </div>
      </div>

      {/* Generate Button or Suggestions */}
      {!hasGenerated ? (
        <Button
          onClick={generateSuggestions}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Episode Tasks
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{suggestion.task}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {suggestion.reason}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addSuggestionToTasks(suggestion)}
                      className="shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={generateSuggestions}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate More
              </Button>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <p>All suggestions added! Click below for more ideas.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={generateSuggestions}
                className="mt-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
