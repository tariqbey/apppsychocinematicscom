import { useState, useCallback, useEffect, useRef } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Mic, MicOff, Volume2, VolumeX, Zap, Square, Settings2, Download, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoachingContext } from "@/hooks/useCoachingContext";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { DirectorAISettings, VOICE_OPTIONS, PERSONALITY_PRESETS, VoiceOption, PersonalityPreset, getAllVoices, loadCustomVoices, saveCustomVoices } from "@/components/director-ai/DirectorAISettings";
import { JarvisOrb } from "@/components/director-ai/JarvisOrb";
import { AgentTranscript, TranscriptMessage } from "@/components/director-ai/AgentTranscript";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { readOpenAITextStream } from "@/lib/sse";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/director-ai`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const VOICES_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-voices`;

// Load saved preferences
const loadSavedVoice = (): VoiceOption => {
  try {
    const saved = localStorage.getItem("director-ai-voice");
    if (saved) {
      const parsed = JSON.parse(saved);
      const found = getAllVoices().find(v => v.id === parsed.id);
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

// Fallback greeting if AI call fails
const getFallbackGreeting = (context: ReturnType<typeof useCoachingContext>["context"]) => {
  if (!context) return "What's good, Director. Let's get to work.";
  const name = context.displayName || context.directorCharacterName || "Director";
  return `Yo ${name}, I'm locked in on your status. Let's get it.`;
};

export default function DirectorAI() {
  useDocumentTitle("Director AI | Director's OS");
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
  const [waitingForTap, setWaitingForTap] = useState(false); // iOS: waiting for user gesture to start mic
  
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(loadSavedVoice);
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityPreset>(loadSavedPersonality);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioUnlockedRef = useRef(false); // Track if iOS audio has been unlocked
  const hasGreeted = useRef(false);
  const [pendingVoiceSubmit, setPendingVoiceSubmit] = useState<string | null>(null);
  const lastAutoSubmitRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);
  const ttsRequestIdRef = useRef(0);
  const stopRequestedRef = useRef(false);
  const voiceModeRef = useRef(false); // Track if user started a voice conversation
  
  // Detect iOS for gesture-required speech recognition
  const isIOSDevice = useRef(
    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ).current;
  
  // ElevenLabs import state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importingVoices, setImportingVoices] = useState(false);
  const [elevenlabsVoices, setElevenlabsVoices] = useState<VoiceOption[]>([]);
  const [selectedImports, setSelectedImports] = useState<Set<string>>(new Set());
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>(loadCustomVoices);
  
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
        // Don't clear voiceModeRef - keep voice conversation going
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

  // Generate dynamic AI greeting
  useEffect(() => {
    if (user && !hasGreeted.current && messages.length === 0 && !contextLoading) {
      hasGreeted.current = true;
      
      const generateDynamicGreeting = async () => {
        setOrbState("processing");
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          if (!token) throw new Error("No session");

          const userName = coachingContext?.displayName || coachingContext?.directorCharacterName || "Director";

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

          const response = await fetch(CHAT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              messages: [{ role: "user", content: `Give me your opening greeting. My name is ${userName} — call me by my name. Check my status — journal, tasks, streak, scorecard, everything — and come at me based on what you see. Keep it to 2-3 sentences max. Be real. Don't introduce yourself, just jump in like you already know me. Never say the same thing twice.` }],
              chiefAim: coachingContext?.chiefAim,
              userContext,
              personalityStyle: selectedPersonality.style,
              isGreeting: true,
            }),
          });

          if (!response.ok || !response.body) throw new Error("Greeting failed");

          let greetingContent = "";
          await readOpenAITextStream({
            response,
            onDelta: (chunk) => {
              greetingContent += chunk;
              // Update the greeting message in real-time
              setMessages([{
                id: "greeting",
                role: "assistant",
                content: greetingContent,
                timestamp: new Date(),
              }]);
            },
          });

        setOrbState("idle");
          if (ttsEnabled && greetingContent.trim()) {
            // Enable voice mode so auto-listen kicks in after greeting TTS ends
            voiceModeRef.current = true;
            stopRequestedRef.current = false;
            setTimeout(() => speakText(greetingContent), 100);
          } else if (isSupported) {
            // No TTS - start listening (on iOS, show tap prompt)
            voiceModeRef.current = true;
            stopRequestedRef.current = false;
            setVoiceEnabled(true);
            setOrbState("listening");
            startListening();
          }
        } catch (error) {
          console.error("Dynamic greeting error:", error);
          const fallback = getFallbackGreeting(coachingContext);
          setMessages([{
            id: "greeting",
            role: "assistant",
            content: fallback,
            timestamp: new Date(),
          }]);
          setOrbState("idle");
          if (ttsEnabled) {
            voiceModeRef.current = true;
            stopRequestedRef.current = false;
            setTimeout(() => speakText(fallback), 100);
          } else if (isSupported) {
            voiceModeRef.current = true;
            stopRequestedRef.current = false;
            setVoiceEnabled(true);
            setOrbState("listening");
            startListening();
          }
        }
      };

      generateDynamicGreeting();
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

  // Unlock audio on iOS - must be called from a user gesture
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    // Create a persistent audio element and play silence to unlock iOS audio
    const audio = new Audio();
    audio.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwAAAAAAAAAAAAAAAAAAAA==";
    audio.volume = 0.01;
    audio.play().catch(() => {});
    // Keep this element around as the "unlocked" audio element
    if (!audioRef.current) {
      audioRef.current = audio;
    }
  }, []);

  // Split long text into chunks for TTS (ElevenLabs has limits)
  const splitTextForTTS = (text: string, maxChars = 4000): string[] => {
    if (text.length <= maxChars) return [text];
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let current = "";
    for (const sentence of sentences) {
      if ((current + sentence).length > maxChars && current) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  };

  const speakText = async (text: string) => {
    const currentRequestId = ++ttsRequestIdRef.current;
    const chunks = splitTextForTTS(text);
    
    try {
      if (stopRequestedRef.current) return;
      
      stopListening();
      setOrbState("speaking");
      
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      for (let i = 0; i < chunks.length; i++) {
        if (stopRequestedRef.current || currentRequestId !== ttsRequestIdRef.current) return;

        ttsAbortControllerRef.current = new AbortController();

        const response = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ text: chunks[i], voiceId: selectedVoice.id }),
          signal: ttsAbortControllerRef.current.signal,
        });

        if (stopRequestedRef.current || currentRequestId !== ttsRequestIdRef.current) return;

        if (!response.ok) {
          const errBody = await response.text().catch(() => "");
          console.error("TTS error response:", response.status, errBody);
          if (response.status === 400 && errBody.includes("No ElevenLabs API key")) {
            toast.error("Add your ElevenLabs API key in Settings → Integrations to enable voice.");
            break;
          }
          throw new Error("TTS failed");
        }

        const audioBlob = await response.blob();
        if (stopRequestedRef.current || currentRequestId !== ttsRequestIdRef.current) return;
        
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;
        
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.onended = null;
          audioRef.current.onerror = null;
        }
        
        const audio = audioRef.current || new Audio();
        audio.src = audioUrl;
        audio.volume = 1;
        audioRef.current = audio;
        
        if (!audioLevelIntervalRef.current) {
          audioLevelIntervalRef.current = setInterval(() => {
            if (!stopRequestedRef.current) {
              setAudioLevel(Math.random() * 0.5 + 0.3);
            }
          }, 100);
        }
        
        // Wait for this chunk to finish playing
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            if (audioUrlRef.current) {
              URL.revokeObjectURL(audioUrlRef.current);
              audioUrlRef.current = null;
            }
            resolve();
          };
          audio.onerror = () => {
            reject(new Error("Audio playback error"));
          };
          if (stopRequestedRef.current || currentRequestId !== ttsRequestIdRef.current) {
            resolve();
            return;
          }
          audio.play().catch(reject);
        });
      }

      // All chunks done - clean up and auto-resume listening
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }
      setAudioLevel(0);
      setOrbState("idle");

      if (voiceModeRef.current && !stopRequestedRef.current) {
        // Clear stale transcript guard so next voice input always submits
        lastAutoSubmitRef.current = null;
        // Ensure recognition is fully stopped before restarting
        stopListening();
        // Longer delay on iOS to let audio hardware fully release
        const resumeDelay = isIOSDevice ? 800 : 400;
        setTimeout(() => {
          if (voiceModeRef.current && !stopRequestedRef.current) {
            console.log("[DirectorAI] Auto-resuming listening after TTS");
            setVoiceEnabled(true);
            setOrbState("listening");
            startListening();
          }
        }, resumeDelay);
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("TTS error:", error);
      }
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }
      setAudioLevel(0);
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
    voiceModeRef.current = false; // Exit voice conversation mode
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    stopSpeaking();
    stopListening();
    setVoiceEnabled(false);
    setWaitingForTap(false);
    setIsLoading(false);
    setCurrentResponse("");
    setOrbState("idle");
    setPendingVoiceSubmit(null);
    lastAutoSubmitRef.current = null;
  }, [stopSpeaking, stopListening]);

  const streamChat = useCallback(async (userMessage: string) => {
    stopListening();
    // Don't clear voiceModeRef - we want to auto-resume after AI responds
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

      if (!token) {
        toast.error("Session expired — please sign in again.");
        setOrbState("idle");
        return;
      }

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

      let fullResponse = "";

      await readOpenAITextStream({
        response,
        onDelta: (chunk) => {
          fullResponse += chunk;
          setCurrentResponse(fullResponse);
        },
      });

      const assistantMsg: TranscriptMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setCurrentResponse("");

      // Save both messages to DB for conversation memory
      if (user?.id) {
        supabase.from("chat_messages").insert([
          { user_id: user.id, role: "user", content: userMessage },
          { user_id: user.id, role: "assistant", content: fullResponse },
        ]).then(({ error }) => {
          if (error) console.error("Failed to save chat messages:", error);
        });
      }

      if (ttsEnabled && fullResponse) {
        await speakText(fullResponse);
      } else {
        setOrbState("idle");
        // If in voice mode and no TTS, resume listening
        if (voiceModeRef.current && !stopRequestedRef.current) {
          lastAutoSubmitRef.current = null;
          stopListening();
          const resumeDelay = isIOSDevice ? 800 : 400;
          setTimeout(() => {
            if (voiceModeRef.current && !stopRequestedRef.current) {
              console.log("[DirectorAI] Auto-resuming listening (no TTS)");
              setVoiceEnabled(true);
              setOrbState("listening");
              startListening();
            }
          }, resumeDelay);
        }
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
    unlockAudio(); // Unlock iOS audio on user gesture
    const text = inputText.trim();
    setInputText("");
    streamChat(text);
  };

  const handleVoiceToggle = async () => {
    if (voiceEnabled || isListening) {
      stopListening();
      setVoiceEnabled(false);
      voiceModeRef.current = false; // Exit voice mode
      setOrbState("idle");
      toast.info("Voice input disabled");
    } else {
      unlockAudio(); // Unlock iOS audio on user gesture
      stopRequestedRef.current = false;
      voiceModeRef.current = true; // Enter voice conversation mode
      
      if (!isSupported) {
        toast.error("Voice input is not supported on this browser.", { duration: 5000 });
        voiceModeRef.current = false;
        return;
      }
      
      stopSpeaking();
      setVoiceEnabled(true);
      setOrbState("listening");
      toast.info("🎤 Speak — I'll listen and respond", { duration: 2000 });
      
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

  const fetchElevenLabsVoices = async () => {
    setImportingVoices(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(VOICES_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch voices");
      }

      const data = await response.json();
      const existingIds = new Set([...VOICE_OPTIONS.map(v => v.id), ...customVoices.map(v => v.id)]);
      const newVoices = data.voices.filter((v: VoiceOption) => !existingIds.has(v.id));
      setElevenlabsVoices(newVoices);
      setSelectedImports(new Set(newVoices.map((v: VoiceOption) => v.id)));
      setShowImportDialog(true);
    } catch (error: any) {
      console.error("Failed to fetch ElevenLabs voices:", error);
      toast.error(error.message || "Failed to fetch voices. Make sure your ElevenLabs API key is set in Settings → Integrations.");
    } finally {
      setImportingVoices(false);
    }
  };

  const handleImportSelected = () => {
    const toImport = elevenlabsVoices.filter(v => selectedImports.has(v.id));
    if (toImport.length === 0) return;
    const updated = [...customVoices, ...toImport];
    setCustomVoices(updated);
    saveCustomVoices(updated);
    setShowImportDialog(false);
    toast.success(`Imported ${toImport.length} voice${toImport.length > 1 ? "s" : ""}`);
    if (toImport.length > 0) {
      handleVoiceChange(toImport[0]);
    }
  };

  const toggleImportSelection = (voiceId: string) => {
    setSelectedImports(prev => {
      const next = new Set(prev);
      if (next.has(voiceId)) next.delete(voiceId);
      else next.add(voiceId);
      return next;
    });
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
        <div 
          className="flex-shrink-0 mb-4 cursor-pointer" 
          onClick={() => {
            unlockAudio(); // Unlock iOS audio on any orb tap
            if (waitingForTap) {
              // User tapped — this provides the gesture iOS needs
              setWaitingForTap(false);
              setVoiceEnabled(true);
              setOrbState("listening");
              startListening();
            }
          }}
        >
          <JarvisOrb 
            state={waitingForTap ? "listening" : orbState}
            audioLevel={orbState === "listening" ? voiceInputLevel : audioLevel}
          />
        </div>

        {/* Status text */}
        <div className="flex-shrink-0 mb-4 text-center">
          <p className="text-gold/80 text-xs tracking-widest uppercase">
            {waitingForTap && "Tap the orb to speak"}
            {!waitingForTap && orbState === "listening" && (voiceInputLevel > 0.15 ? "Hearing you..." : "Listening...")}
            {!waitingForTap && orbState === "speaking" && "Speaking..."}
            {!waitingForTap && orbState === "processing" && "Processing..."}
            {!waitingForTap && orbState === "idle" && "Ready"}
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

        {/* ElevenLabs Voice Import */}
        <div className="flex-shrink-0 w-full max-w-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchElevenLabsVoices}
            disabled={importingVoices}
            className="text-gold/60 hover:text-gold text-xs gap-1.5 h-7"
          >
            {importingVoices ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            Import ElevenLabs Voices
          </Button>
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

      {/* ElevenLabs Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="bg-card border-border max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-gold">Import ElevenLabs Voices</DialogTitle>
            <DialogDescription>
              Select voices from your ElevenLabs account to use with Director AI.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1 py-2 max-h-[50vh]">
            {elevenlabsVoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No new voices found. All your ElevenLabs voices are already imported.
              </p>
            ) : (
              elevenlabsVoices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => toggleImportSelection(voice.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                    selectedImports.has(voice.id)
                      ? "bg-gold/10 border border-gold/30"
                      : "bg-muted/20 border border-transparent hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                    selectedImports.has(voice.id) ? "border-gold bg-gold" : "border-muted-foreground"
                  )}>
                    {selectedImports.has(voice.id) && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{voice.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{voice.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{voice.gender}</span>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button
              onClick={handleImportSelected}
              className="bg-gold text-black hover:bg-gold/90"
              disabled={selectedImports.size === 0}
            >
              Import {selectedImports.size} Voice{selectedImports.size !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
