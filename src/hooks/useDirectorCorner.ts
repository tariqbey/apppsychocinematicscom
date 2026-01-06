import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
  media_url?: string;
  media_type?: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
}

export function useDirectorCorner() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("director_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // Fetch user profiles for display names and avatars
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }]) || []);

      const postsWithNames = postsData?.map(post => {
        const profile = profileMap.get(post.user_id);
        return {
          ...post,
          display_name: profile?.display_name || "Anonymous Director",
          avatar_url: profile?.avatar_url,
        };
      }) || [];

      setPosts(postsWithNames);

      // Fetch user's likes if logged in
      if (user) {
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id);

        setLikedPosts(new Set(likes?.map(l => l.post_id) || []));
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (content: string, postType: string, mediaUrl?: string, mediaType?: string) => {
    if (!user) {
      toast.error("Please sign in to post");
      return false;
    }

    try {
      const { error } = await supabase.from("director_posts").insert({
        user_id: user.id,
        content,
        post_type: postType,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      if (error) throw error;

      toast.success("Post shared with the community!");
      return true;
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
      return false;
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    const isLiked = likedPosts.has(postId);

    try {
      if (isLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        setLikedPosts(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });

        setPosts(prev =>
          prev.map(p =>
            p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p
          )
        );
      } else {
        await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });

        setLikedPosts(prev => new Set([...prev, postId]));

        setPosts(prev =>
          prev.map(p =>
            p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const fetchComments = async (postId: string): Promise<Comment[]> => {
    try {
      const { data: commentsData, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }]) || []);

      return commentsData?.map(comment => {
        const profile = profileMap.get(comment.user_id);
        return {
          ...comment,
          display_name: profile?.display_name || "Anonymous Director",
          avatar_url: profile?.avatar_url,
        };
      }) || [];
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) {
      toast.error("Please sign in to comment");
      return false;
    }

    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content,
      });

      if (error) throw error;

      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );

      return true;
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      return false;
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("director_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success("Post deleted");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  useEffect(() => {
    fetchPosts();

    // Subscribe to real-time updates for posts
    const postsChannel = supabase
      .channel('director-posts-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'director_posts' },
        async (payload) => {
          const newPost = payload.new as Post;
          // Fetch display name for the new post
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("display_name")
            .eq("user_id", newPost.user_id)
            .single();
          
          setPosts(prev => [{
            ...newPost,
            display_name: profile?.display_name || "Anonymous Director"
          }, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'director_posts' },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setPosts(prev => prev.filter(p => p.id !== deletedId));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'director_posts' },
        (payload) => {
          const updated = payload.new as Post;
          setPosts(prev => prev.map(p => 
            p.id === updated.id ? { ...p, likes_count: updated.likes_count, comments_count: updated.comments_count } : p
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [user]);

  return {
    posts,
    loading,
    likedPosts,
    createPost,
    toggleLike,
    fetchComments,
    addComment,
    deletePost,
    refreshPosts: fetchPosts,
  };
}
