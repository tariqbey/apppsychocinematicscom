import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Loader2, Radio } from "lucide-react";
import { JarvisOrb } from "@/components/director-ai/JarvisOrb";
import { useGptLiveSession } from "@/hooks/useGptLiveSession";

/** Director AI voice coach on OpenAI GPT-Live (gpt-live-1), optionally with the Ava avatar. */

const AVATAR_VIDEO_ID = "director-ai-avatar-video";

interface GptLiveCoachProps {
  thinkingLevel: "low" | "medium";
  openingPrompt?: string;
  autoStart?: boolean;
  voice?: string;
  /** Show the Anam live avatar, lip-synced to the GPT-Live voice. */
  avatar?: boolean;
}

export default function GptLiveCoach({ thinkingLevel, openingPrompt, autoStart, voice, avatar = false }: GptLiveCoachProps) {
  const live = useGptLiveSession({
    thinkingLevel,
    openingPrompt,
    voice,
    persona: "coach",
    avatarVideoId: avatar ? AVATAR_VIDEO_ID : undefined,
  });
  const { status, active, error, muted, transcript, micLevel, avatarLive, audioElRef, start, stop, toggleMute, user, coachingContext } = live;

  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStart && !autoStartedRef.current && user && coachingContext) {
      autoStartedRef.current = true;
      void start();
    }
  }, [autoStart, coachingContext, start, user]);

  const orbState =
    status === "speaking" ? "speaking" : status === "thinking" || status === "connecting" ? "processing" : status === "listening" ? "listening" : "idle";
  const orb = <JarvisOrb state={orbState} audioLevel={status === "speaking" ? 0.6 : muted ? 0 : micLevel} />;

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <audio ref={audioElRef} autoPlay className="hidden" />

      {avatar ? (
        <div className="relative w-full max-w-md aspect-[3/4] sm:aspect-video sm:max-w-2xl overflow-hidden rounded-2xl border border-gold/25 bg-card/40 shadow-2xl shadow-gold/10">
          <video id={AVATAR_VIDEO_ID} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
          {!avatarLive && <div className="absolute inset-0 flex items-center justify-center">{orb}</div>}
        </div>
      ) : (
        <div className="relative">{orb}</div>
      )}

      <div className="text-center min-h-[2.5rem]">
        <p className="text-sm uppercase tracking-[0.2em] text-gold/80">
          {status === "idle" && "Tap to start session"}
          {status === "connecting" && "Connecting to GPT-Live..."}
          {status === "listening" && (muted ? "Muted" : "Listening")}
          {status === "speaking" && "Speaking"}
          {status === "thinking" && "Working on it"}
          {status === "error" && "Couldn't connect"}
        </p>
        {error && <p className="text-xs text-red-300 mt-1 max-w-sm">{error}</p>}
      </div>

      <div className="flex items-center gap-3">
        {!active ? (
          <Button variant="gold" size="lg" onClick={start} disabled={!user} className="gap-2 rounded-full px-8">
            <Radio className="w-4 h-4" /> Start Live Session
          </Button>
        ) : (
          <>
            <Button variant="outline" size="icon" onClick={toggleMute} className="rounded-full h-12 w-12" aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button variant="destructive" size="lg" onClick={stop} className="gap-2 rounded-full px-6">
              {status === "connecting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4" />}
              End
            </Button>
          </>
        )}
      </div>

      {transcript.length > 0 && (
        <div className="w-full max-w-xl max-h-72 overflow-y-auto space-y-2 rounded-xl border border-gold/15 bg-card/30 p-4">
          {transcript.map((line, i) => (
            <p key={i} className={line.role === "user" ? "text-sm text-muted-foreground" : "text-sm text-foreground"}>
              <span className={line.role === "user" ? "text-xs uppercase tracking-wide text-muted-foreground/70 mr-2" : "text-xs uppercase tracking-wide text-gold/80 mr-2"}>
                {line.role === "user" ? "You" : "Director"}
              </span>
              {line.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
