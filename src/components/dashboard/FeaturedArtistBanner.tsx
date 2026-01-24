import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Film, Play, ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedContent {
  id: string;
  feature_type: string;
  user_id: string;
  movie_id: string | null;
  title: string;
  description: string | null;
  movie_url: string | null;
  thumbnail_url: string | null;
  banner_image_url: string | null;
  is_active: boolean;
  display_name?: string;
  avatar_url?: string;
}

export function FeaturedArtistBanner() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<FeaturedContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedContent();
  }, []);

  const fetchFeaturedContent = async () => {
    try {
      const now = new Date().toISOString();
      
      // Try to get Movie of the Week first, then Director of the Month
      const { data: weeklyData } = await supabase
        .from("featured_content")
        .select("*")
        .eq("is_active", true)
        .lte("feature_period_start", now)
        .gte("feature_period_end", now)
        .order("feature_type", { ascending: true }) // movie_of_week comes first alphabetically
        .limit(1)
        .maybeSingle();

      if (weeklyData) {
        // Get profile info
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name, avatar_url")
          .eq("user_id", weeklyData.user_id)
          .single();

        setFeatured({
          ...weeklyData,
          display_name: profile?.display_name || "Anonymous Director",
          avatar_url: profile?.avatar_url,
        });
      }
    } catch (error) {
      console.error("Error fetching featured content:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !featured) {
    return null;
  }

  const isMovie = featured.feature_type === "movie_of_week";
  const bannerImage = featured.banner_image_url || featured.thumbnail_url;

  return (
    <Card 
      className="overflow-hidden group hover:border-gold/50 transition-all duration-500 relative animate-fade-in"
      style={{
        boxShadow: '0 0 30px rgba(212, 175, 55, 0.15), inset 0 0 50px rgba(212, 175, 55, 0.03)',
      }}
    >
      {/* Background Image */}
      {bannerImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage: `url(${bannerImage})`,
          }}
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
      
      {/* Holographic scan effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div 
          className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(212,175,55,0.05)_50%)] bg-[length:100%_4px]"
          style={{ animation: 'scan-line 8s linear infinite' }}
        />
      </div>

      {/* Sparkles */}
      <Sparkles className="absolute top-4 right-8 w-3 h-3 text-gold/40 animate-pulse pointer-events-none" />
      <Sparkles className="absolute bottom-6 right-16 w-2 h-2 text-gold/30 animate-pulse pointer-events-none" style={{ animationDelay: '0.7s' }} />

      <CardContent className="p-5 relative z-10">
        <div className="flex items-center gap-4">
          {/* Avatar / Thumbnail */}
          <div className="relative">
            {featured.thumbnail_url ? (
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-gold/30 transition-all duration-300 group-hover:border-gold"
                style={{ boxShadow: '0 0 20px rgba(212,175,55,0.3)' }}
              >
                <img 
                  src={featured.thumbnail_url} 
                  alt={featured.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-gold/30">
                <AvatarImage src={featured.avatar_url || undefined} />
                <AvatarFallback className="bg-gold/20 text-gold text-2xl">
                  {isMovie ? <Film className="w-8 h-8" /> : <Crown className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
            )}
            {/* Badge */}
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center animate-pulse">
                <Star className="w-3 h-3 text-primary-foreground fill-current" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Badge 
              variant="outline" 
              className="mb-1 border-gold/50 text-gold text-xs"
            >
              {isMovie ? "🎬 Movie of the Week" : "👑 Director of the Month"}
            </Badge>
            <h3 className="font-bold text-lg truncate group-hover:text-gold transition-colors">
              {featured.title}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              by {featured.display_name}
            </p>
            {featured.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {featured.description}
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="hidden sm:block">
            {isMovie && featured.movie_url ? (
              <Button
                variant="gold"
                size="sm"
                onClick={() => window.open(featured.movie_url!, "_blank")}
              >
                <Play className="w-4 h-4 mr-1" />
                Watch
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-gold/30 hover:border-gold hover:bg-gold/10"
                onClick={() => navigate("/director-corner")}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
