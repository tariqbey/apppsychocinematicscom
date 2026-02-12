import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Scroll, Calendar, ArrowRight, Sparkles, Pencil, Wand2, Music, Play, Pause } from "lucide-react";
import { SimpleWaveformBars } from "@/components/music/AudioVisualizer";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAudio } from "@/contexts/AudioContext";

interface ChiefAimData {
  what: string;
  byWhen: string;
  exchange: string;
  plan: string;
}

interface ScriptReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aim: ChiefAimData;
  chiefAimSongUrl?: string | null;
  onEdit?: () => void;
  onAdjust?: () => void;
  onSongListened?: () => void;
  onRitualComplete?: () => void;
}

export const ScriptReviewModal = ({ 
  open, 
  onOpenChange, 
  aim,
  chiefAimSongUrl,
  onEdit,
  onAdjust,
  onSongListened,
  onRitualComplete
}: ScriptReviewModalProps) => {
  const hasAim = aim.what && aim.byWhen && aim.exchange && aim.plan;
  const [hasListenedToday, setHasListenedToday] = useState(false);
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const navigate = useNavigate();

  const { 
    isPlaying: globalIsPlaying, 
    currentSrc,
    audioOwner,
    playAudio, 
    pauseAudio,
    stopAudio
  } = useAudio();

  const isPlaying = globalIsPlaying && audioOwner === 'chief-aim-anthem';

  const togglePlayback = async () => {
    if (!chiefAimSongUrl) return;
    
    if (isPlaying) {
      pauseAudio();
      if (!hasListenedToday) {
        setWasInterrupted(true);
      }
    } else {
      if (wasInterrupted && !hasListenedToday) {
        stopAudio();
        setWasInterrupted(false);
      }
      await playAudio(chiefAimSongUrl, {
        title: 'Chief Aim Anthem',
        artist: 'Your Transformation',
        owner: 'chief-aim-anthem',
      });
    }
  };

  useEffect(() => {
    if (!globalIsPlaying && audioOwner === 'chief-aim-anthem' && currentSrc === chiefAimSongUrl) {
      if (!hasListenedToday && !wasInterrupted) {
        setHasListenedToday(true);
        onSongListened?.();
      }
      setWasInterrupted(false);
    }
  }, [globalIsPlaying, audioOwner, currentSrc, chiefAimSongUrl, hasListenedToday, wasInterrupted, onSongListened]);

  const handleCreateSong = () => {
    const context = [
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
    
    sessionStorage.setItem("chief-aim-lyrics-context", context);
    onOpenChange(false);
    navigate("/soundtrack?fromChiefAim=true");
  };

  const handleMarkComplete = () => {
    onRitualComplete?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-gold/20 text-foreground [&>button:last-child]:hidden">
        {/* Sticky back/close header */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/30 -mx-6 -mt-6 px-4 py-3 mb-4">
          <button onClick={() => onOpenChange(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors min-h-[44px]">
            <span className="text-lg">←</span>
            <span>Back</span>
          </button>
          <span className="text-xs text-gold/70 uppercase tracking-wider font-ui">Script Review</span>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-gold transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <span className="text-lg">✕</span>
          </button>
        </div>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-gold/30 to-gold/10"
              style={{ boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)' }}
            >
              <Scroll className="w-5 h-5 text-gold" />
            </div>
            <div>
              <span className="font-display text-2xl text-foreground">The Script</span>
              <p className="font-ui text-xs text-muted-foreground uppercase tracking-wider font-normal">Your Definite Chief Aim</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {hasAim ? (
            <>
              {/* Screenplay header */}
              <div className="text-center border-b border-border/30 pb-4">
                <p className="font-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  A Film by
                </p>
                <p className="font-display text-xl text-foreground mt-1">
                  The Director
                </p>
              </div>

              {/* Scene: What I Want */}
              <div className="space-y-1">
                <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  INT. MY FUTURE — THE VISION
                </p>
                <p className="font-script text-lg text-foreground leading-relaxed">
                  {aim.what}
                </p>
              </div>

              {/* Scene: By When */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sienna" />
                  <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    INT. THE DEADLINE — {aim.byWhen.toUpperCase()}
                  </p>
                </div>
                <p className="font-script text-base text-foreground pl-6">
                  By this date, the transformation is complete.
                </p>
              </div>

              {/* Scene: The Exchange */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-sienna" />
                  <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    INT. THE EXCHANGE — WHAT I GIVE
                  </p>
                </div>
                <p className="font-script text-base text-foreground leading-relaxed pl-6">
                  {aim.exchange}
                </p>
              </div>

              {/* Scene: The Plan */}
              <div className="space-y-1 p-4 rounded-lg border border-gold/20 bg-gold/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <p className="font-ui text-xs uppercase tracking-[0.2em] text-gold">
                    INT. THE PLAN — ACTION SEQUENCE
                  </p>
                </div>
                <p className="font-script text-base text-foreground leading-relaxed pl-6">
                  {aim.plan}
                </p>
              </div>

              {/* Screenplay footer line */}
              <div className="text-center py-2">
                <p className="font-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50">
                  — FADE TO BLACK —
                </p>
              </div>

              {/* Chief Aim Anthem Section */}
              <div className="p-4 sm:p-5 rounded-xl bg-card border border-gold/20">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                      <div>
                        <p className="font-ui text-xs text-gold uppercase tracking-wider">Chief Aim Anthem</p>
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
                                ? "text-gold bg-gold/20" 
                                : "text-muted-foreground hover:text-gold hover:bg-gold/10"
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
                          className="gap-2 bg-gradient-to-r from-gold to-amber-soft"
                        >
                          <Music className="w-4 h-4" />
                          <span>Create Song</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Waveform Visualizer */}
                  {chiefAimSongUrl && (
                    <div className="h-16 sm:h-20 w-full rounded-xl bg-card/50 overflow-hidden flex items-center justify-center px-3 border border-gold/20">
                      <SimpleWaveformBars 
                        isPlaying={isPlaying} 
                        barCount={32}
                        className="h-12 sm:h-16 w-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit?.();
                  }}
                  className="gap-2 border-border text-foreground hover:bg-gold/10 hover:border-gold/30"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Script
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onAdjust?.();
                  }}
                  className="gap-2 border-border text-foreground hover:bg-gold/10 hover:border-gold/30"
                >
                  <Wand2 className="w-4 h-4" />
                  Adjust with AI
                </Button>
                <Button
                  variant="default"
                  onClick={handleMarkComplete}
                  className="gap-2 bg-gradient-to-r from-gold to-amber-soft ml-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  Mark as Read
                </Button>
              </div>
            </>
          ) : (
            <div className="p-8 rounded-xl border-2 border-dashed border-gold/30 text-center bg-gold/5">
              <Sparkles className="w-10 h-10 text-gold/50 mx-auto mb-4 animate-pulse" />
              <p className="font-display text-xl text-foreground mb-2">Your Definite Chief Aim is not set yet.</p>
              <p className="font-script text-sm text-muted-foreground mb-4">Create your transformation script to unlock this ritual.</p>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onEdit?.();
                }}
                className="bg-gradient-to-r from-gold to-amber-soft"
              >
                Create with AI
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
