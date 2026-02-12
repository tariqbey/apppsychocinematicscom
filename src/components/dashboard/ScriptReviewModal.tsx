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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--parchment))] border-gold/20 text-[hsl(240_7%_10%)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-gold/30 to-gold/10"
              style={{ boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)' }}
            >
              <Scroll className="w-5 h-5 text-gold" />
            </div>
            <div>
              <span className="font-display text-2xl text-[hsl(240_7%_10%)]">The Script</span>
              <p className="font-ui text-xs text-[hsl(37_8%_44%)] uppercase tracking-wider font-normal">Your Definite Chief Aim</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {hasAim ? (
            <>
              {/* Screenplay header */}
              <div className="text-center border-b border-[hsl(37_8%_44%/0.2)] pb-4">
                <p className="font-ui text-[10px] uppercase tracking-[0.3em] text-[hsl(37_8%_44%)]">
                  A Film by
                </p>
                <p className="font-display text-xl text-[hsl(240_7%_10%)] mt-1">
                  The Director
                </p>
              </div>

              {/* Scene: What I Want */}
              <div className="space-y-1">
                <p className="font-ui text-xs uppercase tracking-[0.2em] text-[hsl(37_8%_44%)]">
                  INT. MY FUTURE — THE VISION
                </p>
                <p className="font-script text-lg text-[hsl(240_7%_15%)] leading-relaxed">
                  {aim.what}
                </p>
              </div>

              {/* Scene: By When */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[hsl(14_90%_41%)]" />
                  <p className="font-ui text-xs uppercase tracking-[0.2em] text-[hsl(37_8%_44%)]">
                    INT. THE DEADLINE — {aim.byWhen.toUpperCase()}
                  </p>
                </div>
                <p className="font-script text-base text-[hsl(240_7%_15%)] pl-6">
                  By this date, the transformation is complete.
                </p>
              </div>

              {/* Scene: The Exchange */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-[hsl(14_90%_41%)]" />
                  <p className="font-ui text-xs uppercase tracking-[0.2em] text-[hsl(37_8%_44%)]">
                    INT. THE EXCHANGE — WHAT I GIVE
                  </p>
                </div>
                <p className="font-script text-base text-[hsl(240_7%_15%)] leading-relaxed pl-6">
                  {aim.exchange}
                </p>
              </div>

              {/* Scene: The Plan */}
              <div className="space-y-1 p-4 rounded-lg border border-gold/20 bg-[hsl(37_87%_57%/0.05)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <p className="font-ui text-xs uppercase tracking-[0.2em] text-gold">
                    INT. THE PLAN — ACTION SEQUENCE
                  </p>
                </div>
                <p className="font-script text-base text-[hsl(240_7%_15%)] leading-relaxed pl-6">
                  {aim.plan}
                </p>
              </div>

              {/* Screenplay footer line */}
              <div className="text-center py-2">
                <p className="font-ui text-[10px] uppercase tracking-[0.3em] text-[hsl(37_8%_44%/0.6)]">
                  — FADE TO BLACK —
                </p>
              </div>

              {/* Chief Aim Anthem Section */}
              <div className="p-4 sm:p-5 rounded-xl bg-[hsl(240_7%_10%)] border border-gold/20 text-foreground">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      <div>
                        <p className="font-ui text-xs text-purple-300 uppercase tracking-wider">Chief Aim Anthem</p>
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
                  
                  {/* Waveform Visualizer */}
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

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit?.();
                  }}
                  className="gap-2 border-[hsl(37_8%_44%/0.3)] text-[hsl(240_7%_10%)] hover:bg-gold/10"
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
                  className="gap-2 border-[hsl(37_8%_44%/0.3)] text-[hsl(240_7%_10%)] hover:bg-gold/10"
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
            <div className="p-8 rounded-xl border-2 border-dashed border-gold/30 text-center bg-[hsl(37_87%_57%/0.03)]">
              <Sparkles className="w-10 h-10 text-gold/50 mx-auto mb-4 animate-pulse" />
              <p className="font-display text-xl text-[hsl(240_7%_10%)] mb-2">Your Definite Chief Aim is not set yet.</p>
              <p className="font-script text-sm text-[hsl(37_8%_44%)] mb-4">Create your transformation script to unlock this ritual.</p>
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
