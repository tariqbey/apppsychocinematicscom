import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "ghost" | "outline" | "secondary";
}

export const VoiceInputButton = ({
  onTranscript,
  className,
  size = "icon",
  variant = "ghost",
}: VoiceInputButtonProps) => {
  const { isListening, isSupported, toggleListening } = useVoiceInput({
    onTranscript: (transcript) => {
      onTranscript(transcript);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        "shrink-0 transition-colors",
        isListening && "text-red-500 bg-red-500/10 hover:bg-red-500/20",
        className
      )}
      onClick={toggleListening}
      title={isListening ? "Stop voice input" : "Start voice input"}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </Button>
  );
};
