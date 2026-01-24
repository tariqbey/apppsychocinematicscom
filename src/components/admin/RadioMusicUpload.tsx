import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Music, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RadioMusicUploadProps {
  onUploadComplete: (url: string, title: string, duration?: number) => void;
  disabled?: boolean;
}

export function RadioMusicUpload({ onUploadComplete, disabled }: RadioMusicUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file (MP3, WAV, etc.)");
      return;
    }

    // Validate file size (max 50MB for audio)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Audio file must be less than 50MB");
      return;
    }

    setSelectedFile(file);
    // Auto-populate title from filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setCustomTitle(nameWithoutExt);
  };

  const getAudioDuration = (file: File): Promise<number | undefined> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration));
      };
      audio.onerror = () => resolve(undefined);
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(10);

    try {
      // Get audio duration
      const duration = await getAudioDuration(selectedFile);
      setProgress(20);

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `radio-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `radio-uploads/${fileName}`;

      // Upload file using XHR for progress tracking
      const formData = new FormData();
      formData.append("file", selectedFile);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const projectUrl = import.meta.env.VITE_SUPABASE_URL;
      const uploadUrl = `${projectUrl}/storage/v1/object/generated-media/${filePath}`;

      const xhr = new XMLHttpRequest();
      
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = 20 + (event.loaded / event.total) * 70;
            setProgress(Math.round(percentComplete));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));

        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("x-upsert", "true");
        xhr.send(selectedFile);
      });

      setProgress(95);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("generated-media")
        .getPublicUrl(filePath);

      setProgress(100);
      
      onUploadComplete(publicUrl, customTitle || selectedFile.name, duration);
      toast.success("Audio uploaded successfully!");

      // Reset form
      setSelectedFile(null);
      setCustomTitle("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload audio file");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setCustomTitle("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center gap-2">
        <Music className="w-5 h-5 text-gold" />
        <Label className="text-base font-medium">Upload Music from Computer</Label>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading || disabled}
      />

      {!selectedFile ? (
        <Button
          type="button"
          variant="outline"
          className="w-full h-20 border-dashed border-2 hover:border-gold/50 hover:bg-gold/5"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Click to select audio file (MP3, WAV, etc.)
            </span>
          </div>
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
            <div className="w-10 h-10 rounded bg-gold/20 flex items-center justify-center">
              <Music className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearSelection}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Track Title</Label>
            <Input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Enter track title"
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading || !customTitle.trim()}
            className="w-full"
            variant="gold"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Upload & Add to Playlist
              </>
            )}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Supported formats: MP3, WAV, AAC, FLAC • Max size: 50MB
      </p>
    </div>
  );
}
