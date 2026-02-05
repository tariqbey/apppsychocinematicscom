 import { ARCHETYPES, Archetype } from "./archetypes";
 import { cn } from "@/lib/utils";
 import { useState } from "react";
 import { ChevronDown, User2, Zap, Sun, Moon, List, Film, Quote } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 
function ArchetypeFullDetails({ archetype }: { archetype: Archetype }) {
   return (
    <div className="pt-3 space-y-4 animate-accordion-down">
      {/* Cinematic Definition */}
      <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
        <div className="flex items-center gap-2 mb-1">
          <Film className="w-4 h-4 text-gold" />
          <span className="text-xs font-medium text-gold uppercase tracking-wider">Cinematic Definition</span>
        </div>
        <p className="text-sm text-foreground">{archetype.cinematicDefinition}</p>
      </div>

      {/* Light/Shadow */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Superpower</span>
           </div>
          <p className="text-sm font-medium text-foreground mb-1">{archetype.superpower}</p>
          <p className="text-xs text-muted-foreground">{archetype.superpowerDescription}</p>
         </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Bad Take</span>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">{archetype.shadow}</p>
          <p className="text-xs text-muted-foreground">{archetype.shadowDescription}</p>
         </div>
      </div>
 
      {/* Director's Note */}
      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Quote className="w-4 h-4 text-purple-400" />
          <p className="text-xs font-medium text-purple-400 uppercase tracking-wider">Director's Note</p>
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
             <User2 className="w-6 h-6 text-gold" />
           </div>
           <div>
             <h2 className="text-xl font-display tracking-wide text-gold-gradient">Archetype Guide</h2>
             <p className="text-sm text-muted-foreground">Discover the 11 Director archetypes</p>
           </div>
         </div>
         <p className="text-sm text-muted-foreground leading-relaxed">
           Each archetype represents a unique pattern of strengths, shadows, and transformation potential. 
           Understanding your archetype helps you recognize your natural gifts, anticipate your blind spots, 
           and navigate your hero's journey with greater awareness. Click on any archetype to explore its full profile.
         </p>
       </div>
 
      {/* All Archetypes - Full Details on Expand */}
      <div className="glass-card p-5 sm:p-6 cinematic-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/20 flex items-center justify-center">
            <List className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-display tracking-wide">The 11 Director Archetypes</h3>
            <p className="text-xs text-muted-foreground">Tap any archetype to see full details</p>
          </div>
        </div>
        <Separator className="mb-4 bg-border/50" />
        <div className="grid gap-2">
          {ARCHETYPES.map((archetype, index) => (
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
                  <div className="w-7 h-7 rounded-md bg-gold/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-gold">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{archetype.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{archetype.superpower}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="flex items-center gap-1">
                        <Sun className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">{archetype.lightShadow.light}</span>
                      </span>
                      <span className="text-muted-foreground/50">|</span>
                      <span className="flex items-center gap-1">
                        <Moon className="w-3 h-3 text-red-400" />
                        <span className="text-red-400">{archetype.lightShadow.shadow}</span>
                      </span>
                    </div>
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
                <Film className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-gold">Cinematic Definition</p>
                  <p className="text-muted-foreground text-xs">The archetype's role in film production—derived from Rabiger, Snyder, and Psycho-Cinematics™.</p>
                </div>
              </div>
             <div className="flex items-start gap-3">
               <Sun className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
               <div>
                  <p className="font-medium text-emerald-400">Superpower</p>
                  <p className="text-muted-foreground text-xs">The archetype's unique ability when operating at full potential.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <Moon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
               <div>
                  <p className="font-medium text-red-400">The Bad Take</p>
                  <p className="text-muted-foreground text-xs">The shadow expression that emerges under stress—your pattern to interrupt.</p>
               </div>
             </div>
           </div>
           <div className="space-y-3">
             <div className="flex items-start gap-3">
                <Quote className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
               <div>
                  <p className="font-medium text-purple-400">Director's Note</p>
                  <p className="text-muted-foreground text-xs">A coaching insight to help you recognize and overcome this archetype's challenge.</p>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }