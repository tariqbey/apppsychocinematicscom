import { useState, useEffect, useCallback } from 'react';

interface TaskReminder {
  taskId: string;
  reminderLabel: string;
  scheduledAt: number; // timestamp when the reminder will fire
}

const STORAGE_KEY = 'task_reminders';

export function useTaskReminders() {
  const [reminders, setReminders] = useState<Record<string, TaskReminder>>({});

  // Load reminders from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, TaskReminder>;
        // Filter out expired reminders
        const now = Date.now();
        const valid: Record<string, TaskReminder> = {};
        Object.entries(parsed).forEach(([key, reminder]) => {
          if (reminder.scheduledAt > now) {
            valid[key] = reminder;
          }
        });
        setReminders(valid);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      } catch {
        // Invalid data, clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save to localStorage whenever reminders change
  const saveReminders = useCallback((newReminders: Record<string, TaskReminder>) => {
    setReminders(newReminders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newReminders));
  }, []);

  const setReminder = useCallback((taskId: string, label: string, delayMs: number) => {
    const scheduledAt = Date.now() + delayMs;
    const newReminders = {
      ...reminders,
      [taskId]: { taskId, reminderLabel: label, scheduledAt }
    };
    saveReminders(newReminders);
  }, [reminders, saveReminders]);

  const clearReminder = useCallback((taskId: string) => {
    const newReminders = { ...reminders };
    delete newReminders[taskId];
    saveReminders(newReminders);
  }, [reminders, saveReminders]);

  const getReminder = useCallback((taskId: string): TaskReminder | null => {
    const reminder = reminders[taskId];
    if (reminder && reminder.scheduledAt > Date.now()) {
      return reminder;
    }
    return null;
  }, [reminders]);

  const clearAllReminders = useCallback(() => {
    setReminders({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    reminders,
    setReminder,
    clearReminder,
    getReminder,
    clearAllReminders,
  };
}
