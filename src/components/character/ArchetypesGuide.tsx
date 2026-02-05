 import { ARCHETYPES, Archetype } from "./archetypes";
 import { cn } from "@/lib/utils";
 import { useState } from "react";
 import { ChevronDown, ChevronUp, User2, Sparkles, AlertTriangle, Zap, Sun, Moon } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
 
 interface ArchetypeCardProps {
   archetype: Archetype;
   isExpanded: boolean;
   onToggle: () => void;
 }
 
 function ArchetypeCard({ archetype, isExpanded, onToggle }: ArchetypeCardProps) {
   return (
     <div className="glass-card cinematic-border overflow-hidden transition-all duration-300">
       {/* Header - Always Visible */}
       <button
         onClick={onToggle}
         className="w-full p-4 sm:p-5 text-left flex items-start gap-4 hover:bg-white/5 transition-colors"
       >
         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-amber-500/20 flex items-center justify-center shrink-0">
           <User2 className="w-6 h-6 text-gold" />
         </div>
         <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2 flex-wrap mb-1">
             <h3 className="text-lg font-display tracking-wide text-gold">{archetype.name}</h3>
             <Badge variant="outline" className="text-xs border-border/50">
               {archetype.id.replace(/_/g, " ")}
             </Badge>
           </div>
           <p className="text-sm text-muted-foreground italic">"{archetype.tagline}"</p>
         </div>
         <div className="shrink-0 text-muted-foreground">
           {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
         </div>
       </button>
 
       {/* Expanded Content */}
       {isExpanded && (
         <div className="px-4 sm:px-5 pb-5 space-y-4 animate-fade-in border-t border-border/30 pt-4">
           {/* Light/Shadow */}
           <div className="grid grid-cols-2 gap-3">
             <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
               <div className="flex items-center gap-2 mb-1">
                 <Sun className="w-4 h-4 text-emerald-400" />
                 <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Light</span>
               </div>
               <p className="text-sm text-foreground">{archetype.lightShadow.light}</p>
             </div>
             <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
               <div className="flex items-center gap-2 mb-1">
                 <Moon className="w-4 h-4 text-red-400" />
                 <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Shadow</span>
               </div>
               <p className="text-sm text-foreground">{archetype.lightShadow.shadow}</p>
             </div>
           </div>
 
           {/* Social Roles */}
           <div>
             <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Common Roles</p>
             <div className="flex flex-wrap gap-1.5">
               {archetype.socialCorrespondence.map((role, i) => (
                 <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                   {role}
                 </span>
               ))}
             </div>
           </div>
 
           {/* Strengths & Weaknesses */}
           <div className="grid sm:grid-cols-2 gap-3">
             <div>
               <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="w-4 h-4 text-gold" />
                 <p className="text-xs font-medium text-gold uppercase tracking-wider">Strengths</p>
               </div>
               <ul className="text-sm text-muted-foreground space-y-1">
                 {archetype.strengths.map((s, i) => (
                   <li key={i} className="flex items-center gap-2">
                     <span className="w-1 h-1 rounded-full bg-gold" />
                     {s}
                   </li>
                 ))}
               </ul>
             </div>
             <div>
               <div className="flex items-center gap-2 mb-2">
                 <AlertTriangle className="w-4 h-4 text-amber-500" />
                 <p className="text-xs font-medium text-amber-500 uppercase tracking-wider">Weaknesses</p>
               </div>
               <ul className="text-sm text-muted-foreground space-y-1">
                 {archetype.weaknesses.map((w, i) => (
                   <li key={i} className="flex items-center gap-2">
                     <span className="w-1 h-1 rounded-full bg-amber-500" />
                     {w}
                   </li>
                 ))}
               </ul>
             </div>
           </div>
 
           {/* Story Fuel & Conflict */}
           <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
             <div className="flex items-center gap-2 mb-2">
               <Zap className="w-4 h-4 text-purple-400" />
               <p className="text-xs font-medium text-purple-400 uppercase tracking-wider">Story Fuel</p>
             </div>
             <p className="text-sm text-foreground">{archetype.storyFuel}</p>
           </div>
 
           {/* Signature Traits */}
           <div className="space-y-2">
             <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Character Signature</p>
             <div className="grid gap-2 text-sm">
               <div className="flex gap-2">
                 <span className="text-muted-foreground shrink-0 w-28">Dialogue:</span>
                 <span className="text-foreground">{archetype.signature.dialogueStyle}</span>
               </div>
               <div className="flex gap-2">
                 <span className="text-muted-foreground shrink-0 w-28">Presence:</span>
                 <span className="text-foreground">{archetype.signature.physicalPresence}</span>
               </div>
               <div className="flex gap-2">
                 <span className="text-muted-foreground shrink-0 w-28">Temptation:</span>
                 <span className="text-foreground">{archetype.signature.moralTemptation}</span>
               </div>
               <div className="flex gap-2">
                 <span className="text-muted-foreground shrink-0 w-28">Break Point:</span>
                 <span className="text-foreground">{archetype.signature.breakPoint}</span>
               </div>
               <div className="flex gap-2">
                 <span className="text-muted-foreground shrink-0 w-28">Redemption:</span>
                 <span className="text-foreground">{archetype.signature.redemptionBeat}</span>
               </div>
             </div>
           </div>
         </div>
       )}
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
 
       {/* Archetypes List */}
       <div className="space-y-3">
         {ARCHETYPES.map((archetype) => (
           <ArchetypeCard
             key={archetype.id}
             archetype={archetype}
             isExpanded={expandedId === archetype.id}
             onToggle={() => setExpandedId(expandedId === archetype.id ? null : archetype.id)}
           />
         ))}
       </div>
 
       {/* Legend/Key */}
       <div className="glass-card p-5 sm:p-6 cinematic-border space-y-4">
         <h3 className="text-lg font-display tracking-wide">Understanding the Profile Elements</h3>
         <div className="grid sm:grid-cols-2 gap-4 text-sm">
           <div className="space-y-3">
             <div className="flex items-start gap-3">
               <Sun className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium text-emerald-400">Light Expression</p>
                 <p className="text-muted-foreground text-xs">The archetype at its highest potential—the gift you bring when operating from wholeness.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <Moon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium text-red-400">Shadow Expression</p>
                 <p className="text-muted-foreground text-xs">The distorted version that emerges under stress, fear, or unconscious patterns.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <Zap className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium text-purple-400">Story Fuel</p>
                 <p className="text-muted-foreground text-xs">The central dramatic question that drives this archetype's transformation journey.</p>
               </div>
             </div>
           </div>
           <div className="space-y-3">
             <div className="flex items-start gap-3">
               <Sparkles className="w-4 h-4 text-gold mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium text-gold">Strengths</p>
                 <p className="text-muted-foreground text-xs">Natural gifts and capabilities that come easily to this archetype.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium text-amber-500">Weaknesses</p>
                 <p className="text-muted-foreground text-xs">Blind spots and tendencies that require conscious attention and growth.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <User2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium text-cyan-400">Character Signature</p>
                 <p className="text-muted-foreground text-xs">How this archetype speaks, moves, is tempted, breaks, and finds redemption.</p>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }