import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Calendar, Plus, Loader2, Sparkles, Check, XCircle, Target, Lightbulb, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useEpisodes } from "@/hooks/useEpisodes";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Task {
  id: string;
  task_text: string;
  is_completed: boolean;
  priority: number;
  incomplete_reason?: string | null;
}

interface Suggestion {
  task: string;
  reason: string;
}

export function DashboardEpisodeTracker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { activeEpisode, getDaysRemaining, getProgress } = useEpisodes();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_date", today)
      .order("priority", { ascending: true });

    if (!error && data) {
      setTasks(data as Task[]);
    }
    setIsLoading(false);
  }, [user, today]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  if (!activeEpisode) return null;

  const daysRemaining = getDaysRemaining(activeEpisode.deadline);
  const progress = getProgress(activeEpisode);
  const isOverdue = daysRemaining < 0;

  const addTask = async () => {
    if (!user || !newTaskText.trim()) return;
    if (tasks.length >= 3) {
      toast.error("Max 3 tasks per day. Complete or remove one first.");
      return;
    }

    const { error } = await supabase.from("daily_tasks").insert({
      user_id: user.id,
      task_text: newTaskText.trim(),
      task_date: today,
      priority: tasks.length + 1,
    });

    if (!error) {
      setNewTaskText("");
      loadTasks();
    }
  };

  const toggleTask = async (task: Task) => {
    if (!user) return;
    const newCompleted = !task.is_completed;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: newCompleted } : t));

    const { error } = await supabase
      .from("daily_tasks")
      .update({ is_completed: newCompleted })
      .eq("id", task.id);

    if (error) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: !newCompleted } : t));
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from("daily_tasks").delete().eq("id", taskId);
  };

  const generateSuggestions = async () => {
    if (!user || !activeEpisode) return;
    setIsSuggesting(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke("suggest-tasks", {
        body: {
          chiefAim: {
            what: profile?.chief_aim_what,
            byWhen: profile?.chief_aim_by_when,
            exchange: profile?.chief_aim_exchange,
            plan: profile?.chief_aim_plan,
          },
          existingTasks: tasks.map(t => t.task_text),
          dayOfWeek: format(new Date(), "EEEE"),
          activeEpisode: {
            title: activeEpisode.title,
            objective: activeEpisode.objective,
            daysRemaining,
            alignmentScore: activeEpisode.alignment_score,
          },
        },
      });

      if (error) throw error;
      if (data?.suggestions) setSuggestions(data.suggestions);
    } catch {
      toast.error("Failed to generate suggestions.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const addSuggestion = async (suggestion: Suggestion) => {
    if (!user) return;
    if (tasks.length >= 3) {
      toast.error("Max 3 tasks. Complete or remove one first.");
      return;
    }

    const { error } = await supabase.from("daily_tasks").insert({
      user_id: user.id,
      task_text: suggestion.task,
      task_date: today,
      priority: tasks.length + 1,
    });

    if (!error) {
      toast.success("Task added!");
      setSuggestions(prev => prev.filter(s => s.task !== suggestion.task));
      loadTasks();
    }
  };

  const completedCount = tasks.filter(t => t.is_completed).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass-card cinematic-border overflow-hidden animate-fade-in">
        {/* Episode Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 sm:p-5 flex items-start gap-3 sm:gap-4 text-left hover:bg-muted/10 transition-colors">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">Active Episode</span>
                {activeEpisode.alignment_score && (
                  <span className={cn("text-xs px-1.5 py-0.5 rounded",
                    activeEpisode.alignment_score >= 70 ? "bg-green-500/20 text-green-400" :
                    activeEpisode.alignment_score >= 50 ? "bg-gold/20 text-gold" :
                    "bg-amber-500/20 text-amber-400"
                  )}>
                    {activeEpisode.alignment_score}% aligned
                  </span>
                )}
              </div>
              <h3 className="font-display text-base sm:text-lg tracking-wide truncate">{activeEpisode.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{activeEpisode.objective}</p>

              {/* Progress */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{completedCount}/{tasks.length} tasks done</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className={isOverdue ? "text-red-400" : "text-muted-foreground"}>
                      {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : daysRemaining === 0 ? "Due today" : `${daysRemaining}d left`}
                    </span>
                  </div>
                </div>
                <Progress value={progress} className={cn("h-1.5", isOverdue ? "[&>div]:bg-red-500" : "[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-600")} />
              </div>
            </div>
            <div className="shrink-0 mt-1">
              {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3 border-t border-border/50">
            {/* Section Header */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">Today's 3 Actions</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => navigate("/actions")}>
                View All →
              </Button>
            </div>

            {/* Tasks List */}
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
                    task.is_completed
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-card/50 border-border/40 hover:border-amber-500/30"
                  )}>
                    <button
                      onClick={() => toggleTask(task)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        task.is_completed
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-muted-foreground/30 hover:border-amber-500"
                      )}
                    >
                      {task.is_completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className={cn(
                      "flex-1 text-sm min-w-0 truncate",
                      task.is_completed && "line-through text-muted-foreground"
                    )}>
                      {task.task_text}
                    </span>
                    <button onClick={() => deleteTask(task.id)} className="text-muted-foreground/50 hover:text-red-400 transition-colors shrink-0">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add Task Input */}
                {tasks.length < 3 && (
                  <div className="flex gap-2">
                    <Input
                      value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                      placeholder="Add an action item..."
                      className="h-9 text-sm bg-card/50"
                      onKeyDown={e => e.key === "Enter" && addTask()}
                    />
                    <Button size="sm" onClick={addTask} disabled={!newTaskText.trim()} className="h-9 px-3 bg-amber-500 hover:bg-amber-600">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Empty State */}
                {tasks.length === 0 && !isLoading && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    What 3 things will move you closer to this episode's objective today?
                  </p>
                )}
              </div>
            )}

            {/* AI Suggestions */}
            <div className="pt-1">
              {suggestions.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-amber-500">AI Suggestions</span>
                  </div>
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg border border-amber-500/20 bg-amber-500/5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{s.task}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => addSuggestion(s)} className="shrink-0 h-7 px-2 text-amber-500 hover:bg-amber-500/10">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={generateSuggestions} disabled={isSuggesting} className="w-full text-xs text-muted-foreground">
                    <RefreshCw className="w-3 h-3 mr-1" /> More suggestions
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSuggestions}
                  disabled={isSuggesting}
                  className="w-full border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
                >
                  {isSuggesting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Get AI Suggestions</>
                  )}
                </Button>
              )}
            </div>

            {/* Manage Episodes Link */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/episodes")}
              className="w-full text-xs text-muted-foreground hover:text-amber-500"
            >
              Manage Episodes →
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
