import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";

interface Task {
  id: string;
  task_text: string;
  is_completed: boolean;
  priority: number;
}

interface ReplaceSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  suggestionTask: string;
  onReplace: (taskId: string) => void;
}

export function ReplaceSuggestionDialog({
  open,
  onOpenChange,
  tasks,
  suggestionTask,
  onReplace,
}: ReplaceSuggestionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-gold" />
            Replace a Task
          </DialogTitle>
          <DialogDescription>
            You already have 3 tasks. Select one to replace with:
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-3 rounded-lg bg-gold/10 border border-gold/20 mb-4">
          <p className="text-sm font-medium text-gold">{suggestionTask}</p>
        </div>

        <div className="space-y-2">
          {tasks.map((task, index) => (
            <Button
              key={task.id}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/10 hover:border-primary/30"
              onClick={() => onReplace(task.id)}
            >
              <span className="text-xs font-bold text-primary mr-2">#{index + 1}</span>
              <span className="text-sm line-clamp-1 flex-1">{task.task_text}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
