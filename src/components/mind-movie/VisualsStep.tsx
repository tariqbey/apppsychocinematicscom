import { useState, useCallback, useMemo, useRef } from "react";
import { Image, Film, RefreshCw, Loader2, CheckCircle, Zap, Play, ImagePlus, Video, Coins, Upload, ChevronDown, FolderUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProductionCredits } from "@/hooks/useProductionCredits";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Scene } from "@/hooks/useMindMovieScript";
import type { ImageGenerationParams, VideoGenerationParams } from "@/hooks/useMediaGeneration";
import { toast } from "sonner";
interface VisualsStepProps {
  scenes: Scene[];
  onUpdateScene: (order: number, updates: Partial<Scene>) => void;
  generateImage: (params: ImageGenerationParams) => Promise<string | null>;
  generateVideo: (params: VideoGenerationParams) => Promise<string | null>;
  isGeneratingImage: boolean;
  isGeneratingVideo: boolean;
  onOpenEditBay?: (prompt: string, sceneOrder: number, sceneTitle: string) => void;
}

export function VisualsStep({
  scenes,
  onUpdateScene,
  generateImage,
  generateVideo,
  isGeneratingImage,
  isGeneratingVideo,
  onOpenEditBay,
}: VisualsStepProps) {
  const [generatingImageForScene, setGeneratingImageForScene] = useState<number | null>(null);
  const [generatingVideoForScene, setGeneratingVideoForScene] = useState<number | null>(null);
  const [uploadingImageForScene, setUploadingImageForScene] = useState<number | null>(null);
  const [isBatchGeneratingImages, setIsBatchGeneratingImages] = useState(false);
  const [isBatchGeneratingVideos, setIsBatchGeneratingVideos] = useState(false);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, type: "" });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadScene, setPendingUploadScene] = useState<number | null>(null);

  const { estimateCreditCost } = useProductionCredits();
  const { user } = useAuth();

  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);
  
  const imagesGenerated = scenes.filter(s => s.generatedImageUrl).length;
  const videosGenerated = scenes.filter(s => s.generatedVideoUrl).length;
  const totalScenes = scenes.length;
  
  const scenesWithoutImages = scenes.filter(s => !s.generatedImageUrl);
  const scenesWithoutVideos = scenes.filter(s => s.generatedImageUrl && !s.generatedVideoUrl);

  const estimatedCosts = useMemo(() => {
    const imageCost = estimateCreditCost("image", undefined, "2k") * scenesWithoutImages.length;
    const videoCost = estimateCreditCost("video", 8) * scenesWithoutVideos.length;
    return { imageCost, videoCost };
  }, [scenesWithoutImages.length, scenesWithoutVideos.length, estimateCreditCost]);

  const handleGenerateSceneImage = useCallback(async (sceneOrder: number) => {
    const scene = scenes.find(s => s.order === sceneOrder);
    if (!scene) return;
    
    setGeneratingImageForScene(sceneOrder);
    try {
      const imageUrl = await generateImage({
        prompt: scene.prompt,
        aspect_ratio: "16:9",
        resolution: "2k"
      });

      if (imageUrl) {
        onUpdateScene(sceneOrder, { generatedImageUrl: imageUrl });
        toast.success(`Image generated for Scene ${sceneOrder}!`);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image. Check your credits.");
    } finally {
      setGeneratingImageForScene(null);
    }
  }, [scenes, generateImage, onUpdateScene]);

  const handleUploadSceneImage = useCallback(async (sceneOrder: number, file: File) => {
    if (!user?.id) {
      toast.error("Please sign in to upload images");
      return;
    }

    setUploadingImageForScene(sceneOrder);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${user.id}/storyboard/scene-${sceneOrder}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('generated-media')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('generated-media')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        onUpdateScene(sceneOrder, { generatedImageUrl: urlData.publicUrl });
        toast.success(`Image uploaded for Scene ${sceneOrder}!`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImageForScene(null);
      setPendingUploadScene(null);
    }
  }, [user?.id, onUpdateScene]);

  const triggerFileUpload = useCallback((sceneOrder: number) => {
    setPendingUploadScene(sceneOrder);
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && pendingUploadScene !== null) {
      handleUploadSceneImage(pendingUploadScene, file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [pendingUploadScene, handleUploadSceneImage]);

  const handleBulkUpload = useCallback(async (files: FileList) => {
    if (!user?.id) {
      toast.error("Please sign in to upload images");
      return;
    }

    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      toast.error("No valid image files selected");
      return;
    }

    // Sort files by name to maintain order
    fileArray.sort((a, b) => a.name.localeCompare(b.name));

    setIsBatchUploading(true);
    setBatchProgress({ current: 0, total: Math.min(fileArray.length, sortedScenes.length), type: "uploads" });

    try {
      for (let i = 0; i < Math.min(fileArray.length, sortedScenes.length); i++) {
        const file = fileArray[i];
        const scene = sortedScenes[i];
        
        setBatchProgress({ current: i, total: Math.min(fileArray.length, sortedScenes.length), type: "uploads" });

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const filePath = `${user.id}/storyboard/scene-${scene.order}-${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage
          .from('generated-media')
          .upload(filePath, file, { upsert: true });

        if (error) {
          console.error(`Error uploading file ${i + 1}:`, error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('generated-media')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          onUpdateScene(scene.order, { generatedImageUrl: urlData.publicUrl });
        }
      }
      
      const uploadedCount = Math.min(fileArray.length, sortedScenes.length);
      setBatchProgress({ current: uploadedCount, total: uploadedCount, type: "uploads" });
      toast.success(`Uploaded ${uploadedCount} reference images!`);
      
      if (fileArray.length > sortedScenes.length) {
        toast.info(`Note: Only ${sortedScenes.length} images were used (one per scene)`);
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast.error("Some uploads failed");
    } finally {
      setIsBatchUploading(false);
      setBatchProgress({ current: 0, total: 0, type: "" });
      if (bulkFileInputRef.current) {
        bulkFileInputRef.current.value = '';
      }
    }
  }, [user?.id, sortedScenes, onUpdateScene]);

  const handleBulkFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleBulkUpload(files);
    }
  }, [handleBulkUpload]);

  const handleGenerateSceneVideo = useCallback(async (sceneOrder: number) => {
    const scene = scenes.find(s => s.order === sceneOrder);
    if (!scene?.generatedImageUrl) {
      toast.error("Please generate an image first");
      return;
    }
    
    setGeneratingVideoForScene(sceneOrder);
    try {
      const videoUrl = await generateVideo({
        model: "google/veo3-fast/image-to-video",
        prompt: scene.prompt,
        image: scene.generatedImageUrl,
        duration: Math.min(scene.duration, 8),
        aspect_ratio: "16:9"
      });

      if (videoUrl) {
        onUpdateScene(sceneOrder, { generatedVideoUrl: videoUrl });
        toast.success(`Video generated for Scene ${sceneOrder}!`);
      }
    } catch (error) {
      console.error("Error generating video:", error);
      toast.error("Failed to generate video. Check your credits.");
    } finally {
      setGeneratingVideoForScene(null);
    }
  }, [scenes, generateVideo, onUpdateScene]);

  const handleBatchGenerateImages = useCallback(async () => {
    if (scenesWithoutImages.length === 0) {
      toast.info("All scenes already have images!");
      return;
    }

    setIsBatchGeneratingImages(true);
    setBatchProgress({ current: 0, total: scenesWithoutImages.length, type: "images" });

    try {
      for (let i = 0; i < scenesWithoutImages.length; i++) {
        const scene = scenesWithoutImages[i];
        setBatchProgress({ current: i, total: scenesWithoutImages.length, type: "images" });
        
        const imageUrl = await generateImage({
          prompt: scene.prompt,
          aspect_ratio: "16:9",
          resolution: "2k"
        });

        if (imageUrl) {
          onUpdateScene(scene.order, { generatedImageUrl: imageUrl });
        }
      }
      
      setBatchProgress({ current: scenesWithoutImages.length, total: scenesWithoutImages.length, type: "images" });
      toast.success(`Generated ${scenesWithoutImages.length} images!`);
    } catch (error) {
      console.error("Batch image generation error:", error);
      toast.error("Some images failed to generate. Check your credits.");
    } finally {
      setIsBatchGeneratingImages(false);
      setBatchProgress({ current: 0, total: 0, type: "" });
    }
  }, [scenesWithoutImages, generateImage, onUpdateScene]);

  const handleBatchGenerateVideos = useCallback(async () => {
    if (scenesWithoutVideos.length === 0) {
      toast.info("All scenes with images already have videos!");
      return;
    }

    setIsBatchGeneratingVideos(true);
    setBatchProgress({ current: 0, total: scenesWithoutVideos.length, type: "videos" });

    try {
      for (let i = 0; i < scenesWithoutVideos.length; i++) {
        const scene = scenesWithoutVideos[i];
        if (!scene.generatedImageUrl) continue;
        
        setBatchProgress({ current: i, total: scenesWithoutVideos.length, type: "videos" });
        
        const videoUrl = await generateVideo({
          model: "google/veo3-fast/image-to-video",
          prompt: scene.prompt,
          image: scene.generatedImageUrl,
          duration: Math.min(scene.duration, 8),
          aspect_ratio: "16:9"
        });

        if (videoUrl) {
          onUpdateScene(scene.order, { generatedVideoUrl: videoUrl });
        }
      }
      
      setBatchProgress({ current: scenesWithoutVideos.length, total: scenesWithoutVideos.length, type: "videos" });
      toast.success(`Generated ${scenesWithoutVideos.length} videos!`);
    } catch (error) {
      console.error("Batch video generation error:", error);
      toast.error("Some videos failed to generate. Check your credits.");
    } finally {
      setIsBatchGeneratingVideos(false);
      setBatchProgress({ current: 0, total: 0, type: "" });
    }
  }, [scenesWithoutVideos, generateVideo, onUpdateScene]);

  const isBusy = isBatchGeneratingImages || isBatchGeneratingVideos || isBatchUploading || generatingImageForScene !== null || generatingVideoForScene !== null || uploadingImageForScene !== null;

  return (
    <div className="space-y-6">
      {/* Hidden file input for single uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
      />
      {/* Hidden file input for bulk uploads */}
      <input
        type="file"
        ref={bulkFileInputRef}
        onChange={handleBulkFileInputChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      
      <div>
        <h2 className="text-2xl font-bold mb-2">Generate Visuals</h2>
        <p className="text-muted-foreground">
          Generate images and videos for your {totalScenes} approved scene{totalScenes > 1 ? 's' : ''}. 
          You can also <span className="text-primary">upload your own reference images</span> for free!
        </p>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Image className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Images</p>
              <p className="text-2xl font-bold">{imagesGenerated} / {totalScenes}</p>
              <Progress value={(imagesGenerated / totalScenes) * 100} className="h-1 mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Film className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Videos</p>
              <p className="text-2xl font-bold">{videosGenerated} / {totalScenes}</p>
              <Progress value={(videosGenerated / totalScenes) * 100} className="h-1 mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/30">
        <div className="flex-1 min-w-[200px]">
          <h4 className="font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Batch Generation
          </h4>
          <p className="text-sm text-muted-foreground">Generate all at once to save time</p>
        </div>
        
        <Button
          onClick={handleBatchGenerateImages}
          disabled={isBusy || scenesWithoutImages.length === 0}
          variant="outline"
          className="gap-2"
        >
          {isBatchGeneratingImages ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Images...
            </>
          ) : (
            <>
              <ImagePlus className="w-4 h-4" />
              Generate All Images ({scenesWithoutImages.length})
            </>
          )}
        </Button>
        
        <Button
          onClick={handleBatchGenerateVideos}
          disabled={isBusy || scenesWithoutVideos.length === 0}
          variant="outline"
          className="gap-2"
        >
          {isBatchGeneratingVideos ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Videos...
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              Generate All Videos ({scenesWithoutVideos.length})
            </>
          )}
        </Button>
        
        {/* Bulk Upload Button */}
        <Button
          onClick={() => bulkFileInputRef.current?.click()}
          disabled={isBusy}
          variant="outline"
          className="gap-2"
        >
          {isBatchUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <FolderUp className="w-4 h-4" />
              Upload All (Free)
            </>
          )}
        </Button>
        
        {/* Credit Cost Estimates */}
        <div className="w-full mt-2 text-xs text-muted-foreground flex items-center gap-2">
          <Coins className="w-3 h-3" />
          <span>Est. cost: ~{estimatedCosts.imageCost} credits for images | ~{estimatedCosts.videoCost} credits for videos | Uploads: Free!</span>
        </div>
      </div>

      {/* Batch Progress */}
      {batchProgress.total > 0 && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {batchProgress.type === "uploads" ? "Uploading" : "Generating"} {batchProgress.type}...
            </span>
            <span className="text-sm text-muted-foreground">
              {batchProgress.current + 1} / {batchProgress.total}
            </span>
          </div>
          <Progress value={((batchProgress.current + 1) / batchProgress.total) * 100} className="h-2" />
        </div>
      )}

      {/* Scene Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedScenes.map((scene) => (
          <Card key={scene.order} className="relative overflow-hidden">
            <CardContent className="p-4 space-y-3">
              {/* Scene Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{scene.order}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm line-clamp-1">{scene.title}</h4>
                    <div className="flex items-center gap-1">
                      {scene.generatedImageUrl && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Image
                        </Badge>
                      )}
                      {scene.generatedVideoUrl && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Video
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {scene.duration}s
                </Badge>
              </div>

              {/* Preview Area */}
              <div className="aspect-video rounded-lg overflow-hidden bg-muted/50 relative">
                {scene.generatedVideoUrl ? (
                  <video 
                    src={scene.generatedVideoUrl} 
                    className="w-full h-full object-cover"
                    controls
                    muted
                    playsInline
                  />
                ) : scene.generatedImageUrl ? (
                  <img 
                    src={scene.generatedImageUrl} 
                    alt={scene.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <Image className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">No image yet</span>
                  </div>
                )}
                
                {/* Loading overlays */}
                {generatingImageForScene === scene.order && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                      <span className="text-sm">Generating image...</span>
                    </div>
                  </div>
                )}
                {generatingVideoForScene === scene.order && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
                      <span className="text-sm">Generating video...</span>
                    </div>
                  </div>
                )}
                {uploadingImageForScene === scene.order && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-2" />
                      <span className="text-sm">Uploading image...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Prompt Preview */}
              <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                {scene.prompt}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Image Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={scene.generatedImageUrl ? "outline" : "default"}
                      size="sm"
                      disabled={isBusy}
                      className="flex-1 gap-1"
                    >
                      {generatingImageForScene === scene.order || uploadingImageForScene === scene.order ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : scene.generatedImageUrl ? (
                        <RefreshCw className="w-3 h-3" />
                      ) : (
                        <Image className="w-3 h-3" />
                      )}
                      {scene.generatedImageUrl ? "Replace" : "Image"}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover">
                    <DropdownMenuItem onClick={() => handleGenerateSceneImage(scene.order)}>
                      <ImagePlus className="w-4 h-4 mr-2" />
                      Generate with AI
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => triggerFileUpload(scene.order)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Reference (Free)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant={scene.generatedVideoUrl ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => handleGenerateSceneVideo(scene.order)}
                  disabled={isBusy || !scene.generatedImageUrl}
                  className="flex-1 gap-1"
                  title={!scene.generatedImageUrl ? "Generate image first" : undefined}
                >
                  {generatingVideoForScene === scene.order ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : scene.generatedVideoUrl ? (
                    <RefreshCw className="w-3 h-3" />
                  ) : (
                    <Film className="w-3 h-3" />
                  )}
                  {scene.generatedVideoUrl ? "Regen" : "Video"}
                </Button>
                
                {onOpenEditBay && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenEditBay(scene.prompt, scene.order, scene.title)}
                    disabled={isBusy}
                    title="Open in Edit Bay"
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
