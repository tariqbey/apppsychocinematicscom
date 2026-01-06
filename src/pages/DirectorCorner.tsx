import { Header } from "@/components/layout/Header";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostForm } from "@/components/community/CreatePostForm";
import { useDirectorCorner } from "@/hooks/useDirectorCorner";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { Users, Loader2, RefreshCw, Film } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function DirectorCorner() {
  const { user } = useAuth();
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
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-background spotlight film-grain">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Users className="h-8 w-8 text-gold" />
              <h1 className="text-4xl font-display tracking-wide">
                The <span className="text-gold-gradient">Director's Corner</span>
              </h1>
            </div>
            <p className="text-muted-foreground">
              Share insights, celebrate wins, and connect with fellow Directors on their transformation journey.
            </p>
          </div>

          {/* Back to Dashboard */}
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Film className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

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
        </div>
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
