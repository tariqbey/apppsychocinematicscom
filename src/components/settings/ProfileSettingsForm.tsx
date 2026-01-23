import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Loader2 } from "lucide-react";

export function ProfileSettingsForm() {
  const { profile, loading, updateProfile } = useUserProfile();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: "",
    director_character_name: "",
    bio: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        director_character_name: profile.director_character_name || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        display_name: formData.display_name || null,
        director_character_name: formData.director_character_name || null,
        bio: formData.bio || null,
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved. AI prompts will now use your name.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Save Failed",
        description: "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-gold" />
          Your Profile
        </CardTitle>
        <CardDescription>
          Set your name and details. AI scripts and prompts will refer to you by this name.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="e.g., John Smith"
            />
            <p className="text-xs text-muted-foreground">
              This is how AI will address you in scripts and coaching.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="director_character_name">Hero Character Name</Label>
            <Input
              id="director_character_name"
              value={formData.director_character_name}
              onChange={(e) => setFormData({ ...formData, director_character_name: e.target.value })}
              placeholder="e.g., The Director, Captain Victory"
            />
            <p className="text-xs text-muted-foreground">
              Optional alter-ego name for your hero persona in visualizations.
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bio">Bio / About You</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself, your goals, and what drives you..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This context helps AI provide more personalized coaching.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gold hover:bg-gold/90 text-black"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
