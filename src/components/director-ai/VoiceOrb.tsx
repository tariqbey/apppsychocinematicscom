import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VoiceOrbProps {
  state: "idle" | "listening" | "speaking" | "processing";
  audioLevel?: number;
  className?: string;
}

export function VoiceOrb({ state, audioLevel = 0, className }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 280;
    canvas.width = size;
    canvas.height = size;
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = 80;

    const animate = () => {
      ctx.clearRect(0, 0, size, size);
      phaseRef.current += 0.02;

      // Outer glow rings
      const ringCount = 3;
      for (let i = ringCount; i >= 0; i--) {
        const ringRadius = baseRadius + 20 + i * 25 + Math.sin(phaseRef.current + i) * 5;
        const alpha = (0.15 - i * 0.04) * (state === "speaking" ? 1.5 : 1);
        
        const gradient = ctx.createRadialGradient(
          centerX, centerY, ringRadius - 10,
          centerX, centerY, ringRadius + 10
        );
        
        if (state === "speaking") {
          gradient.addColorStop(0, `hsla(43, 74%, 53%, 0)`);
          gradient.addColorStop(0.5, `hsla(43, 74%, 53%, ${alpha})`);
          gradient.addColorStop(1, `hsla(43, 74%, 53%, 0)`);
        } else if (state === "listening") {
          gradient.addColorStop(0, `hsla(0, 0%, 100%, 0)`);
          gradient.addColorStop(0.5, `hsla(0, 0%, 100%, ${alpha})`);
          gradient.addColorStop(1, `hsla(0, 0%, 100%, 0)`);
        } else {
          gradient.addColorStop(0, `hsla(43, 74%, 49%, 0)`);
          gradient.addColorStop(0.5, `hsla(43, 74%, 49%, ${alpha * 0.5})`);
          gradient.addColorStop(1, `hsla(43, 74%, 49%, 0)`);
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = gradient.toString();
        ctx.lineWidth = 2;
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Main orb
      const pulseScale = state === "idle" 
        ? 1 + Math.sin(phaseRef.current * 0.5) * 0.05
        : state === "speaking" 
          ? 1 + audioLevel * 0.3 + Math.sin(phaseRef.current * 2) * 0.05
          : state === "listening"
            ? 1 + audioLevel * 0.2 + Math.sin(phaseRef.current * 3) * 0.03
            : 1 + Math.sin(phaseRef.current * 4) * 0.1;

      const currentRadius = baseRadius * pulseScale;

      // Orb gradient
      const orbGradient = ctx.createRadialGradient(
        centerX - 20, centerY - 20, 0,
        centerX, centerY, currentRadius
      );

      if (state === "speaking") {
        orbGradient.addColorStop(0, "hsl(43, 80%, 65%)");
        orbGradient.addColorStop(0.5, "hsl(43, 74%, 49%)");
        orbGradient.addColorStop(1, "hsl(35, 80%, 35%)");
      } else if (state === "listening") {
        orbGradient.addColorStop(0, "hsl(0, 0%, 95%)");
        orbGradient.addColorStop(0.5, "hsl(0, 0%, 80%)");
        orbGradient.addColorStop(1, "hsl(0, 0%, 60%)");
      } else if (state === "processing") {
        orbGradient.addColorStop(0, "hsl(43, 60%, 55%)");
        orbGradient.addColorStop(0.5, "hsl(43, 50%, 40%)");
        orbGradient.addColorStop(1, "hsl(35, 60%, 30%)");
      } else {
        orbGradient.addColorStop(0, "hsl(43, 70%, 55%)");
        orbGradient.addColorStop(0.5, "hsl(43, 74%, 42%)");
        orbGradient.addColorStop(1, "hsl(35, 70%, 30%)");
      }

      // Draw main orb
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = orbGradient;
      ctx.fill();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(centerX - 25, centerY - 25, currentRadius * 0.3, 0, Math.PI * 2);
      const highlightGradient = ctx.createRadialGradient(
        centerX - 25, centerY - 25, 0,
        centerX - 25, centerY - 25, currentRadius * 0.3
      );
      highlightGradient.addColorStop(0, "hsla(0, 0%, 100%, 0.4)");
      highlightGradient.addColorStop(1, "hsla(0, 0%, 100%, 0)");
      ctx.fillStyle = highlightGradient;
      ctx.fill();

      // Outer glow
      ctx.shadowColor = state === "speaking" 
        ? "hsl(43, 74%, 49%)" 
        : state === "listening" 
          ? "hsl(0, 0%, 90%)" 
          : "hsl(43, 60%, 40%)";
      ctx.shadowBlur = state === "speaking" ? 40 + audioLevel * 30 : 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = "transparent";
      ctx.fill();
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, audioLevel]);

  return (
    <div className={cn("relative", className)}>
      <canvas 
        ref={canvasRef} 
        className="w-[280px] h-[280px]"
        style={{ filter: "drop-shadow(0 0 30px hsla(43, 74%, 49%, 0.3))" }}
      />
      
      {/* State indicator */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4">
        <span className={cn(
          "text-xs font-medium uppercase tracking-widest transition-colors",
          state === "speaking" && "text-gold",
          state === "listening" && "text-white",
          state === "processing" && "text-muted-foreground animate-pulse",
          state === "idle" && "text-muted-foreground"
        )}>
          {state === "speaking" && "Speaking"}
          {state === "listening" && "Listening"}
          {state === "processing" && "Processing"}
          {state === "idle" && "Ready"}
        </span>
      </div>
    </div>
  );
}
