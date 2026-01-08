import { useState } from "react";
import { Copy, Check, Pencil, GripVertical, Sparkles, Clock, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Scene } from "@/hooks/useMindMovieScript";

interface SceneCardProps {
  scene: Scene;
  onUpdate?: (updates: Partial<Scene>) => void;
  onGenerateInEditBay?: (prompt: string, referencePhoto?: string | null) => void;
  referencePhoto?: string | null;
  isEditing?: boolean;
  isDragging?: boolean;
}

export function SceneCard({ 
  scene, 
  onUpdate, 
  onGenerateInEditBay,
  referencePhoto,
  isEditing = false,
  isDragging = false,
}: SceneCardProps) {
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(scene.title);
  const [editedNarrative, setEditedNarrative] = useState(scene.narrative);
  const [editedPrompt, setEditedPrompt] = useState(scene.prompt);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(scene.prompt);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy prompt");
    }
  };

  const handleSaveEdit = () => {
    if (onUpdate) {
      onUpdate({
        title: editedTitle,
        narrative: editedNarrative,
        prompt: editedPrompt,
      });
    }
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(scene.title);
    setEditedNarrative(scene.narrative);
    setEditedPrompt(scene.prompt);
    setIsEditMode(false);
  };

  return (
    <Card 
      className={`relative transition-all duration-200 ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${isEditing ? "border-primary/50" : "border-border/50"} bg-card/80 backdrop-blur-sm`}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{scene.order}</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditMode ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="font-semibold mb-2"
              />
            ) : (
              <h4 className="font-semibold text-foreground truncate">{scene.title}</h4>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {scene.duration}s
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {scene.emotionalTone}
              </Badge>
            </div>
          </div>

          {!isEditMode && onUpdate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsEditMode(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Narrative */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Narrative</p>
          {isEditMode ? (
            <Textarea
              value={editedNarrative}
              onChange={(e) => setEditedNarrative(e.target.value)}
              className="text-sm min-h-[60px]"
            />
          ) : (
            <p className="text-sm text-foreground/80">{scene.narrative}</p>
          )}
        </div>

        {/* Prompt */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Image Prompt</p>
          {isEditMode ? (
            <Textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="text-sm min-h-[100px] font-mono"
            />
          ) : (
            <div className="bg-muted/50 rounded-lg p-3 relative group">
              <p className="text-sm font-mono text-foreground/70 line-clamp-3">
                {scene.prompt}
              </p>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopyPrompt}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Generated Media Preview */}
        {(scene.generatedImageUrl || scene.generatedVideoUrl) && (
          <div className="mb-3 flex gap-2">
            {scene.generatedImageUrl && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border/50">
                <img 
                  src={scene.generatedImageUrl} 
                  alt={scene.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {scene.generatedVideoUrl && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border/50 flex items-center justify-center bg-muted">
                <Film className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {isEditMode ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit}>Save</Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPrompt}
              className="flex-1"
            >
              {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              Copy Prompt
            </Button>
            {onGenerateInEditBay && (
              <Button
                size="sm"
                onClick={() => onGenerateInEditBay(scene.prompt, referencePhoto)}
                className="flex-1"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Generate
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
