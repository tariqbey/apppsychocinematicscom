 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Progress } from "@/components/ui/progress";
 import { ChevronLeft, ChevronRight, X, BookOpen, CheckCircle2 } from "lucide-react";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import { Label } from "@/components/ui/label";
 import { Archetype, ARCHETYPES } from "./archetypes";
 
 // Napoleon Hill's 17 Laws of Success with self-analysis questions
 // Each law maps to specific archetypes based on strength alignment
 interface LawQuestion {
   lawNumber: number;
   lawName: string;
   question: string;
   description: string;
   archetypeWeights: Record<string, number>;
 }
 
 const NAPOLEON_HILL_17_LAWS: LawQuestion[] = [
   {
     lawNumber: 1,
     lawName: "The Master Mind",
     question: "How effectively do you build and maintain harmonious alliances with others toward a common purpose?",
     description: "The coordination of knowledge and effort between two or more people working toward a definite purpose in a spirit of harmony.",
     archetypeWeights: { analyst: 3, deep_memory: 2, auteur: 2, law_keeper: 1 }
   },
   {
     lawNumber: 2,
     lawName: "A Definite Chief Aim",
     question: "How clearly have you defined your major purpose in life, and how consistently do you work toward it?",
     description: "The starting point of all achievement - knowing exactly what you want and having a burning desire to possess it.",
     archetypeWeights: { auteur: 3, system_builder: 3, sovereign_will: 2, oracle: 1 }
   },
   {
     lawNumber: 3,
     lawName: "Self-Confidence",
     question: "How strongly do you believe in yourself and your ability to achieve your goals?",
     description: "The mastery of the six basic fears and the development of courage based on definite knowledge.",
     archetypeWeights: { sovereign_will: 3, auteur: 2, creative_muse: 2, anchor: 1 }
   },
   {
     lawNumber: 4,
     lawName: "The Habit of Saving",
     question: "How disciplined are you in systematically saving and building resources for your future?",
     description: "The systematic accumulation of money and resources as a source of personal power.",
     archetypeWeights: { system_builder: 3, anchor: 3, oracle: 2, law_keeper: 1 }
   },
   {
     lawNumber: 5,
     lawName: "Initiative and Leadership",
     question: "How often do you take the lead and act without being told what to do?",
     description: "The quality of doing what needs to be done without being told - the mark of a true leader.",
     archetypeWeights: { auteur: 3, sovereign_will: 3, sentinel: 2, system_builder: 1 }
   },
   {
     lawNumber: 6,
     lawName: "Imagination",
     question: "How actively do you use your imagination to create new ideas and solve problems?",
     description: "The workshop of the mind where all plans are created and all ideas are born.",
     archetypeWeights: { creative_muse: 3, oracle: 2, auteur: 2, blank_canvas: 2 }
   },
   {
     lawNumber: 7,
     lawName: "Enthusiasm",
     question: "How much genuine enthusiasm do you bring to your work and daily activities?",
     description: "The vital force that transmits your thoughts to others and inspires action.",
     archetypeWeights: { creative_muse: 3, sovereign_will: 2, analyst: 2, auteur: 1 }
   },
   {
     lawNumber: 8,
     lawName: "Self-Control",
     question: "How well do you control your emotions, impulses, and reactions?",
     description: "The balance wheel that directs your enthusiasm and controls your thoughts.",
     archetypeWeights: { blank_canvas: 3, system_builder: 2, sovereign_will: 2, oracle: 2 }
   },
   {
     lawNumber: 9,
     lawName: "The Habit of Doing More Than Paid For",
     question: "How often do you go the extra mile and give more than what's expected of you?",
     description: "The practice of rendering more and better service than expected.",
     archetypeWeights: { anchor: 3, system_builder: 2, law_keeper: 2, auteur: 1 }
   },
   {
     lawNumber: 10,
     lawName: "A Pleasing Personality",
     question: "How effectively do you adapt your personality to create harmony with others?",
     description: "The sum total of one's qualities that attracts or repels others.",
     archetypeWeights: { analyst: 3, deep_memory: 3, law_keeper: 2, creative_muse: 1 }
   },
   {
     lawNumber: 11,
     lawName: "Accurate Thinking",
     question: "How rigorously do you separate facts from opinions and important facts from unimportant ones?",
     description: "The ability to distinguish facts from fiction and to organize facts into working plans.",
     archetypeWeights: { oracle: 3, sentinel: 3, system_builder: 2, analyst: 1 }
   },
   {
     lawNumber: 12,
     lawName: "Concentration",
     question: "How effectively can you focus your attention on one subject until you master it?",
     description: "The ability to direct all of your mental powers upon one problem until mastered.",
     archetypeWeights: { system_builder: 3, oracle: 2, sovereign_will: 2, deep_memory: 2 }
   },
   {
     lawNumber: 13,
     lawName: "Cooperation",
     question: "How well do you work with others in a spirit of teamwork and mutual benefit?",
     description: "The coordination of effort in a spirit of harmony for the attainment of a common end.",
     archetypeWeights: { analyst: 3, deep_memory: 2, law_keeper: 3, anchor: 1 }
   },
   {
     lawNumber: 14,
     lawName: "Profiting by Failure",
     question: "How effectively do you learn from your mistakes and turn failures into stepping stones?",
     description: "The ability to extract wisdom from every temporary defeat.",
     archetypeWeights: { creative_muse: 3, sentinel: 2, oracle: 2, sovereign_will: 2 }
   },
   {
     lawNumber: 15,
     lawName: "Tolerance",
     question: "How open are you to different ideas, perspectives, and people without prejudice?",
     description: "The open-minded willingness to listen to and consider ideas different from your own.",
     archetypeWeights: { blank_canvas: 3, law_keeper: 2, deep_memory: 2, oracle: 2 }
   },
   {
     lawNumber: 16,
     lawName: "Practicing the Golden Rule",
     question: "How consistently do you treat others as you would wish to be treated?",
     description: "The foundation of all lasting success - doing unto others as you would have them do unto you.",
     archetypeWeights: { law_keeper: 3, deep_memory: 2, blank_canvas: 2, anchor: 2 }
   },
   {
     lawNumber: 17,
     lawName: "The Universal Law (Cosmic Habitforce)",
     question: "How aligned are your daily habits with your highest intentions and goals?",
     description: "The law through which nature fixes all habits and perpetuates all thinking.",
     archetypeWeights: { system_builder: 3, blank_canvas: 2, auteur: 2, deep_memory: 2 }
   }
 ];
 
 const RATING_OPTIONS = [
   { value: 0, label: "0%", description: "Not at all" },
   { value: 25, label: "25%", description: "Rarely" },
   { value: 50, label: "50%", description: "Sometimes" },
   { value: 75, label: "75%", description: "Often" },
   { value: 100, label: "100%", description: "Consistently" }
 ];
 
 interface NapoleonHillSelfAnalysisProps {
   onComplete: (archetype: Archetype, scores: Record<string, number>, lawScores: Record<number, number>) => void;
   onClose: () => void;
 }
 
 export function NapoleonHillSelfAnalysis({ onComplete, onClose }: NapoleonHillSelfAnalysisProps) {
   const [currentLaw, setCurrentLaw] = useState(0);
   const [lawScores, setLawScores] = useState<Record<number, number>>({});
   const [selectedRating, setSelectedRating] = useState<number | null>(null);
 
   const law = NAPOLEON_HILL_17_LAWS[currentLaw];
   const progress = ((currentLaw + 1) / NAPOLEON_HILL_17_LAWS.length) * 100;
   const hasAnswered = lawScores[law.lawNumber] !== undefined;
 
   const handleRatingSelect = (rating: number) => {
     setSelectedRating(rating);
   };
 
   const handleNext = () => {
     if (selectedRating === null) return;
 
     // Save the score
     const newLawScores = { ...lawScores, [law.lawNumber]: selectedRating };
     setLawScores(newLawScores);
 
     if (currentLaw < NAPOLEON_HILL_17_LAWS.length - 1) {
       // Move to next question
       setCurrentLaw(prev => prev + 1);
       // Pre-fill if already answered
       const nextLaw = NAPOLEON_HILL_17_LAWS[currentLaw + 1];
       setSelectedRating(newLawScores[nextLaw.lawNumber] ?? null);
     } else {
       // Calculate archetype scores from law scores
       const archetypeScores: Record<string, number> = {};
 
       NAPOLEON_HILL_17_LAWS.forEach(lawItem => {
         const userScore = newLawScores[lawItem.lawNumber] || 0;
         Object.entries(lawItem.archetypeWeights).forEach(([archetype, weight]) => {
           const contribution = (userScore / 100) * weight;
           archetypeScores[archetype] = (archetypeScores[archetype] || 0) + contribution;
         });
       });
 
       // Find winning archetype
       const sortedArchetypes = Object.entries(archetypeScores)
         .sort((a, b) => b[1] - a[1]);
 
       const winningArchetypeId = sortedArchetypes[0]?.[0];
       const winningArchetype = ARCHETYPES.find(a => a.id === winningArchetypeId);
 
       if (winningArchetype) {
         // Normalize scores for display (0-100 range based on max possible)
         const maxPossible = Math.max(...Object.values(archetypeScores));
         const normalizedScores: Record<string, number> = {};
         Object.entries(archetypeScores).forEach(([key, value]) => {
           normalizedScores[key] = Math.round((value / maxPossible) * 100);
         });
 
         onComplete(winningArchetype, normalizedScores, newLawScores);
       }
     }
   };
 
   const goBack = () => {
     if (currentLaw > 0) {
       const prevLaw = NAPOLEON_HILL_17_LAWS[currentLaw - 1];
       setCurrentLaw(prev => prev - 1);
       setSelectedRating(lawScores[prevLaw.lawNumber] ?? null);
     }
   };
 
   // Load existing answer when navigating
   const currentSavedRating = lawScores[law.lawNumber];
   const displayRating = selectedRating ?? currentSavedRating ?? null;
 
   return (
     <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
       <div className="min-h-screen flex items-center justify-center p-4">
         <Card className="w-full max-w-2xl glass-card cinematic-border">
           <CardHeader className="text-center space-y-4">
             <Button
               variant="ghost"
               size="icon"
               onClick={onClose}
               className="absolute top-4 right-4"
             >
               <X className="h-4 w-4" />
             </Button>
             <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-gold/20 flex items-center justify-center mx-auto">
               <BookOpen className="w-8 h-8 text-gold" />
             </div>
             <div>
               <CardTitle className="text-2xl font-display tracking-wide text-gold-gradient">
                 Napoleon Hill Self-Analysis
               </CardTitle>
               <p className="text-sm text-muted-foreground mt-1">
                 Rate yourself on the 17 Laws of Success
               </p>
             </div>
             <Progress value={progress} className="h-2" />
             <p className="text-xs text-muted-foreground">
               Law {currentLaw + 1} of {NAPOLEON_HILL_17_LAWS.length}
             </p>
           </CardHeader>
 
           <CardContent className="space-y-6">
             {/* Law Header */}
             <div className="text-center space-y-2">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20">
                 <span className="text-gold font-display text-sm">Law {law.lawNumber}</span>
                 <span className="text-gold/60">•</span>
                 <span className="text-gold/80 text-sm">{law.lawName}</span>
               </div>
             </div>
 
             {/* Question */}
             <div className="space-y-3">
               <h3 className="text-lg font-medium text-center leading-relaxed px-2">
                 {law.question}
               </h3>
               <p className="text-sm text-muted-foreground text-center italic px-4">
                 "{law.description}"
               </p>
             </div>
 
             {/* Rating Scale */}
             <div className="pt-4">
               <RadioGroup
                 value={displayRating?.toString() ?? ""}
                 onValueChange={(value) => handleRatingSelect(parseInt(value))}
                 className="grid grid-cols-5 gap-2"
               >
                 {RATING_OPTIONS.map((option) => (
                   <div key={option.value} className="relative">
                     <RadioGroupItem
                       value={option.value.toString()}
                       id={`rating-${option.value}`}
                       className="peer sr-only"
                     />
                     <Label
                       htmlFor={`rating-${option.value}`}
                       className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all
                         ${displayRating === option.value
                           ? 'border-gold bg-gold/10 text-gold'
                           : 'border-border/50 bg-muted/30 hover:border-gold/50 hover:bg-gold/5'
                         }`}
                     >
                       <span className="text-lg font-bold">{option.label}</span>
                       <span className="text-[10px] text-muted-foreground mt-1">{option.description}</span>
                     </Label>
                   </div>
                 ))}
               </RadioGroup>
             </div>
 
             {/* Progress indicator for all laws */}
             <div className="flex flex-wrap justify-center gap-1 pt-2">
               {NAPOLEON_HILL_17_LAWS.map((_, index) => (
                 <div
                   key={index}
                   className={`w-3 h-3 rounded-full transition-all ${
                     lawScores[index + 1] !== undefined
                       ? 'bg-gold'
                       : index === currentLaw
                       ? 'bg-gold/50 ring-2 ring-gold/30'
                       : 'bg-muted'
                   }`}
                 />
               ))}
             </div>
 
             {/* Navigation */}
             <div className="flex justify-between pt-4">
               <Button
                 variant="ghost"
                 onClick={goBack}
                 disabled={currentLaw === 0}
                 className="gap-2"
               >
                 <ChevronLeft className="h-4 w-4" />
                 Back
               </Button>
 
               <Button variant="ghost" onClick={onClose}>
                 Exit
               </Button>
 
               <Button
                 variant="gold"
                 onClick={handleNext}
                 disabled={displayRating === null}
                 className="gap-2"
               >
                 {currentLaw === NAPOLEON_HILL_17_LAWS.length - 1 ? (
                   <>
                     <CheckCircle2 className="h-4 w-4" />
                     Complete
                   </>
                 ) : (
                   <>
                     Next
                     <ChevronRight className="h-4 w-4" />
                   </>
                 )}
               </Button>
             </div>
 
             <p className="text-xs text-muted-foreground text-center">
               Rate yourself honestly — this analysis determines your Director archetype.
             </p>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }