import { Scroll, Calendar, ArrowRight, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useState, useEffect } from "react";

interface ChiefAimData {
  what: string;
  byWhen: string;
  exchange: string;
  plan: string;
}

interface DefiniteChiefAimCardProps {
  aim: ChiefAimData;
  onEdit?: () => void;
}

// Floating particle component
const FloatingParticle = ({ delay, size = 2, color = "gold" }: { delay: number; size?: number; color?: string }) => (
  <div
    className={`absolute rounded-full bg-${color}/30 pointer-events-none`}
    style={{
      width: size,
      height: size,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `float-particle 4s ease-in-out infinite ${delay}s`,
    }}
  />
);

export const DefiniteChiefAimCard = ({ aim, onEdit }: DefiniteChiefAimCardProps) => {
  const hasAim = aim.what && aim.byWhen && aim.exchange && aim.plan;
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`glass-card p-4 sm:p-6 cinematic-border relative overflow-hidden group transition-all duration-500 hover:border-gold/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ 
        boxShadow: isHovered 
          ? '0 0 40px rgba(212, 175, 55, 0.2), inset 0 0 60px rgba(212, 175, 55, 0.05)'
          : '0 0 25px rgba(212, 175, 55, 0.1), inset 0 0 40px rgba(212, 175, 55, 0.03)',
        transition: 'all 0.5s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Holographic scan lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div 
          className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(212,175,55,0.03)_50%)] bg-[length:100%_4px]"
          style={{
            animation: 'scan-line 8s linear infinite',
          }}
        />
      </div>

      {/* Animated border glow */}
      <div 
        className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)',
          animation: 'holographic-shimmer 3s ease-in-out infinite',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <FloatingParticle delay={0} size={3} />
        <FloatingParticle delay={1} size={2} />
        <FloatingParticle delay={2} size={4} />
        <FloatingParticle delay={0.5} size={2} />
        <FloatingParticle delay={1.5} size={3} />
      </div>

      {/* Animated decorative corner gradient */}
      <div 
        className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-gold/15 to-transparent rounded-bl-full transition-all duration-500 group-hover:from-gold/25"
        style={{
          animation: 'pulse-ring 4s ease-in-out infinite',
        }}
      />
      
      {/* Sparkle particles */}
      <Sparkles 
        className="absolute top-4 right-16 w-3 h-3 text-gold/40 animate-pulse pointer-events-none" 
        style={{ animationDelay: '0s' }}
      />
      <Sparkles 
        className="absolute top-8 right-8 w-2 h-2 text-amber-soft/30 animate-pulse pointer-events-none" 
        style={{ animationDelay: '0.5s' }}
      />
      <Sparkles 
        className="absolute bottom-6 right-20 w-2 h-2 text-gold/30 animate-pulse pointer-events-none" 
        style={{ animationDelay: '1s' }}
      />
      
      <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              boxShadow: isHovered ? '0 0 20px rgba(212, 175, 55, 0.4)' : '0 0 10px rgba(212, 175, 55, 0.2)',
            }}
          >
            <Scroll className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-display tracking-wide">The Script</h3>
              <InfoTooltip content="Your Definite Chief Aim is the blueprint for your transformation. Read it aloud every morning and night. It has 4 parts: What you want, By when, What you'll give in exchange, and Your plan." />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Your Definite Chief Aim</p>
          </div>
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="gap-2 text-muted-foreground hover:text-gold hover:bg-gold/10 text-xs sm:text-sm transition-all duration-300"
          >
            <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{hasAim ? "Edit" : "Create with AI"}</span>
          </Button>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4 relative z-10">
        {hasAim ? (
          <>
            <div className="p-3 sm:p-4 rounded-lg bg-secondary/50 border-l-2 border-gold transition-all duration-300 hover:bg-secondary/70 hover:border-l-4">
              <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-1">What I Want</p>
              <p className="text-sm sm:text-base text-foreground font-medium">{aim.what}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 sm:p-4 rounded-lg bg-secondary/30 transition-all duration-300 hover:bg-secondary/50">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gold" />
                  <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">By When</p>
                </div>
                <p className="text-sm sm:text-base text-foreground font-medium">{aim.byWhen}</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-lg bg-secondary/30 transition-all duration-300 hover:bg-secondary/50">
              <div className="flex items-center gap-2 mb-1">
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-amber-soft" />
                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">The Exchange</p>
              </div>
              <p className="text-xs sm:text-sm text-foreground/80">{aim.exchange}</p>
            </div>

            <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 transition-all duration-300 hover:border-gold/40 hover:from-gold/15">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-gold" />
                <p className="text-xs sm:text-sm text-gold uppercase tracking-wider">The Plan</p>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90">{aim.plan}</p>
            </div>
          </>
        ) : (
          <div className="p-4 sm:p-6 rounded-lg bg-secondary/30 border border-dashed border-gold/30 text-center transition-all duration-300 hover:border-gold/50 hover:bg-secondary/40">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-gold/50 mx-auto mb-3 animate-pulse" />
            <p className="text-sm text-muted-foreground mb-2">Your Definite Chief Aim is not set yet.</p>
            <p className="text-xs text-muted-foreground/70">Click "Create with AI" to define your vision and goals.</p>
          </div>
        )}
      </div>
    </div>
  );
};
