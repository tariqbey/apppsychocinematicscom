import { useState, useEffect, useRef } from "react";
import { Film, X, Image, Video, FolderOpen, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageGenerator } from "./ImageGenerator";
import { VideoGenerator } from "./VideoGenerator";
import { MediaLibrary } from "./MediaLibrary";
import { TimelineEditor } from "./timeline/TimelineEditor";
import { useToast } from "@/hooks/use-toast";
import { TimelineExportData } from "@/components/mind-movie/MindMovieScriptWizard";
import { GeneratedMedia } from "@/hooks/useMediaGeneration";

export interface EditBayProps {
  onClose: () => void;
  initialPrompt?: string;
  timelineImportData?: TimelineExportData;
  // Scene context for returning to script wizard
  sceneContext?: {
    sceneOrder: number;
    sceneTitle: string;
    onImageSaved?: (imageUrl: string, sceneOrder: number) => void;
  };
}

export function EditBay({ onClose, initialPrompt, timelineImportData, sceneContext }: EditBayProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(timelineImportData ? "timeline" : "image");
  const [galleryKey, setGalleryKey] = useState(0);
  const [pendingTimelineMedia, setPendingTimelineMedia] = useState<GeneratedMedia | null>(null);
  const [pendingTimelineMediaItems, setPendingTimelineMediaItems] = useState<GeneratedMedia[] | null>(null);
  const previousTab = useRef(activeTab);
  const [lastGeneratedImageUrl, setLastGeneratedImageUrl] = useState<string | null>(null);

  const refreshGallery = () => {
    setGalleryKey(prev => prev + 1);
  };

  // Refresh gallery when switching to gallery tab
  useEffect(() => {
    if (activeTab === "gallery" && previousTab.current !== "gallery") {
      refreshGallery();
    }
    previousTab.current = activeTab;
  }, [activeTab]);

  const handleVideoGenerated = (url: string) => {
    refreshGallery();
    toast({
      title: "Video Generated!",
      description: "Your video has been saved to the gallery.",
      action: (
        <Button variant="outline" size="sm" onClick={() => setActiveTab("gallery")}>
          View Gallery
        </Button>
      ),
    });
  };

  const handleImageGenerated = (url: string) => {
    refreshGallery();
    setLastGeneratedImageUrl(url);
    
    // If we have scene context, offer to save to scene
    if (sceneContext?.onImageSaved) {
      toast({
        title: "Image Generated!",
        description: `Ready to use for Scene ${sceneContext.sceneOrder}`,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              sceneContext.onImageSaved?.(url, sceneContext.sceneOrder);
              onClose();
            }}
          >
            Save & Return to Script
          </Button>
        ),
      });
    } else {
      toast({
        title: "Image Generated!",
        description: "Your image has been saved to the gallery.",
        action: (
          <Button variant="outline" size="sm" onClick={() => setActiveTab("gallery")}>
            View Gallery
          </Button>
        ),
      });
    }
  };

  const handleAddToTimeline = (media: GeneratedMedia) => {
    setPendingTimelineMediaItems(null);
    setPendingTimelineMedia(media);
    setActiveTab("timeline");

    const label =
      media.media_type === "image" ? "Image" : media.media_type === "audio" ? "Audio" : "Video";

    toast({
      title: "Adding to Timeline",
      description: `${label} will be added to your timeline.`,
    });
  };

  const handleAddMultipleToTimeline = (mediaItems: GeneratedMedia[]) => {
    if (mediaItems.length === 0) return;

    setPendingTimelineMedia(null);
    setPendingTimelineMediaItems(mediaItems);
    setActiveTab("timeline");

    toast({
      title: "Adding to Timeline",
      description: `${mediaItems.length} item(s) will be added to your timeline.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-cinematic-midnight flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-display tracking-wide">The Edit Bay</h2>
            <p className="text-sm text-muted-foreground">
              {sceneContext 
                ? `Generating for Scene ${sceneContext.sceneOrder}: ${sceneContext.sceneTitle}` 
                : "AI Media Generation Studio"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sceneContext && lastGeneratedImageUrl && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => {
                sceneContext.onImageSaved?.(lastGeneratedImageUrl, sceneContext.sceneOrder);
                onClose();
              }}
            >
              Save & Return to Script
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-12 w-12 bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded-full"
          >
            <X className="w-6 h-6 text-gold" />
          </Button>
        </div>
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
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
              <TabsTrigger value="timeline" className="gap-2">
                <Clapperboard className="h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="mt-0">
              <div className="glass-card p-6 cinematic-border">
                <ImageGenerator 
                  onImageGenerated={handleImageGenerated}
                  onVideoGenerated={handleVideoGenerated}
                  initialPrompt={initialPrompt}
                />
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-0">
              <div className="glass-card p-6 cinematic-border">
                <VideoGenerator onVideoGenerated={handleVideoGenerated} />
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="mt-0">
              <div className="glass-card p-6 cinematic-border">
                <MediaLibrary
                  key={galleryKey}
                  onAddToTimeline={handleAddToTimeline}
                  onAddMultipleToTimeline={handleAddMultipleToTimeline}
                />
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0 h-[calc(100vh-220px)]">
              <div className="glass-card p-6 cinematic-border h-full">
                <TimelineEditor
                  onExport={(url) => {
                    refreshGallery();
                  }}
                  importData={timelineImportData}
                  onImportComplete={() => {
                    // Clear the import data after import is complete
                  }}
                  onClose={onClose}
                  pendingMedia={pendingTimelineMedia}
                  pendingMediaItems={pendingTimelineMediaItems}
                  onPendingMediaAdded={() => setPendingTimelineMedia(null)}
                  onPendingMediaItemsAdded={() => setPendingTimelineMediaItems(null)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
