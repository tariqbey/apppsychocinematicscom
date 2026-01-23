import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Loader2, 
  User, 
  Ruler, 
  Scale, 
  Dumbbell,
  Camera,
  Check
} from "lucide-react";

interface CharacterDescription {
  height: string;
  weight: string;
  build: string;
  features: string;
}

interface Props {
  referencePhotoUrl: string | null;
  onDescriptionChange?: (desc: CharacterDescription) => void;
  onGenerateStyleSheet?: () => void;
  isGeneratingStyleSheet?: boolean;
}

export function CharacterDescriptionForm({ referencePhotoUrl, onDescriptionChange, onGenerateStyleSheet, isGeneratingStyleSheet }: Props) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState<CharacterDescription>({
    height: "",
    weight: "",
    build: "",
    features: "",
  });

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
        .select("character_height, character_weight, character_build, character_features")
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
          Describe your physical traits to ensure AI-generated images maintain consistency
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

        {!referencePhotoUrl && (
          <p className="text-sm text-muted-foreground">
            Upload a reference photo above to enable style sheet generation
          </p>
        )}
      </CardContent>
    </Card>
  );
}
