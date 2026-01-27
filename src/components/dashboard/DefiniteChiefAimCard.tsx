import { Scroll, Calendar, ArrowRight, Sparkles, Pencil, Zap, Music, Play, Pause, Volume2, Wand2 } from "lucide-react";
import { SimpleWaveformBars } from "@/components/music/AudioVisualizer";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useAudio } from "@/contexts/AudioContext";

interface ChiefAimData {
  what: string;
  byWhen: string;
  exchange: string;
  plan: string;
}

interface DefiniteChiefAimCardProps {
  aim: ChiefAimData;
  onEdit?: () => void;
  onAdjust?: () => void;
  chiefAimSongUrl?: string | null;
  onSongListened?: () => void;
}

// Floating particle component with memoized position
const FloatingParticle = ({ index, size = 2, color = "#D4AF37" }: { index: number; size?: number; color?: string }) => {
  // Use index-based positioning to prevent re-render jank
  const position = useMemo(() => ({
    left: `${(index * 23 + 10) % 100}%`,
    bottom: '0%',
  }), [index]);

  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: position.left,
        bottom: position.bottom,
        background: color,
        boxShadow: `0 0 6px ${color}`,
        animation: `float-particle 3s ease-in-out infinite ${index * 0.5}s`,
      }}
    />
  );
};

export const DefiniteChiefAimCard = ({ aim, onEdit, onAdjust, chiefAimSongUrl, onSongListened }: DefiniteChiefAimCardProps) => {
  const hasAim = aim.what && aim.byWhen && aim.exchange && aim.plan;
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [hasListenedToday, setHasListenedToday] = useState(false);
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Use global audio context
  const { 
    isPlaying: globalIsPlaying, 
    currentSrc,
    audioOwner,
    playAudio, 
    pauseAudio,
    stopAudio
  } = useAudio();

  // Check if this card "owns" the current playback
  const isPlaying = globalIsPlaying && audioOwner === 'chief-aim-anthem';

  const isActive = isHovered || isTouched || (isMobile && isVisible);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const togglePlayback = async () => {
    if (!chiefAimSongUrl) return;
    
    if (isPlaying) {
      // Pausing counts as interruption for ritual completion
      pauseAudio();
      if (!hasListenedToday) {
        setWasInterrupted(true);
      }
    } else {
      // If interrupted previously and ritual not complete, restart from beginning
      if (wasInterrupted && !hasListenedToday) {
        stopAudio(); // Reset first
        setWasInterrupted(false);
      }
      await playAudio(chiefAimSongUrl, {
        title: 'Chief Aim Anthem',
        artist: 'Your Transformation',
        owner: 'chief-aim-anthem',
      });
    }
  };

  // Track when song ends to mark ritual complete
  useEffect(() => {
    // When audio stops playing and was owned by this component
    if (!globalIsPlaying && audioOwner === 'chief-aim-anthem' && currentSrc === chiefAimSongUrl) {
      // Song finished - mark as listened if it wasn't interrupted
      if (!hasListenedToday && !wasInterrupted) {
        setHasListenedToday(true);
        onSongListened?.();
      }
      setWasInterrupted(false);
    }
  }, [globalIsPlaying, audioOwner, currentSrc, chiefAimSongUrl, hasListenedToday, wasInterrupted, onSongListened]);

  const handleCreateSong = () => {
    // Build context for the Soundtrack page
    const chiefAimContext = [
      `## MY DEFINITE CHIEF AIM`,
      "",
      `**THE DREAM:** ${aim.what}`,
      "",
      `**THE DEADLINE:** ${aim.byWhen}`,
      "",
      `**THE EXCHANGE (What I Give):** ${aim.exchange}`,
      "",
      `**THE PLAN:** ${aim.plan}`,
    ].join("\n");
    
    sessionStorage.setItem("chief-aim-lyrics-context", chiefAimContext);
    navigate("/soundtrack?fromChiefAim=true");
  };

  const glowColor = "rgba(212, 175, 55, 0.4)";
  const particleColor = "#D4AF37";

  return (
    <div 
      className={`glass-card p-4 sm:p-6 cinematic-border relative overflow-hidden group transition-all duration-500 hover:border-gold/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ 
        boxShadow: isActive 
          ? `0 0 50px ${glowColor}, inset 0 0 60px rgba(212, 175, 55, 0.05)`
          : '0 0 25px rgba(212, 175, 55, 0.1), inset 0 0 40px rgba(212, 175, 55, 0.03)',
        transition: 'all 0.5s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setTimeout(() => setIsTouched(false), 200)}
    >
      {/* Animated corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0"
        )} />
      </div>
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0"
        )} />
      </div>
      <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0"
        )} />
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0"
        )} />
      </div>

      {/* Scanning line animation */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-300 pointer-events-none overflow-hidden",
        isActive ? "opacity-100" : "opacity-0"
      )}>
        <div 
          className="absolute h-[1px] w-full bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0"
          style={{
            animation: isActive ? 'scan-line 2.5s ease-in-out infinite' : 'none',
          }}
        />
      </div>

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
        className={cn(
          "absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)',
          animation: isActive ? 'holographic-shimmer 3s ease-in-out infinite' : 'none',
        }}
      />

      {/* Floating particles - use index instead of delay */}
      <div className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-500",
        isActive ? "opacity-100" : "opacity-40"
      )}>
        <FloatingParticle index={0} size={3} />
        <FloatingParticle index={1} size={2} />
        <FloatingParticle index={2} size={4} />
        <FloatingParticle index={3} size={2} />
        <FloatingParticle index={4} size={3} />
      </div>

      {/* Holographic shimmer overlay */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-700 pointer-events-none",
          isActive ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `linear-gradient(
            105deg,
            transparent 40%,
            rgba(255,255,255,0.03) 45%,
            rgba(255,255,255,0.05) 50%,
            rgba(255,255,255,0.03) 55%,
            transparent 60%
          )`,
          backgroundSize: '200% 100%',
          animation: isActive ? 'holographic-shimmer 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Animated decorative corner gradient */}
      <div 
        className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-gold/15 to-transparent rounded-bl-full transition-all duration-500 group-hover:from-gold/25"
        style={{
          animation: 'pulse-ring 4s ease-in-out infinite',
        }}
      />
      
      {/* Sparkle particles */}
      <Sparkles 
        className={cn(
          "absolute top-4 right-16 w-4 h-4 text-gold/50 pointer-events-none transition-all duration-500",
          isActive && "rotate-12 scale-125"
        )}
        style={{ 
          animationDelay: '0s',
          filter: isActive ? `drop-shadow(0 0 4px ${particleColor})` : 'none',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />
      <Sparkles 
        className="absolute top-8 right-8 w-3 h-3 text-amber-soft/40 animate-pulse pointer-events-none" 
        style={{ animationDelay: '0.5s' }}
      />
      <Sparkles 
        className="absolute bottom-6 right-20 w-2 h-2 text-gold/30 animate-pulse pointer-events-none" 
        style={{ animationDelay: '1s' }}
      />
      <Zap 
        className={cn(
          "absolute top-6 right-24 w-3 h-3 text-gold animate-pulse pointer-events-none transition-opacity duration-300",
          isActive ? "opacity-100" : "opacity-0"
        )} 
      />
      
      <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-500 relative overflow-hidden",
              "bg-gradient-to-br from-gold/30 to-gold/10"
            )}
            style={{
              boxShadow: isActive 
                ? `0 0 30px ${glowColor}, inset 0 0 20px ${glowColor}` 
                : '0 0 15px rgba(212, 175, 55, 0.2)',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {/* Pulsing ring */}
            <div 
              className={cn(
                "absolute inset-0 rounded-xl transition-opacity",
                isActive ? "opacity-100" : "opacity-0"
              )}
              style={{
                border: `1px solid ${particleColor}`,
                animation: isActive ? 'pulse-ring 1.5s ease-out infinite' : 'none',
              }}
            />
            
            {/* Inner glow */}
            <div 
              className="absolute inset-0 rounded-xl"
              style={{
                background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
                opacity: isActive ? 0.6 : 0.3,
                transition: 'opacity 0.5s',
              }}
            />

            {/* Rotating border */}
            <div 
              className={cn(
                "absolute inset-[-2px] rounded-xl transition-opacity pointer-events-none",
                isActive ? "opacity-100" : "opacity-0"
              )}
              style={{
                background: `conic-gradient(from 0deg, transparent, ${particleColor}, transparent)`,
                animation: isActive ? 'rotate-border 3s linear infinite' : 'none',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'xor',
                WebkitMaskComposite: 'xor',
                padding: '2px',
              }}
            />

            <Scroll className="w-5 h-5 sm:w-6 sm:h-6 text-gold relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-display tracking-wide">The Script</h3>
              <Sparkles 
                className={cn(
                  "w-4 h-4 text-gold transition-all duration-500",
                  isActive && "rotate-12 scale-125"
                )}
                style={{
                  filter: isActive ? `drop-shadow(0 0 4px ${particleColor})` : 'none',
                }}
              />
              <Zap 
                className={cn(
                  "w-3 h-3 text-gold animate-pulse transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-0"
                )} 
              />
              <InfoTooltip content="Your Definite Chief Aim is the blueprint for your transformation. Read it aloud every morning and night. It has 4 parts: What you want, By when, What you'll give in exchange, and Your plan." />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">Your Definite Chief Aim</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasAim && onAdjust && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdjust}
              className="gap-2 text-muted-foreground hover:text-gold hover:bg-gold/10 text-xs sm:text-sm transition-all duration-300"
            >
              <Wand2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Adjust with AI</span>
            </Button>
          )}
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
      </div>

      <div className="space-y-3 sm:space-y-4 relative z-10">
        {hasAim ? (
          <>
            <div className="p-4 sm:p-5 rounded-xl bg-secondary/50 border-l-4 border-gold transition-all duration-300 hover:bg-secondary/70 hover:border-l-[6px]"
              style={{
                boxShadow: isActive ? '0 0 15px rgba(212, 175, 55, 0.15)' : 'none',
              }}
            >
              <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-1.5 font-medium">What I Want</p>
              <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed">{aim.what}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 p-4 sm:p-5 rounded-xl bg-secondary/30 transition-all duration-300 hover:bg-secondary/50"
                style={{
                  boxShadow: isActive ? '0 0 15px rgba(34, 211, 238, 0.1)' : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-medium">By When</p>
                </div>
                <p className="text-base sm:text-lg text-foreground font-medium">{aim.byWhen}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-secondary/30 transition-all duration-300 hover:bg-secondary/50"
              style={{
                boxShadow: isActive ? '0 0 15px rgba(245, 158, 11, 0.1)' : 'none',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-soft" />
                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-medium">The Exchange</p>
              </div>
              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">{aim.exchange}</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gold/10 to-transparent border-2 border-gold/20 transition-all duration-300 hover:border-gold/40 hover:from-gold/15"
              style={{
                boxShadow: isActive ? '0 0 20px rgba(212, 175, 55, 0.2)' : 'none',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                <p className="text-xs sm:text-sm text-gold uppercase tracking-wider font-medium">The Plan</p>
              </div>
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">{aim.plan}</p>
            </div>

            {/* Chief Aim Song Section */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-gold/5 border border-purple-500/20 transition-all duration-300 hover:border-purple-500/40">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    <div>
                      <p className="text-xs sm:text-sm text-purple-300 uppercase tracking-wider font-medium">Chief Aim Anthem</p>
                      <p className="text-xs text-muted-foreground">
                        {chiefAimSongUrl 
                          ? (hasListenedToday 
                              ? "✓ Listened today" 
                              : wasInterrupted 
                                ? "Restart — must play uninterrupted" 
                                : "Listen all the way through") 
                          : "Turn your aim into a motivational song"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {chiefAimSongUrl ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={togglePlayback}
                          className={cn(
                            "gap-2 transition-all",
                            isPlaying 
                              ? "text-purple-400 bg-purple-500/20" 
                              : "text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10"
                          )}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-4 h-4" />
                              <span className="hidden sm:inline">Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              <span className="hidden sm:inline">Play</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCreateSong}
                          className="gap-2 text-muted-foreground hover:text-gold hover:bg-gold/10"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span className="hidden sm:inline">New</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleCreateSong}
                        className="gap-2 bg-gradient-to-r from-purple-500 to-gold hover:from-purple-600 hover:to-amber-500"
                      >
                        <Music className="w-4 h-4" />
                        <span>Create Song</span>
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Waveform Visualizer - LARGE, fills module area */}
                {chiefAimSongUrl && (
                  <div className="h-16 sm:h-20 w-full rounded-xl bg-gradient-to-br from-black/30 to-purple-900/20 overflow-hidden flex items-center justify-center px-3 border border-purple-500/20">
                    <SimpleWaveformBars 
                      isPlaying={isPlaying} 
                      barCount={32}
                      className="h-12 sm:h-16 w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-5 sm:p-8 rounded-xl bg-secondary/30 border-2 border-dashed border-gold/30 text-center transition-all duration-300 hover:border-gold/50 hover:bg-secondary/40"
            style={{
              boxShadow: isActive ? '0 0 20px rgba(212, 175, 55, 0.15)' : 'none',
            }}
          >
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-gold/50 mx-auto mb-4 animate-pulse" />
            <p className="text-base sm:text-lg text-muted-foreground mb-2">Your Definite Chief Aim is not set yet.</p>
            <p className="text-sm text-muted-foreground/70">Click "Create with AI" to define your vision and goals.</p>
          </div>
        )}
      </div>

      {/* Bottom energy bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
        <div 
          className={cn(
            "h-full w-0 transition-all duration-700 ease-out bg-gradient-to-r from-gold/0 via-gold to-gold/0",
            isActive && "w-full"
          )}
          style={{
            boxShadow: `0 0 10px ${particleColor}`,
          }}
        />
      </div>
    </div>
  );
};