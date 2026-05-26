import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Film,
  Clapperboard,
  Armchair,
  Users,
  Play,
  Check,
  Star,
  Quote,
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

// Reusable REC dot
const RecDot = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-block w-2 h-2 rounded-full bg-[hsl(0_72%_51%)] shadow-[0_0_8px_hsl(0_72%_51%_/_0.8)] ${className}`}
    aria-hidden="true"
  />
);

// Director CTA button — black bg, white text, red REC dot, square corners
const DirectorCTA = ({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`group inline-flex items-center gap-3 bg-black text-white border border-white/20 px-7 py-4 text-sm uppercase tracking-[0.18em] font-semibold hover:bg-white hover:text-black transition-colors duration-200 ${className}`}
  >
    <RecDot />
    <span>{children}</span>
    <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
  </button>
);

export const LandingPage = ({ onLogin }: LandingPageProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [approvedTestimonials, setApprovedTestimonials] = useState<ApprovedTestimonial[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("showLoginModal") === "true") {
      sessionStorage.removeItem("showLoginModal");
      setShowAuthModal(true);
    }
  }, []);

  useEffect(() => {
    const fetchApprovedTestimonials = async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select(
          "id, testimonial_type, text_content, media_url, thumbnail_url, display_name, avatar_url, user_title, result_highlight",
        )
        .eq("status", "approved")
        .order("submitted_at", { ascending: false })
        .limit(8);

      if (!error && data) {
        const sorted = [...data].sort((a, b) => {
          const priority = { video: 0, audio: 1, text: 2 };
          return (
            priority[a.testimonial_type as keyof typeof priority] -
            priority[b.testimonial_type as keyof typeof priority]
          );
        });
        setApprovedTestimonials(sorted as ApprovedTestimonial[]);
      }
    };
    fetchApprovedTestimonials();
  }, []);

  const handleSitInChair = () => navigate("/signup");
  const handleLogin = () => setShowAuthModal(true);
  const handleStudioPackage = () => navigate("/done-for-you");

  const phases = [
    { n: "01", title: "The Director Emerges", line: "You stop being the lead. You sit in the chair." },
    { n: "02", title: "The Script", line: "The Mind Movie gets storyboarded. AI scenes, custom soundtrack, you in the frame." },
    { n: "03", title: "Pre-Production", line: "The daily rituals lock in. Morning Screening. Script Review. Action. Evening Dailies." },
    { n: "04", title: "Principal Photography", line: "You shoot the film. Day after day. The Theater opens. You take the action." },
    { n: "05", title: "Post-Production", line: "You review the dailies. The Director AI gives notes. The cut tightens." },
    { n: "06", title: "The Premiere", line: "A milestone hits. You screen it for the Director's Corner. The room stands up." },
    { n: "07", title: "The Franchise", line: "One Mind Movie becomes many. Career. Relationship. Body. You're running a slate now." },
  ];

  const testimonials = [
    {
      quote:
        "I stopped watching my life. I started directing it. Eight months later I'd built a seven-figure company — but more honestly, I'd become someone who could.",
      name: "Marcus Chen",
      title: "Founder, Apex Ventures",
      result: "LAUNCHED 7-FIGURE COMPANY IN 8 MONTHS",
    },
    {
      quote:
        "The Chief Aim work cut a year of confusion out of my practice. I doubled my roster because I finally knew which roster I was building.",
      name: "Jasmine Williams",
      title: "Executive Coach & Author",
      result: "2× CLIENT ROSTER IN 90 DAYS",
    },
    {
      quote:
        "The first time the Mind Movie played, I sat in front of the screen for ten minutes after it ended. I wasn't watching myself anymore. I was watching the version of me I'd already decided to become.",
      name: "David Okonkwo",
      title: "Real Estate Developer",
      result: "CLOSED HIS LARGEST DEAL ON RECORD",
    },
    {
      quote:
        "The Showrunner doesn't let me drift. I'm 120 production days in. I don't break a screening. I direct.",
      name: "Sarah Martinez",
      title: "Tech Startup CEO",
      result: "120 CONSECUTIVE PRODUCTION DAYS",
    },
  ];

  const osFeatures = [
    "Director AI Voice Coach (six personalities)",
    "1,000 production credits / month (≈ 33 videos, 76 images, or 45 tracks)",
    "Full media studio — Veo 3, Wan 2.1, Kling",
    "Hero Character generation with your face",
    "Pro timeline editor, 4K export",
    "5-step Mind Movie Wizard",
    "Episode Sprints (1, 2, or 4 weeks)",
    "The Dailies (daily scorecard) + Director's Journal",
    "Soundtrack Studio + Director Radio",
    "Movie Vault, 5 GB uploads, 20 GB total storage",
    "Director's Corner + Annual Awards",
    "Slack / Telegram / Notion / social integrations",
    "Cancel any time. Walk off set whenever.",
  ];

  const studioPackageFeatures = [
    "A 3-minute professional Mind Movie, made for you",
    "A custom AI-generated soundtrack scored to your Chief Aim",
    "A Definite Chief Aim coaching session with our team",
    "Pro script writing",
    "12+ AI-generated scenes with your face",
    "1 month of Director's OS free ($29 value)",
    "Unlimited revisions until the cut is right",
    "Delivered in 7–10 days. 30-day money-back guarantee.",
  ];

  const faqs = [
    {
      question: "What is a Mind Movie?",
      answer:
        "A 90-second to 3-minute film you direct, starring you, scored to your Chief Aim. You watch it every morning in the Theater. The brain treats repeated cinematic exposure to a future self the way it treats memory. Olympic athletes call it mental rehearsal. We call it Principal Photography.",
    },
    {
      question: "Do I need any film experience?",
      answer:
        "No. The Wizard walks you through every shot. If you've ever picked the song for a road trip, you have enough taste to direct your own Mind Movie.",
    },
    {
      question: "How is this different from other visualization apps?",
      answer:
        "Most visualization apps are affirmations with a calmer voice. This is a film studio. You write the script. You cast yourself. You take final cut.",
    },
    {
      question: "What's in the 1,000 monthly production credits?",
      answer:
        "Roughly 33 video generations, 76 reference images, or 45 soundtrack tracks. Most Directors burn the bulk of their credits in week one building the first Mind Movie, then spend the rest of the month refining and Episode Sprinting.",
    },
    {
      question: "How does the Director AI Voice Coach work?",
      answer:
        "You pick a personality — The Showrunner, The Editor, The Auteur, The First AD, The Method, The Long Take — and they coach you in voice. They know your Chief Aim, your last seven days of Dailies, and your current Episode Sprint. They don't pep-talk. They direct.",
    },
    {
      question: "What if I want to cancel?",
      answer: "Walk off set any time. Your Mind Movies stay yours. We don't lock the vault.",
    },
    {
      question: "Is my content private?",
      answer:
        "Yes. Your Mind Movies, your Chief Aim, your Dailies — all private to you. You choose what (if anything) to screen in the Director's Corner.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={psychoCinematicsLogo} alt="Psycho-Cinematics" className="h-10 w-auto" />
            <span className="hidden sm:inline text-xs uppercase tracking-[0.25em] text-white/80 font-semibold">
              Psycho-Cinematics
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-5 text-xs uppercase tracking-[0.18em]">
            <button
              onClick={handleLogin}
              className="hidden sm:inline text-white/60 hover:text-white transition-colors"
            >
              Film School
            </button>
            <button
              onClick={handleLogin}
              className="hidden sm:inline text-white/60 hover:text-white transition-colors"
            >
              Director's Corner
            </button>
            <button
              onClick={handleLogin}
              className="text-white/60 hover:text-white transition-colors"
            >
              Login
            </button>
            <DirectorCTA onClick={handleSitInChair} className="!px-4 !py-2.5 !text-[11px]">
              Sit in the Chair
            </DirectorCTA>
          </div>
        </div>
      </nav>

      {/* 1. HERO */}
      <section className="pt-28 pb-20 relative overflow-hidden bg-black">
        <div className="absolute inset-0 spotlight opacity-40" />
        <div className="absolute inset-0 film-grain opacity-30" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/80">
                <RecDot />
                <span>Now in Production</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[1.05] text-white">
                Take Final Cut <br />
                <span className="text-gold-gradient">on Your Life.</span>
              </h1>

              {/* Mobile image */}
              <div className="lg:hidden relative animate-slide-up flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent blur-3xl" />
                  <img
                    src={heroImage}
                    alt="The Director"
                    className="relative w-full max-w-md mx-auto shadow-2xl shadow-black/50"
                  />
                </div>
              </div>

              <p className="text-xl text-white/70 max-w-xl leading-relaxed font-light italic">
                The first film studio for your own identity. Direct your Mind Movie. Sit in the
                chair. Decide what stays in the film — and what gets cut.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <DirectorCTA onClick={handleSitInChair}>Sit in the Chair</DirectorCTA>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  3-day trial · No card · Walk off set anytime
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 text-[11px] uppercase tracking-[0.25em] text-white/60">
                <span>2,500+ Directors on Set</span>
                <span className="text-white/30">·</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3 h-3 fill-gold text-gold" />
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop image */}
            <div className="hidden lg:flex relative animate-slide-up lg:scale-105 flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent blur-3xl" />
                <img
                  src={heroImage}
                  alt="The Director"
                  className="relative w-full max-w-2xl mx-auto shadow-2xl shadow-black/60"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 7-PHASE FRAMEWORK */}
      <section className="py-24 relative bg-black border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/60 mb-6">
              <RecDot />
              <span>The Production Arc</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display tracking-tight text-white mb-4">
              Every Director moves through <span className="text-gold-gradient">seven phases.</span>
            </h2>
            <p className="text-lg text-white/60 italic font-light">
              Same arc as a film. Same arc as a life that's been authored instead of accidented.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {phases.map((p) => (
              <div
                key={p.n}
                className="group relative border border-white/10 bg-black/40 p-6 hover:border-gold/40 hover:bg-black/60 transition-all duration-300"
              >
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-[hsl(0_72%_51%)] font-display text-2xl">{p.n}</span>
                  <RecDot />
                </div>
                <h3 className="text-lg font-display text-white mb-3 leading-snug">{p.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{p.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. STATUS FLIP */}
      <section className="py-32 bg-black border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-display tracking-tight text-white leading-tight">
              Most people are extras in their own life.
            </h2>
            <div className="space-y-5 text-lg text-white/70 leading-relaxed font-light italic">
              <p>
                They take notes from people who shouldn't be writing the script. They get cut from
                scenes they should be leading. They watch the rough cut of their own day at night
                and wonder how it got assembled this way.
              </p>
              <p>Directors don't live like that.</p>
              <p className="text-white not-italic font-display text-2xl">Directors take final cut.</p>
            </div>
            <div className="pt-4">
              <DirectorCTA onClick={handleSitInChair}>Sit in the Chair</DirectorCTA>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT YOU GET — THREE PILLARS */}
      <section className="py-24 bg-black border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/60 mb-6">
              <RecDot />
              <span>What You Get</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display tracking-tight text-white">
              A Studio. A Method. <span className="text-gold-gradient">A Crew.</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {/* CREATE */}
            <div className="bg-black p-10 space-y-5">
              <Clapperboard className="w-10 h-10 text-white/80" strokeWidth={1} />
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[hsl(43_74%_49%)] mb-2">
                  Create
                </p>
                <h3 className="text-2xl font-display text-white">The Studio</h3>
              </div>
              <p className="text-white/70 leading-relaxed">
                The full production stack. AI scene generation with your face (Veo 3, Wan 2.1,
                Kling). Multi-track timeline editor with 4K export. Soundtrack Studio across 50+
                genres. Hero Character generation in three views.
              </p>
              <p className="text-white/50 italic text-sm">Hollywood inputs, Director's Cut output.</p>
            </div>

            {/* TRANSFORM */}
            <div className="bg-black p-10 space-y-5">
              <Armchair className="w-10 h-10 text-white/80" strokeWidth={1} />
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[hsl(43_74%_49%)] mb-2">
                  Transform
                </p>
                <h3 className="text-2xl font-display text-white">The Method</h3>
              </div>
              <p className="text-white/70 leading-relaxed">
                The 7-phase production arc, scored daily. Episode Sprints (1, 2, or 4 weeks). The
                K-U-T technique for cutting old self-image loops the moment they appear. Director AI
                Voice Coach across six personalities — The Showrunner, The Editor, The Auteur, The
                First AD, The Method, The Long Take.
              </p>
            </div>

            {/* CONNECT */}
            <div className="bg-black p-10 space-y-5">
              <Users className="w-10 h-10 text-white/80" strokeWidth={1} />
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[hsl(43_74%_49%)] mb-2">
                  Connect
                </p>
                <h3 className="text-2xl font-display text-white">The Crew</h3>
              </div>
              <p className="text-white/70 leading-relaxed">
                The Director's Corner: where Directors screen their work, vote Movie of the Week,
                and walk the carpet at the Annual Psycho-Cinematic Awards.
              </p>
              <p className="text-white/50 italic text-sm">
                You are not the only one in the chair. You're the only one in your chair.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DAILY RITUAL */}
      <section className="py-24 bg-black border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Clapperboard className="w-12 h-12 text-[hsl(43_74%_49%)] mx-auto" strokeWidth={1} />
            <h2 className="text-4xl md:text-5xl font-display tracking-tight text-white">
              Open the Theater.
            </h2>
            <p className="text-lg text-white/70 leading-relaxed font-light italic">
              Every morning starts the same way. The clapperboard slates the scene. The Mind Movie
              rolls. The credits name the Director and the Chief Aim.{" "}
              <span className="not-italic text-white">Sixty seconds. Then you go shoot the day.</span>
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 mt-12">
              {[
                { d: "Day 7", t: "First Week Wrapped" },
                { d: "Day 30", t: "Principal Photography" },
                { d: "Day 60", t: "Picture Lock" },
                { d: "Day 90", t: "The Director's Cut", gold: true },
              ].map((m) => (
                <div key={m.d} className="bg-black p-6 text-left">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">{m.d}</p>
                  <p
                    className={`font-display text-base ${
                      m.gold ? "text-[hsl(43_74%_49%)]" : "text-white"
                    }`}
                  >
                    {m.t}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-white/50 italic pt-2">
              Day 90 ships a real wrap gift to your door. Because this is a real wrap.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SOCIAL PROOF */}
      <section className="py-24 bg-black border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/60 mb-6">
              <RecDot />
              <span>On the Record</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display tracking-tight text-white">
              Directors on the Record
            </h2>
          </div>

          {approvedTestimonials.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
              {approvedTestimonials.slice(0, 6).map((t) => (
                <TestimonialCard
                  key={t.id}
                  testimonialType={t.testimonial_type}
                  textContent={t.text_content}
                  mediaUrl={t.media_url}
                  thumbnailUrl={t.thumbnail_url}
                  displayName={t.display_name}
                  avatarUrl={t.avatar_url}
                  userTitle={t.user_title}
                  resultHighlight={t.result_highlight}
                />
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-px bg-white/10 border border-white/10 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-black p-10 relative">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-white/10" />
                <p className="text-lg mb-6 italic text-white/90 leading-relaxed font-light">
                  "{t.quote}"
                </p>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <p className="font-display text-white">{t.name}</p>
                  <p className="text-sm text-white/50">{t.title}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[hsl(0_72%_51%)] flex items-center gap-2 pt-1">
                    <RecDot />
                    {t.result}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. METRICS BAND */}
      <section className="py-20 bg-black border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10">
            {[
              { n: "2,500+", l: "Directors on set" },
              { n: "15,000+", l: "Mind Movies in the vault" },
              { n: "180,000+", l: "Screenings logged" },
              { n: "97%", l: "Report a real identity shift" },
            ].map((m) => (
              <div key={m.l} className="bg-black p-8 text-center">
                <div className="text-4xl md:text-5xl font-display text-gold-gradient mb-3 tracking-tight">
                  {m.n}
                </div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">{m.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PRICING */}
      <section className="py-24 bg-black border-t border-white/5" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/60 mb-6">
              <RecDot />
              <span>Two Paths</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display tracking-tight text-white">
              Sit in the chair. <span className="text-gold-gradient">Or let us bring the crew.</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-px bg-white/10 border border-white/10 max-w-5xl mx-auto">
            {/* Director's OS */}
            <div className="bg-black p-10 relative">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[hsl(0_72%_51%)] mb-4">
                <RecDot />
                <span>Director's OS</span>
              </div>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-6xl font-display text-white">$29</span>
                <span className="text-white/50 text-sm">/ month</span>
              </div>
              <p className="text-white/60 italic mb-8">The studio is yours. You direct.</p>

              <ul className="space-y-3 mb-10">
                {osFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-[hsl(43_74%_49%)] flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <DirectorCTA onClick={handleSitInChair} className="w-full justify-center">
                Sit in the Chair
              </DirectorCTA>
            </div>

            {/* Studio Package */}
            <div className="bg-black p-10 relative">
              <div className="text-[11px] uppercase tracking-[0.25em] text-white/60 mb-4">
                The Studio Package
              </div>
              <div className="mb-2 flex items-baseline gap-3">
                <span className="text-6xl font-display text-white">$497</span>
                <span className="text-white/40 line-through text-sm">$997</span>
              </div>
              <p className="text-white/60 italic mb-8">We bring the crew. You sit in the chair.</p>

              <ul className="space-y-3 mb-10">
                {studioPackageFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-[hsl(43_74%_49%)] flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <DirectorCTA onClick={handleStudioPackage} className="w-full justify-center">
                Book the Studio
              </DirectorCTA>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FILM SCHOOL HOOK */}
      <section className="py-28 bg-black border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Film className="w-12 h-12 text-white/60 mx-auto" strokeWidth={1} />
            <h2 className="text-4xl md:text-5xl font-display tracking-tight text-white leading-tight">
              Before you sit in the chair, <br />
              <span className="text-gold-gradient italic">sit in the seats.</span>
            </h2>
            <p className="text-lg text-white/70 leading-relaxed font-light italic">
              The Director's Film School. Six short films, free. The neuroscience the self-help
              books never quite explain — the Servo-Mechanism, the Snapback, what Spielberg actually
              does before he shoots, why most affirmations fail by week three.
            </p>
            <div className="pt-4">
              <DirectorCTA onClick={handleSitInChair}>Watch the Film School</DirectorCTA>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="py-24 bg-black border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/60 mb-6">
              <RecDot />
              <span>FAQ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display tracking-tight text-white">
              Notes from the Director
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-px bg-white/10 border border-white/10">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-black border-0 px-6"
                >
                  <AccordionTrigger className="text-left text-lg font-display hover:text-[hsl(43_74%_49%)] transition-colors py-6 text-white">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70 pb-6 leading-relaxed text-base font-light">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* 11. FINAL CTA */}
      <section className="py-32 bg-black border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 film-grain opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-10">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[hsl(0_72%_51%)]">
              <RecDot />
              <span>Call Sheet — Today</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display tracking-tight text-white leading-[1.05]">
              The Chair <br />
              <span className="text-gold-gradient italic">Is Empty.</span>
            </h2>
            <p className="text-xl text-white/70 italic font-light">
              Stop being an extra in your own life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <DirectorCTA onClick={handleSitInChair}>Sit in the Chair</DirectorCTA>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                3-day trial · No card · No notes from anyone but you
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="py-16 bg-black border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="space-y-4">
              <img src={psychoCinematicsLogo} alt="Psycho-Cinematics" className="h-10 w-auto" />
              <p className="text-sm text-white/50 italic font-light leading-relaxed">
                The first film studio for your own identity.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white font-semibold">
                The Studio
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li><button onClick={handleSitInChair} className="hover:text-white">Director's OS</button></li>
                <li><button onClick={handleStudioPackage} className="hover:text-white">The Studio Package</button></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white font-semibold">
                The Method
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li>The 7-Phase Framework</li>
                <li>Film School</li>
                <li>The K-U-T Technique</li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white font-semibold">
                The Crew
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li>Director's Corner</li>
                <li>Annual Awards</li>
                <li><button onClick={handleLogin} className="hover:text-white">Login</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">
              © 2026 Psycho-Cinematics™ · Take Final Cut.
            </p>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </div>
  );
};
