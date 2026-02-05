import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface JarvisOrbProps {
  state: "idle" | "listening" | "speaking" | "processing";
  audioLevel?: number;
  className?: string;
}

export function JarvisOrb({ state, audioLevel = 0, className }: JarvisOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(query.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = 60;
    let phase = 0;
    let pulsePhase = 0;

    const getStateColor = () => {
      switch (state) {
        case "listening": return { r: 59, g: 130, b: 246 }; // Blue
        case "speaking": return { r: 212, g: 175, b: 55 }; // Gold
        case "processing": return { r: 168, g: 85, b: 247 }; // Purple
        default: return { r: 212, g: 175, b: 55 }; // Gold
      }
    };

    const drawOrb = () => {
      ctx.clearRect(0, 0, size, size);
      
      const color = getStateColor();
      const colorStr = `${color.r}, ${color.g}, ${color.b}`;
      
      // Animated radius based on state and audio
      let radiusMultiplier = 1;
      if (state === "speaking" || state === "listening") {
        radiusMultiplier = 1 + audioLevel * 0.3;
      } else if (state === "processing") {
        radiusMultiplier = 1 + Math.sin(pulsePhase) * 0.1;
      }
      
      const currentRadius = baseRadius * radiusMultiplier;

      // Outer glow rings
      for (let i = 5; i >= 1; i--) {
        const ringRadius = currentRadius + i * 12;
        const alpha = 0.08 / i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorStr}, ${alpha})`;
        ctx.fill();
      }

      // Inner gradient orb
      const gradient = ctx.createRadialGradient(
        centerX - currentRadius * 0.3,
        centerY - currentRadius * 0.3,
        0,
        centerX,
        centerY,
        currentRadius
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
      gradient.addColorStop(0.3, `rgba(${colorStr}, 0.8)`);
      gradient.addColorStop(0.7, `rgba(${colorStr}, 0.6)`);
      gradient.addColorStop(1, `rgba(${colorStr}, 0.2)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Animated wave rings
      if (state === "speaking" || state === "listening") {
        const waveCount = 3;
        for (let i = 0; i < waveCount; i++) {
          const wavePhase = (phase + i * (Math.PI * 2 / waveCount)) % (Math.PI * 2);
          const waveRadius = currentRadius + 10 + Math.sin(wavePhase) * 15 * (1 + audioLevel);
          const alpha = 0.3 - (wavePhase / (Math.PI * 2)) * 0.2;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${colorStr}, ${Math.max(0, alpha)})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Processing spinner
      if (state === "processing") {
        const spinnerRadius = currentRadius + 20;
        const arcLength = Math.PI * 0.6;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, spinnerRadius, phase, phase + arcLength);
        ctx.strokeStyle = `rgba(${colorStr}, 0.6)`;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, spinnerRadius, phase + Math.PI, phase + Math.PI + arcLength);
        ctx.stroke();
      }

      // Center highlight
      const highlightGradient = ctx.createRadialGradient(
        centerX - currentRadius * 0.2,
        centerY - currentRadius * 0.2,
        0,
        centerX,
        centerY,
        currentRadius * 0.5
      );
      highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
      highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = highlightGradient;
      ctx.fill();
    };

    const animate = () => {
      if (prefersReducedMotion) {
        drawOrb();
        return;
      }

      const speed = state === "processing" ? 0.08 : 0.04;
      phase += speed;
      pulsePhase += 0.05;
      
      if (phase > Math.PI * 2) phase -= Math.PI * 2;
      
      drawOrb();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, audioLevel, prefersReducedMotion]);

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        className="w-[200px] h-[200px]"
      />
      
      {/* State indicator ring */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full border-2 transition-all duration-300",
          state === "listening" && "border-blue-500/30 animate-pulse",
          state === "speaking" && "border-gold/30",
          state === "processing" && "border-purple-500/30 animate-spin",
          state === "idle" && "border-gold/20"
        )}
        style={{ 
          margin: "25px",
          animationDuration: state === "processing" ? "2s" : "1.5s"
        }}
      />
    </div>
  );
}
