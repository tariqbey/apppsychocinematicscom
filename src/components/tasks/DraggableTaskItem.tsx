import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Check, XCircle, GripVertical, AlertCircle } from "lucide-react";
import { TaskReminderButton } from "./TaskReminderButton";

interface Task {
  id: string;
  task_text: string;
  is_completed: boolean;
  priority: number;
  task_date: string;
  incomplete_reason?: string | null;
}

interface DraggableTaskItemProps {
  task: Task;
  index: number;
  excuseLabel: string | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onTouchStart: (index: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onMarkComplete: (task: Task) => void;
  onMarkIncomplete: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

export function DraggableTaskItem({
  task,
  index,
  excuseLabel,
  onDragStart,
  onDragOver,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onMarkComplete,
  onMarkIncomplete,
  onDelete,
  isDragging,
  dragOverIndex,
}: DraggableTaskItemProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onTouchStart={() => {
        setIsPressed(true);
        onTouchStart(index);
      }}
      onTouchMove={onTouchMove}
      onTouchEnd={() => {
        setIsPressed(false);
        onTouchEnd();
      }}
      className={`p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
        task.is_completed
          ? "bg-primary/10 border-primary/30"
          : task.incomplete_reason
          ? "bg-destructive/10 border-destructive/30"
          : "bg-muted/50 border-border/50"
      } ${isDragging ? "opacity-50 scale-95" : ""} ${
        dragOverIndex === index ? "border-gold border-2" : ""
      } ${isPressed ? "scale-[0.98]" : ""}`}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <div className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </div>

        <span className="text-xs font-bold text-primary w-5">#{index + 1}</span>
        <span
          className={`flex-1 ${
            task.is_completed
              ? "text-primary"
              : task.incomplete_reason
              ? "text-muted-foreground"
              : ""
          }`}
        >
          {task.task_text}
        </span>

        {/* Reminder Button - only show for incomplete tasks - PROMINENT VERSION */}
        {!task.is_completed && !task.incomplete_reason && (
          <TaskReminderButton taskId={task.id} taskText={task.task_text} prominent />
        )}

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
              onClick={() => onMarkComplete(task)}
            >
              Mark Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => onMarkComplete(task)}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onMarkIncomplete(task)}
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
          onClick={() => onDelete(task.id)}
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
}
