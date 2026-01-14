import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  src: string;
  duration: number;
  width: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export function AudioWaveform({
  src,
  duration,
  width,
  height = 32,
  color = "hsl(var(--primary))",
  backgroundColor = "transparent",
  className,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Analyze audio and extract waveform data
  useEffect(() => {
    if (!src) {
      // Generate a visible placeholder if no source
      const placeholderBars = Math.min(Math.floor(width / 6), 50);
      setWaveformData(Array(placeholderBars).fill(0).map((_, i) => 
        0.4 + Math.sin(i * 0.4) * 0.25 + Math.random() * 0.35
      ));
      setIsLoading(false);
      return;
    }

    const analyzeAudio = async () => {
      setIsLoading(true);
      try {
        const audioContext = new AudioContext();
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get audio data from first channel
        const rawData = audioBuffer.getChannelData(0);
        const samples = Math.min(width, 200); // Number of samples to display
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j] || 0);
          }
          filteredData.push(sum / blockSize);
        }

        // Normalize the data
        const multiplier = Math.pow(Math.max(...filteredData), -1);
        const normalizedData = filteredData.map((n) => n * multiplier);

        setWaveformData(normalizedData);
        audioContext.close();
      } catch (error) {
        console.error("Failed to analyze audio:", error);
        // Generate a more visible placeholder waveform on error (CORS, etc.)
        const placeholderBars = Math.min(Math.floor(width / 6), 50);
        setWaveformData(Array(placeholderBars).fill(0).map((_, i) => 
          0.4 + Math.sin(i * 0.4) * 0.25 + Math.random() * 0.35
        ));
      }
      setIsLoading(false);
    };

    analyzeAudio();
  }, [src, width]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    const barWidth = width / waveformData.length;
    const barGap = Math.max(1, barWidth * 0.2);
    const effectiveBarWidth = barWidth - barGap;

    ctx.fillStyle = color;

    waveformData.forEach((value, index) => {
      const barHeight = Math.max(2, value * (height - 4));
      const x = index * barWidth + barGap / 2;
      const y = (height - barHeight) / 2;

      // Draw rounded rectangle (with fallback for browsers without ctx.roundRect)
      const radius = Math.min(effectiveBarWidth / 2, 2);
      const r = Math.min(radius, effectiveBarWidth / 2, barHeight / 2);

      ctx.beginPath();
      const anyCtx = ctx as any;
      if (typeof anyCtx.roundRect === "function") {
        anyCtx.roundRect(x, y, effectiveBarWidth, barHeight, r);
      } else {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + effectiveBarWidth - r, y);
        ctx.quadraticCurveTo(x + effectiveBarWidth, y, x + effectiveBarWidth, y + r);
        ctx.lineTo(x + effectiveBarWidth, y + barHeight - r);
        ctx.quadraticCurveTo(x + effectiveBarWidth, y + barHeight, x + effectiveBarWidth - r, y + barHeight);
        ctx.lineTo(x + r, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }
      ctx.fill();
    });
  }, [waveformData, width, height, color, backgroundColor]);

  if (isLoading) {
    return (
      <div
        className={cn("animate-pulse bg-muted/30 rounded", className)}
        style={{ width, height }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn("rounded", className)}
      style={{ width, height }}
    />
  );
}

// Simplified waveform for inline display (no audio analysis, just visual)
interface SimpleWaveformProps {
  width: number;
  height?: number;
  bars?: number;
  color?: string;
  className?: string;
  animated?: boolean;
}

export function SimpleWaveform({
  width,
  height = 24,
  bars = 20,
  color = "currentColor",
  className,
  animated = false,
}: SimpleWaveformProps) {
  const barWidth = width / bars;
  const gap = barWidth * 0.3;
  const effectiveWidth = barWidth - gap;

  // Generate random heights for visual effect
  const heights = useRef(
    Array(bars)
      .fill(0)
      .map(() => 0.2 + Math.random() * 0.8)
  ).current;

  return (
    <svg
      width={width}
      height={height}
      className={cn(className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {heights.map((h, i) => {
        const barHeight = h * (height - 4);
        const y = (height - barHeight) / 2;
        return (
          <rect
            key={i}
            x={i * barWidth + gap / 2}
            y={y}
            width={effectiveWidth}
            height={barHeight}
            rx={Math.min(effectiveWidth / 2, 2)}
            fill={color}
            className={animated ? "animate-pulse" : ""}
            style={animated ? { animationDelay: `${i * 50}ms` } : undefined}
          />
        );
      })}
    </svg>
  );
}
