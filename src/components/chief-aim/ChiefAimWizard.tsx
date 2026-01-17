import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Target, Calendar, ArrowRightLeft, Map, Send, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceTextarea } from "@/components/ui/VoiceTextarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChiefAimData {
  what: string;
  byWhen: string;
  exchange: string;
  plan: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChiefAimWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialAim: ChiefAimData;
  onSave: (aim: ChiefAimData) => Promise<void>;
}

const STEPS = [
  { id: "what", label: "The Dream", icon: Target, description: "What do you truly want?" },
  { id: "byWhen", label: "The Deadline", icon: Calendar, description: "By when will you achieve it?" },
  { id: "exchange", label: "The Exchange", icon: ArrowRightLeft, description: "What will you give in return?" },
  { id: "plan", label: "The Plan", icon: Map, description: "What are your first steps?" },
] as const;

type StepId = typeof STEPS[number]["id"];

const STEP_PROMPTS: Record<StepId, string> = {
  what: "Let's begin with the most important question: What is the one thing you truly desire to achieve or become? Don't hold back — think big and be specific.",
  byWhen: "Excellent. Now let's set your deadline. A goal without a date is just a dream. When will you achieve this? Be specific — give me a date.",
  exchange: "Here's the truth Napoleon Hill taught: you must give something to receive something. What are you willing to invest, sacrifice, or commit to in exchange for this goal?",
  plan: "Finally, let's map out your first steps. What are 2-3 immediate actions you can take this week to begin moving toward your Chief Aim?",
};

export const ChiefAimWizard = ({ isOpen, onClose, initialAim, onSave }: ChiefAimWizardProps) => {
  const [currentStep, setCurrentStep] = useState<StepId>("what");
  const [aim, setAim] = useState<ChiefAimData>(initialAim);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  // Initialize with first prompt when opening
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: "assistant", content: STEP_PROMPTS.what }]);
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chief-aim-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: userMessage }],
            currentStep,
            currentAim: aim,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment.");
          return;
        }
        if (response.status === 402) {
          toast.error("Credits exhausted. Please add more credits.");
          return;
        }
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
              assistantMessage += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                };
                return newMessages;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  const updateAimField = (value: string) => {
    setAim((prev) => ({ ...prev, [currentStep]: value }));
    toast.success(`${STEPS.find((s) => s.id === currentStep)?.label} saved!`);
  };

  const goToNextStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentIndex + 1].id;
      setCurrentStep(nextStep);
      setMessages((prev) => [...prev, { role: "assistant", content: STEP_PROMPTS[nextStep] }]);
    }
  };

  const goToPrevStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(aim);
      toast.success("Your Definite Chief Aim has been saved!");
      onClose();
    } catch (error) {
      toast.error("Failed to save Chief Aim");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const CurrentIcon = STEPS[currentStepIndex].icon;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide">Script Writer</h2>
              <p className="text-sm text-muted-foreground">Craft Your Definite Chief Aim</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="px-4 py-3 border-b border-border/30 bg-secondary/20">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = aim[step.id]?.trim().length > 0;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                    isActive && "bg-gold/10",
                    !isActive && "opacity-60 hover:opacity-100"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isActive && "bg-gold text-background",
                      !isActive && isCompleted && "bg-green-500/20 text-green-500",
                      !isActive && !isCompleted && "bg-secondary text-muted-foreground"
                    )}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={cn("text-xs font-medium", isActive ? "text-gold" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Section */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "max-w-[80%] p-4 rounded-xl",
                    message.role === "user"
                      ? "ml-auto bg-gold/20 text-foreground"
                      : "mr-auto bg-secondary/50 text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="mr-auto bg-secondary/50 p-4 rounded-xl">
                  <Loader2 className="w-5 h-5 animate-spin text-gold" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/30">
              <div className="flex gap-2">
                <VoiceTextarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share your thoughts..."
                  className="min-h-[60px] max-h-[150px] resize-none"
                  disabled={isLoading}
                />
                <Button onClick={sendMessage} disabled={!input.trim() || isLoading} className="self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-80 border-l border-border/30 p-4 hidden lg:flex flex-col">
            <h3 className="font-display text-lg mb-4 flex items-center gap-2">
              <CurrentIcon className="w-5 h-5 text-gold" />
              {STEPS[currentStepIndex].label}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{STEPS[currentStepIndex].description}</p>

            {/* Current field input */}
            <VoiceTextarea
              value={aim[currentStep]}
              onChange={(e) => setAim((prev) => ({ ...prev, [currentStep]: e.target.value }))}
              placeholder={`Enter your ${STEPS[currentStepIndex].label.toLowerCase()}...`}
              className="flex-1 min-h-[120px] mb-4"
            />

            <div className="space-y-2">
              <Button
                onClick={() => updateAimField(aim[currentStep])}
                disabled={!aim[currentStep]?.trim()}
                className="w-full"
                variant="secondary"
              >
                <Check className="w-4 h-4 mr-2" />
                Save This Step
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={goToPrevStep}
                  disabled={currentStepIndex === 0}
                  variant="outline"
                  className="flex-1"
                >
                  Previous
                </Button>
                {currentStepIndex < STEPS.length - 1 ? (
                  <Button onClick={goToNextStep} className="flex-1">
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !aim.what || !aim.byWhen || !aim.exchange || !aim.plan}
                    className="flex-1 bg-gold hover:bg-gold/90 text-background"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete"}
                  </Button>
                )}
              </div>
            </div>

            {/* Preview Card */}
            <div className="mt-6 p-3 rounded-lg bg-secondary/30 border border-border/30">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Preview</h4>
              <div className="space-y-2 text-xs">
                {aim.what && (
                  <div>
                    <span className="text-gold">What:</span>{" "}
                    <span className="text-foreground/80">{aim.what.slice(0, 50)}...</span>
                  </div>
                )}
                {aim.byWhen && (
                  <div>
                    <span className="text-gold">By When:</span>{" "}
                    <span className="text-foreground/80">{aim.byWhen}</span>
                  </div>
                )}
                {aim.exchange && (
                  <div>
                    <span className="text-gold">Exchange:</span>{" "}
                    <span className="text-foreground/80">{aim.exchange.slice(0, 50)}...</span>
                  </div>
                )}
                {aim.plan && (
                  <div>
                    <span className="text-gold">Plan:</span>{" "}
                    <span className="text-foreground/80">{aim.plan.slice(0, 50)}...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
