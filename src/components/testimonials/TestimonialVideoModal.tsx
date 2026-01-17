import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestimonialVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  displayName: string;
}

export function TestimonialVideoModal({ 
  open, 
  onOpenChange, 
  videoUrl, 
  displayName 
}: TestimonialVideoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 bg-black border-none">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <video
            src={videoUrl}
            controls
            autoPlay
            playsInline
            className="w-full max-h-[80vh] object-contain"
          >
            Your browser does not support video playback.
          </video>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white font-medium">{displayName}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
