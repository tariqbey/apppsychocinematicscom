import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface FeaturedContent {
  id: string;
  feature_type: string;
  user_id: string;
  movie_id: string | null;
  title: string;
  description: string | null;
  movie_url: string | null;
  thumbnail_url: string | null;
  feature_period_start: string;
  feature_period_end: string;
  total_votes: number;
  is_active: boolean;
  display_name?: string;
  avatar_url?: string;
}

interface CommunityMovie {
  id: string;
  user_id: string;
  movie_id: string;
  title: string;
  description: string | null;
  movie_url: string;
  thumbnail_url: string | null;
  chief_aim_preview: string | null;
  votes_count: number;
  is_public: boolean;
  submitted_at: string;
  display_name?: string;
  avatar_url?: string;
  has_voted?: boolean;
}

interface AnnualAward {
  id: string;
  user_id: string;
  award_year: number;
  award_category: string;
  movie_id: string | null;
  total_votes: number | null;
  total_score: number | null;
  metadata: unknown;
  awarded_at: string | null;
  display_name?: string;
  avatar_url?: string;
}

export function useFeaturedContent() {
  const [featuredMovieOfWeek, setFeaturedMovieOfWeek] = useState<FeaturedContent | null>(null);
  const [featuredDirectorOfMonth, setFeaturedDirectorOfMonth] = useState<FeaturedContent | null>(null);
  const [communityMovies, setCommunityMovies] = useState<CommunityMovie[]>([]);
  const [annualAwards, setAnnualAwards] = useState<AnnualAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedMovies, setVotedMovies] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const getCurrentVotePeriod = (type: "weekly" | "monthly") => {
    const now = new Date();
    if (type === "weekly") {
      const week = format(now, "yyyy") + "-W" + format(now, "ww");
      return week;
    }
    return format(now, "yyyy-MM");
  };

  const fetchFeaturedContent = useCallback(async () => {
    try {
      const now = new Date();
      
      // Fetch movie of the week
      const { data: weeklyData } = await supabase
        .from("featured_content")
        .select("*")
        .eq("feature_type", "movie_of_week")
        .eq("is_active", true)
        .lte("feature_period_start", now.toISOString())
        .gte("feature_period_end", now.toISOString())
        .order("total_votes", { ascending: false })
        .limit(1)
        .single();

      if (weeklyData) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name, avatar_url")
          .eq("user_id", weeklyData.user_id)
          .single();

        setFeaturedMovieOfWeek({
          ...weeklyData,
          display_name: profile?.display_name || "Anonymous Director",
          avatar_url: profile?.avatar_url,
        });
      }

      // Fetch director of the month
      const { data: monthlyData } = await supabase
        .from("featured_content")
        .select("*")
        .eq("feature_type", "director_of_month")
        .eq("is_active", true)
        .lte("feature_period_start", now.toISOString())
        .gte("feature_period_end", now.toISOString())
        .order("total_votes", { ascending: false })
        .limit(1)
        .single();

      if (monthlyData) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name, avatar_url")
          .eq("user_id", monthlyData.user_id)
          .single();

        setFeaturedDirectorOfMonth({
          ...monthlyData,
          display_name: profile?.display_name || "Anonymous Director",
          avatar_url: profile?.avatar_url,
        });
      }
    } catch (error) {
      console.error("Error fetching featured content:", error);
    }
  }, []);

  const fetchCommunityMovies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("community_movies")
        .select("*")
        .eq("is_public", true)
        .order("votes_count", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(data?.map((m) => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }]) || []
      );

      // Check user votes
      let userVotes: string[] = [];
      if (user) {
        const votePeriod = getCurrentVotePeriod("weekly");
        const { data: votes } = await supabase
          .from("movie_votes")
          .select("movie_id")
          .eq("user_id", user.id)
          .eq("vote_period", votePeriod);

        userVotes = votes?.map((v) => v.movie_id) || [];
        setVotedMovies(new Set(userVotes));
      }

      const moviesWithProfiles = data?.map((movie) => {
        const profile = profileMap.get(movie.user_id);
        return {
          ...movie,
          display_name: profile?.display_name || "Anonymous Director",
          avatar_url: profile?.avatar_url,
          has_voted: userVotes.includes(movie.movie_id),
        };
      }) || [];

      setCommunityMovies(moviesWithProfiles);
    } catch (error) {
      console.error("Error fetching community movies:", error);
    }
  }, [user]);

  const fetchAnnualAwards = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from("annual_awards")
        .select("*")
        .gte("award_year", currentYear - 1)
        .order("award_year", { ascending: false });

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(data?.map((a) => a.user_id) || [])];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }]) || []
      );

      const awardsWithProfiles = data?.map((award) => {
        const profile = profileMap.get(award.user_id);
        return {
          ...award,
          display_name: profile?.display_name || "Anonymous Director",
          avatar_url: profile?.avatar_url,
        };
      }) || [];

      setAnnualAwards(awardsWithProfiles);
    } catch (error) {
      console.error("Error fetching annual awards:", error);
    }
  }, []);

  const voteForMovie = async (movieId: string) => {
    if (!user) {
      toast.error("Please sign in to vote");
      return false;
    }

    const votePeriod = getCurrentVotePeriod("weekly");

    try {
      // Check if already voted
      if (votedMovies.has(movieId)) {
        // Remove vote
        await supabase
          .from("movie_votes")
          .delete()
          .eq("movie_id", movieId)
          .eq("user_id", user.id)
          .eq("vote_period", votePeriod);

        // Update community_movies count
        await supabase
          .from("community_movies")
          .update({ votes_count: Math.max(0, (communityMovies.find(m => m.movie_id === movieId)?.votes_count || 1) - 1) })
          .eq("movie_id", movieId);

        setVotedMovies((prev) => {
          const next = new Set(prev);
          next.delete(movieId);
          return next;
        });

        setCommunityMovies((prev) =>
          prev.map((m) =>
            m.movie_id === movieId
              ? { ...m, votes_count: Math.max(0, m.votes_count - 1), has_voted: false }
              : m
          )
        );

        toast.success("Vote removed");
        return true;
      }

      // Add vote
      const { error } = await supabase.from("movie_votes").insert({
        movie_id: movieId,
        user_id: user.id,
        vote_type: "upvote",
        vote_period: votePeriod,
      });

      if (error) throw error;

      // Update community_movies count
      await supabase
        .from("community_movies")
        .update({ votes_count: (communityMovies.find(m => m.movie_id === movieId)?.votes_count || 0) + 1 })
        .eq("movie_id", movieId);

      setVotedMovies((prev) => new Set([...prev, movieId]));

      setCommunityMovies((prev) =>
        prev.map((m) =>
          m.movie_id === movieId
            ? { ...m, votes_count: m.votes_count + 1, has_voted: true }
            : m
        )
      );

      toast.success("🗳️ Vote cast! Keep supporting great Mind Movies!");
      return true;
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to vote");
      return false;
    }
  };

  const submitMovieToCommunity = async (
    movieId: string,
    title: string,
    description: string,
    movieUrl: string,
    thumbnailUrl?: string,
    chiefAimPreview?: string
  ) => {
    if (!user) {
      toast.error("Please sign in to submit");
      return false;
    }

    try {
      const { error } = await supabase.from("community_movies").insert({
        user_id: user.id,
        movie_id: movieId,
        title,
        description,
        movie_url: movieUrl,
        thumbnail_url: thumbnailUrl,
        chief_aim_preview: chiefAimPreview,
      });

      if (error) throw error;

      toast.success("🎬 Mind Movie submitted to the community!");
      await fetchCommunityMovies();
      return true;
    } catch (error) {
      console.error("Error submitting movie:", error);
      toast.error("Failed to submit movie");
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFeaturedContent(),
        fetchCommunityMovies(),
        fetchAnnualAwards(),
      ]);
      setLoading(false);
    };

    loadData();

    // Subscribe to real-time updates
    const moviesChannel = supabase
      .channel("community-movies-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_movies" },
        () => fetchCommunityMovies()
      )
      .subscribe();

    const votesChannel = supabase
      .channel("movie-votes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "movie_votes" },
        () => fetchCommunityMovies()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(moviesChannel);
      supabase.removeChannel(votesChannel);
    };
  }, [fetchFeaturedContent, fetchCommunityMovies, fetchAnnualAwards]);

  return {
    featuredMovieOfWeek,
    featuredDirectorOfMonth,
    communityMovies,
    annualAwards,
    loading,
    votedMovies,
    voteForMovie,
    submitMovieToCommunity,
    refreshData: () => {
      fetchFeaturedContent();
      fetchCommunityMovies();
      fetchAnnualAwards();
    },
  };
}
