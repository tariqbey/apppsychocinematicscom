import { useState, useRef, useEffect, useMemo } from "react";
import { Camera, Sparkles, Upload, Loader2, User, Film, Wand2, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMindMovies } from "@/hooks/useMindMovies";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { differenceInDays, differenceInHours, differenceInMinutes, parse, isValid } from "date-fns";

interface DirectorBannerProps {
  onOpenAIStudio?: () => void;
  className?: string;
  chiefAimByWhen?: string;
  chiefAimSummary?: string;
}

function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const formats = [
    "MMMM d, yyyy", "MMMM dd, yyyy", "MMM d, yyyy", "MMM dd, yyyy",
    "yyyy-MM-dd", "MM/dd/yyyy", "M/d/yyyy",
  ];
  for (const format of formats) {
    try {
      const parsed = parse(dateStr, format, new Date());
      if (isValid(parsed)) return parsed;
    } catch { /* continue */ }
  }
  const fallback = new Date(dateStr);
  return isValid(fallback) ? fallback : null;
}

export function DirectorBanner({ onOpenAIStudio, className, chiefAimByWhen, chiefAimSummary }: DirectorBannerProps) {
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { activeMovie, fetchAllMovies } = useMindMovies();
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState<"avatar" | "cover" | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Countdown logic
  const targetDate = useMemo(() => chiefAimByWhen ? parseFlexibleDate(chiefAimByWhen) : null, [chiefAimByWhen]);
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; isPast: boolean } | null>(null);

  useEffect(() => {
    if (!targetDate) { setTimeRemaining(null); return; }
    const updateTime = () => {
      const now = new Date();
      const isPast = targetDate < now;
      setTimeRemaining({
        days: Math.abs(differenceInDays(targetDate, now)),
        hours: Math.abs(differenceInHours(targetDate, now)) % 24,
        minutes: Math.abs(differenceInMinutes(targetDate, now)) % 60,
        isPast,
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Load images on mount - cover now persisted in database
  useEffect(() => {
    if (profile) {
      setAvatarUrl(profile.avatar_url);
      // Load cover from database (cross-device persistence)
      if (profile.cover_image_url) {
        setCoverUrl(profile.cover_image_url);
      } else {
        // Migrate from localStorage if exists (one-time migration)
        const savedCover = localStorage.getItem(`director-cover-${user?.id}`);
        if (savedCover && user?.id) {
          setCoverUrl(savedCover);
          // Migrate to database
          updateProfile({ cover_image_url: savedCover }).then(() => {
            localStorage.removeItem(`director-cover-${user.id}`);
          });
        }
      }
    }
  }, [profile, user?.id, updateProfile]);

  useEffect(() => {
    if (user) fetchAllMovies();
  }, [user, fetchAllMovies]);

  const handleFileUpload = async (file: File, type: "avatar" | "cover") => {
    if (!user) return;
    
    setUploading(type);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
      const bucket = type === "avatar" ? "avatars" : "mind-movies";

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (type === "avatar") {
        await updateProfile({ avatar_url: publicUrl });
        setAvatarUrl(publicUrl);
        toast.success("Profile picture updated!");
      } else {
        // Save cover to database for cross-device persistence
        await updateProfile({ cover_image_url: publicUrl });
        setCoverUrl(publicUrl);
        toast.success("Cover art updated!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(null);
    }
  };

  const generateAIImage = async (type: "avatar" | "cover") => {
    if (!user) return;
    
    setGeneratingAI(type);
    try {
      const prompt = type === "avatar"
        ? `Professional cinematic portrait of a confident film director, dramatic rim lighting, bokeh background, ultra-high quality photography style, aspirational and powerful`
        : `Futuristic cinematic movie poster style banner, dramatic lighting, gold and dark theme, abstract achievement visualization, professional film production aesthetic, ultra wide 21:9 aspect ratio`;

      const { data, error } = await supabase.functions.invoke("lovable-generate-image", {
        body: { prompt, aspectRatio: type === "cover" ? "21:9" : "1:1" }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        if (type === "avatar") {
          await updateProfile({ avatar_url: data.imageUrl });
          setAvatarUrl(data.imageUrl);
          toast.success("AI avatar generated!");
        } else {
          // Save AI-generated cover to database for cross-device persistence
          await updateProfile({ cover_image_url: data.imageUrl });
          setCoverUrl(data.imageUrl);
          toast.success("AI cover art generated!");
        }
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate image. Try the Edit Bay for more options.");
    } finally {
      setGeneratingAI(null);
    }
  };

  const directorName = profile?.director_character_name || profile?.display_name || "Director";

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Cover Image / Banner */}
      <div className="relative h-44 sm:h-48 md:h-56 lg:h-64 overflow-hidden group">
        {/* Animated background gradient when no cover */}
        {!coverUrl ? (
          <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-gold/10 overflow-hidden">
            {/* Animated grid lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,hsl(var(--gold)/0.3)_50%,transparent_51%,transparent_100%)] bg-[length:60px_100%] animate-[pulse_4s_ease-in-out_infinite]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,transparent_49%,hsl(var(--gold)/0.2)_50%,transparent_51%,transparent_100%)] bg-[length:100%_40px]" />
            </div>
            {/* Floating particles */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gold/40 rounded-full animate-[bounce_3s_ease-in-out_infinite]" />
            <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-purple-500/40 rounded-full animate-[bounce_4s_ease-in-out_infinite_0.5s]" />
            <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-cyan-500/40 rounded-full animate-[bounce_3.5s_ease-in-out_infinite_1s]" />
            {/* Glow orbs */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-radial from-gold/20 via-gold/5 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-radial from-purple-500/20 via-purple-500/5 to-transparent rounded-full blur-2xl animate-[pulse_5s_ease-in-out_infinite]" />
            {/* Film strip decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-transparent via-gold/10 to-transparent flex items-center justify-center gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-4 h-2.5 bg-gold/20 rounded-sm" />
              ))}
            </div>
          </div>
        ) : (
          <img
            src={coverUrl}
            alt="Director Cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Gradient overlay for text readability - stronger on mobile */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />

        {/* Countdown Overlay - positioned at top on mobile to avoid text overlap */}
        {timeRemaining && (
          <div className="absolute top-2 sm:top-auto sm:inset-0 left-0 right-0 sm:flex sm:items-center sm:justify-center z-10 px-2">
            <div className="text-center bg-black/40 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none rounded-lg px-3 py-2 sm:p-0">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <Target className="w-3 h-3 sm:w-5 sm:h-5 text-gold" />
                <span className="text-[10px] sm:text-sm font-medium text-gold uppercase tracking-wider">
                  Final Scene Countdown
                </span>
                <Zap className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-gold animate-pulse" />
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-4">
                <div className="text-center">
                  <div className="text-xl sm:text-4xl md:text-5xl font-display tracking-wider tabular-nums text-gold" style={{ textShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}>
                    {timeRemaining.days}
                  </div>
                  <div className="text-[8px] sm:text-xs text-muted-foreground uppercase tracking-wider">Days</div>
                </div>
                <div className="text-base sm:text-2xl text-gold/50 font-light">:</div>
                <div className="text-center">
                  <div className="text-xl sm:text-4xl md:text-5xl font-display tracking-wider tabular-nums text-gold" style={{ textShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}>
                    {timeRemaining.hours.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[8px] sm:text-xs text-muted-foreground uppercase tracking-wider">Hours</div>
                </div>
                <div className="text-base sm:text-2xl text-gold/50 font-light">:</div>
                <div className="text-center">
                  <div className="text-xl sm:text-4xl md:text-5xl font-display tracking-wider tabular-nums text-gold" style={{ textShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}>
                    {timeRemaining.minutes.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[8px] sm:text-xs text-muted-foreground uppercase tracking-wider">Min</div>
                </div>
              </div>
              {chiefAimSummary && (
                <p className="mt-1 sm:mt-2 text-[10px] sm:text-sm text-white/80 max-w-md mx-auto line-clamp-1 drop-shadow-md">
                  "{chiefAimSummary}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cover upload/generate buttons - show on hover */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "cover")}
          />
          <Button
            size="sm"
            variant="secondary"
            className="h-8 bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card"
            onClick={() => coverInputRef.current?.click()}
            disabled={!!uploading || !!generatingAI}
          >
            {uploading === "cover" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">Upload</span>
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 bg-gradient-to-r from-purple-500/20 to-gold/20 border-purple-500/30 hover:from-purple-500/30 hover:to-gold/30"
            onClick={() => generateAIImage("cover")}
            disabled={!!uploading || !!generatingAI}
          >
            {generatingAI === "cover" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">AI Generate</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Profile Section - Overlapping avatar */}
      <div className="relative px-3 sm:px-6 pb-4 -mt-8 sm:-mt-14">
        <div className="flex items-end gap-3 sm:gap-4">
          {/* Avatar */}
          <div className="relative group/avatar flex-shrink-0">
            <div className={cn(
              "w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-background overflow-hidden shadow-xl",
              "bg-gradient-to-br from-gold/30 to-purple-500/30"
            )}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={directorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 sm:w-12 sm:h-12 text-gold/60" />
                </div>
              )}
            </div>

            {/* Avatar edit overlay */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "avatar")}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8 text-white hover:bg-white/20"
                onClick={() => avatarInputRef.current?.click()}
                disabled={!!uploading || !!generatingAI}
              >
                {uploading === "avatar" ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8 text-white hover:bg-white/20"
                onClick={() => generateAIImage("avatar")}
                disabled={!!uploading || !!generatingAI}
              >
                {generatingAI === "avatar" ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </Button>
            </div>

            {/* Active movie indicator */}
            {activeMovie && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gold border-2 border-background flex items-center justify-center">
                <Film className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-background" />
              </div>
            )}
          </div>

          {/* Director Info */}
          <div className="flex-1 min-w-0 pb-0.5 sm:pb-1">
            <h1 className="text-base sm:text-2xl md:text-3xl font-display tracking-wide leading-tight">
              <span className="text-muted-foreground text-xs sm:text-base block sm:inline">Welcome Back, </span>
              <span className="text-gold-gradient block sm:inline truncate">{directorName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
              {activeMovie?.title 
                ? `Now Producing: ${activeMovie.title}`
                : "The set is ready. Let's make today's scene count."}
            </p>
          </div>

          {/* Quick action button */}
          {onOpenAIStudio && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex border-gold/30 text-gold hover:bg-gold/10"
              onClick={onOpenAIStudio}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Edit Bay
            </Button>
          )}
        </div>
      </div>

      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none">
        <div className="absolute inset-0 rounded-2xl border border-gold/20" />
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-transparent via-gold/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
}
