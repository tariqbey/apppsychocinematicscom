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
  User,
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
  GraduationCap,
  Share2,
  Bell,
  FileText,
  Send,
  Plug,
  Scissors,
  LayoutGrid,
  Timer,
  TrendingUp,
  Globe,
  Layers,
  Save,
  Download,
  ExternalLink,
  Instagram,
  Twitter,
  Facebook,
  Mic2,
  RotateCcw,
  Map
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
    id: "chief-aim",
    icon: <Target className="w-6 h-6" />,
    title: "⭐ Start Here: Definite Chief Aim",
    description: "THE FOUNDATION — Everything else depends on this",
    steps: [
      {
        title: "Why This Comes First",
        content: "Your Definite Chief Aim is the ROOT of your entire transformation. It's not just a goal — it's a crystal-clear statement of your burning desire, when you'll achieve it, what you'll sacrifice, and your immediate plan. Nothing else works without this foundation in place."
      },
      {
        title: "Launch the AI Wizard",
        content: "On your dashboard, click the gold 'Start Here: Definite Chief Aim' card. The AI-guided wizard walks you through Napoleon Hill's proven 4-phase framework with personalized coaching."
      },
      {
        title: "Phase 1: The Dream (What)",
        content: "Define your burning desire in vivid, specific terms. Not a vague wish, but a clear picture of your Final Scene. Help yourself see it, feel it, taste it."
      },
      {
        title: "Phase 2: The Deadline (By When)",
        content: "Set a specific date that creates urgency. Ambitious yet believable. This is when your Final Scene plays out in reality."
      },
      {
        title: "Phase 3: The Exchange (What I Give)",
        content: "Nothing comes free. Define the habits, time, comfort, and sacrifices you'll commit. This is the price of your transformation."
      },
      {
        title: "Phase 4: The Plan (How)",
        content: "Outline your immediate next actions. Not the whole journey, but the first steps that begin your transformation TODAY."
      },
      {
        title: "Review Daily",
        content: "Your Chief Aim appears on your dashboard. Read it aloud every morning and evening as part of your ritual. This statement becomes the lyrics of your Mind Movie."
      }
    ],
    tips: [
      "Be specific about what you want — vague goals produce vague results",
      "Set a deadline that stretches you but feels achievable",
      "Your exchange should reflect real sacrifice and commitment",
      "This becomes the foundation for your Mind Movie's lyrics and scenes",
      "Without a clear Chief Aim, all other tools are just entertainment"
    ]
  },
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
        title: "Complete Your Chief Aim FIRST",
        content: "Before anything else, click the gold 'Start Here: Definite Chief Aim' card on your dashboard. This is THE foundation that everything else builds upon."
      },
      {
        title: "Explore the Dashboard",
        content: "Your dashboard is mission control. Once your Chief Aim is set, you'll see it displayed prominently along with daily tasks, streak progress, and access to all studio tools."
      },
      {
        title: "Connect Integrations",
        content: "Visit Settings → Integrations to connect Notion, Slack, Telegram, ElevenLabs, and social media for a seamless workflow experience."
      }
    ],
    tips: [
      "Your Chief Aim must be defined before you can create effective Mind Movies",
      "Enable notifications to stay on track with your daily rituals",
      "Connect Notion to automatically sync your journal and scorecards"
    ]
  },
  {
    id: "character-builder",
    icon: <User className="w-6 h-6" />,
    title: "Character Builder & Hero Creator",
    description: "Create your hero identity and discover your Director archetype",
    steps: [
      {
        title: "Create Your Hero Character (NEW!)",
        content: "Go to Character Builder → Create tab. Upload a reference photo of yourself, then describe your 'best self' traits: height, weight, build, and distinguishing features. This data powers all AI-generated images."
      },
      {
        title: "Generate Hero Images",
        content: "Click 'Generate Hero Images' to create professional front, side, and back views. These become your standardized character identity used across Mind Movies, Challenge Storyboards, and all visualizations."
      },
      {
        title: "Download & Save",
        content: "Hover over any hero image to download it individually, or use 'Download All' to save the complete set. Images are automatically saved to your profile and used as AI generation references."
      },
      {
        title: "Take the Archetype Survey",
        content: "Complete the 28-question Napoleon Hill character assessment. Answer honestly — 'Shadow' options reveal growth areas. Your responses determine your dominant Director archetype."
      },
      {
        title: "Understand Your Archetype",
        content: "Discover which of the 12 Director archetypes you embody: Sovereign, Master Builder, Wayfinder, Alchemist, Divine Analyst, Truth Keeper, Sacred Judge, Protector, Harmonizer, Weaver, or Still Center."
      },
      {
        title: "Review Light & Shadow States",
        content: "Each archetype has a Light state (your strengths) and Shadow state (growth areas). Understanding both is essential for transformation."
      },
      {
        title: "Use the Character Scorecard",
        content: "Track your character development daily. Rate yourself on key traits required for your Chief Aim and see your progress over time."
      },
      {
        title: "Transformation Coach",
        content: "Get AI-powered coaching tailored to your archetype and Chief Aim. The coach identifies gaps between who you are and who you need to become. Click 'Create Your Transformation Script' to generate a Mind Movie based on your required character."
      }
    ],
    tips: [
      "Create your Hero Character BEFORE generating Mind Movies for consistent identity",
      "Your hero images appear in all AI-generated scenes featuring you",
      "Shadow answers reveal your biggest growth opportunities — don't avoid them",
      "Retake the survey after major life changes to see how you've evolved",
      "Download hero images to use in external video editors if needed"
    ]
  },
  {
    id: "transformation-cycles",
    icon: <RotateCcw className="w-6 h-6" />,
    title: "21-Day Transformation Cycles",
    description: "The science-backed rhythm for lasting behavioral change",
    steps: [
      {
        title: "Understand the 21-Day Principle",
        content: "Research shows it takes approximately 21 days to form new neural pathways and habits. Each 21-day cycle is a focused period for embedding one aspect of your transformation."
      },
      {
        title: "Start Your Transformation",
        content: "Go to Character Builder → 21 Days tab and click 'Start Day 1' to begin your transformation journey. This sets your start date and begins tracking your progress."
      },
      {
        title: "The 3-4-3 Act Structure",
        content: "Your full transformation spans 210 days across 3 Acts: Act I (3 cycles/63 days) for Awakening, Act II (4 cycles/84 days) for Integration, and Act III (3 cycles/63 days) for Mastery."
      },
      {
        title: "Track Your Daily Progress",
        content: "The Cycle Progress card shows your current day within the cycle, days until review, and overall act progress. Use the Transformation Roadmap to see your entire journey at a glance."
      },
      {
        title: "Complete Cycle Reviews",
        content: "On Day 21 of each cycle, complete a Cycle Review. This includes scorecard averages, character archetype comparison, AI progress analysis, and personal reflection."
      },
      {
        title: "Monitor Archetype Shifts",
        content: "Retake the Character Survey at the end of each cycle. The system tracks whether your archetype has shifted, showing your evolution from cycle to cycle."
      }
    ],
    tips: [
      "Consistency beats intensity — show up every day of the 21-day cycle",
      "Each act builds on the previous — don't skip ahead",
      "Act II (Integration) is the longest because deep change takes time",
      "Use the Roadmap to visualize your progress across all 10 cycles",
      "Celebrate completing each cycle — they're major milestones"
    ]
  },
  {
    id: "mind-movie",
    icon: <Film className="w-6 h-6" />,
    title: "Mind Movie Studio",
    description: "Create and watch your personal visualization movie",
    steps: [
      {
        title: "Ensure Chief Aim is Complete",
        content: "Before creating your Mind Movie, your Definite Chief Aim must be defined. The wizard uses your Chief Aim to generate scenes, lyrics, and visuals automatically."
      },
      {
        title: "Use the Script Wizard",
        content: "Launch the Mind Movie Script Wizard to create an AI-generated storyboard based on your Chief Aim. It generates scenes, visuals, and even a custom soundtrack."
      },
      {
        title: "Generate & Download Assets",
        content: "Use 'Auto-Generate All' to create images and videos for each scene. Download all assets from the Media Library."
      },
      {
        title: "Use Timeline Editor or External Software",
        content: "Use the built-in Timeline Editor to stitch your assets together, or export to Final Cut Pro, CapCut, or DaVinci Resolve for advanced editing."
      },
      {
        title: "Upload Your Final Mind Movie",
        content: "Once edited, upload your completed Mind Movie to The Theater via the Movie Vault. Watch it daily for maximum impact."
      },
      {
        title: "Daily Viewing Ritual",
        content: "Watch your Mind Movie every morning. The Theater tracks your viewing streak - consistency is key to reprogramming your subconscious."
      }
    ],
    tips: [
      "Your Chief Aim becomes the foundation of your Mind Movie's scenes and lyrics",
      "Keep your Mind Movie under 5 minutes for maximum impact",
      "Use the Timeline Editor for quick edits without leaving the platform",
      "Your viewing streak appears on the dashboard - aim for 90+ days"
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
        content: "Launch the Mind Movie Script Wizard to create an AI-generated storyboard based on your Chief Aim. It generates scenes, visuals, and even a custom soundtrack."
      },
      {
        title: "Generate & Download Assets",
        content: "Use 'Auto-Generate All' to create images and videos for each scene. Download all assets from the Media Library."
      },
      {
        title: "Use Timeline Editor or External Software",
        content: "Use the built-in Timeline Editor to stitch your assets together, or export to Final Cut Pro, CapCut, or DaVinci Resolve for advanced editing."
      },
      {
        title: "Upload Your Final Mind Movie",
        content: "Once edited, upload your completed Mind Movie to The Theater via the Movie Vault. Watch it daily for maximum impact."
      },
      {
        title: "Daily Viewing Ritual",
        content: "Watch your Mind Movie every morning. The Theater tracks your viewing streak - consistency is key to reprogramming your subconscious."
      }
    ],
    tips: [
      "Keep your Mind Movie under 5 minutes for maximum impact",
      "Use the Timeline Editor for quick edits without leaving the platform",
      "Watch on a VR headset for maximum immersion",
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
        content: "Use text prompts to create images of your future self and goals. Upload reference photos for personal likeness integration."
      },
      {
        title: "Create Videos",
        content: "Generate AI videos using Veo 3 (with audio), Wan 2.1, or Kling v1.0. Videos support text-to-video, image-to-video and video-to-video."
      },
      {
        title: "Use the Timeline Editor",
        content: "Access the Timeline tab for a professional non-linear video editor with multi-track support, transitions, and audio mixing."
      },
      {
        title: "Export Your Creation",
        content: "Export in 720p, 1080p, or 4K. Review your export before saving to the Movie Vault or downloading."
      }
    ],
    tips: [
      "Check credit costs before generating - videos use more credits than images",
      "Use the Voice Changer to add professional narration to your videos",
      "The Timeline Editor supports undo/redo, razor cuts, and multi-select"
    ]
  },
  {
    id: "director-ai",
    icon: <Mic className="w-6 h-6" />,
    title: "Director AI Coach",
    description: "Your personal Jarvis-like voice coach with customizable personality",
    steps: [
      {
        title: "Start a Session",
        content: "Click 'Talk to Director AI' on your dashboard to launch the full-screen voice coaching interface."
      },
      {
        title: "Choose Your Voice & Personality",
        content: "Click the Settings icon to select from 10 different AI voices (5 male, 5 female) and 6 personality presets: Swag Coach, Executive Coach, Hype Master, Zen Guide, Drill Sergeant, or Best Friend."
      },
      {
        title: "Speak Naturally",
        content: "The AI listens to you speak and responds with personalized coaching based on your Chief Aim, daily progress, and the Psycho-Cinematics methodology."
      },
      {
        title: "Use the CUT! Technique",
        content: "When spiraling into negative thoughts, the AI guides you through the 4-step reset: Recognize, Cut, Reset (3 breaths), and Resume with aligned action."
      },
      {
        title: "Get Daily Suggestions",
        content: "The AI generates 3 actionable tasks based on your Chief Aim. These appear as 'Director's Suggestions' and align with your current phase."
      }
    ],
    tips: [
      "Choose a personality that matches your coaching style preference",
      "Use voice mode for a hands-free coaching experience",
      "The AI remembers your conversation history for continuity",
      "Press 'Stop & Exit' to immediately end the conversation and silence audio"
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
        content: "Your dashboard shows your 3 priority tasks. Check them off as you complete them throughout the day. If you don't complete a task, select an excuse reason for behavioral tracking."
      },
      {
        title: "Evening Scorecard",
        content: "End each day with the Daily Director Scorecard. Rate yourself 0-3 on four categories: Identity Alignment, Behavior Execution, Emotional Regulation, and Forward Progress."
      },
      {
        title: "Build Your Streak",
        content: "Consecutive days of completed scorecards build your streak. The streak banner on your dashboard celebrates your consistency."
      },
      {
        title: "View Excuse Analytics",
        content: "Visit the Actions page to see patterns in your incomplete tasks. The Excuse Analytics dashboard reveals your most common barriers."
      }
    ],
    tips: [
      "Perfect scores (12/12) earn bonus credits",
      "Be honest on your scorecard - it's a tool for growth, not ego",
      "Review your weekly scores to identify patterns",
      "The excuse tracking helps identify recurring blockers"
    ]
  },
  {
    id: "journal",
    icon: <FileText className="w-6 h-6" />,
    title: "Director's Journal",
    description: "Record your experiences and gain AI-powered insights",
    steps: [
      {
        title: "Write Daily Entries",
        content: "Use the Director's Journal to record your thoughts, wins, challenges, and reflections. Tag entries and track your mood."
      },
      {
        title: "Get AI Analysis",
        content: "Each entry can be analyzed by AI to identify patterns, limiting beliefs, and growth opportunities aligned with your Chief Aim."
      },
      {
        title: "Track Mood Trends",
        content: "The Mood Trend Chart visualizes your emotional patterns over time, helping you identify what drives your best days."
      },
      {
        title: "Sync to Notion",
        content: "Enable Notion auto-sync to automatically backup all journal entries to your Notion workspace."
      }
    ],
    tips: [
      "Journal in the evening to capture the full day's experience",
      "Use tags consistently to track recurring themes",
      "Review past entries when the AI analyzes patterns"
    ]
  },
  {
    id: "integrations",
    icon: <Plug className="w-6 h-6" />,
    title: "Integrations & Sharing",
    description: "Connect external tools for a seamless workflow",
    steps: [
      {
        title: "Connect Notion",
        content: "Sync your journal entries, Chief Aim, and daily scorecards automatically to your Notion workspace for permanent records."
      },
      {
        title: "Set Up Slack/Telegram Notifications",
        content: "Receive morning ritual reminders, evening scorecard prompts, and achievement notifications directly in Slack or Telegram."
      },
      {
        title: "Connect Social Media",
        content: "Link Facebook, Instagram, X (Twitter), and TikTok to share your wins and manifestations with automatic 'Posted from Psycho-Cinematics' branding."
      },
      {
        title: "Add ElevenLabs",
        content: "Connect your personal ElevenLabs API key to access your cloned voices for the Voice Changer feature."
      },
      {
        title: "Configure Reminders",
        content: "Set custom reminder times for morning rituals, journal prompts, and evening scorecards. View your reminder history in Settings."
      }
    ],
    tips: [
      "All integrations are managed in Settings → Integrations",
      "Notion sync includes your Chief Aim components for backup",
      "Social posts include inspirational hashtags automatically",
      "Web Push notifications work as a backup if Slack/Telegram aren't configured"
    ]
  },
  {
    id: "soundtrack-studio",
    icon: <Music className="w-6 h-6" />,
    title: "Soundtrack Studio",
    description: "Create custom soundtracks and access Director Radio",
    steps: [
      {
        title: "Access Soundtrack Studio",
        content: "Click the 'Soundtrack Studio' card on your dashboard to enter the music creation and radio hub."
      },
      {
        title: "Generate Custom Soundtracks",
        content: "Use the Mind Movie Wizard's soundtrack generator to create AI-powered songs with 50+ genre options, vocal customization, and optional lyrics based on your Chief Aim."
      },
      {
        title: "Listen to Director Radio",
        content: "Browse curated playlists and featured tracks from the community. Listen to motivation-boosting music while you work on your transformation."
      },
      {
        title: "Submit to Director Radio",
        content: "In the Media Library, click 'Submit to Radio' on any audio track you've generated. Admins review submissions and add approved tracks to community playlists."
      },
      {
        title: "Now Playing & Featured",
        content: "The Director Radio card on your dashboard shows the current 'Now Playing' track. Tune in for curated transformation soundtracks."
      }
    ],
    tips: [
      "Generate soundtracks that match your Chief Aim energy for maximum impact",
      "Submit your best audio creations to be featured on Director Radio",
      "Use Director Radio as background motivation during your daily rituals"
    ]
  },
  {
    id: "community",
    icon: <Users className="w-6 h-6" />,
    title: "Community & Awards",
    description: "Share your work and compete for recognition",
    steps: [
      {
        title: "Submit to Community",
        content: "In the Movie Vault, click 'Submit to Community' on any completed Mind Movie to share it with other Directors for voting and feedback."
      },
      {
        title: "Vote for Mind Movies",
        content: "Browse community submissions in the Director's Corner and vote for your favorites. Top-voted movies are featured as 'Movie of the Week'."
      },
      {
        title: "Earn Recognition",
        content: "High performers are recognized as 'Director of the Month' based on streak consistency, scorecard averages, and community engagement."
      },
      {
        title: "Annual Awards Ceremony",
        content: "Visit the Awards Ceremony page (/awards) to see yearly winners across categories like Best Mind Movie, Longest Streak, Most Transformative Director, and Rising Star."
      }
    ],
    tips: [
      "Submitting to community helps inspire other Directors on their journey",
      "Movie of the Week and Director of the Month are selected weekly/monthly",
      "Check the Awards page at /awards to see past winners and current standings"
    ]
  }
];

// Combined FAQs
const faqs = [
  {
    question: "What is Psycho-Cinematics™?",
    answer: "Psycho-Cinematics™ is a transformational methodology that combines Maxwell Maltz's Psycho-Cybernetics, Napoleon Hill's Think and Grow Rich principles, and modern AI technology. It treats your life as a movie where you are both the Director and the star, using visualization, daily rituals, and identity shifting to manifest your goals."
  },
  {
    question: "How does the 7-Phase Framework work?",
    answer: "The framework guides you through: 1) The Awakening - realizing you can change, 2) The Vision - defining your Chief Aim, 3) The Script - writing your new story, 4) Pre-Production - building habits and systems, 5) Principal Photography - taking daily action, 6) Post-Production - refining and adjusting, 7) The Premiere - achieving and celebrating your goal. This is complemented by the 21-Day Cycle system that structures your daily practice."
  },
  {
    question: "What is the 21-Day Transformation Cycle?",
    answer: "The 21-Day Cycle is the fundamental unit of behavioral change. Research shows it takes approximately 21 days to form new neural pathways. Each cycle focuses on embedding specific habits and character traits, ending with a comprehensive review of your progress."
  },
  {
    question: "What is the 3-4-3 Act Structure?",
    answer: "Your transformation journey spans 210 days (10 cycles) across 3 Acts: Act I 'The Awakening' (3 cycles, 63 days) establishes your foundation, Act II 'The Integration' (4 cycles, 84 days) is the longest act for deep behavioral change, and Act III 'The Mastery' (3 cycles, 63 days) solidifies your new identity."
  },
  {
    question: "How do I start my 21-Day Transformation?",
    answer: "Go to Character Builder → 21 Days tab and click 'Start Day 1'. This sets your official transformation start date and begins tracking your progress through the cycles and acts. The Transformation Roadmap shows your entire 210-day journey at a glance."
  },
  {
    question: "What happens at the end of each 21-day cycle?",
    answer: "On Day 21, you complete a Cycle Review that includes: 1) Scorecard averages for the cycle, 2) Character archetype comparison (before/after), 3) AI-generated progress analysis, 4) Personal reflection on biggest wins and challenges, and 5) Commitment for the next cycle."
  },
  {
    question: "What's included in the subscription?",
    answer: "The $29/month subscription includes 1,000 monthly credits for AI generation, unlimited access to Director AI coaching, Mind Movie tools, the Edit Bay studio, Timeline Editor, daily tracking features, and community access. You also get a 3-day free trial with 250 credits to explore."
  },
  {
    question: "How do I use the Timeline Editor?",
    answer: "The Timeline Editor is a professional non-linear video editor. Import media from your library, use the Razor tool (C) to cut clips, drag to reorder, adjust audio levels per clip or track, add fade-in/out effects, and export in up to 4K quality. Use keyboard shortcuts: V for Select, C for Razor, R for Range, H for Hand, and A to add audio."
  },
  {
    question: "How do I connect Notion?",
    answer: "Go to Settings → Integrations → Notion. Create an integration at notion.so/my-integrations, copy your token, then share your target database with the integration. Your journal entries, Chief Aim, and scorecards will sync automatically."
  },
  {
    question: "How do I set up Slack/Telegram notifications?",
    answer: "For Slack: Create a bot at api.slack.com/apps, add chat:write scope, install to workspace, copy the Bot Token and Channel ID. For Telegram: Message @BotFather, create a new bot, copy the token and your chat ID. Enter these in Settings → Integrations."
  },
  {
    question: "How do I share directly to social media?",
    answer: "Connect your social accounts in Settings → Integrations → Social Media. Once connected, use the Share menu on any content to post directly. Posts automatically include 'Posted from Psycho-Cinematics' branding and relevant hashtags."
  },
  {
    question: "What is the CUT! technique?",
    answer: "CUT! is a 4-step mental reset technique for when you catch yourself in negative thought patterns: 1) Recognize - notice the off-script thought, 2) Cut - mentally yell 'CUT!' to stop the scene, 3) Reset - take 3 deep breaths and reconnect with your Director self, 4) Resume - take an aligned action that matches your Chief Aim identity."
  },
  {
    question: "How do I get the best results from AI generation?",
    answer: "Be specific and descriptive in your prompts. Include details about setting, lighting, mood, and style. For personal likeness, upload clear reference photos. Start with images before creating videos, as you can use image-to-video to animate your best images."
  },
  {
    question: "How long should I watch my Mind Movie?",
    answer: "Watch your Mind Movie every morning right after waking (when your mind is most suggestible) and every evening before sleep. Keep the video under 5 minutes for maximum focus. Consistency matters more than duration - a 90-day streak is transformational."
  },
  {
    question: "How many credits do I get per month?",
    answer: "Subscribers receive 1,000 credits monthly ($10 value). You can purchase additional credits in packs of $10 (1,000), $20 (2,200 with bonus), or $30 (3,500 with bonus). Credits never expire."
  },
  {
    question: "How do I use the Voice Changer?",
    answer: "In the Edit Bay, select a video and open the Voice Changer panel. Choose an ElevenLabs voice (or connect your own API key for cloned voices), and the system will transform the video's audio. The result is automatically merged and saved."
  },
  {
    question: "Can I export my Mind Movie?",
    answer: "Yes! Use the Timeline Editor to assemble your scenes, then click 'Export Movie'. Choose your resolution (720p, 1080p, or 4K), review the export, and save to the Movie Vault or download directly."
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel anytime from Settings → Subscription. You'll retain access until the end of your billing period. Purchased credits never expire and remain available even after cancellation."
  },
  {
    question: "How do I change the Director AI voice?",
    answer: "In the Director AI interface, click the Settings icon (gear) to access Voice & Personality settings. Choose from 10 AI voices — 5 male (Adam, Antoni, Charlie, Daniel, Marcus) and 5 female (Charlotte, Jessica, Lily, Sarah, Nicole). Your selection is saved automatically."
  },
  {
    question: "What personality presets are available for Director AI?",
    answer: "There are 6 personality presets: Swag Coach (confident street energy), Executive Coach (professional strategic), Hype Master (high energy motivation), Zen Guide (calm mindful approach), Drill Sergeant (direct no-nonsense), and Best Friend (warm supportive). Each changes how the AI communicates while maintaining the Psycho-Cinematics methodology."
  },
  {
    question: "How do I submit my Mind Movie to the community?",
    answer: "Open the Movie Vault from the Mind Movie Studio. Find a completed movie with a video, then click 'Submit to Community'. Add a description and confirm. Your movie will appear in the community voting pool where other Directors can vote and provide feedback."
  },
  {
    question: "What is Movie of the Week?",
    answer: "Each week, administrators select the top community-voted Mind Movie to be featured. Winners get prominent placement on the platform and recognition in the community. Keep creating great content and engaging with others to increase your chances."
  },
  {
    question: "How do I become Director of the Month?",
    answer: "Director of the Month is awarded based on streak consistency, daily scorecard averages, and community engagement. Maintain your daily rituals, score honestly on your scorecards, participate in the community, and you'll be in the running."
  },
  {
    question: "Where can I see the Annual Awards?",
    answer: "Visit the Awards Ceremony page at /awards to see yearly statistics, category winners, and the leaderboards. Awards include Best Mind Movie, Longest Streak, Top Director Score, Most Movies Created, Community Favorite, and Rising Star."
  },
  {
    question: "What is Director Radio?",
    answer: "Director Radio is a curated music streaming feature within Psycho-Cinematics™. It includes admin-curated playlists, community-submitted tracks, and featured 'Now Playing' songs. Listen while you work on your transformation for motivation and focus."
  },
  {
    question: "How do I submit my soundtrack to Director Radio?",
    answer: "In the Media Library (Edit Bay → My Gallery), find any audio track you've generated. Click the 'Submit to Radio' button in the lightbox view. Add a track title and artist name, then submit. Admins will review and approve tracks for community playlists."
  },
  {
    question: "Can I listen to podcasts on Director Radio?",
    answer: "Yes! Director Radio supports external podcast and livestream URLs. Admins can add podcast feeds that appear alongside music playlists. Check the Streams section in the Radio Player for available podcasts."
  },
  {
    question: "How do I generate a custom soundtrack?",
    answer: "Use the Mind Movie Script Wizard → Soundtrack step. Choose from 50+ genres across 10 categories, select vocal gender, and optionally add custom lyrics based on your Chief Aim. Generate 1-2 songs at once with AI-powered music creation."
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
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 h-auto">
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
            <TabsTrigger value="user-manual" className="gap-2 py-3">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">User Manual</span>
              <span className="sm:hidden">Guide</span>
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
                  Start
                </TabsTrigger>
                <TabsTrigger value="chief-aim" className="gap-2">
                  <Target className="w-4 h-4" />
                  Chief Aim
                </TabsTrigger>
                <TabsTrigger value="hero-character" className="gap-2">
                  <User className="w-4 h-4" />
                  Hero
                </TabsTrigger>
                <TabsTrigger value="edit-bay" className="gap-2">
                  <Palette className="w-4 h-4" />
                  Edit Bay
                </TabsTrigger>
                <TabsTrigger value="timeline" className="gap-2">
                  <Layers className="w-4 h-4" />
                  Timeline
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
                  Rituals
                </TabsTrigger>
                <TabsTrigger value="integrations" className="gap-2">
                  <Plug className="w-4 h-4" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger value="community" className="gap-2">
                  <Trophy className="w-4 h-4" />
                  Community
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
                            <p className="font-medium">Connect Your Integrations</p>
                            <p className="text-sm text-muted-foreground">
                              Visit Settings → Integrations to connect Notion, Slack, Telegram, and social accounts.
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

              {/* Hero Character */}
              <TabsContent value="hero-character" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-6 h-6 text-gold" />
                      Hero Character Creator
                    </CardTitle>
                    <CardDescription>
                      Create your standardized "Best Self" identity for all AI-generated visualizations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                      <h4 className="font-semibold text-gold mb-2">Why Create a Hero Character?</h4>
                      <p className="text-sm text-muted-foreground">
                        Your Hero Character is the visual representation of your "Best Self" — the person you are becoming. 
                        By defining your physical traits and generating standardized hero images (front, side, back), the AI 
                        can consistently place YOU into all generated scenes across Mind Movies, Challenge Storyboards, and visualizations.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Step-by-Step Process</h4>
                      <ol className="space-y-4">
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">1</span>
                          <div>
                            <p className="font-medium">Upload Reference Photo</p>
                            <p className="text-sm text-muted-foreground">
                              Go to <strong>Character Builder → Create</strong> tab. Upload a clear, front-facing photo of yourself. 
                              Good lighting and neutral backgrounds work best.
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">2</span>
                          <div>
                            <p className="font-medium">Describe Your Ideal Self</p>
                            <p className="text-sm text-muted-foreground">
                              Enter your desired physical characteristics: height, weight, build (muscular, lean, athletic), 
                              and any additional features (hair style, clothing preferences, distinguishing characteristics).
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">3</span>
                          <div>
                            <p className="font-medium">Save Description</p>
                            <p className="text-sm text-muted-foreground">
                              Click "Save Description" to persist your character traits. These are stored in your profile 
                              and used to enhance all AI image generation prompts.
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">4</span>
                          <div>
                            <p className="font-medium">Generate Hero Images</p>
                            <p className="text-sm text-muted-foreground">
                              Click "Generate Hero Images" to create professional front, side, and back views on a neutral gray background. 
                              This creates your standardized character sheet.
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">5</span>
                          <div>
                            <p className="font-medium">Download & Use</p>
                            <p className="text-sm text-muted-foreground">
                              Hover over any image to download individually, or use "Download All" for the complete set. 
                              These images are automatically used as references for all future AI generations.
                            </p>
                          </div>
                        </li>
                      </ol>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4">Where Hero Images Are Used</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">🎬 Mind Movie Wizard</p>
                          <p className="text-xs text-muted-foreground">Scene generation uses your hero as the main character</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">⚔️ Challenge Storyboards</p>
                          <p className="text-xs text-muted-foreground">Adversity visualizations feature your hero identity</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">🎨 Edit Bay Generations</p>
                          <p className="text-xs text-muted-foreground">Reference photos auto-load from your hero set</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">📺 Episode Productions</p>
                          <p className="text-xs text-muted-foreground">Episode-specific Mind Movies use your identity</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-green-400">Pro Tip:</strong> Create your Hero Character BEFORE generating Mind Movies 
                        or Challenge Storyboards. This ensures visual consistency across all your content.
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
                      <p className="text-sm text-muted-foreground mb-3">
                        Transform your video's audio using ElevenLabs voices. Perfect for adding professional 
                        narration or affirmations to your visualizations.
                      </p>
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-sm text-muted-foreground">
                          <strong className="text-green-400">Tip:</strong> Connect your own ElevenLabs API key in Settings → Integrations to use your cloned voices.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-amber-400" />
                        Media Library
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        All generated assets are saved to your Media Library (10GB limit). Filter by type, sort by date, 
                        and multi-select items to import into the Timeline Editor.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timeline Editor */}
              <TabsContent value="timeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-6 h-6 text-gold" />
                      Timeline Editor
                    </CardTitle>
                    <CardDescription>
                      Professional non-linear video editing right in your browser
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                      <h4 className="font-semibold text-gold mb-2">Overview</h4>
                      <p className="text-sm text-muted-foreground">
                        The Timeline Editor is a full-featured video editor with multi-track support, razor cuts, 
                        audio mixing, fade effects, and export up to 4K resolution. No external software needed.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Keyboard Shortcuts</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">V</kbd>
                          <span className="text-sm">Select Tool</span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">C</kbd>
                          <span className="text-sm">Razor Tool (Cut)</span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">R</kbd>
                          <span className="text-sm">Range Select</span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">H</kbd>
                          <span className="text-sm">Hand Tool (Pan)</span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">A</kbd>
                          <span className="text-sm">Add Audio</span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">Space</kbd>
                          <span className="text-sm">Play/Pause</span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">⌘/Ctrl + Z</kbd>
                          <span className="text-sm">Undo</span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">⌘/Ctrl + S</kbd>
                          <span className="text-sm">Save Project</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4">Features</h4>
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Scissors className="w-4 h-4 text-gold mt-0.5" />
                          <span><strong>Razor Tool:</strong> Click anywhere on a clip to cut it precisely. Gold scissors cursor shows where you'll cut.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Volume2 className="w-4 h-4 text-gold mt-0.5" />
                          <span><strong>Audio Mixing:</strong> Adjust volume per clip, per track, or master level. Solo/mute tracks for fine-tuning.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Music className="w-4 h-4 text-gold mt-0.5" />
                          <span><strong>Fade Effects:</strong> Add fade-in/out to audio clips up to 5 seconds (or half clip length).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Save className="w-4 h-4 text-gold mt-0.5" />
                          <span><strong>Project Save:</strong> Save your timeline to continue editing later. Load previous projects anytime.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Download className="w-4 h-4 text-gold mt-0.5" />
                          <span><strong>Export:</strong> Render in 720p, 1080p, or 4K. Review before saving to Movie Vault or downloading.</span>
                        </li>
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
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <p className="text-sm text-muted-foreground">
                          <strong className="text-purple-400">Auto-Generate All:</strong> One click to generate images for all scenes, 
                          then videos, then import everything into the Timeline Editor.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Music className="w-5 h-5 text-pink-400" />
                        Custom Soundtrack
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Generate AI music in 50+ genres across 10 categories. Choose vocal gender, add lyrics 
                        based on your Chief Aim, or use a custom Suno Persona ID.
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <CirclePlay className="w-5 h-5 text-blue-400" />
                        Movie Vault
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Manage multiple Mind Movies. Set one as "active" for your daily viewing ritual. 
                        Preview, rename, duplicate, or delete projects from the vault.
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Play className="w-5 h-5 text-green-400" />
                        The Theater
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Watch your active Mind Movie in a focused, cinematic experience. The Theater tracks 
                        your daily viewing streak and integrates with your morning "Three Things" workflow.
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
                      Director AI Coach
                    </CardTitle>
                    <CardDescription>
                      Your personal Jarvis-like voice coach with customizable voice and personality
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                      <h4 className="font-semibold text-gold mb-2">How It Works</h4>
                      <p className="text-sm text-muted-foreground">
                        Director AI knows your Chief Aim, tracks your daily progress, and provides personalized 
                        coaching based on the Psycho-Cinematics methodology. Use voice or text to communicate.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-purple-400" />
                        Voice & Personality Settings
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Click the Settings icon in the Director AI interface to customize your coaching experience.
                      </p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Volume2 className="w-5 h-5 text-blue-400" />
                            <span className="font-medium">Voice Selection</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Choose from 10 AI voices — 5 male and 5 female options with unique characteristics.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Options include: Adam, Antoni, Charlie, Daniel, Marcus (male) and Charlotte, Jessica, Lily, Sarah, Nicole (female).
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-5 h-5 text-amber-400" />
                            <span className="font-medium">Personality Presets</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Select a coaching style that resonates with you:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• <strong>Swag Coach</strong> — Confident, street-smart energy</li>
                            <li>• <strong>Executive Coach</strong> — Professional, strategic</li>
                            <li>• <strong>Hype Master</strong> — High energy, motivational</li>
                            <li>• <strong>Zen Guide</strong> — Calm, mindful approach</li>
                            <li>• <strong>Drill Sergeant</strong> — Direct, no-nonsense</li>
                            <li>• <strong>Best Friend</strong> — Warm, supportive</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4">Core Features</h4>
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Mic className="w-4 h-4 text-gold mt-0.5" />
                          <span><strong>Voice Mode:</strong> Speak naturally and receive voice responses. Perfect for hands-free coaching.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gold mt-0.5" />
                          <span><strong>Persistent Memory:</strong> The AI remembers your conversation history for continuity.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-gold mt-0.5" />
                          <span><strong>Director's Suggestions:</strong> Get 3 daily tasks aligned with your Chief Aim and current phase.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-gold mt-0.5" />
                          <span><strong>CUT! Technique:</strong> When you're spiraling, the AI guides you through the 4-step mental reset.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <h5 className="font-semibold mb-2">The CUT! Technique</h5>
                      <ol className="text-sm text-muted-foreground space-y-2">
                        <li><strong>1. Recognize</strong> — Notice the off-script thought or negative pattern</li>
                        <li><strong>2. Cut</strong> — Mentally yell "CUT!" to stop the scene</li>
                        <li><strong>3. Reset</strong> — Take 3 deep breaths, reconnect with your Director self</li>
                        <li><strong>4. Resume</strong> — Take an aligned action that matches your Chief Aim identity</li>
                      </ol>
                    </div>

                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-red-400">Stop & Exit:</strong> Press the "Stop & Exit" button at any time to immediately 
                        end the conversation and silence all audio playback.
                      </p>
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
                      Daily Rituals & Scorecard
                    </CardTitle>
                    <CardDescription>
                      Build unstoppable momentum with consistent daily practice
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4">Morning Ritual</h4>
                      <ol className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Read your Definite Chief Aim aloud</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Watch your Mind Movie in The Theater</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>Set your "Three Things" — 3 priority tasks for the day</span>
                        </li>
                      </ol>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4">Evening Scorecard</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Rate yourself 0-3 on each category. Be honest — this is a tool for growth, not ego.
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">Identity Alignment</p>
                          <p className="text-xs text-muted-foreground">Did you think/act as your future self?</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">Behavior Execution</p>
                          <p className="text-xs text-muted-foreground">Did you complete your Three Things?</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">Emotional Regulation</p>
                          <p className="text-xs text-muted-foreground">Did you manage your state effectively?</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">Forward Progress</p>
                          <p className="text-xs text-muted-foreground">Did you move closer to your Chief Aim?</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-gold">Streak Power:</strong> Consecutive days build your streak. 
                        A 90-day streak is transformational — your subconscious will have fully adopted your new identity.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Integrations */}
              <TabsContent value="integrations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plug className="w-6 h-6 text-gold" />
                      Integrations Guide
                    </CardTitle>
                    <CardDescription>
                      Connect external tools for a seamless productivity workflow
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      All integrations are managed in <strong>Settings → Integrations</strong>. Each integration 
                      requires API credentials from the respective service.
                    </p>

                    <Separator />

                    {/* Notion */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-foreground" />
                        Notion — Journal & Scorecard Sync
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Automatically export your journal entries, daily scorecards, and Chief Aim to a Notion database.
                      </p>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                        <p className="text-sm font-medium">Setup Steps:</p>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">notion.so/my-integrations</a></li>
                          <li>Click "New integration" and give it a name (e.g., "Psycho-Cinematics")</li>
                          <li>Copy the "Internal Integration Token"</li>
                          <li>In Notion, open your target database and click "..." → "Add connections" → select your integration</li>
                          <li>Paste the token in Settings → Integrations → Notion</li>
                        </ol>
                      </div>
                    </div>

                    <Separator />

                    {/* Slack */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-foreground" />
                        Slack — Notifications & Reminders
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Receive morning ritual reminders, evening scorecard prompts, and achievement alerts in Slack.
                      </p>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                        <p className="text-sm font-medium">Setup Steps:</p>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">api.slack.com/apps</a> and create a new app</li>
                          <li>Under "OAuth & Permissions", add scopes: <code className="text-xs bg-background px-1 rounded">chat:write</code>, <code className="text-xs bg-background px-1 rounded">channels:read</code></li>
                          <li>Install the app to your workspace</li>
                          <li>Copy the "Bot User OAuth Token" (starts with xoxb-)</li>
                          <li>Get your Channel ID (right-click channel → "View channel details")</li>
                          <li>Paste both in Settings → Integrations → Slack</li>
                        </ol>
                      </div>
                    </div>

                    <Separator />

                    {/* Telegram */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Send className="w-5 h-5 text-foreground" />
                        Telegram — Mobile Notifications
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get push notifications on your phone via Telegram for all reminders and achievements.
                      </p>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                        <p className="text-sm font-medium">Setup Steps:</p>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>Message <code className="text-xs bg-background px-1 rounded">@BotFather</code> on Telegram</li>
                          <li>Send <code className="text-xs bg-background px-1 rounded">/newbot</code> and follow the prompts to create your bot</li>
                          <li>Copy the bot token provided</li>
                          <li>Start a chat with your new bot and send any message</li>
                          <li>Get your Chat ID by messaging <code className="text-xs bg-background px-1 rounded">@userinfobot</code></li>
                          <li>Paste both in Settings → Integrations → Telegram</li>
                        </ol>
                      </div>
                    </div>

                    <Separator />

                    {/* ElevenLabs */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Mic2 className="w-5 h-5 text-foreground" />
                        ElevenLabs — Voice Cloning
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Use your own cloned voices in the Voice Changer and Director AI TTS.
                      </p>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                        <p className="text-sm font-medium">Setup Steps:</p>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>Go to <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">ElevenLabs API Keys</a></li>
                          <li>Create or copy your API key</li>
                          <li>Paste in Settings → Integrations → ElevenLabs</li>
                        </ol>
                        <p className="text-xs text-muted-foreground mt-2">
                          Note: With your own key, voice usage is billed to your ElevenLabs account.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Social Media */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-foreground" />
                        Social Media — Direct Posting
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Share wins, manifestations, and insights directly to Facebook, Instagram, X (Twitter), and TikTok 
                        with automatic "Posted from Psycho-Cinematics" branding.
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Facebook className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-sm">Facebook</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Requires access token and optional Page ID</p>
                        </div>
                        <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Instagram className="w-4 h-4 text-pink-500" />
                            <span className="font-medium text-sm">Instagram</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Via Facebook API, requires token and user ID</p>
                        </div>
                        <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Twitter className="w-4 h-4 text-sky-400" />
                            <span className="font-medium text-sm">X (Twitter)</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Requires API key, secret, and access tokens</p>
                        </div>
                        <div className="p-3 rounded-lg bg-neutral-500/10 border border-neutral-500/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="w-4 h-4" />
                            <span className="font-medium text-sm">TikTok</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Requires access token and Open ID</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Note: Instagram and TikTok have limited API support — content may be copied for manual posting.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Community & Awards */}
              <TabsContent value="community" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-gold" />
                      Community & Awards
                    </CardTitle>
                    <CardDescription>
                      Share your work, vote for others, and earn recognition
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                      <h4 className="font-semibold text-gold mb-2">Why Community Matters</h4>
                      <p className="text-sm text-muted-foreground">
                        Sharing your Mind Movie and engaging with other Directors creates accountability, 
                        inspiration, and healthy competition. See what others are manifesting and let their 
                        success fuel your own journey.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-400" />
                        Submit to Community
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Share your completed Mind Movie with the community for voting and feedback.
                      </p>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                        <p className="text-sm font-medium">How to Submit:</p>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>Open the <strong>Movie Vault</strong> from the Mind Movie Studio</li>
                          <li>Find a completed Mind Movie with a video URL</li>
                          <li>Click the <strong>"Submit to Community"</strong> button</li>
                          <li>Add a description and confirm your submission</li>
                          <li>Your movie will appear in the community voting pool</li>
                        </ol>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        Recognition Programs
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Film className="w-5 h-5 text-purple-400" />
                            <span className="font-medium">Movie of the Week</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Each week, the highest-voted community Mind Movie is featured on the homepage. 
                            Admins curate from top submissions.
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-green-400" />
                            <span className="font-medium">Director of the Month</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Monthly recognition for top performers based on streak consistency, 
                            scorecard averages, and community engagement.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-gold" />
                        Annual Awards Ceremony
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        At the end of each year, winners are calculated and announced across multiple categories.
                      </p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
                          <p className="font-medium text-sm text-gold">🏆 Best Mind Movie</p>
                          <p className="text-xs text-muted-foreground">Highest total votes</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                          <p className="font-medium text-sm text-purple-400">🔥 Longest Streak</p>
                          <p className="text-xs text-muted-foreground">Most consecutive days</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <p className="font-medium text-sm text-blue-400">⭐ Top Director Score</p>
                          <p className="text-xs text-muted-foreground">Highest average scorecard</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <p className="font-medium text-sm text-green-400">🎬 Most Movies Created</p>
                          <p className="text-xs text-muted-foreground">Production volume</p>
                        </div>
                        <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
                          <p className="font-medium text-sm text-pink-400">💫 Community Favorite</p>
                          <p className="text-xs text-muted-foreground">Most engagement</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <p className="font-medium text-sm text-amber-400">🌟 Rising Star</p>
                          <p className="text-xs text-muted-foreground">Best newcomer</p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-sm text-muted-foreground">
                          <strong>View the Awards:</strong> Navigate to <Link to="/awards" className="text-gold hover:underline">/awards</Link> to 
                          see current standings, past winners, and the annual ceremony page.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Detailed User Manual Tab */}
          <TabsContent value="user-manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-gold" />
                  Complete User Manual
                </CardTitle>
                <CardDescription>
                  Comprehensive documentation for training and reference — covers every feature in detail
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <div className="space-y-8">
                  {/* Table of Contents */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="font-semibold mb-3">Table of Contents</h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      <a href="#manual-overview" className="text-gold hover:underline">1. System Overview</a>
                      <a href="#manual-chief-aim" className="text-gold hover:underline">2. Definite Chief Aim</a>
                      <a href="#manual-hero-character" className="text-gold hover:underline">3. Hero Character Creator</a>
                      <a href="#manual-character-builder" className="text-gold hover:underline">4. Character Builder</a>
                      <a href="#manual-mind-movie" className="text-gold hover:underline">5. Mind Movie Studio</a>
                      <a href="#manual-edit-bay" className="text-gold hover:underline">6. Edit Bay & AI Studio</a>
                      <a href="#manual-timeline" className="text-gold hover:underline">7. Timeline Editor</a>
                      <a href="#manual-director-ai" className="text-gold hover:underline">8. Director AI Coach</a>
                      <a href="#manual-daily-rituals" className="text-gold hover:underline">9. Daily Rituals</a>
                      <a href="#manual-cycles" className="text-gold hover:underline">10. 21-Day Cycles</a>
                      <a href="#manual-integrations" className="text-gold hover:underline">11. Integrations</a>
                      <a href="#manual-community" className="text-gold hover:underline">12. Community & Awards</a>
                    </div>
                  </div>

                  <Separator />

                  {/* Section 1: System Overview */}
                  <section id="manual-overview">
                    <h3 className="text-xl font-semibold text-gold mb-4">1. System Overview</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        <strong>Psycho-Cinematics™ Director's OS</strong> is a comprehensive identity transformation platform that combines 
                        visualization technology, behavioral tracking, AI coaching, and community support. The system treats your life as 
                        a movie where you are both the Director and the star.
                      </p>
                      <h4 className="font-semibold text-foreground">Core Philosophy</h4>
                      <p>
                        Based on Maxwell Maltz's Psycho-Cybernetics and Napoleon Hill's Think and Grow Rich, the platform helps users 
                        reprogram their self-image through consistent visualization and identity-aligned action.
                      </p>
                      <h4 className="font-semibold text-foreground">The 7-Phase Framework</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Phase 1: The Awakening</strong> — Realizing you can rewrite your story</li>
                        <li><strong>Phase 2: The Vision</strong> — Defining your Definite Chief Aim</li>
                        <li><strong>Phase 3: The Script</strong> — Writing your new identity narrative</li>
                        <li><strong>Phase 4: Pre-Production</strong> — Building habits and support systems</li>
                        <li><strong>Phase 5: Principal Photography</strong> — Daily aligned action</li>
                        <li><strong>Phase 6: Post-Production</strong> — Refining and adjusting course</li>
                        <li><strong>Phase 7: The Premiere</strong> — Achieving and celebrating your goal</li>
                      </ul>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 2: Chief Aim */}
                  <section id="manual-chief-aim">
                    <h3 className="text-xl font-semibold text-gold mb-4">2. Definite Chief Aim</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        The Definite Chief Aim is the foundation of your entire transformation. It is a crystal-clear statement containing 
                        four essential components that define exactly what you want and how you'll achieve it.
                      </p>
                      <h4 className="font-semibold text-foreground">The Four Components</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li><strong>The Dream (What)</strong> — Exactly what you want to achieve or become. Be specific and vivid.</li>
                        <li><strong>The Deadline (By When)</strong> — A specific date that creates urgency. Ambitious yet believable.</li>
                        <li><strong>The Exchange (What You'll Give)</strong> — The habits, time, comfort, and sacrifices you'll commit.</li>
                        <li><strong>The Plan (First Steps)</strong> — Immediate actions you'll take to begin your transformation today.</li>
                      </ol>
                      <h4 className="font-semibold text-foreground">How to Access</h4>
                      <p>
                        Click the gold "Start Here: Definite Chief Aim" card on your dashboard. The AI-guided wizard walks you through 
                        each phase with personalized coaching and examples.
                      </p>
                      <h4 className="font-semibold text-foreground">Daily Practice</h4>
                      <p>
                        Your Chief Aim appears on your dashboard. Read it aloud every morning and evening. This statement becomes the 
                        foundation for your Mind Movie's scenes and lyrics.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 3: Hero Character */}
                  <section id="manual-hero-character">
                    <h3 className="text-xl font-semibold text-gold mb-4">3. Hero Character Creator</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        The Hero Character Creator allows you to define and generate a standardized visual identity for your "Best Self." 
                        This ensures visual consistency across all AI-generated content.
                      </p>
                      <h4 className="font-semibold text-foreground">Location</h4>
                      <p>Character Builder → Create tab</p>
                      <h4 className="font-semibold text-foreground">Step-by-Step Process</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li><strong>Upload Reference Photo</strong> — Upload a clear, front-facing photo with good lighting</li>
                        <li><strong>Enter Character Description</strong> — Define height, weight, build, and additional features</li>
                        <li><strong>Save Description</strong> — Click "Save Description" to persist to your profile</li>
                        <li><strong>Generate Hero Images</strong> — Click to generate front, side, and back views</li>
                        <li><strong>Download Images</strong> — Hover to download individually or use "Download All"</li>
                      </ol>
                      <h4 className="font-semibold text-foreground">Character Description Fields</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Height</strong> — e.g., "6 feet", "5'10"</li>
                        <li><strong>Weight/Size</strong> — e.g., "180 lbs", "athletic"</li>
                        <li><strong>Physical Build</strong> — e.g., "muscular", "lean", "athletic"</li>
                        <li><strong>Additional Features</strong> — Hair style, clothing preferences, distinguishing characteristics</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">Where Hero Images Are Used</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Mind Movie Wizard scene generation</li>
                        <li>Challenge Storyboard visualizations</li>
                        <li>Edit Bay image generation (auto-loaded as reference)</li>
                        <li>Episode-specific Mind Movie productions</li>
                      </ul>
                      <div className="p-3 rounded-lg bg-gold/10 border border-gold/20 mt-4">
                        <p><strong>Best Practice:</strong> Create your Hero Character BEFORE generating any Mind Movies or Challenge 
                        Storyboards to ensure consistent identity across all content.</p>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 4: Character Builder */}
                  <section id="manual-character-builder">
                    <h3 className="text-xl font-semibold text-gold mb-4">4. Character Builder</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        The Character Builder is a comprehensive system for understanding and developing your character through archetype 
                        discovery, transformation coaching, and progress tracking.
                      </p>
                      <h4 className="font-semibold text-foreground">Tabs Available</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Create</strong> — Hero Character Creator (see Section 3)</li>
                        <li><strong>21 Days</strong> — Cycle progress and transformation roadmap</li>
                        <li><strong>Survey</strong> — 28-question archetype assessment</li>
                        <li><strong>Archetype</strong> — Your dominant archetype results</li>
                        <li><strong>Coach</strong> — AI Transformation Coach</li>
                        <li><strong>Scorecard</strong> — Character trait scoring</li>
                        <li><strong>Annual</strong> — Year-end self-analysis</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">Archetype Survey</h4>
                      <p>
                        Complete the 28-question Napoleon Hill character assessment. Each question offers "Light" (strengths) and 
                        "Shadow" (growth areas) options. Shadow answers reveal your biggest transformation opportunities.
                      </p>
                      <h4 className="font-semibold text-foreground">The 12 Director Archetypes</h4>
                      <p>
                        Sovereign, Master Builder, Wayfinder, Alchemist, Divine Analyst, Truth Keeper, Sacred Judge, Protector, 
                        Harmonizer, Weaver, Still Center, and more. Each has unique strengths and shadow tendencies.
                      </p>
                      <h4 className="font-semibold text-foreground">Transformation Coach</h4>
                      <p>
                        AI-powered coaching that analyzes your archetype, Chief Aim, and survey responses to identify the gap between 
                        who you are and who you need to become. Generates a personalized transformation analysis with required traits 
                        and daily practices.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 5: Mind Movie */}
                  <section id="manual-mind-movie">
                    <h3 className="text-xl font-semibold text-gold mb-4">5. Mind Movie Studio</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <h4 className="font-semibold text-foreground">Overview</h4>
                      <p>
                        The Mind Movie Studio is a complete production pipeline for creating personalized visualization videos. 
                        It includes script generation, AI image/video creation, soundtrack production, and a movie vault for 
                        managing multiple projects.
                      </p>
                      <h4 className="font-semibold text-foreground">5-Step Wizard Process</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li><strong>Foundation</strong> — Set title, cinematography style, and confirm Chief Aim</li>
                        <li><strong>Generate Script</strong> — AI generates 12-scene storyboard based on Chief Aim</li>
                        <li><strong>Visuals</strong> — Generate/upload images and videos for each scene</li>
                        <li><strong>Soundtrack</strong> — Create custom AI music with optional Chief Aim lyrics</li>
                        <li><strong>Finalize</strong> — Review and save to Movie Vault</li>
                      </ol>
                      <h4 className="font-semibold text-foreground">Cinematography Styles</h4>
                      <p>
                        Choose from Dramatic, Noir, Ethereal, Documentary, Epic, and more. Each style dictates lighting, camera 
                        techniques, and visual grammar.
                      </p>
                      <h4 className="font-semibold text-foreground">Movie Vault</h4>
                      <p>
                        Manage multiple Mind Movies. Set one as "active" for your daily viewing ritual. Preview, rename, duplicate, 
                        submit to community, or delete projects.
                      </p>
                      <h4 className="font-semibold text-foreground">The Theater</h4>
                      <p>
                        Watch your active Mind Movie in a distraction-free cinematic experience. The Theater tracks your viewing 
                        streak and integrates with the morning ritual workflow.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 6: Edit Bay */}
                  <section id="manual-edit-bay">
                    <h3 className="text-xl font-semibold text-gold mb-4">6. Edit Bay & AI Studio</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <h4 className="font-semibold text-foreground">Image Generation</h4>
                      <p>
                        Generate AI images using text prompts. Upload reference photos for personal likeness integration. 
                        Your Hero Character images are automatically loaded as references.
                      </p>
                      <h4 className="font-semibold text-foreground">Video Generation Models</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Google Veo 3</strong> — Best quality with audio generation, 8-second clips</li>
                        <li><strong>Wan 2.1</strong> — Fast, high-quality general content</li>
                        <li><strong>Kling v2.5</strong> — Professional quality, supports image-to-video</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">Voice Changer</h4>
                      <p>
                        Transform video audio using ElevenLabs voices. Choose from 10+ premium voices or connect your own 
                        ElevenLabs API key for cloned voices.
                      </p>
                      <h4 className="font-semibold text-foreground">Media Library</h4>
                      <p>
                        All generated assets are saved to your Media Library (20GB limit). Filter by type (images, videos, audio), 
                        sort by date, multi-select to import into Timeline Editor, or submit audio to Director Radio.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 7: Timeline */}
                  <section id="manual-timeline">
                    <h3 className="text-xl font-semibold text-gold mb-4">7. Timeline Editor</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <h4 className="font-semibold text-foreground">Overview</h4>
                      <p>
                        Professional non-linear video editing right in your browser. Multi-track support for video and audio, 
                        razor cuts, audio fades, and VU meters for audio monitoring.
                      </p>
                      <h4 className="font-semibold text-foreground">Keyboard Shortcuts</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>V</strong> — Select tool</li>
                        <li><strong>C</strong> — Razor tool (cut clips)</li>
                        <li><strong>R</strong> — Range tool</li>
                        <li><strong>H</strong> — Hand tool (pan)</li>
                        <li><strong>A</strong> — Add audio to timeline</li>
                        <li><strong>Ctrl/Cmd + Z</strong> — Undo</li>
                        <li><strong>Ctrl/Cmd + Shift + Z</strong> — Redo</li>
                        <li><strong>Delete/Backspace</strong> — Delete selected clips</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">Export Options</h4>
                      <p>Export in 720p, 1080p, or HD quality. Review your export before saving to Movie Vault or downloading.</p>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 8: Director AI */}
                  <section id="manual-director-ai">
                    <h3 className="text-xl font-semibold text-gold mb-4">8. Director AI Coach</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <h4 className="font-semibold text-foreground">Overview</h4>
                      <p>
                        Your personal voice-enabled AI coach trained in Psycho-Cinematics methodology. It knows your Chief Aim, 
                        active Episode, character archetype, and daily progress.
                      </p>
                      <h4 className="font-semibold text-foreground">Voice Options (10 total)</h4>
                      <p>Male: Adam, Antoni, Charlie, Daniel, Marcus</p>
                      <p>Female: Charlotte, Jessica, Lily, Sarah, Nicole</p>
                      <h4 className="font-semibold text-foreground">Personality Presets (6 total)</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Swag Coach</strong> — Confident, street-smart energy</li>
                        <li><strong>Executive Coach</strong> — Professional, strategic</li>
                        <li><strong>Hype Master</strong> — High energy, motivational</li>
                        <li><strong>Zen Guide</strong> — Calm, mindful approach</li>
                        <li><strong>Drill Sergeant</strong> — Direct, no-nonsense</li>
                        <li><strong>Best Friend</strong> — Warm, supportive</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">The CUT! Technique</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li><strong>Recognize</strong> — Notice the off-script thought</li>
                        <li><strong>Cut</strong> — Mentally yell "CUT!" to stop the scene</li>
                        <li><strong>Reset</strong> — Take 3 deep breaths, reconnect with Director self</li>
                        <li><strong>Resume</strong> — Take an aligned action matching your Chief Aim</li>
                      </ol>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 9: Daily Rituals */}
                  <section id="manual-daily-rituals">
                    <h3 className="text-xl font-semibold text-gold mb-4">9. Daily Rituals & Scorecard</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <h4 className="font-semibold text-foreground">Morning Ritual</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Read your Definite Chief Aim aloud</li>
                        <li>Watch your Mind Movie in The Theater</li>
                        <li>Set your "Three Things" — 3 priority tasks for the day</li>
                      </ol>
                      <h4 className="font-semibold text-foreground">Evening Scorecard</h4>
                      <p>Rate yourself 0-3 on four categories:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Identity Alignment</strong> — Did you think/act as your future self?</li>
                        <li><strong>Behavior Execution</strong> — Did you complete your Three Things?</li>
                        <li><strong>Emotional Regulation</strong> — Did you manage your state effectively?</li>
                        <li><strong>Forward Progress</strong> — Did you move closer to your Chief Aim?</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">Scoring Rubric (0-3)</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>0 — Off-Script</strong> — Did not embody this at all</li>
                        <li><strong>1 — Rehearsing</strong> — Made some effort, inconsistent</li>
                        <li><strong>2 — In Character</strong> — Solid performance, minor lapses</li>
                        <li><strong>3 — Oscar-Worthy</strong> — Exemplary embodiment</li>
                      </ul>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 10: Cycles */}
                  <section id="manual-cycles">
                    <h3 className="text-xl font-semibold text-gold mb-4">10. 21-Day Transformation Cycles</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <h4 className="font-semibold text-foreground">The Science</h4>
                      <p>
                        Research shows it takes approximately 21 days to form new neural pathways and habits. Each 21-day cycle 
                        is a focused period for embedding one aspect of your transformation.
                      </p>
                      <h4 className="font-semibold text-foreground">The 3-4-3 Act Structure</h4>
                      <p>Your full transformation spans 210 days across 3 Acts:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Act I: Awakening</strong> — 3 cycles (63 days)</li>
                        <li><strong>Act II: Integration</strong> — 4 cycles (84 days)</li>
                        <li><strong>Act III: Mastery</strong> — 3 cycles (63 days)</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">Cycle Review</h4>
                      <p>On Day 21, complete a Cycle Review including:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Scorecard averages for the cycle</li>
                        <li>Character archetype comparison (before/after)</li>
                        <li>AI-generated progress analysis</li>
                        <li>Personal reflection on wins and challenges</li>
                        <li>Commitment for the next cycle</li>
                      </ul>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 11: Integrations */}
                  <section id="manual-integrations">
                    <h3 className="text-xl font-semibold text-gold mb-4">11. Integrations</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>All integrations are managed in Settings → Integrations.</p>
                      <h4 className="font-semibold text-foreground">Available Integrations</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Notion</strong> — Auto-sync journal, scorecards, and Chief Aim</li>
                        <li><strong>Slack</strong> — Morning ritual and evening scorecard reminders</li>
                        <li><strong>Telegram</strong> — Mobile push notifications for all reminders</li>
                        <li><strong>ElevenLabs</strong> — Use your cloned voices in Voice Changer</li>
                        <li><strong>Social Media</strong> — Direct posting to Facebook, Instagram, X, TikTok</li>
                      </ul>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 12: Community */}
                  <section id="manual-community">
                    <h3 className="text-xl font-semibold text-gold mb-4">12. Community & Awards</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <h4 className="font-semibold text-foreground">Director's Corner</h4>
                      <p>
                        Share your Mind Movies with the community. Vote for others' work. Get inspired by seeing what 
                        fellow Directors are manifesting.
                      </p>
                      <h4 className="font-semibold text-foreground">Recognition Programs</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Movie of the Week</strong> — Highest-voted community Mind Movie</li>
                        <li><strong>Director of the Month</strong> — Top performer based on streaks and scores</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">Annual Awards</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>🏆 Best Mind Movie</li>
                        <li>🔥 Longest Streak</li>
                        <li>⭐ Top Director Score</li>
                        <li>🎬 Most Movies Created</li>
                        <li>💫 Community Favorite</li>
                        <li>🌟 Rising Star</li>
                      </ul>
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-gold" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Quick answers to common questions about Psycho-Cinematics™
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

        {/* Still Have Questions */}
        <Card className="mt-12 border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
          <CardContent className="py-8 text-center">
            <Bot className="w-12 h-12 text-gold mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Still Have Questions?</h3>
            <p className="text-muted-foreground mb-4">
              Talk to Director AI — your personal coach trained in Psycho-Cinematics™
            </p>
            <Link to="/">
              <Button className="gap-2">
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
