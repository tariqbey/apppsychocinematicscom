import { Clapperboard, Star, Sparkles } from "lucide-react";

interface ProductionStatusProps {
  currentAct: string;
  dayNumber: number;
}

export const ProductionStatus = ({ currentAct, dayNumber }: ProductionStatusProps) => {
  return (
    <div className="glass-card p-6 cinematic-border relative overflow-hidden group hover:border-gold/50 transition-all duration-500">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Floating sparkles */}
      <Sparkles className="absolute top-4 right-16 w-4 h-4 text-gold/30 animate-pulse" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center gold-glow group-hover:scale-110 transition-transform duration-300">
            <Clapperboard className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm uppercase tracking-wider">Current Production</p>
            <h2 className="text-2xl font-display text-gold-gradient">{currentAct}</h2>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <Star className="w-4 h-4 text-gold fill-gold animate-pulse" />
            <span className="text-muted-foreground text-sm">Day</span>
          </div>
          <p className="text-3xl font-display text-foreground group-hover:text-gold transition-colors duration-300">{dayNumber}</p>
        </div>
      </div>
    </div>
  );
};
