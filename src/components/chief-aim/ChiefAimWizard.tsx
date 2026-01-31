import { useState, useRef, useEffect, useCallback } from "react";
import { X, Sparkles, Target, Calendar, ArrowRightLeft, Map, Send, Loader2, Check, Mic, MicOff, Wand2, ChevronLeft, ChevronRight, Save, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  { id: "what", label: "The Dream", icon: Target, description: "What do you truly want?", placeholder: "I want to become..." },
  { id: "byWhen", label: "The Deadline", icon: Calendar, description: "By when will you achieve it?", placeholder: "By December 31, 2025, I will..." },
  { id: "exchange", label: "The Exchange", icon: ArrowRightLeft, description: "What will you give in return?", placeholder: "I am willing to invest..." },
  { id: "plan", label: "The Plan", icon: Map, description: "What are your first steps?", placeholder: "This week, I will..." },
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
  const [isEnhancing, setIsEnhancing] = useState<StepId | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeVoiceField, setActiveVoiceField] = useState<StepId | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRefs = useRef<Record<StepId, HTMLTextAreaElement | null>>({
    what: null,
    byWhen: null,
    exchange: null,
    plan: null,
  });

  // Voice input for chat
  const chatVoice = useVoiceInput({
    onTranscript: (transcript) => {
      setInput((prev) => prev + " " + transcript);
    },
    onError: (error) => toast.error(error),
  });

  // Voice input for individual fields
  const fieldVoice = useVoiceInput({
    onTranscript: (transcript) => {
      if (activeVoiceField) {
        setAim((prev) => ({ ...prev, [activeVoiceField]: (prev[activeVoiceField] + " " + transcript).trim() }));
      }
    },
    onError: (error) => toast.error(error),
  });

  // Initialize with first prompt when opening
  useEffect(() => {
    if (isOpen) {
      setAim(initialAim);
      if (messages.length === 0) {
        setMessages([{ role: "assistant", content: STEP_PROMPTS.what }]);
      }
    }
  }, [isOpen, initialAim]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Stop voice when switching fields
  useEffect(() => {
    if (fieldVoice.isListening && activeVoiceField !== currentStep) {
      fieldVoice.stopListening();
      setActiveVoiceField(null);
    }
  }, [currentStep]);

  const toggleFieldVoice = useCallback((field: StepId) => {
    if (activeVoiceField === field && fieldVoice.isListening) {
      fieldVoice.stopListening();
      setActiveVoiceField(null);
    } else {
      if (fieldVoice.isListening) {
        fieldVoice.stopListening();
      }
      setActiveVoiceField(field);
      setTimeout(() => fieldVoice.startListening(), 100);
    }
  }, [activeVoiceField, fieldVoice]);

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

  const enhanceField = async (field: StepId) => {
    const currentValue = aim[field];
    if (!currentValue?.trim()) {
      toast.error("Please enter something first before enhancing.");
      return;
    }

    setIsEnhancing(field);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-chief-aim", {
        body: { field, userInput: currentValue, fullAim: aim },
      });

      if (error) throw error;
      if (data?.enhanced) {
        setAim((prev) => ({ ...prev, [field]: data.enhanced }));
        toast.success(`${STEPS.find((s) => s.id === field)?.label} enhanced!`);
      }
    } catch (err: any) {
      console.error("Enhance error:", err);
      toast.error(err?.message || "Failed to enhance. Please try again.");
    } finally {
      setIsEnhancing(null);
    }
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
    // Validate all fields have content
    const missingFields = STEPS.filter((step) => !aim[step.id]?.trim());
    if (missingFields.length > 0) {
      toast.error(`Please complete: ${missingFields.map((f) => f.label).join(", ")}`);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(aim);
      toast.success("Your Definite Chief Aim has been saved!");
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save Chief Aim. Please try again.");
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
  const completedCount = STEPS.filter((step) => aim[step.id]?.trim().length > 0).length;
  const isComplete = completedCount === 4;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide">Script Writer</h2>
              <p className="text-sm text-muted-foreground">{completedCount}/4 Complete</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle AI Chat */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className={cn(showChat && "bg-gold/20 border-gold/40")}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI Help
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-12 w-12 bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded-full"
            >
              <X className="w-6 h-6 text-gold" />
            </Button>
          </div>
        </div>

        {/* Progress Steps - Scrollable on mobile */}
        <div className="px-2 py-3 border-b border-border/30 bg-secondary/20 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max gap-1 px-2">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = aim[step.id]?.trim().length > 0;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[70px]",
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
                    {isCompleted && !isActive ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className={cn("text-xs font-medium whitespace-nowrap", isActive ? "text-gold" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Form Section - Always visible */}
          <div className={cn("flex-1 flex flex-col overflow-hidden", showChat && "hidden lg:flex lg:w-1/2")}>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Current Step Header */}
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-3">
                  <CurrentIcon className="w-5 h-5 text-gold" />
                  <span className="font-display text-lg text-gold">{STEPS[currentStepIndex].label}</span>
                </div>
                <p className="text-muted-foreground">{STEPS[currentStepIndex].description}</p>
              </div>

              {/* Current Field Input */}
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="relative">
                  <Textarea
                    ref={(el) => (textareaRefs.current[currentStep] = el)}
                    value={aim[currentStep]}
                    onChange={(e) => setAim((prev) => ({ ...prev, [currentStep]: e.target.value }))}
                    placeholder={STEPS[currentStepIndex].placeholder}
                    className={cn(
                      "min-h-[150px] text-lg leading-relaxed resize-none pr-14",
                      activeVoiceField === currentStep && fieldVoice.isListening && "border-red-500/50 bg-red-500/5"
                    )}
                  />
                  {/* Voice input button in textarea */}
                  {fieldVoice.isSupported && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFieldVoice(currentStep)}
                      className={cn(
                        "absolute right-3 top-3 h-10 w-10 rounded-full",
                        activeVoiceField === currentStep && fieldVoice.isListening
                          ? "bg-red-500/20 text-red-500 animate-pulse"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {activeVoiceField === currentStep && fieldVoice.isListening ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Voice indicator */}
                {activeVoiceField === currentStep && fieldVoice.isListening && (
                  <div className="flex items-center justify-center gap-2 text-red-500 text-sm animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    Listening... Speak now
                  </div>
                )}

                {/* AI Enhance button */}
                <div className="flex justify-center">
                  <Button
                    onClick={() => enhanceField(currentStep)}
                    disabled={!aim[currentStep]?.trim() || isEnhancing === currentStep}
                    variant="outline"
                    className="gap-2"
                  >
                    {isEnhancing === currentStep ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    AI Enhance
                  </Button>
                </div>

                {/* Preview of all fields */}
                <div className="mt-8 p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Your Chief Aim</h4>
                  <div className="space-y-3">
                    {STEPS.map((step) => {
                      const hasContent = aim[step.id]?.trim().length > 0;
                      const isCurrentStep = step.id === currentStep;
                      return (
                        <div
                          key={step.id}
                          onClick={() => setCurrentStep(step.id)}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all",
                            isCurrentStep ? "bg-gold/10 border border-gold/30" : "hover:bg-secondary/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <step.icon className={cn("w-4 h-4", hasContent ? "text-gold" : "text-muted-foreground")} />
                            <span className={cn("text-xs font-medium", hasContent ? "text-gold" : "text-muted-foreground")}>
                              {step.label}
                            </span>
                            {hasContent && <Check className="w-3 h-3 text-green-500 ml-auto" />}
                          </div>
                          <p className={cn("text-sm line-clamp-2", hasContent ? "text-foreground" : "text-muted-foreground/50 italic")}>
                            {hasContent ? aim[step.id] : `Tap to add ${step.label.toLowerCase()}...`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="p-4 border-t border-border/30 bg-background/80 backdrop-blur-sm pb-[calc(env(safe-area-inset-bottom)+16px)]">
              <div className="flex items-center justify-between max-w-2xl mx-auto gap-3">
                <Button
                  onClick={goToPrevStep}
                  disabled={currentStepIndex === 0}
                  variant="outline"
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                {currentStepIndex < STEPS.length - 1 ? (
                  <Button onClick={goToNextStep} className="flex-1 bg-gold hover:bg-gold/90 text-background">
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !isComplete}
                    className="flex-1 bg-gold hover:bg-gold/90 text-background"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Chief Aim
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Chat Section - Toggle on mobile, side panel on desktop */}
          {showChat && (
            <div className={cn("flex-1 flex flex-col lg:w-1/2 lg:border-l border-border/30")}>
              {/* Chat Header */}
              <div className="p-3 border-b border-border/30 bg-secondary/20 flex items-center justify-between lg:hidden">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="font-medium">AI Assistant</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                  Back to Form
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "max-w-[85%] p-4 rounded-xl",
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

              {/* Chat Input */}
              <div className="p-4 border-t border-border/30">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything about your Chief Aim..."
                      className="min-h-[60px] max-h-[120px] resize-none pr-12"
                      disabled={isLoading}
                    />
                    {chatVoice.isSupported && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "absolute right-2 top-2 h-8 w-8 rounded-full",
                          chatVoice.isListening && "bg-red-500/20 text-red-500 animate-pulse"
                        )}
                        onClick={chatVoice.toggleListening}
                      >
                        {chatVoice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                  <Button onClick={sendMessage} disabled={!input.trim() || isLoading} className="self-end bg-gold hover:bg-gold/90 text-background">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating close button for mobile */}
        <Button
          variant="default"
          size="lg"
          onClick={onClose}
          className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-gold/90 hover:bg-gold text-black shadow-lg shadow-gold/30 sm:hidden"
        >
          <X className="w-7 h-7" />
        </Button>
      </div>
    </div>
  );
};
