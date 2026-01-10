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
  Check
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
    tip: "This quick tour will show you the 4 key steps to get started."
  },
  {
    id: "chief-aim",
    icon: <Target className="w-12 h-12" />,
    title: "Step 1: Define Your Chief Aim",
    description: "Your Definite Chief Aim is the foundation of everything. It's a crystal-clear statement of what you want, when you'll achieve it, what you'll give in exchange, and your plan.",
    tip: "Click the Chief Aim card on your dashboard to launch the AI-guided wizard."
  },
  {
    id: "edit-bay",
    icon: <Palette className="w-12 h-12" />,
    title: "Step 2: Visualize in the Edit Bay",
    description: "Use AI to generate powerful images and videos of your future self. Upload a reference photo to see yourself living your goals.",
    tip: "Start with images, then animate your best ones into videos."
  },
  {
    id: "mind-movie",
    icon: <Film className="w-12 h-12" />,
    title: "Step 3: Create Your Mind Movie",
    description: "Build a personalized visualization video with AI-generated scenes and a custom soundtrack. Watch it daily to reprogram your subconscious.",
    tip: "Aim for a 90-day viewing streak for maximum transformation."
  },
  {
    id: "daily-ritual",
    icon: <Calendar className="w-12 h-12" />,
    title: "Step 4: Daily Rituals",
    description: "Each morning, read your Chief Aim, watch your Mind Movie, and set your Three Things. Each evening, complete your Director Scorecard.",
    tip: "Consistency is the key. Small daily actions compound into massive change."
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