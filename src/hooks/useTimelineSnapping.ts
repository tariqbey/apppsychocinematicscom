import { useCallback, useMemo, useRef } from "react";
import { TimelineClip } from "./useTimelineEditor";

interface SnapPoint {
  time: number;
  type: "clip-start" | "clip-end" | "playhead" | "grid";
  clipId?: string;
}

interface SnapResult {
  snappedTime: number;
  didSnap: boolean;
  snapType: SnapPoint["type"] | null;
}

interface UseTimelineSnappingProps {
  clips: TimelineClip[];
  currentTime: number;
  gridInterval?: number; // in seconds
  snapThreshold?: number; // in pixels
  zoom: number;
  enabled: boolean;
}

export function useTimelineSnapping({
  clips,
  currentTime,
  gridInterval = 1,
  snapThreshold = 10,
  zoom,
  enabled,
}: UseTimelineSnappingProps) {
  // Convert pixel threshold to time threshold
  const timeThreshold = snapThreshold / zoom;

  // Cache for snap calculations
  const snapCacheRef = useRef<Map<string, SnapResult>>(new Map());
  const lastClipsRef = useRef<TimelineClip[]>(clips);

  // Clear cache when clips change - safely check if map exists
  if (clips !== lastClipsRef.current && snapCacheRef.current) {
    snapCacheRef.current.clear();
    lastClipsRef.current = clips;
  }

  // Generate snap points - use sparse grid (every 5 seconds instead of 1)
  const snapPoints = useMemo((): SnapPoint[] => {
    if (!enabled) return [];

    const points: SnapPoint[] = [];

    // Add clip edges
    clips.forEach((clip) => {
      points.push({
        time: clip.startTime,
        type: "clip-start",
        clipId: clip.id,
      });
      points.push({
        time: clip.startTime + clip.duration,
        type: "clip-end",
        clipId: clip.id,
      });
    });

    // Add playhead
    points.push({
      time: currentTime,
      type: "playhead",
    });

    // Use sparse grid - every 5 seconds for better performance
    const sparseInterval = Math.max(gridInterval, 5);
    const maxTime = 300; // 5 minutes
    for (let t = 0; t <= maxTime; t += sparseInterval) {
      points.push({
        time: t,
        type: "grid",
      });
    }

    // Sort points by time for faster binary search
    points.sort((a, b) => a.time - b.time);

    return points;
  }, [clips, currentTime, gridInterval, enabled]);

  // Binary search for nearest snap point
  const findNearestSnapPoint = useCallback(
    (time: number, excludeClipId?: string): SnapPoint | null => {
      if (snapPoints.length === 0) return null;

      // Binary search to find insertion point
      let left = 0;
      let right = snapPoints.length - 1;
      
      while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (snapPoints[mid].time < time) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }

      // Check nearby points (left-1, left, left+1)
      let closest: SnapPoint | null = null;
      let closestDistance = Infinity;

      for (let i = Math.max(0, left - 1); i <= Math.min(snapPoints.length - 1, left + 1); i++) {
        const point = snapPoints[i];
        if (excludeClipId && point.clipId === excludeClipId) continue;

        const distance = Math.abs(point.time - time);
        if (distance < closestDistance && distance <= timeThreshold) {
          closestDistance = distance;
          closest = point;
        }
      }

      return closest;
    },
    [snapPoints, timeThreshold]
  );

  // Snap a time value to nearest snap point
  const snapTime = useCallback(
    (time: number, excludeClipId?: string): SnapResult => {
      if (!enabled) {
        return { snappedTime: time, didSnap: false, snapType: null };
      }

      // Check cache first
      const cacheKey = `${time.toFixed(2)}-${excludeClipId || ''}`;
      const cached = snapCacheRef.current.get(cacheKey);
      if (cached) return cached;

      const closest = findNearestSnapPoint(time, excludeClipId);

      const result: SnapResult = closest
        ? { snappedTime: closest.time, didSnap: true, snapType: closest.type }
        : { snappedTime: time, didSnap: false, snapType: null };

      // Cache result (limit cache size)
      if (snapCacheRef.current.size > 100) {
        snapCacheRef.current.clear();
      }
      snapCacheRef.current.set(cacheKey, result);

      return result;
    },
    [findNearestSnapPoint, enabled]
  );

  // Snap clip start time (for moving)
  const snapClipStart = useCallback(
    (clipId: string, newStartTime: number): SnapResult => {
      return snapTime(newStartTime, clipId);
    },
    [snapTime]
  );

  // Snap clip end time (for resizing from end)
  const snapClipEnd = useCallback(
    (clipId: string, startTime: number, newDuration: number): SnapResult => {
      const endTime = startTime + newDuration;
      const result = snapTime(endTime, clipId);

      if (result.didSnap) {
        return {
          snappedTime: result.snappedTime - startTime,
          didSnap: true,
          snapType: result.snapType,
        };
      }

      return { snappedTime: newDuration, didSnap: false, snapType: null };
    },
    [snapTime]
  );

  // Get visible snap lines for UI overlay
  const getVisibleSnapLines = useCallback(
    (
      draggedClipId: string,
      draggedStart: number,
      draggedEnd: number
    ): { time: number; type: SnapPoint["type"] }[] => {
      if (!enabled) return [];

      const lines: { time: number; type: SnapPoint["type"] }[] = [];

      for (const point of snapPoints) {
        if (point.clipId === draggedClipId) continue;

        const startDist = Math.abs(point.time - draggedStart);
        const endDist = Math.abs(point.time - draggedEnd);

        if (startDist <= timeThreshold || endDist <= timeThreshold) {
          lines.push({ time: point.time, type: point.type });
        }
      }

      return lines;
    },
    [snapPoints, timeThreshold, enabled]
  );

  return {
    snapTime,
    snapClipStart,
    snapClipEnd,
    getVisibleSnapLines,
    snapPoints,
    timeThreshold,
  };
}
