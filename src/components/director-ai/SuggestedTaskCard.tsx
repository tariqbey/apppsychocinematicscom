import { useState } from "react";
import { Check, X, Plus, Scale, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface SuggestedTaskPayload {
  title: string;
  due_date?: string;
  linked_law?: string;
  why?: string;
}

interface Props {
  task: SuggestedTaskPayload;
  userId?: string;
  messageId: string;
}

function resolveDueDate(due?: string): string {
  const today = new Date();
  if (!due || due === "today") return today.toISOString().split("T")[0];
  if (due === "tomorrow") {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return t.toISOString().split("T")[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) return due;
  return today.toISOString().split("T")[0];
}

export const SuggestedTaskCard = ({ task, userId }: Props) => {
  const [status, setStatus] = useState<"pending" | "added" | "dismissed">("pending");
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!userId) {
      toast.error("You must be signed in to add tasks");
      return;
    }
    setBusy(true);
    try {
      const dueDate = resolveDueDate(task.due_date);
      const { error } = await supabase.from("daily_tasks").insert({
        user_id: userId,
        task_text: task.title,
        task_date: dueDate,
        priority: 1,
        is_completed: false,
      });
      if (error) throw error;
      setStatus("added");
      toast.success("Added to your Actions");
    } catch (err: any) {
      console.error("Add suggested task failed:", err);
      toast.error(err?.message || "Could not add task");
    } finally {
      setBusy(false);
    }
  };

  if (status === "dismissed") {
    return (
      <div className="max-w-[85%] text-xs text-muted-foreground italic px-3 py-1">
        Suggestion dismissed.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "max-w-[85%] w-full rounded-lg border p-3 text-sm space-y-2",
        status === "added"
          ? "border-green-500/30 bg-green-500/5"
          : "border-gold/30 bg-gold/5"
      )}
    >
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 shrink-0 rounded-md bg-gold/15 flex items-center justify-center">
          <Plus className="w-4 h-4 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-gold/80 mb-1">
            Suggested next move · {resolveDueDate(task.due_date)}
          </p>
          <p className="font-medium text-foreground">{task.title}</p>
          {task.why && (
            <p className="text-xs text-muted-foreground mt-1">{task.why}</p>
          )}
          {task.linked_law && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-gold/90 bg-gold/10 rounded-full px-2 py-0.5">
              <Scale className="w-3 h-3" />
              {task.linked_law}
            </div>
          )}
        </div>
      </div>
      {status === "added" ? (
        <div className="flex items-center gap-1 text-xs text-green-500">
          <Check className="w-3 h-3" /> Added to Actions
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="gold"
            className="flex-1"
            onClick={handleAdd}
            disabled={busy}
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
            Add to Actions
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStatus("dismissed")}
            disabled={busy}
          >
            <X className="w-3 h-3 mr-1" />
            Not now
          </Button>
        </div>
      )}
    </div>
  );
};
