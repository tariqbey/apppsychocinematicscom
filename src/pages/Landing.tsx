import { Button } from "@/components/ui/button";
import { 
  Film, 
  Sparkles, 
  Target, 
  BarChart3, 
  Scissors, 
  Trophy,
  Play,
  Eye,
  TrendingUp,
  Mic,
  Video,
  Brain,
  Clock,
  Users,
  Zap,
  Check,
  Star
} from "lucide-react";
import logo from "@/assets/psycho-cinematics-logo.png";

interface LandingProps {
  onOpenAuth: () => void;
}

const Landing = ({ onOpenAuth }: LandingProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Film Grain Overlay */}
      <div className="film-grain pointer-events-none fixed inset-0 z-50" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        {/* Spotlight Effect */}
        <div className="absolute inset-0 spotlight opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[120px]" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Logo */}
          <img 
            src={logo} 
            alt="Psycho-Cinematics" 
            className="w-64 md:w-80 mx-auto mb-8 animate-fade-in"
          />
          
          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wide text-gold-gradient animate-slide-up">
            DIRECT THE MOVIE<br />OF YOUR LIFE
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            The AI-powered identity transformation system for entrepreneurs and high-achievers ready to become the lead character in their own success story.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="xl" 
              variant="gold"
              onClick={onOpenAuth}
              className="text-lg px-8 gap-2"
            >
              <Play className="w-5 h-5" />
              Start Your 7-Day Free Trial
            </Button>
            <Button 
              size="xl" 
              variant="outline"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8"
            >
              See How It Works
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.6s' }}>
            Then just $29/month • Cancel anytime
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gold/30 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-gold rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="font-display text-4xl md:text-5xl text-gold-gradient">
            YOU'RE NOT JUST LIVING LIFE.<br />YOU'RE DIRECTING IT.
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Based on the groundbreaking work of Maxwell Maltz and Napoleon Hill, Psycho-Cinematics™ harnesses a profound truth: 
            <span className="text-foreground font-medium"> your nervous system cannot distinguish between a vividly imagined experience and a real one.</span>
          </p>

          <div className="grid md:grid-cols-3 gap-8 pt-12">
            {[
              { icon: Film, title: "The Director", desc: "Your conscious mind that shapes the vision and calls the shots" },
              { icon: Star, title: "The Lead Actor", desc: "Your body and behaviors bringing the script to life daily" },
              { icon: Zap, title: "Production Company", desc: "Your subconscious mind providing the resources and execution" }
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 space-y-4 group hover:border-gold/30 transition-colors">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto group-hover:bg-gold/20 transition-colors">
                  <item.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-display text-2xl text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7-Phase Framework */}
      <section className="relative py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-gold-gradient mb-4">
              THE 7-PHASE FRAMEWORK
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A systematic approach to identity transformation, mapped to real film production phases.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              { phase: 1, title: "PRE-PRODUCTION", desc: "Engineer your Director Character identity", icon: Brain },
              { phase: 2, title: "PRODUCTION", desc: "Create your AI-powered Mind Movie", icon: Video },
              { phase: 3, title: "POST-PRODUCTION", desc: "Polish for maximum emotional impact", icon: Sparkles },
              { phase: 4, title: "DISTRIBUTION", desc: "Daily immersive viewing protocol", icon: Eye },
              { phase: 5, title: "PERFORMANCE", desc: "Live as your highest self", icon: Play },
              { phase: 6, title: "SCORING", desc: "Daily Director Scorecard tracking", icon: BarChart3 },
              { phase: 7, title: "EDITING", desc: "Evolve your vision as you grow", icon: Scissors }
            ].map((item) => (
              <div 
                key={item.phase} 
                className="glass-card p-6 flex items-center gap-6 group hover:border-gold/30 transition-all hover:translate-x-2"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center font-display text-2xl text-gold group-hover:bg-gold group-hover:text-background transition-colors">
                  {item.phase}
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
                <item.icon className="w-6 h-6 text-gold/50 group-hover:text-gold transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-gold-gradient mb-4">
              YOUR DIRECTOR'S TOOLKIT
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to write, direct, and star in an Oscar-worthy life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: Mic, 
                title: "Director AI Coach", 
                desc: "Your personal Script Doctor available 24/7 with voice conversations. Get real-time coaching on living your character." 
              },
              { 
                icon: Video, 
                title: "Mind Movie Studio", 
                desc: "AI-generated images and videos to visualize your future self. Create cinema-quality mental rehearsal content." 
              },
              { 
                icon: Target, 
                title: "Definite Chief Aim Wizard", 
                desc: "Craft your burning desire with AI-guided precision. Define your Final Scene with clarity and conviction." 
              },
              { 
                icon: BarChart3, 
                title: "Daily Scorecard", 
                desc: "Track identity alignment, behavior execution, emotional regulation, and forward progress. Measure what matters." 
              },
              { 
                icon: Scissors, 
                title: "The CUT! Technique", 
                desc: "Instant mental reset when you go off-script. Reclaim your Director's chair in seconds." 
              },
              { 
                icon: Trophy, 
                title: "Gamification System", 
                desc: "Earn credits, unlock badges, climb the leaderboard. Make transformation feel like winning." 
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="glass-card p-8 space-y-4 group hover:border-gold/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-display text-2xl text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-24 px-6 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-gold-gradient mb-4">
              HOW IT WORKS
            </h2>
            <p className="text-muted-foreground text-lg">
              Five steps to becoming the director of your destiny.
            </p>
          </div>

          <div className="space-y-12">
            {[
              { step: 1, title: "Define Your Final Scene", desc: "Use the Chief Aim Wizard to crystallize your burning desire. What does your ideal life look like? Feel like? Sound like?", icon: Target },
              { step: 2, title: "Create Your Mind Movie", desc: "Our AI studio generates personalized images and videos of your future self. See yourself living your dream.", icon: Video },
              { step: 3, title: "Watch Daily", desc: "Each morning, step into your private theater. Immerse yourself in your Mind Movie for deep neural reprogramming.", icon: Eye },
              { step: 4, title: "Live the Script", desc: "Carry your Director Character into every meeting, decision, and interaction. Your new identity becomes second nature.", icon: Play },
              { step: 5, title: "Score & Evolve", desc: "Track your progress with the Daily Scorecard. Refine your movie as you grow. Level up continuously.", icon: TrendingUp }
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold/50 flex items-center justify-center font-display text-3xl text-background shadow-lg shadow-gold/20">
                  {item.step}
                </div>
                <div className="pt-2">
                  <h3 className="font-display text-2xl text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-gold-gradient mb-4">
              DIRECTORS IN ACTION
            </h2>
            <p className="text-muted-foreground text-lg">
              Join thousands rewriting their success stories.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "I finally stopped watching my life happen and started directing it. My income doubled in 6 months.", name: "Sarah K.", role: "Tech Founder" },
              { quote: "The Daily Scorecard changed everything. I went from scattered to laser-focused on my Chief Aim.", name: "Marcus T.", role: "Executive Coach" },
              { quote: "Director AI feels like having Tony Robbins in my pocket. The voice coaching is absolutely game-changing.", name: "Elena R.", role: "Entrepreneur" }
            ].map((testimonial, i) => (
              <div key={i} className="glass-card p-8 space-y-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-foreground italic leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <p className="font-display text-lg text-foreground">{testimonial.name}</p>
                  <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-24 px-6 bg-card/30">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl text-gold-gradient mb-4">
              SIMPLE PRICING
            </h2>
            <p className="text-muted-foreground text-lg">
              One plan. Everything included. No hidden fees.
            </p>
          </div>

          <div className="glass-card p-8 md:p-10 border-gold/20 relative overflow-hidden">
            {/* Badge */}
            <div className="absolute top-4 right-4 bg-gold text-background px-3 py-1 rounded-full text-sm font-medium">
              7-Day Free Trial
            </div>

            <div className="text-center mb-8">
              <div className="font-display text-6xl md:text-7xl text-gold">$29</div>
              <div className="text-muted-foreground">per month</div>
            </div>

            <div className="space-y-4 mb-8">
              {[
                "Unlimited Director AI conversations",
                "Full AI Media Studio access",
                "Daily Scorecard tracking",
                "Chief Aim Wizard",
                "Mind Movie Theater",
                "Gamification & Leaderboards",
                "Director's Corner Community"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <Button 
              size="xl" 
              variant="gold" 
              className="w-full text-lg"
              onClick={onOpenAuth}
            >
              Start Your Free Trial
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              No credit card required to start
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 spotlight opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-display text-4xl md:text-6xl text-gold-gradient">
            YOUR BEST LIFE IS A MOVIE<br />WAITING TO BE MADE
          </h2>
          
          <p className="text-xl text-muted-foreground">
            Stop being an extra in someone else's story. Take the director's chair.
          </p>

          <Button 
            size="xl" 
            variant="gold"
            onClick={onOpenAuth}
            className="text-xl px-12 py-8 gap-3"
          >
            <Film className="w-6 h-6" />
            Enter the Studio
          </Button>

          <p className="text-sm text-muted-foreground">
            7-day free trial • Then $29/month • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logo} alt="Psycho-Cinematics" className="h-10 opacity-70" />
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>© 2026 Psycho-Cinematics™</span>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
