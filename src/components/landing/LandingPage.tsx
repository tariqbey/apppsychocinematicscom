import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Palette,
  Mic,
  Music,
  Scissors,
  Upload,
  MessageSquare,
  Share2,
  Award,
  Clock,
  Layers,
  Wand2,
  Quote,
  HelpCircle,
  ChevronDown,
  Volume2
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { TestimonialCard } from "@/components/testimonials/TestimonialCard";
import { supabase } from "@/integrations/supabase/client";
import psychoCinematicsLogo from "@/assets/psycho-cinematics-logo.png";
import heroImage from "@/assets/hero-image.png";

interface LandingPageProps {
  onLogin: () => void;
}

interface ApprovedTestimonial {
  id: string;
  testimonial_type: "text" | "audio" | "video";
  text_content: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  display_name: string;
  avatar_url: string | null;
  user_title: string | null;
  result_highlight: string | null;
}

export const LandingPage = ({ onLogin }: LandingPageProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [approvedTestimonials, setApprovedTestimonials] = useState<ApprovedTestimonial[]>([]);
  const navigate = useNavigate();

  // Fetch approved testimonials from database
  useEffect(() => {
    const fetchApprovedTestimonials = async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, testimonial_type, text_content, media_url, thumbnail_url, display_name, avatar_url, user_title, result_highlight")
        .eq("status", "approved")
        .order("submitted_at", { ascending: false })
        .limit(8);

      if (!error && data) {
        // Sort by type priority: video > audio > text
        const sorted = [...data].sort((a, b) => {
          const priority = { video: 0, audio: 1, text: 2 };
          return priority[a.testimonial_type as keyof typeof priority] - priority[b.testimonial_type as keyof typeof priority];
        });
        setApprovedTestimonials(sorted as ApprovedTestimonial[]);
      }
    };
    fetchApprovedTestimonials();
  }, []);

  const handleGetStarted = () => {
    navigate("/signup");
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const features = [
    {
      icon: Target,
      title: "Definite Chief Aim Creator",
      description: "The foundation of everything. AI guides you through Napoleon Hill's proven 4-phase framework: The Dream, The Deadline, The Exchange, The Plan. Crystal-clear vision that drives your entire transformation."
    },
    {
      icon: Video,
      title: "Hollywood-Grade AI Studio",
      description: "Generate stunning videos with Google Veo 3, create AI images with your face using reference photos, transform your voice with 10+ options, and produce custom soundtracks in 50+ genres."
    },
    {
      icon: Scissors,
      title: "Professional Timeline Editor",
      description: "Edit like a pro with multi-track video and audio, razor cuts, audio fades, and VU meters. Your Mind Movie deserves cinematic quality."
    },
    {
      icon: Mic,
      title: "Director AI Voice Coach",
      description: "Voice-enabled AI coaching with personality presets from 'Swag Coach' to 'Zen Guide'. Get challenged, inspired, and held accountable by an AI that knows your Chief Aim."
    },
    {
      icon: Wand2,
      title: "One-Click Mind Movie Creation",
      description: "Go from Chief Aim to finished movie with our 5-step wizard. AI generates scenes, images featuring YOU, videos, and soundtrack automatically. Magic, simplified."
    },
    {
      icon: Zap,
      title: "Episode Sprints",
      description: "Break your transformation into 1, 2, or 4-week episodes. Each sprint gets its own Mind Movie, AI character analysis, and production dashboard for focused execution."
    },
    {
      icon: Brain,
      title: "Character Builder",
      description: "Discover your archetype with our 28-question survey. Get AI-powered transformation analysis revealing your strengths, required traits, and a personalized roadmap."
    },
    {
      icon: Calendar,
      title: "21-Day Transformation Cycles",
      description: "Track your evolution through 10 cycles across 3 Acts. Daily scorecards, character trait tracking, and AI progress reports measure your identity shift."
    },
    {
      icon: Film,
      title: "Theater & Daily Ritual",
      description: "Watch your Mind Movie in a distraction-free theater. Track viewing streaks with our 4-step daily ritual: Morning Screening, Script Review, Action, Evening Review."
    },
    {
      icon: Music,
      title: "Soundtrack Studio & Director Radio",
      description: "Generate custom soundtracks in 50+ genres with AI lyrics based on your Chief Aim. Stream motivational playlists on Director Radio."
    },
    {
      icon: Users,
      title: "Director's Corner Community",
      description: "Share your movies, vote for Movie of the Week, compete for Director of the Month, and celebrate at the Annual Awards Ceremony. Transform together."
    },
    {
      icon: Share2,
      title: "Ecosystem Integrations",
      description: "Connect Slack, Telegram, and Notion for automated reminders. Auto-sync journal and scorecards. Share to Facebook, X, Instagram, and TikTok with built-in branding."
    }
  ];

  const phases = [
    { phase: 1, title: "The Director Emerges", description: "Define your Definite Chief Aim — the foundation of everything. Decide who you're becoming and commit it to writing with AI guidance." },
    { phase: 2, title: "The Script", description: "Create your Mind Movie storyboard with AI-generated scenes, visuals, and a custom soundtrack that embodies your Chief Aim." },
    { phase: 3, title: "Pre-Production", description: "Build your daily ritual system. Set up morning visualizations, evening reviews, and the Three Things that move you forward." },
    { phase: 4, title: "Principal Photography", description: "Daily visualization in the Theater + consistent action. Watch your movie, execute your plan, log your progress." },
    { phase: 5, title: "Post-Production", description: "Refine with AI analysis. Journal insights, scorecard reviews, and Director AI coaching optimize your approach." },
    { phase: 6, title: "The Premiere", description: "Celebrate milestones and victories. Earn awards, climb leaderboards, and share your transformation with the community." },
    { phase: 7, title: "The Franchise", description: "Scale your transformation. Create multiple movies for different life areas and become a master of identity engineering." }
  ];

  const createPillar = [
    { icon: Target, title: "Chief Aim Creator", description: "AI-guided 4-phase framework" },
    { icon: Video, title: "AI Video Generation", description: "Veo 3, Wan 2.1, Kling models" },
    { icon: Palette, title: "Reference Photo AI", description: "Generate images with YOUR face" },
    { icon: Music, title: "Soundtrack Studio", description: "50+ genres, Director Radio" },
    { icon: Scissors, title: "Timeline Editor", description: "Multi-track NLE, HD export" }
  ];

  const transformPillar = [
    { icon: Bot, title: "Director AI Coach", description: "Voice-first, 6 personalities" },
    { icon: Brain, title: "Character Builder", description: "28-question archetype survey" },
    { icon: Zap, title: "Episode Sprints", description: "1-4 week focused production" },
    { icon: Calendar, title: "21-Day Cycles", description: "10 cycles across 3 Acts" },
    { icon: Mic, title: "Voice Transformation", description: "10+ premium voice options" }
  ];

  const connectPillar = [
    { icon: Users, title: "Director's Corner", description: "Share, vote, celebrate" },
    { icon: Trophy, title: "Movie of the Week", description: "Community voting" },
    { icon: Award, title: "Annual Awards", description: "Yearly ceremony" },
    { icon: MessageSquare, title: "Slack & Telegram", description: "Automated reminders" },
    { icon: Share2, title: "Social Sharing", description: "FB, X, Instagram, TikTok" }
  ];

  const pricingFeatures = [
    "Director AI Voice Coaching",
    "$10 Monthly Production Credits",
    "Full AI Media Studio (Video, Image, Voice, Music)",
    "Reference Photo Generation (AI images with YOUR face)",
    "Professional Timeline Editor with HD Export",
    "5-Step Mind Movie Wizard with Scene Control",
    "Episode Sprints (1, 2, or 4-week focused productions)",
    "Character Builder & 28-Question Archetype Survey",
    "21-Day Transformation Cycles (10 cycles, 3 Acts)",
    "Daily Scorecard, Character Scorecard & Streak Tracking",
    "Director's Journal with AI Analysis",
    "Soundtrack Studio & Director Radio",
    "Movie Vault (Multiple Projects)",
    "5GB Mind Movie Uploads, 20GB Total Storage",
    "Director's Corner Community & Annual Awards",
    "Slack, Telegram, Notion & Social Media Integrations"
  ];

  const testimonials = [
    {
      quote: "I went from dreaming about my business to actually building it. Watching my Mind Movie every morning rewired something in my brain. The Director AI kept me accountable when I wanted to quit.",
      name: "Marcus Chen",
      title: "Founder, Apex Ventures",
      result: "Launched 7-figure business in 8 months"
    },
    {
      quote: "This isn't just an app—it's a complete operating system for your mind. The Chief Aim Wizard helped me get crystal clear on what I wanted, and the daily scorecard made sure I showed up for it.",
      name: "Jasmine Williams",
      title: "Executive Coach & Author",
      result: "2x'd her client roster in 90 days"
    },
    {
      quote: "The AI-generated Mind Movie brought tears to my eyes. Seeing my goals visualized with that quality of production—it made everything feel real and possible. I've never been more focused.",
      name: "David Okonkwo",
      title: "Real Estate Developer",
      result: "Closed his largest deal ever"
    },
    {
      quote: "I've tried every productivity app out there. This is different. The Swag Coach personality literally calls me out when I'm slacking. It's like having a mentor in my pocket 24/7.",
      name: "Sarah Martinez",
      title: "Tech Startup CEO",
      result: "120-day viewing streak and counting"
    }
  ];

  const faqs = [
    {
      question: "What exactly is a Mind Movie?",
      answer: "A Mind Movie is a personalized video that visualizes your goals, dreams, and the identity you're stepping into. Using our AI tools, you create cinematic scenes with images featuring YOUR face, video, music, and even your own voiceover that represent your ideal life. Watching it daily rewires your subconscious mind for success—based on proven visualization techniques from Maxwell Maltz and Napoleon Hill."
    },
    {
      question: "Do I need any video editing experience?",
      answer: "Absolutely not. Our 5-Step Mind Movie Wizard guides you from foundation to finished film. Upload a reference photo and AI generates scenes featuring YOU. For advanced control, our Timeline Editor offers multi-track editing and razor cuts. We've designed it so anyone can produce Hollywood-quality content."
    },
    {
      question: "What are Episodes and 21-Day Cycles?",
      answer: "Episodes are focused 1-4 week sprints with their own Mind Movie and production dashboard. The 21-Day Cycle system organizes your transformation into 10 cycles across 3 Acts (210 days total). Each cycle builds on the last, with AI progress reports tracking your identity shift over time."
    },
    {
      question: "How is this different from other visualization apps?",
      answer: "Most visualization apps give you static vision boards or generic guided meditations. Psycho-Cinematics gives you a complete production studio with AI video generation, reference photo personalization, voice coaching, and a full character transformation system. It's the difference between looking at a photo and starring in your own movie."
    },
    {
      question: "What's included in the $10 monthly production credits?",
      answer: "Your credits fuel AI generations: videos, images (including reference photo generations featuring you), voice transformations, and soundtrack creation. $10 is enough to create multiple complete Mind Movies each month. Heavy users can purchase additional credit packs with up to 17% bonus credits."
    },
    {
      question: "How does the Character Builder work?",
      answer: "Our 28-question archetype survey reveals your dominant character type, shadow tendencies, and transformation opportunities. The AI generates a personalized Transformation Analysis with your strengths, required traits, and a roadmap. Track daily alignment with the Character Scorecard."
    },
    {
      question: "How does the Director AI Voice Coach work?",
      answer: "The Director AI is your voice-enabled accountability partner. It knows your Chief Aim, active Episode, character archetype, and daily progress. Choose from 6 personality styles—from the challenging 'Swag Coach' to the calming 'Zen Guide'—and 10 different voices. It references your transformation analysis to provide identity-shifting guidance."
    },
    {
      question: "What if I want to cancel?",
      answer: "Cancel anytime with one click—no questions asked. We're confident you'll see the value, and there's no long-term commitment required."
    },
    {
      question: "Is my content private?",
      answer: "Completely. Your Mind Movies, journal entries, character profiles, and scorecards are private by default. You choose what to share with the Director's Corner community. We take privacy seriously—your transformation journey is yours alone unless you decide to inspire others."
    }
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
                <span className="text-sm text-gold font-semibold">Start Your Transformation Today</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display tracking-wide leading-tight">
                You're Not Just Watching Your Life. <br />
                <span className="text-gold-gradient">You're Directing It.</span>
              </h1>

              {/* Mobile Only: Hero Image between headline and subheadline */}
              <div className="lg:hidden relative animate-slide-up flex flex-col items-center">
                <h2 className="text-3xl md:text-4xl font-display tracking-[0.2em] text-gold-gradient mb-4 text-center">
                  PSYCHO CINEMATICS
                </h2>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/30 to-transparent rounded-2xl blur-3xl" />
                  <img 
                    src={heroImage} 
                    alt="The Director - Psycho-Cinematics" 
                    className="relative w-full max-w-md mx-auto shadow-2xl shadow-black/50"
                  />
                </div>
              </div>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                The world's first AI-powered identity transformation system. Create cinematic Mind Movies, get coached by an AI director who knows your goals, and track your transformation — all in one place.
              </p>

              <p className="text-lg font-display text-gold/80">
                From Vision to Reality. Daily.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="gold" size="lg" onClick={handleGetStarted} className="text-lg px-8">
                  <Play className="w-5 h-5 mr-2" />
                  Start Your Transformation
                </Button>
                <Button variant="outline" size="lg" onClick={handleLogin} className="text-lg px-8">
                  Already a Director? Login
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/40 to-amber-600/40 border-2 border-background" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">2,500+ Directors Transforming</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">5.0</span>
                </div>
              </div>
            </div>
            
            {/* Right Image - Director Hero (Desktop Only) */}
            <div className="hidden lg:flex relative animate-slide-up lg:scale-110 lg:-mr-12 flex-col items-center">
              {/* PSYCHO CINEMATICS Title */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display tracking-[0.3em] text-gold-gradient mb-4 text-center">
                PSYCHO CINEMATICS
              </h2>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/30 to-transparent rounded-2xl blur-3xl" />
                <img 
                  src={heroImage} 
                  alt="The Director - Psycho-Cinematics" 
                  className="relative w-full max-w-2xl mx-auto shadow-2xl shadow-black/50"
                />
              </div>
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
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Hollywood-grade production tools meet proven transformation methodology. Everything you need to engineer your identity and create the life you've always envisioned.
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

      {/* What's Inside Section - Three Pillars */}
      <section className="py-24 bg-card/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display tracking-wide mb-4">
              What's <span className="text-gold-gradient">Inside</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three pillars of transformation: Create your vision, Transform your identity, Connect with community.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* CREATE Pillar */}
            <div className="glass-card p-8 cinematic-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-amber-soft/30 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-2xl font-display text-gold">CREATE</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Hollywood-grade AI production tools at your fingertips
              </p>
              <ul className="space-y-4">
                {createPillar.map((item) => (
                  <li key={item.title} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gold/70" />
                    <div>
                      <span className="font-medium">{item.title}</span>
                      <span className="text-muted-foreground text-sm ml-2">— {item.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* TRANSFORM Pillar */}
            <div className="glass-card p-8 cinematic-border border-gold/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-amber-soft/30 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-2xl font-display text-gold">TRANSFORM</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Proven methodology for identity engineering
              </p>
              <ul className="space-y-4">
                {transformPillar.map((item) => (
                  <li key={item.title} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gold/70" />
                    <div>
                      <span className="font-medium">{item.title}</span>
                      <span className="text-muted-foreground text-sm ml-2">— {item.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* CONNECT Pillar */}
            <div className="glass-card p-8 cinematic-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-amber-soft/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-2xl font-display text-gold">CONNECT</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Community and accountability ecosystem
              </p>
              <ul className="space-y-4">
                {connectPillar.map((item) => (
                  <li key={item.title} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gold/70" />
                    <div>
                      <span className="font-medium">{item.title}</span>
                      <span className="text-muted-foreground text-sm ml-2">— {item.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Phase Framework */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display tracking-wide mb-4">
              The <span className="text-gold-gradient">7-Phase Framework</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A proven system for identity transformation, inspired by Maxwell Maltz's Psycho-Cybernetics and Napoleon Hill's Think and Grow Rich. This is how directors create their masterpiece.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((phase, index) => (
              <div 
                key={phase.phase}
                className={`relative glass-card p-6 hover:border-gold/30 transition-all duration-300 ${index === 6 ? 'lg:col-span-1 md:col-span-2' : ''}`}
              >
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gold flex items-center justify-center font-display text-lg text-black font-bold shadow-lg shadow-gold/30">
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

      {/* Social Proof Section */}
      <section className="py-16 bg-card/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-8">
              Directors are transforming daily
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-display text-gold mb-2">2,500+</div>
                <p className="text-muted-foreground">Active Directors</p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-display text-gold mb-2">15,000+</div>
                <p className="text-muted-foreground">Mind Movies Created</p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-display text-gold mb-2">180,000+</div>
                <p className="text-muted-foreground">Daily Viewings Logged</p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-display text-gold mb-2">97%</div>
                <p className="text-muted-foreground">Report Identity Shifts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display tracking-wide mb-4">
              Directors <span className="text-gold-gradient">Speak</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real transformations from directors who committed to the process.
            </p>
          </div>
          
          {/* Dynamic Testimonials from Database */}
          {approvedTestimonials.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
              {approvedTestimonials.slice(0, 6).map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonialType={testimonial.testimonial_type}
                  textContent={testimonial.text_content}
                  mediaUrl={testimonial.media_url}
                  thumbnailUrl={testimonial.thumbnail_url}
                  displayName={testimonial.display_name}
                  avatarUrl={testimonial.avatar_url}
                  userTitle={testimonial.user_title}
                  resultHighlight={testimonial.result_highlight}
                />
              ))}
            </div>
          )}

          {/* Static Testimonials as Fallback/Supplement */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={testimonial.name}
                className="glass-card p-8 cinematic-border relative"
              >
                <Quote className="absolute top-6 right-6 w-10 h-10 text-gold/20" />
                <p className="text-lg mb-6 italic text-foreground/90 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="border-t border-border/50 pt-4">
                  <p className="font-display text-gold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                  <p className="text-sm text-gold/70 mt-2 font-medium">
                    ✦ {testimonial.result}
                  </p>
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
              Invest in Your <span className="text-gold-gradient">Transformation</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your path: DIY with our powerful tools, or let us create your complete Mind Movie for you.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* DIY Plan */}
            <div className="glass-card p-8 cinematic-border border-border/50 relative overflow-hidden">
              {/* Popular Badge */}
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 rounded-full bg-gold text-black text-sm font-bold flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Most Popular
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-display mb-2">Director's OS</h3>
                <p className="text-muted-foreground">Build your own Mind Movie with AI tools</p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-display text-gold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Cancel anytime</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-gold" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button variant="gold" size="lg" className="w-full text-lg" onClick={handleGetStarted}>
                <Play className="w-5 h-5 mr-2" />
                Get Started Now
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                Secure checkout. Cancel anytime.
              </p>
            </div>

            {/* Done For You Plan */}
            <div className="glass-card p-8 cinematic-border border-gold/50 relative overflow-hidden">
              {/* Premium Badge */}
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-gold to-amber-soft text-black text-sm font-bold flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Done For You
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-display mb-2">Complete Mind Movie Package</h3>
                <p className="text-muted-foreground">We create your entire Mind Movie for you</p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground line-through mr-1">$997</span>
                  <span className="text-5xl font-display text-gold">$497</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">One-time + 1 month free software</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-gold" />
                  </div>
                  <span className="text-sm">3-Minute Professional Mind Movie</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-gold" />
                  </div>
                  <span className="text-sm">Custom AI-Generated Soundtrack</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-gold" />
                  </div>
                  <span className="text-sm">Definite Chief Aim Coaching Session</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-gold" />
                  </div>
                  <span className="text-sm">Professional Script Writing</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-gold" />
                  </div>
                  <span className="text-sm">12+ AI-Generated Scenes (with YOUR face)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-gold" />
                  </div>
                  <span className="text-sm">1 Month Free Director's OS Access ($29 value)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-gold" />
                  </div>
                  <span className="text-sm">Unlimited Revisions Until Perfect</span>
                </li>
              </ul>
              
              <Button variant="gold" size="lg" className="w-full text-lg" onClick={() => navigate("/done-for-you")}>
                <Sparkles className="w-5 h-5 mr-2" />
                Get Your Mind Movie Created
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                Delivered in 7-10 days. 30-day money-back guarantee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-card/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display tracking-wide mb-4">
              Frequently Asked <span className="text-gold-gradient">Questions</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know before stepping into the director's chair.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="glass-card cinematic-border px-6 border-border/50 data-[state=open]:border-gold/30"
                >
                  <AccordionTrigger className="text-left text-lg font-medium hover:text-gold transition-colors py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent" />
        <div className="absolute inset-0 spotlight opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-display tracking-wide mb-6">
              Your Transformation <span className="text-gold-gradient">Starts Today</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-4">
              Stop watching life happen. Start directing it.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Join the directors who are using AI, visualization, and daily accountability to become who they were meant to be. The studio is ready. The cameras are rolling. The only thing missing is you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gold" size="lg" onClick={handleGetStarted} className="text-lg px-8">
                <Film className="w-5 h-5 mr-2" />
                Start Your 3-Day Free Trial
              </Button>
              <Button variant="outline" size="lg" onClick={handleLogin} className="text-lg px-8">
                Already a Director? Login
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Cancel anytime • Full access to all features
            </p>
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
              © 2026 Psycho-Cinematics™. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal - For Login Only */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </div>
  );
};
