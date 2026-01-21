import { useState } from "react";
import { Bell, BellOff, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

interface TaskReminderButtonProps {
  taskText: string;
  onSchedule?: (minutes: number) => void;
}

const REMINDER_OPTIONS = [
  { label: "In 30 minutes", minutes: 30 },
  { label: "In 1 hour", minutes: 60 },
  { label: "In 2 hours", minutes: 120 },
  { label: "In 4 hours", minutes: 240 },
  { label: "This evening (6 PM)", minutes: -1, time: "18:00" },
];

export function TaskReminderButton({ taskText, onSchedule }: TaskReminderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scheduledReminder, setScheduledReminder] = useState<string | null>(null);
  const { isSubscribed, isSupported, showNotification, requestPermission } = usePushNotifications();

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

    // Schedule local notification
    setTimeout(() => {
      showNotification("🎬 Stick to the Script!", {
        body: `Time to complete: ${taskText}`,
        tag: `task-reminder-${Date.now()}`,
      });
    }, delayMs);

    setScheduledReminder(option.label);
    setIsOpen(false);
    
    toast.success(`Reminder set: ${option.label}`, {
      description: `I'll remind you about "${taskText}"`,
    });
    
    onSchedule?.(option.minutes);
  };

  if (!isSupported) {
    return null;
  }

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
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
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
