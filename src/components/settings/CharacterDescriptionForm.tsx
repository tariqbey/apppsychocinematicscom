import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Loader2, 
  Sparkles, 
  User, 
  Ruler, 
  Scale, 
  Dumbbell,
  Camera,
  Check,
  RefreshCw,
  Download,
  CheckCircle,
  Star,
  Trash2,
  ThumbsUp
} from "lucide-react";

interface CharacterDescription {
  height: string;
  weight: string;
  build: string;
  features: string;
}

type ViewType = "front" | "side" | "back";

interface Props {
  referencePhotoUrl: string | null;
  onHeroImageGenerated?: (urls: { front: string; side: string; back: string }) => void;
  onDescriptionChange?: (desc: CharacterDescription) => void;
  onGenerateStyleSheet?: () => void;
  isGeneratingStyleSheet?: boolean;
}

export function CharacterDescriptionForm({ referencePhotoUrl, onHeroImageGenerated, onDescriptionChange, onGenerateStyleSheet, isGeneratingStyleSheet }: Props) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingView, setRegeneratingView] = useState<ViewType | null>(null);
  const [approvedViews, setApprovedViews] = useState<Set<ViewType>>(new Set());
  const [description, setDescription] = useState<CharacterDescription>({
    height: "",
    weight: "",
    build: "",
    features: "",
  });
  const [heroImages, setHeroImages] = useState<{
    front: string | null;
    side: string | null;
    back: string | null;
  }>({ front: null, side: null, back: null });

  useEffect(() => {
    if (user) {
      fetchCharacterDescription();
    }
  }, [user]);

  // Notify parent when description changes
  useEffect(() => {
    onDescriptionChange?.(description);
  }, [description, onDescriptionChange]);

  const fetchCharacterDescription = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("character_height, character_weight, character_build, character_features, hero_image_url, hero_image_side_url, hero_image_back_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDescription({
          height: data.character_height || "",
          weight: data.character_weight || "",
          build: data.character_build || "",
          features: data.character_features || "",
        });
        setHeroImages({
          front: data.hero_image_url || null,
          side: data.hero_image_side_url || null,
          back: data.hero_image_back_url || null,
        });
      }
    } catch (error) {
      console.error("Error fetching character description:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          character_height: description.height || null,
          character_weight: description.weight || null,
          character_build: description.build || null,
          character_features: description.features || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Character description saved");
    } catch (error) {
      console.error("Error saving character description:", error);
      toast.error("Failed to save character description");
    } finally {
      setIsSaving(false);
    }
  };

  const generateHeroImage = async () => {
    if (!user || !referencePhotoUrl) {
      toast.error("Please upload a reference photo first");
      return;
    }

    setIsGenerating(true);
    try {
      const characterDesc = buildCharacterPrompt();
      
      // Generate front, side, and back views
      const views = [
        { view: "front", pose: "heroic front-facing pose, arms crossed confidently, looking directly at camera" },
        { view: "side", pose: "profile view from the side, standing tall with confident posture" },
        { view: "back", pose: "back view showing full body from behind, confident stance" },
      ];

      const generatedUrls: { front: string; side: string; back: string } = {
        front: "",
        side: "",
        back: "",
      };

      for (const { view, pose } of views) {
        toast.info(`Generating ${view} view...`);
        
        const prompt = `Full body character reference sheet, ${characterDesc}, ${pose}, plain neutral gray background, professional studio lighting, ultra high resolution, clean character turnaround sheet style, no props or distractions`;

        const { data, error } = await supabase.functions.invoke("lovable-generate-image", {
          body: {
            prompt,
            images: [referencePhotoUrl],
            aspect_ratio: "3:4",
          },
        });

        if (error) throw error;

        if (data?.imageUrl) {
          generatedUrls[view as keyof typeof generatedUrls] = data.imageUrl;
        }
      }

      // Save hero images to profile
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          hero_image_url: generatedUrls.front || null,
          hero_image_side_url: generatedUrls.side || null,
          hero_image_back_url: generatedUrls.back || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setHeroImages({
        front: generatedUrls.front || null,
        side: generatedUrls.side || null,
        back: generatedUrls.back || null,
      });

      toast.success("Hero images generated and saved!");
      onHeroImageGenerated?.(generatedUrls);
    } catch (error) {
      console.error("Error generating hero image:", error);
      toast.error("Failed to generate hero images");
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateSingleView = async (view: ViewType) => {
    if (!user || !referencePhotoUrl) {
      toast.error("Please upload a reference photo first");
      return;
    }

    setRegeneratingView(view);
    try {
      const characterDesc = buildCharacterPrompt();
      const poses: Record<ViewType, string> = {
        front: "heroic front-facing pose, arms crossed confidently, looking directly at camera",
        side: "profile view from the side, standing tall with confident posture",
        back: "back view showing full body from behind, confident stance",
      };

      toast.info(`Regenerating ${view} view...`);
      
      const prompt = `Full body character reference sheet, ${characterDesc}, ${poses[view]}, plain neutral gray background, professional studio lighting, ultra high resolution, clean character turnaround sheet style, no props or distractions`;

      const { data, error } = await supabase.functions.invoke("lovable-generate-image", {
        body: {
          prompt,
          images: [referencePhotoUrl],
          aspect_ratio: "3:4",
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        const fieldMap: Record<ViewType, string> = {
          front: "hero_image_url",
          side: "hero_image_side_url",
          back: "hero_image_back_url",
        };

        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({
            [fieldMap[view]]: data.imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        setHeroImages((prev) => ({ ...prev, [view]: data.imageUrl }));
        setApprovedViews((prev) => {
          const next = new Set(prev);
          next.delete(view);
          return next;
        });
        toast.success(`${view.charAt(0).toUpperCase() + view.slice(1)} view regenerated!`);
      }
    } catch (error) {
      console.error("Error regenerating view:", error);
      toast.error(`Failed to regenerate ${view} view`);
    } finally {
      setRegeneratingView(null);
    }
  };

  const deleteView = async (view: ViewType) => {
    if (!user) return;

    try {
      const fieldMap: Record<ViewType, string> = {
        front: "hero_image_url",
        side: "hero_image_side_url",
        back: "hero_image_back_url",
      };

      const { error } = await supabase
        .from("user_profiles")
        .update({
          [fieldMap[view]]: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setHeroImages((prev) => ({ ...prev, [view]: null }));
      setApprovedViews((prev) => {
        const next = new Set(prev);
        next.delete(view);
        return next;
      });
      toast.success(`${view.charAt(0).toUpperCase() + view.slice(1)} image deleted`);
    } catch (error) {
      console.error("Error deleting view:", error);
      toast.error("Failed to delete image");
    }
  };

  const approveView = (view: ViewType) => {
    setApprovedViews((prev) => {
      const next = new Set(prev);
      if (next.has(view)) {
        next.delete(view);
      } else {
        next.add(view);
      }
      return next;
    });
    toast.success(`${view.charAt(0).toUpperCase() + view.slice(1)} view ${approvedViews.has(view) ? "unapproved" : "approved"}!`);
  };

  const downloadImage = (url: string, view: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `hero-${view}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${view.charAt(0).toUpperCase() + view.slice(1)} image downloaded`);
  };

  const buildCharacterPrompt = () => {
    const parts: string[] = [];
    
    if (description.height) {
      parts.push(`${description.height} tall`);
    }
    if (description.build) {
      parts.push(`${description.build} build`);
    }
    if (description.weight) {
      parts.push(`${description.weight}`);
    }
    if (description.features) {
      parts.push(description.features);
    }

    return parts.length > 0 ? parts.join(", ") : "confident powerful person";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-gold" />
          Character Description
        </CardTitle>
        <CardDescription>
          Describe your ideal self to enhance AI image generation accuracy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              Height
            </Label>
            <Input
              value={description.height}
              onChange={(e) => setDescription({ ...description, height: e.target.value })}
              placeholder="e.g., 6 feet, 5'10"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-muted-foreground" />
              Desired Weight/Size
            </Label>
            <Input
              value={description.weight}
              onChange={(e) => setDescription({ ...description, weight: e.target.value })}
              placeholder="e.g., 180 lbs, athletic"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-muted-foreground" />
              Physical Build
            </Label>
            <Input
              value={description.build}
              onChange={(e) => setDescription({ ...description, build: e.target.value })}
              placeholder="e.g., muscular, lean, athletic"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-muted-foreground" />
              Additional Features
            </Label>
            <Textarea
              value={description.features}
              onChange={(e) => setDescription({ ...description, features: e.target.value })}
              placeholder="Describe other features: hair style, clothing style preferences, distinguishing characteristics..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save Description
          </Button>
          
          <Button
            variant="gold"
            onClick={generateHeroImage}
            disabled={isGenerating || !referencePhotoUrl}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Hero Images
          </Button>
        </div>

        {!referencePhotoUrl && (
          <p className="text-sm text-muted-foreground">
            Upload a reference photo above to generate your hero images
          </p>
        )}

        {/* Hero Image Preview */}
        {(heroImages.front || heroImages.side || heroImages.back) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                Your Hero Character Sheet
              </h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const urls = [heroImages.front, heroImages.side, heroImages.back].filter(Boolean);
                    urls.forEach((url, i) => {
                      if (url) {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `hero-${['front', 'side', 'back'][i]}.png`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    });
                    toast.success("Downloading hero images...");
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateHeroImage}
                  disabled={isGenerating || !referencePhotoUrl}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(["front", "side", "back"] as ViewType[]).map((view) => {
                const imageUrl = heroImages[view];
                const isRegenerating = regeneratingView === view;
                const isApproved = approvedViews.has(view);

                if (!imageUrl) {
                  return (
                    <div key={view} className="space-y-2">
                      <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
                        <div className="text-center p-4">
                          <Camera className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-xs text-muted-foreground">No {view} image</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 text-xs"
                            onClick={() => regenerateSingleView(view)}
                            disabled={regeneratingView !== null || !referencePhotoUrl}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Generate
                          </Button>
                        </div>
                      </div>
                      <Badge variant="outline" className="w-full justify-center gap-1 text-muted-foreground">
                        {view.charAt(0).toUpperCase() + view.slice(1)}
                      </Badge>
                    </div>
                  );
                }

                return (
                  <div key={view} className="space-y-2">
                    <div className={`aspect-[3/4] rounded-lg overflow-hidden border-2 relative group ${isApproved ? 'border-green-500 ring-2 ring-green-500/30' : 'border-gold/30'}`}>
                      {isRegenerating ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                          <Loader2 className="w-8 h-8 animate-spin text-gold" />
                        </div>
                      ) : null}
                      <img
                        src={imageUrl}
                        alt={`${view} view`}
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay with actions */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <Button
                          size="sm"
                          variant={isApproved ? "default" : "outline"}
                          className={`w-full text-xs ${isApproved ? 'bg-green-600 hover:bg-green-700' : ''}`}
                          onClick={() => approveView(view)}
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          {isApproved ? "Approved ✓" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => regenerateSingleView(view)}
                          disabled={regeneratingView !== null || !referencePhotoUrl}
                        >
                          <RefreshCw className={`w-3 h-3 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
                          Regenerate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => downloadImage(imageUrl, view)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full text-xs"
                          onClick={() => deleteView(view)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                      {/* Approved badge overlay */}
                      {isApproved && (
                        <div className="absolute top-2 right-2 bg-green-600 rounded-full p-1">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant={isApproved ? "default" : "outline"} 
                      className={`w-full justify-center gap-1 ${isApproved ? 'bg-green-600 text-white border-green-600' : ''}`}
                    >
                      {isApproved ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : null}
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                      {isApproved && " ✓"}
                    </Badge>
                  </div>
                );
              })}
            </div>
            
            <Card className="p-3 bg-gold/5 border-gold/20">
              <div className="flex items-start gap-2">
                <Star className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong>Hero Images Active:</strong> Hover over each image to approve, regenerate, download, or delete. Approved images will be used as your identity for all AI-generated scenes.
                </p>
              </div>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
