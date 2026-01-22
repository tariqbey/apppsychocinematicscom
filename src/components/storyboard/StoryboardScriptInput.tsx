import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Sparkles, 
  Upload, 
  Type, 
  Loader2,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryboardScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

export function StoryboardScriptInput({ 
  value, 
  onChange,
  onAnalyze,
  isAnalyzing 
}: StoryboardScriptInputProps) {
  const [inputMethod, setInputMethod] = useState<"idea" | "script" | "file">("idea");

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    onChange(text);
    setInputMethod("script");
  };

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-gold" />
        <h3 className="font-medium">Script Input</h3>
      </div>

      <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="idea" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Quick Idea
          </TabsTrigger>
          <TabsTrigger value="script" className="text-xs">
            <Type className="w-3 h-3 mr-1" />
            Full Script
          </TabsTrigger>
          <TabsTrigger value="file" className="text-xs">
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="idea" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Describe your movie idea in a sentence or two. The AI will expand it into a full storyboard.
          </p>
          <Textarea
            placeholder="I want to visualize myself achieving my goal of... with scenes showing..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[100px]"
          />
        </TabsContent>

        <TabsContent value="script" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Paste a detailed script with scene descriptions. Use @tags for characters and #tags for objects.
          </p>
          <Textarea
            placeholder={`Scene 1: MORNING - Luxury penthouse bedroom
@MainCharacter wakes up in their penthouse overlooking the city skyline...

Scene 2: GARAGE - The collection
#LuxuryCar sits gleaming in the private garage...`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </TabsContent>

        <TabsContent value="file" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Upload a .txt file with your script or story ideas.
          </p>
          <label className={cn(
            "flex flex-col items-center justify-center w-full h-32",
            "border-2 border-dashed border-border rounded-lg cursor-pointer",
            "hover:border-gold/50 hover:bg-muted/30 transition-colors"
          )}>
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to upload</span>
            <span className="text-xs text-muted-foreground/70">.txt files only</span>
            <input
              type="file"
              accept=".txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>
          {value && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
              <span className="text-green-500">✓ Script loaded</span>
              <span className="text-muted-foreground ml-2">
                ({value.length} characters)
              </span>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Analyze Button */}
      {onAnalyze && value.trim() && (
        <Button
          onClick={onAnalyze}
          disabled={isAnalyzing || !value.trim()}
          className="w-full bg-gradient-to-r from-gold/20 to-amber-600/20 hover:from-gold/30 hover:to-amber-600/30 border border-gold/30"
          variant="outline"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Script...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Auto-Extract Elements
            </>
          )}
        </Button>
      )}
    </div>
  );
}
