 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
import { Film, Clapperboard, Music, FolderOpen, X, Sparkles } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import iconEditBay from "@/assets/icons/icon-edit-bay.png";
 import iconMindMovie from "@/assets/icons/icon-mind-movie.png";
 import iconSoundtrack from "@/assets/icons/icon-soundtrack.png";
 
 interface MovieStudioModuleProps {
   onOpenEditBay: () => void;
   onOpenMovieVault: () => void;
   onOpenStoryboard: () => void;
   className?: string;
 }
 
 interface StudioOption {
   id: string;
   title: string;
   description: string;
   icon: React.ReactNode;
   iconImage?: string;
   color: string;
   onClick: () => void;
 }
 
 export function MovieStudioModule({
   onOpenEditBay,
   onOpenMovieVault,
   onOpenStoryboard,
   className,
 }: MovieStudioModuleProps) {
   const navigate = useNavigate();
   const [isOpen, setIsOpen] = useState(false);
 
  const studioOptions: StudioOption[] = [
    {
      id: "soundtrack",
      title: "Soundtrack Studio",
      description: "Create custom AI music & lyrics",
      icon: null,
      iconImage: iconSoundtrack,
      color: "from-pink-500/20 to-rose-600/20",
      onClick: () => {
        setIsOpen(false);
        navigate("/soundtrack");
      },
    },
    {
      id: "vault",
      title: "Mind Movie Vault",
      description: "Watch your movie collection",
      icon: null,
      iconImage: iconMindMovie,
      color: "from-amber-500/20 to-yellow-600/20",
      onClick: () => {
        setIsOpen(false);
        onOpenMovieVault();
      },
    },
  ];
 
   return (
     <>
       {/* Main Module Card */}
       <button
         onClick={() => setIsOpen(true)}
         className={`w-full glass-card p-5 sm:p-6 cinematic-border group transition-all duration-500 text-left relative overflow-hidden hover:border-gold/50 animate-fade-in ${className}`}
         style={{
           boxShadow: '0 0 25px rgba(212, 175, 55, 0.15), inset 0 0 40px rgba(212, 175, 55, 0.05)',
         }}
       >
         {/* Background effects */}
         <div className="absolute inset-0 opacity-20">
           <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(212,175,55,0.03)_50%)] bg-[length:100%_4px]" />
         </div>
         <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
         
         <Sparkles className="absolute top-3 right-8 w-3 h-3 text-gold/40 animate-pulse" />
         <Sparkles className="absolute bottom-4 right-16 w-2 h-2 text-gold/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
         
         <div className="flex items-center gap-3 sm:gap-4 relative z-10">
           <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-gold/30 to-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
             style={{
               boxShadow: '0 0 20px rgba(212,175,55,0.3)',
             }}
           >
             <Clapperboard className="w-7 h-7 text-gold" />
           </div>
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1">
               <h3 className="text-lg sm:text-xl font-display tracking-wide text-gold group-hover:text-gold transition-colors">
                 Psycho Cinematic Movie Studio
               </h3>
               <Sparkles className="w-4 h-4 text-gold/60 animate-pulse" />
             </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Soundtrack • Movie Vault
            </p>
           </div>
           <div className="hidden sm:flex items-center gap-2 text-sm text-gold group-hover:text-gold transition-colors">
             <span>Open Studio</span>
             <span className="text-lg">→</span>
           </div>
         </div>
       </button>
 
       {/* Studio Selection Dialog */}
       <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-2xl bg-background border-gold/30 [&>button:last-child]:hidden">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setIsOpen(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-lg">←</span>
                <span>Back</span>
              </button>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-display">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
                  <Clapperboard className="w-5 h-5 text-gold" />
                </div>
                Psycho Cinematic Movie Studio
              </DialogTitle>
            </DialogHeader>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
             {studioOptions.map((option, index) => (
               <button
                 key={option.id}
                 onClick={option.onClick}
                 className={`p-5 rounded-xl border border-border/50 bg-gradient-to-br ${option.color} hover:border-gold/50 transition-all duration-300 text-left group/item hover:scale-[1.02]`}
                 style={{ animationDelay: `${index * 0.1}s` }}
               >
                 <div className="flex items-start gap-4">
                   <div className="w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
                     {option.iconImage ? (
                       <img src={option.iconImage} alt="" className="w-8 h-8 object-contain" />
                     ) : (
                       option.icon
                     )}
                   </div>
                   <div>
                     <h4 className="font-medium text-lg mb-1 group-hover/item:text-gold transition-colors">
                       {option.title}
                     </h4>
                     <p className="text-sm text-muted-foreground">
                       {option.description}
                     </p>
                   </div>
                 </div>
               </button>
             ))}
           </div>
         </DialogContent>
       </Dialog>
     </>
   );
 }