 import { Music, Play, Pause, Sparkles, Wand2 } from "lucide-react";
 import { SimpleWaveformBars } from "@/components/music/AudioVisualizer";
 import { Button } from "@/components/ui/button";
 import { useState, useEffect } from "react";
 import { cn } from "@/lib/utils";
 import { useNavigate } from "react-router-dom";
 import { useAudio } from "@/contexts/AudioContext";
 
 interface ChiefAimAnthemCardProps {
   chiefAimSongUrl?: string | null;
   chiefAimContext?: {
     what: string;
     byWhen: string;
     exchange: string;
     plan: string;
   };
   onSongListened?: () => void;
   className?: string;
 }
 
 export const ChiefAimAnthemCard = ({ 
   chiefAimSongUrl, 
   chiefAimContext,
   onSongListened,
   className 
 }: ChiefAimAnthemCardProps) => {
   const [isVisible, setIsVisible] = useState(false);
   const [hasListenedToday, setHasListenedToday] = useState(false);
   const [wasInterrupted, setWasInterrupted] = useState(false);
   const navigate = useNavigate();
 
   const { 
     isPlaying: globalIsPlaying, 
     currentSrc,
     audioOwner,
     playAudio, 
     pauseAudio,
     stopAudio
   } = useAudio();
 
   const isPlaying = globalIsPlaying && audioOwner === 'chief-aim-anthem';
 
   useEffect(() => {
     const timer = setTimeout(() => setIsVisible(true), 300);
     return () => clearTimeout(timer);
   }, []);
 
   const togglePlayback = async () => {
     if (!chiefAimSongUrl) return;
     
     if (isPlaying) {
       pauseAudio();
       if (!hasListenedToday) {
         setWasInterrupted(true);
       }
     } else {
       if (wasInterrupted && !hasListenedToday) {
         stopAudio();
         setWasInterrupted(false);
       }
       await playAudio(chiefAimSongUrl, {
         title: 'Chief Aim Anthem',
         artist: 'Your Transformation',
         owner: 'chief-aim-anthem',
       });
     }
   };
 
   useEffect(() => {
     if (!globalIsPlaying && audioOwner === 'chief-aim-anthem' && currentSrc === chiefAimSongUrl) {
       if (!hasListenedToday && !wasInterrupted) {
         setHasListenedToday(true);
         onSongListened?.();
       }
       setWasInterrupted(false);
     }
   }, [globalIsPlaying, audioOwner, currentSrc, chiefAimSongUrl, hasListenedToday, wasInterrupted, onSongListened]);
 
   const handleCreateSong = () => {
     if (chiefAimContext) {
       const context = [
         `## MY DEFINITE CHIEF AIM`,
         "",
         `**THE DREAM:** ${chiefAimContext.what}`,
         "",
         `**THE DEADLINE:** ${chiefAimContext.byWhen}`,
         "",
         `**THE EXCHANGE (What I Give):** ${chiefAimContext.exchange}`,
         "",
         `**THE PLAN:** ${chiefAimContext.plan}`,
       ].join("\n");
       
       sessionStorage.setItem("chief-aim-lyrics-context", context);
     }
     navigate("/soundtrack?fromChiefAim=true");
   };
 
   return (
     <div 
       className={cn(
         "glass-card p-4 sm:p-5 cinematic-border relative overflow-hidden transition-all duration-500 hover:border-purple-500/50",
         isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
         className
       )}
       style={{ 
         boxShadow: '0 0 25px rgba(168, 85, 247, 0.15), inset 0 0 40px rgba(168, 85, 247, 0.03)',
       }}
     >
       {/* Holographic scan lines */}
       <div className="absolute inset-0 opacity-20 pointer-events-none">
         <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(168,85,247,0.03)_50%)] bg-[length:100%_4px]" />
       </div>
 
       <div className="flex flex-col gap-3 relative z-10">
         <div className="flex items-center justify-between gap-3">
           <div className="flex items-center gap-3">
             <div 
               className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500/30 to-gold/10"
               style={{ boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }}
             >
               <Music className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
             </div>
             <div>
               <div className="flex items-center gap-2">
                 <h3 className="text-lg sm:text-xl font-display tracking-wide text-purple-300">Chief Aim Anthem</h3>
                 <Sparkles className="w-4 h-4 text-purple-400/60" />
               </div>
               <p className="text-xs sm:text-sm text-muted-foreground">
                 {chiefAimSongUrl 
                   ? (hasListenedToday 
                       ? "✓ Listened today" 
                       : wasInterrupted 
                         ? "Restart — must play uninterrupted" 
                         : "Listen all the way through") 
                   : "Turn your aim into a motivational song"}
               </p>
             </div>
           </div>
           <div className="flex items-center gap-2">
             {chiefAimSongUrl ? (
               <>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={togglePlayback}
                   className={cn(
                     "gap-2 transition-all",
                     isPlaying 
                       ? "text-purple-400 bg-purple-500/20" 
                       : "text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10"
                   )}
                 >
                   {isPlaying ? (
                     <>
                       <Pause className="w-4 h-4" />
                       <span className="hidden sm:inline">Pause</span>
                     </>
                   ) : (
                     <>
                       <Play className="w-4 h-4" />
                       <span className="hidden sm:inline">Play</span>
                     </>
                   )}
                 </Button>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={handleCreateSong}
                   className="gap-2 text-muted-foreground hover:text-gold hover:bg-gold/10"
                 >
                   <Wand2 className="w-4 h-4" />
                   <span className="hidden sm:inline">New</span>
                 </Button>
               </>
             ) : (
               <Button
                 variant="default"
                 size="sm"
                 onClick={handleCreateSong}
                 className="gap-2 bg-gradient-to-r from-purple-500 to-gold hover:from-purple-600 hover:to-amber-500"
               >
                 <Music className="w-4 h-4" />
                 <span>Create Song</span>
               </Button>
             )}
           </div>
         </div>
         
         {/* Waveform Visualizer */}
         {chiefAimSongUrl && (
           <div className="h-16 sm:h-20 w-full rounded-xl bg-gradient-to-br from-black/30 to-purple-900/20 overflow-hidden flex items-center justify-center px-3 border border-purple-500/20">
             <SimpleWaveformBars 
               isPlaying={isPlaying} 
               barCount={32}
               className="h-12 sm:h-16 w-full"
             />
           </div>
         )}
       </div>
     </div>
   );
 };