import * as React from "react";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { cn } from "@/lib/utils";

interface VoiceTextareaProps extends TextareaProps {
  onVoiceTranscript?: (transcript: string) => void;
  showVoiceButton?: boolean;
}

const VoiceTextarea = React.forwardRef<HTMLTextAreaElement, VoiceTextareaProps>(
  ({ className, onVoiceTranscript, showVoiceButton = true, onChange, value, ...props }, ref) => {
    const handleTranscript = (transcript: string) => {
      if (onVoiceTranscript) {
        onVoiceTranscript(transcript);
      } else if (onChange) {
        // Simulate an onChange event with appended transcript
        const currentValue = typeof value === "string" ? value : "";
        const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
        const syntheticEvent = {
          target: { value: newValue },
          currentTarget: { value: newValue },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="relative w-full">
        <Textarea
          ref={ref}
          className={cn(showVoiceButton && "pr-12", className)}
          onChange={onChange}
          value={value}
          {...props}
        />
        {showVoiceButton && (
          <VoiceInputButton
            onTranscript={handleTranscript}
            className="absolute right-2 top-2"
          />
        )}
      </div>
    );
  }
);
VoiceTextarea.displayName = "VoiceTextarea";

export { VoiceTextarea };
