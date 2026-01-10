import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Play, 
  Target, 
  Film, 
  Mic, 
  Palette, 
  Trophy, 
  Coins, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  Calendar,
  Users,
  ArrowLeft,
  HelpCircle,
  Camera,
  Wand2,
  Music,
  Video,
  Image,
  Bot,
  Upload,
  Volume2,
  Lightbulb,
  Zap,
  Star,
  CirclePlay,
  Settings,
  MessageSquare,
  GraduationCap
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Quick Start Tutorial Sections
interface TutorialSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: {
    title: string;
    content: string;
  }[];
  tips?: string[];
}

const tutorialSections: TutorialSection[] = [
  {
    id: "getting-started",
    icon: <Play className="w-6 h-6" />,
    title: "Getting Started",
    description: "Your first steps as a Director of your own life story",
    steps: [
      {
        title: "Create Your Account",
        content: "Sign up with your email or Google account. You'll receive a 3-day free trial with 250 credits to explore all features."
      },
      {
        title: "Set Up Your Profile",
        content: "Go to Settings and customize your profile. Add your avatar, bio, and set your Director character name - this is who you're becoming."
      },
      {
        title: "Explore the Dashboard",
        content: "Your dashboard is mission control. Here you'll see your Chief Aim, daily tasks, streak progress, and quick access to all studio tools."
      }
    ],
    tips: [
      "Complete your profile to unlock the full experience",
      "Enable notifications to stay on track with your daily rituals"
    ]
  },
  {
    id: "chief-aim",
    icon: <Target className="w-6 h-6" />,
    title: "Definite Chief Aim",
    description: "The foundation of your transformation journey",
    steps: [
      {
        title: "Understand the Concept",
        content: "Your Definite Chief Aim is based on Napoleon Hill's principle - a crystal-clear statement of your ultimate goal, including what you want, when you'll achieve it, what you'll give in exchange, and your plan."
      },
      {
        title: "Launch the Wizard",
        content: "Click 'Create Your Chief Aim' on the dashboard. The AI-guided wizard will walk you through four phases: The Dream, The Deadline, The Exchange, and The Plan."
      },
      {
        title: "Refine with AI Assistance",
        content: "The AI coach helps you articulate each component with clarity and power. Don't rush - this statement will guide your entire journey."
      },
      {
        title: "Review Daily",
        content: "Your Chief Aim appears on your dashboard. Read it aloud every morning and evening as part of your ritual."
      }
    ],
    tips: [
      "Be specific about what you want - vague goals produce vague results",
      "Set a deadline that stretches you but feels achievable",
      "Your exchange should reflect real sacrifice and commitment"
    ]
  },
  {
    id: "mind-movie",
    icon: <Film className="w-6 h-6" />,
    title: "Mind Movie Studio",
    description: "Create and watch your personal visualization movie",
    steps: [
      {
        title: "Use the Script Wizard",
        content: "Launch the Mind Movie Script Wizard to create an AI-generated storyboard based on your Chief Aim. It will generate scenes, visuals, and even a custom soundtrack."
      },
      {
        title: "Download Your Assets",
        content: "Download all your generated images and video clips from the Media Library. These are the raw building blocks of your Mind Movie."
      },
      {
        title: "Edit in Professional Software",
        content: "Import your downloaded assets into a video editor like Final Cut Pro, Adobe Premiere Pro, CapCut, or DaVinci Resolve. Stitch the images and clips together, add transitions, and sync with your AI-generated soundtrack."
      },
      {
        title: "Upload Your Final Mind Movie",
        content: "Once edited, upload your completed Mind Movie to The Theater. You can watch it here on the platform or on VR headsets for an immersive experience."
      },
      {
        title: "Daily Viewing Ritual",
        content: "Watch your Mind Movie every morning. The Theater tracks your viewing streak - consistency is key to reprogramming your subconscious."
      }
    ],
    tips: [
      "Keep your Mind Movie under 5 minutes for maximum impact",
      "Use CapCut (free) if you're new to video editing",
      "Watch on a VR headset for maximum immersion and impact",
      "Your viewing streak appears on the dashboard - aim for 90+ days"
    ]
  },
  {
    id: "edit-bay",
    icon: <Palette className="w-6 h-6" />,
    title: "Edit Bay (AI Studio)",
    description: "Generate stunning visuals and videos with AI",
    steps: [
      {
        title: "Access the Studio",
        content: "Click 'Open Edit Bay' on your dashboard to enter the AI media generation studio."
      },
      {
        title: "Generate Images",
        content: "Use text prompts to create images of your future self and goals. You can upload reference photos for personal likeness integration."
      },
      {
        title: "Create Videos",
        content: "Generate AI videos using Veo 3 (with audio), Wan 2.1, or Kling v1.0. Videos support image-to-video and video-to-video transformations."
      },
      {
        title: "Download Your Assets",
        content: "All generated content is saved to your Media Library (5GB limit). Download your images and video clips - you'll need them for your Mind Movie."
      },
      {
        title: "Assemble in Video Editor",
        content: "Use professional editing software (Final Cut Pro, Premiere Pro, CapCut, DaVinci Resolve) to stitch your AI-generated assets into a cohesive Mind Movie with transitions and music."
      }
    ],
    tips: [
      "Check credit costs before generating - videos use more credits than images",
      "Download assets regularly to free up storage space",
      "CapCut is a great free option for beginners to edit their Mind Movie"
    ]
  },
  {
    id: "director-ai",
    icon: <Mic className="w-6 h-6" />,
    title: "Director AI Coach",
    description: "Your personal Jarvis-like voice coach",
    steps: [
      {
        title: "Start a Session",
        content: "Click 'Talk to Director AI' on your dashboard to launch the full-screen voice coaching interface."
      },
      {
        title: "Speak Naturally",
        content: "The AI listens to you speak and responds with personalized coaching based on your Chief Aim, daily progress, and the Psycho-Cinematics methodology."
      },
      {
        title: "Use the CUT! Technique",
        content: "When you're spiraling into negative thoughts, the AI can guide you through the 4-step reset: Recognize, Cut, Reset (3 breaths), and Resume with aligned action."
      },
      {
        title: "Get Daily Suggestions",
        content: "The AI generates 3 actionable tasks based on your Chief Aim. These appear as 'Director's Suggestions' and align with your current phase."
      }
    ],
    tips: [
      "Use voice mode for a hands-free coaching experience",
      "The AI remembers your conversation history for continuity",
      "Ask for specific help: 'Help me with my fear of failure'"
    ]
  },
  {
    id: "daily-ritual",
    icon: <Calendar className="w-6 h-6" />,
    title: "Daily Rituals & Scorecard",
    description: "Track your progress and build unstoppable momentum",
    steps: [
      {
        title: "Morning Ritual",
        content: "Start each day by: 1) Reading your Chief Aim aloud, 2) Watching your Mind Movie, 3) Setting your 'Three Things' (3 key tasks for the day)."
      },
      {
        title: "Execute Your Three Things",
        content: "Your dashboard shows your 3 priority tasks. Check them off as you complete them throughout the day."
      },
      {
        title: "Evening Scorecard",
        content: "End each day with the Daily Director Scorecard. Rate yourself 0-3 on four categories: Identity Alignment, Behavior Execution, Emotional Regulation, and Forward Progress."
      },
      {
        title: "Build Your Streak",
        content: "Consecutive days of completed scorecards build your streak. The streak banner on your dashboard celebrates your consistency."
      }
    ],
    tips: [
      "Perfect scores (12/12) earn bonus credits",
      "Be honest on your scorecard - it's a tool for growth, not ego",
      "Review your weekly scores to identify patterns"
    ]
  }
];

// Combined FAQs from both pages
const faqs = [
  {
    question: "What is Psycho-Cinematics™?",
    answer: "Psycho-Cinematics™ is a transformational methodology that combines Maxwell Maltz's Psycho-Cybernetics, Napoleon Hill's Think and Grow Rich principles, and modern AI technology. It treats your life as a movie where you are both the Director and the star, using visualization, daily rituals, and identity shifting to manifest your goals."
  },
  {
    question: "How does the 7-Phase Framework work?",
    answer: "The framework guides you through: 1) The Awakening - realizing you can change, 2) The Vision - defining your Chief Aim, 3) The Script - writing your new story, 4) Pre-Production - building habits and systems, 5) Principal Photography - taking daily action, 6) Post-Production - refining and adjusting, 7) The Premiere - achieving and celebrating your goal."
  },
  {
    question: "What's included in the subscription?",
    answer: "The $29/month subscription includes 1,000 monthly credits for AI generation, unlimited access to Director AI coaching, Mind Movie tools, the Edit Bay studio, daily tracking features, and community access. You also get a 3-day free trial with 250 credits to explore."
  },
  {
    question: "How do I get the best results from AI image/video generation?",
    answer: "Be specific and descriptive in your prompts. Include details about setting, lighting, mood, and style. For personal likeness, upload clear reference photos. Start with images before creating videos, as you can use image-to-video to animate your best images."
  },
  {
    question: "What is the CUT! technique?",
    answer: "CUT! is a 4-step mental reset technique for when you catch yourself in negative thought patterns: 1) Recognize - notice the off-script thought, 2) Cut - mentally yell 'CUT!' to stop the scene, 3) Reset - take 3 deep breaths and reconnect with your Director self, 4) Resume - take an aligned action that matches your Chief Aim identity."
  },
  {
    question: "How long should I watch my Mind Movie?",
    answer: "Ideally, watch your Mind Movie every morning right after waking (when your mind is most suggestible) and every evening before sleep. Keep the video under 5 minutes for maximum focus. Consistency matters more than duration - a 90-day streak is transformational."
  },
  {
    question: "How many credits do I get per month?",
    answer: "Subscribers receive 1,000 credits monthly ($10 value). You can purchase additional credits in packs of $10 (1,000), $20 (2,200 with bonus), or $30 (3,500 with bonus). Credits never expire."
  },
  {
    question: "What's the difference between Production Credits and Engagement Credits?",
    answer: "Production Credits ($0.01 each) are used for AI generation — images, videos, music. Engagement Credits are earned through daily activity and contribute to your leaderboard ranking and awards."
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel anytime from Settings → Subscription. You'll retain access until the end of your billing period. Purchased credits never expire and remain available even after cancellation."
  }
];

const DirectorsGuide = () => {
  const [completedSections, setCompletedSections] = useState<string[]>([]);

  const toggleComplete = (sectionId: string) => {
    setCompletedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const progressPercentage = (completedSections.length / tutorialSections.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Back Navigation */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-gold-gradient mb-4">
            Director's Guide
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to master Psycho-Cinematics™ and become the Director of your life story
          </p>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs defaultValue="quick-start" className="space-y-8">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 h-auto">
            <TabsTrigger value="quick-start" className="gap-2 py-3">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Start</span>
              <span className="sm:hidden">Start</span>
            </TabsTrigger>
            <TabsTrigger value="full-manual" className="gap-2 py-3">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Full Manual</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2 py-3">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Quick Start Tab */}
          <TabsContent value="quick-start" className="space-y-6">
            {/* Progress Tracker */}
            <Card className="border-gold/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Your Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {completedSections.length} of {tutorialSections.length} sections completed
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gold to-amber-soft transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {tutorialSections.map((section) => (
                <Card 
                  key={section.id} 
                  className={`transition-all duration-300 ${
                    completedSections.includes(section.id) 
                      ? 'border-gold/50 bg-gold/5' 
                      : 'hover:border-gold/30'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          completedSections.includes(section.id)
                            ? 'bg-gold text-primary-foreground'
                            : 'bg-gold/10 text-gold'
                        }`}>
                          {section.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {section.title}
                            {completedSections.includes(section.id) && (
                              <CheckCircle2 className="w-5 h-5 text-gold" />
                            )}
                          </CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Accordion type="single" collapsible className="w-full">
                      {section.steps.map((step, index) => (
                        <AccordionItem key={index} value={`step-${index}`}>
                          <AccordionTrigger className="text-sm hover:no-underline">
                            <span className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </span>
                              {step.title}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground pl-8">
                            {step.content}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    {section.tips && section.tips.length > 0 && (
                      <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <p className="text-xs font-medium text-gold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Pro Tips
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {section.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 mt-0.5 text-gold" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button 
                      variant={completedSections.includes(section.id) ? "outline" : "default"}
                      size="sm"
                      className="w-full"
                      onClick={() => toggleComplete(section.id)}
                    >
                      {completedSections.includes(section.id) ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        "Mark as Complete"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Full Manual Tab */}
          <TabsContent value="full-manual" className="space-y-8">
            <Tabs defaultValue="getting-started" className="space-y-6">
              <TabsList className="flex flex-wrap justify-center gap-2 h-auto bg-transparent">
                <TabsTrigger value="getting-started" className="gap-2">
                  <Play className="w-4 h-4" />
                  Getting Started
                </TabsTrigger>
                <TabsTrigger value="chief-aim" className="gap-2">
                  <Target className="w-4 h-4" />
                  Chief Aim
                </TabsTrigger>
                <TabsTrigger value="edit-bay" className="gap-2">
                  <Palette className="w-4 h-4" />
                  Edit Bay
                </TabsTrigger>
                <TabsTrigger value="mind-movie" className="gap-2">
                  <Film className="w-4 h-4" />
                  Mind Movie
                </TabsTrigger>
                <TabsTrigger value="director-ai" className="gap-2">
                  <Bot className="w-4 h-4" />
                  Director AI
                </TabsTrigger>
                <TabsTrigger value="daily-rituals" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Daily Rituals
                </TabsTrigger>
              </TabsList>

              {/* Getting Started */}
              <TabsContent value="getting-started" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-6 h-6 text-gold" />
                      Welcome to Psycho-Cinematics™
                    </CardTitle>
                    <CardDescription>
                      Your journey to becoming the Director of your life story starts here
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                      <h4 className="font-semibold text-gold mb-2 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        What is Psycho-Cinematics™?
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Psycho-Cinematics™ is a transformational methodology that combines Maxwell Maltz's Psycho-Cybernetics, 
                        Napoleon Hill's Think and Grow Rich principles, and cutting-edge AI technology. We treat your life as 
                        a movie where <strong>you are both the Director and the star</strong>. Through visualization, daily rituals, 
                        and identity shifting, you'll manifest your goals by literally seeing yourself living them first.
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4">The 7-Phase Framework</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { phase: "1", title: "The Awakening", desc: "Realizing you can change your story" },
                          { phase: "2", title: "The Vision", desc: "Defining your Definite Chief Aim" },
                          { phase: "3", title: "The Script", desc: "Writing your new identity story" },
                          { phase: "4", title: "Pre-Production", desc: "Building habits and systems" },
                          { phase: "5", title: "Principal Photography", desc: "Taking daily aligned action" },
                          { phase: "6", title: "Post-Production", desc: "Refining and adjusting course" },
                          { phase: "7", title: "The Premiere", desc: "Achieving and celebrating your goal" },
                        ].map((item) => (
                          <div key={item.phase} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">
                                {item.phase}
                              </span>
                              <span className="font-medium text-sm">{item.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4">Your First Steps</h4>
                      <ol className="space-y-4">
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">1</span>
                          <div>
                            <p className="font-medium">Create Your Definite Chief Aim</p>
                            <p className="text-sm text-muted-foreground">
                              Click the Chief Aim card on your dashboard and use the AI wizard to craft your vision.
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">2</span>
                          <div>
                            <p className="font-medium">Generate Your First Visualization</p>
                            <p className="text-sm text-muted-foreground">
                              Open the Edit Bay and create AI images of your future self living your Chief Aim.
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">3</span>
                          <div>
                            <p className="font-medium">Set Your Three Things</p>
                            <p className="text-sm text-muted-foreground">
                              Each morning, lock in 3 priority tasks that move you toward your Chief Aim.
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">4</span>
                          <div>
                            <p className="font-medium">Talk to Director AI</p>
                            <p className="text-sm text-muted-foreground">
                              Your AI coach knows your Chief Aim and tracks your progress. Ask for guidance anytime.
                            </p>
                          </div>
                        </li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Chief Aim */}
              <TabsContent value="chief-aim" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-6 h-6 text-gold" />
                      Definite Chief Aim
                    </CardTitle>
                    <CardDescription>
                      The foundational statement that drives your entire transformation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                      <h4 className="font-semibold text-gold mb-2">Why It Matters</h4>
                      <p className="text-sm text-muted-foreground">
                        Napoleon Hill discovered that every person who achieved extraordinary success had a 
                        <strong> Definite Chief Aim</strong> — a crystal-clear statement of exactly what they wanted, 
                        when they'd achieve it, what they'd give in exchange, and their plan.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">The Four Components</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-gold" />
                            <span className="font-medium">The Dream (What)</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Exactly what you want to achieve or become. Be specific.
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-gold" />
                            <span className="font-medium">The Deadline (By When)</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            A specific date by which you'll achieve this goal.
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-gold" />
                            <span className="font-medium">The Exchange (What You'll Give)</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            What will you sacrifice, invest, or commit?
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <ChevronRight className="w-5 h-5 text-gold" />
                            <span className="font-medium">The Plan (First Steps)</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Immediate actions you'll take to begin.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Edit Bay */}
              <TabsContent value="edit-bay" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-6 h-6 text-gold" />
                      The Edit Bay — AI Media Studio
                    </CardTitle>
                    <CardDescription>
                      Generate stunning images, videos, and audio to visualize your transformation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Image className="w-5 h-5 text-blue-400" />
                        Image Generation
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Create AI-generated images of your future self using text prompts and reference photos.
                      </p>
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                        <h5 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Using Reference Photos
                        </h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Upload a clear, front-facing photo of yourself</li>
                          <li>• Good lighting and a neutral background work best</li>
                          <li>• The AI will place "you" into the generated scene</li>
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-400" />
                        Video Generation
                      </h4>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">Google Veo 3</p>
                          <p className="text-xs text-muted-foreground">Best quality with audio generation</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">Wan 2.1</p>
                          <p className="text-xs text-muted-foreground">Fast, high-quality general content</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">Kling v1.0</p>
                          <p className="text-xs text-muted-foreground">Video-to-video transformations</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-green-400" />
                        Voice Changer
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Transform your video's audio using ElevenLabs voices. Perfect for adding professional 
                        narration or affirmations to your visualizations.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mind Movie */}
              <TabsContent value="mind-movie" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Film className="w-6 h-6 text-gold" />
                      Mind Movie Studio
                    </CardTitle>
                    <CardDescription>
                      Create powerful visualization videos with AI-generated content and music
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-400" />
                        Script & Storyboard Wizard
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        The AI generates a complete storyboard based on your Chief Aim, creating scene-by-scene 
                        visual prompts that you can approve, edit, or regenerate.
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Music className="w-5 h-5 text-pink-400" />
                        AI Soundtrack Generator
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Choose from 50+ music genres across 10 categories. The AI generates personalized lyrics 
                        from your Chief Aim and creates a custom motivational track.
                      </p>
                    </div>

                    <Separator />

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-400">
                        <Film className="w-5 h-5" />
                        Important: Assembling Your Mind Movie
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Once you've generated your images, videos, and soundtrack, you'll need to <strong>download them and assemble your final Mind Movie using video editing software</strong>. This is a crucial creative step.
                      </p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>Recommended editors:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>Final Cut Pro</strong> — Professional, Mac only</li>
                          <li><strong>Adobe Premiere Pro</strong> — Industry standard</li>
                          <li><strong>CapCut</strong> — Free, beginner-friendly</li>
                          <li><strong>DaVinci Resolve</strong> — Free, powerful</li>
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <CirclePlay className="w-5 h-5 text-amber-400" />
                        The Theater
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        After editing, upload your completed Mind Movie to The Theater. The system tracks your viewing streak — 
                        watch daily for 90+ days to create lasting subconscious change.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>VR Compatible:</strong> Watch your Mind Movie on VR headsets for an even more immersive visualization experience.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Director AI */}
              <TabsContent value="director-ai" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-6 h-6 text-gold" />
                      Director AI — Your Personal Coach
                    </CardTitle>
                    <CardDescription>
                      A Jarvis-like voice assistant trained in the Psycho-Cinematics methodology
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                      <h4 className="font-semibold text-gold mb-2 flex items-center gap-2">
                        <Mic className="w-5 h-5" />
                        Voice-First Coaching
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Speak naturally to Director AI and receive personalized coaching based on your Chief Aim, 
                        daily progress, and the 7-Phase Framework. The AI remembers your conversation history.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-red-400" />
                        The CUT! Technique
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-2">
                        <li><strong>1. Recognize</strong> — Notice the off-script thought</li>
                        <li><strong>2. Cut</strong> — Mentally yell "CUT!" to stop the scene</li>
                        <li><strong>3. Reset</strong> — Take 3 deep breaths, reconnect with your Director self</li>
                        <li><strong>4. Resume</strong> — Take an aligned action that matches your Chief Aim</li>
                      </ol>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <h5 className="font-semibold text-amber-500 mb-2">What to Ask Director AI</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• "Help me overcome my fear of [specific fear]"</li>
                        <li>• "I'm procrastinating — what's really going on?"</li>
                        <li>• "Walk me through the CUT! technique"</li>
                        <li>• "Suggest my Three Things for today"</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Daily Rituals */}
              <TabsContent value="daily-rituals" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-gold" />
                      Daily Rituals & Accountability
                    </CardTitle>
                    <CardDescription>
                      The daily practices that compound into life-changing transformation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        Morning Ritual (10-15 minutes)
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-3">
                        <li className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0">1</span>
                          <div>
                            <p className="font-medium text-foreground">Read Your Chief Aim Aloud</p>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0">2</span>
                          <div>
                            <p className="font-medium text-foreground">Watch Your Mind Movie</p>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0">3</span>
                          <div>
                            <p className="font-medium text-foreground">Set Your Three Things</p>
                          </div>
                        </li>
                      </ol>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-gold" />
                        Daily Director Scorecard
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        End each day by rating yourself 0-3 on four categories:
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">Identity Alignment</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">Behavior Execution</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">Emotional Regulation</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">Forward Progress</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-gold" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Quick answers to common questions about the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help CTA */}
        <Card className="mt-12 border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
          <CardContent className="py-8 text-center">
            <MessageSquare className="w-10 h-10 text-gold mx-auto mb-3" />
            <h3 className="font-display text-2xl mb-2">Still Have Questions?</h3>
            <p className="text-muted-foreground mb-4">
              Talk to your AI Director coach for personalized guidance
            </p>
            <Link to="/">
              <Button variant="gold" className="gap-2">
                <Mic className="w-4 h-4" />
                Talk to Director AI
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DirectorsGuide;