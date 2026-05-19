import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleGenAI, Modality, type Session, type LiveServerMessage, type LiveConnectConfig } from "@google/genai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoachingContext } from "@/hooks/useCoachingContext";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Brain, Power } from "lucide-react";
import { JarvisOrb } from "@/components/director-ai/JarvisOrb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Status = "idle" | "connecting" | "connected" | "listening" | "speaking" | "thinking" | "reconnecting" | "error";

const MODEL = "gemini-3.1-flash-live-preview";
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
  const hasOpenedRef = useRef(false);
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
    console.log(`[DirectorAI Voice] ${line}`, data ?? "");
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
    if (!hasOpenedRef.current) {
      const message = "Live session could not stay connected. Please try again.";
      shouldStayConnectedRef.current = false;
      setMicError(message);
      logDebug(`Reconnect blocked before healthy open: ${reason}`);
      toast.error(message);
      updateStatus("error");
      return;
    }
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      const message = "Live session dropped. Tap Start Live Session to retry.";
      setMicError(message);
      logDebug(`Reconnect stopped: ${reason}`);
      toast.error(message);
      shouldStayConnectedRef.current = false;
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
    // Disabled: SDK does not expose underlying socket reliably.
    // We rely on the onclose callback to trigger reconnect when needed.
    if (healthTimerRef.current) clearInterval(healthTimerRef.current);
    healthTimerRef.current = null;
  }, []);

  const assertMicAvailable = useCallback(async () => {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone is not available in this browser. Use Chrome or Safari and reload the app.");
    }
    try {
      if (navigator.permissions?.query) {
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
        console.log(`[DirectorAI Voice] Microphone permission: ${permission.state}`);
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
    const today = new Date().toISOString().split("T")[0];
    try {
      if (name === "getCurrentChiefAim") {
        const { data } = await supabase
          .from("user_profiles")
          .select("chief_aim_what, chief_aim_by_when, chief_aim_exchange, chief_aim_plan, director_character_name, display_name")
          .eq("user_id", user.id)
          .maybeSingle();
        return data ?? { error: "No chief aim set" };
      }
      if (name === "getRecentJournalEntries") {
        const { data } = await supabase
          .from("journal_entries")
          .select("title, content, mood, ai_analysis, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);
        return data && data.length ? { entries: data } : { error: "No journal entries yet" };
      }
      if (name === "getTodaysTasks") {
        const { data } = await supabase
          .from("daily_tasks")
          .select("task_text, is_completed, incomplete_reason, priority")
          .eq("user_id", user.id)
          .eq("task_date", today)
          .order("priority", { ascending: true });
        if (!data || data.length === 0) return { error: "No tasks set for today — they haven't locked in their Three Things." };
        const completed = data.filter((t: any) => t.is_completed).length;
        return { total: data.length, completed, tasks: data };
      }
      if (name === "getTodaysRituals") {
        const { data } = await supabase
          .from("daily_rituals")
          .select("morning_screening, script_review, chief_aim_listened, action_execution, evening_review, journal_entry")
          .eq("user_id", user.id)
          .eq("ritual_date", today)
          .maybeSingle();
        return data ?? { error: "No ritual data recorded today." };
      }
      if (name === "getRecentExcuses") {
        const { data } = await supabase
          .from("daily_tasks")
          .select("task_text, incomplete_reason, task_date")
          .eq("user_id", user.id)
          .eq("is_completed", false)
          .not("incomplete_reason", "is", null)
          .order("task_date", { ascending: false })
          .limit(10);
        if (!data || data.length === 0) return { excuses: [], message: "No recent excuses logged." };
        const counts: Record<string, number> = {};
        data.forEach((t: any) => {
          if (t.incomplete_reason) counts[t.incomplete_reason] = (counts[t.incomplete_reason] || 0) + 1;
        });
        return { patterns: counts, recent: data };
      }
      if (name === "getTodaysScorecard") {
        const { data } = await supabase
          .from("daily_scorecards")
          .select("total_score, scorecard_date")
          .eq("user_id", user.id)
          .eq("scorecard_date", today)
          .maybeSingle();
        return data ?? { error: "No scorecard filled out today." };
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
    const tasksDone = coachingContext?.completedTasksCount ?? 0;
    const tasksTotal = coachingContext?.todaysTasks?.length ?? 0;
    const watchedMM = coachingContext?.watchedMindMovieToday ? "yes" : "no";

    return `You are the Director AI — a real-time voice coach in the Psycho-Cinematics™ system.

You blend Maxwell Maltz (Psycho-Cybernetics: act AS IF you are already the highest character) and Napoleon Hill (Definite Chief Aim, persistence, autosuggestion, KUT/self-control, seed of equivalent advantage in every adversity).

VOICE: Urban, blunt, swag, present-tense. You talk to ${name} like a real coach who's been with them for years. No corporate fluff. No wellness-app vibes. No "as an AI" disclaimers. Short sentences. Pause naturally.

Signature lines you actually use when the data warrants it:
- "Yo, you bullshittin' today?" — when actions don't match the Chief Aim.
- "Whose movie you in right now?" — when they're reactive to other people's scripts.
- "You playin' an appropriate role, or you need to call KUT and get back to your script?"
- "Keep pushin', baby, you almost there." — when they're executing.
- "That's old script energy. What would your Director Character do RIGHT NOW?"

COACHING FRAMEWORK every turn:
1. MIRROR — show you heard exactly what they said.
2. DIAGNOSE — name the real pattern (excuse, fear, identity gap, off-script behavior).
3. PRESCRIBE — ONE specific action tied to their Chief Aim.

HARD ANTI-LOOP RULES (CRITICAL):
- NEVER repeat the same question or phrasing you already used this session. If they didn't answer, CHANGE the angle — make a statement, give a directive, or ask something different.
- If you've asked something twice without a clear answer, STOP asking. Make a coaching call: prescribe an action or name the silence.
- Vary openers every turn. No "Alright Director" twice. No "Real talk" twice. No "Let's get it" twice.
- Each response is the NEXT beat in the conversation, not a reset.

HARD RULES:
- Never co-sign bullshit. Call patterns out directly, with respect, with swag.
- Don't lecture. Sharp questions or sharp directives only.
- Anchor everything to their Chief Aim and their Director Character.
- If you don't know something current about them, CALL A TOOL. Don't guess.
- Spell out ALL numbers as words for TTS: "seven" not "7", "thirty" not "30".

TOOLS (use them silently, don't announce):
- getCurrentChiefAim — their Definite Chief Aim.
- getRecentJournalEntries — what's been on their mind.
- getTodaysTasks — today's Three Things and completion status.
- getTodaysRituals — morning screening, script review, action execution, evening review, journal, anthem.
- getRecentExcuses — incomplete-task reasons so you can name the pattern.
- getTodaysScorecard — today's self-score.
- saveSessionNote — when something important gets committed to, save it.

WHAT YOU ALREADY KNOW ABOUT ${name}:
- Chief Aim: ${aim}
- Archetype: ${archetype}
- Current streak: ${streak} days
- Today's tasks completed: ${tasksDone} of ${tasksTotal}
- Watched Mind Movie today: ${watchedMM}
- Time of day: ${coachingContext?.timeOfDay ?? "unknown"}

OPENING: Greet ${name} by name in one or two sentences, drop a fast read on their current status (celebrate if winning, call bullshit if slipping), and ask ONE direct question that moves them forward. Don't introduce yourself. Don't recite stats robotically — interpret them.`;
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
    if (streamRef.current && procRef.current) {
      logDebug("Microphone stream already active");
      return;
    }
    await assertMicAvailable();
    let stream: MediaStream;
    try {
      logDebug("Requesting microphone stream");
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: INPUT_SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "UnknownError";
      const message =
        name === "NotAllowedError" ? "Microphone permission denied. Click the lock icon in the address bar and allow microphone access." :
        name === "NotFoundError" ? "No microphone found. Connect a microphone, then tap Start Live Session again." :
        name === "NotReadableError" ? "Microphone is busy or unavailable. Close other apps using it, then retry." :
        "Microphone could not start. Check your browser mic settings and retry.";
      setMicError(message);
      logDebug(`Microphone error: ${name}`);
      throw new Error(message);
    }
    streamRef.current = stream;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
    inputCtxRef.current = ctx;
    if (ctx.state === "suspended") await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    procRef.current = proc;
    proc.onaudioprocess = (e) => {
      const session = sessionRef.current;
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
        const level = Math.min(1, Math.sqrt(sum / f32.length) * 8);
        setMicLevel(level);
        if (level > 0.02 && now - lastAudioLogRef.current > 1500) {
          lastAudioLogRef.current = now;
          logDebug(`Audio captured: level ${level.toFixed(2)}`);
        }
      }
      if (!session) return;
      try {
        session.sendRealtimeInput({
          audio: { data: pcm16ToBase64(i16), mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}` },
        });
        audioChunksSentRef.current += 1;
        lastAudioSentMsRef.current = Date.now();
        if (audioChunksSentRef.current === 1 || audioChunksSentRef.current % 25 === 0) {
          logDebug(`Audio sent: ${audioChunksSentRef.current} chunks`);
        }
      } catch (e) {
        logDebug("Audio send failed; socket may be closing", e);
      }
    };
    source.connect(proc);
    proc.connect(ctx.destination);
    logDebug("Microphone stream active");
  }, [assertMicAvailable, logDebug]);

  // ===== Connect to Gemini Live =====
  const connect = useCallback(async (isReconnect = false) => {
    if (!isReconnect && ["connecting", "connected", "listening", "speaking", "thinking", "reconnecting"].includes(status)) return;
    manualDisconnectRef.current = false;
    shouldStayConnectedRef.current = true;
    setMicError(null);
    updateStatus(isReconnect ? "reconnecting" : "connecting");
    logDebug(isReconnect ? "Reconnecting Live session" : "Starting Live session");
    try {
      if (sessionRef.current) {
        suppressNextCloseRef.current = true;
        try { sessionRef.current.close(); } catch {}
        sessionRef.current = null;
      }
      if (outputCtxRef.current) {
        try { await outputCtxRef.current.close(); } catch {}
        outputCtxRef.current = null;
      }

      // Create and resume output audio immediately from the user's click so
      // browser autoplay policies don't silently block Gemini's voice later.
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      outputCtxRef.current = outCtx;
      playbackTimeRef.current = 0;
      if (outCtx.state === "suspended") await outCtx.resume();

      // Request mic early from the user gesture; reconnects reuse the same stream.
      await startMic();

      // 1. Mint ephemeral token
      logDebug("Minting Live token");
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
      logDebug("Live token ready; opening socket");

      // 3. Connect to Live API with ephemeral token
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: "v1alpha" },
      });
      socketClosedDuringConnectRef.current = false;
      hasOpenedRef.current = false;

      const liveConfig: LiveConnectConfig = {
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
                  description: "Pull the user's current Definite Chief Aim (the what, by when, exchange, and plan) plus their Director Character name.",
                  parameters: { type: "OBJECT" as any, properties: {} },
                },
                {
                  name: "getRecentJournalEntries",
                  description: "Read the user's most recent journal entries (up to 3) including mood and AI analysis to understand what's on their mind.",
                  parameters: { type: "OBJECT" as any, properties: {} },
                },
                {
                  name: "getTodaysTasks",
                  description: "Check today's Three Things: which are done, which are pending. Use this to call out bullshit or celebrate execution.",
                  parameters: { type: "OBJECT" as any, properties: {} },
                },
                {
                  name: "getTodaysRituals",
                  description: "Check today's ritual execution: morning screening, script review, action execution, evening review, journal, anthem listen.",
                  parameters: { type: "OBJECT" as any, properties: {} },
                },
                {
                  name: "getRecentExcuses",
                  description: "Pull the user's recent incomplete-task reasons so you can name their excuse patterns directly.",
                  parameters: { type: "OBJECT" as any, properties: {} },
                },
                {
                  name: "getTodaysScorecard",
                  description: "Get today's daily scorecard score if they filled it out.",
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
      };

      const session = await ai.live.connect({
        model: MODEL,
        config: liveConfig,
        callbacks: {
          onopen: () => {
            logDebug("Live socket open");
            hasOpenedRef.current = true;
            reconnectAttemptsRef.current = 0;
            updateStatus("connected");
          },
          onmessage: handleMessage,
          onerror: (e: ErrorEvent) => {
            console.error("Live error", e);
            logDebug("Live socket error", e);
            scheduleReconnect("socket error");
          },
          onclose: (event: CloseEvent) => {
            socketClosedDuringConnectRef.current = true;
            logDebug(`Live socket closed: ${event.code} ${event.reason || "no reason"}`);
            sessionRef.current = null;
            if (suppressNextCloseRef.current) {
              suppressNextCloseRef.current = false;
              return;
            }
            if (manualDisconnectRef.current || !shouldStayConnectedRef.current) {
              updateStatus("idle");
              return;
            }
            if (hasOpenedRef.current) {
              scheduleReconnect("socket closed unexpectedly");
            } else {
              shouldStayConnectedRef.current = false;
              setMicError("Live session could not stay connected. Please try again.");
              updateStatus("error");
            }
          },
        },
      });
      sessionRef.current = session;

      if (socketClosedDuringConnectRef.current) {
        throw new Error("Live connection closed before the microphone was ready");
      }

      if (socketClosedDuringConnectRef.current) {
        throw new Error("Live connection closed before audio streaming started");
      }
      updateStatus("listening");
      startHealthCheck();

      // 5. Kick off greeting
      logDebug("Sending opening prompt");
      session.sendClientContent({
        turns: [{ role: "user", parts: [{ text: "Open the session. Greet me by name." }] }],
        turnComplete: true,
      });
    } catch (e) {
      console.error(e);
      logDebug("Live session failed", e);
      toast.error(e instanceof Error ? e.message : "Failed to connect");
      if (!isReconnect) shouldStayConnectedRef.current = false;
      updateStatus("error");
    }
  }, [status, buildSystemPrompt, handleMessage, logDebug, scheduleReconnect, startHealthCheck, startMic, thinkingLevel, updateStatus]);

  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;
    shouldStayConnectedRef.current = false;
    clearTimers();
    logDebug("Manual disconnect");
    stopMic();
    try { outputCtxRef.current?.close(); } catch {}
    sessionRef.current?.close();
    sessionRef.current = null;
    outputCtxRef.current = null;
    playbackTimeRef.current = 0;
    reconnectAttemptsRef.current = 0;
    audioChunksSentRef.current = 0;
    updateStatus("idle");
  }, [clearTimers, logDebug, stopMic, updateStatus]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => () => disconnect(), [disconnect]);

  const isLive = status === "connected" || status === "listening" || status === "speaking" || status === "thinking" || status === "reconnecting";
  const orbState =
    status === "speaking" ? "speaking" :
    status === "thinking" || status === "connecting" || status === "reconnecting" ? "processing" :
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
          {status === "reconnecting" && "Reconnecting..."}
          {status === "error" && "Error — tap to retry"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {!isLive ? (
          <Button
            size="lg"
            onClick={() => connect()}
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

      {micError && (
        <div className="w-full max-w-2xl rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {micError}
        </div>
      )}

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
