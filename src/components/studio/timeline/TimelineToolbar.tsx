import { 
  MousePointer2, 
  Scissors, 
  Hand, 
  Copy, 
  Clipboard, 
  Trash2,
  SquareDashedMousePointer,
  Magnet,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type EditingTool = "select" | "razor" | "hand" | "range";

interface TimelineToolbarProps {
  activeTool: EditingTool;
  onToolChange: (tool: EditingTool) => void;
  snapEnabled: boolean;
  onSnapToggle: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  hasSelection: boolean;
  hasClipboard: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

interface ToolButtonProps {
  tool: EditingTool;
  activeTool: EditingTool;
  onToolChange: (tool: EditingTool) => void;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}

function ToolButton({ tool, activeTool, onToolChange, icon, label, shortcut }: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={activeTool === tool ? "secondary" : "ghost"}
          size="icon"
          className={cn(
            "h-8 w-8",
            activeTool === tool && "bg-primary/20 text-primary border border-primary/30"
          )}
          onClick={() => onToolChange(tool)}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>{label}</span>
        <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">{shortcut}</kbd>
      </TooltipContent>
    </Tooltip>
  );
}

export function TimelineToolbar({
  activeTool,
  onToolChange,
  snapEnabled,
  onSnapToggle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasSelection,
  hasClipboard,
  onCopy,
  onPaste,
  onDelete,
  onDuplicate,
}: TimelineToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 p-1 bg-card/80 border border-border/50 rounded-lg">
        {/* Tool Selection */}
        <div className="flex items-center gap-0.5">
          <ToolButton
            tool="select"
            activeTool={activeTool}
            onToolChange={onToolChange}
            icon={<MousePointer2 className="h-4 w-4" />}
            label="Selection Tool"
            shortcut="V"
          />
          <ToolButton
            tool="razor"
            activeTool={activeTool}
            onToolChange={onToolChange}
            icon={<Scissors className="h-4 w-4" />}
            label="Razor Tool (Cut)"
            shortcut="C"
          />
          <ToolButton
            tool="hand"
            activeTool={activeTool}
            onToolChange={onToolChange}
            icon={<Hand className="h-4 w-4" />}
            label="Hand Tool (Pan)"
            shortcut="H"
          />
          <ToolButton
            tool="range"
            activeTool={activeTool}
            onToolChange={onToolChange}
            icon={<SquareDashedMousePointer className="h-4 w-4" />}
            label="Range Selection"
            shortcut="R"
          />
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Snap Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={snapEnabled}
              onPressedChange={onSnapToggle}
              className={cn(
                "h-8 w-8",
                snapEnabled && "bg-accent/50 text-accent-foreground"
              )}
            >
              <Magnet className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex items-center gap-2">
            <span>Snap to Grid</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">S</kbd>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <span>Undo</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">⌘Z</kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <span>Redo</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">⌘⇧Z</kbd>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Edit Actions */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onCopy}
                disabled={!hasSelection}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <span>Copy</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">⌘C</kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onPaste}
                disabled={!hasClipboard}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <span>Paste</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">⌘V</kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={!hasSelection}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <span>Delete</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">⌫</kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
