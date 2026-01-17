import * as React from "react";
import { Input } from "@/components/ui/input";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { cn } from "@/lib/utils";

interface VoiceInputProps extends React.ComponentProps<"input"> {
  onVoiceTranscript?: (transcript: string) => void;
  showVoiceButton?: boolean;
}

const VoiceInput = React.forwardRef<HTMLInputElement, VoiceInputProps>(
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
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          className={cn(showVoiceButton && "pr-10", className)}
          onChange={onChange}
          value={value}
          {...props}
        />
        {showVoiceButton && (
          <VoiceInputButton
            onTranscript={handleTranscript}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            size="sm"
          />
        )}
      </div>
    );
  }
);
VoiceInput.displayName = "VoiceInput";

export { VoiceInput };
