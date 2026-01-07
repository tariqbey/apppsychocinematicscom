import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface TranscriptMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface AgentTranscriptProps {
  messages: TranscriptMessage[];
  currentResponse?: string;
  className?: string;
}

export function AgentTranscript({ messages, currentResponse, className }: AgentTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentResponse]);

  const allMessages = [...messages];
  if (currentResponse) {
    allMessages.push({
      id: "current",
      role: "assistant",
      content: currentResponse,
    });
  }

  // Only show last few messages for cleaner UI
  const visibleMessages = allMessages.slice(-4);

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <ScrollArea 
        ref={scrollRef as any}
        className="h-[180px] px-4"
      >
        <div className="space-y-4 py-2">
          {visibleMessages.length === 0 ? (
            <p className="text-center text-muted-foreground italic">
              Tap the microphone or type to begin your coaching session...
            </p>
          ) : (
            visibleMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-lg px-4 py-3 transition-all animate-fade-in",
                  message.role === "assistant"
                    ? "bg-card/60 border border-gold/20 text-foreground"
                    : "bg-muted/40 border border-border text-muted-foreground ml-8"
                )}
              >
                {message.role === "assistant" && (
                  <span className="text-gold text-xs font-semibold uppercase tracking-wider mb-1 block">
                    Director AI
                  </span>
                )}
                {message.role === "user" && (
                  <span className="text-muted-foreground/70 text-xs font-medium uppercase tracking-wider mb-1 block">
                    You
                  </span>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                  {message.id === "current" && (
                    <span className="inline-block w-2 h-4 bg-gold/70 ml-1 animate-pulse" />
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
