import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Film, 
  Sparkles, 
  Bot, 
  Target, 
  Calendar, 
  Trophy, 
  Users, 
  Play, 
  Check, 
  Star,
  Zap,
  Brain,
  Video,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import psychoCinematicsLogo from "@/assets/psycho-cinematics-logo.png";
import heroImage from "@/assets/hero-image.png";

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage = ({ onLogin }: LandingPageProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const handleGetStarted = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
  };

  const handleLogin = () => {
    setAuthMode("signin");
    setShowAuthModal(true);
  };

  const features = [
    {
      icon: Bot,
      title: "Director AI Coach",
      description: "24/7 AI coaching powered by Napoleon Hill & Maxwell Maltz principles. Voice-enabled conversations that keep you on track."
    },
    {
      icon: Video,
      title: "Mind Movie Studio",
      description: "Create stunning AI-generated images and videos that visualize your future self. Watch your goals come to life."
    },
    {
      icon: Target,
      title: "Chief Aim Wizard",
      description: "Define your Definite Chief Aim with guided AI assistance. Crystal clear vision, measurable milestones."
    },
    {
      icon: Calendar,
      title: "Daily Ritual System",
      description: "Morning visualization, evening reflection. Build the habits that transform your identity."
    },
    {
      icon: Brain,
      title: "Identity Engineering",
      description: "Based on Psycho-Cybernetics™ research. Reprogram your self-image through consistent visualization."
    },
    {
      icon: Trophy,
      title: "Gamification & Streaks",
      description: "Track your progress, earn awards, compete on leaderboards. Make transformation addictive."
    }
  ];

  const phases = [
    { phase: 1, title: "The Director Emerges", description: "Define your Chief Aim & identity" },
    { phase: 2, title: "The Script", description: "Create your Mind Movie storyboard" },
    { phase: 3, title: "Pre-Production", description: "Build your daily ritual system" },
    { phase: 4, title: "Principal Photography", description: "Daily visualization & action" },
    { phase: 5, title: "Post-Production", description: "Refine & optimize your approach" },
    { phase: 6, title: "The Premiere", description: "Celebrate milestones & victories" },
    { phase: 7, title: "The Franchise", description: "Scale your transformation" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={psychoCinematicsLogo} 
              alt="Psycho-Cinematics" 
              className="h-12 w-auto"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleLogin} className="text-muted-foreground hover:text-foreground">
              Login
            </Button>
            <Button variant="gold" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 spotlight opacity-50" />
        <div className="absolute inset-0 film-grain opacity-30" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-sm text-gold">The Director's Operating System</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display tracking-wide leading-tight">
                Direct Your <br />
                <span className="text-gold-gradient">Life's Movie</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                Transform your identity with AI-powered visualization, daily rituals, and the proven 7-Phase Framework. 
                You're the director. It's time to take control.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="gold" size="lg" onClick={handleGetStarted} className="text-lg px-8">
                  <Play className="w-5 h-5 mr-2" />
                  Start Your Journey
                </Button>
                <Button variant="outline" size="lg" onClick={handleLogin} className="text-lg px-8">
                  Already a Director? Login
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/40 to-amber-600/40 border-2 border-background" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">1,000+ Directors</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">5.0</span>
                </div>
              </div>
            </div>
            
            {/* Right Image */}
            <div className="relative animate-slide-up">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent rounded-3xl blur-3xl" />
              <img 
                src={heroImage} 
                alt="Psycho-Cinematics Director" 
                className="relative rounded-3xl shadow-2xl shadow-gold/20 border border-gold/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display tracking-wide mb-4">
              Your Complete <span className="text-gold-gradient">Transformation Toolkit</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to engineer your identity and create the life you've always envisioned.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="glass-card p-8 cinematic-border hover:border-gold/50 transition-all duration-300 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-amber-soft/20 flex items-center justify-center mb-6 group-hover:from-gold/30 group-hover:to-amber-soft/30 transition-all">
                  <feature.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-xl font-display mb-3 group-hover:text-gold transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7-Phase Framework */}
      <section className="py-24 bg-card/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display tracking-wide mb-4">
              The <span className="text-gold-gradient">7-Phase Framework</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A proven system for identity transformation, inspired by the masters of manifestation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((phase, index) => (
              <div 
                key={phase.phase}
                className={`relative glass-card p-6 ${index === 6 ? 'lg:col-span-1 md:col-span-2' : ''}`}
              >
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gold flex items-center justify-center font-display text-lg text-black font-bold">
                  {phase.phase}
                </div>
                <div className="pt-4">
                  <h3 className="text-lg font-display mb-2">{phase.title}</h3>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 relative" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display tracking-wide mb-4">
              Choose Your <span className="text-gold-gradient">Director's Pass</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Invest in your transformation. Cancel anytime.
            </p>
          </div>
          
          <div className="max-w-lg mx-auto">
            {/* Main Plan */}
            <div className="glass-card p-8 cinematic-border border-gold/50 relative overflow-hidden">
              {/* Popular Badge */}
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 rounded-full bg-gold text-black text-sm font-bold flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Most Popular
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-display mb-2">Director's OS</h3>
                <p className="text-muted-foreground">Full access to the transformation suite</p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-display text-gold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">7-day free trial included</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited Director AI Conversations",
                  "20 Monthly Production Credits",
                  "Full Mind Movie Studio Access",
                  "Daily Scorecard & Streak Tracking",
                  "Chief Aim Wizard & Planning Tools",
                  "Mind Movie Theater Experience",
                  "Gamification & Leaderboards",
                  "Director's Corner Community Access"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-gold" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button variant="gold" size="lg" className="w-full text-lg" onClick={handleGetStarted}>
                Start 7-Day Free Trial
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                No credit card required to start. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-display tracking-wide mb-6">
              Ready to Direct Your <span className="text-gold-gradient">Masterpiece</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of directors who are transforming their lives through the power of visualization and daily action.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gold" size="lg" onClick={handleGetStarted} className="text-lg px-8">
                <Film className="w-5 h-5 mr-2" />
                Enter the Studio
              </Button>
              <Button variant="outline" size="lg" onClick={handleLogin} className="text-lg px-8">
                Login to Your Account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src={psychoCinematicsLogo} 
                alt="Psycho-Cinematics" 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Psycho-Cinematics™. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};
