import { useState } from "react";
import { Clock, Bell, BookOpen, Film, BarChart3, X, Sparkles, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useScheduledReminders } from "@/hooks/useScheduledReminders";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface ReminderSchedulerProps {
  compact?: boolean;
}

interface ReminderRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  time: string | null;
  onTimeChange: (time: string | null) => void;
  disabled?: boolean;
}

function ReminderRow({ icon, label, description, time, onTimeChange, disabled }: ReminderRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(time || '');

  const handleSave = () => {
    onTimeChange(inputValue || null);
    setIsEditing(false);
  };

  const handleClear = () => {
    onTimeChange(null);
    setInputValue('');
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Input
              type="time"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-32 h-8 text-sm"
              disabled={disabled}
            />
            <Button size="sm" variant="default" onClick={handleSave} className="h-8">
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-8">
              Cancel
            </Button>
          </>
        ) : time ? (
          <>
            <span className="text-sm font-medium text-gold">{formatTimeDisplay(time)}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              disabled={disabled}
              className="h-8 text-xs"
            >
              Edit
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClear}
              disabled={disabled}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            disabled={disabled}
            className="h-8 text-xs gap-1"
          >
            <Clock className="h-3 w-3" />
            Set Time
          </Button>
        )}
      </div>
    </div>
  );
}

function formatTimeDisplay(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function ReminderScheduler({ compact = false }: ReminderSchedulerProps) {
  const { settings, isLoading, updateReminderTime, sendMotivationalNow } = useScheduledReminders();
  const { isEnabled, isSupported } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const notificationsDisabled = !isEnabled;

  if (compact) {
    return (
      <div className={cn("space-y-2", notificationsDisabled && "opacity-50")}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Clock className="h-4 w-4" />
          <span>Daily Reminders</span>
          {notificationsDisabled && (
            <span className="text-xs text-amber-500">(Enable notifications first)</span>
          )}
        </div>
        <ReminderRow
          icon={<BookOpen className="h-4 w-4" />}
          label="Journal"
          description="Daily journaling reminder"
          time={settings.journalReminderTime}
          onTimeChange={(t) => updateReminderTime('journal', t)}
          disabled={notificationsDisabled || isLoading}
        />
        <ReminderRow
          icon={<Film className="h-4 w-4" />}
          label="Morning Ritual"
          description="Mind Movie screening"
          time={settings.morningRitualReminderTime}
          onTimeChange={(t) => updateReminderTime('ritual', t)}
          disabled={notificationsDisabled || isLoading}
        />
        <ReminderRow
          icon={<BarChart3 className="h-4 w-4" />}
          label="Evening Scorecard"
          description="Daily review & scoring"
          time={settings.eveningScorecardReminderTime}
          onTimeChange={(t) => updateReminderTime('scorecard', t)}
          disabled={notificationsDisabled || isLoading}
        />
      </div>
    );
  }

  return (
    <Card className={cn("p-6", notificationsDisabled && "opacity-60")}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-medium">Scheduled Reminders</h3>
          <p className="text-sm text-muted-foreground">
            {notificationsDisabled 
              ? "Enable push notifications to set reminders"
              : "Set daily reminders for your rituals"}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <ReminderRow
          icon={<Film className="h-4 w-4" />}
          label="Morning Mind Movie"
          description="Start your day with your vision"
          time={settings.morningRitualReminderTime}
          onTimeChange={(t) => updateReminderTime('ritual', t)}
          disabled={notificationsDisabled || isLoading}
        />
        <ReminderRow
          icon={<BookOpen className="h-4 w-4" />}
          label="Daily Journaling"
          description="Capture your experiences"
          time={settings.journalReminderTime}
          onTimeChange={(t) => updateReminderTime('journal', t)}
          disabled={notificationsDisabled || isLoading}
        />
        <ReminderRow
          icon={<BarChart3 className="h-4 w-4" />}
          label="Evening Scorecard"
          description="Rate your character performance"
          time={settings.eveningScorecardReminderTime}
          onTimeChange={(t) => updateReminderTime('scorecard', t)}
          disabled={notificationsDisabled || isLoading}
        />
      </div>

      {/* Motivational Reminders Section */}
      {!notificationsDisabled && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium">Motivational Reminders</p>
                <p className="text-xs text-muted-foreground">
                  Auto-sends every 2-3 hours (8am-9pm)
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={sendMotivationalNow}
              className="h-8 text-xs gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Test Now
            </Button>
          </div>
          
          <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Sample Messages:</p>
            <ul className="space-y-1">
              <li>• "Don't get caught up in someone else's movie—unless you're getting paid."</li>
              <li>• "Take 3 minutes to watch your Mind Movie and realign."</li>
              <li>• "Put on your soundtrack and get back into character."</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}
