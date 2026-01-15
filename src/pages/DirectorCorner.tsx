import { Header } from "@/components/layout/Header";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostForm } from "@/components/community/CreatePostForm";
import { ProfileEditor } from "@/components/community/ProfileEditor";
import { TutorialTipCard } from "@/components/community/TutorialTipCard";
import { FeaturedMovieCard } from "@/components/community/FeaturedMovieCard";
import { CommunityMovieCard } from "@/components/community/CommunityMovieCard";
import { AnnualAwardsShowcase } from "@/components/community/AnnualAwardsShowcase";
import { useDirectorCorner } from "@/hooks/useDirectorCorner";
import { useFeaturedContent } from "@/hooks/useFeaturedContent";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, Loader2, RefreshCw, Film, Trophy, Star, MessageSquare,
  Vote, Crown, Calendar, Sparkles
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function DirectorCorner() {
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useUserProfile();
  const {
    posts,
    loading,
    likedPosts,
    createPost,
    toggleLike,
    fetchComments,
    addComment,
    deletePost,
    refreshPosts,
  } = useDirectorCorner();
  
  const {
    featuredMovieOfWeek,
    featuredDirectorOfMonth,
    communityMovies,
    annualAwards,
    loading: featuredLoading,
    voteForMovie,
  } = useFeaturedContent();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");

  return (
    <div className="min-h-screen bg-background spotlight film-grain">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Users className="h-8 w-8 text-gold" />
              <h1 className="text-4xl font-display tracking-wide">
                The <span className="text-gold-gradient">Director's Corner</span>
              </h1>
            </div>
            <p className="text-muted-foreground">
              Share insights, celebrate wins, vote on Mind Movies, and connect with fellow Directors.
            </p>
          </div>

          {/* Tutorial Tip Card */}
          <TutorialTipCard
            id="directors-corner-intro"
            title="Welcome to the Director's Corner!"
            variant="gold"
            icon={<Sparkles className="w-5 h-5" />}
            tips={[
              "Share your wins, insights, and manifestations with the community",
              "Vote on Mind Movies to help select our Movie of the Week",
              "Top contributors earn recognition in our annual Director Awards",
              "Like and comment on posts to support fellow Directors",
            ]}
          />

          {/* User Profile Card (if logged in) */}
          {user && profile && (
            <div className="glass-card p-5 cinematic-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 border-2 border-gold/30">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gold/20 text-gold text-xl font-display">
                    {profile.display_name?.[0]?.toUpperCase() || "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-display text-lg text-gold">{profile.display_name || "Anonymous Director"}</p>
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{profile.bio}</p>
                  )}
                </div>
              </div>
              <ProfileEditor
                userId={user.id}
                currentDisplayName={profile.display_name || undefined}
                currentAvatarUrl={profile.avatar_url || undefined}
                currentBio={profile.bio || undefined}
                onUpdate={refetchProfile}
              />
            </div>
          )}

          {/* Back to Dashboard */}
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Film className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-border">
              <TabsTrigger value="feed" className="gap-2 data-[state=active]:bg-gold/20">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Feed</span>
              </TabsTrigger>
              <TabsTrigger value="movies" className="gap-2 data-[state=active]:bg-gold/20">
                <Vote className="w-4 h-4" />
                <span className="hidden sm:inline">Vote</span>
              </TabsTrigger>
              <TabsTrigger value="awards" className="gap-2 data-[state=active]:bg-gold/20">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Awards</span>
              </TabsTrigger>
            </TabsList>

            {/* Community Feed Tab */}
            <TabsContent value="feed" className="space-y-6 mt-6">
              {/* Create Post (only if logged in) */}
              {user ? (
                <CreatePostForm onSubmit={createPost} />
              ) : (
                <div className="glass-card p-6 cinematic-border text-center">
                  <p className="text-muted-foreground mb-4">
                    Sign in to share your insights with the community
                  </p>
                  <Button variant="gold" onClick={() => setShowAuthModal(true)}>
                    Sign In to Post
                  </Button>
                </div>
              )}

              {/* Refresh Button */}
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={refreshPosts} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {/* Posts Feed */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
              ) : posts.length === 0 ? (
                <div className="glass-card p-12 cinematic-border text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-display mb-2">No Posts Yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to share your Director journey with the community!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      isLiked={likedPosts.has(post.id)}
                      onLike={toggleLike}
                      onDelete={deletePost}
                      onFetchComments={fetchComments}
                      onAddComment={addComment}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Mind Movies Voting Tab */}
            <TabsContent value="movies" className="space-y-6 mt-6">
              {/* Tutorial Tip */}
              <TutorialTipCard
                id="mind-movie-voting"
                title="Vote for Mind Movies"
                variant="amber"
                icon={<Vote className="w-5 h-5" />}
                tips={[
                  "Vote on your favorite Mind Movies to help select Movie of the Week",
                  "You get one vote per movie per week - make it count!",
                  "Top voted movies are featured and creators get recognition",
                  "Winners may be nominated for annual Director Awards",
                ]}
              />

              {/* Featured Content */}
              <div className="space-y-4">
                {featuredMovieOfWeek && (
                  <FeaturedMovieCard
                    title={featuredMovieOfWeek.title}
                    directorName={featuredMovieOfWeek.display_name || "Anonymous"}
                    avatarUrl={featuredMovieOfWeek.avatar_url}
                    movieUrl={featuredMovieOfWeek.movie_url || undefined}
                    thumbnailUrl={featuredMovieOfWeek.thumbnail_url || undefined}
                    description={featuredMovieOfWeek.description || undefined}
                    votes={featuredMovieOfWeek.total_votes}
                    featureType="movie_of_week"
                    periodLabel={`Week of ${format(new Date(featuredMovieOfWeek.feature_period_start), "MMM d, yyyy")}`}
                  />
                )}

                {featuredDirectorOfMonth && (
                  <FeaturedMovieCard
                    title={featuredDirectorOfMonth.title}
                    directorName={featuredDirectorOfMonth.display_name || "Anonymous"}
                    avatarUrl={featuredDirectorOfMonth.avatar_url}
                    movieUrl={featuredDirectorOfMonth.movie_url || undefined}
                    thumbnailUrl={featuredDirectorOfMonth.thumbnail_url || undefined}
                    description={featuredDirectorOfMonth.description || undefined}
                    votes={featuredDirectorOfMonth.total_votes}
                    featureType="director_of_month"
                    periodLabel={format(new Date(featuredDirectorOfMonth.feature_period_start), "MMMM yyyy")}
                  />
                )}
              </div>

              {/* Community Movies to Vote On */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-gold" />
                    Community Mind Movies
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {communityMovies.length} submitted
                  </span>
                </div>

                {featuredLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : communityMovies.length === 0 ? (
                  <div className="glass-card p-8 cinematic-border text-center">
                    <Film className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h4 className="font-display text-lg mb-2">No Movies Submitted Yet</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Be the first to submit your Mind Movie for community voting!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Complete your Mind Movie in the Edit Bay, then share it here.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {communityMovies.map((movie, index) => (
                        <CommunityMovieCard
                          key={movie.id}
                          id={movie.id}
                          movieId={movie.movie_id}
                          title={movie.title}
                          description={movie.description || undefined}
                          directorName={movie.display_name || "Anonymous"}
                          avatarUrl={movie.avatar_url}
                          movieUrl={movie.movie_url}
                          thumbnailUrl={movie.thumbnail_url || undefined}
                          chiefAimPreview={movie.chief_aim_preview || undefined}
                          votesCount={movie.votes_count}
                          hasVoted={movie.has_voted || false}
                          submittedAt={movie.submitted_at}
                          onVote={voteForMovie}
                          rank={index + 1}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            {/* Annual Awards Tab */}
            <TabsContent value="awards" className="space-y-6 mt-6">
              {/* Tutorial Tip */}
              <TutorialTipCard
                id="annual-awards-info"
                title="Psycho-Cinematics™ Director Awards"
                variant="purple"
                icon={<Trophy className="w-5 h-5" />}
                tips={[
                  "At year's end, we celebrate our top Directors with Oscar-style awards",
                  "Categories include: Best Mind Movie, Most Transformative Director, Highest Scorer",
                  "Winners are determined by community votes and achievement scores",
                  "Keep creating, voting, and transforming to earn recognition!",
                ]}
              />

              {/* Award Categories Info */}
              <div className="glass-card cinematic-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-6 h-6 text-gold" />
                  <h3 className="font-display text-xl">Award Categories</h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Trophy, label: "Best Mind Movie", desc: "Most creative and impactful visualization" },
                    { icon: Crown, label: "Most Transformative Director", desc: "Greatest personal growth journey" },
                    { icon: Star, label: "Highest Scorer", desc: "Top daily scorecard performer" },
                    { icon: Calendar, label: "Longest Streak", desc: "Most consistent daily practice" },
                    { icon: Sparkles, label: "Most Improved", desc: "Greatest score improvement over time" },
                    { icon: Users, label: "Community Favorite", desc: "Most liked and engaged member" },
                  ].map((award, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <award.icon className="w-5 h-5 text-gold flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{award.label}</p>
                        <p className="text-xs text-muted-foreground">{award.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Annual Awards Showcase */}
              <AnnualAwardsShowcase awards={annualAwards} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
