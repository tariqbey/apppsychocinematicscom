import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, BookOpen, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays } from "date-fns";

interface SelfAnalysisReminderProps {
  onStartAnalysis: () => void;
}

export function SelfAnalysisReminder({ onStartAnalysis }: SelfAnalysisReminderProps) {
  const { user } = useAuth();
  const [showReminder, setShowReminder] = useState(false);
  const [daysSinceAnalysis, setDaysSinceAnalysis] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkAnalysisDate = async () => {
      const { data } = await supabase
        .from("character_profiles")
        .select("updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.updated_at) {
        const days = differenceInDays(new Date(), new Date(data.updated_at));
        setDaysSinceAnalysis(days);
        // Show reminder if 21+ days since last analysis
        if (days >= 21) {
          setShowReminder(true);
        }
      } else {
        // No analysis ever done - show reminder
        setDaysSinceAnalysis(null);
        setShowReminder(true);
      }
    };

    checkAnalysisDate();
  }, [user]);

  if (!showReminder || dismissed) return null;

  return (
    <Card className="border-gold/50 bg-gradient-to-r from-gold/10 to-accent/10 animate-slide-up">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gold mb-1">
              {daysSinceAnalysis === null 
                ? "Complete Your Character Assessment"
                : `Time for Your 21-Day Check-In`}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {daysSinceAnalysis === null 
                ? "Take the 28-question Metu Neter assessment to discover your Director archetype and identify growth areas."
                : `It's been ${daysSinceAnalysis} days since your last assessment. Track your transformation progress by retaking it.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  setDismissed(true);
                  onStartAnalysis();
                }}
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                {daysSinceAnalysis === null ? "Begin Assessment" : "Retake Assessment"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissed(true)}
              >
                Remind Me Later
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
