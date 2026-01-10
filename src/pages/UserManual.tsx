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
  MessageSquare
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const UserManual = () => {
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
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-gold-gradient mb-4">
            Complete User Manual
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your comprehensive guide to mastering every feature of Psycho-Cinematics™ Director's OS
          </p>
        </div>

        <Tabs defaultValue="getting-started" className="space-y-8">
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
                          This is the foundation - everything else builds on it.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">2</span>
                      <div>
                        <p className="font-medium">Generate Your First Visualization</p>
                        <p className="text-sm text-muted-foreground">
                          Open the Edit Bay and create AI images of your future self living your Chief Aim. 
                          See yourself as if the goal is already achieved.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">3</span>
                      <div>
                        <p className="font-medium">Set Your Three Things</p>
                        <p className="text-sm text-muted-foreground">
                          Each morning, lock in 3 priority tasks that move you toward your Chief Aim. 
                          Small daily actions compound into massive transformation.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">4</span>
                      <div>
                        <p className="font-medium">Talk to Director AI</p>
                        <p className="text-sm text-muted-foreground">
                          Your AI coach knows your Chief Aim and tracks your progress. Ask for guidance, 
                          accountability, or use the CUT! technique when negative thoughts arise.
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
                    when they'd achieve it, what they'd give in exchange, and their plan. Without clarity, 
                    the subconscious has no target. With it, your mind works 24/7 to manifest it.
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
                        Exactly what you want to achieve or become. Be specific — "financial freedom" is vague; 
                        "$500,000 annual passive income from my education business" is clear.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-gold" />
                        <span className="font-medium">The Deadline (By When)</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        A specific date by which you'll achieve this goal. Deadlines create urgency and 
                        allow your subconscious to work backwards. "December 31, 2026" not "someday."
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-gold" />
                        <span className="font-medium">The Exchange (What You'll Give)</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Nothing is free. What will you sacrifice, invest, or commit? "4 focused hours daily," 
                        "give up entertainment to study," "invest 20% of income." Real commitment.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <ChevronRight className="w-5 h-5 text-gold" />
                        <span className="font-medium">The Plan (First Steps)</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Immediate actions you'll take. You don't need the whole path — just the next 2-3 steps. 
                        The path reveals itself as you walk it.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">How to Use the Chief Aim Wizard</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Click "Create Your Chief Aim" or the edit button on your Chief Aim card</li>
                    <li>2. The AI coach guides you through each of the 4 components</li>
                    <li>3. Chat naturally — the AI helps you refine vague ideas into powerful statements</li>
                    <li>4. Save each step as you complete it; preview shows your full aim</li>
                    <li>5. Review and read your Chief Aim aloud every morning and evening</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <h4 className="font-semibold text-amber-500 mb-2 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Pro Tip
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Read your Chief Aim aloud twice daily — morning and night. The repetition programs your 
                    Reticular Activating System (RAS) to notice opportunities aligned with your goal. 
                    This is why Maxwell Maltz called it "self-image psychology" — you become what you consistently see.
                  </p>
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
                {/* Image Generation */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-blue-400" />
                    Image Generation
                  </h4>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Create AI-generated images of your future self and goals using text prompts.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="font-medium text-sm mb-1">Basic Prompting</p>
                        <p className="text-xs text-muted-foreground">
                          Describe what you want: "A confident entrepreneur giving a keynote speech 
                          to a packed auditorium, professional lighting, cinematic"
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="font-medium text-sm mb-1">Reference Images</p>
                        <p className="text-xs text-muted-foreground">
                          Upload a photo of yourself to integrate your likeness. The AI uses this 
                          to create personalized visualizations with your face.
                        </p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <h5 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Using Reference Photos
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Upload a clear, front-facing photo of yourself</li>
                        <li>• Good lighting and a neutral background work best</li>
                        <li>• The AI will place "you" into the generated scene</li>
                        <li>• Perfect for visualizing yourself achieving your goals</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Video Generation */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-400" />
                    Video Generation
                  </h4>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Create dynamic video content to enhance your Mind Movie and visualizations.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="font-medium text-sm mb-1">Google Veo 3</p>
                        <p className="text-xs text-muted-foreground">
                          Highest quality with audio. Best for hero scenes and key moments.
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">~60 credits / 5sec</Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="font-medium text-sm mb-1">Wan 2.1</p>
                        <p className="text-xs text-muted-foreground">
                          Great for general content. Fast and reliable for most scenes.
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">~50 credits / 5sec</Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="font-medium text-sm mb-1">Kling v1.0</p>
                        <p className="text-xs text-muted-foreground">
                          Video editing mode. Apply effects to existing videos.
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">~40 credits / edit</Badge>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <h5 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        Image-to-Video Animation
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        Generate an image first, then animate it into a video. This gives you more 
                        control over the exact scene before adding motion. Great for hero shots where 
                        you want to see yourself in action.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Voice Changer */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-green-400" />
                    Voice Changer
                  </h4>
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <h5 className="font-semibold text-green-400 mb-2">Why Use Voice Changing?</h5>
                    <p className="text-sm text-muted-foreground mb-3">
                      The Voice Changer is perfect for creating <strong>affirmation videos</strong> where 
                      you hear yourself (or an idealized voice) speaking your Chief Aim and declarations. 
                      When you see and hear yourself stating your goals, your subconscious accepts it as reality.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Record affirmations and apply a confident voice</li>
                      <li>• Create narration for your Mind Movie</li>
                      <li>• Transform any video's audio to match your vision</li>
                      <li>• Choose from 10+ professional voice presets</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                {/* Media Library */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-amber-400" />
                    Media Library
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• All generated images, videos, and audio auto-save to your library</li>
                    <li>• 5GB storage limit — delete unused assets to free space</li>
                    <li>• Click any item to preview, download, or apply voice changes</li>
                    <li>• Use the refresh button if new items don't appear immediately</li>
                  </ul>
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
                  Mind Movie System
                </CardTitle>
                <CardDescription>
                  Your daily visualization ritual that programs success into your subconscious
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                  <h4 className="font-semibold text-gold mb-2">The Science Behind It</h4>
                  <p className="text-sm text-muted-foreground">
                    Your nervous system cannot distinguish between a vividly imagined experience and a real one. 
                    When you watch a Mind Movie showing you living your goals, your brain creates neural pathways 
                    as if it's already happening. This is the foundation of Olympic-level visualization training.
                  </p>
                </div>

                <Separator />

                {/* Theater View */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <CirclePlay className="w-5 h-5 text-gold" />
                    The Theater
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li><strong>Upload Your Mind Movie:</strong> Upload a video you've created or compiled that visualizes your achieved goals</li>
                    <li><strong>Daily Viewing Ritual:</strong> Watch your Mind Movie every morning right after waking</li>
                    <li><strong>Streak Tracking:</strong> The system tracks when you watch — aim for 90+ consecutive days</li>
                    <li><strong>Post-Viewing Tasks:</strong> After watching, you'll be prompted to set your Three Things for the day</li>
                  </ul>
                </div>

                <Separator />

                {/* Script Wizard */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-amber-500" />
                    Mind Movie Script Wizard
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use AI to generate a complete storyboard and soundtrack based on your Chief Aim.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-medium text-sm mb-1">Storyboard Generator</p>
                      <p className="text-xs text-muted-foreground">
                        AI creates scene-by-scene visual prompts based on your Chief Aim. 
                        Each scene includes a description, prompt, and emotional beat.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-medium text-sm mb-1">Soundtrack Generator</p>
                      <p className="text-xs text-muted-foreground">
                        Generate custom music with lyrics derived from your Chief Aim. 
                        Choose from 50+ genres across 10 categories.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <h5 className="font-semibold text-amber-500 mb-2 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Custom Soundtrack Tips
                  </h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Choose a genre that emotionally resonates with your goal</li>
                    <li>• The lyrics are auto-generated from your Chief Aim</li>
                    <li>• You can edit lyrics before generating</li>
                    <li>• Select vocal gender (or use a custom Persona ID for specific voices)</li>
                    <li>• Generate 1-2 versions to find the perfect match</li>
                  </ul>
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
                  A Jarvis-like AI assistant trained in Psycho-Cinematics methodology
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                  <h4 className="font-semibold text-gold mb-2">What Makes Director AI Different</h4>
                  <p className="text-sm text-muted-foreground">
                    Director AI isn't a generic chatbot — it's trained in the Psycho-Cinematics methodology, 
                    knows your Chief Aim, tracks your daily progress, and coaches you like a personal trainer 
                    for your mind. It uses movie director metaphors because <strong>you are directing the movie of your life</strong>.
                  </p>
                </div>

                <Separator />

                {/* How to Access */}
                <div>
                  <h4 className="font-semibold mb-3">How to Use</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Click the gold "Director AI" button in the bottom-right corner of the dashboard</li>
                    <li>• Speak naturally using voice (recommended) or type your message</li>
                    <li>• The AI responds with voice audio — toggle TTS on/off as needed</li>
                    <li>• Your conversation history is saved for continuity</li>
                  </ul>
                </div>

                <Separator />

                {/* CUT Technique */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-red-400" />
                    The CUT! Technique
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    When you catch yourself spiraling into negative thoughts, fear, or self-doubt, use this 4-step reset:
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                      <span className="text-2xl font-bold text-red-400">1</span>
                      <p className="font-medium text-sm mt-1">RECOGNIZE</p>
                      <p className="text-xs text-muted-foreground">Notice the off-script thought</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                      <span className="text-2xl font-bold text-red-400">2</span>
                      <p className="font-medium text-sm mt-1">CUT!</p>
                      <p className="text-xs text-muted-foreground">Mentally yell "CUT!" to stop</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                      <span className="text-2xl font-bold text-red-400">3</span>
                      <p className="font-medium text-sm mt-1">RESET</p>
                      <p className="text-xs text-muted-foreground">Take 3 deep breaths</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                      <span className="text-2xl font-bold text-red-400">4</span>
                      <p className="font-medium text-sm mt-1">RESUME</p>
                      <p className="text-xs text-muted-foreground">Take aligned action</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Director Suggestions */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                    Director's Suggestions
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Ask the AI to suggest tasks, and it will generate 3 actionable items based on your Chief Aim 
                    and current phase in the 7-Phase Framework. Each suggestion includes a "Director's Note" 
                    explaining its strategic importance.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <h5 className="font-semibold text-amber-500 mb-2">What to Ask Director AI</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• "Help me overcome my fear of [specific fear]"</li>
                    <li>• "I'm procrastinating on [task] — what's really going on?"</li>
                    <li>• "Give me a pep talk to get through today"</li>
                    <li>• "I just had a win — help me celebrate and build on it"</li>
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
                {/* Morning Ritual */}
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
                        <p>Start the day by reciting your Definite Chief Aim with emotion and conviction.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0">2</span>
                      <div>
                        <p className="font-medium text-foreground">Watch Your Mind Movie</p>
                        <p>Enter The Theater and watch your visualization video. Let it imprint on your subconscious.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0">3</span>
                      <div>
                        <p className="font-medium text-foreground">Set Your Three Things</p>
                        <p>Lock in 3 priority tasks that move you toward your Chief Aim today.</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <Separator />

                {/* Three Things */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    The Three Things System
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Each day, commit to exactly 3 high-impact tasks. Not 5, not 10 — three. 
                    This forces prioritization and ensures completion.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Tasks should directly connect to your Chief Aim</li>
                    <li>• Make them specific and completable within the day</li>
                    <li>• Check them off as you complete them</li>
                    <li>• The system celebrates your wins</li>
                  </ul>
                </div>

                <Separator />

                {/* Evening Scorecard */}
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
                      <p className="text-xs text-muted-foreground">
                        Did you think, speak, and act as the person you're becoming?
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-medium text-sm">Behavior Execution</p>
                      <p className="text-xs text-muted-foreground">
                        Did you complete your planned actions and Three Things?
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-medium text-sm">Emotional Regulation</p>
                      <p className="text-xs text-muted-foreground">
                        Did you maintain composure and use CUT! when needed?
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-medium text-sm">Forward Progress</p>
                      <p className="text-xs text-muted-foreground">
                        Did you move meaningfully closer to your Chief Aim?
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-gold/10 border border-gold/30">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-gold">Perfect Score (12/12):</strong> Oscar-worthy day! 
                      Consistent perfect scores unlock awards and bonus credits.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Streaks */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Streak System
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Your streak increases each day you complete your scorecard</li>
                    <li>• Streaks appear on the leaderboard — compete with fellow Directors</li>
                    <li>• Best streak is tracked separately — aim to beat your personal record</li>
                    <li>• 90+ day streaks trigger transformational neurological changes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-gold" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "How many credits do I get per month?",
                  a: "Subscribers receive 1,000 credits monthly ($10 value). You can purchase additional credits in packs of $10 (1,000), $20 (2,200 with bonus), or $30 (3,500 with bonus). Credits never expire."
                },
                {
                  q: "What's the best way to use reference images?",
                  a: "Upload a clear, front-facing photo of yourself with good lighting and a neutral background. The AI will integrate your likeness into generated scenes. This is perfect for creating visualizations where you see yourself achieving your goals."
                },
                {
                  q: "How long should my Mind Movie be?",
                  a: "Keep it under 5 minutes for maximum impact. Your brain maintains peak focus for about 3-5 minutes of visualization. Quality of emotion matters more than length."
                },
                {
                  q: "What if I miss a day?",
                  a: "Your streak resets, but that's okay — every Director has off-days. The key is to resume immediately. Don't let one missed day become two. Use the CUT! technique to reset and get back on track."
                },
                {
                  q: "Can I use this on mobile?",
                  a: "Yes! The platform is fully responsive. All features work on mobile, though the Edit Bay and longer forms are more comfortable on desktop."
                },
                {
                  q: "How does the AI know my progress?",
                  a: "Director AI accesses your Chief Aim, daily tasks, viewing history, and scorecard data. This allows it to give personalized coaching based on where you actually are, not generic advice."
                },
                {
                  q: "What's the difference between Production Credits and Engagement Credits?",
                  a: "Production Credits ($0.01 each) are used for AI generation — images, videos, music. Engagement Credits are earned through daily activity and contribute to your leaderboard ranking and awards."
                }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="text-center mt-12 p-6 rounded-xl bg-muted/30 border border-border/50">
          <MessageSquare className="w-10 h-10 text-gold mx-auto mb-3" />
          <h3 className="font-display text-xl mb-2">Need More Help?</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Talk to Director AI anytime for personalized guidance, or visit the Director's Corner 
            to connect with fellow Directors on the same journey.
          </p>
        </div>
      </main>
    </div>
  );
};

export default UserManual;