 import { ARCHETYPES, Archetype } from "./archetypes";
 import { cn } from "@/lib/utils";
 import { useState } from "react";
 import { ChevronDown, User2, List, Sparkles, Scale, Quote, Circle } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 
 function ArchetypeFullDetails({ archetype }: { archetype: Archetype }) {
   return (
     <div className="pt-3 space-y-4 animate-accordion-down">
       {/* Deity/Principle */}
       <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
         <div className="flex items-center gap-2 mb-1">
           <Sparkles className="w-4 h-4 text-gold" />
           <span className="text-xs font-medium text-gold uppercase tracking-wider">Deity / Principle</span>
         </div>
         <p className="text-sm text-foreground">{archetype.deity}</p>
       </div>
 
       {/* The Law */}
       <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
         <div className="flex items-center gap-2 mb-1">
           <Scale className="w-4 h-4 text-cyan-400" />
           <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">The Law</span>
         </div>
         <p className="text-sm text-foreground">{archetype.law}</p>
       </div>
 
       {/* Role */}
       <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
         <div className="flex items-center gap-2 mb-1">
           <User2 className="w-4 h-4 text-emerald-400" />
           <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Role</span>
         </div>
         <p className="text-sm text-foreground">{archetype.role}</p>
       </div>
 
       {/* Director's Note */}
       <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
         <div className="flex items-center gap-2 mb-2">
           <Quote className="w-4 h-4 text-purple-400" />
           <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">Director's Note</span>
         </div>
         <p className="text-sm text-foreground italic">"{archetype.directorsNote}"</p>
       </div>
     </div>
   );
 }
 
 export function ArchetypesGuide() {
   const [expandedId, setExpandedId] = useState<string | null>(null);
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="glass-card p-5 sm:p-6 cinematic-border">
         <div className="flex items-center gap-3 mb-4">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-amber-500/20 flex items-center justify-center">
             <Circle className="w-6 h-6 text-gold" />
           </div>
           <div>
              <h2 className="text-xl font-display tracking-wide text-gold-gradient">The 11 Spheres</h2>
              <p className="text-sm text-muted-foreground">The 11 Laws of God — Metu Neter Archetype System</p>
           </div>
         </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Based on Ra Un Nefer Amen's "Maat: The 11 Laws of God" and the Kemetic Tree of Life (Paut Neteru). 
            These aren't personality labels — they're spheres of spiritual influence that shape your thinking, 
            feelings, actions, and destiny. Each sphere carries a divine principle, a law, and a programming 
            function. Understanding yours means knowing your power source, your blind spots, and how to 
            direct your transformation with precision.
          </p>
       </div>
 
       {/* All Archetypes - Full Details on Expand */}
       <div className="glass-card p-5 sm:p-6 cinematic-border">
         <div className="flex items-center gap-3 mb-4">
           <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/20 flex items-center justify-center">
             <List className="w-5 h-5 text-cyan-400" />
           </div>
           <div>
             <h3 className="text-lg font-display tracking-wide">The Spheres & Archetypes</h3>
             <p className="text-xs text-muted-foreground">Tap any archetype to see full details</p>
           </div>
         </div>
         <Separator className="mb-4 bg-border/50" />
         <div className="grid gap-2">
           {ARCHETYPES.map((archetype) => (
             <Collapsible
               key={archetype.id}
               open={expandedId === archetype.id}
               onOpenChange={() => setExpandedId(expandedId === archetype.id ? null : archetype.id)}
             >
               <CollapsibleTrigger asChild>
                 <div className={cn(
                   "flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer",
                   expandedId === archetype.id && "bg-muted/50 border border-gold/30"
                 )}>
                   <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                     <span className="text-xs font-bold text-gold">{archetype.sphere}</span>
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 flex-wrap">
                       <span className="font-medium text-foreground">{archetype.name}</span>
                       <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gold/30 text-gold">
                         Sphere {archetype.sphere}
                       </Badge>
                     </div>
                     <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{archetype.deity}</p>
                   </div>
                   <ChevronDown className={cn(
                     "w-4 h-4 text-muted-foreground shrink-0 transition-transform mt-1",
                     expandedId === archetype.id && "rotate-180"
                   )} />
                 </div>
               </CollapsibleTrigger>
               <CollapsibleContent className="px-3 pb-3">
                 <ArchetypeFullDetails archetype={archetype} />
               </CollapsibleContent>
             </Collapsible>
           ))}
         </div>
       </div>
 
       {/* Legend/Key */}
       <div className="glass-card p-5 sm:p-6 cinematic-border space-y-4">
         <h3 className="text-lg font-display tracking-wide">Understanding the Profile Elements</h3>
         <div className="grid sm:grid-cols-2 gap-4 text-sm">
           <div className="space-y-3">
             <div className="flex items-start gap-3">
               <Circle className="w-4 h-4 text-gold mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium text-gold">Sphere</p>
                 <p className="text-muted-foreground text-xs">The position on the Tree of Life (0-10), representing the level of consciousness.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <Sparkles className="w-4 h-4 text-gold mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium text-gold">Deity / Principle</p>
                 <p className="text-muted-foreground text-xs">The Kemetic Neter (divine principle) that governs this sphere.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <Scale className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium text-cyan-400">The Law</p>
                 <p className="text-muted-foreground text-xs">The spiritual law or principle that this archetype embodies.</p>
               </div>
             </div>
           </div>
           <div className="space-y-3">
             <div className="flex items-start gap-3">
               <User2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium text-emerald-400">Role</p>
                 <p className="text-muted-foreground text-xs">How this archetype functions in the Director's production (your life).</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <Quote className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium text-purple-400">Director's Note</p>
                 <p className="text-muted-foreground text-xs">A mantra or affirmation that captures this archetype's essence.</p>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }