import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export const InfoTooltip = ({ content, className = "" }: InfoTooltipProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
