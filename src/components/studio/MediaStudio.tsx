import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Video, History } from "lucide-react";
import { ImageGenerator } from "./ImageGenerator";
import { VideoGenerator } from "./VideoGenerator";
import { GenerationHistory } from "./GenerationHistory";

interface MediaStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoGenerated?: (url: string) => void;
  onImageGenerated?: (url: string) => void;
}

export function MediaStudio({ open, onOpenChange, onVideoGenerated, onImageGenerated }: MediaStudioProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Media Studio
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="video" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="video" className="gap-2">
              <Video className="h-4 w-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
              <Image className="h-4 w-4" />
              Image
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="mt-6">
            <VideoGenerator onVideoGenerated={(url) => {
              onVideoGenerated?.(url);
            }} />
          </TabsContent>

          <TabsContent value="image" className="mt-6">
            <ImageGenerator onImageGenerated={(url) => {
              onImageGenerated?.(url);
            }} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <GenerationHistory 
              onSelect={(media) => {
                if (media.media_url) {
                  if (media.media_type === "video") {
                    onVideoGenerated?.(media.media_url);
                  } else {
                    onImageGenerated?.(media.media_url);
                  }
                  onOpenChange(false);
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
