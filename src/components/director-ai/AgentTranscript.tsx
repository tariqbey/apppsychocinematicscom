import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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

  const allMessages = [...messages];
  if (currentResponse) {
    allMessages.push({
      id: "current",
      role: "assistant",
      content: currentResponse,
    });
  }

  // Show more history (mobile users need context), but keep it bounded.
  const visibleMessages = allMessages.slice(-20);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Let DOM paint first (prevents jumpiness on mobile keyboards)
    const raf = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [visibleMessages.length, currentResponse]);

  return (
    <div className={cn("w-full h-full min-h-0", className)}>
      <div
        ref={scrollRef}
        className="h-full min-h-0 overflow-y-auto overscroll-contain px-4"
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
                    : "bg-muted/40 border border-border text-muted-foreground ml-8",
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
      </div>
    </div>
  );
}

