import { Clapperboard, Star } from "lucide-react";

interface ProductionStatusProps {
  currentAct: string;
  dayNumber: number;
}

export const ProductionStatus = ({ currentAct, dayNumber }: ProductionStatusProps) => {
  return (
    <div className="glass-card p-6 cinematic-border animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center gold-glow">
            <Clapperboard className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm uppercase tracking-wider">Current Production</p>
            <h2 className="text-2xl font-display text-gold-gradient">{currentAct}</h2>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <Star className="w-4 h-4 text-gold fill-gold" />
            <span className="text-muted-foreground text-sm">Day</span>
          </div>
          <p className="text-3xl font-display text-foreground">{dayNumber}</p>
        </div>
      </div>
    </div>
  );
};
