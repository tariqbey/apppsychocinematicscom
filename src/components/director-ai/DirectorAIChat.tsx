import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, Scissors, Sparkles, Loader2, Mic, MicOff, Volume2, VolumeX, ChevronDown, Play, Square, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useEpisodes } from "@/hooks/useEpisodes";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DirectorAIChatProps {
  isOpen: boolean;
  onToggle: () => void;
  chiefAim: string;
  userId?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/director-ai`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

const VOICE_OPTIONS = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Authoritative, warm", sample: "Welcome, Director. Let's make today count." },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Friendly, expressive", sample: "Hey there! I'm here to help you shine." },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Clear, professional", sample: "Let's focus on your goals today." },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Calm, reassuring", sample: "Take a breath. You've got this." },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Deep, confident", sample: "Time to direct your story." },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Soft, gentle", sample: "I believe in you. Let's begin." },
];

type VoiceOption = (typeof VOICE_OPTIONS)[number];

const LOADING_WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "",
};

const SUMMARY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-chat-summary`;

export const DirectorAIChat = ({ isOpen, onToggle, chiefAim, userId }: DirectorAIChatProps) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([LOADING_WELCOME]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isGeneratingGreeting, setIsGeneratingGreeting] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0]);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasLoadedHistory = useRef(false);
  
  // Get active episode for context
  const { activeEpisode, getDaysRemaining } = useEpisodes();

  // Load chat history and generate summary on mount
  useEffect(() => {
    if (!userId || hasLoadedHistory.current) return;
    
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("id, role, content")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .limit(100);

        if (error) throw error;

        if (data && data.length > 0) {
          const loadedMessages: Message[] = data.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }));
          setMessages([LOADING_WELCOME, ...loadedMessages]);

          // Generate summary if we have enough messages
          if (data.length >= 3) {
            generateSummary();
          }
        }
        hasLoadedHistory.current = true;
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [userId]);

  // Generate dynamic opening message based on user's current status
  useEffect(() => {
    if (!isOpen || !chiefAim) return;
    // Only generate if the welcome message is still empty (not yet greeted)
    const welcomeMsg = messages.find(m => m.id === "welcome");
    if (!welcomeMsg || welcomeMsg.content) return;

    const generateGreeting = async () => {
      setIsGeneratingGreeting(true);
      try {
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Give me your opening greeting. Check my status — journal, tasks, streak, scorecard, everything — and come at me based on what you see. Keep it to 2-3 sentences max. Be real. Don't introduce yourself, just jump in like you already know me." }],
            chiefAim,
            userContext: activeEpisode ? {
              activeEpisode: {
                title: activeEpisode.title,
                objective: activeEpisode.objective,
                deadline: activeEpisode.deadline,
                daysRemaining: getDaysRemaining(activeEpisode.deadline),
                alignmentScore: activeEpisode.alignment_score,
                status: activeEpisode.status,
              },
            } : undefined,
            isGreeting: true,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to generate greeting");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let greetingContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                greetingContent += content;
                setMessages(prev => prev.map(m => m.id === "welcome" ? { ...m, content: greetingContent } : m));
              }
            } catch { break; }
          }
        }

        if (greetingContent.trim()) {
          speakText(greetingContent);
        }
      } catch (error) {
        console.error("Greeting generation error:", error);
        // Fallback to a static message
        setMessages(prev => prev.map(m => m.id === "welcome" 
          ? { ...m, content: "What's good, Director. I'm locked in on your status — let's get to work. What's on your mind?" } 
          : m
        ));
      } finally {
        setIsGeneratingGreeting(false);
      }
    };

    generateGreeting();
  }, [isOpen, chiefAim]);

  // Generate chat summary
  const generateSummary = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return;

      const response = await fetch(SUMMARY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.summary) {
          setChatSummary(data.summary);
        }
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
    }
  };

  // Save message to database
  const saveMessage = useCallback(async (role: "user" | "assistant", content: string) => {
    if (!userId) return;
    
    try {
      await supabase.from("chat_messages").insert({
        user_id: userId,
        role,
        content,
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  }, [userId]);

  // Clear chat history
  const clearHistory = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      // Clear summary from profile
      await supabase
        .from("user_profiles")
        .update({ chat_summary: null, chat_summary_updated_at: null })
        .eq("user_id", userId);

      setMessages([LOADING_WELCOME]);
      setChatSummary(null);
      toast.success("Chat history cleared");
    } catch (error) {
      console.error("Failed to clear history:", error);
      toast.error("Failed to clear history");
    }
  }, [userId]);

  // Voice input
  const handleVoiceTranscript = (transcript: string) => {
    if (transcript.trim() && !isLoading) {
      streamChat(transcript.trim());
    }
  };

  const { isListening, transcript, isSupported, toggleListening } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
    onError: (error) => toast.error(error),
  });

  const previewVoice = useCallback(async (voice: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If already previewing this voice, stop it
    if (previewingVoice === voice.id && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPreviewingVoice(null);
      return;
    }

    // Stop any current preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    try {
      setPreviewingVoice(voice.id);
      
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: voice.sample, voiceId: voice.id }),
      });

      if (!response.ok) throw new Error("Failed to preview voice");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;

      audio.onended = () => {
        setPreviewingVoice(null);
        URL.revokeObjectURL(audioUrl);
        previewAudioRef.current = null;
      };

      audio.onerror = () => {
        setPreviewingVoice(null);
        URL.revokeObjectURL(audioUrl);
        previewAudioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error("Voice preview error:", error);
      setPreviewingVoice(null);
      toast.error("Failed to preview voice");
    }
  }, [previewingVoice]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update input field with live transcript
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [isListening, transcript]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!ttsEnabled || !text.trim()) return;

    try {
      setIsSpeaking(true);
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, voiceId: selectedVoice.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
    }
  }, [ttsEnabled, selectedVoice.id]);

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };

    setMessages((prev) => [...prev, userMsg]);
    saveMessage("user", userMessage);
    setIsLoading(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id.startsWith("streaming-")) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          { id: `streaming-${Date.now()}`, role: "assistant", content: assistantContent },
        ];
      });
    };

    try {
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome") // Exclude welcome message
        .map((m) => ({ role: m.role, content: m.content }));

      // Build user context including active episode
      const userContext: Record<string, unknown> = {};
      
      if (activeEpisode) {
        userContext.activeEpisode = {
          title: activeEpisode.title,
          objective: activeEpisode.objective,
          deadline: activeEpisode.deadline,
          daysRemaining: getDaysRemaining(activeEpisode.deadline),
          alignmentScore: activeEpisode.alignment_score,
          status: activeEpisode.status,
        };
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...conversationHistory, { role: "user", content: userMessage }],
          chiefAim,
          userContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            /* ignore */
          }
        }
      }
      // Save and speak the complete response
      if (assistantContent.trim()) {
        saveMessage("assistant", assistantContent);
        speakText(assistantContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get AI response");
      
      // Remove the streaming message if it was added
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id.startsWith("streaming-") && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKut = async () => {
    const kutPrompt = `I need to use the KUT! technique right now. I'm feeling overwhelmed or off-script. Please guide me through the 4-step reset: RECOGNIZE, KUT, RESET, RESUME. Make it personal to my Chief Aim.`;
    await streamChat(kutPrompt);
  };

  const handleVoiceToggle = () => {
    if (!isSupported) {
      toast.error("Voice input is not supported in your browser. Try Chrome or Edge.");
      return;
    }
    toggleListening();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    await streamChat(message);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-gold to-amber-soft text-primary-foreground shadow-lg hover:shadow-[0_0_30px_hsl(43_74%_49%_/_0.5)] transition-all duration-300 hover:scale-110 flex items-center justify-center z-50 pulse-gold"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] glass-card flex flex-col z-50 animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-gold/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display text-lg">The Director AI</h3>
            <p className="text-xs text-muted-foreground">Your Psycho-Cinematics Coach</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-xs gap-1 px-2",
                  ttsEnabled ? "text-gold" : "text-muted-foreground"
                )}
                disabled={!ttsEnabled}
              >
                {ttsEnabled ? (
                  <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{selectedVoice.name}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {VOICE_OPTIONS.map((voice) => (
                <DropdownMenuItem
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice)}
                  className={cn(
                    "flex items-center justify-between gap-2 cursor-pointer",
                    selectedVoice.id === voice.id && "bg-gold/10"
                  )}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium">{voice.name}</span>
                    <span className="text-xs text-muted-foreground">{voice.description}</span>
                  </div>
                  <button
                    onClick={(e) => previewVoice(voice, e)}
                    className={cn(
                      "p-1.5 rounded-full hover:bg-secondary transition-colors shrink-0",
                      previewingVoice === voice.id && "text-gold"
                    )}
                    title={previewingVoice === voice.id ? "Stop preview" : "Preview voice"}
                  >
                    {previewingVoice === voice.id ? (
                      <Square className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isSpeaking && audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
                setIsSpeaking(false);
              }
              setTtsEnabled(!ttsEnabled);
            }}
            className="h-8 w-8"
            title={ttsEnabled ? "Disable voice" : "Enable voice"}
          >
            {ttsEnabled ? (
              <Volume2 className="w-4 h-4 text-gold" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          {userId && messages.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearHistory}
              className="h-8 w-8"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle}
            className="h-10 w-10 bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded-full"
          >
            <X className="w-5 h-5 text-gold" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
          </div>
        ) : (
          <>
            {/* Session Summary */}
            {chatSummary && showSummary && (
              <div className="bg-gradient-to-r from-gold/10 to-amber-soft/10 border border-gold/20 rounded-lg p-3 mb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gold mb-1">📽️ Previously on your journey...</p>
                    <p className="text-sm text-foreground/90">{chatSummary}</p>
                  </div>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg p-3 text-sm",
                    message.role === "user"
                      ? "bg-gold text-primary-foreground"
                      : "bg-secondary text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gold" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 border-t border-border/50 flex gap-2">
        <Button
          variant="cut"
          className="flex-1"
          onClick={handleKut}
          disabled={isLoading}
        >
          <Scissors className="w-4 h-4 mr-2" />
          KUT! — Reset
        </Button>
        <Button
          variant="outline"
          className="border-gold/30 text-gold hover:bg-gold/10"
          onClick={() => navigate("/blueprint")}
        >
          <FileText className="w-4 h-4 mr-1" />
          Blueprint
        </Button>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        {/* Voice indicator */}
        {isListening && (
          <div className="mb-2 flex items-center gap-2 text-xs text-gold animate-pulse">
            <div className="w-2 h-2 rounded-full bg-cinematic-red animate-pulse" />
            Listening... speak now
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isListening ? "Listening..." : "Talk to your Director AI..."}
            className="flex-1 bg-secondary rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder:text-muted-foreground"
            disabled={isLoading || isListening}
          />
          <Button
            variant={isListening ? "destructive" : "ghost"}
            size="icon"
            onClick={handleVoiceToggle}
            disabled={isLoading}
            className={cn(
              isListening && "bg-cinematic-red hover:bg-cinematic-red/90 text-white"
            )}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button variant="gold" size="icon" onClick={handleSend} disabled={isLoading || isListening}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
