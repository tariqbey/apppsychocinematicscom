 import { useState, useEffect } from "react";
 import { Film, Play, ChevronDown, Zap, CheckCircle } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
   DropdownMenuSeparator,
   DropdownMenuLabel,
 } from "@/components/ui/dropdown-menu";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 
 interface EpisodeWithMovie {
   id: string;
   title: string;
   objective: string;
   status: string;
   movie_url: string | null;
 }
 
 interface EpisodeMovieSelectorProps {
   currentSource: "mind-movie" | "episode";
   currentEpisodeId?: string;
   onSelectMindMovie: () => void;
   onSelectEpisode: (episode: EpisodeWithMovie) => void;
 }
 
 export function EpisodeMovieSelector({
   currentSource,
   currentEpisodeId,
   onSelectMindMovie,
   onSelectEpisode,
 }: EpisodeMovieSelectorProps) {
   const { user } = useAuth();
   const [episodes, setEpisodes] = useState<EpisodeWithMovie[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchEpisodesWithMovies = async () => {
       if (!user) return;
 
       const { data: episodesData, error } = await supabase
         .from("episodes")
         .select("id, title, objective, status, mind_movie_script_id")
         .eq("user_id", user.id)
         .not("mind_movie_script_id", "is", null)
         .order("created_at", { ascending: false });
 
       if (error || !episodesData) {
         setLoading(false);
         return;
       }
 
       // Fetch movie URLs for each episode
       const episodesWithMovies: EpisodeWithMovie[] = [];
       
       for (const ep of episodesData) {
         if (ep.mind_movie_script_id) {
           const { data: script } = await supabase
             .from("mind_movie_scripts")
             .select("movie_url")
             .eq("id", ep.mind_movie_script_id)
             .single();
           
           if (script?.movie_url) {
             episodesWithMovies.push({
               id: ep.id,
               title: ep.title,
               objective: ep.objective,
               status: ep.status,
               movie_url: script.movie_url,
             });
           }
         }
       }
 
       setEpisodes(episodesWithMovies);
       setLoading(false);
     };
 
     fetchEpisodesWithMovies();
   }, [user]);
 
   const currentLabel = currentSource === "mind-movie" 
     ? "Mind Movie" 
     : episodes.find(e => e.id === currentEpisodeId)?.title || "Episode";
 
   if (loading) {
     return null;
   }
 
   // Only show if there are episode movies to choose from
   if (episodes.length === 0) {
     return null;
   }
 
   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button 
           variant="outline" 
           size="sm" 
           className="gap-2 border-gold/30 text-gold hover:bg-gold/10"
         >
           {currentSource === "mind-movie" ? (
             <Film className="w-4 h-4" />
           ) : (
             <Zap className="w-4 h-4" />
           )}
           <span className="max-w-[120px] truncate">{currentLabel}</span>
           <ChevronDown className="w-3 h-3" />
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="start" className="w-64">
         <DropdownMenuLabel className="text-xs text-muted-foreground">
           Select Video Source
         </DropdownMenuLabel>
         <DropdownMenuSeparator />
         
         {/* Mind Movie Option */}
         <DropdownMenuItem 
           onClick={onSelectMindMovie}
           className="gap-3 cursor-pointer"
         >
           <Film className="w-4 h-4 text-gold" />
           <div className="flex-1">
             <p className="font-medium">Mind Movie</p>
             <p className="text-xs text-muted-foreground">Your main visualization</p>
           </div>
           {currentSource === "mind-movie" && (
             <CheckCircle className="w-4 h-4 text-green-500" />
           )}
         </DropdownMenuItem>
 
         {episodes.length > 0 && (
           <>
             <DropdownMenuSeparator />
             <DropdownMenuLabel className="text-xs text-muted-foreground">
               Episode Movies ({episodes.length})
             </DropdownMenuLabel>
             
             {episodes.map((episode) => (
               <DropdownMenuItem
                 key={episode.id}
                 onClick={() => onSelectEpisode(episode)}
                 className="gap-3 cursor-pointer"
               >
                 <Zap className={`w-4 h-4 ${
                   episode.status === "active" ? "text-amber-500" :
                   episode.status === "completed" ? "text-green-500" :
                   "text-muted-foreground"
                 }`} />
                 <div className="flex-1 min-w-0">
                   <p className="font-medium truncate">{episode.title}</p>
                   <p className="text-xs text-muted-foreground truncate">
                     {episode.objective.slice(0, 40)}...
                   </p>
                 </div>
                 {currentSource === "episode" && currentEpisodeId === episode.id && (
                   <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                 )}
               </DropdownMenuItem>
             ))}
           </>
         )}
       </DropdownMenuContent>
     </DropdownMenu>
   );
 }