import { Clapperboard, Star, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface ProductionStatusProps {
  currentAct: string;
  dayNumber: number;
}

export const ProductionStatus = ({ currentAct, dayNumber }: ProductionStatusProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`glass-card p-4 sm:p-6 cinematic-border relative overflow-hidden group hover:border-gold/50 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ 
        boxShadow: '0 0 30px rgba(212, 175, 55, 0.1), inset 0 0 50px rgba(212, 175, 55, 0.03)',
      }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Floating sparkles */}
      <Sparkles className="absolute top-4 right-16 w-4 h-4 text-gold/30 animate-pulse" />
      <Sparkles className="absolute bottom-3 right-28 w-3 h-3 text-amber-soft/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center gold-glow group-hover:scale-110 transition-transform duration-300">
            <Clapperboard className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-wider">Current Production</p>
            <h2 className="text-lg sm:text-2xl font-display text-gold-gradient">{currentAct}</h2>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <Star className="w-4 h-4 text-gold fill-gold animate-pulse" />
            <span className="text-muted-foreground text-xs sm:text-sm">Day</span>
          </div>
          <p className="text-2xl sm:text-3xl font-display text-foreground group-hover:text-gold transition-colors duration-300">{dayNumber}</p>
        </div>
      </div>
    </div>
  );
};
