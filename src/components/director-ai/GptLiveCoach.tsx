import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Loader2, Radio } from "lucide-react";
import { JarvisOrb } from "@/components/director-ai/JarvisOrb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoachingContext } from "@/hooks/useCoachingContext";
import { runCoachTool } from "@/lib/coachTools";

/**
 * Director AI voice coach on OpenAI GPT-Live (gpt-live-1).
 *
 * gpt-live-1 is full-duplex: it listens while it speaks, handles interruptions and
 * turn-taking itself, and delegates thinking + tool calls to a Responses backend
 * model configured by the gpt-live-session edge function. Tool calls stream back on
 * the WebRTC data channel as `response.event` messages; we run them here under the
 * user's session and send the results back.
 */

type Status = "idle" | "connecting" | "listening" | "speaking" | "thinking" | "error";

interface TranscriptLine {
  role: "user" | "assistant";
  text: string;
}


interface GptLiveCoachProps {
  thinkingLevel: "low" | "medium";
  openingPrompt?: string;
  autoStart?: boolean;
  voice?: string;
}

type LiveEvent = { type: string; [key: string]: unknown };

export default function GptLiveCoach({ thinkingLevel, openingPrompt, autoStart, voice }: GptLiveCoachProps) {
  const { user } = useAuth();
  const { context: coachingContext } = useCoachingContext();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [micLevel, setMicLevel] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const levelRafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pendingToolsRef = useRef(0);
  const handledCallsRef = useRef<Set<string>>(new Set());
  const autoStartedRef = useRef(false);

  const appendTranscript = useCallback((role: TranscriptLine["role"], delta: string) => {
    if (!delta) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        return [...prev.slice(0, -1), { role, text: last.text + delta }];
      }
      return [...prev, { role, text: delta }];
    });
  }, []);

  const send = useCallback((event: Record<string, unknown>) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") dc.send(JSON.stringify(event));
  }, []);

  const cleanup = useCallback(() => {
    if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current);
    levelRafRef.current = null;
    dcRef.current?.close();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    void audioCtxRef.current?.close();
    dcRef.current = null;
    pcRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    pendingToolsRef.current = 0;
    handledCallsRef.current.clear();
    setMicLevel(0);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  /** Runs a backend function call and returns its output to the Live session. */
  const handleFunctionCall = useCallback(
    async (item: { call_id?: string; name?: string; arguments?: string }) => {
      if (!user || !item.call_id || !item.name) return;
      if (handledCallsRef.current.has(item.call_id)) return;
      handledCallsRef.current.add(item.call_id);
      pendingToolsRef.current += 1;
      setStatus("thinking");
      let args: Record<string, unknown> = {};
      try {
        args = item.arguments ? JSON.parse(item.arguments) : {};
      } catch {
        args = {};
      }
      const output = await runCoachTool(user.id, item.name, args);
      send({
        type: "response.item.create",
        item: { type: "function_call_output", call_id: item.call_id, output: JSON.stringify(output) },
      });
      pendingToolsRef.current -= 1;
      // Continue the delegated response once every tool call in this batch has an output.
      if (pendingToolsRef.current === 0) send({ type: "response.create" });
    },
    [send, user],
  );

  const handleEvent = useCallback(
    (event: LiveEvent) => {
      switch (event.type) {
        case "session.started":
          setStatus("listening");
          break;
        case "session.input_transcript.delta":
          appendTranscript("user", String(event.delta ?? ""));
          break;
        case "session.output_transcript.delta":
          setStatus("speaking");
          appendTranscript("assistant", String(event.delta ?? ""));
          break;
        case "session.delegation.created":
          setStatus("thinking");
          break;
        case "response.event": {
          const nested = (event.event ?? {}) as { type?: string; item?: { type?: string; call_id?: string; name?: string; arguments?: string } };
          if (nested.type === "response.output_item.done" && nested.item?.type === "function_call") {
            void handleFunctionCall(nested.item);
          }
          break;
        }
        case "session.closed":
          setStatus("idle");
          cleanup();
          break;
        case "error": {
          const err = (event.error ?? {}) as { message?: string };
          console.error("[GPT-Live] error", event);
          setError(err.message || "GPT-Live reported an error.");
          break;
        }
        default:
          break;
      }
    },
    [appendTranscript, cleanup, handleFunctionCall],
  );

  const startLevelMeter = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        setMicLevel(Math.min(1, Math.sqrt(sum / buf.length) * 6));
        levelRafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // The level meter is cosmetic.
    }
  }, []);

  const start = useCallback(async () => {
    if (!user || status === "connecting") return;
    setError(null);
    setTranscript([]);
    setStatus("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      startLevelMeter(stream);

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.ontrack = (e) => {
        if (audioElRef.current) audioElRef.current.srcObject = e.streams[0];
      };
      stream.getAudioTracks().forEach((track) => pc.addTrack(track, stream));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (msg) => {
        try {
          handleEvent(JSON.parse(msg.data));
        } catch (e) {
          console.warn("[GPT-Live] bad event", e);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const ctx = coachingContext;
      const { data, error: fnError } = await supabase.functions.invoke("gpt-live-session", {
        body: {
          sdp: offer.sdp,
          thinkingLevel,
          voice,
          openingPrompt,
          context: {
            displayName: ctx?.displayName || ctx?.directorCharacterName,
            chiefAim: ctx?.chiefAim?.what,
            archetype: ctx?.characterArchetype,
            streak: ctx?.currentStreak,
            tasksDone: ctx?.completedTasksCount,
            tasksTotal: ctx?.todaysTasks?.length,
            watchedMindMovie: ctx?.watchedMindMovieToday,
            timeOfDay: ctx?.timeOfDay,
          },
        },
      });
      if (fnError || !data?.sdp) {
        let detail = (data as { error?: string } | null)?.error;
        // Non-2xx responses come back as FunctionsHttpError; read our error message from the body.
        const ctxResponse = (fnError as { context?: Response } | null)?.context;
        if (!detail && ctxResponse && typeof ctxResponse.json === "function") {
          detail = await ctxResponse.json().then((b: { error?: string }) => b?.error).catch(() => undefined);
        }
        throw new Error(detail || fnError?.message || "Couldn't start GPT-Live.");
      }
      await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
    } catch (e) {
      console.error("[GPT-Live] start failed", e);
      const message =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Microphone permission denied. Allow mic access in your browser, then try again."
          : e instanceof Error
            ? e.message
            : "Couldn't start GPT-Live.";
      setError(message);
      setStatus("error");
      cleanup();
    }
  }, [cleanup, coachingContext, handleEvent, openingPrompt, startLevelMeter, status, thinkingLevel, user, voice]);

  const stop = useCallback(() => {
    send({ type: "session.close" });
    cleanup();
    setStatus("idle");
  }, [cleanup, send]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }, [muted]);

  useEffect(() => {
    if (autoStart && !autoStartedRef.current && user && coachingContext) {
      autoStartedRef.current = true;
      void start();
    }
  }, [autoStart, coachingContext, start, user]);

  const orbState = status === "speaking" ? "speaking" : status === "thinking" || status === "connecting" ? "processing" : status === "listening" ? "listening" : "idle";
  const active = status !== "idle" && status !== "error";

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <audio ref={audioElRef} autoPlay className="hidden" />

      <div className="relative">
        <JarvisOrb state={orbState} audioLevel={status === "speaking" ? 0.6 : muted ? 0 : micLevel} />
      </div>

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
