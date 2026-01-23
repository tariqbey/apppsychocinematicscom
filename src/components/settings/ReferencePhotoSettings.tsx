import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGlobalReferencePhoto } from "@/hooks/useGlobalReferencePhoto";
import { useCharacterStyleSheet } from "@/hooks/useCharacterStyleSheet";
import { CharacterDescriptionForm } from "./CharacterDescriptionForm";
import { 
  Camera, 
  Upload, 
  Loader2, 
  X, 
  Sparkles,
  User,
  Check,
  FileImage,
  RefreshCw,
  ThumbsUp,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export function ReferencePhotoSettings() {
  const {
    referencePhotoUrl,
    isUploading,
    isLoading,
    fetchReferencePhoto,
    uploadReferencePhoto,
    clearReferencePhoto,
  } = useGlobalReferencePhoto();

  const {
    styleSheetUrl,
    isApproved,
    isGenerating,
    fetchStyleSheet,
    generateStyleSheet,
    approveStyleSheet,
    clearStyleSheet,
  } = useCharacterStyleSheet();

  const [pendingCharacterDesc, setPendingCharacterDesc] = useState<{
    height?: string;
    weight?: string;
    build?: string;
    features?: string;
  } | null>(null);

  useEffect(() => {
    fetchReferencePhoto();
    fetchStyleSheet();
  }, [fetchReferencePhoto, fetchStyleSheet]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newUrl = await uploadReferencePhoto(file);
      
      // Auto-generate style sheet after uploading reference photo
      if (newUrl) {
        toast.info("Now generating your character style sheet...");
        await generateStyleSheet(newUrl, pendingCharacterDesc || undefined);
      }
    }
  };

  const handleRegenerateStyleSheet = async () => {
    if (!referencePhotoUrl) {
      toast.error("Please upload a reference photo first");
      return;
    }
    await generateStyleSheet(referencePhotoUrl, pendingCharacterDesc || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Reference Photo Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-gold" />
            Your Reference Photo
          </CardTitle>
          <CardDescription>
            Upload a photo of yourself. The system will automatically generate a professional style sheet for AI consistency.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : referencePhotoUrl ? (
            <div className="space-y-4">
              <div className="relative w-40 h-40 mx-auto rounded-xl overflow-hidden border-2 border-gold/50 shadow-lg">
                <img 
                  src={referencePhotoUrl} 
                  alt="Your reference photo" 
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-2 left-2 bg-green-500/90 text-white">
                  <Check className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={isUploading || isGenerating}>
                    <span>
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Replace Photo
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading || isGenerating}
                  />
                </label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    clearReferencePhoto();
                    clearStyleSheet();
                  }}
                  disabled={isUploading || isGenerating}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>

              <Card className="p-3 bg-gold/5 border-gold/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Reference photo active</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fill out your character description below, then review your auto-generated style sheet.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer hover:border-gold/50 transition-colors bg-muted/30">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 animate-spin" />
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Upload Your Photo</p>
                        <p className="text-xs mt-1">PNG, JPEG, or HEIC (auto-converted)</p>
                      </div>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>

              <Card className="p-3 bg-muted/50">
                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Why upload a reference photo?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      When you upload a photo, the system will automatically generate a professional character style sheet with multiple views. This ensures consistent likeness across all AI-generated images.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Style Sheet Card - only show if reference photo exists */}
      {referencePhotoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-gold" />
              Character Style Sheet
              {isApproved && (
                <Badge className="ml-2 bg-green-500">
                  <Check className="w-3 h-3 mr-1" />
                  Approved
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              This multi-view style sheet ensures your character looks consistent across all AI generations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-gold" />
                <p className="text-sm text-muted-foreground">Generating your character style sheet...</p>
                <p className="text-xs text-muted-foreground">This may take 30-60 seconds</p>
              </div>
            ) : styleSheetUrl ? (
              <div className="space-y-4">
                <div className={`relative rounded-xl overflow-hidden border-2 ${isApproved ? 'border-green-500 ring-2 ring-green-500/30' : 'border-gold/30'}`}>
                  <img 
                    src={styleSheetUrl} 
                    alt="Character Style Sheet" 
                    className="w-full h-auto"
                  />
                  {isApproved && (
                    <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                      <Check className="w-3 h-3 mr-1" />
                      Approved
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {!isApproved ? (
                    <Button 
                      variant="gold" 
                      size="sm"
                      onClick={approveStyleSheet}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve Style Sheet
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRegenerateStyleSheet}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearStyleSheet}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>

                {!isApproved && (
                  <Card className="p-3 bg-amber-500/10 border-amber-500/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-600">Review Required</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Please review the style sheet above. Once approved, both your reference photo and this style sheet will be used for all AI image generations to maintain consistency.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {isApproved && (
                  <Card className="p-3 bg-green-500/10 border-green-500/30">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-600">Style Sheet Active</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your approved style sheet and reference photo are now being used for all AI image generations to ensure consistent character appearance.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-4">
                <FileImage className="w-12 h-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground text-center">
                  No style sheet yet. Fill in your character description below and click "Generate Style Sheet".
                </p>
                <Button 
                  variant="gold" 
                  size="sm"
                  onClick={handleRegenerateStyleSheet}
                  disabled={isGenerating || !referencePhotoUrl}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Style Sheet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Character Description Form */}
      <CharacterDescriptionForm 
        referencePhotoUrl={referencePhotoUrl}
        onDescriptionChange={setPendingCharacterDesc}
        onGenerateStyleSheet={handleRegenerateStyleSheet}
        isGeneratingStyleSheet={isGenerating}
      />
    </div>
  );
}
