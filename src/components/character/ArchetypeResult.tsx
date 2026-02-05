 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Target, X, Crown, Zap, Swords, Quote, Scale, Sparkles, User2, Circle } from "lucide-react";
 import { Archetype, ARCHETYPES } from "./archetypes";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { CharacterTransformationCoach } from "./CharacterTransformationCoach";
 
 interface ArchetypeResultProps {
   archetype: Archetype;
   scores: Record<string, number>;
   onClose: () => void;
   onRetake: () => void;
 }
 
 export function ArchetypeResult({ archetype, scores, onClose, onRetake }: ArchetypeResultProps) {
   const [showTransformationCoach, setShowTransformationCoach] = useState(false);
   
   // Sort archetypes by score for ranking
   const rankedArchetypes = ARCHETYPES.map(a => ({
     ...a,
     score: scores[a.id] || 0
   })).sort((a, b) => b.score - a.score);
 
   const topThree = rankedArchetypes.slice(0, 3);
   const maxScore = Math.max(...Object.values(scores), 1);
 
   if (showTransformationCoach) {
     return (
       <CharacterTransformationCoach
         archetype={archetype}
         scores={scores}
         onClose={() => setShowTransformationCoach(false)}
       />
     );
   }
 
   return (
     <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-hidden">
       <ScrollArea className="h-full">
         <div className="min-h-screen py-8 px-4">
           <div className="max-w-3xl mx-auto space-y-6">
             {/* Close Button */}
             <div className="flex justify-end">
               <Button variant="ghost" size="icon" onClick={onClose}>
                 <X className="h-5 w-5" />
               </Button>
             </div>
 
             {/* Main Result Card */}
             <Card className="glass-card border-gold/50 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-amber-500/5" />
               
               <CardHeader className="relative text-center space-y-4 pb-2">
                 <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center mx-auto shadow-2xl">
                   <Crown className="w-12 h-12 text-black" />
                 </div>
                 <div>
                   <div className="flex items-center justify-center gap-2 mb-1">
                     <Badge className="bg-gold/20 text-gold border-gold/30">Sphere {archetype.sphere}</Badge>
                   </div>
                   <CardTitle className="text-4xl font-display tracking-wide text-gold-gradient">
                     {archetype.name}
                   </CardTitle>
                   <p className="text-sm text-muted-foreground mt-2">{archetype.deity}</p>
               <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-gold/20">
                 <p className="text-sm text-muted-foreground italic">
                   <Quote className="inline w-3 h-3 mr-1 text-gold" />
                   {archetype.directorsNote}
                 </p>
               </div>
                 </div>
               </CardHeader>
 
               <CardContent className="relative space-y-6 pt-4">
                 {/* The Law */}
                 <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                   <div className="flex items-center gap-2 mb-2">
                     <Scale className="h-4 w-4 text-cyan-400" />
                     <h4 className="font-medium text-cyan-400">The Law</h4>
                   </div>
                   <p className="text-sm text-muted-foreground">{archetype.law}</p>
                 </div>
 
                 {/* Role */}
                 <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                   <div className="flex items-center gap-2 mb-2">
                     <User2 className="h-4 w-4 text-emerald-400" />
                     <h4 className="font-medium text-emerald-400">Role</h4>
                   </div>
                   <p className="text-sm text-muted-foreground">{archetype.role}</p>
                 </div>
               </CardContent>
             </Card>
 
             {/* Archetype Ranking */}
             <Card className="glass-card cinematic-border">
               <CardHeader className="pb-2">
                 <CardTitle className="text-lg font-display tracking-wide flex items-center gap-2">
                   <Zap className="h-5 w-5 text-gold" />
                   Your Sphere Profile
                 </CardTitle>
                 <p className="text-sm text-muted-foreground">
                   Your top 3 archetype influences
                 </p>
               </CardHeader>
               <CardContent className="space-y-4">
                 {topThree.map((arch, index) => (
                   <div key={arch.id} className="space-y-2">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                           index === 0 ? "bg-gold/20 text-gold" : index === 1 ? "bg-slate-400/20 text-slate-400" : "bg-amber-700/20 text-amber-700"
                         }`}>
                           {arch.sphere}
                         </div>
                         <span className="font-medium">{arch.name}</span>
                       </div>
                       <span className="text-sm text-muted-foreground">
                         {Math.round((arch.score / maxScore) * 100)}%
                       </span>
                     </div>
                     <div className="h-2 rounded-full bg-muted overflow-hidden">
                       <div 
                         className={`h-full rounded-full transition-all ${
                           index === 0 ? "bg-gold" : index === 1 ? "bg-slate-400" : "bg-amber-700"
                         }`}
                         style={{ width: `${(arch.score / maxScore) * 100}%` }}
                       />
                     </div>
                   </div>
                 ))}
               </CardContent>
             </Card>
 
             {/* Transformation Coach CTA */}
             <Card className="glass-card border-red-500/30 bg-gradient-to-br from-red-500/5 to-orange-500/5">
               <CardContent className="py-6 text-center space-y-4">
                 <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto">
                   <Swords className="w-7 h-7 text-red-400" />
                 </div>
                 <div>
                   <h3 className="font-display text-lg">Who Must You Become?</h3>
                   <p className="text-sm text-muted-foreground mt-1">
                     Get AI-powered analysis of the character transformation required to achieve your Chief Aim.
                   </p>
                 </div>
                 <Button 
                   onClick={() => setShowTransformationCoach(true)}
                   className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                 >
                   <Target className="h-4 w-4" />
                   Reveal My Required Character
                 </Button>
               </CardContent>
             </Card>
 
             {/* Actions */}
             <div className="flex justify-center gap-4 pb-8">
               <Button variant="outline" onClick={onRetake}>
                 Retake Survey
               </Button>
               <Button variant="gold" onClick={onClose}>
                 Continue as {archetype.name}
               </Button>
             </div>
           </div>
         </div>
       </ScrollArea>
     </div>
   );
 }
