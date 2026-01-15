import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trophy, Crown, Film, User, Plus, Calendar, Check, Loader2, 
  Star, Eye, Trash2, Edit
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addMonths } from "date-fns";

interface CommunityMovie {
  id: string;
  user_id: string;
  movie_id: string;
  title: string;
  movie_url: string;
  thumbnail_url: string | null;
  votes_count: number;
  display_name?: string;
  avatar_url?: string;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  current_streak: number | null;
  best_streak: number | null;
}

interface FeaturedContent {
  id: string;
  feature_type: string;
  user_id: string;
  movie_id: string | null;
  title: string;
  description: string | null;
  feature_period_start: string;
  feature_period_end: string;
  is_active: boolean;
  total_votes: number | null;
  display_name?: string;
}

export function FeaturedContentManager() {
  const [communityMovies, setCommunityMovies] = useState<CommunityMovie[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<CommunityMovie | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [featureType, setFeatureType] = useState<"movie_of_week" | "director_of_month">("movie_of_week");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch community movies
      const { data: movies } = await supabase
        .from("community_movies")
        .select("*")
        .eq("is_public", true)
        .order("votes_count", { ascending: false });

      if (movies) {
        const userIds = [...new Set(movies.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        setCommunityMovies(movies.map(m => ({
          ...m,
          display_name: profileMap.get(m.user_id)?.display_name || "Anonymous",
          avatar_url: profileMap.get(m.user_id)?.avatar_url,
        })));
      }

      // Fetch all users
      const { data: allUsers } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, avatar_url, current_streak, best_streak")
        .order("display_name", { ascending: true });

      setUsers(allUsers || []);

      // Fetch existing featured content
      const { data: featured } = await supabase
        .from("featured_content")
        .select("*")
        .order("feature_period_start", { ascending: false })
        .limit(20);

      if (featured) {
        const featuredUserIds = [...new Set(featured.map(f => f.user_id))];
        const { data: featuredProfiles } = await supabase
          .from("user_profiles")
          .select("user_id, display_name")
          .in("user_id", featuredUserIds);

        const profileMap = new Map(featuredProfiles?.map(p => [p.user_id, p]) || []);
        setFeaturedContent(featured.map(f => ({
          ...f,
          display_name: profileMap.get(f.user_id)?.display_name || "Anonymous",
        })));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeatured = async () => {
    if (featureType === "movie_of_week" && !selectedMovie) {
      toast.error("Please select a movie");
      return;
    }
    if (featureType === "director_of_month" && !selectedUser) {
      toast.error("Please select a director");
      return;
    }

    setCreating(true);
    try {
      const now = new Date();
      let periodStart: Date;
      let periodEnd: Date;

      if (featureType === "movie_of_week") {
        periodStart = startOfWeek(now, { weekStartsOn: 1 });
        periodEnd = endOfWeek(now, { weekStartsOn: 1 });
      } else {
        periodStart = startOfMonth(now);
        periodEnd = endOfMonth(now);
      }

      // Deactivate existing featured content of same type
      await supabase
        .from("featured_content")
        .update({ is_active: false })
        .eq("feature_type", featureType)
        .eq("is_active", true);

      // Create new featured content
      const newFeatured = {
        feature_type: featureType,
        user_id: featureType === "movie_of_week" ? selectedMovie!.user_id : selectedUser!.user_id,
        movie_id: featureType === "movie_of_week" ? selectedMovie!.movie_id : null,
        title: customTitle || (featureType === "movie_of_week" ? selectedMovie!.title : `${selectedUser!.display_name || "Director"}'s Achievement`),
        description: customDescription || null,
        movie_url: featureType === "movie_of_week" ? selectedMovie!.movie_url : null,
        thumbnail_url: featureType === "movie_of_week" ? selectedMovie!.thumbnail_url : selectedUser?.avatar_url || null,
        feature_period_start: periodStart.toISOString(),
        feature_period_end: periodEnd.toISOString(),
        total_votes: featureType === "movie_of_week" ? selectedMovie!.votes_count : 0,
        is_active: true,
      };

      const { error } = await supabase.from("featured_content").insert(newFeatured);

      if (error) throw error;

      toast.success(`${featureType === "movie_of_week" ? "Movie of the Week" : "Director of the Month"} featured successfully!`);
      setDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Error creating featured content:", error);
      toast.error("Failed to create featured content");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFeatured = async (id: string) => {
    try {
      await supabase.from("featured_content").delete().eq("id", id);
      toast.success("Featured content removed");
      await fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const resetForm = () => {
    setSelectedMovie(null);
    setSelectedUser(null);
    setCustomTitle("");
    setCustomDescription("");
    setFeatureType("movie_of_week");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="w-5 h-5 text-gold" />
            Featured Content Manager
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Feature New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Feature Content</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 flex-1 overflow-y-auto">
                {/* Feature Type Selection */}
                <div className="space-y-2">
                  <Label>Feature Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={featureType === "movie_of_week" ? "gold" : "outline"}
                      onClick={() => setFeatureType("movie_of_week")}
                      className="flex-1"
                    >
                      <Film className="w-4 h-4 mr-2" />
                      Movie of the Week
                    </Button>
                    <Button
                      type="button"
                      variant={featureType === "director_of_month" ? "gold" : "outline"}
                      onClick={() => setFeatureType("director_of_month")}
                      className="flex-1"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Director of the Month
                    </Button>
                  </div>
                </div>

                {/* Content Selection */}
                {featureType === "movie_of_week" ? (
                  <div className="space-y-2">
                    <Label>Select Movie</Label>
                    <ScrollArea className="h-64 border rounded-lg p-2">
                      <div className="space-y-2">
                        {communityMovies.map(movie => (
                          <button
                            key={movie.id}
                            type="button"
                            onClick={() => setSelectedMovie(movie)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              selectedMovie?.id === movie.id 
                                ? 'border-gold bg-gold/10' 
                                : 'border-border hover:border-gold/50'
                            }`}
                          >
                            <div className="w-16 h-10 rounded bg-muted overflow-hidden">
                              {movie.thumbnail_url ? (
                                <img src={movie.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Film className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-sm">{movie.title}</p>
                              <p className="text-xs text-muted-foreground">by {movie.display_name}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {movie.votes_count} votes
                            </Badge>
                            {selectedMovie?.id === movie.id && (
                              <Check className="w-4 h-4 text-gold" />
                            )}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Select Director</Label>
                    <ScrollArea className="h-64 border rounded-lg p-2">
                      <div className="space-y-2">
                        {users.map(user => (
                          <button
                            key={user.user_id}
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              selectedUser?.user_id === user.user_id 
                                ? 'border-gold bg-gold/10' 
                                : 'border-border hover:border-gold/50'
                            }`}
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{(user.display_name || "D")[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-sm">{user.display_name || "Anonymous"}</p>
                              <p className="text-xs text-muted-foreground">
                                Streak: {user.current_streak || 0} days (Best: {user.best_streak || 0})
                              </p>
                            </div>
                            {selectedUser?.user_id === user.user_id && (
                              <Check className="w-4 h-4 text-gold" />
                            )}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Custom Title & Description */}
                <div className="space-y-2">
                  <Label>Custom Title (Optional)</Label>
                  <Input
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder={featureType === "movie_of_week" ? "Featured Mind Movie" : "Director of the Month"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={customDescription}
                    onChange={e => setCustomDescription(e.target.value)}
                    placeholder="Add a description for why this content is being featured..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleCreateFeatured} disabled={creating} className="w-full" variant="gold">
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 mr-2" />
                      Feature This {featureType === "movie_of_week" ? "Movie" : "Director"}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : featuredContent.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No featured content yet</p>
            <p className="text-sm">Click "Feature New" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {featuredContent.map(item => (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-3 rounded-lg border ${
                  item.is_active ? 'border-gold/30 bg-gold/5' : 'border-border'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  item.feature_type === "movie_of_week" 
                    ? 'bg-amber-500/20 text-amber-500' 
                    : 'bg-purple-500/20 text-purple-500'
                }`}>
                  {item.feature_type === "movie_of_week" ? (
                    <Film className="w-5 h-5" />
                  ) : (
                    <Crown className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    {item.is_active && (
                      <Badge variant="default" className="bg-gold text-primary-foreground text-xs">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.display_name} • {format(new Date(item.feature_period_start), "MMM d")} - {format(new Date(item.feature_period_end), "MMM d, yyyy")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteFeatured(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
