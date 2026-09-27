import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Theater of the Mind protocol (Psycho-Cybernetics, Maxwell Maltz):
 * relax BEFORE the movie so the nervous system accepts it, and hold the
 * winning feeling AFTER it so the new self-image sets.
 */

const BREATH_IN_MS = 4000;
const BREATH_OUT_MS = 6000;
const BREATH_CYCLES = 3;

interface PreludeProps {
  onDone: () => void;
}

/** Quiet Room: three slow breaths before the movie plays (~30 seconds). */
export function TheaterOfMindPrelude({ onDone }: PreludeProps) {
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (phase === "in") {
          setPhase("out");
        } else if (cycle + 1 >= BREATH_CYCLES) {
          doneRef.current();
        } else {
          setCycle((c) => c + 1);
          setPhase("in");
        }
      },
      phase === "in" ? BREATH_IN_MS : BREATH_OUT_MS,
    );
    return () => clearTimeout(t);
  }, [phase, cycle]);

  const captions = [
    "Settle into your Quiet Room. Let your shoulders drop.",
    "Your nervous system can't tell a vividly imagined experience from a real one.",
    "When the movie plays, don't watch it. Be in it. See it from your own eyes.",
  ];

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-cinematic-midnight via-slate-950 to-cinematic-midnight p-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Theater of the Mind</p>
      <div className="relative flex h-40 w-40 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full bg-sky-400/15 border border-sky-300/30"
          style={{
            transform: phase === "in" ? "scale(1)" : "scale(0.55)",
            transition: `transform ${phase === "in" ? BREATH_IN_MS : BREATH_OUT_MS}ms ease-in-out`,
          }}
        />
        <span className="relative font-display text-2xl text-sky-100 tracking-wide">
          {phase === "in" ? "Breathe in" : "Breathe out"}
        </span>
      </div>
      <p className="max-w-md text-sm sm:text-base text-muted-foreground min-h-[3rem]">{captions[cycle]}</p>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          Breath {cycle + 1} of {BREATH_CYCLES}
        </span>
        <Button variant="ghost" size="sm" onClick={onDone} className="text-xs">
          Skip to movie
        </Button>
      </div>
    </div>
  );
}

interface AfterglowProps {
  /** Consecutive viewing days, including today. */
  streak: number;
  onDone: () => void;
}

const HOLD_SECONDS = 60;
const SELF_IMAGE_DAYS = 21;

/** Hold the Winning Feeling for 60 seconds, eyes closed, before planning the day. */
export function TheaterOfMindAfterglow({ streak, onDone }: AfterglowProps) {
  const [remaining, setRemaining] = useState(HOLD_SECONDS);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (remaining <= 0) {
      doneRef.current();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const day = Math.max(1, Math.min(streak, SELF_IMAGE_DAYS));
  const progress = Math.round((day / SELF_IMAGE_DAYS) * 100);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-cinematic-midnight/95 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md text-center space-y-6">
        <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Hold the Winning Feeling</p>
        <p className="font-display text-6xl text-gold tabular-nums">{remaining}</p>
        <p className="text-sm sm:text-base text-muted-foreground">
          Close your eyes. Stay in the final scene. Feel it as done: where you are, who's with you, what it feels like
          in your body. Carry this feeling into your day.
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>New self-image practice</span>
            <span>
              Day {day} of {SELF_IMAGE_DAYS}
              {streak > SELF_IMAGE_DAYS ? " · locked in" : ""}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground/80">
            Maltz observed a new self-image takes about 21 days of daily practice to set.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDone} className="text-xs">
          I'm ready
        </Button>
      </div>
    </div>
  );
}
