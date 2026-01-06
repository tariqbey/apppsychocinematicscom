import { useState } from "react";
import { Play, Pause, Flame, Film, VolumeX, Volume2, Maximize, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TheaterViewProps {
  streak: number;
  onClose: () => void;
}

export const TheaterView = ({ streak, onClose }: TheaterViewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-cinematic-midnight flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center">
            <Film className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-display tracking-wide">The Theater</h2>
            <p className="text-sm text-muted-foreground">Your Mind Movie Awaits</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Streak Counter */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-soft/20 to-cinematic-red/20 border border-amber-soft/30">
            <Flame className={cn("w-5 h-5 text-amber-soft", streak > 0 && "streak-fire")} />
            <span className="font-display text-xl text-foreground">{streak}</span>
            <span className="text-sm text-muted-foreground">Day Streak</span>
          </div>
          
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Video Player Area */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-5xl aspect-video rounded-xl bg-card border border-border overflow-hidden relative group">
          {/* Placeholder for video */}
          <div className="absolute inset-0 bg-gradient-to-br from-cinematic-charcoal to-cinematic-midnight flex items-center justify-center">
            <div className="text-center">
              <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">Your Mind Movie</p>
              <p className="text-sm text-muted-foreground/70">Upload your AI-generated vision</p>
            </div>
          </div>

          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {/* Progress bar */}
              <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden">
                <div className="h-full w-1/3 bg-gradient-to-r from-gold to-amber-soft" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="gold"
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-1" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">1:23 / 3:45</span>
                </div>

                <Button variant="ghost" size="icon">
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Watch your Mind Movie daily to reinforce your new identity
          </p>
          <Button variant="gold" onClick={() => setIsPlaying(true)}>
            <Play className="w-4 h-4 mr-2" />
            Start Screening
          </Button>
        </div>
      </div>
    </div>
  );
};
