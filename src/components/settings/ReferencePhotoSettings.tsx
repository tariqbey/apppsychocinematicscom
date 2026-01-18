import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGlobalReferencePhoto } from "@/hooks/useGlobalReferencePhoto";
import { CharacterDescriptionForm } from "./CharacterDescriptionForm";
import { 
  Camera, 
  Upload, 
  Loader2, 
  X, 
  Sparkles,
  User,
  Check
} from "lucide-react";

export function ReferencePhotoSettings() {
  const {
    referencePhotoUrl,
    isUploading,
    isLoading,
    fetchReferencePhoto,
    uploadReferencePhoto,
    clearReferencePhoto,
  } = useGlobalReferencePhoto();

  useEffect(() => {
    fetchReferencePhoto();
  }, [fetchReferencePhoto]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadReferencePhoto(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-gold" />
            Your Reference Photo
          </CardTitle>
          <CardDescription>
            Upload a photo of yourself to use as the base for AI-generated hero images
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
                  <Button variant="outline" size="sm" asChild>
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
                    disabled={isUploading}
                  />
                </label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearReferencePhoto}
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
                      Now fill out your character description below to generate hero images.
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
                      The AI will use your likeness to generate a full-body hero character sheet with front, side, and back views.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Character Description Form */}
      <CharacterDescriptionForm 
        referencePhotoUrl={referencePhotoUrl}
      />
    </div>
  );
}
