import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  className?: string;
  barCount?: number;
  barColor?: string;
}

// Resolve CSS variable to actual color value
function resolveCssColor(color: string): string {
  if (color.includes('var(--')) {
    // Extract variable name and get computed value
    const varMatch = color.match(/var\(--([^)]+)\)/);
    if (varMatch) {
      const computedStyle = getComputedStyle(document.documentElement);
      const value = computedStyle.getPropertyValue(`--${varMatch[1]}`).trim();
      if (value) {
        return `hsl(${value})`;
      }
    }
    // Fallback to gold color
    return '#D4AF37';
  }
  return color;
}

export function AudioVisualizer({ 
  audioElement, 
  isPlaying, 
  className,
  barCount = 32,
  barColor = '#D4AF37' // Use hex fallback for Canvas compatibility
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    // Create audio context and analyzer only once
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Connect source only once per audio element
    if (!sourceRef.current && audioElement) {
      try {
        sourceRef.current = audioContext.createMediaElementSource(audioElement);
        analyzerRef.current = audioContext.createAnalyser();
        analyzerRef.current.fftSize = 256;
        analyzerRef.current.smoothingTimeConstant = 0.8;
        
        sourceRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContext.destination);
        setIsConnected(true);
      } catch (e) {
        // Source might already be connected
        console.log('Audio source already connected');
        setIsConnected(true);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement]);

  useEffect(() => {
    if (!canvasRef.current || !analyzerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) {
        // Draw idle state with subtle animation
        drawIdleBars(ctx, canvas, barCount, barColor);
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      analyzer.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / barCount;
      const gap = 2;
      const step = Math.floor(bufferLength / barCount);
      const resolvedColor = resolveCssColor(barColor);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * step;
        const value = dataArray[dataIndex];
        const barHeight = (value / 255) * canvas.height * 0.9;
        
        const x = i * barWidth;
        const y = canvas.height - barHeight;

        // Create gradient with resolved color
        const gradient = ctx.createLinearGradient(x, canvas.height, x, y);
        gradient.addColorStop(0, resolvedColor);
        gradient.addColorStop(1, adjustColorOpacity(resolvedColor, 0.5));

        ctx.fillStyle = gradient;
        ctx.fillRect(x + gap / 2, y, barWidth - gap, barHeight);
        
        // Add glow effect
        ctx.shadowColor = resolvedColor;
        ctx.shadowBlur = 10;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, barCount, barColor, isConnected]);

  return (
    <canvas 
      ref={canvasRef}
      width={300}
      height={60}
      className={cn("w-full h-full", className)}
    />
  );
}

// Draw idle bars with subtle animation
function drawIdleBars(
  ctx: CanvasRenderingContext2D, 
  canvas: HTMLCanvasElement, 
  barCount: number,
  barColor: string
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const barWidth = canvas.width / barCount;
  const gap = 2;
  const time = Date.now() / 1000;
  const resolvedColor = resolveCssColor(barColor);

  for (let i = 0; i < barCount; i++) {
    const x = i * barWidth;
    // Create subtle wave effect when idle
    const baseHeight = 4;
    const wave = Math.sin(time * 2 + i * 0.3) * 2;
    const barHeight = baseHeight + wave;
    const y = canvas.height - barHeight;

    ctx.fillStyle = adjustColorOpacity(resolvedColor, 0.3);
    ctx.fillRect(x + gap / 2, y, barWidth - gap, barHeight);
  }
}

function adjustColorOpacity(color: string, opacity: number): string {
  // Handle HSL colors from CSS variables
  if (color.startsWith('hsl')) {
    return color.replace(')', ` / ${opacity})`).replace('hsl(', 'hsla(');
  }
  return color;
}

// Simpler bars-only visualizer for inline use (doesn't need audio context)
export function SimpleWaveformBars({ 
  isPlaying, 
  className,
  barCount = 5 
}: { 
  isPlaying: boolean; 
  className?: string;
  barCount?: number;
}) {
  return (
    <div className={cn("flex items-end gap-0.5 h-4", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-gold rounded-full transition-all duration-150",
            isPlaying ? "animate-pulse" : "h-1"
          )}
          style={{
            height: isPlaying ? `${40 + Math.sin(i) * 30}%` : '25%',
            animationDelay: `${i * 0.1}s`,
            animationDuration: isPlaying ? '0.4s' : '0s'
          }}
        />
      ))}
    </div>
  );
}
