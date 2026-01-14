import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Download, Save, Trash2, Volume2, VolumeX } from "lucide-react";

interface ExportReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportedUrl: string | null;
  fileExt: string;
  onConfirmSaveToVault: () => void;
  onDiscard: () => void;
}

export function ExportReviewDialog({
  open,
  onOpenChange,
  exportedUrl,
  fileExt,
  onConfirmSaveToVault,
  onDiscard,
}: ExportReviewDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const downloadName = useMemo(() => {
    const safeExt = fileExt?.replace(".", "") || "mp4";
    return `timeline-export-${Date.now()}.${safeExt}`;
  }, [fileExt]);

  useEffect(() => {
    if (!open) return;
    setIsMuted(false);
    setVolume(1);
  }, [open]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onError = () => {
      console.error("Export review video error:", video.error);
      toast({
        title: "Preview failed",
        description: "This exported file could not be played in your browser.",
        variant: "destructive",
      });
    };

    video.addEventListener("error", onError);
    return () => video.removeEventListener("error", onError);
  }, [toast, open]);

  const handleDownload = () => {
    if (!exportedUrl) return;
    const a = document.createElement("a");
    a.href = exportedUrl;
    a.download = downloadName;
    a.click();
  };

  const handleDiscard = () => {
    onDiscard();
    onOpenChange(false);
  };

  const handleSaveToVault = () => {
    onConfirmSaveToVault();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preview export</DialogTitle>
          <DialogDescription>
            Review your exported video locally before saving it to the Vault.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {exportedUrl ? (
              <video
                ref={videoRef}
                src={exportedUrl}
                className="h-full w-full"
                controls
                playsInline
                preload="auto"
                muted={isMuted}
                onVolumeChange={(e) => {
                  const el = e.currentTarget;
                  setIsMuted(el.muted);
                  setVolume(el.volume);
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                No export to preview.
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                if (videoRef.current) videoRef.current.muted = next;
              }}
              disabled={!exportedUrl}
            >
              {isMuted ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Muted
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Sound
                </>
              )}
            </Button>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10">Vol</span>
              <Slider
                value={[volume * 100]}
                min={0}
                max={100}
                step={1}
                className="flex-1"
                disabled={!exportedUrl}
                onValueChange={(v) => {
                  const next = (v?.[0] ?? 100) / 100;
                  setVolume(next);
                  if (videoRef.current) {
                    videoRef.current.volume = next;
                    if (next > 0 && videoRef.current.muted) {
                      videoRef.current.muted = false;
                      setIsMuted(false);
                    }
                  }
                }}
              />
            </div>

            <Button type="button" variant="outline" size="sm" onClick={handleDownload} disabled={!exportedUrl}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleDiscard} disabled={!exportedUrl}>
            <Trash2 className="h-4 w-4 mr-2" />
            Discard
          </Button>
          <Button type="button" onClick={handleSaveToVault} disabled={!exportedUrl}>
            <Save className="h-4 w-4 mr-2" />
            Save to Vault
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
