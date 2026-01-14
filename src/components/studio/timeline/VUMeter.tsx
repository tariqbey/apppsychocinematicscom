import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface VUMeterProps {
  audioSources: Array<{
    element: HTMLMediaElement | null;
    volume: number;
    muted: boolean;
  }>;
  isPlaying: boolean;
  className?: string;
}

export function VUMeter({ audioSources, isPlaying, className }: VUMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodesRef = useRef<Map<HTMLMediaElement, MediaElementAudioSourceNode>>(new Map());
  const gainNodesRef = useRef<Map<HTMLMediaElement, GainNode>>(new Map());
  const mergerRef = useRef<ChannelMergerNode | null>(null);
  const animationRef = useRef<number>(0);
  const [leftLevel, setLeftLevel] = useState(0);
  const [rightLevel, setRightLevel] = useState(0);
  const [peakLeft, setPeakLeft] = useState(0);
  const [peakRight, setPeakRight] = useState(0);
  const peakDecayRef = useRef({ left: 0, right: 0 });

  // Initialize audio context and analyser
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Connect audio sources
  useEffect(() => {
    const ctx = audioContextRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    // Resume context if needed
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Create merger node if needed
    if (!mergerRef.current) {
      mergerRef.current = ctx.createChannelMerger(2);
      mergerRef.current.connect(analyser);
    }

    // Connect new sources, disconnect removed ones
    const currentElements = new Set(audioSources.map(s => s.element).filter(Boolean) as HTMLMediaElement[]);
    
    // Remove old sources
    sourceNodesRef.current.forEach((node, element) => {
      if (!currentElements.has(element)) {
        try {
          node.disconnect();
        } catch (e) {
          // Already disconnected
        }
        sourceNodesRef.current.delete(element);
        gainNodesRef.current.get(element)?.disconnect();
        gainNodesRef.current.delete(element);
      }
    });

    // Add new sources
    audioSources.forEach(({ element, volume, muted }) => {
      if (!element) return;
      
      let sourceNode = sourceNodesRef.current.get(element);
      let gainNode = gainNodesRef.current.get(element);
      
      if (!sourceNode) {
        try {
          sourceNode = ctx.createMediaElementSource(element);
          gainNode = ctx.createGain();
          sourceNode.connect(gainNode);
          gainNode.connect(mergerRef.current!);
          // Also connect to destination so audio plays
          gainNode.connect(ctx.destination);
          sourceNodesRef.current.set(element, sourceNode);
          gainNodesRef.current.set(element, gainNode);
        } catch (e) {
          // Already connected or invalid
          return;
        }
      }
      
      // Update gain
      if (gainNode) {
        gainNode.gain.value = muted ? 0 : volume;
      }
    });
  }, [audioSources]);

  // Animation loop
  useEffect(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevels = () => {
      if (!isPlaying) {
        // Decay when not playing
        setLeftLevel(prev => Math.max(0, prev - 5));
        setRightLevel(prev => Math.max(0, prev - 5));
      } else {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const level = (average / 255) * 100;
        
        // Simulate stereo by using slightly different values
        const leftVal = Math.min(100, level + (Math.random() - 0.5) * 5);
        const rightVal = Math.min(100, level + (Math.random() - 0.5) * 5);
        
        setLeftLevel(leftVal);
        setRightLevel(rightVal);

        // Update peak hold
        if (leftVal > peakDecayRef.current.left) {
          peakDecayRef.current.left = leftVal;
          setPeakLeft(leftVal);
        } else {
          peakDecayRef.current.left = Math.max(0, peakDecayRef.current.left - 0.5);
          setPeakLeft(peakDecayRef.current.left);
        }

        if (rightVal > peakDecayRef.current.right) {
          peakDecayRef.current.right = rightVal;
          setPeakRight(rightVal);
        } else {
          peakDecayRef.current.right = Math.max(0, peakDecayRef.current.right - 0.5);
          setPeakRight(peakDecayRef.current.right);
        }
      }

      animationRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  // Render VU meter bars
  const renderBar = (level: number, peak: number, isLeft: boolean) => {
    const segments = 20;
    const segmentHeight = 100 / segments;
    
    return (
      <div className="flex flex-col-reverse gap-px h-full w-3">
        {Array.from({ length: segments }).map((_, i) => {
          const segmentLevel = (i / segments) * 100;
          const isActive = level >= segmentLevel;
          const isPeak = Math.abs(peak - segmentLevel) < segmentHeight;
          
          // Color based on level (green -> yellow -> red)
          let colorClass = "bg-emerald-500";
          if (segmentLevel > 75) {
            colorClass = "bg-red-500";
          } else if (segmentLevel > 60) {
            colorClass = "bg-amber-500";
          }
          
          return (
            <div
              key={i}
              className={cn(
                "w-full h-full rounded-sm transition-opacity duration-75",
                isActive || isPeak ? colorClass : "bg-muted-foreground/20",
                isPeak && !isActive && "opacity-80"
              )}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("flex items-center gap-1 h-full px-1", className)}>
      <div className="flex flex-col items-center gap-0.5 h-full">
        <div className="flex gap-0.5 flex-1">
          {renderBar(leftLevel, peakLeft, true)}
          {renderBar(rightLevel, peakRight, false)}
        </div>
        <div className="flex gap-1 text-[8px] text-muted-foreground">
          <span>L</span>
          <span>R</span>
        </div>
      </div>
    </div>
  );
}

// Simplified VU meter that doesn't require audio context (uses visual animation only)
interface SimpleVUMeterProps {
  leftLevel: number;
  rightLevel: number;
  className?: string;
}

export function SimpleVUMeter({ leftLevel, rightLevel, className }: SimpleVUMeterProps) {
  const [peakLeft, setPeakLeft] = useState(0);
  const [peakRight, setPeakRight] = useState(0);
  const peakDecayRef = useRef({ left: 0, right: 0 });

  useEffect(() => {
    // Update peak hold with decay
    if (leftLevel > peakDecayRef.current.left) {
      peakDecayRef.current.left = leftLevel;
      setPeakLeft(leftLevel);
    } else {
      peakDecayRef.current.left = Math.max(0, peakDecayRef.current.left - 1);
      setPeakLeft(peakDecayRef.current.left);
    }

    if (rightLevel > peakDecayRef.current.right) {
      peakDecayRef.current.right = rightLevel;
      setPeakRight(rightLevel);
    } else {
      peakDecayRef.current.right = Math.max(0, peakDecayRef.current.right - 1);
      setPeakRight(peakDecayRef.current.right);
    }
  }, [leftLevel, rightLevel]);

  const renderBar = (level: number, peak: number) => {
    const segments = 16;
    const segmentHeight = 100 / segments;
    
    return (
      <div className="flex flex-col-reverse gap-px h-full w-2">
        {Array.from({ length: segments }).map((_, i) => {
          const segmentLevel = (i / segments) * 100;
          const isActive = level >= segmentLevel;
          const isPeak = Math.abs(peak - segmentLevel) < segmentHeight && peak > 5;
          
          let colorClass = "bg-emerald-500";
          if (segmentLevel > 75) {
            colorClass = "bg-red-500";
          } else if (segmentLevel > 60) {
            colorClass = "bg-amber-500";
          }
          
          return (
            <div
              key={i}
              className={cn(
                "w-full h-full rounded-[1px] transition-opacity duration-50",
                isActive || isPeak ? colorClass : "bg-muted-foreground/15",
                isPeak && !isActive && "opacity-70"
              )}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("flex items-center gap-px h-full", className)}>
      {renderBar(leftLevel, peakLeft)}
      {renderBar(rightLevel, peakRight)}
    </div>
  );
}
