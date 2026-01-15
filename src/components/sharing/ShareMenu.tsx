import { useState } from "react";
import { Share2, Copy, Check, ExternalLink, Users, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";
import { useIntegrationNotifications } from "@/hooks/useIntegrationNotifications";

// Social platform icons as SVG
const FacebookIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

interface ShareMenuProps {
  mediaUrl: string;
  mediaType: "image" | "video" | "audio";
  title?: string;
  onShareToCommunity?: () => void;
  compact?: boolean;
}

export function ShareMenu({ 
  mediaUrl, 
  mediaType, 
  title = "Check out my creation!",
  onShareToCommunity,
  compact = false 
}: ShareMenuProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const { getIntegration } = useUserIntegrations();
  const { postToSocial, isPosting } = useIntegrationNotifications();

  const shareText = `${title} #PsychoCinematics #DirectorsOS`;

  // Check which platforms are connected
  const hasTwitter = !!getIntegration("social_twitter")?.api_key;
  const hasFacebook = !!getIntegration("social_facebook")?.api_key;
  const hasInstagram = !!getIntegration("social_instagram")?.api_key;
  const hasTikTok = !!getIntegration("social_tiktok")?.api_key;
  const hasAnyConnected = hasTwitter || hasFacebook || hasInstagram || hasTikTok;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mediaUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Media URL copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDirectPost = async (platform: "facebook" | "twitter" | "instagram" | "tiktok") => {
    const result = await postToSocial(platform, title, mediaUrl);
    
    if (result.manualPost && result.content) {
      // Copy the branded content for manual posting
      await navigator.clipboard.writeText(result.content);
      toast({
        title: `Post to ${platform}`,
        description: "Branded content copied! Paste it when posting.",
      });
    }
  };

  const openExternalShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(mediaUrl);
    const encodedText = encodeURIComponent(shareText);

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    } else if (platform === 'instagram' || platform === 'tiktok') {
      handleCopyLink();
      toast({
        title: `Share to ${platform === 'instagram' ? 'Instagram' : 'TikTok'}`,
        description: "Link copied! Download the media and upload it directly to the app.",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const response = await fetch(mediaUrl);
        const blob = await response.blob();
        const file = new File([blob], `share.${mediaType === 'image' ? 'png' : 'mp4'}`, { type: blob.type });
        
        await navigator.share({
          title: title,
          text: shareText,
          files: [file],
        });
      } catch {
        try {
          await navigator.share({
            title: title,
            text: shareText,
            url: mediaUrl,
          });
        } catch (e) {
          console.error("Share failed:", e);
        }
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={compact ? "icon" : "sm"} className={compact ? "h-8 w-8" : "gap-2"}>
          <Share2 className="h-4 w-4" />
          {!compact && "Share"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        {/* Share to Community */}
        {onShareToCommunity && (
          <>
            <DropdownMenuItem onClick={onShareToCommunity} className="gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Share to Director's Corner</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Direct Post (if connected) */}
        {hasAnyConnected && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Send className="h-4 w-4 text-primary" />
                <span>Post Directly</span>
                {isPosting && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="bg-popover">
                  {hasTwitter && (
                    <DropdownMenuItem onClick={() => handleDirectPost("twitter")} className="gap-2">
                      <TwitterIcon />
                      <span>Post to X</span>
                    </DropdownMenuItem>
                  )}
                  {hasFacebook && (
                    <DropdownMenuItem onClick={() => handleDirectPost("facebook")} className="gap-2">
                      <FacebookIcon />
                      <span>Post to Facebook</span>
                    </DropdownMenuItem>
                  )}
                  {hasInstagram && (
                    <DropdownMenuItem onClick={() => handleDirectPost("instagram")} className="gap-2">
                      <InstagramIcon />
                      <span>Post to Instagram</span>
                    </DropdownMenuItem>
                  )}
                  {hasTikTok && (
                    <DropdownMenuItem onClick={() => handleDirectPost("tiktok")} className="gap-2">
                      <TikTokIcon />
                      <span>Post to TikTok</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Native Share (if supported) */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            <span>Share...</span>
          </DropdownMenuItem>
        )}

        {/* Social Platforms (Web Share) */}
        <DropdownMenuItem onClick={() => openExternalShare('facebook')} className="gap-2">
          <FacebookIcon />
          <span>Facebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openExternalShare('twitter')} className="gap-2">
          <TwitterIcon />
          <span>X (Twitter)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openExternalShare('instagram')} className="gap-2">
          <InstagramIcon />
          <span>Instagram</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openExternalShare('tiktok')} className="gap-2">
          <TikTokIcon />
          <span>TikTok</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        {/* Copy Link */}
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? "Copied!" : "Copy Link"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
