import { cn } from "@/lib/utils";

interface VoiceWaveformProps {
  audioLevel: number;
  isActive: boolean;
  barCount?: number;
  className?: string;
}

export function VoiceWaveform({ 
  audioLevel, 
  isActive, 
  barCount = 5,
  className 
}: VoiceWaveformProps) {
  // Generate bar heights based on audio level with some randomness for natural look
  const bars = Array.from({ length: barCount }, (_, i) => {
    const baseHeight = isActive ? audioLevel : 0.1;
    const variance = Math.sin((i * Math.PI) / (barCount - 1)); // Center bars taller
    const height = Math.max(0.15, Math.min(1, baseHeight * (0.5 + variance * 0.8)));
    return height;
  });

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {bars.map((height, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-75",
            isActive ? "bg-gold" : "bg-muted-foreground/40"
          )}
          style={{
            height: `${Math.max(8, height * 32)}px`,
            opacity: isActive ? 0.6 + height * 0.4 : 0.4,
          }}
        />
      ))}
    </div>
  );
}
