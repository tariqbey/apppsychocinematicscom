import { useState, useEffect } from "react";
import { 
  Target, 
  Palette, 
  Film, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  X,
  Check,
  Music,
  Radio,
  UserPlus
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface OnboardingStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tip: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    icon: <Sparkles className="w-12 h-12" />,
    title: "Welcome, Director!",
    description: "You're about to embark on a transformational journey. Psycho-Cinematics™ treats your life as a movie where YOU are both the Director and the star.",
    tip: "Everything starts with ONE thing: Your Definite Chief Aim. Let's get you set up."
  },
  {
    id: "chief-aim",
    icon: <Target className="w-12 h-12" />,
    title: "⭐ First: Your Definite Chief Aim",
    description: "This is THE FOUNDATION of everything. Your Definite Chief Aim is a crystal-clear statement of what you want, when you'll achieve it, what you'll give in exchange, and your plan. Nothing else works without this.",
    tip: "Click the gold 'Start Here: Definite Chief Aim' card on your dashboard. The AI will guide you through Napoleon Hill's proven 4-phase framework."
  },
  {
    id: "hero-character",
    icon: <UserPlus className="w-12 h-12" />,
    title: "Step 2: Create Your Hero Character",
    description: "Upload a reference photo and describe your 'best self' — height, weight, build, and features. AI generates hero images (front, side, back) that become YOUR identity in all visualizations.",
    tip: "Go to Character Builder → Create tab. These hero images are used everywhere: Mind Movies, Challenge Storyboards, and more."
  },
  {
    id: "mind-movie",
    icon: <Film className="w-12 h-12" />,
    title: "Step 3: Create Your Mind Movie",
    description: "Bring your Chief Aim to life with AI-generated scenes and a custom soundtrack. Your Mind Movie is the visual representation of your goals that you'll watch daily.",
    tip: "The Mind Movie Wizard uses your Chief Aim and Hero Character to auto-generate scenes featuring YOU."
  },
  {
    id: "edit-bay",
    icon: <Palette className="w-12 h-12" />,
    title: "Step 4: The AI Studio",
    description: "Generate powerful images and videos of your future self using AI. Your hero character images ensure visual consistency across all generated content.",
    tip: "Use the Edit Bay for additional AI generations, Timeline Editor for video assembly, and Voice Changer for narration."
  },
  {
    id: "soundtrack",
    icon: <Music className="w-12 h-12" />,
    title: "Step 5: Your Soundtrack",
    description: "Create AI-powered custom soundtracks for your Mind Movie with 50+ genres. The music carries your Chief Aim's message deep into your subconscious.",
    tip: "Your Chief Aim can become song lyrics that play in your Mind Movie!"
  },
  {
    id: "daily-ritual",
    icon: <Calendar className="w-12 h-12" />,
    title: "Step 6: Daily Rituals",
    description: "Each morning, read your Chief Aim, watch your Mind Movie, and set your Three Things. Each evening, complete your Director Scorecard. Consistency compounds.",
    tip: "A 90-day viewing streak creates permanent neural pathways for your new identity."
  }
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingModal = ({ isOpen, onClose, onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = onboardingSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-gold/30 bg-background">
        {/* Header with progress */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {totalSteps}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={handleSkip}
            >
              Skip tour
            </Button>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          {/* Icon */}
          <div className={`w-24 h-24 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
            currentStep === 0 
              ? 'bg-gradient-to-br from-gold to-amber-soft text-primary-foreground' 
              : 'bg-gold/10 text-gold'
          }`}>
            {step.icon}
          </div>

          {/* Title */}
          <h2 className="font-display text-2xl md:text-3xl text-gold-gradient mb-4">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
            {step.description}
          </p>

          {/* Tip */}
          <div className="p-4 rounded-xl bg-gold/5 border border-gold/20 max-w-md mx-auto">
            <p className="text-sm text-gold flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
              {step.tip}
            </p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {onboardingSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'w-8 bg-gold' 
                  : index < currentStep 
                    ? 'bg-gold/50' 
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            variant="gold"
            onClick={handleNext}
            className="gap-2 min-w-[140px]"
          >
            {isLastStep ? (
              <>
                <Check className="w-4 h-4" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to manage onboarding state
export const useOnboarding = (userId: string | undefined) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const storageKey = userId ? `onboarding_complete_${userId}` : null;

  useEffect(() => {
    if (!storageKey) return;
    
    // Check if user has completed onboarding
    const hasCompleted = localStorage.getItem(storageKey);
    if (!hasCompleted) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const completeOnboarding = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    setShowOnboarding(false);
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  return {
    showOnboarding,
    completeOnboarding,
    closeOnboarding,
    resetOnboarding
  };
};