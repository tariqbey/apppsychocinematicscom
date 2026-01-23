import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMediaGeneration, VideoModel } from "@/hooks/useMediaGeneration";
import { useGlobalReferencePhoto } from "@/hooks/useGlobalReferencePhoto";
import { toast } from "sonner";
import { 
  Film, 
  Wand2, 
  Loader2, 
  Sparkles,
  Target,
  Scissors,
  Flame,
  CheckCircle2,
  Video,
  Upload,
  X,
  Play,
  Camera,
  RefreshCw,
  Download,
  UserCircle,
  Save,
  ChevronDown,
  ChevronUp,
  Ruler,
  Scale,
  Dumbbell,
  Check
} from "lucide-react";

interface ChallengeScene {
  order: number;
  label: string;
  description: string;
  cameraWork?: string;
  nlpOverlay?: string;
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
  videoPrompt?: string; // Auto-generated video prompt
}

interface ChallengeStoryboardWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: {
    id: string;
    situation_description: string;
    emotional_trigger: string;
    target_trait: string;
    scenario_type: string;
  };
  visualizationScript?: string | object;
  savedStoryboard?: {
    scenes: ChallengeScene[];
    referencePhoto: string | null;
  } | null;
  onStoryboardSaved?: () => void;
}

const SCENE_ICONS = [Target, Scissors, Flame, CheckCircle2];
const SCENE_COLORS = ["red", "amber", "purple", "green"] as const;

export function ChallengeStoryboardWizard({
  open,
  onOpenChange,
  challenge,
  visualizationScript,
  savedStoryboard,
  onStoryboardSaved
}: ChallengeStoryboardWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"setup" | "generate" | "preview">("setup");
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [scenes, setScenes] = useState<ChallengeScene[]>([]);
  const [generatingScenes, setGeneratingScenes] = useState(false);
  const [currentGeneratingScene, setCurrentGeneratingScene] = useState(0);
  const [selectedScene, setSelectedScene] = useState<number | null>(null);
  const [animationPrompt, setAnimationPrompt] = useState("");
  const [animationModel, setAnimationModel] = useState<VideoModel>("kling-ai/v1.0/image-to-video");
  const [savingStoryboard, setSavingStoryboard] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastGeneratedSceneIndex, setLastGeneratedSceneIndex] = useState<number | null>(null);

  // Character description state
  const [characterDescOpen, setCharacterDescOpen] = useState(false);
  const [characterDesc, setCharacterDesc] = useState({
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
  const [savingCharacterDesc, setSavingCharacterDesc] = useState(false);
  const [generatingHeroImages, setGeneratingHeroImages] = useState(false);
  const [loadingCharacterDesc, setLoadingCharacterDesc] = useState(false);

  // Global reference photo hook
  const { 
    referencePhotoUrl: globalReferencePhoto, 
    fetchReferencePhoto,
    isLoading: loadingGlobalPhoto 
  } = useGlobalReferencePhoto();

  const {
    isGeneratingImage,
    isGeneratingVideo,
    generateImage,
    generateVideo,
  } = useMediaGeneration();

  // Load character description and hero images
  useEffect(() => {
    if (user && open) {
      fetchCharacterDescription();
    }
  }, [user, open]);

  const fetchCharacterDescription = async () => {
    if (!user) return;
    
    setLoadingCharacterDesc(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("character_height, character_weight, character_build, character_features, hero_image_url, hero_image_side_url, hero_image_back_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCharacterDesc({
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
      setLoadingCharacterDesc(false);
    }
  };

  const handleSaveCharacterDesc = async () => {
    if (!user) return;

    setSavingCharacterDesc(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          character_height: characterDesc.height || null,
          character_weight: characterDesc.weight || null,
          character_build: characterDesc.build || null,
          character_features: characterDesc.features || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Character description saved");
    } catch (error) {
      console.error("Error saving character description:", error);
      toast.error("Failed to save character description");
    } finally {
      setSavingCharacterDesc(false);
    }
  };

  const buildCharacterPrompt = () => {
    const parts: string[] = [];
    
    if (characterDesc.height) {
      parts.push(`${characterDesc.height} tall`);
    }
    if (characterDesc.build) {
      parts.push(`${characterDesc.build} build`);
    }
    if (characterDesc.weight) {
      parts.push(`${characterDesc.weight}`);
    }
    if (characterDesc.features) {
      parts.push(characterDesc.features);
    }

    return parts.length > 0 ? parts.join(", ") : "confident powerful person";
  };

  const handleGenerateHeroImages = async () => {
    if (!user || !referencePhoto) {
      toast.error("Please upload a reference photo first");
      return;
    }

    setGeneratingHeroImages(true);
    try {
      const charPrompt = buildCharacterPrompt();
      
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
        
        const prompt = `Full body character reference sheet, ${charPrompt}, ${pose}, plain neutral gray background, professional studio lighting, ultra high resolution, clean character turnaround sheet style, no props or distractions`;

        const { data, error } = await supabase.functions.invoke("lovable-generate-image", {
          body: {
            prompt,
            images: [referencePhoto],
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
    } catch (error) {
      console.error("Error generating hero images:", error);
      toast.error("Failed to generate hero images");
    } finally {
      setGeneratingHeroImages(false);
    }
  };

  // Load saved storyboard or initialize from global reference photo
  useEffect(() => {
    if (open) {
      if (savedStoryboard?.scenes && savedStoryboard.scenes.length > 0) {
        // Load saved storyboard
        setScenes(savedStoryboard.scenes);
        setReferencePhoto(savedStoryboard.referencePhoto);
        setStep("preview");
        setHasUnsavedChanges(false);
        toast.success("Loaded saved storyboard");
      } else if (!referencePhoto) {
        // No saved storyboard, load global reference photo
        fetchReferencePhoto().then((url) => {
          if (url) {
            setReferencePhoto(url);
          }
        });
      }
    }
  }, [open, savedStoryboard, fetchReferencePhoto, referencePhoto]);

  // Parse visualization script into scenes
  const parseVisualizationScript = useCallback(() => {
    if (!visualizationScript) return [];
    
    const labels = ["The Challenge", "The KUT! Moment", "Transformed Response", "Victory"];
    
    if (Array.isArray(visualizationScript)) {
      return visualizationScript.map((item, i) => ({
        order: i,
        label: labels[i] || `Scene ${i + 1}`,
        description: typeof item === 'string' ? item : item.description || JSON.stringify(item),
        cameraWork: item.cameraWork,
        nlpOverlay: item.nlpOverlay
      }));
    }
    
    if (typeof visualizationScript === 'string') {
      return visualizationScript.split(/\d\)/).filter(Boolean).map((desc, i) => ({
        order: i,
        label: labels[i] || `Scene ${i + 1}`,
        description: desc.trim()
      }));
    }
    
    if (typeof visualizationScript === 'object') {
      return Object.entries(visualizationScript).map(([key, val], i) => ({
        order: i,
        label: labels[i] || key,
        description: typeof val === 'string' ? val : JSON.stringify(val)
      }));
    }
    
    return [];
  }, [visualizationScript]);

  // Convert image to JPEG using canvas (handles HEIC and other unsupported formats)
  const convertToJpeg = async (file: File): Promise<{ blob: Blob; ext: string }> => {
    const originalType = file.type.toLowerCase();
    const originalName = file.name.toLowerCase();
    
    // Check if format is already supported
    const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    const unsupportedExtensions = ['heic', 'heif', 'avif', 'bmp', 'tiff', 'tif'];
    
    const ext = originalName.split('.').pop() || '';
    const needsConversion = unsupportedExtensions.includes(ext) || !supportedFormats.includes(originalType);
    
    if (!needsConversion) {
      return { blob: file, ext: ext === 'jpg' ? 'jpeg' : ext };
    }
    
    // Convert to JPEG using canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, ext: 'jpeg' });
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          'image/jpeg',
          0.92
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for conversion. HEIC format may not be supported in this browser.'));
      };
      
      img.src = url;
    });
  };

  // Handle reference photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      // Convert to supported format if needed (handles HEIC, etc.)
      const { blob, ext } = await convertToJpeg(file);
      const fileName = `${user.id}/storyboard-reference-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('generated-media')
        .upload(fileName, blob, { 
          upsert: true,
          contentType: `image/${ext}`
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('generated-media')
        .getPublicUrl(fileName);

      setReferencePhoto(publicUrl);
      toast.success("Reference photo uploaded!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload photo";
      toast.error(errorMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Initialize scenes from script
  const handleStartGeneration = () => {
    const parsed = parseVisualizationScript();
    if (parsed.length === 0) {
      toast.error("No visualization script available. Please generate one first.");
      return;
    }
    setScenes(parsed);
    setStep("generate");
  };

  // Generate image for a single scene using Nano Banana Pro for higher quality
  const generateSceneImage = async (sceneIndex: number) => {
    const scene = scenes[sceneIndex];
    if (!scene) return;

    // Build character description for the prompt
    const charDescParts: string[] = [];
    if (characterDesc.height) charDescParts.push(`${characterDesc.height} tall`);
    if (characterDesc.build) charDescParts.push(`${characterDesc.build} build`);
    if (characterDesc.weight) charDescParts.push(characterDesc.weight);
    if (characterDesc.features) charDescParts.push(characterDesc.features);
    const charDescription = charDescParts.length > 0 
      ? charDescParts.join(", ") 
      : "";

    // Build comprehensive cinematic prompt with detailed camera specs
    let prompt = `CINEMATIC SCENE: ${scene.description}

CAMERA SETUP:
- Camera: ARRI Alexa 65 with large format sensor
- Lens: Zeiss Master Prime T1.3 or Cooke Anamorphic
- Lighting: Professional 3-point lighting with volumetric atmosphere
`;
    if (scene.cameraWork) {
      prompt += `- Movement: ${scene.cameraWork}\n`;
    }
    prompt += `
PRODUCTION QUALITY:
- Ultra high resolution 8K photorealistic
- Shallow depth of field with creamy bokeh
- Natural film grain texture
- Dramatic contrast and color grading
- Character embodies: ${challenge.target_trait}`;

    // Add character description if available
    if (charDescription) {
      prompt += `\n\nCHARACTER DETAILS:\n${charDescription}`;
    }

    // Use hero images as additional reference if available
    const imagesToUse: string[] = [];
    if (referencePhoto) imagesToUse.push(referencePhoto);
    if (heroImages.front) imagesToUse.push(heroImages.front);

    const enhancedPrompt = referencePhoto 
      ? `Generate a cinematic image featuring the person from the reference photo as the main character. ${charDescription ? `The character is ${charDescription}. ` : ''}${prompt}`
      : prompt;

    // Use Nano Banana Pro for higher quality images
    const imageUrl = await generateImage({
      prompt: enhancedPrompt,
      aspect_ratio: "16:9",
      resolution: "2k",
      images: imagesToUse.length > 0 ? imagesToUse : undefined,
      model: "nano-banana-pro"
    });

    if (imageUrl) {
      // Generate auto-fill video prompt based on scene description
      const videoPrompt = generateVideoPromptForScene(scene);
      
      setScenes(prev => prev.map((s, i) => 
        i === sceneIndex ? { ...s, generatedImageUrl: imageUrl, videoPrompt } : s
      ));
      setHasUnsavedChanges(true);
      setLastGeneratedSceneIndex(sceneIndex);
      return imageUrl;
    }
    return null;
  };

  // Generate a video prompt based on scene content
  const generateVideoPromptForScene = (scene: ChallengeScene): string => {
    const label = scene.label.toLowerCase();
    const trait = challenge.target_trait;
    
    if (label.includes("challenge")) {
      return `Slow push in on the character's face as tension builds. Their expression shifts from uncertainty to determination. Subtle camera movement creates dramatic atmosphere. Character breathes deeply, preparing to embody ${trait}.`;
    } else if (label.includes("kut")) {
      return `Quick dolly out creating visual separation. Character pauses, takes a conscious breath. Lighting shifts subtly as they mentally detach from reactive patterns. Hand gesture or body language shows conscious choice to "KUT!" the old script.`;
    } else if (label.includes("transformed") || label.includes("response")) {
      return `Smooth tracking shot following character's confident movement. Body language transforms to embody ${trait}. Camera circles subtly, capturing the moment of authentic response. Expression shows calm strength and clarity.`;
    } else if (label.includes("victory")) {
      return `Slow motion crane shot pulling back to reveal character in their power. Golden hour lighting. Character's posture radiates ${trait}. Triumphant but grounded energy. Subtle smile of self-mastery.`;
    }
    
    // Default dynamic prompt
    return `Camera slowly pushes in. Character demonstrates ${trait} through body language and expression. ${scene.cameraWork || 'Cinematic movement with dramatic lighting shifts'}. Professional film production quality.`;
  };

  // Generate all scene images
  const handleGenerateAllImages = async () => {
    setGeneratingScenes(true);
    
    for (let i = 0; i < scenes.length; i++) {
      setCurrentGeneratingScene(i);
      await generateSceneImage(i);
    }
    
    setGeneratingScenes(false);
    setCurrentGeneratingScene(0);
    setStep("preview");
    setHasUnsavedChanges(true);
    
    // Auto-select the first scene and scroll into view
    setSelectedScene(0);
    if (scenes[0]?.videoPrompt) {
      setAnimationPrompt(scenes[0].videoPrompt);
    }
    
    // Scroll to first scene after a short delay
    setTimeout(() => {
      document.getElementById('scene-card-0')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    
    toast.success("All storyboard images generated!");
  };

  // Save storyboard to database
  const handleSaveStoryboard = async () => {
    if (!user || scenes.length === 0) return;

    setSavingStoryboard(true);
    try {
      const { error } = await supabase
        .from("adversity_challenges")
        .update({
          storyboard_scenes: scenes as any,
          storyboard_reference_photo: referencePhoto,
          storyboard_created_at: new Date().toISOString()
        })
        .eq("id", challenge.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setHasUnsavedChanges(false);
      toast.success("Storyboard saved!");
      onStoryboardSaved?.();
    } catch (error) {
      console.error("Error saving storyboard:", error);
      toast.error("Failed to save storyboard");
    } finally {
      setSavingStoryboard(false);
    }
  };

  // Generate video from image
  const handleGenerateVideo = async (sceneIndex: number) => {
    const scene = scenes[sceneIndex];
    if (!scene?.generatedImageUrl || !animationPrompt.trim()) {
      toast.error("Please select an image and describe the motion");
      return;
    }

    const videoUrl = await generateVideo({
      model: animationModel,
      prompt: animationPrompt,
      image: scene.generatedImageUrl,
      duration: 5,
      resolution: "1080p",
      aspect_ratio: "16:9"
    });

    if (videoUrl) {
      setScenes(prev => prev.map((s, i) => 
        i === sceneIndex ? { ...s, generatedVideoUrl: videoUrl } : s
      ));
      setHasUnsavedChanges(true);
      toast.success("Animation created!");
      setAnimationPrompt("");
      setSelectedScene(null);
    }
  };

  // Regenerate single scene
  const handleRegenerateScene = async (sceneIndex: number) => {
    setCurrentGeneratingScene(sceneIndex);
    await generateSceneImage(sceneIndex);
    setHasUnsavedChanges(true);
    
    // Auto-scroll to the regenerated scene and select it
    setTimeout(() => {
      document.getElementById(`scene-card-${sceneIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSelectedScene(sceneIndex);
      // Auto-fill the animation prompt from the updated scene
      const updatedScene = scenes[sceneIndex];
      if (updatedScene?.videoPrompt) {
        setAnimationPrompt(updatedScene.videoPrompt);
      }
    }, 300);
    
    toast.success("Scene regenerated!");
  };

  const progress = scenes.length > 0 
    ? ((currentGeneratingScene + 1) / scenes.length) * 100 
    : 0;

  const imageToVideoModels = [
    { model: "kling-ai/v1.0/image-to-video" as VideoModel, name: "Kling 1.0", price: "60-110" },
    { model: "wan-ai/wan2.1-i2v-480p" as VideoModel, name: "Wan 2.1", price: "60-110" },
    { model: "google/veo3-fast/image-to-video" as VideoModel, name: "Veo 3 Fast", price: "60-100" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90dvh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Film className="w-5 h-5 text-gold" />
            Challenge Storyboard Production
          </DialogTitle>
          <DialogDescription>
            Create cinematic visualizations of your transformation
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          {/* Setup Step */}
          {step === "setup" && (
            <div className="space-y-6 py-4">
              {/* Challenge Preview */}
              <Card className="p-4 bg-muted/50">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{challenge.situation_description}</p>
                    <p className="text-xs text-amber-400 mt-1 italic">
                      Trigger: "{challenge.emotional_trigger}"
                    </p>
                  </div>
                </div>
                <Badge className="bg-gold/20 text-gold border-gold/30">
                  {challenge.target_trait}
                </Badge>
              </Card>

              {/* Reference Photo Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gold" />
                  Your Best Self Reference Photo
                </Label>
                <p className="text-xs text-muted-foreground">
                  {globalReferencePhoto && !referencePhoto 
                    ? "Your saved reference photo will be loaded automatically"
                    : "Upload a photo of yourself to appear in all generated scenes"}
                </p>
                
                {loadingGlobalPhoto ? (
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : referencePhoto ? (
                  <div className="space-y-2">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gold/50">
                      <img 
                        src={referencePhoto} 
                        alt="Reference" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => setReferencePhoto(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    {globalReferencePhoto === referencePhoto && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <UserCircle className="w-3 h-3" />
                        Using saved reference
                      </Badge>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-gold/50 transition-colors">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {uploadingPhoto ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8" />
                          <span className="text-sm">Upload photo</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </label>
                )}
              </div>

              {/* Character Description Section */}
              <Collapsible open={characterDescOpen} onOpenChange={setCharacterDescOpen}>
                <CollapsibleTrigger asChild>
                  <Card className="p-4 cursor-pointer hover:border-gold/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserCircle className="w-5 h-5 text-gold" />
                        <div>
                          <h4 className="font-medium text-sm">Character Description</h4>
                          <p className="text-xs text-muted-foreground">
                            {characterDesc.height || characterDesc.build 
                              ? `${characterDesc.height} • ${characterDesc.build} build`
                              : "Add physical details for accurate AI generation"}
                          </p>
                        </div>
                      </div>
                      {characterDescOpen ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </Card>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-3 space-y-4">
                  {loadingCharacterDesc ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Ruler className="w-3 h-3" />
                            Height
                          </Label>
                          <Input
                            value={characterDesc.height}
                            onChange={(e) => setCharacterDesc({ ...characterDesc, height: e.target.value })}
                            placeholder="e.g., 6'2, 7 feet tall"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Scale className="w-3 h-3" />
                            Weight/Size
                          </Label>
                          <Input
                            value={characterDesc.weight}
                            onChange={(e) => setCharacterDesc({ ...characterDesc, weight: e.target.value })}
                            placeholder="e.g., 200 lbs, athletic"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Dumbbell className="w-3 h-3" />
                            Physical Build
                          </Label>
                          <Input
                            value={characterDesc.build}
                            onChange={(e) => setCharacterDesc({ ...characterDesc, build: e.target.value })}
                            placeholder="e.g., muscular, lean, athletic, great physical shape"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            Additional Features
                          </Label>
                          <Textarea
                            value={characterDesc.features}
                            onChange={(e) => setCharacterDesc({ ...characterDesc, features: e.target.value })}
                            placeholder="Hair style, clothing preferences, distinguishing features..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveCharacterDesc}
                          disabled={savingCharacterDesc}
                        >
                          {savingCharacterDesc ? (
                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 mr-1.5" />
                          )}
                          Save Description
                        </Button>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={handleGenerateHeroImages}
                          disabled={generatingHeroImages || !referencePhoto}
                        >
                          {generatingHeroImages ? (
                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3 mr-1.5" />
                          )}
                          Generate Hero Images
                        </Button>
                      </div>

                      {!referencePhoto && (
                        <p className="text-xs text-muted-foreground">
                          Upload a reference photo above to generate hero images
                        </p>
                      )}

                      {/* Hero Images Preview */}
                      {(heroImages.front || heroImages.side || heroImages.back) && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Sparkles className="w-3 h-3 text-gold" />
                              Your Hero Character Sheet
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleGenerateHeroImages}
                              disabled={generatingHeroImages || !referencePhoto}
                              className="h-7 text-xs"
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${generatingHeroImages ? 'animate-spin' : ''}`} />
                              Regenerate
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            {heroImages.front && (
                              <div className="space-y-1">
                                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-gold/30">
                                  <img
                                    src={heroImages.front}
                                    alt="Front view"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <Badge variant="outline" className="w-full justify-center text-xs">Front</Badge>
                              </div>
                            )}
                            {heroImages.side && (
                              <div className="space-y-1">
                                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-gold/30">
                                  <img
                                    src={heroImages.side}
                                    alt="Side view"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <Badge variant="outline" className="w-full justify-center text-xs">Side</Badge>
                              </div>
                            )}
                            {heroImages.back && (
                              <div className="space-y-1">
                                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-gold/30">
                                  <img
                                    src={heroImages.back}
                                    alt="Back view"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <Badge variant="outline" className="w-full justify-center text-xs">Back</Badge>
                              </div>
                            )}
                          </div>
                          
                          <Card className="p-2.5 bg-gold/5 border-gold/20">
                            <p className="text-xs text-muted-foreground">
                              These hero images will be used as references for all AI-generated scenes.
                            </p>
                          </Card>
                        </div>
                      )}
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Credit Estimate */}
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Estimated Cost</h4>
                    <p className="text-xs text-muted-foreground">
                      4 scenes × ~15 credits each
                    </p>
                  </div>
                  <Badge variant="outline" className="text-lg font-bold">
                    ~60 credits
                  </Badge>
                </div>
              </Card>

              <Button
                variant="gold"
                className="w-full"
                onClick={handleStartGeneration}
                disabled={!visualizationScript}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Start Storyboard Production
              </Button>
            </div>
          )}

          {/* Generation Step */}
          {step === "generate" && (
            <div className="space-y-6 py-4">
              {generatingScenes ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-gold mb-4" />
                    <h3 className="font-display text-lg">Generating Scene {currentGeneratingScene + 1} of {scenes.length}</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {scenes[currentGeneratingScene]?.label}
                    </p>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-display text-lg text-center">Your Storyboard Scenes</h3>
                  
                  <div className="grid gap-3">
                    {scenes.map((scene, index) => {
                      const Icon = SCENE_ICONS[index] || Target;
                      const color = SCENE_COLORS[index] || "gold";
                      
                      return (
                        <Card key={index} className={`p-3 border-${color}-500/30 bg-${color}-500/5`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-4 h-4 text-${color}-500`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground uppercase">
                                {scene.label}
                              </p>
                              <p className="text-sm mt-1 line-clamp-2">{scene.description}</p>
                              {scene.cameraWork && (
                                <p className="text-xs text-primary mt-1">🎬 {scene.cameraWork}</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  <Button
                    variant="gold"
                    className="w-full"
                    onClick={handleGenerateAllImages}
                    disabled={isGeneratingImage}
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate All Scene Images
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">Your Storyboard</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("generate")}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate All
                </Button>
              </div>

              <div className="grid gap-4">
                {scenes.map((scene, index) => {
                  const Icon = SCENE_ICONS[index] || Target;
                  const color = SCENE_COLORS[index] || "gold";
                  const isSelected = selectedScene === index;
                  
                  return (
                    <Card 
                      key={index}
                      id={`scene-card-${index}`}
                      className={`p-4 transition-all ${isSelected ? 'ring-2 ring-gold' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 text-${color}-500`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{scene.label}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Scene {index + 1}
                        </Badge>
                      </div>

                      {scene.generatedImageUrl && (
                        <div className="relative rounded-lg overflow-hidden mb-3">
                          <img 
                            src={scene.generatedImageUrl} 
                            alt={scene.label}
                            className="w-full h-48 object-cover"
                          />
                          {scene.generatedVideoUrl && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-primary text-primary-foreground">
                                <Video className="w-3 h-3 mr-1" />
                                Animated
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      {scene.generatedVideoUrl && (
                        <video 
                          src={scene.generatedVideoUrl}
                          controls
                          className="w-full rounded-lg mb-3"
                        />
                      )}

                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {scene.description}
                      </p>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateScene(index)}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage && currentGeneratingScene === index ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3 mr-1" />
                          )}
                          Regenerate
                        </Button>
                        
                        {scene.generatedImageUrl && !scene.generatedVideoUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newSelected = isSelected ? null : index;
                              setSelectedScene(newSelected);
                              // Auto-fill animation prompt with scene's video prompt
                              if (newSelected !== null && scene.videoPrompt) {
                                setAnimationPrompt(scene.videoPrompt);
                              }
                            }}
                            className="border-primary/50"
                          >
                            <Video className="w-3 h-3 mr-1" />
                            Animate
                          </Button>
                        )}
                        
                        {scene.generatedImageUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(scene.generatedImageUrl, '_blank')}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>

                      {/* Animation Panel */}
                      {isSelected && scene.generatedImageUrl && !scene.generatedVideoUrl && (
                        <div className="mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Video Action & Dialogue</Label>
                            <Badge variant="outline" className="text-xs bg-gold/10 text-gold">
                              Auto-filled
                            </Badge>
                          </div>
                          <Textarea
                            value={animationPrompt}
                            onChange={(e) => setAnimationPrompt(e.target.value)}
                            placeholder="Camera slowly pushes in, character takes a deep breath..."
                            rows={3}
                          />
                          
                          <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">Model</Label>
                              <Select 
                                value={animationModel} 
                                onValueChange={(v) => setAnimationModel(v as VideoModel)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {imageToVideoModels.map(m => (
                                    <SelectItem key={m.model} value={m.model}>
                                      {m.name} ({m.price} credits)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => handleGenerateVideo(index)}
                              disabled={isGeneratingVideo || !animationPrompt.trim()}
                            >
                              {isGeneratingVideo ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-1" />
                                  Generate
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {hasUnsavedChanges && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleSaveStoryboard}
                    disabled={savingStoryboard}
                  >
                    {savingStoryboard ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Storyboard
                  </Button>
                )}
                <Button
                  variant="gold"
                  className={hasUnsavedChanges ? "flex-1" : "w-full"}
                  onClick={async () => {
                    if (hasUnsavedChanges) {
                      await handleSaveStoryboard();
                    }
                    onOpenChange(false);
                  }}
                  disabled={savingStoryboard}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {hasUnsavedChanges ? "Save & Close" : "Close"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
