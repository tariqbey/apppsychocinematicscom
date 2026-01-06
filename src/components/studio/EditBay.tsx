import { Film, X, Image, Video, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageGenerator } from "./ImageGenerator";
import { VideoGenerator } from "./VideoGenerator";
import { MediaLibrary } from "./MediaLibrary";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";

interface EditBayProps {
  onClose: () => void;
}

export function EditBay({ onClose }: EditBayProps) {
  const { updateProfile } = useUserProfile();
  const { toast } = useToast();

  const handleVideoGenerated = async (url: string) => {
    await updateProfile({ mind_movie_url: url });
    toast({
      title: "Mind Movie Set!",
      description: "Your AI-generated video is now your Mind Movie.",
    });
  };

  const handleImageGenerated = (url: string) => {
    toast({
      title: "Image Generated!",
      description: "Your image has been saved to the gallery.",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-cinematic-midnight flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-display tracking-wide">The Edit Bay</h2>
            <p className="text-sm text-muted-foreground">AI Media Generation Studio</p>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="image" className="gap-2">
                <Image className="h-4 w-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <Video className="h-4 w-4" />
                Video
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                My Gallery
              </TabsTrigger>
            </TabsList>

            <div className="glass-card p-6 cinematic-border">
              <TabsContent value="image" className="mt-0">
                <ImageGenerator onImageGenerated={handleImageGenerated} />
              </TabsContent>

              <TabsContent value="video" className="mt-0">
                <VideoGenerator onVideoGenerated={handleVideoGenerated} />
              </TabsContent>

              <TabsContent value="gallery" className="mt-0">
                <MediaLibrary
                  onSelect={(media) => {
                    if (media.media_url && media.media_type === "video") {
                      handleVideoGenerated(media.media_url);
                    }
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
