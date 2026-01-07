import { useState, useCallback, useEffect, useRef } from "react";
import { X, Mic, MicOff, Volume2, VolumeX, Zap, Send, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceOrb } from "./VoiceOrb";
import { AgentTranscript, TranscriptMessage } from "./AgentTranscript";
import { useVoiceInput } from "@/hooks/useVoiceInput";
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

const WELCOME_MESSAGE = "Good day, Director. I'm your Psycho-Cinematics coach, here to help you stay in character and make today's scene count. How can I support your production today?";

export function DirectorAIAgent({ isOpen, onClose, chiefAim, userId }: DirectorAIAgentProps) {
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orbState, setOrbState] = useState<"idle" | "listening" | "speaking" | "processing">("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasGreeted = useRef(false);

  // Voice input hook
  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceInput({
    onTranscript: (text) => {
      if (text.trim()) {
        setInputText(text);
      }
    },
    continuous: true,
  });

  // Update orb state based on listening
  useEffect(() => {
    if (isListening) {
      setOrbState("listening");
    } else if (!isLoading && orbState === "listening") {
      setOrbState("idle");
    }
  }, [isListening, isLoading, orbState]);

  // Greet on open
  useEffect(() => {
    if (isOpen && !hasGreeted.current && messages.length === 0) {
      hasGreeted.current = true;
      const welcomeMsg: TranscriptMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: WELCOME_MESSAGE,
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
      
      if (ttsEnabled) {
        speakText(WELCOME_MESSAGE);
      }
    }
  }, [isOpen, messages.length, ttsEnabled]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      hasGreeted.current = false;
    }
  }, [isOpen]);

  const speakText = async (text: string) => {
    try {
      setOrbState("speaking");
      
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          text,
          voiceId: "JBFqnCBsd6RMkjVDRZzb", // George - commanding voice
        }),
      });

      if (!response.ok) {
        throw new Error("TTS failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Simulate audio level changes for visual effect
      const levelInterval = setInterval(() => {
        setAudioLevel(Math.random() * 0.5 + 0.3);
      }, 100);
      
      audio.onended = () => {
        clearInterval(levelInterval);
        setAudioLevel(0);
        setOrbState("idle");
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        clearInterval(levelInterval);
        setAudioLevel(0);
        setOrbState("idle");
      };
      
      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setOrbState("idle");
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setOrbState("idle");
    setAudioLevel(0);
  };

  const streamChat = useCallback(async (userMessage: string) => {
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

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: allMessages, chiefAim }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment.");
          return;
        }
        if (response.status === 402) {
          toast.error("AI credits exhausted. Please add credits.");
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
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
      setOrbState("idle");
    } finally {
      setIsLoading(false);
    }
  }, [messages, chiefAim, ttsEnabled]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText("");
    stopListening();
    streamChat(text);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      if (inputText.trim()) {
        handleSend();
      }
    } else {
      stopSpeaking();
      startListening();
    }
  };

  const handleCut = () => {
    stopSpeaking();
    streamChat("CUT! I need to reset. Walk me through the CUT technique right now - help me Recognize what's happening, Cut the scene, Reset my state, and Resume as my Director Character.");
  };

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Spotlight effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-gold/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Main container */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6">
        {/* Header controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Minimize2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-gold tracking-wider mb-2">
            THE DIRECTOR AI
          </h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Your Psycho-Cinematics Coach
          </p>
        </div>

        {/* Voice Orb */}
        <div className="mb-8">
          <VoiceOrb 
            state={orbState} 
            audioLevel={audioLevel}
          />
        </div>

        {/* Transcript */}
        <AgentTranscript 
          messages={messages}
          currentResponse={currentResponse}
          className="mb-8"
        />

        {/* Input area */}
        <div className="w-full max-w-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                className="bg-card/60 border-border/50 h-12 pr-12 text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>

            {/* Voice button */}
            {isSupported && (
              <Button
                variant={isListening ? "default" : "outline"}
                size="icon"
                onClick={handleVoiceToggle}
                disabled={isLoading}
                className={isListening 
                  ? "w-12 h-12 bg-white text-black hover:bg-white/90 animate-pulse" 
                  : "w-12 h-12 border-border/50 hover:border-gold hover:text-gold"
                }
              >
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-4">
            {/* CUT! Button */}
            <Button
              variant="destructive"
              onClick={handleCut}
              disabled={isLoading}
              className="bg-cinematic-red hover:bg-cinematic-red/90 text-white font-bold px-6"
            >
              <Zap className="w-4 h-4 mr-2" />
              CUT!
            </Button>

            {/* TTS Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                if (ttsEnabled) stopSpeaking();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              {ttsEnabled ? (
                <Volume2 className="w-4 h-4 mr-2" />
              ) : (
                <VolumeX className="w-4 h-4 mr-2" />
              )}
              Voice {ttsEnabled ? "On" : "Off"}
            </Button>
          </div>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
}
