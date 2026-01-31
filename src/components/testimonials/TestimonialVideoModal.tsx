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
      <DialogContent className="max-w-3xl p-0 bg-black border-none" hideCloseButton>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 h-12 w-12 bg-gold/80 hover:bg-gold rounded-full text-black shadow-lg shadow-gold/30"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          {/* Floating close button for mobile - easy thumb access */}
          <Button
            variant="default"
            size="lg"
            onClick={() => onOpenChange(false)}
            className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-gold/90 hover:bg-gold text-black shadow-lg shadow-gold/30 sm:hidden"
          >
            <X className="w-7 h-7" />
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
