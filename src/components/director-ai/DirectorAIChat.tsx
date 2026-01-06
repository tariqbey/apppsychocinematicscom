import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Scissors, Sparkles, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DirectorAIChatProps {
  isOpen: boolean;
  onToggle: () => void;
  chiefAim: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/director-ai`;

export const DirectorAIChat = ({ isOpen, onToggle, chiefAim }: DirectorAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Welcome, Director. I'm here to keep you in character and moving toward your Chief Aim. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update input field with live transcript
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [isListening, transcript]);

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };

    setMessages((prev) => [...prev, userMsg]);
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
        .filter((m) => m.id !== "1") // Exclude welcome message
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...conversationHistory, { role: "user", content: userMessage }],
          chiefAim,
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

  const handleCut = async () => {
    const cutPrompt = `I need to use the CUT! technique right now. I'm feeling overwhelmed or off-script. Please guide me through the 4-step reset: RECOGNIZE, CUT, RESET, RESUME. Make it personal to my Chief Aim.`;
    await streamChat(cutPrompt);
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
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
        <div ref={messagesEndRef} />
      </div>

      {/* CUT! Button */}
      <div className="px-4 py-2 border-t border-border/50">
        <Button
          variant="cut"
          className="w-full"
          onClick={handleCut}
          disabled={isLoading}
        >
          <Scissors className="w-4 h-4 mr-2" />
          CUT! — I Need a Reset
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
