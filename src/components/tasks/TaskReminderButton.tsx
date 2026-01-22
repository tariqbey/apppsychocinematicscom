import { useState, useEffect } from "react";
import { Bell, BellRing, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTaskReminders } from "@/hooks/useTaskReminders";
import { toast } from "sonner";

interface TaskReminderButtonProps {
  taskId: string;
  taskText: string;
  onSchedule?: (minutes: number) => void;
  prominent?: boolean;
}

const REMINDER_OPTIONS = [
  { label: "In 30 minutes", minutes: 30 },
  { label: "In 1 hour", minutes: 60 },
  { label: "In 2 hours", minutes: 120 },
  { label: "In 4 hours", minutes: 240 },
  { label: "This evening (6 PM)", minutes: -1, time: "18:00" },
];

export function TaskReminderButton({ taskId, taskText, onSchedule, prominent = false }: TaskReminderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isSubscribed, showNotification, requestPermission } = usePushNotifications();
  const { getReminder, setReminder: saveReminder, clearReminder } = useTaskReminders();
  
  // Get persisted reminder for this task
  const existingReminder = getReminder(taskId);
  const scheduledReminder = existingReminder?.reminderLabel || null;

  // Set up the actual notification timer based on persisted reminder
  useEffect(() => {
    if (existingReminder && existingReminder.scheduledAt > Date.now()) {
      const delay = existingReminder.scheduledAt - Date.now();
      const timeoutId = setTimeout(() => {
        showNotification("🎬 Stick to the Script!", {
          body: `Time to complete: ${taskText}`,
          tag: `task-reminder-${taskId}`,
        });
        clearReminder(taskId);
      }, delay);
      
      return () => clearTimeout(timeoutId);
    }
  }, [existingReminder, taskId, taskText, showNotification, clearReminder]);

  const handleScheduleReminder = async (option: typeof REMINDER_OPTIONS[0]) => {
    // If not subscribed, request permission first
    if (!isSubscribed) {
      const granted = await requestPermission();
      if (!granted) {
        toast.error("Please enable notifications to set reminders");
        return;
      }
    }

    let delayMs: number;
    
    if (option.minutes === -1 && option.time) {
      // Calculate time until specific time
      const [hours, mins] = option.time.split(":").map(Number);
      const target = new Date();
      target.setHours(hours, mins, 0, 0);
      
      // If target time has passed today, schedule for tomorrow
      if (target.getTime() <= Date.now()) {
        target.setDate(target.getDate() + 1);
      }
      
      delayMs = target.getTime() - Date.now();
    } else {
      delayMs = option.minutes * 60 * 1000;
    }

    // Save reminder to localStorage for persistence
    saveReminder(taskId, option.label, delayMs);
    setIsOpen(false);
    
    toast.success(`Reminder set: ${option.label}`, {
      description: `I'll remind you about "${taskText}"`,
    });
    
    onSchedule?.(option.minutes);
  };

  // Don't hide - always show and prompt to enable if needed
  if (prominent) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={scheduledReminder ? "default" : "outline"}
            size="sm"
            className={`h-7 px-2 text-xs gap-1.5 shrink-0 ${
              scheduledReminder 
                ? 'bg-gold text-primary-foreground hover:bg-gold/90' 
                : 'border-gold/50 text-gold hover:bg-gold/10'
            }`}
          >
            {scheduledReminder ? (
              <>
                <BellRing className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reminder Set</span>
              </>
            ) : (
              <>
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Remind Me</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Bell className="h-4 w-4 text-gold" />
              <p className="text-sm font-medium">Set a Reminder</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Get notified to "Stick to the Script" and complete this action:
            </p>
            <div className="space-y-1 pt-1">
              {REMINDER_OPTIONS.map((option) => (
                <Button
                  key={option.label}
                  variant={scheduledReminder === option.label ? "default" : "ghost"}
                  size="sm"
                  className={`w-full justify-start gap-2 text-sm ${
                    scheduledReminder === option.label 
                      ? 'bg-gold text-primary-foreground' 
                      : ''
                  }`}
                  onClick={() => handleScheduleReminder(option)}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {option.label}
                  {scheduledReminder === option.label && (
                    <Check className="h-3.5 w-3.5 ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Compact icon version
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${scheduledReminder ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}
          title={scheduledReminder ? `Reminder: ${scheduledReminder}` : "Set reminder"}
        >
          {scheduledReminder ? (
            <BellRing className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-2 py-1 font-medium">
            Remind me to complete this:
          </p>
          {REMINDER_OPTIONS.map((option) => (
            <Button
              key={option.label}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleScheduleReminder(option)}
            >
              <Clock className="h-3.5 w-3.5" />
              {option.label}
              {scheduledReminder === option.label && (
                <Check className="h-3.5 w-3.5 ml-auto text-gold" />
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
