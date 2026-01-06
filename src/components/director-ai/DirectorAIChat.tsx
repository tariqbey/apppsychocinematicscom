import { useState } from "react";
import { MessageCircle, X, Send, Scissors, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export const DirectorAIChat = ({ isOpen, onToggle, chiefAim }: DirectorAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Welcome, Director. I'm here to keep you in character and moving toward your Chief Aim. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isCutMode, setIsCutMode] = useState(false);

  const handleCut = () => {
    setIsCutMode(true);
    const cutMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `🎬 CUT! Let's reset, Director.

**Step 1: RECOGNIZE** — What thought or behavior just pulled you out of character?

**Step 2: CUT** — Say it out loud: "That's not my script."

**Step 3: RESET** — Take 3 deep breaths. Remember: "${chiefAim}"

**Step 4: RESUME** — What's the next action your Director self would take?

You're the Director. This scene doesn't define the movie. Action when ready.`,
    };
    setMessages(prev => [...prev, cutMessage]);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "I hear you, Director. Remember, you're not an extra in your own movie — you're the one calling the shots. Let's get you back on script. What specific action can you take right now that aligns with your Chief Aim?",
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsCutMode(false);
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
      </div>

      {/* CUT! Button */}
      <div className="px-4 py-2 border-t border-border/50">
        <Button
          variant="cut"
          className="w-full"
          onClick={handleCut}
        >
          <Scissors className="w-4 h-4 mr-2" />
          CUT! — I Need a Reset
        </Button>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Talk to your Director AI..."
            className="flex-1 bg-secondary rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder:text-muted-foreground"
          />
          <Button variant="gold" size="icon" onClick={handleSend}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
