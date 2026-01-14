import { useCallback, useMemo } from "react";
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

  // Generate all snap points
  const snapPoints = useMemo((): SnapPoint[] => {
    if (!enabled) return [];

    const points: SnapPoint[] = [];

    // Add clip edges (excluding the clip being dragged)
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

    // Add grid markers (every gridInterval seconds up to 5 minutes)
    const maxTime = 300; // 5 minutes
    for (let t = 0; t <= maxTime; t += gridInterval) {
      points.push({
        time: t,
        type: "grid",
      });
    }

    return points;
  }, [clips, currentTime, gridInterval, enabled]);

  // Snap a time value to nearest snap point
  const snapTime = useCallback(
    (time: number, excludeClipId?: string): SnapResult => {
      if (!enabled) {
        return { snappedTime: time, didSnap: false, snapType: null };
      }

      let closest: SnapPoint | null = null;
      let closestDistance = Infinity;

      for (const point of snapPoints) {
        // Skip the clip being dragged
        if (excludeClipId && point.clipId === excludeClipId) continue;

        const distance = Math.abs(point.time - time);
        if (distance < closestDistance && distance <= timeThreshold) {
          closestDistance = distance;
          closest = point;
        }
      }

      if (closest) {
        return {
          snappedTime: closest.time,
          didSnap: true,
          snapType: closest.type,
        };
      }

      return { snappedTime: time, didSnap: false, snapType: null };
    },
    [snapPoints, timeThreshold, enabled]
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
          snappedTime: result.snappedTime - startTime, // Return as duration
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

        // Show snap line if dragged clip edge is near this point
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
