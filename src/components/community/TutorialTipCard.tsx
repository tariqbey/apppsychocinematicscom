import { LightbulbIcon, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TutorialTipCardProps {
  id: string;
  title: string;
  tips: string[];
  icon?: React.ReactNode;
  variant?: "gold" | "purple" | "amber" | "blue" | "green";
  dismissible?: boolean;
}

const variantStyles = {
  gold: "from-gold/10 to-amber-500/5 border-gold/30",
  purple: "from-purple-500/10 to-pink-500/5 border-purple-500/30",
  amber: "from-amber-500/10 to-orange-500/5 border-amber-500/30",
  blue: "from-blue-500/10 to-cyan-500/5 border-blue-500/30",
  green: "from-green-500/10 to-emerald-500/5 border-green-500/30",
};

const iconStyles = {
  gold: "text-gold",
  purple: "text-purple-400",
  amber: "text-amber-500",
  blue: "text-blue-400",
  green: "text-green-400",
};

export const TutorialTipCard = ({
  id,
  title,
  tips,
  icon,
  variant = "gold",
  dismissible = true,
}: TutorialTipCardProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`tip-dismissed-${id}`);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, [id]);

  const handleDismiss = () => {
    localStorage.setItem(`tip-dismissed-${id}`, "true");
    setIsDismissed(true);
  };

  const handleReset = () => {
    localStorage.removeItem(`tip-dismissed-${id}`);
    setIsDismissed(false);
  };

  if (isDismissed && dismissible) {
    return (
      <button
        onClick={handleReset}
        className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
      >
        <LightbulbIcon className="w-3 h-3" />
        Show tips
      </button>
    );
  }

  return (
    <div
      className={`relative p-4 rounded-lg bg-gradient-to-br border ${variantStyles[variant]} animate-fade-in`}
    >
      {dismissible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-60 hover:opacity-100"
          onClick={handleDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${iconStyles[variant]}`}>
          {icon || <LightbulbIcon className="w-5 h-5" />}
        </div>
        <div className="flex-1 pr-6">
          <h4 className="font-semibold text-sm mb-2">{title}</h4>
          <ul className="space-y-1.5">
            {tips.map((tip, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className={`${iconStyles[variant]} font-bold`}>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
