import { useMemo, useState, useRef, useCallback, useEffect } from "react";

interface TimelineRulerProps {
  duration: number;
  zoom: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

export function TimelineRuler({ duration, zoom, currentTime, onSeek }: TimelineRulerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Generate time markers based on zoom level
  const markers = useMemo(() => {
    const result: { time: number; label: string; major: boolean }[] = [];
    
    // Determine interval based on zoom
    let interval: number;
    if (zoom >= 100) {
      interval = 1; // Every second
    } else if (zoom >= 50) {
      interval = 5; // Every 5 seconds
    } else if (zoom >= 25) {
      interval = 10; // Every 10 seconds
    } else {
      interval = 30; // Every 30 seconds
    }

    const maxTime = Math.max(duration, 60); // At least show 60 seconds
    
    for (let t = 0; t <= maxTime; t += interval) {
      const minutes = Math.floor(t / 60);
      const seconds = t % 60;
      result.push({
        time: t,
        label: `${minutes}:${seconds.toString().padStart(2, "0")}`,
        major: t % (interval * 5) === 0 || interval >= 30,
      });
    }

    return result;
  }, [duration, zoom]);

  // Calculate time from mouse position
  const getTimeFromPosition = useCallback((clientX: number) => {
    if (!rulerRef.current) return 0;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const time = x / zoom;
    return Math.max(0, Math.min(time, duration));
  }, [zoom, duration]);

  // Handle mouse down - start dragging
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    const time = getTimeFromPosition(e.clientX);
    onSeek(time);
  }, [getTimeFromPosition, onSeek]);

  // Handle mouse move while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const time = getTimeFromPosition(e.clientX);
      onSeek(time);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Use requestAnimationFrame for smoother updates
    let animationFrame: number;
    const throttledMouseMove = (e: MouseEvent) => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => handleMouseMove(e));
    };

    document.addEventListener("mousemove", throttledMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", throttledMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isDragging, getTimeFromPosition, onSeek]);

  return (
    <div
      ref={rulerRef}
      className="relative h-6 bg-card border-b border-border/50 cursor-pointer select-none"
      onMouseDown={handleMouseDown}
    >
      {/* Markers */}
      {markers.map(({ time, label, major }) => (
        <div
          key={time}
          className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
          style={{ left: `${time * zoom}px` }}
        >
          <div
            className={`w-px ${major ? "h-full bg-border" : "h-2 bg-border/50"}`}
          />
          {major && (
            <span className="absolute top-1 text-[10px] text-muted-foreground whitespace-nowrap">
              {label}
            </span>
          )}
        </div>
      ))}

      {/* Playhead indicator - use transform for smooth GPU-accelerated movement */}
      <div
        className="absolute top-0 w-0.5 h-full bg-primary z-10 pointer-events-none"
        style={{ 
          transform: `translateX(${currentTime * zoom}px)`,
          willChange: isDragging ? "transform" : "auto",
        }}
      >
        <div className="absolute -top-0.5 -left-1.5 w-3 h-3 bg-primary rotate-45" />
      </div>
    </div>
  );
}
