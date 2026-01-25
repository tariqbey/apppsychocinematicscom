import { useState, useEffect } from "react";
import { Sparkles, Send, Loader2, Globe, Lock, Users, Search, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ShareToCommunityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: "image" | "video" | "audio";
  defaultCaption?: string;
}

const POST_TYPES = [
  { id: "manifestation", label: "Manifestation", icon: "✨", description: "Share what you're creating" },
  { id: "win", label: "Win", icon: "🏆", description: "Celebrate your creation" },
  { id: "insight", label: "Insight", icon: "💡", description: "Share a realization" },
];

type VisibilityType = "public" | "private" | "specific";

const VISIBILITY_OPTIONS = [
  { id: "public" as VisibilityType, label: "Public", icon: Globe, description: "Everyone in Director's Corner" },
  { id: "private" as VisibilityType, label: "Private", icon: Lock, description: "Only you can see" },
  { id: "specific" as VisibilityType, label: "Specific People", icon: Users, description: "Choose who sees this" },
];

interface DirectorProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function ShareToCommunityDialog({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  defaultCaption = "",
}: ShareToCommunityDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [caption, setCaption] = useState(defaultCaption);
  const [postType, setPostType] = useState("manifestation");
  const [visibility, setVisibility] = useState<VisibilityType>("public");
  const [selectedUsers, setSelectedUsers] = useState<DirectorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DirectorProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCaption(defaultCaption);
      setPostType("manifestation");
      setVisibility("public");
      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen, defaultCaption]);

  // Search for directors when query changes
  useEffect(() => {
    const searchDirectors = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("user_id, display_name, avatar_url")
          .ilike("display_name", `%${searchQuery}%`)
          .neq("user_id", user?.id || "")
          .limit(10);

        if (error) throw error;
        
        // Filter out already selected users
        const filtered = (data || []).filter(
          (profile) => !selectedUsers.some((s) => s.user_id === profile.user_id)
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error("Error searching directors:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchDirectors, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user?.id, selectedUsers]);

  const handleAddUser = (profile: DirectorProfile) => {
    setSelectedUsers((prev) => [...prev, profile]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((p) => p.user_id !== userId));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to share to the community.",
        variant: "destructive",
      });
      return;
    }

    if (visibility === "specific" && selectedUsers.length === 0) {
      toast({
        title: "Select recipients",
        description: "Please select at least one person to share with.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const sharedWithIds = visibility === "specific" 
        ? selectedUsers.map((u) => u.user_id) 
        : [];

      const { error } = await supabase
        .from('director_posts')
        .insert({
          user_id: user.id,
          content: caption.trim() || "Check out my latest creation! ✨",
          post_type: postType,
          media_url: mediaUrl,
          media_type: mediaType,
          visibility: visibility,
          shared_with_user_ids: sharedWithIds,
        });

      if (error) throw error;

      const visibilityMessage = visibility === "public" 
        ? "Your creation is now live in the Director's Corner."
        : visibility === "private"
        ? "Saved privately to your posts."
        : `Shared with ${selectedUsers.length} director${selectedUsers.length > 1 ? 's' : ''}.`;

      toast({
        title: "Shared Successfully!",
        description: visibilityMessage,
      });
      
      onClose();
    } catch (error) {
      console.error("Error sharing to community:", error);
      toast({
        title: "Share failed",
        description: "Unable to share. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            Share to Director's Corner
          </DialogTitle>
          <DialogDescription>
            Share your AI-generated creation with the community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Media Preview */}
          <div className="rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
            {mediaType === "image" ? (
              <img src={mediaUrl} alt="" className="max-w-full max-h-full object-contain" />
            ) : mediaType === "video" ? (
              <video src={mediaUrl} className="max-w-full max-h-full" controls />
            ) : (
              <audio src={mediaUrl} controls className="w-full" />
            )}
          </div>

          {/* Visibility Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Who can see this?</label>
            <div className="flex flex-wrap gap-2">
              {VISIBILITY_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setVisibility(option.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm",
                      visibility === option.id
                        ? "bg-gold/20 border-gold text-gold"
                        : "bg-muted border-border text-muted-foreground hover:border-gold/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Selection for Specific Visibility */}
          {visibility === "specific" && (
            <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
              <label className="text-sm font-medium text-foreground">Share with specific directors</label>
              
              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((profile) => (
                    <Badge
                      key={profile.user_id}
                      variant="secondary"
                      className="flex items-center gap-1.5 py-1 pl-1 pr-2"
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {(profile.display_name || "D").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{profile.display_name || "Director"}</span>
                      <button
                        onClick={() => handleRemoveUser(profile.user_id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search directors by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <ScrollArea className="max-h-40 rounded-md border border-border bg-background">
                  <div className="p-1">
                    {searchResults.map((profile) => (
                      <button
                        key={profile.user_id}
                        onClick={() => handleAddUser(profile)}
                        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>
                            {(profile.display_name || "D").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {profile.display_name || "Anonymous Director"}
                        </span>
                        <Check className="w-4 h-4 ml-auto text-gold opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No directors found matching "{searchQuery}"
                </p>
              )}
            </div>
          )}

          {/* Post Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Post type</label>
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPostType(type.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm",
                    postType === type.id
                      ? "bg-gold/20 border-gold text-gold"
                      : "bg-muted border-border text-muted-foreground hover:border-gold/50"
                  )}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <Textarea
            placeholder="Add a caption... Share your thoughts, process, or what this creation means to you."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {visibility === "private" ? "Save Private" : "Share"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
