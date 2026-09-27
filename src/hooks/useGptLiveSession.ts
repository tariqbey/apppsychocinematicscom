import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoachingContext } from "@/hooks/useCoachingContext";
import { runCoachTool } from "@/lib/coachTools";
import { AnamAvatarBridge } from "@/lib/anamAvatarBridge";
import { claimVoice, releaseVoice } from "@/lib/voiceSessionLock";

/**
 * A GPT-Live (gpt-live-1) voice session over WebRTC, optionally with the Anam
 * live avatar lip-synced to it.
 *
 * gpt-live-1 is full-duplex: it listens while it speaks, handles interruptions and
 * turn-taking itself, and delegates thinking + tool calls to a Responses backend
 * model configured by the gpt-live-session edge function. Tool calls stream back on
 * the data channel as `response.event` messages; we run them here under the user's
 * session and send the results back.
 */

export type LiveStatus = "idle" | "connecting" | "listening" | "speaking" | "thinking" | "error";

export interface TranscriptLine {
  role: "user" | "assistant";
  text: string;
}

type Json = Record<string, unknown>;
type LiveEvent = { type: string; [key: string]: unknown };

/** Returns a result for tools it owns, or undefined to fall through to the coach tools. */
export type ExtraToolHandler = (name: string, args: Json) => Promise<Json | undefined> | Json | undefined;

export interface GptLiveSessionOptions {
  thinkingLevel?: "low" | "medium";
  openingPrompt?: string;
  voice?: string;
  /** Show the Anam avatar in the <video> element with this id. */
  avatarVideoId?: string;
  /** "coach" = Director AI page; "ava" = Ava, the in-app assistant with UI tools. */
  persona?: "coach" | "ava";
  /** Extra context sent at session start (e.g. the current page). */
  extraContext?: () => Json;
  onExtraTool?: ExtraToolHandler;
}

export function useGptLiveSession(options: GptLiveSessionOptions) {
  const { user } = useAuth();
  const { context: coachingContext } = useCoachingContext();
  const [status, setStatus] = useState<LiveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const [avatarLive, setAvatarLive] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const levelRafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pendingToolsRef = useRef(0);
  const handledCallsRef = useRef<Set<string>>(new Set());
  const avatarRef = useRef<AnamAvatarBridge | null>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceIdRef = useRef(Symbol("gpt-live"));
  /** True from the moment start() is called, so a double tap can't open two sessions. */
  const startingRef = useRef(false);
  /** Bumped on every stop, so a start that's still awaiting can tell it was cancelled. */
  const runRef = useRef(0);

  /** gpt-live-1 has no explicit "done speaking" event we rely on: fall back to listening after a quiet gap. */
  const markSpeaking = useCallback(() => {
    setStatus("speaking");
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    speakingTimerRef.current = setTimeout(() => {
      speakingTimerRef.current = null;
      if (pendingToolsRef.current > 0) return;
      setStatus((s) => (s === "speaking" ? "listening" : s));
    }, 1200);
  }, []);

  const appendTranscript = useCallback((role: TranscriptLine["role"], delta: string) => {
    if (!delta) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) return [...prev.slice(0, -1), { role, text: last.text + delta }];
      return [...prev, { role, text: delta }];
    });
  }, []);

  const send = useCallback((event: Json) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") dc.send(JSON.stringify(event));
  }, []);

  const cleanup = useCallback(() => {
    if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current);
    levelRafRef.current = null;
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    speakingTimerRef.current = null;
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
    startingRef.current = false;
    runRef.current += 1;
    releaseVoice(voiceIdRef.current);
    if (audioElRef.current) audioElRef.current.srcObject = null;
    const bridge = avatarRef.current;
    avatarRef.current = null;
    setAvatarLive(false);
    void bridge?.stop();
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const handleFunctionCall = useCallback(
    async (item: { call_id?: string; name?: string; arguments?: string }) => {
      if (!user || !item.call_id || !item.name) return;
      if (handledCallsRef.current.has(item.call_id)) return;
      handledCallsRef.current.add(item.call_id);
      pendingToolsRef.current += 1;
      setStatus("thinking");
      let args: Json = {};
      try {
        args = item.arguments ? JSON.parse(item.arguments) : {};
      } catch {
        args = {};
      }
      let output: Json | undefined;
      try {
        output = await optionsRef.current.onExtraTool?.(item.name, args);
      } catch (e) {
        output = { error: e instanceof Error ? e.message : "Tool failed" };
      }
      if (output === undefined) output = await runCoachTool(user.id, item.name, args);
      send({
        type: "response.item.create",
        item: { type: "function_call_output", call_id: item.call_id, output: JSON.stringify(output) },
      });
      pendingToolsRef.current -= 1;
      // Continue the delegated response once every tool call in the batch has an output.
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
        case "session.input_transcript.delta": {
          const delta = String(event.delta ?? "");
          // The user cut in while the avatar was talking: stop her right away.
          if (delta.trim().length > 1) avatarRef.current?.interrupt();
          appendTranscript("user", delta);
          break;
        }
        case "session.output_transcript.delta":
          markSpeaking();
          appendTranscript("assistant", String(event.delta ?? ""));
          break;
        case "session.delegation.created":
          setStatus("thinking");
          break;
        case "response.event": {
          const nested = (event.event ?? {}) as {
            type?: string;
            item?: { type?: string; call_id?: string; name?: string; arguments?: string };
          };
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
    [appendTranscript, cleanup, handleFunctionCall, markSpeaking],
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
    if (!user || pcRef.current || startingRef.current) return;
    startingRef.current = true;
    const run = runRef.current;
    const cancelled = () => runRef.current !== run;
    // Stop any other voice in the app (Ava or a coach) before this one starts.
    claimVoice(voiceIdRef.current, () => stopRef.current());
    const opts = optionsRef.current;
    setError(null);
    setTranscript([]);
    setStatus("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (cancelled()) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      startLevelMeter(stream);

      // Optional live avatar: start it first so it's ready when the voice arrives.
      let bridge: AnamAvatarBridge | null = null;
      if (opts.avatarVideoId) {
        try {
          bridge = new AnamAvatarBridge();
          await bridge.start(opts.avatarVideoId);
          if (cancelled()) {
            void bridge.stop();
            return;
          }
          avatarRef.current = bridge;
          setAvatarLive(true);
        } catch (avatarError) {
          console.warn("[GPT-Live] avatar unavailable, continuing voice-only", avatarError);
          setError(
            avatarError instanceof Error
              ? `${avatarError.message} Continuing with voice only.`
              : "Avatar unavailable. Continuing with voice only.",
          );
          bridge = null;
        }
        if (cancelled()) return;
      }

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.ontrack = (e) => {
        const remote = e.streams[0];
        const el = audioElRef.current;
        if (el) {
          // With the avatar on, only Ava's video plays the voice (in sync with her lips).
          // The element stays attached but silent, because Chrome only feeds remote
          // WebRTC audio to Web Audio while it's attached to a media element.
          const silent = Boolean(bridge);
          el.muted = silent;
          el.defaultMuted = silent;
          el.volume = silent ? 0 : 1;
          el.srcObject = remote;
        }
        bridge?.attachVoice(remote);
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
          persona: opts.persona ?? "coach",
          thinkingLevel: opts.thinkingLevel ?? "low",
          voice: opts.voice,
          openingPrompt: opts.openingPrompt,
          context: {
            displayName: ctx?.displayName || ctx?.directorCharacterName,
            chiefAim: ctx?.chiefAim?.what,
            archetype: ctx?.characterArchetype,
            streak: ctx?.currentStreak,
            tasksDone: ctx?.completedTasksCount,
            tasksTotal: ctx?.todaysTasks?.length,
            watchedMindMovie: ctx?.watchedMindMovieToday,
            timeOfDay: ctx?.timeOfDay,
            ...(opts.extraContext?.() ?? {}),
          },
        },
      });
      if (fnError || !data?.sdp) {
        let detail = (data as { error?: string } | null)?.error;
        // Non-2xx responses come back as FunctionsHttpError; read our message from the body.
        const res = (fnError as { context?: Response } | null)?.context;
        if (!detail && res && typeof res.json === "function") {
          detail = await res.json().then((b: { error?: string }) => b?.error).catch(() => undefined);
        }
        throw new Error(detail || fnError?.message || "Couldn't start GPT-Live.");
      }
      if (cancelled()) return;
      await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
      startingRef.current = false;
    } catch (e) {
      if (cancelled()) return;
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
  }, [cleanup, coachingContext, handleEvent, startLevelMeter, user]);

  const stop = useCallback(() => {
    send({ type: "session.close" });
    cleanup();
    setStatus("idle");
  }, [cleanup, send]);
  const stopRef = useRef(stop);
  stopRef.current = stop;

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }, []);

  /** Tell the model something happened (e.g. the user navigated) without asking it to speak. */
  const addSilentContext = useCallback(
    (content: string) => send({ type: "session.thinking.append", content: content.slice(0, 1500), delegation_id: null }),
    [send],
  );

  const active = status !== "idle" && status !== "error";

  return {
    user,
    coachingContext,
    status,
    active,
    error,
    muted,
    transcript,
    micLevel,
    avatarLive,
    audioElRef,
    start,
    stop,
    toggleMute,
    addSilentContext,
  };
}
