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
  HelpCircle
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        title: "Upload Your Mind Movie",
        content: "In the Theater, upload a video visualization of your ideal life. This could be a compilation of images, affirmations, and inspiring clips set to motivating music."
      },
      {
        title: "Use the Script Wizard",
        content: "Launch the Mind Movie Script Wizard to create an AI-generated storyboard based on your Chief Aim. It will generate scenes, visuals, and even a custom soundtrack."
      },
      {
        title: "Generate AI Soundtrack",
        content: "Choose from 15+ music genres or create a custom style. The AI generates lyrics from your Chief Aim and produces a personalized motivational track."
      },
      {
        title: "Daily Viewing Ritual",
        content: "Watch your Mind Movie every morning. The Theater tracks your viewing streak - consistency is key to reprogramming your subconscious."
      }
    ],
    tips: [
      "Keep your Mind Movie under 5 minutes for maximum impact",
      "Watch it immediately upon waking when your mind is most receptive",
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
        content: "Generate AI videos using Sora 2 (for character-focused work) or Wan 2.1 (for general content). Videos support image-to-video for animating your generated images."
      },
      {
        title: "Manage Your Media Library",
        content: "All generated content is automatically saved. Access your library to view, download, or delete assets. You have 5GB of storage."
      }
    ],
    tips: [
      "Check credit costs before generating - videos use more credits than images",
      "Use descriptive prompts for better results",
      "Save your best prompts to reuse them later"
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
  },
  {
    id: "credits",
    icon: <Coins className="w-6 h-6" />,
    title: "Credits & Subscription",
    description: "Understanding the credit system",
    steps: [
      {
        title: "Monthly Allowance",
        content: "Subscribers receive 1,000 credits monthly ($10 value). Credits are used for AI generation: videos (~60 credits for 5 sec), images (~15 credits), and music (~25 credits)."
      },
      {
        title: "Track Your Balance",
        content: "Your credit balance is always visible in the header. Click it to see detailed usage and purchase options."
      },
      {
        title: "Purchase Additional Credits",
        content: "When you run low, buy credit packs: $5 (500), $10 (1,000), $20 (2,200 with bonus), or $30 (3,500 with bonus)."
      },
      {
        title: "Earn Gamification Credits",
        content: "Complete daily scorecards to earn Director Credits (separate from production credits). These contribute to your leaderboard ranking and unlock awards."
      }
    ],
    tips: [
      "Monitor your usage percentage in the header",
      "Credits never expire - purchased credits roll over",
      "Higher-tier packs include bonus credits"
    ]
  },
  {
    id: "community",
    icon: <Users className="w-6 h-6" />,
    title: "Director's Corner",
    description: "Connect with fellow Directors",
    steps: [
      {
        title: "Join the Community",
        content: "Access Director's Corner from the header navigation. This is your space to share wins, insights, and connect with others on the same journey."
      },
      {
        title: "Share Your Progress",
        content: "Create posts to share: Insights (lessons learned), Wins (achievements), Manifestations (goals realized), or Questions (seek advice)."
      },
      {
        title: "Engage with Others",
        content: "Like and comment on posts from fellow Directors. Building community strengthens everyone's commitment."
      },
      {
        title: "Customize Your Profile",
        content: "Set your public avatar and bio so others can recognize and connect with you."
      }
    ],
    tips: [
      "Celebrate your wins publicly - it reinforces your new identity",
      "Offer encouragement to others - what you give, you receive",
      "Ask questions when stuck - collective wisdom accelerates growth"
    ]
  }
];

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
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel anytime from Settings → Subscription. You'll retain access until the end of your billing period. Purchased credits never expire and remain available even after cancellation."
  }
];

const Tutorial = () => {
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
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Back Navigation */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-gold-gradient mb-4">
            Director's Handbook
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to master Psycho-Cinematics™ and become the Director of your life story.
          </p>
        </div>

        {/* Progress Tracker */}
        <Card className="mb-8 border-gold/20">
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

        <Tabs defaultValue="guides" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="guides" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Guides Tab */}
          <TabsContent value="guides" className="space-y-6">
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

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-gold" />
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

export default Tutorial;