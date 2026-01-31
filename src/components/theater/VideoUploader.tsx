import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Film, Loader2, CheckCircle, X, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useChunkedUpload } from "@/hooks/useChunkedUpload";
import { cn } from "@/lib/utils";

interface VideoUploaderProps {
  currentVideoUrl: string | null;
  onUploadComplete: (url: string) => void;
  onClose: () => void;
}

export const VideoUploader = ({
  currentVideoUrl,
  onUploadComplete,
  onClose,
}: VideoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [optimizeForIphone, setOptimizeForIphone] = useState(false);
  const [transcodeForIphone, setTranscodeForIphone] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState(0);
  const [transcodeProgress, setTranscodeProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isUploading, progress, error, uploadFile, cancelUpload } = useChunkedUpload();

  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1)
    );
  }, []);

  // Set default once on mount (iOS gets the safe default)
  useEffect(() => {
    setOptimizeForIphone(isIOS);
  }, [isIOS]);

  const withTimeout = async <T,>(p: Promise<T>, ms: number, label: string) => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    );
    return Promise.race([p, timeout]);
  };

  const remuxFastStartMp4 = async (inputFile: File): Promise<File> => {
    // Practical guard: remuxing huge videos in-browser can fail on mobile.
    const MAX_OPTIMIZE_BYTES = 500 * 1024 * 1024; // 500MB
    if (inputFile.size > MAX_OPTIMIZE_BYTES) {
      throw new Error("Video is too large to optimize on-device. Please upload as-is or export a smaller MP4.");
    }

    const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ]);

    const ffmpeg = new FFmpeg();
    try {
      ffmpeg.on?.("progress", ({ progress }: { progress: number }) => {
        const pct = Math.round(Math.max(0, Math.min(1, progress || 0)) * 100);
        setOptimizeProgress(pct);
      });
    } catch {
      // ignore
    }

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    // Load FFmpeg (with a blob-URL fallback for environments that block direct wasm URLs)
    try {
      await withTimeout(
        ffmpeg.load({
          coreURL: `${baseURL}/ffmpeg-core.js`,
          wasmURL: `${baseURL}/ffmpeg-core.wasm`,
        }),
        isIOS ? 20_000 : 30_000,
        "FFmpeg load"
      );
    } catch {
      const coreURL = await withTimeout(
        toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        isIOS ? 20_000 : 30_000,
        "FFmpeg core fetch"
      );
      const wasmURL = await withTimeout(
        toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        isIOS ? 20_000 : 30_000,
        "FFmpeg wasm fetch"
      );

      await withTimeout(ffmpeg.load({ coreURL, wasmURL }), isIOS ? 25_000 : 40_000, "FFmpeg load (fallback)");
    }

    const inputName = `input-${Date.now()}.mp4`;
    const outputName = `output-${Date.now()}.mp4`;

    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

    // Remux only (no re-encode): moves the MP4 “moov atom” to the front for streaming/iOS.
    await ffmpeg.exec([
      "-hide_banner",
      "-y",
      "-i",
      inputName,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      outputName,
    ]);

    const out = (await ffmpeg.readFile(outputName)) as unknown as Uint8Array;
    // Some TS DOM typings are strict about ArrayBuffer vs SharedArrayBuffer; slice to ArrayBuffer.
    const outArrayBuffer = (out.buffer as ArrayBuffer).slice(out.byteOffset, out.byteOffset + out.byteLength);
    const outBlob = new Blob([outArrayBuffer], { type: "video/mp4" });
    return new File([outBlob], inputFile.name.replace(/\.[^/.]+$/, "") + "-ios.mp4", {
      type: "video/mp4",
      lastModified: Date.now(),
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleUpload(files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not authenticated",
        description: "Please sign in to upload your Mind Movie.",
      });
      return;
    }

    // Validate file type
    const validTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an MP4, WebM, MOV, or AVI video.",
      });
      return;
    }

    // Validate file size (5GB max)
    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 5GB.",
      });
      return;
    }

    setCurrentFile(file);
    setUploadComplete(false);

    let uploadSourceFile: File = file;

    // iOS Safari can fail if MP4 isn’t “fast-start” optimized.
    if (optimizeForIphone && file.type === "video/mp4") {
      try {
        setIsOptimizing(true);
        setOptimizeProgress(0);

        toast({
          title: "Optimizing for iPhone…",
          description: "Preparing your MP4 for smooth iOS playback.",
        });

        uploadSourceFile = await remuxFastStartMp4(file);
      } catch (err: any) {
        console.error("MP4 optimize failed:", err);
        toast({
          variant: "destructive",
          title: "Optimization skipped",
          description: err?.message || "Could not optimize this video on-device.",
        });
      } finally {
        setIsOptimizing(false);
      }
    }

    const fileExt = uploadSourceFile.name.split(".").pop();
    const fileName = `${user.id}/mind-movie-${Date.now()}.${fileExt}`;

    const publicUrl = await uploadFile(uploadSourceFile, fileName, {
      bucket: "mind-movies",
      onProgress: (p) => {
        // Progress is handled by the hook
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: err.message || "Something went wrong. Please try again.",
        });
      },
    });

    if (publicUrl) {
      // Update user profile with video URL
      await supabase
        .from("user_profiles")
        .update({ mind_movie_url: publicUrl })
        .eq("user_id", user.id);

      setUploadComplete(true);
      toast({
        title: "Mind Movie Uploaded!",
        description: "Your vision is now ready for daily screening.",
      });

      onUploadComplete(publicUrl);
    }
  };

  const handleRetry = () => {
    if (currentFile) {
      handleUpload(currentFile);
    }
  };

  const handleCancelUpload = () => {
    cancelUpload();
    toast({
      title: "Upload cancelled",
      description: "You can try again anytime.",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  };

  const estimateTimeRemaining = () => {
    if (!currentFile || progress === 0 || progress >= 100) return null;
    
    // Rough estimate based on typical upload speeds
    const uploadedBytes = (progress / 100) * currentFile.size;
    const remainingBytes = currentFile.size - uploadedBytes;
    
    // Assume average upload speed of 5 Mbps
    const avgSpeedBps = 5 * 1024 * 1024 / 8;
    const secondsRemaining = remainingBytes / avgSpeedBps;
    
    if (secondsRemaining < 60) {
      return `~${Math.ceil(secondsRemaining)} seconds remaining`;
    } else if (secondsRemaining < 3600) {
      return `~${Math.ceil(secondsRemaining / 60)} minutes remaining`;
    } else {
      const hours = Math.floor(secondsRemaining / 3600);
      const mins = Math.ceil((secondsRemaining % 3600) / 60);
      return `~${hours}h ${mins}m remaining`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg glass-card cinematic-border overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-display tracking-wide">Upload Mind Movie</h2>
              <p className="text-sm text-muted-foreground">Your AI-generated vision</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-12 w-12 bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded-full"
          >
            <X className="w-6 h-6 text-gold" />
          </Button>
        </div>

        {/* Floating close button for mobile */}
        <Button
          variant="default"
          size="lg"
          onClick={onClose}
          className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-gold/90 hover:bg-gold text-black shadow-lg shadow-gold/30 sm:hidden"
        >
          <X className="w-7 h-7" />
        </Button>

        {/* Upload Area */}
        <div className="p-6">
          {/* iOS Optimization */}
          <div className="mb-4 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={optimizeForIphone}
                onCheckedChange={(v) => setOptimizeForIphone(Boolean(v))}
                disabled={isUploading || isOptimizing}
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Optimize for iPhone playback</p>
                <p className="text-xs text-muted-foreground">
                  Fixes a common iOS issue where MP4s play a few seconds then stop (adds “fast-start” streaming metadata).
                </p>
                {isOptimizing && (
                  <p className="text-xs text-muted-foreground">Optimizing… {optimizeProgress}%</p>
                )}
              </div>
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300",
              isDragging
                ? "border-gold bg-gold/10"
                : "border-border hover:border-gold/50 hover:bg-secondary/50",
              (isUploading || isOptimizing || isTranscoding) && "pointer-events-none"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              onChange={handleFileSelect}
              className="hidden"
            />

            {error ? (
              <div className="space-y-4">
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
                <p className="text-foreground font-medium">Upload Failed</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
                <Button variant="gold" size="sm" onClick={handleRetry} className="mt-2">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : isOptimizing ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-gold mx-auto animate-spin" />
                <p className="text-foreground font-medium">Optimizing for iPhone playback…</p>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-amber-soft transition-all duration-300"
                    style={{ width: `${optimizeProgress}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-gold">{optimizeProgress}%</p>
              </div>
            ) : isUploading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-gold mx-auto animate-spin" />
                <p className="text-foreground font-medium">Uploading your vision...</p>
                {currentFile && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(currentFile.size)}
                  </p>
                )}
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-amber-soft transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-gold">{progress}%</p>
                {estimateTimeRemaining() && (
                  <p className="text-xs text-muted-foreground">{estimateTimeRemaining()}</p>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelUpload}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Cancel Upload
                </Button>
              </div>
            ) : uploadComplete ? (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-foreground font-medium">Upload Complete!</p>
                <p className="text-sm text-muted-foreground">
                  Your Mind Movie is ready for screening
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center">
                  <Film className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium">
                    Drop your Mind Movie here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  MP4, WebM, MOV, AVI • Max 5GB
                </p>
              </div>
            )}
          </div>

          {currentVideoUrl && (
            <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm text-muted-foreground mb-2">Current Video:</p>
              <p className="text-sm text-foreground truncate">{currentVideoUrl}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="cinematic" onClick={onClose}>
            {isUploading ? "Close" : "Cancel"}
          </Button>
          {uploadComplete && (
            <Button variant="gold" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
