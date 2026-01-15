import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "./usePushNotifications";

interface ReminderSettings {
  journalReminderTime: string | null;
  morningRitualReminderTime: string | null;
  eveningScorecardReminderTime: string | null;
}

export function useScheduledReminders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isEnabled, showNotification } = usePushNotifications();
  
  const [settings, setSettings] = useState<ReminderSettings>({
    journalReminderTime: null,
    morningRitualReminderTime: null,
    eveningScorecardReminderTime: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Keep track of scheduled timeouts
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Load settings from database
  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('journal_reminder_time, morning_ritual_reminder_time, evening_scorecard_reminder_time')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setSettings({
          journalReminderTime: data.journal_reminder_time,
          morningRitualReminderTime: data.morning_ritual_reminder_time,
          eveningScorecardReminderTime: data.evening_scorecard_reminder_time,
        });
      }
    } catch (error) {
      console.error("Error loading reminder settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Calculate milliseconds until a given time today/tomorrow
  const getMillisecondsUntilTime = useCallback((timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    return target.getTime() - now.getTime();
  }, []);

  // Schedule a notification for a specific time
  const scheduleNotificationForTime = useCallback((
    type: 'journal' | 'ritual' | 'scorecard',
    timeStr: string
  ) => {
    // Clear any existing timeout for this type
    if (timeoutRefs.current[type]) {
      clearTimeout(timeoutRefs.current[type]);
    }

    if (!isEnabled || !timeStr) return;

    const messages = {
      journal: {
        title: "📓 Time to Journal",
        body: "Take a moment to record your thoughts and experiences, Director.",
      },
      ritual: {
        title: "🎬 Morning Ritual",
        body: "Start your day with your Mind Movie screening.",
      },
      scorecard: {
        title: "📊 Evening Check-in",
        body: "Complete your Daily Director Scorecard before bed.",
      },
    };

    const msUntilTime = getMillisecondsUntilTime(timeStr);
    const message = messages[type];
    
    timeoutRefs.current[type] = setTimeout(() => {
      showNotification(message.title, { body: message.body });
      // Reschedule for the next day
      scheduleNotificationForTime(type, timeStr);
    }, msUntilTime);
  }, [isEnabled, showNotification, getMillisecondsUntilTime]);

  // Schedule all reminders based on current settings
  const scheduleAllReminders = useCallback(() => {
    if (settings.journalReminderTime) {
      scheduleNotificationForTime('journal', settings.journalReminderTime);
    }
    if (settings.morningRitualReminderTime) {
      scheduleNotificationForTime('ritual', settings.morningRitualReminderTime);
    }
    if (settings.eveningScorecardReminderTime) {
      scheduleNotificationForTime('scorecard', settings.eveningScorecardReminderTime);
    }
  }, [settings, scheduleNotificationForTime]);

  // Auto-schedule when settings change
  useEffect(() => {
    if (isEnabled) {
      scheduleAllReminders();
    }
    
    // Cleanup on unmount
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, [isEnabled, scheduleAllReminders]);

  // Update a reminder time
  const updateReminderTime = useCallback(async (
    type: 'journal' | 'ritual' | 'scorecard',
    time: string | null
  ) => {
    if (!user) return false;

    const columnMap = {
      journal: 'journal_reminder_time',
      ritual: 'morning_ritual_reminder_time',
      scorecard: 'evening_scorecard_reminder_time',
    };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          [columnMap[type]]: time,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setSettings(prev => ({
        ...prev,
        [type === 'journal' ? 'journalReminderTime' : 
         type === 'ritual' ? 'morningRitualReminderTime' : 
         'eveningScorecardReminderTime']: time,
      }));

      // Reschedule or clear the notification
      if (time) {
        scheduleNotificationForTime(type, time);
        toast({
          title: "Reminder Set",
          description: `You'll be reminded at ${formatTime(time)} daily.`,
        });
      } else {
        if (timeoutRefs.current[type]) {
          clearTimeout(timeoutRefs.current[type]);
          delete timeoutRefs.current[type];
        }
        toast({
          title: "Reminder Cleared",
          description: "Daily reminder has been disabled.",
        });
      }

      return true;
    } catch (error) {
      console.error("Error updating reminder time:", error);
      toast({
        title: "Error",
        description: "Failed to update reminder settings.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, scheduleNotificationForTime]);

  return {
    settings,
    isLoading,
    updateReminderTime,
    scheduleAllReminders,
  };
}

// Helper to format time for display
function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
