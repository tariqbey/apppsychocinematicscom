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
  UserPlus,
  Bell,
  BellRing,
  Loader2
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface OnboardingStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tip: string;
  action?: "enable-notifications";
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
    id: "notifications",
    icon: <Bell className="w-12 h-12" />,
    title: "🔔 Stay on Script",
    description: "Enable push notifications to receive daily reminders for your morning ritual, journaling prompts, and evening scorecard. Directors who use reminders are 3x more likely to build lasting habits.",
    tip: "You'll get gentle nudges to watch your Mind Movie, complete your Three Things, and stay in character. If notifications stop working, use 'Repair Push' in Settings.",
    action: "enable-notifications"
  },
  {
    id: "chief-aim",
    icon: <Target className="w-12 h-12" />,
    title: "⭐ Your Definite Chief Aim",
    description: "This is THE FOUNDATION of everything. Your Definite Chief Aim is a crystal-clear statement of what you want, when you'll achieve it, what you'll give in exchange, and your plan. Nothing else works without this.",
    tip: "Click the animated gold 'Definite Chief Aim' module on your dashboard. The AI will guide you through Napoleon Hill's proven 4-phase framework."
  },
  {
    id: "character-builder",
    icon: <UserPlus className="w-12 h-12" />,
    title: "Character Builder",
    description: "Discover your Director archetype with our 28-question survey, then create your Hero Character — AI generates front, side, and back views that become YOUR identity in all visualizations.",
    tip: "Your Character Builder is Step 2 on the dashboard. Hero images appear in Mind Movies, Challenge Storyboards, and all AI-generated content."
  },
  {
    id: "soundtrack",
    icon: <Music className="w-12 h-12" />,
    title: "Soundtrack Studio",
    description: "Create custom AI-generated soundtracks in 50+ genres with lyrics based on your Chief Aim. Your soundtrack becomes the audio identity of your transformation.",
    tip: "Access Soundtrack Studio from the dashboard. Generate motivational tracks or tune into Director Radio for curated playlists."
  },
  {
    id: "storyboard",
    icon: <Film className="w-12 h-12" />,
    title: "Storyboard & Mind Movie",
    description: "The Mind Movie Wizard creates AI-generated scenes featuring YOU. Upload reference photos and watch as AI visualizes your Chief Aim in cinematic quality.",
    tip: "Use the 5-step wizard to go from vision to finished Mind Movie. Your storyboard becomes the visual script of your transformation."
  },
  {
    id: "edit-bay",
    icon: <Palette className="w-12 h-12" />,
    title: "Edit Bay & Timeline",
    description: "A full AI production studio: generate images and videos, edit in the Timeline Editor with multi-track support, and export in up to 4K quality.",
    tip: "Open the Edit Bay for AI generation, then use the Timeline tab for professional editing with razor cuts, audio fades, and VU meters."
  },
  {
    id: "daily-ritual",
    icon: <Calendar className="w-12 h-12" />,
    title: "Daily Rituals & Score",
    description: "Each morning, read your Chief Aim and watch your Mind Movie. Each evening, complete your Director Scorecard. Your Daily Rituals section tracks all four steps.",
    tip: "A 90-day viewing streak creates permanent neural pathways for your new identity. Track progress with the animated ritual checklist."
  }
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingModal = ({ isOpen, onClose, onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { isSubscribed, subscribe } = usePushNotifications();
  
  const totalSteps = onboardingSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  const isNotificationStep = step.action === "enable-notifications";

  const handleEnableNotifications = async () => {
    setIsEnablingNotifications(true);
    try {
      await subscribe();
      // Auto-advance after enabling
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 500);
    } finally {
      setIsEnablingNotifications(false);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(); // Completing the full tour always saves
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
    // Only persist if user checked "Don't show again"
    if (dontShowAgain) {
      onComplete();
    } else {
      onClose(); // Just close - will show again next time
    }
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
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs text-muted-foreground">Don't show again</span>
              </label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={handleSkip}
              >
                Skip tour
              </Button>
            </div>
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

          {/* Special button for notification step */}
          {isNotificationStep ? (
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <Button
                  variant="gold"
                  onClick={handleNext}
                  className="gap-2 min-w-[140px]"
                >
                  <BellRing className="w-4 h-4" />
                  Enabled! Continue
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    className="text-muted-foreground"
                  >
                    Skip
                  </Button>
                  <Button
                    variant="gold"
                    onClick={handleEnableNotifications}
                    disabled={isEnablingNotifications}
                    className="gap-2 min-w-[160px]"
                  >
                    {isEnablingNotifications ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                    Enable Notifications
                  </Button>
                </>
              )}
            </div>
          ) : (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to manage onboarding state
export const useOnboarding = (userId: string | undefined) => {
  const storageKey = userId ? `onboarding_complete_${userId}` : null;
  
  // Check localStorage synchronously for initial state
  const getInitialState = (): boolean => {
    if (!storageKey) return false;
    try {
      const hasCompleted = localStorage.getItem(storageKey);
      return hasCompleted !== 'true'; // Show if NOT completed
    } catch {
      return false; // Don't show if localStorage fails
    }
  };

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!storageKey) {
      setIsReady(true);
      return;
    }
    
    // Small delay to let the page render first, then check and show
    const timer = setTimeout(() => {
      try {
        const hasCompleted = localStorage.getItem(storageKey);
        if (hasCompleted !== 'true') {
          setShowOnboarding(true);
        }
      } catch (e) {
        console.error('Failed to check onboarding state:', e);
      }
      setIsReady(true);
    }, 500); // Reduced delay for faster appearance
    
    return () => clearTimeout(timer);
  }, [storageKey]);

  // Also re-check when userId changes (e.g., after login)
  useEffect(() => {
    if (!storageKey || !isReady) return;
    
    try {
      const hasCompleted = localStorage.getItem(storageKey);
      if (hasCompleted !== 'true') {
        setShowOnboarding(true);
      }
    } catch (e) {
      console.error('Failed to check onboarding state:', e);
    }
  }, [storageKey, isReady]);

  const completeOnboarding = () => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch (e) {
        console.error('Failed to save onboarding state:', e);
      }
    }
    setShowOnboarding(false);
  };

  const closeOnboarding = () => {
    // Just close without saving - will show again next session
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.error('Failed to reset onboarding state:', e);
      }
    }
  };

  return {
    showOnboarding,
    completeOnboarding,
    closeOnboarding,
    resetOnboarding
  };
};