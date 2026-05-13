import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleGenAI, Modality, type Session, type LiveServerMessage } from "@google/genai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoachingContext } from "@/hooks/useCoachingContext";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Brain, Power } from "lucide-react";
import { JarvisOrb } from "@/components/director-ai/JarvisOrb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Status = "idle" | "connecting" | "connected" | "listening" | "speaking" | "thinking" | "reconnecting" | "error";

const MODEL = "gemini-live-2.5-flash-preview";
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const MAX_RECONNECT_ATTEMPTS = 3;

// PCM16 base64 helpers
const pcm16ToBase64 = (int16: Int16Array) => {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
};

const base64ToPCM16 = (b64: string) => {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
};

interface Props {
  thinkingLevel: "low" | "medium";
  onStatusChange?: (s: Status) => void;
}

export default function VoiceCoach({ thinkingLevel, onStatusChange }: Props) {
  const { user } = useAuth();
  const { context: coachingContext } = useCoachingContext();
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [debugLines, setDebugLines] = useState<string[]>(["Voice session idle"]);
  const [audioChunksSent, setAudioChunksSent] = useState(0);

  const sessionRef = useRef<Session | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackTimeRef = useRef(0);
  const currentInputTextRef = useRef("");
  const currentOutputTextRef = useRef("");
  const lastLevelUpdateRef = useRef(0);
  const socketClosedDuringConnectRef = useRef(false);
  const shouldStayConnectedRef = useRef(false);
  const manualDisconnectRef = useRef(false);
  const suppressNextCloseRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const healthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectRef = useRef<((isReconnect?: boolean) => Promise<void>) | null>(null);
  const lastAudioLogRef = useRef(0);
  const lastAudioSentMsRef = useRef(0);
  const audioChunksSentRef = useRef(0);

  const logDebug = useCallback((line: string, data?: unknown) => {
    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const message = `${stamp} ${line}`;
    console.log(`[DirectorAI Voice] ${line}`, data ?? "");
    setDebugLines((prev) => [...prev.slice(-7), message]);
  }, []);

  const updateStatus = useCallback((s: Status) => {
    setStatus(s);
    onStatusChange?.(s);
  }, [onStatusChange]);

  const stopMic = useCallback(() => {
    try { procRef.current?.disconnect(); } catch {}
    try { sourceRef.current?.disconnect(); } catch {}
    try { inputCtxRef.current?.close(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    procRef.current = null;
    sourceRef.current = null;
    inputCtxRef.current = null;
    streamRef.current = null;
    setMicLevel(0);
  }, []);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (healthTimerRef.current) clearInterval(healthTimerRef.current);
    reconnectTimerRef.current = null;
    healthTimerRef.current = null;
  }, []);

  const scheduleReconnect = useCallback((reason: string) => {
    if (!shouldStayConnectedRef.current || manualDisconnectRef.current) return;
    if (reconnectTimerRef.current) return;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      const message = "Live session dropped. Tap Start Live Session to retry.";
      setMicError(message);
      logDebug(`Reconnect stopped: ${reason}`);
      toast.error(message);
      updateStatus("error");
      return;
    }
    reconnectAttemptsRef.current += 1;
    const delay = Math.min(1000 * reconnectAttemptsRef.current, 3000);
    updateStatus("reconnecting");
    logDebug(`Reconnect ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms: ${reason}`);
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRef.current?.(true);
    }, delay);
  }, [logDebug, updateStatus]);

  const startHealthCheck = useCallback(() => {
    if (healthTimerRef.current) clearInterval(healthTimerRef.current);
    healthTimerRef.current = setInterval(() => {
      const conn = sessionRef.current?.conn as unknown as WebSocket | undefined;
      if (!shouldStayConnectedRef.current || !conn) return;
      if (conn.readyState !== WebSocket.OPEN) {
        logDebug(`Health check failed: socket state ${conn.readyState}`);
        scheduleReconnect("health check detected a closed socket");
      }
    }, 2500);
  }, [logDebug, scheduleReconnect]);

  const assertMicAvailable = useCallback(async () => {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone is not available in this browser. Use Chrome or Safari and reload the app.");
    }
    try {
      if (navigator.permissions?.query) {
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
        logDebug(`Microphone permission: ${permission.state}`);
        if (permission.state === "denied") {
          throw new Error("Microphone blocked. Enable microphone access in your browser settings, then reload this page.");
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("Microphone blocked")) throw e;
      logDebug("Microphone permission query unavailable; requesting mic directly");
    }
  }, [logDebug]);

  // ===== Tool handlers =====
  const callTool = useCallback(async (name: string, args: Record<string, unknown>) => {
    if (!user) return { error: "Not authenticated" };
    try {
      if (name === "getCurrentChiefAim") {
        const { data } = await supabase
          .from("user_profiles")
          .select("chief_aim_what, chief_aim_by_when, chief_aim_exchange, chief_aim_plan")
          .eq("user_id", user.id)
          .maybeSingle();
        return data ?? { error: "No chief aim set" };
      }
      if (name === "getLastJournalEntry") {
        const { data } = await supabase
          .from("journal_entries")
          .select("title, content, mood, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return data ?? { error: "No journal entries yet" };
      }
      if (name === "saveSessionNote") {
        const note = String(args.note ?? "").trim();
        const topic = args.topic ? String(args.topic) : null;
        if (!note) return { error: "Empty note" };
        const { error } = await supabase
          .from("coaching_session_notes")
          .insert({ user_id: user.id, note, topic });
        if (error) return { error: error.message };
        return { success: true };
      }
      return { error: `Unknown tool: ${name}` };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Tool failed" };
    }
  }, [user]);

  // ===== Build system prompt =====
  const buildSystemPrompt = useCallback(() => {
    const name = coachingContext?.displayName || coachingContext?.directorCharacterName || "Director";
    const aim = coachingContext?.chiefAim?.what || "(not set yet)";
    const archetype = coachingContext?.characterArchetype || "(not set)";
    const streak = coachingContext?.currentStreak ?? 0;

    return `You are the Director AI — a real-time conversational coach in the Psycho-Cinematics™ system.

You blend two methodologies into one voice:
1. Maxwell Maltz (Psycho-Cybernetics): the self-image is the operating system. Your job is to help the user act AS IF they are already their highest character. The nervous system cannot tell vivid imagination from reality.
2. Napoleon Hill (Think and Grow Rich + Law of Success): definite chief aim, mastermind, persistence, autosuggestion, organized thought, and the seed of equivalent advantage in every adversity.

Your voice is urban, direct, present-tense. You sound like a real human coach in a one-on-one session — not corporate, not preachy, not a wellness app. You talk to ${name} like you've known them for years. You don't use disclaimers. You don't say "as an AI". You don't read bullet lists out loud. Speak in short sentences. Pause naturally.

Coaching framework — use this every conversation:
- MIRROR what they said so they know they were heard.
- DIAGNOSE the root pattern (excuse, fear, identity gap, lack of clarity).
- PRESCRIBE one specific, doable action tied to their Chief Aim.

Hard rules:
- Never co-sign bullshit. Call out excuse patterns directly but with respect.
- Don't lecture. Ask sharp questions. Let them do the work.
- Anchor everything back to their Chief Aim and their Director Character.
- If you don't know something about them, CALL THE TOOL. Don't guess.

Tools available:
- getCurrentChiefAim — pull their definite chief aim before giving direction.
- getLastJournalEntry — read what's actually on their mind right now.
- saveSessionNote — when something important is decided or surfaced, save it.

Use tools naturally. You don't have to announce them.

What you already know about ${name}:
- Chief Aim: ${aim}
- Archetype: ${archetype}
- Current streak: ${streak} days
- Time of day: ${coachingContext?.timeOfDay ?? "unknown"}

Open the conversation by greeting them by name in 1-2 sentences and asking one direct question that moves them forward. Don't introduce yourself.`;
  }, [coachingContext]);

  // ===== Audio playback queue (PCM 24kHz) =====
  const playPCMChunk = useCallback((b64: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;
    const pcm16 = base64ToPCM16(b64);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;
    const buffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(float32, 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime, playbackTimeRef.current);
    src.start(startAt);
    playbackTimeRef.current = startAt + buffer.duration;
    updateStatus("speaking");
    src.onended = () => {
      if (ctx.currentTime >= playbackTimeRef.current - 0.05) {
        updateStatus("listening");
      }
    };
  }, [updateStatus]);

  // ===== Handle messages from Gemini =====
  const handleMessage = useCallback(async (msg: LiveServerMessage) => {
    // Tool calls
    const toolCall = (msg as any).toolCall;
    if (toolCall?.functionCalls?.length) {
      updateStatus("thinking");
      const responses = await Promise.all(
        toolCall.functionCalls.map(async (fc: any) => ({
          id: fc.id,
          name: fc.name,
          response: await callTool(fc.name, fc.args ?? {}),
        })),
      );
      sessionRef.current?.sendToolResponse({ functionResponses: responses });
      return;
    }

    const sc = msg.serverContent as any;
    if (!sc) return;

    // Input transcription (what user said)
    if (sc.inputTranscription?.text) {
      currentInputTextRef.current += sc.inputTranscription.text;
    }
    // Output transcription (what AI is saying)
    if (sc.outputTranscription?.text) {
      currentOutputTextRef.current += sc.outputTranscription.text;
    }

    // Audio + text parts
    const parts = sc.modelTurn?.parts ?? [];
    for (const part of parts) {
      const inline = part.inlineData;
      if (inline?.data && typeof inline.mimeType === "string" && inline.mimeType.startsWith("audio/")) {
        playPCMChunk(inline.data);
      }
    }

    if (sc.turnComplete) {
      const userText = currentInputTextRef.current.trim();
      const aiText = currentOutputTextRef.current.trim();
      if (userText) setTranscript((t) => [...t, { role: "user", text: userText }]);
      if (aiText) setTranscript((t) => [...t, { role: "assistant", text: aiText }]);
      currentInputTextRef.current = "";
      currentOutputTextRef.current = "";
    }
    if (sc.interrupted) {
      // Reset playback queue on barge-in
      playbackTimeRef.current = 0;
      updateStatus("listening");
    }
  }, [callTool, playPCMChunk, updateStatus]);

  // ===== Start mic streaming =====
  const startMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: INPUT_SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    streamRef.current = stream;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
    inputCtxRef.current = ctx;
    if (ctx.state === "suspended") await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    procRef.current = proc;
    proc.onaudioprocess = (e) => {
      if (!sessionRef.current) return;
      const f32 = e.inputBuffer.getChannelData(0);
      const i16 = new Int16Array(f32.length);
      let sum = 0;
      for (let i = 0; i < f32.length; i++) {
        const s = Math.max(-1, Math.min(1, f32[i]));
        sum += s * s;
        i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      const now = performance.now();
      if (now - lastLevelUpdateRef.current > 100) {
        lastLevelUpdateRef.current = now;
        setMicLevel(Math.min(1, Math.sqrt(sum / f32.length) * 8));
      }
      try {
        sessionRef.current.sendRealtimeInput({
          audio: { data: pcm16ToBase64(i16), mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}` },
        });
      } catch {
        // ignore — session may be closing
      }
    };
    source.connect(proc);
    proc.connect(ctx.destination);
  }, []);

  // ===== Connect to Gemini Live =====
  const connect = useCallback(async () => {
    if (status === "connecting" || status === "connected" || status === "listening" || status === "speaking") return;
    updateStatus("connecting");
    try {
      // Create and resume output audio immediately from the user's click so
      // browser autoplay policies don't silently block Gemini's voice later.
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      outputCtxRef.current = outCtx;
      playbackTimeRef.current = 0;
      if (outCtx.state === "suspended") await outCtx.resume();

      // 1. Mint ephemeral token
      const { data: sessData } = await supabase.auth.getSession();
      const accessToken = sessData?.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      const tokenResp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-live-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        },
      );
      if (!tokenResp.ok) throw new Error("Could not mint live token");
      const { token } = await tokenResp.json();

      // 3. Connect to Live API with ephemeral token
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: "v1alpha" },
      });
      socketClosedDuringConnectRef.current = false;

      const session = await ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: buildSystemPrompt(),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "getCurrentChiefAim",
                  description: "Pull the user's current Definite Chief Aim (the what, by when, exchange, and plan).",
                  parameters: { type: "OBJECT" as any, properties: {} },
                },
                {
                  name: "getLastJournalEntry",
                  description: "Read the user's most recent journal entry to understand their current state of mind.",
                  parameters: { type: "OBJECT" as any, properties: {} },
                },
                {
                  name: "saveSessionNote",
                  description: "Save an important insight, decision, or commitment that surfaced during this coaching session.",
                  parameters: {
                    type: "OBJECT" as any,
                    properties: {
                      note: { type: "STRING" as any, description: "The insight or commitment to remember." },
                      topic: { type: "STRING" as any, description: "Optional short topic label." },
                    },
                    required: ["note"],
                  },
                },
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            updateStatus("connected");
          },
          onmessage: handleMessage,
          onerror: (e: ErrorEvent) => {
            console.error("Live error", e);
            toast.error("Live connection error");
            updateStatus("error");
          },
          onclose: () => {
            socketClosedDuringConnectRef.current = true;
            updateStatus("idle");
          },
        },
      });
      sessionRef.current = session;

      if (socketClosedDuringConnectRef.current) {
        throw new Error("Live connection closed before the microphone was ready");
      }

      // 4. Start mic
      await startMic();
      if (socketClosedDuringConnectRef.current) {
        throw new Error("Live connection closed before audio streaming started");
      }
      updateStatus("listening");

      // 5. Kick off greeting
      session.sendClientContent({
        turns: [{ role: "user", parts: [{ text: "Open the session. Greet me by name." }] }],
        turnComplete: true,
      });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to connect");
      updateStatus("error");
    }
  }, [status, buildSystemPrompt, handleMessage, startMic, thinkingLevel, updateStatus]);

  const disconnect = useCallback(() => {
    try { procRef.current?.disconnect(); } catch {}
    try { sourceRef.current?.disconnect(); } catch {}
    try { inputCtxRef.current?.close(); } catch {}
    try { outputCtxRef.current?.close(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    sessionRef.current?.close();
    sessionRef.current = null;
    procRef.current = null;
    sourceRef.current = null;
    inputCtxRef.current = null;
    outputCtxRef.current = null;
    streamRef.current = null;
    playbackTimeRef.current = 0;
    setMicLevel(0);
    updateStatus("idle");
  }, [updateStatus]);

  useEffect(() => () => disconnect(), [disconnect]);

  const isLive = status === "connected" || status === "listening" || status === "speaking" || status === "thinking";
  const orbState =
    status === "speaking" ? "speaking" :
    status === "thinking" || status === "connecting" ? "processing" :
    status === "listening" || status === "connected" ? "listening" :
    "idle";

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="relative">
        <JarvisOrb state={orbState as any} audioLevel={status === "speaking" ? 0.6 : micLevel} />
      </div>

      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gold/80">
          {status === "idle" && "Tap to start session"}
          {status === "connecting" && "Connecting..."}
          {status === "connected" && "Live"}
          {status === "listening" && "Listening"}
          {status === "speaking" && "Speaking"}
          {status === "thinking" && "Thinking"}
          {status === "error" && "Error — tap to retry"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {!isLive ? (
          <Button
            size="lg"
            onClick={connect}
            disabled={status === "connecting"}
            className="bg-gold text-black hover:bg-gold/90 rounded-full px-8"
          >
            {status === "connecting" ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Mic className="w-5 h-5 mr-2" />
            )}
            Start Live Session
          </Button>
        ) : (
          <Button
            size="lg"
            variant="destructive"
            onClick={disconnect}
            className="rounded-full px-8"
          >
            <Power className="w-5 h-5 mr-2" />
            End Session
          </Button>
        )}
      </div>

      {transcript.length > 0 && (
        <div className="w-full max-w-2xl mt-4 max-h-64 overflow-y-auto px-4 space-y-3">
          {transcript.slice(-10).map((m, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                m.role === "assistant"
                  ? "bg-card/60 border border-gold/20 text-foreground"
                  : "bg-muted/40 border border-border text-muted-foreground ml-8",
              )}
            >
              <span className={cn(
                "block text-[10px] uppercase tracking-wider mb-1",
                m.role === "assistant" ? "text-gold" : "text-muted-foreground/70",
              )}>
                {m.role === "assistant" ? "Director AI" : "You"}
              </span>
              {m.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
