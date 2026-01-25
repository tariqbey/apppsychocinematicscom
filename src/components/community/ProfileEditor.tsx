import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Camera, User, Save, Sparkles, Target, Lightbulb, Handshake, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileEditorProps {
  userId: string;
  currentDisplayName?: string;
  currentAvatarUrl?: string;
  currentBio?: string;
  currentPublicVision?: string;
  currentSkills?: string[];
  currentLookingFor?: string;
  currentCanOffer?: string;
  currentShowCollaborationInfo?: boolean;
  onUpdate: () => void;
}

export function ProfileEditor({ 
  userId, 
  currentDisplayName, 
  currentAvatarUrl, 
  currentBio,
  currentPublicVision,
  currentSkills,
  currentLookingFor,
  currentCanOffer,
  currentShowCollaborationInfo,
  onUpdate 
}: ProfileEditorProps) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(currentDisplayName || "");
  const [bio, setBio] = useState(currentBio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || "");
  const [publicVision, setPublicVision] = useState(currentPublicVision || "");
  const [skills, setSkills] = useState<string[]>(currentSkills || []);
  const [newSkill, setNewSkill] = useState("");
  const [lookingFor, setLookingFor] = useState(currentLookingFor || "");
  const [canOffer, setCanOffer] = useState(currentCanOffer || "");
  const [showCollaborationInfo, setShowCollaborationInfo] = useState(currentShowCollaborationInfo || false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when props change (e.g., after fetching profile)
  useEffect(() => {
    setDisplayName(currentDisplayName || "");
    setBio(currentBio || "");
    setAvatarUrl(currentAvatarUrl || "");
    setPublicVision(currentPublicVision || "");
    setSkills(currentSkills || []);
    setLookingFor(currentLookingFor || "");
    setCanOffer(currentCanOffer || "");
    setShowCollaborationInfo(currentShowCollaborationInfo || false);
  }, [currentDisplayName, currentBio, currentAvatarUrl, currentPublicVision, currentSkills, currentLookingFor, currentCanOffer, currentShowCollaborationInfo]);

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

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 10) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
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
          public_vision: publicVision || null,
          skills: skills.length > 0 ? skills : null,
          looking_for: lookingFor || null,
          can_offer: canOffer || null,
          show_collaboration_info: showCollaborationInfo,
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
      <DialogContent className="bg-card border-gold/20 max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-gold flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Edit Your Director Profile
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 pt-4">
            {/* Avatar Section */}
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

            {/* Basic Info */}
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

            {/* Collaboration Section */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-gold" />
                  <span className="font-display text-lg">Collaboration Info</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="showCollab" className="text-xs text-muted-foreground">
                    Show publicly
                  </Label>
                  <Switch
                    id="showCollab"
                    checked={showCollaborationInfo}
                    onCheckedChange={setShowCollaborationInfo}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Share your dreams, skills, and what you're looking for to connect with fellow directors who can help you manifest your vision.
              </p>

              {/* Public Vision/Dream */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="publicVision" className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gold" />
                  My Dream / Vision
                </Label>
                <Textarea
                  id="publicVision"
                  value={publicVision}
                  onChange={(e) => setPublicVision(e.target.value)}
                  placeholder="What are you working to manifest? Share your vision so others can help..."
                  rows={3}
                  maxLength={500}
                  className="border-gold/20 focus:border-gold resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {publicVision.length}/500
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-2 mb-4">
                <Label className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  My Skills & Expertise
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((skill) => (
                    <Badge 
                      key={skill} 
                      variant="secondary" 
                      className="bg-amber-500/20 text-amber-300 pr-1 gap-1"
                    >
                      {skill}
                      <button 
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill (e.g., Video Editing, Marketing)"
                    className="border-gold/20 focus:border-gold"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                    disabled={skills.length >= 10}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={handleAddSkill}
                    disabled={!newSkill.trim() || skills.length >= 10}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {skills.length}/10 skills
                </p>
              </div>

              {/* Looking For */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="lookingFor" className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  Looking For
                </Label>
                <Textarea
                  id="lookingFor"
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  placeholder="What kind of people, skills, or connections are you seeking?"
                  rows={2}
                  maxLength={300}
                  className="border-gold/20 focus:border-gold resize-none"
                />
              </div>

              {/* Can Offer */}
              <div className="space-y-2">
                <Label htmlFor="canOffer" className="flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-emerald-400" />
                  What I Can Offer
                </Label>
                <Textarea
                  id="canOffer"
                  value={canOffer}
                  onChange={(e) => setCanOffer(e.target.value)}
                  placeholder="What connections, skills, or help can you offer to others?"
                  rows={2}
                  maxLength={300}
                  className="border-gold/20 focus:border-gold resize-none"
                />
              </div>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}