import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, User, Trophy, Music, Film, Crown, Calendar, 
  Share2, Play, Pause, ExternalLink, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface DirectorProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  public_vision: string | null;
  cover_image_url: string | null;
  current_streak: number;
  best_streak: number;
  created_at: string;
}

interface DirectorMovie {
  id: string;
  title: string;
  movie_url: string;
  thumbnail_url: string | null;
  description: string | null;
  votes_count: number;
  submitted_at: string;
}

interface DirectorAward {
  id: string;
  award_category: string;
  award_year: number;
  awarded_at: string | null;
}

export default function DirectorProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<DirectorProfile | null>(null);
  const [movies, setMovies] = useState<DirectorMovie[]>([]);
  const [awards, setAwards] = useState<DirectorAward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchDirectorData();
    }
  }, [userId]);

  const fetchDirectorData = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Fetch profile - only select public-safe fields (no phone, no sensitive settings)
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, avatar_url, bio, current_streak, best_streak, created_at, cover_image_url, public_vision")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      // If profile doesn't exist, show not found
      if (!profileData) {
        setProfile(null);
        setLoading(false);
        return;
      }
      
      setProfile(profileData);

      // Fetch public movies
      const { data: moviesData, error: moviesError } = await supabase
        .from("community_movies")
        .select("*")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("submitted_at", { ascending: false });

      if (moviesError) throw moviesError;
      setMovies(moviesData || []);

      // Fetch awards
      const { data: awardsData, error: awardsError } = await supabase
        .from("annual_awards")
        .select("*")
        .eq("user_id", userId)
        .order("award_year", { ascending: false });

      if (awardsError) throw awardsError;
      setAwards(awardsData || []);

    } catch (error) {
      console.error("Error fetching director data:", error);
      toast.error("Failed to load director profile");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `${profile?.display_name || 'Director'}'s Profile`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-gold animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <User className="w-16 h-16 text-muted-foreground/50" />
        <h1 className="text-xl font-semibold">Director not found</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const displayName = profile.display_name || "Anonymous Director";
  const memberSince = format(new Date(profile.created_at), "MMMM yyyy");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-display">Director Profile</h1>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="overflow-hidden bg-gradient-to-br from-gold/10 via-card to-card border-gold/20 mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="w-32 h-32 border-4 border-gold/30">
                <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-gold/20 to-amber-500/10 text-gold text-3xl">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-display text-gold mb-2">{displayName}</h1>
                {profile.bio && (
                  <p className="text-muted-foreground mb-4 max-w-xl">{profile.bio}</p>
                )}
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Member since {memberSince}</span>
                  </div>
                  {awards.length > 0 && (
                    <Badge variant="outline" className="border-gold/30 text-gold">
                      <Trophy className="w-3 h-3 mr-1" />
                      {awards.length} {awards.length === 1 ? 'Award' : 'Awards'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-border/50 text-center">
              <div>
                <p className="text-3xl font-display text-gold">{profile.current_streak}</p>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
              <div>
                <p className="text-3xl font-display text-gold">{profile.best_streak}</p>
                <p className="text-sm text-muted-foreground">Best Streak</p>
              </div>
              <div>
                <p className="text-3xl font-display text-gold">{movies.length}</p>
                <p className="text-sm text-muted-foreground">Public Movies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Awards Section */}
        {awards.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-gold" />
              <h2 className="text-xl font-display">Awards</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {awards.map((award) => (
                <Card key={award.id} className="bg-gradient-to-br from-gold/5 to-card border-gold/20">
                  <CardContent className="p-4 text-center">
                    <Crown className="w-8 h-8 text-gold mx-auto mb-2" />
                    <p className="font-medium text-sm">{award.award_category}</p>
                    <p className="text-xs text-muted-foreground">{award.award_year}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Movies Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Film className="w-5 h-5 text-gold" />
            <h2 className="text-xl font-display">Mind Movies</h2>
          </div>
          
          {movies.length === 0 ? (
            <Card className="p-8 text-center">
              <Film className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No public movies yet</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {movies.map((movie) => (
                <Card key={movie.id} className="overflow-hidden group cursor-pointer hover:border-gold/40 transition-colors">
                  <div className="relative aspect-video bg-muted">
                    {movie.thumbnail_url ? (
                      <img 
                        src={movie.thumbnail_url} 
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/10 to-amber-500/5">
                        <Film className="w-12 h-12 text-gold/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate">{movie.title}</h3>
                    {movie.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {movie.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>{format(new Date(movie.submitted_at), "MMM d, yyyy")}</span>
                      <Badge variant="secondary" className="text-xs">
                        {movie.votes_count} votes
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
