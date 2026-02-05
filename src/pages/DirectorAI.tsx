import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Mic, MicOff, Volume2, VolumeX, Zap, Square, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoachingContext } from "@/hooks/useCoachingContext";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { DirectorAISettings, VOICE_OPTIONS, PERSONALITY_PRESETS, VoiceOption, PersonalityPreset } from "@/components/director-ai/DirectorAISettings";
import { JarvisOrb } from "@/components/director-ai/JarvisOrb";
import { AgentTranscript, TranscriptMessage } from "@/components/director-ai/AgentTranscript";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/director-ai`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

// Load saved preferences
const loadSavedVoice = (): VoiceOption => {
  try {
    const saved = localStorage.getItem("director-ai-voice");
    if (saved) {
      const parsed = JSON.parse(saved);
      const found = VOICE_OPTIONS.find(v => v.id === parsed.id);
      if (found) return found;
    }
  } catch {}
  return VOICE_OPTIONS[0];
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
  return PERSONALITY_PRESETS[0];
};

// Generate proactive greeting
const generateProactiveOpening = (context: ReturnType<typeof useCoachingContext>["context"]) => {
  if (!context) {
    return "Welcome to Psycho-Cinematics™, Director! I'm your personal AI coach. Together, we'll transform you into the Director of your life story. Let's start by creating your Definite Chief Aim — the foundation of everything we'll build together. What's the biggest dream you want to achieve?";
  }

  const { greeting, dayNumber, currentStreak, chiefAimComplete, tasksSetForToday, allTasksCompleted, 
          watchedMindMovieToday, hasMindMovie, todaysTasks, completedTasksCount, directorCharacterName } = context;
  
  const name = directorCharacterName ? `, ${directorCharacterName}` : "";
  
  if (dayNumber <= 1 && currentStreak === 0 && !chiefAimComplete) {
    return `Welcome to the Director's Chair${name}! 🎬 I'm your personal AI coach, trained in the Psycho-Cinematics™ methodology. Think of me as your Jarvis — here to guide you every step of the way.\n\nFirst things first: Every great movie starts with a clear vision. Let's create your **Definite Chief Aim** — a crystal-clear statement of what you want to achieve, when you'll achieve it, what you'll give in exchange, and your plan.\n\nClose your eyes for a moment. Picture yourself having achieved your biggest dream. What does that look like? Tell me about it.`;
  }
  
  if (!chiefAimComplete) {
    return `${greeting}${name}. Director, I see we haven't completed your Definite Chief Aim yet. This is Phase 1 - Pre-Production. Without a clear Final Scene, we're shooting blind. Every great production starts with knowing the destination. What's the dream you're building toward?`;
  }

  if (!tasksSetForToday) {
    return `${greeting}${name}! Day ${dayNumber} of production. I notice you haven't locked in your Three Things for today yet. A Director without a shot list is just hoping for magic. What are the three scenes you're directing today?`;
  }

  if (hasMindMovie && !watchedMindMovieToday) {
    const taskStatus = allTasksCompleted 
      ? "Your Three Things are all complete - outstanding!" 
      : `You've completed ${completedTasksCount} of ${todaysTasks.length} tasks.`;
    return `${greeting}${name}! ${taskStatus} But I notice you haven't viewed your Mind Movie yet today. That daily viewing is Phase 4 - it's how we program your nervous system. Ready to step into the theater?`;
  }

  if (tasksSetForToday && !allTasksCompleted) {
    const remaining = todaysTasks.length - completedTasksCount;
    const incompleteTasks = todaysTasks.filter(t => !t.is_completed).map(t => t.task_text).join(", ");
    return `${greeting}${name}! Day ${dayNumber}, and you're on a ${currentStreak}-day streak. You've got ${remaining} scene${remaining > 1 ? 's' : ''} left to shoot today: ${incompleteTasks}. What's blocking the next take?`;
  }

  if (allTasksCompleted && watchedMindMovieToday) {
    return `${greeting}${name}! Outstanding work on Day ${dayNumber}! You've watched your Mind Movie, all Three Things are wrapped, and you're on a ${currentStreak}-day streak. This is Oscar-worthy production. What scene are we directing next?`;
  }

  return `${greeting}${name}! Day ${dayNumber} of your production. You're on a ${currentStreak}-day streak. Your Three Things are locked in. What's the first take we're shooting today?`;
};

export default function DirectorAI() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { context: coachingContext, loading: contextLoading } = useCoachingContext();
  
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orbState, setOrbState] = useState<"idle" | "listening" | "speaking" | "processing">("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceInputLevel, setVoiceInputLevel] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(loadSavedVoice);
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityPreset>(loadSavedPersonality);
  
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
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [authLoading, user, navigate]);
  
  // Voice callbacks
  const handleTranscript = useCallback((text: string) => {
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

  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceInput({
    onTranscript: handleTranscript,
    onAudioLevel: handleAudioLevel,
    onError: handleVoiceError,
    onSilence: useCallback((finalTranscript: string) => {
      const trimmed = finalTranscript.trim();
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

  // Sync voice state
  useEffect(() => {
    if (voiceEnabled && !isListening && orbState !== "speaking" && orbState !== "processing" && !isLoading) {
      if (!isSupported) {
        toast.info("Voice input isn't supported on this device. Use text input.", { duration: 5000 });
        setVoiceEnabled(false);
        return;
      }
      startListening();
    }
  }, [voiceEnabled, isListening, orbState, isLoading, startListening, isSupported]);

  useEffect(() => {
    if (isListening && orbState !== "speaking" && orbState !== "processing") {
      setOrbState("listening");
    }
  }, [isListening, orbState]);

  // Generate greeting
  useEffect(() => {
    if (user && !hasGreeted.current && messages.length === 0 && !contextLoading) {
      hasGreeted.current = true;
      const welcomeMessage = generateProactiveOpening(coachingContext);
      const welcomeMsg: TranscriptMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
      if (ttsEnabled) {
        setTimeout(() => speakText(welcomeMessage), 100);
      }
    }
  }, [user, messages.length, ttsEnabled, contextLoading, coachingContext]);

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

  const speakText = async (text: string) => {
    const currentRequestId = ++ttsRequestIdRef.current;
    
    try {
      if (stopRequestedRef.current) return;
      
      stopListening();
      setOrbState("speaking");
      
      ttsAbortControllerRef.current = new AbortController();
      
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) throw new Error("Not authenticated");
      
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ text, voiceId: selectedVoice.id }),
        signal: ttsAbortControllerRef.current.signal,
      });

      if (stopRequestedRef.current || currentRequestId !== ttsRequestIdRef.current) return;

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      if (stopRequestedRef.current || currentRequestId !== ttsRequestIdRef.current) return;
      
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audioLevelIntervalRef.current = setInterval(() => {
        if (!stopRequestedRef.current) {
          setAudioLevel(Math.random() * 0.5 + 0.3);
        }
      }, 100);
      
      audio.onended = () => {
        if (stopRequestedRef.current) return;
        if (audioLevelIntervalRef.current) {
          clearInterval(audioLevelIntervalRef.current);
        }
        setAudioLevel(0);
        setOrbState("idle");
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };

      audio.onerror = () => {
        if (stopRequestedRef.current) return;
        if (audioLevelIntervalRef.current) {
          clearInterval(audioLevelIntervalRef.current);
        }
        setAudioLevel(0);
        setOrbState("idle");
      };
      
      if (stopRequestedRef.current || currentRequestId !== ttsRequestIdRef.current) {
        URL.revokeObjectURL(audioUrl);
        return;
      }
      
      await audio.play();
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("TTS error:", error);
      }
      setOrbState("idle");
    } finally {
      ttsAbortControllerRef.current = null;
    }
  };

  const stopSpeaking = useCallback(() => {
    stopRequestedRef.current = true;
    ttsRequestIdRef.current += 1;

    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
    }

    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setOrbState("idle");
    setAudioLevel(0);
  }, []);

  const stopConversation = useCallback(() => {
    stopRequestedRef.current = true;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    stopSpeaking();
    stopListening();
    setVoiceEnabled(false);
    setIsLoading(false);
    setCurrentResponse("");
    setOrbState("idle");
    setPendingVoiceSubmit(null);
    lastAutoSubmitRef.current = null;
  }, [stopSpeaking, stopListening]);

  const streamChat = useCallback(async (userMessage: string) => {
    stopListening();
    setVoiceEnabled(false);
    stopRequestedRef.current = false;
    
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
          chiefAim: coachingContext?.chiefAim,
          userContext,
          personalityStyle: selectedPersonality.style,
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
          } catch {}
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
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("Chat error:", error);
        toast.error("Failed to get response. Please try again.");
      }
      setOrbState("idle");
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, ttsEnabled, coachingContext, stopListening, selectedPersonality.style, selectedVoice.id]);

  // Handle pending voice submit
  useEffect(() => {
    if (pendingVoiceSubmit && !isLoading) {
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
    if (voiceEnabled || isListening) {
      stopListening();
      setVoiceEnabled(false);
      setOrbState("idle");
      toast.info("Voice input disabled");
    } else {
      stopRequestedRef.current = false;
      
      if (!isSupported) {
        toast.error("Voice input is not supported on this browser.", { duration: 5000 });
        return;
      }
      
      stopSpeaking();
      setVoiceEnabled(true);
      setOrbState("listening");
      toast.info("🎤 Tap and speak clearly...", { duration: 2000 });
      
      try {
        await startListening();
      } catch (error) {
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
    streamChat("KUT! I need to reset. Walk me through the KUT technique right now.");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-amber-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-black flex flex-col overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-gold/8 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-gold/5 to-transparent" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <h1 className="font-display text-lg text-gold tracking-wider">DIRECTOR AI</h1>
        
        <DirectorAISettings
          selectedVoice={selectedVoice}
          onVoiceChange={handleVoiceChange}
          selectedPersonality={selectedPersonality}
          onPersonalityChange={handlePersonalityChange}
          disabled={isLoading || orbState === "speaking"}
        />
      </header>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-4 min-h-0">
        {/* Jarvis Orb - central animated element */}
        <div className="flex-shrink-0 mb-4">
          <JarvisOrb 
            state={orbState}
            audioLevel={orbState === "listening" ? voiceInputLevel : audioLevel}
          />
        </div>

        {/* Status text */}
        <div className="flex-shrink-0 mb-4 text-center">
          <p className="text-gold/80 text-xs tracking-widest uppercase">
            {orbState === "listening" && (voiceInputLevel > 0.15 ? "Hearing you..." : "Listening...")}
            {orbState === "speaking" && "Speaking..."}
            {orbState === "processing" && "Processing..."}
            {orbState === "idle" && "Ready"}
          </p>
          {transcript && isListening && (
            <p className="text-foreground/70 text-sm italic mt-2 max-w-xs">"{transcript}"</p>
          )}
        </div>

        {/* Transcript - scrollable */}
        <div className="flex-1 w-full max-w-lg min-h-0 overflow-hidden">
          <AgentTranscript 
            messages={messages}
            currentResponse={currentResponse}
          />
        </div>
      </div>

      {/* Footer with inputs */}
      <div className="relative z-10 flex-shrink-0 w-full bg-gradient-to-t from-black via-black/95 to-transparent px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="w-full max-w-lg mx-auto space-y-3">
          {/* Input row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isListening ? "Listening... or type here" : "Type your message..."}
                className="bg-card/60 border-border/50 h-12 pr-12 text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold h-10 w-10"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>

            <Button
              variant={voiceEnabled || isListening ? "default" : "outline"}
              size="icon"
              onClick={handleVoiceToggle}
              disabled={isLoading || orbState === "speaking" || !isSupported}
              className={(voiceEnabled || isListening)
                ? "w-12 h-12 bg-gold text-black hover:bg-gold/90 flex-shrink-0" 
                : "w-12 h-12 border-border/50 hover:border-gold hover:text-gold flex-shrink-0"
              }
              title={!isSupported ? "Voice not supported on this browser" : "Toggle voice input"}
            >
              {(voiceEnabled || isListening) ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                stopConversation();
                navigate("/");
              }}
              className="border-2 border-red-500/70 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold px-4 h-10"
            >
              <Square className="w-4 h-4 mr-2 fill-current" />
              STOP
            </Button>

            <Button
              variant="destructive"
              onClick={handleKut}
              disabled={isLoading}
              className="bg-cinematic-red hover:bg-cinematic-red/90 text-white font-bold px-4 h-10"
            >
              <Zap className="w-4 h-4 mr-2" />
              KUT!
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (orbState === "speaking") stopSpeaking();
                setTtsEnabled(!ttsEnabled);
              }}
              className="text-muted-foreground hover:text-foreground h-10 px-3"
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 mr-1" /> : <VolumeX className="w-4 h-4 mr-1" />}
              <span className="text-xs">{ttsEnabled ? "ON" : "OFF"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
