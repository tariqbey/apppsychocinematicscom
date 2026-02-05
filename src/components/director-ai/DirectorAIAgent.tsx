import { useState, useCallback, useEffect, useRef } from "react";
import { Square } from "lucide-react";
import { X, Mic, MicOff, Volume2, VolumeX, Zap, Send, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceOrb } from "./VoiceOrb";
import { VoiceWaveform } from "./VoiceWaveform";
import { AgentTranscript, TranscriptMessage } from "./AgentTranscript";
import { DirectorAISettings, VOICE_OPTIONS, PERSONALITY_PRESETS, VoiceOption, PersonalityPreset } from "./DirectorAISettings";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useCoachingContext } from "@/hooks/useCoachingContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DirectorAIAgentProps {
  isOpen: boolean;
  onClose: () => void;
  chiefAim?: {
    what?: string;
    byWhen?: string;
    exchange?: string;
    plan?: string;
  } | string | null;
  userId?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/director-ai`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

// Load saved preferences from localStorage
const loadSavedVoice = (): VoiceOption => {
  try {
    const saved = localStorage.getItem("director-ai-voice");
    if (saved) {
      const parsed = JSON.parse(saved);
      const found = VOICE_OPTIONS.find(v => v.id === parsed.id);
      if (found) return found;
    }
  } catch {}
  return VOICE_OPTIONS[0]; // Default to George
};

const loadSavedPersonality = (): PersonalityPreset => {
  try {
    const saved = localStorage.getItem("director-ai-personality");
    if (saved) {
      const parsed = JSON.parse(saved);
      const found = PERSONALITY_PRESETS.find(p => p.id === parsed.id);
      if (found) return found;
    }
  } catch {}
  return PERSONALITY_PRESETS[0]; // Default to Swag Coach
};

// Generate context-aware opening based on user status
const generateProactiveOpening = (context: ReturnType<typeof useCoachingContext>["context"]) => {
  if (!context) {
    return "Welcome to Psycho-Cinematics™, Director! I'm your personal AI coach. Together, we'll transform you into the Director of your life story. Let's start by creating your Definite Chief Aim — the foundation of everything we'll build together. What's the biggest dream you want to achieve?";
  }

  const { greeting, dayNumber, currentStreak, chiefAimComplete, tasksSetForToday, allTasksCompleted, 
          watchedMindMovieToday, hasMindMovie, todaysTasks, completedTasksCount, directorCharacterName } = context;
  
  const name = directorCharacterName ? `, ${directorCharacterName}` : "";
  
  // Priority 0: Brand new user (Day 1, no streak, no Chief Aim)
  if (dayNumber <= 1 && currentStreak === 0 && !chiefAimComplete) {
    return `Welcome to the Director's Chair${name}! 🎬 I'm your personal AI coach, trained in the Psycho-Cinematics™ methodology. Think of me as your Jarvis — here to guide you every step of the way.\n\nFirst things first: Every great movie starts with a clear vision. Let's create your **Definite Chief Aim** — a crystal-clear statement of what you want to achieve, when you'll achieve it, what you'll give in exchange, and your plan.\n\nClose your eyes for a moment. Picture yourself having achieved your biggest dream. What does that look like? Tell me about it.`;
  }
  
  // Priority 1: No Chief Aim (returning user)
  if (!chiefAimComplete) {
    return `${greeting}${name}. Director, I see we haven't completed your Definite Chief Aim yet. This is Phase 1 - Pre-Production. Without a clear Final Scene, we're shooting blind. Every great production starts with knowing the destination. What's the dream you're building toward? What does your ultimate success look like?`;
  }

  // Priority 2: No tasks set for today
  if (!tasksSetForToday) {
    return `${greeting}${name}! Day ${dayNumber} of production. I notice you haven't locked in your Three Things for today yet. A Director without a shot list is just hoping for magic. What are the three scenes you're directing today that move you toward your Final Scene?`;
  }

  // Priority 3: Mind Movie not watched (if they have one)
  if (hasMindMovie && !watchedMindMovieToday) {
    const taskStatus = allTasksCompleted 
      ? "Your Three Things are all complete - outstanding!" 
      : `You've completed ${completedTasksCount} of ${todaysTasks.length} tasks.`;
    return `${greeting}${name}! ${taskStatus} But I notice you haven't viewed your Mind Movie yet today. That daily viewing is Phase 4 - it's how we program your nervous system. Your subconscious can't tell the difference between vivid imagination and reality. Ready to step into the theater?`;
  }

  // Priority 4: Tasks in progress
  if (tasksSetForToday && !allTasksCompleted) {
    const remaining = todaysTasks.length - completedTasksCount;
    const incompleteTasks = todaysTasks.filter(t => !t.is_completed).map(t => t.task_text).join(", ");
    return `${greeting}${name}! Day ${dayNumber}, and you're on a ${currentStreak}-day streak. You've got ${remaining} scene${remaining > 1 ? 's' : ''} left to shoot today: ${incompleteTasks}. What's blocking the next take? Let's get that camera rolling.`;
  }

  // All good - celebration mode
  if (allTasksCompleted && watchedMindMovieToday) {
    return `${greeting}${name}! Outstanding work on Day ${dayNumber}! You've watched your Mind Movie, all Three Things are wrapped, and you're on a ${currentStreak}-day streak. This is what Oscar-worthy production looks like. You're fully in character. What scene are we directing next?`;
  }

  // Default - everything's set up, encourage progress
  return `${greeting}${name}! Day ${dayNumber} of your production. You're on a ${currentStreak}-day streak. Your Three Things are locked in. What's the first take we're shooting today?`;
};

export function DirectorAIAgent({ isOpen, onClose, chiefAim }: DirectorAIAgentProps) {
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orbState, setOrbState] = useState<"idle" | "listening" | "speaking" | "processing">("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceInputLevel, setVoiceInputLevel] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false); // Defer initialization to prevent freeze
  
  // Voice and personality settings
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(loadSavedVoice);
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityPreset>(loadSavedPersonality);
  
  // Save preferences when changed
  const handleVoiceChange = useCallback((voice: VoiceOption) => {
    setSelectedVoice(voice);
    localStorage.setItem("director-ai-voice", JSON.stringify(voice));
    toast.success(`Voice changed to ${voice.name}`);
  }, []);
  
  const handlePersonalityChange = useCallback((personality: PersonalityPreset) => {
    setSelectedPersonality(personality);
    localStorage.setItem("director-ai-personality", JSON.stringify(personality));
    toast.success(`Coaching style: ${personality.name}`);
  }, []);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasGreeted = useRef(false);
  const [pendingVoiceSubmit, setPendingVoiceSubmit] = useState<string | null>(null);
  const lastAutoSubmitRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);
  const ttsRequestIdRef = useRef(0);
  const stopRequestedRef = useRef(false);
  
  // Defer component initialization to prevent UI freeze on mobile
  useEffect(() => {
    if (isOpen && !isReady) {
      // Use requestAnimationFrame to defer heavy initialization
      const frame = requestAnimationFrame(() => {
        setTimeout(() => setIsReady(true), 50);
      });
      return () => cancelAnimationFrame(frame);
    }
    if (!isOpen) {
      setIsReady(false);
    }
  }, [isOpen, isReady]);
  
  // Get full coaching context
  const { context: coachingContext, loading: contextLoading } = useCoachingContext();

  // Memoized callbacks for voice input - prevents hook re-initialization
  const handleTranscript = useCallback((text: string) => {
    console.log("[DirectorAI] Transcript received:", text);
    if (text.trim()) {
      setInputText(prev => (prev + " " + text).trim());
    }
  }, []);

  const handleAudioLevel = useCallback((level: number) => {
    setVoiceInputLevel(level);
  }, []);

  const handleVoiceError = useCallback((error: string) => {
    console.error("[DirectorAI] Voice error:", error);
    toast.error(error);
    setVoiceEnabled(false);
    setOrbState("idle");
  }, []);

  // Voice input hook - use faster silence timeout for responsive feel
  const { isListening, transcript, isSupported, audioLevel: inputAudioLevel, startListening, stopListening } = useVoiceInput({
    onTranscript: handleTranscript,
    onAudioLevel: handleAudioLevel,
    onError: handleVoiceError,
    onSilence: useCallback((finalTranscript: string) => {
      const trimmed = finalTranscript.trim();
      console.log("[DirectorAI] Silence callback triggered:", trimmed);
      if (trimmed && trimmed !== lastAutoSubmitRef.current) {
        lastAutoSubmitRef.current = trimmed;
        setVoiceEnabled(false);
        setInputText("");
        setPendingVoiceSubmit(trimmed);
      }
    }, []),
    continuous: true,
    silenceTimeout: 900,
  });


  // Sync voice enabled state with actual listening
  useEffect(() => {
    if (voiceEnabled && !isListening && orbState !== "speaking" && orbState !== "processing" && !isLoading) {
      console.log("[DirectorAI] Voice enabled but not listening, starting...");
      // On mobile, show a helpful message if voice isn't working
      if (!isSupported) {
        toast.info("Voice input isn't supported on this device. Use the text input below.", {
          duration: 5000,
        });
        setVoiceEnabled(false);
        return;
      }
      startListening();
    }
  }, [voiceEnabled, isListening, orbState, isLoading, startListening, isSupported]);

  // Update orb state based on listening
  useEffect(() => {
    if (isListening && orbState !== "speaking" && orbState !== "processing") {
      setOrbState("listening");
    }
  }, [isListening, orbState]);

  // When opening, clear any prior STOP state so TTS can run again
  useEffect(() => {
    if (isOpen) {
      stopRequestedRef.current = false;
    }
  }, [isOpen]);

  // Generate proactive greeting on open - only after isReady to prevent freeze
  useEffect(() => {
    if (isOpen && isReady && !hasGreeted.current && messages.length === 0 && !contextLoading) {
      hasGreeted.current = true;
      setHasInitialized(true);
      
      const welcomeMessage = generateProactiveOpening(coachingContext);
      
      const welcomeMsg: TranscriptMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
      
      if (ttsEnabled) {
        // Defer TTS to allow UI to render first
        setTimeout(() => speakText(welcomeMessage), 100);
      }
    }
  }, [isOpen, isReady, messages.length, ttsEnabled, contextLoading, coachingContext, isSupported]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      // Mark as stopped so any in-flight TTS cannot "resume" after the UI closes
      stopRequestedRef.current = true;
      ttsRequestIdRef.current += 1;

      hasGreeted.current = false;
      setHasInitialized(false);
      setMessages([]);
      setVoiceEnabled(false);
      stopListening();
      stopSpeaking();
    }
  }, [isOpen, stopListening]);

  const speakText = async (text: string) => {
    // Capture the current request ID to detect if stop was called
    const currentRequestId = ++ttsRequestIdRef.current;
    
    try {
      // Check if stop was already requested
      if (stopRequestedRef.current) {
        console.log("[DirectorAI] TTS blocked - stop was requested");
        return;
      }
      
      // Stop listening while AI speaks
      stopListening();
      setOrbState("speaking");
      
      // Create abort controller for this TTS request
      ttsAbortControllerRef.current = new AbortController();
      
      // Get user's session token for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        console.error("[DirectorAI] No auth token for TTS");
        throw new Error("Not authenticated");
      }
      
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice.id, // Use selected voice
        }),
        signal: ttsAbortControllerRef.current.signal,
      });

      // Check again after fetch - user might have clicked stop during request
      if (stopRequestedRef.current || currentRequestId !== ttsRequestIdRef.current) {
        console.log("[DirectorAI] TTS cancelled after fetch - stop was requested");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[DirectorAI] TTS error:", response.status, errorText);
        throw new Error("TTS failed");
      }

      const audioBlob = await response.blob();
      
      // Check again after blob - user might have clicked stop
      if (stopRequestedRef.current || currentRequestId !== ttsRequestIdRef.current) {
        console.log("[DirectorAI] TTS cancelled after blob - stop was requested");
        return;
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Simulate audio level changes for visual effect
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      audioLevelIntervalRef.current = setInterval(() => {
        // Only update if not stopped
        if (!stopRequestedRef.current) {
          setAudioLevel(Math.random() * 0.5 + 0.3);
        }
      }, 100);
      
      audio.onended = () => {
        // Don't do anything if stop was requested
        if (stopRequestedRef.current) return;

        if (audioLevelIntervalRef.current) {
          clearInterval(audioLevelIntervalRef.current);
          audioLevelIntervalRef.current = null;
        }
        setAudioLevel(0);
        setOrbState("idle");
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };

      audio.onerror = () => {
        // Don't do anything if stop was requested
        if (stopRequestedRef.current) return;

        if (audioLevelIntervalRef.current) {
          clearInterval(audioLevelIntervalRef.current);
          audioLevelIntervalRef.current = null;
        }
        setAudioLevel(0);
        setOrbState("idle");
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };
      
      // Final check before playing
      if (stopRequestedRef.current || currentRequestId !== ttsRequestIdRef.current) {
        console.log("[DirectorAI] TTS cancelled before play - stop was requested");
        URL.revokeObjectURL(audioUrl);
        return;
      }
      
      await audio.play();
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.log("[DirectorAI] TTS request aborted");
      } else {
        console.error("TTS error:", error);
      }
      setOrbState("idle");
    } finally {
      ttsAbortControllerRef.current = null;
    }
  };

  const stopSpeaking = useCallback(() => {
    console.log("[DirectorAI] stopSpeaking called - FORCE KILLING ALL AUDIO");
    
    // Mark as stopped FIRST to prevent any pending callbacks from resuming
    stopRequestedRef.current = true;
    
    // Increment TTS request ID to invalidate any pending TTS
    ttsRequestIdRef.current += 1;
    
    // Abort TTS fetch request immediately
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
    }
    
    // AGGRESSIVE: Find and kill ALL audio elements in the document
    // This catches any orphaned Audio instances that lost their reference
    try {
      document.querySelectorAll("audio").forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
        audio.src = "";
        audio.load();
      });
    } catch (e) {
      console.warn("[DirectorAI] Error stopping document audio elements:", e);
    }
    
    // Stop our tracked audio ref
    if (audioRef.current) {
      const audio = audioRef.current;
      // Remove callbacks first to prevent any firing
      audio.onended = null;
      audio.onerror = null;
      audio.onplay = null;
      audio.onpause = null;
      audio.onloadeddata = null;
      audio.oncanplay = null;
      // Stop playback aggressively
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
      audio.load(); // Force browser to release the audio
      audioRef.current = null;
    }
    
    // Also stop the hidden audio element if it exists
    const hiddenAudio = document.querySelector("audio.hidden") as HTMLAudioElement;
    if (hiddenAudio) {
      hiddenAudio.pause();
      hiddenAudio.currentTime = 0;
      hiddenAudio.src = "";
    }
    
    // Revoke audio URL to free memory
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    
    // Clear level animation interval
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    
    setOrbState("idle");
    setAudioLevel(0);
    
    console.log("[DirectorAI] All audio forcefully stopped");
  }, []);

  const stopConversation = useCallback(() => {
    console.log("[DirectorAI] STOP & EXIT - halting everything immediately");
    
    // Set stop flag FIRST - this blocks any pending operations
    stopRequestedRef.current = true;
    
    // Abort any in-flight chat fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Stop TTS and audio immediately
    stopSpeaking();
    
    // Stop voice listening
    stopListening();
    setVoiceEnabled(false);
    
    // Clear all processing state
    setIsLoading(false);
    setCurrentResponse("");
    setOrbState("idle");
    setPendingVoiceSubmit(null);
    lastAutoSubmitRef.current = null;
  }, [stopSpeaking, stopListening]);

  const streamChat = useCallback(async (userMessage: string) => {
    // Stop listening during processing
    stopListening();
    setVoiceEnabled(false);
    
    const userMsg: TranscriptMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setOrbState("processing");
    setCurrentResponse("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Build full user context for proactive coaching
      const userContext = coachingContext ? {
        timeOfDay: coachingContext.timeOfDay,
        dayNumber: coachingContext.dayNumber,
        currentStreak: coachingContext.currentStreak,
        bestStreak: coachingContext.bestStreak,
        chiefAimComplete: coachingContext.chiefAimComplete,
        directorCharacterName: coachingContext.directorCharacterName,
        characterArchetype: coachingContext.characterArchetype,
        transformationAnalysis: coachingContext.transformationAnalysis,
        tasksSetForToday: coachingContext.tasksSetForToday,
        allTasksCompleted: coachingContext.allTasksCompleted,
        completedTasksCount: coachingContext.completedTasksCount,
        todaysTasks: coachingContext.todaysTasks,
        hasMindMovie: coachingContext.hasMindMovie,
        watchedMindMovieToday: coachingContext.watchedMindMovieToday,
        filledScorecardToday: coachingContext.filledScorecardToday,
        todaysScorecardScore: coachingContext.todaysScorecardScore,
      } : undefined;

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ 
          messages: allMessages, 
          chiefAim: coachingContext?.chiefAim || chiefAim,
          userContext,
          personalityStyle: selectedPersonality.style, // Send personality preference
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment.");
          setOrbState("idle");
          return;
        }
        if (response.status === 402) {
          toast.error("AI credits exhausted. Please add credits.");
          setOrbState("idle");
          return;
        }
        throw new Error("Chat request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              setCurrentResponse(fullResponse);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      const assistantMsg: TranscriptMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setCurrentResponse("");

      if (ttsEnabled && fullResponse) {
        await speakText(fullResponse);
      } else {
        setOrbState("idle");
        // DO NOT auto-resume voice - user must manually tap mic
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.log("[DirectorAI] Request aborted by user");
      } else {
        console.error("Chat error:", error);
        toast.error("Failed to get response. Please try again.");
      }
      setOrbState("idle");
      // DO NOT auto-resume voice on error - user must manually tap mic
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, chiefAim, ttsEnabled, coachingContext, stopListening]);

  // Handle pending submit from silence detection - runs when state changes
  useEffect(() => {
    if (pendingVoiceSubmit && !isLoading) {
      console.log("[DirectorAI] Auto-submitting:", pendingVoiceSubmit);
      stopListening();
      const text = pendingVoiceSubmit;
      setPendingVoiceSubmit(null);
      streamChat(text);
    }
  }, [pendingVoiceSubmit, isLoading, stopListening, streamChat]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText("");
    streamChat(text);
  };

  const handleVoiceToggle = async () => {
    console.log("[DirectorAI] Voice toggle - current state:", { voiceEnabled, isListening, isSupported });
    
    if (voiceEnabled || isListening) {
      stopListening();
      setVoiceEnabled(false);
      setOrbState("idle");
      toast.info("Voice input disabled");
    } else {
      // Clear stop flag when user explicitly activates voice
      stopRequestedRef.current = false;
      
      if (!isSupported) {
        toast.error("Voice input is not supported on this browser. Please use Chrome, Safari, or Edge.", {
          duration: 5000,
        });
        return;
      }
      
      stopSpeaking();
      setVoiceEnabled(true);
      setOrbState("listening");
      
      // Provide immediate visual and toast feedback
      toast.info("🎤 Tap and speak clearly...", { duration: 2000 });
      
      // Force start listening - on mobile we need to call this directly in the gesture handler
      try {
        console.log("[DirectorAI] Starting voice input from toggle");
        await startListening();
        
        // If still not listening after a moment, show helpful message
        setTimeout(() => {
          if (!isListening && voiceEnabled) {
            toast.info("Speak now - I'm listening!", { duration: 2000 });
          }
        }, 500);
      } catch (error) {
        console.error("[DirectorAI] Failed to start listening:", error);
        setVoiceEnabled(false);
        setOrbState("idle");
        toast.error("Could not start microphone. Please check permissions.");
      }
    }
  };

  const handleKut = () => {
    stopSpeaking();
    stopListening();
    setVoiceEnabled(false);
    streamChat("KUT! I need to reset. Walk me through the KUT technique right now - help me Recognize what's happening, Kut the scene, Reset my state, and Resume as my Director Character.");
  };

  if (!isOpen) return null;

  // Show loading state while initializing to prevent freeze
  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-amber-600 animate-pulse" />
          <p className="text-gold/80 text-sm tracking-widest uppercase">Initializing...</p>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 shadow-lg shadow-gold/30"
        >
          <Maximize2 className="w-6 h-6 text-black" />
        </Button>
      </div>
    );
  }

  // Body scroll lock while overlay is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-[100dvh] w-full overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Spotlight effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-radial from-gold/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* 3-row grid layout: Header / Scrollable Content / Footer */}
      <div className="relative z-10 w-full h-full grid grid-rows-[auto_1fr_auto] overflow-hidden">
        {/* ROW 1: Header controls - fixed at top */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-3 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] sm:px-4 sm:pb-4 sm:pt-[calc(env(safe-area-inset-top)+16px)] bg-gradient-to-b from-black/80 to-transparent">
          {/* Settings on the left */}
          <DirectorAISettings
            selectedVoice={selectedVoice}
            onVoiceChange={handleVoiceChange}
            selectedPersonality={selectedPersonality}
            onPersonalityChange={handlePersonalityChange}
            disabled={isLoading || orbState === "speaking"}
          />
          
          {/* Minimize/Close on the right */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="text-muted-foreground hover:text-foreground h-9 w-9 sm:h-10 sm:w-10"
            >
              <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground h-9 w-9 sm:h-10 sm:w-10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* ROW 2: Scrollable content area */}
        <div className="flex-1 flex flex-col items-center overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:py-6">
          {/* Title */}
          <div className="text-center mb-4 sm:mb-6 flex-shrink-0">
            <h1 className="font-display text-xl sm:text-3xl md:text-4xl text-gold tracking-wider mb-1">
              THE DIRECTOR AI
            </h1>
            <p className="text-muted-foreground text-[10px] sm:text-xs tracking-widest uppercase">
              Your Psycho-Cinematics Coach
            </p>
          </div>

          {/* Voice Orb - responsive size via prop */}
          <div className="mb-3 sm:mb-6 flex-shrink-0">
            <VoiceOrb 
              state={orbState} 
              audioLevel={orbState === "listening" ? voiceInputLevel : audioLevel}
            />
          </div>

          {/* Voice Waveform - shows when listening */}
          {isListening && orbState === "listening" && (
            <div className="flex flex-col items-center gap-1 mb-3 sm:mb-4 flex-shrink-0">
              <VoiceWaveform 
                audioLevel={voiceInputLevel} 
                isActive={voiceInputLevel > 0.1}
                barCount={9}
                className="h-6 sm:h-10"
              />
              <p className="text-gold/80 text-[10px] tracking-widest uppercase">
                {voiceInputLevel > 0.15 ? "Hearing you..." : "Listening..."}
              </p>
            </div>
          )}

          {/* Transcript - scrollable area */}
          <div className="w-full max-w-xl flex-1 min-h-0">
            <AgentTranscript 
              messages={messages}
              currentResponse={currentResponse}
            />
          </div>

          {/* Live transcript while speaking */}
          {transcript && isListening && (
            <div className="w-full max-w-xl mt-3 px-3 py-2 bg-card/40 rounded-lg border border-gold/20 flex-shrink-0">
              <p className="text-foreground/80 italic text-sm">"{transcript}"</p>
            </div>
          )}
        </div>

        {/* ROW 3: Fixed footer with input + buttons */}
        <div className="flex-shrink-0 w-full bg-gradient-to-t from-black via-black/95 to-transparent px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:pb-6">
          <div className="w-full max-w-xl mx-auto space-y-2 sm:space-y-3">
            {/* Input row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={isListening ? "Listening... or type here" : "Type your message..."}
                  className="bg-card/60 border-border/50 h-11 pr-11 text-foreground placeholder:text-muted-foreground text-sm"
                  disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold h-9 w-9"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Voice button - always show but disable if not supported */}
              <Button
                variant={voiceEnabled || isListening ? "default" : "outline"}
                size="icon"
                onClick={handleVoiceToggle}
                disabled={isLoading || orbState === "speaking" || !isSupported}
                className={(voiceEnabled || isListening)
                  ? "w-11 h-11 bg-gold text-black hover:bg-gold/90 flex-shrink-0" 
                  : "w-11 h-11 border-border/50 hover:border-gold hover:text-gold flex-shrink-0"
                }
                title={!isSupported ? "Voice not supported on this browser" : "Toggle voice input"}
              >
                {(voiceEnabled || isListening) ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
            </div>

            {/* Action buttons row */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {/* STOP & EXIT Button */}
              <Button
                variant="outline"
                onClick={() => {
                  stopConversation();
                  // Stop only our audio ref - not all document audio
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = "";
                  }
                  onClose();
                }}
                className="border-2 border-red-500/70 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold px-3 h-9 text-xs sm:text-sm sm:px-4 sm:h-10"
              >
                <Square className="w-3.5 h-3.5 mr-1.5 fill-current" />
                STOP
              </Button>

              {/* KUT! Button */}
              <Button
                variant="destructive"
                onClick={handleKut}
                disabled={isLoading}
                className="bg-cinematic-red hover:bg-cinematic-red/90 text-white font-bold px-3 h-9 text-xs sm:text-sm sm:px-4 sm:h-10"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                KUT!
              </Button>

              {/* TTS Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTtsEnabled(!ttsEnabled);
                  if (ttsEnabled) stopSpeaking();
                }}
                className="text-muted-foreground hover:text-foreground h-9 text-xs sm:text-sm px-2 sm:px-3"
              >
                {ttsEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 mr-1" />
                )}
                {ttsEnabled ? "On" : "Off"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
