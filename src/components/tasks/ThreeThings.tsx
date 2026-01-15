import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Target, Plus, Trash2, Loader2, Sparkles, ChevronLeft, ChevronRight,
  Calendar, RefreshCw, X, AlertCircle, BarChart3, Check, XCircle, Flame
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, isSameDay, isToday, subDays } from "date-fns";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExcuseAnalytics } from "./ExcuseAnalytics";

interface Task {
  id: string;
  task_text: string;
  is_completed: boolean;
  priority: number;
  task_date: string;
  incomplete_reason?: string | null;
}

interface Suggestion {
  task: string;
  reason: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const INCOMPLETE_REASONS = [
  { id: "procrastinating", label: "I was bullshitting, I was procrastinating today", shortLabel: "Procrastinating" },
  { id: "others_movie", label: "I got caught up in someone else's movie", shortLabel: "Someone else's movie" },
  { id: "ran_out_of_time", label: "I ran out of time", shortLabel: "Ran out of time" },
];

const getExcuseLabel = (reasonId: string | null | undefined): string | null => {
  if (!reasonId) return null;
  const reason = INCOMPLETE_REASONS.find(r => r.id === reasonId);
  return reason?.shortLabel || null;
};

interface ThreeThingsProps {
  showAnalyticsDefault?: boolean;
}

export function ThreeThings({ showAnalyticsDefault = false }: ThreeThingsProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [excuseDialogOpen, setExcuseDialogOpen] = useState(false);
  const [taskToUncheck, setTaskToUncheck] = useState<Task | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(showAnalyticsDefault);
  const [taskStreak, setTaskStreak] = useState(0);
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();

  // Load streak on mount
  useEffect(() => {
    if (user) {
      loadTaskStreak();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user, selectedDate]);

  const loadTaskStreak = async () => {
    if (!user) return;

    // Get tasks for the last 90 days to calculate streak
    const startDate = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("daily_tasks")
      .select("task_date, is_completed")
      .eq("user_id", user.id)
      .gte("task_date", startDate)
      .order("task_date", { ascending: false });

    if (error || !data) {
      console.error("Error loading streak:", error);
      return;
    }

    // Group tasks by date
    const tasksByDate: Record<string, { total: number; completed: number }> = {};
    data.forEach(task => {
      if (!tasksByDate[task.task_date]) {
        tasksByDate[task.task_date] = { total: 0, completed: 0 };
      }
      tasksByDate[task.task_date].total++;
      if (task.is_completed) {
        tasksByDate[task.task_date].completed++;
      }
    });

    // Calculate streak (consecutive days with 3 tasks all completed)
    let streak = 0;
    let currentDate = subDays(new Date(), 1); // Start from yesterday (today might be incomplete)
    
    while (true) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const dayData = tasksByDate[dateStr];
      
      // Day counts if it has exactly 3 tasks and all are completed
      if (dayData && dayData.total === 3 && dayData.completed === 3) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else if (dayData && dayData.total > 0) {
        // Has tasks but not all 3 completed - streak broken
        break;
      } else {
        // No tasks for this day - check if we should continue or break
        // If we already have a streak, no tasks means break
        if (streak > 0) break;
        // If no streak yet, skip empty days
        currentDate = subDays(currentDate, 1);
        // But don't go back more than 7 days looking for start
        if (subDays(new Date(), 7) > currentDate) break;
      }
    }

    setTaskStreak(streak);
  };

  const loadTasks = async () => {
    if (!user) return;
    setIsLoading(true);

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_date", dateStr)
      .order("priority");

    if (error) {
      console.error("Error loading tasks:", error);
    } else {
      setTasks(data || []);
    }
    setIsLoading(false);
  };

  const addTask = async () => {
    if (!user || !newTaskText.trim()) return;
    if (tasks.length >= 3) {
      toast({
        title: "Maximum 3 tasks",
        description: "Focus on your top 3 priorities for the day.",
        variant: "destructive",
      });
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("daily_tasks")
      .insert({
        user_id: user.id,
        task_text: newTaskText.trim(),
        task_date: dateStr,
        priority: tasks.length + 1,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
    } else if (data) {
      setTasks([...tasks, data]);
      setNewTaskText("");
    }
  };

  const markTaskComplete = async (task: Task) => {
    const { error } = await supabase
      .from("daily_tasks")
      .update({ is_completed: true, incomplete_reason: null })
      .eq("id", task.id);

    if (!error) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: true, incomplete_reason: null } : t));
    }
  };

  const markTaskIncomplete = (task: Task) => {
    setTaskToUncheck(task);
    setExcuseDialogOpen(true);
  };

  const handleExcuseSelect = async (reason: string) => {
    if (!taskToUncheck) return;

    const { error } = await supabase
      .from("daily_tasks")
      .update({ is_completed: false, incomplete_reason: reason })
      .eq("id", taskToUncheck.id);

    if (!error) {
      setTasks(tasks.map(t => t.id === taskToUncheck.id ? { ...t, is_completed: false, incomplete_reason: reason } : t));
    }

    setExcuseDialogOpen(false);
    setTaskToUncheck(null);
  };

  const cancelExcuseDialog = () => {
    setExcuseDialogOpen(false);
    setTaskToUncheck(null);
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("id", taskId);

    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const addSuggestion = async (suggestion: Suggestion) => {
    if (!user) return;
    if (tasks.length >= 3) {
      toast({
        title: "Maximum 3 tasks",
        description: "Delete a task first to add this suggestion.",
        variant: "destructive",
      });
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("daily_tasks")
      .insert({
        user_id: user.id,
        task_text: suggestion.task,
        task_date: dateStr,
        priority: tasks.length + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks([...tasks, data]);
      setSuggestions(suggestions.filter(s => s.task !== suggestion.task));
      toast({ title: "Task added", description: suggestion.task });
    }
  };

  const getSuggestions = async () => {
    if (!user) return;
    setIsSuggesting(true);
    setSuggestions([]);

    try {
      // Use supabase.functions.invoke which automatically handles auth
      const { data, error } = await supabase.functions.invoke("suggest-tasks", {
        body: {
          chiefAim: {
            what: profile?.chief_aim_what,
            byWhen: profile?.chief_aim_by_when,
            exchange: profile?.chief_aim_exchange,
            plan: profile?.chief_aim_plan,
          },
          existingTasks: tasks.map(t => t.task_text),
          dayOfWeek: format(selectedDate, "EEEE"),
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to get suggestions");
      }

      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      toast({
        title: "Suggestion failed",
        description: error instanceof Error ? error.message : "Could not get suggestions",
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newStart = addDays(weekStart, direction === "prev" ? -7 : 7);
    setWeekStart(newStart);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="glass-card p-6 cinematic-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-display tracking-wide">The Three Things</h3>
              <InfoTooltip content="Focus on just 3 priority tasks per day that move you toward your Chief Aim. Small daily actions compound into massive transformation. Use 'Director's Suggestions' for AI-powered task ideas." />
            </div>
            <p className="text-sm text-muted-foreground">Your daily priorities</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`gap-2 ${showAnalytics ? 'bg-gold/10 border-gold/30' : ''}`}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Patterns</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={getSuggestions}
            disabled={isSuggesting}
            className="gap-2"
          >
            {isSuggesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Director's Suggestions</span>
            <span className="sm:hidden">Suggest</span>
          </Button>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="animate-slide-up">
          <ExcuseAnalytics />
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigateWeek("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1">
          {weekDays.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors ${
                isSameDay(day, selectedDate)
                  ? "bg-primary text-primary-foreground"
                  : isToday(day)
                  ? "bg-primary/20 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <span className="text-xs font-medium">{DAYS[i]}</span>
              <span className="text-lg font-bold">{format(day, "d")}</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateWeek("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Date Header with Streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
          {isToday(selectedDate) && (
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium">Today</span>
          )}
        </div>
        
        {/* Streak Counter */}
        {taskStreak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-500">{taskStreak}</span>
            <span className="text-xs text-orange-500/80">day streak</span>
          </div>
        )}
      </div>
      {/* Tasks List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tasks for this day</p>
            <p className="text-sm">Add up to 3 priorities</p>
          </div>
        ) : (
          tasks.map((task, index) => {
            const excuseLabel = getExcuseLabel(task.incomplete_reason);
            
            return (
              <div
                key={task.id}
                className={`p-3 rounded-lg border transition-colors ${
                  task.is_completed
                    ? "bg-primary/10 border-primary/30"
                    : task.incomplete_reason
                    ? "bg-destructive/10 border-destructive/30"
                    : "bg-muted/50 border-border/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary w-5">#{index + 1}</span>
                  <span className={`flex-1 ${task.is_completed ? "text-primary" : task.incomplete_reason ? "text-muted-foreground" : ""}`}>
                    {task.task_text}
                  </span>
                  
                  {/* Yes/No Buttons */}
                  <div className="flex items-center gap-1.5">
                    {task.is_completed ? (
                      <div className="flex items-center gap-1.5 text-primary text-xs font-medium">
                        <Check className="h-4 w-4" />
                        <span>Done</span>
                      </div>
                    ) : task.incomplete_reason ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => markTaskComplete(task)}
                      >
                        Mark Done
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                          onClick={() => markTaskComplete(task)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Yes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => markTaskIncomplete(task)}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          No
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Excuse Label */}
                {excuseLabel && (
                  <div className="mt-2 ml-8 flex items-center gap-1.5 text-xs text-destructive/80">
                    <AlertCircle className="h-3 w-3" />
                    <span>{excuseLabel}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Input */}
      {tasks.length < 3 && (
        <div className="flex gap-2">
          <Input
            placeholder="Add a priority task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="bg-background/50"
          />
          <Button onClick={addTask} disabled={!newTaskText.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gold">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Director's Suggestions</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-gold"
                onClick={getSuggestions}
                disabled={isSuggesting}
                title="Get new suggestions"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSuggesting ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => setSuggestions([])}
                title="Clear suggestions"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-3">
              {suggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-gold/5 border border-gold/20 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-relaxed flex-1">{suggestion.task}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-8 text-xs border-gold/30 hover:bg-gold/10"
                      onClick={() => addSuggestion(suggestion)}
                      disabled={tasks.length >= 3}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.reason}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Excuse Selection Dialog */}
      <Dialog open={excuseDialogOpen} onOpenChange={(open) => !open && cancelExcuseDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gold" />
              Why didn't you complete this?
            </DialogTitle>
            <DialogDescription>
              Be honest with yourself. Select the reason:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {INCOMPLETE_REASONS.map((reason) => (
              <Button
                key={reason.id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-4 px-4 hover:bg-gold/10 hover:border-gold/30"
                onClick={() => handleExcuseSelect(reason.id)}
              >
                <span className="text-sm leading-relaxed">{reason.label}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
