import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface MindMovie {
  id: string;
  user_id: string;
  title: string | null;
  chief_aim_snapshot: {
    what?: string;
    byWhen?: string;
    exchange?: string;
    plan?: string;
  } | null;
  visual_style: string | null;
  scenes: any[];
  status: string;
  movie_url: string | null;
  is_active: boolean;
  soundtrack_url: string | null;
  song_lyrics: string | null;
  music_style: string | null;
  created_at: string;
  updated_at: string;
}

export function useMindMovies() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState<MindMovie[]>([]);
  const [activeMovie, setActiveMovie] = useState<MindMovie | null>(null);

  const fetchAllMovies = useCallback(async () => {
    if (!user) return [];

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("mind_movie_scripts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching movies:", error);
        return [];
      }

      const formattedMovies: MindMovie[] = (data || []).map((m) => ({
        ...m,
        scenes: (m.scenes as any[]) || [],
        chief_aim_snapshot: m.chief_aim_snapshot as MindMovie["chief_aim_snapshot"],
        is_active: m.is_active || false,
        movie_url: m.movie_url || null,
      }));

      setMovies(formattedMovies);

      // Find active movie
      const active = formattedMovies.find((m) => m.is_active);
      setActiveMovie(active || null);

      return formattedMovies;
    } catch (error) {
      console.error("Error fetching movies:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createNewMovie = useCallback(
    async (title?: string) => {
      // NOTE: This hook has its own `useAuth()` instance. During initial load, `user`
      // can be temporarily null even though the session exists. Fall back to the
      // current session to avoid race-condition failures (especially when opening
      // the wizard via URL params).
      let userId = user?.id;

      if (!userId) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error) {
          userId = session?.user?.id;
        }
      }

      if (!userId) {
        toast.error("Please sign in to create a movie");
        return null;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("mind_movie_scripts")
          .insert({
            user_id: userId,
            title: title || `New Mind Movie ${new Date().toLocaleDateString()}`,
            status: "draft",
            is_active: false,
            scenes: [],
          })
          .select()
          .single();

        if (error) throw error;

        const newMovie: MindMovie = {
          ...data,
          scenes: [],
          chief_aim_snapshot: null,
          is_active: false,
          movie_url: null,
        };

        setMovies((prev) => [newMovie, ...prev]);
        toast.success("New Mind Movie created!");
        return newMovie;
      } catch (error) {
        console.error("Error creating movie:", error);
        toast.error("Failed to create movie");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const setMovieAsActive = useCallback(
    async (movieId: string) => {
      if (!user) return false;

      setIsLoading(true);
      try {
        // First, deactivate all movies
        await supabase
          .from("mind_movie_scripts")
          .update({ is_active: false })
          .eq("user_id", user.id);

        // Then activate the selected one
        const { error } = await supabase
          .from("mind_movie_scripts")
          .update({ is_active: true })
          .eq("id", movieId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Update the user profile's mind_movie_url with this movie's URL
        const movie = movies.find((m) => m.id === movieId);
        if (movie?.movie_url) {
          await supabase
            .from("user_profiles")
            .update({ mind_movie_url: movie.movie_url })
            .eq("user_id", user.id);
        }

        // Update local state
        setMovies((prev) =>
          prev.map((m) => ({
            ...m,
            is_active: m.id === movieId,
          }))
        );
        setActiveMovie(movies.find((m) => m.id === movieId) || null);

        toast.success("Mind Movie set as active!");
        return true;
      } catch (error) {
        console.error("Error setting active movie:", error);
        toast.error("Failed to set active movie");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, movies]
  );

  const saveMovieUrl = useCallback(
    async (movieId: string, movieUrl: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("mind_movie_scripts")
          .update({
            movie_url: movieUrl,
            status: "complete",
            updated_at: new Date().toISOString(),
          })
          .eq("id", movieId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Update local state
        setMovies((prev) =>
          prev.map((m) =>
            m.id === movieId ? { ...m, movie_url: movieUrl, status: "complete" } : m
          )
        );

        return true;
      } catch (error) {
        console.error("Error saving movie URL:", error);
        return false;
      }
    },
    [user]
  );

  const deleteMovie = useCallback(
    async (movieId: string) => {
      if (!user) return false;

      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("mind_movie_scripts")
          .delete()
          .eq("id", movieId)
          .eq("user_id", user.id);

        if (error) throw error;

        setMovies((prev) => prev.filter((m) => m.id !== movieId));
        toast.success("Movie deleted");
        return true;
      } catch (error) {
        console.error("Error deleting movie:", error);
        toast.error("Failed to delete movie");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const duplicateMovie = useCallback(
    async (movieId: string) => {
      if (!user) return null;

      const movie = movies.find((m) => m.id === movieId);
      if (!movie) return null;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("mind_movie_scripts")
          .insert({
            user_id: user.id,
            title: `${movie.title || "Movie"} (Copy)`,
            chief_aim_snapshot: movie.chief_aim_snapshot as any,
            visual_style: movie.visual_style,
            scenes: movie.scenes as any,
            status: "draft",
            is_active: false,
            song_lyrics: movie.song_lyrics,
            music_style: movie.music_style,
          })
          .select()
          .single();

        if (error) throw error;

        const newMovie: MindMovie = {
          ...data,
          scenes: (data.scenes as any[]) || [],
          chief_aim_snapshot: data.chief_aim_snapshot as MindMovie["chief_aim_snapshot"],
          is_active: false,
          movie_url: null,
        };

        setMovies((prev) => [newMovie, ...prev]);
        toast.success("Movie duplicated!");
        return newMovie;
      } catch (error) {
        console.error("Error duplicating movie:", error);
        toast.error("Failed to duplicate movie");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, movies]
  );

  return {
    isLoading,
    movies,
    activeMovie,
    fetchAllMovies,
    createNewMovie,
    setMovieAsActive,
    saveMovieUrl,
    deleteMovie,
    duplicateMovie,
  };
}
