import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Sparkles, User } from "lucide-react";
import { ARCHETYPES, Archetype } from "./archetypes";

interface SurveyQuestion {
  id: string;
  question: string;
  category: string;
  options: {
    text: string;
    archetypeScores: Record<string, number>;
  }[];
}

const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "q1",
    question: "When facing a crisis, what's your first instinct?",
    category: "Response Pattern",
    options: [
      { text: "Stay calm and help others stabilize", archetypeScores: { still_center: 3, protector: 1 } },
      { text: "Take charge and direct the response", archetypeScores: { sovereign: 3, master_builder: 1 } },
      { text: "Analyze what went wrong and find the truth", archetypeScores: { truth_keeper: 3, divine_analyst: 2 } },
      { text: "Rally people together for collective action", archetypeScores: { weaver: 3, harmonizer: 1 } }
    ]
  },
  {
    id: "q2",
    question: "How do you typically approach a major decision?",
    category: "Decision Making",
    options: [
      { text: "Weigh all options carefully until I'm certain", archetypeScores: { divine_analyst: 3, sacred_judge: 1 } },
      { text: "Trust my gut and commit quickly", archetypeScores: { sovereign: 2, alchemist: 2 } },
      { text: "Consider how it affects others around me", archetypeScores: { harmonizer: 3, still_center: 1 } },
      { text: "Look for the path with the most meaning", archetypeScores: { wayfinder: 3, truth_keeper: 1 } }
    ]
  },
  {
    id: "q3",
    question: "What's your biggest fear in relationships?",
    category: "Vulnerability",
    options: [
      { text: "Being seen as weak or incompetent", archetypeScores: { sovereign: 2, protector: 2 } },
      { text: "Being abandoned or forgotten", archetypeScores: { weaver: 3, harmonizer: 1 } },
      { text: "Losing my independence or being trapped", archetypeScores: { wayfinder: 3, alchemist: 1 } },
      { text: "Not being understood at my core", archetypeScores: { still_center: 2, divine_analyst: 2 } }
    ]
  },
  {
    id: "q4",
    question: "When someone wrongs you, what do you feel first?",
    category: "Emotional Response",
    options: [
      { text: "A need to understand why they did it", archetypeScores: { divine_analyst: 3, truth_keeper: 1 } },
      { text: "A drive to set things right and fair", archetypeScores: { sacred_judge: 3, sovereign: 1 } },
      { text: "Protection instincts for myself and others", archetypeScores: { protector: 3, still_center: 1 } },
      { text: "I tend to transform pain into growth", archetypeScores: { alchemist: 3, wayfinder: 1 } }
    ]
  },
  {
    id: "q5",
    question: "What energizes you the most?",
    category: "Energy Source",
    options: [
      { text: "Creating order from chaos", archetypeScores: { master_builder: 3, sovereign: 1 } },
      { text: "Deep, meaningful conversations", archetypeScores: { still_center: 2, truth_keeper: 2 } },
      { text: "Bringing people together for a cause", archetypeScores: { weaver: 3, harmonizer: 1 } },
      { text: "Exploring new ideas and possibilities", archetypeScores: { wayfinder: 3, divine_analyst: 1 } }
    ]
  },
  {
    id: "q6",
    question: "What's your relationship with rules and systems?",
    category: "Structure",
    options: [
      { text: "I create and enforce them for everyone's good", archetypeScores: { sovereign: 2, sacred_judge: 2 } },
      { text: "I optimize and improve them", archetypeScores: { master_builder: 3, divine_analyst: 1 } },
      { text: "I follow them when they're fair", archetypeScores: { sacred_judge: 2, truth_keeper: 2 } },
      { text: "I question and transcend them", archetypeScores: { alchemist: 2, wayfinder: 2 } }
    ]
  },
  {
    id: "q7",
    question: "How do you handle conflict?",
    category: "Conflict Style",
    options: [
      { text: "I try to find common ground", archetypeScores: { harmonizer: 3, still_center: 1 } },
      { text: "I address it directly and decisively", archetypeScores: { sovereign: 2, truth_keeper: 2 } },
      { text: "I protect those who can't protect themselves", archetypeScores: { protector: 3, sacred_judge: 1 } },
      { text: "I use it as fuel for transformation", archetypeScores: { alchemist: 3, wayfinder: 1 } }
    ]
  },
  {
    id: "q8",
    question: "What do others most often come to you for?",
    category: "Social Role",
    options: [
      { text: "Emotional support and a calm presence", archetypeScores: { still_center: 3, harmonizer: 1 } },
      { text: "Leadership and direction", archetypeScores: { sovereign: 3, master_builder: 1 } },
      { text: "Honest feedback and truth-telling", archetypeScores: { truth_keeper: 3, sacred_judge: 1 } },
      { text: "Connections and introductions", archetypeScores: { weaver: 3, divine_analyst: 1 } }
    ]
  },
  {
    id: "q9",
    question: "What's your biggest personal struggle?",
    category: "Shadow",
    options: [
      { text: "Taking on too much responsibility", archetypeScores: { sovereign: 2, still_center: 2 } },
      { text: "Analysis paralysis and overthinking", archetypeScores: { divine_analyst: 3, wayfinder: 1 } },
      { text: "Intensity and self-destructive patterns", archetypeScores: { alchemist: 3, protector: 1 } },
      { text: "Caring too much what others think", archetypeScores: { harmonizer: 2, weaver: 2 } }
    ]
  },
  {
    id: "q10",
    question: "What legacy do you want to leave?",
    category: "Purpose",
    options: [
      { text: "Systems and structures that outlast me", archetypeScores: { master_builder: 3, sovereign: 1 } },
      { text: "Truth and justice revealed", archetypeScores: { truth_keeper: 2, sacred_judge: 2 } },
      { text: "Transformed lives and communities", archetypeScores: { alchemist: 2, wayfinder: 2 } },
      { text: "Bridges built between people", archetypeScores: { weaver: 2, harmonizer: 2 } }
    ]
  }
];

interface CharacterSurveyProps {
  onComplete: (archetype: Archetype, scores: Record<string, number>, responses: Record<string, string>) => void;
  onClose: () => void;
}

export function CharacterSurvey({ onComplete, onClose }: CharacterSurveyProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});

  const question = SURVEY_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / SURVEY_QUESTIONS.length) * 100;

  const handleAnswer = (optionIndex: number) => {
    const option = question.options[optionIndex];
    
    // Update responses
    setResponses(prev => ({
      ...prev,
      [question.id]: option.text
    }));

    // Update archetype scores
    const newScores = { ...scores };
    Object.entries(option.archetypeScores).forEach(([archetype, score]) => {
      newScores[archetype] = (newScores[archetype] || 0) + score;
    });
    setScores(newScores);

    // Move to next question or complete
    if (currentQuestion < SURVEY_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Calculate winner
      const sortedArchetypes = Object.entries(newScores)
        .sort((a, b) => b[1] - a[1]);
      
      const winningArchetypeId = sortedArchetypes[0]?.[0];
      const winningArchetype = ARCHETYPES.find(a => a.id === winningArchetypeId);
      
      if (winningArchetype) {
        onComplete(winningArchetype, newScores, responses);
      }
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl glass-card cinematic-border">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-gold" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display tracking-wide text-gold-gradient">
                Character Central
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Discover your Director archetype
              </p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Question {currentQuestion + 1} of {SURVEY_QUESTIONS.length}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Category Tag */}
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {question.category}
              </span>
            </div>

            {/* Question */}
            <h3 className="text-xl font-medium text-center leading-relaxed">
              {question.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/50 transition-all text-left group"
                >
                  <span className="text-sm group-hover:text-primary transition-colors">
                    {option.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={currentQuestion === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Exit Survey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
