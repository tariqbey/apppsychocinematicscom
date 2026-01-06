import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Camera, User, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileEditorProps {
  userId: string;
  currentDisplayName?: string;
  currentAvatarUrl?: string;
  currentBio?: string;
  onUpdate: () => void;
}

export function ProfileEditor({ 
  userId, 
  currentDisplayName, 
  currentAvatarUrl, 
  currentBio,
  onUpdate 
}: ProfileEditorProps) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(currentDisplayName || "");
  const [bio, setBio] = useState(currentBio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("community-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("community-media")
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      toast.success("Avatar uploaded!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          display_name: displayName,
          bio: bio,
          avatar_url: avatarUrl,
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Profile updated!");
      onUpdate();
      setOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
          <User className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-gold/20">
        <DialogHeader>
          <DialogTitle className="text-gold">Edit Your Director Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-gold/30">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gold/20 text-gold text-2xl">
                  {displayName?.[0]?.toUpperCase() || "D"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="w-4 h-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Director Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your director name"
              className="border-gold/20 focus:border-gold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about your journey..."
              rows={3}
              className="border-gold/20 focus:border-gold resize-none"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-gold hover:bg-gold/90 text-black"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
