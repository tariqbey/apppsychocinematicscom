import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Moon, Check, XCircle, AlertTriangle, Film, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  task_text: string;
  is_completed: boolean;
  incomplete_reason: string | null;
}

const EXCUSE_LABELS: Record<string, string> = {
  procrastinating: "Procrastinating",
  others_movie: "Someone else's movie",
  ran_out_of_time: "Ran out of time",
};

interface EveningReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWatchMindMovie: () => void;
  onOpenScorecard: () => void;
}

export const EveningReviewModal = ({
  open,
  onOpenChange,
  onWatchMindMovie,
  onOpenScorecard,
}: EveningReviewModalProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      loadTodaysTasks();
    }
  }, [open, user]);

  const loadTodaysTasks = async () => {
    if (!user) return;
    setIsLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("daily_tasks")
      .select("id, task_text, is_completed, incomplete_reason")
      .eq("user_id", user.id)
      .eq("task_date", today)
      .order("priority");

    if (!error) {
      setTasks(data || []);
    }
    setIsLoading(false);
  };

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const incompleteWithExcuse = tasks.filter((t) => !t.is_completed && t.incomplete_reason);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500/30 to-purple-500/10"
              style={{ boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)" }}
            >
              <Moon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <span className="text-xl font-display">Evening Session</span>
              <p className="text-sm text-muted-foreground font-normal">
                Review your day & watch your Mind Movie
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Today's Tasks Review */}
          <div className="space-y-2">
            <h4 className="text-sm uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Today's Actions ({completedCount}/{tasks.length})
            </h4>

            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="p-4 rounded-xl bg-secondary/30 text-center text-muted-foreground text-sm">
                No tasks were set for today.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all",
                      task.is_completed
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : task.incomplete_reason
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-secondary/30 border-border/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {task.is_completed ? (
                          <Check className="w-5 h-5 text-emerald-400" />
                        ) : task.incomplete_reason ? (
                          <XCircle className="w-5 h-5 text-red-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            task.is_completed && "line-through text-muted-foreground"
                          )}
                        >
                          {task.task_text}
                        </p>
                        {task.incomplete_reason && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <span className="font-medium">Excuse:</span>{" "}
                            {EXCUSE_LABELS[task.incomplete_reason] || task.incomplete_reason}
                          </p>
                        )}
                        {!task.is_completed && !task.incomplete_reason && (
                          <p className="text-xs text-amber-400 mt-1">Not completed — no reason given</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Excuse Summary */}
            {incompleteWithExcuse.length > 0 && (
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 mt-2">
                <p className="text-xs text-red-300 font-medium">
                  ⚠️ {incompleteWithExcuse.length} task{incompleteWithExcuse.length > 1 ? "s" : ""} incomplete today.
                  Review your patterns in the Actions hub.
                </p>
              </div>
            )}
          </div>

          {/* Evening Actions */}
          <div className="space-y-2 pt-2 border-t border-border/30">
            <h4 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
              Evening Ritual
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onWatchMindMovie();
                }}
                className="gap-2 h-auto py-3 flex-col border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50"
              >
                <Film className="w-5 h-5 text-purple-400" />
                <span className="text-xs">Watch Mind Movie</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onOpenScorecard();
                }}
                className="gap-2 h-auto py-3 flex-col border-gold/30 hover:bg-gold/10 hover:border-gold/50"
              >
                <BarChart3 className="w-5 h-5 text-gold" />
                <span className="text-xs">Director Scorecard</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
