import React, { forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RefreshCw, Save, FileText } from 'lucide-react';

interface LyricsEditorProps {
  lyrics: string;
  onChange: (lyrics: string) => void;
  onRegenerate: () => void;
  onSave: () => void;
  isGenerating: boolean;
  isSaving?: boolean;
}

export const LyricsEditor = forwardRef<HTMLDivElement, LyricsEditorProps>(({
  lyrics,
  onChange,
  onRegenerate,
  onSave,
  isGenerating,
  isSaving = false,
}, ref) => {
  // Count words and characters
  const wordCount = lyrics.trim().split(/\s+/).filter(Boolean).length;
  const charCount = lyrics.length;

  // Parse sections for display
  const sections = lyrics.split(/\[([^\]]+)\]/g).filter(Boolean);

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{wordCount} words · {charCount} characters</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isGenerating}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="relative">
        <Textarea
          value={lyrics}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your lyrics will appear here..."
          className="min-h-[400px] font-mono text-sm leading-relaxed bg-background/50 border-primary/20"
          disabled={isGenerating}
        />
        
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Writing your lyrics...</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 <strong>Tip:</strong> Feel free to edit the lyrics to make them more personal. The AI uses your Chief Aim and storyboard to write, but you know your story best!</p>
        <p>📝 Sections like [VERSE 1], [CHORUS], etc. help structure the song for the music generator.</p>
      </div>
    </div>
  );
});

LyricsEditor.displayName = 'LyricsEditor';
