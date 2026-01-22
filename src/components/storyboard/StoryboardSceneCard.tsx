import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Scene } from "@/hooks/useMindMovieScript";
import { Edit2, Trash2, Check, X, Image as ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryboardSceneCardProps {
  scene: Scene;
  index: number;
  onDelete: () => void;
  onEdit: (updates: Partial<Scene>) => void;
}

export function StoryboardSceneCard({ scene, index, onDelete, onEdit }: StoryboardSceneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(scene.title);
  const [editedNarrative, setEditedNarrative] = useState(scene.narrative);
  const [editedPrompt, setEditedPrompt] = useState(scene.prompt);

  const handleSave = () => {
    onEdit({
      title: editedTitle,
      narrative: editedNarrative,
      prompt: editedPrompt,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(scene.title);
    setEditedNarrative(scene.narrative);
    setEditedPrompt(scene.prompt);
    setIsEditing(false);
  };

  const hasMedia = scene.generatedImageUrl || scene.generatedVideoUrl;

  return (
    <div className={cn(
      "glass-card p-4 space-y-3 transition-all",
      isEditing && "ring-2 ring-gold"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
            Scene {index + 1}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {scene.duration}s
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {hasMedia && (
            <div className="flex items-center gap-1 mr-2">
              {scene.generatedImageUrl && <ImageIcon className="w-3 h-3 text-green-500" />}
              {scene.generatedVideoUrl && <Video className="w-3 h-3 text-blue-500" />}
            </div>
          )}
          {isEditing ? (
            <>
              <Button size="icon" variant="ghost" onClick={handleSave} className="h-7 w-7">
                <Check className="w-4 h-4 text-green-500" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleCancel} className="h-7 w-7">
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="h-7 w-7">
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onDelete} className="h-7 w-7">
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full p-2 rounded border border-border bg-background/50 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Narrative</label>
            <Textarea
              value={editedNarrative}
              onChange={(e) => setEditedNarrative(e.target.value)}
              className="text-sm min-h-[60px]"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Image Prompt</label>
            <Textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="text-sm min-h-[80px]"
            />
          </div>
        </div>
      ) : (
        <>
          <p className="font-medium text-sm">{scene.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{scene.narrative}</p>
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-gold/80 italic line-clamp-2">{scene.emotionalTone}</p>
          </div>
        </>
      )}
    </div>
  );
}
