import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Quote, Volume2 } from "lucide-react";
import { TestimonialVideoModal } from "./TestimonialVideoModal";

interface TestimonialCardProps {
  testimonialType: "text" | "audio" | "video";
  textContent?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  userTitle?: string | null;
  resultHighlight?: string | null;
}

export function TestimonialCard({
  testimonialType,
  textContent,
  mediaUrl,
  thumbnailUrl,
  displayName,
  avatarUrl,
  userTitle,
  resultHighlight
}: TestimonialCardProps) {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const initials = displayName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Card className="bg-card/50 border-border hover:border-primary/30 transition-colors h-full">
        <CardContent className="p-6 flex flex-col h-full">
          {/* Video Testimonial */}
          {testimonialType === "video" && mediaUrl && (
            <div 
              className="relative aspect-video mb-4 rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setVideoModalOpen(true)}
            >
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt={`${displayName}'s testimonial`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <Play className="h-8 w-8 text-primary-foreground ml-1" />
                </div>
              </div>
            </div>
          )}

          {/* Audio Testimonial */}
          {testimonialType === "audio" && mediaUrl && (
            <div className="mb-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Volume2 className="h-6 w-6 text-primary shrink-0" />
                <audio 
                  src={mediaUrl} 
                  controls 
                  className="w-full h-8"
                  onPlay={() => setIsPlayingAudio(true)}
                  onPause={() => setIsPlayingAudio(false)}
                  onEnded={() => setIsPlayingAudio(false)}
                />
              </div>
            </div>
          )}

          {/* Text Testimonial */}
          {testimonialType === "text" && textContent && (
            <div className="flex-1 mb-4">
              <Quote className="h-8 w-8 text-primary/30 mb-2" />
              <p className="text-foreground/90 italic leading-relaxed">
                "{textContent}"
              </p>
            </div>
          )}

          {/* Result Highlight */}
          {resultHighlight && (
            <div className="mb-4 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-primary">{resultHighlight}</p>
            </div>
          )}

          {/* User Info */}
          <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{displayName}</p>
              {userTitle && (
                <p className="text-sm text-muted-foreground">{userTitle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Modal */}
      {testimonialType === "video" && mediaUrl && (
        <TestimonialVideoModal
          open={videoModalOpen}
          onOpenChange={setVideoModalOpen}
          videoUrl={mediaUrl}
          displayName={displayName}
        />
      )}
    </>
  );
}
