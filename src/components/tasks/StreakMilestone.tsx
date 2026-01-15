import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Flame, Crown, Sparkles, Zap } from "lucide-react";

interface StreakMilestoneProps {
  streak: number;
  onClose: () => void;
}

const MILESTONES = [
  { days: 7, title: "Week Warrior", icon: Flame, color: "from-orange-500 to-red-500", message: "You've completed 7 consecutive days! Your consistency is building real momentum." },
  { days: 14, title: "Fortnight Champion", icon: Star, color: "from-yellow-400 to-amber-500", message: "Two weeks strong! You're developing unstoppable habits." },
  { days: 21, title: "Habit Master", icon: Zap, color: "from-blue-400 to-indigo-500", message: "21 days—the science says this is when habits truly form. You're transformed!" },
  { days: 30, title: "Monthly Legend", icon: Crown, color: "from-purple-500 to-pink-500", message: "A full month of execution! You're operating at Director Elite level." },
  { days: 60, title: "Double Diamond", icon: Trophy, color: "from-cyan-400 to-teal-500", message: "60 days of relentless action. You're rewriting your entire story!" },
  { days: 90, title: "Quarter Champion", icon: Crown, color: "from-gold to-amber-600", message: "90 days—a full quarter of transformation. You ARE the Director of your life!" },
  { days: 180, title: "Half Year Hero", icon: Trophy, color: "from-emerald-400 to-green-500", message: "Six months of daily execution. Your discipline is legendary!" },
  { days: 365, title: "Annual Oscar", icon: Crown, color: "from-gold via-yellow-300 to-gold", message: "ONE FULL YEAR! You've achieved what 99% never will. Standing ovation!" },
];

export function StreakMilestone({ streak, onClose }: StreakMilestoneProps) {
  const milestone = MILESTONES.find(m => m.days === streak);
  
  if (!milestone) return null;

  const IconComponent = milestone.icon;

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden border-gold/50 bg-gradient-to-b from-background to-background/95">
        {/* Animated background sparkles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <Sparkles
              key={i}
              className="absolute text-gold/30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                width: `${Math.random() * 20 + 10}px`,
                height: `${Math.random() * 20 + 10}px`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center py-6 space-y-6">
          {/* Trophy Icon with glow */}
          <div className="relative mx-auto w-24 h-24">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${milestone.color} blur-xl opacity-50 animate-pulse`} />
            <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${milestone.color} flex items-center justify-center shadow-2xl`}>
              <IconComponent className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Celebration Text */}
          <div className="space-y-2">
            <h2 className="text-3xl font-display tracking-wide text-gold-gradient">
              🎬 MILESTONE UNLOCKED! 🎬
            </h2>
            <h3 className={`text-2xl font-bold bg-gradient-to-r ${milestone.color} bg-clip-text text-transparent`}>
              {milestone.title}
            </h3>
          </div>

          {/* Streak Count */}
          <div className="flex items-center justify-center gap-2">
            <Flame className="h-8 w-8 text-orange-500 animate-pulse" />
            <span className="text-5xl font-bold text-gold">{streak}</span>
            <span className="text-xl text-muted-foreground">days</span>
          </div>

          {/* Message */}
          <p className="text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {milestone.message}
          </p>

          {/* CTA Button */}
          <Button
            variant="gold"
            size="lg"
            onClick={onClose}
            className="min-w-[200px]"
          >
            Keep The Streak Alive! 🔥
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useStreakMilestone(streak: number) {
  const [showMilestone, setShowMilestone] = useState(false);
  const [lastCelebratedStreak, setLastCelebratedStreak] = useState<number | null>(null);

  useEffect(() => {
    // Check if this streak is a milestone and hasn't been celebrated
    const milestoneMatch = MILESTONES.find(m => m.days === streak);
    const storedCelebrated = localStorage.getItem('lastCelebratedStreak');
    const lastCelebrated = storedCelebrated ? parseInt(storedCelebrated, 10) : 0;

    if (milestoneMatch && streak > lastCelebrated) {
      setShowMilestone(true);
      localStorage.setItem('lastCelebratedStreak', streak.toString());
      setLastCelebratedStreak(streak);
    }
  }, [streak]);

  const closeMilestone = () => {
    setShowMilestone(false);
  };

  return { showMilestone, closeMilestone, streak };
}
