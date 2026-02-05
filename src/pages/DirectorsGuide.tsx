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
  Map,
  Clapperboard,
  Swords,
  Clock
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
        content: "On your dashboard, click the animated gold 'Definite Chief Aim' module. The AI-guided wizard walks you through Napoleon Hill's proven 4-phase framework with personalized coaching."
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
        title: "Final Scene Countdown",
        content: "Once you set your 'By When' date, a countdown clock appears on your dashboard banner showing exactly how many days, hours, and minutes remain until your deadline. This creates powerful urgency and accountability."
      },
      {
        title: "Review Daily",
        content: "Your Chief Aim appears in the Daily Rituals section. Click 'Script Review' to read the full script aloud every morning and evening as part of your ritual. This statement becomes the lyrics of your Mind Movie."
      }
    ],
    tips: [
      "Be specific about what you want — vague goals produce vague results",
      "Set a deadline that stretches you but feels achievable",
      "Your exchange should reflect real sacrifice and commitment",
      "This becomes the foundation for your Mind Movie's lyrics and scenes",
      "The countdown clock on your dashboard keeps your deadline front and center",
      "Without a clear Chief Aim, all other tools are just entertainment"
    ]
  },
  {
    id: "character-builder",
    icon: <User className="w-6 h-6" />,
    title: "Character Builder & The 11 Spheres",
    description: "Step 2: Discover your Metu Neter archetype and create your hero identity",
    steps: [
      {
        title: "The 11 Metu Neter Archetypes",
        content: "The Character Builder uses 11 archetypes based on the Spheres and Laws of the Metu Neter (Paut Neteru/Tree of Life). Each sphere represents a divine principle and law that governs transformation."
      },
      {
        title: "Take the Archetype Survey",
        content: "Complete the Quick Archetype Survey or the comprehensive 17-part Napoleon Hill Self-Analysis. Answer honestly — your responses determine your dominant archetype based on the Laws of Success."
      },
      {
        title: "Understand Your Profile",
        content: "Each archetype includes: Sphere number (0-10), Deity/Principle (Kemetic Neter), The Law (spiritual principle), Role (how it functions in your life), and a Director's Note (coaching mantra)."
      },
      {
        title: "Light & Shadow States",
        content: "Each archetype has Light expressions (highest potential) and Shadow expressions (distorted patterns). Understanding both is essential for transformation."
      },
      {
        title: "Create Your Hero Character",
        content: "Go to Character Builder → Create tab. Upload a reference photo of yourself, then describe your 'best self' traits. This data powers all AI-generated images across the platform."
      },
      {
        title: "Generate Hero Images",
        content: "Click 'Generate Hero Images' to create professional front, side, and back views on a neutral background. These become your standardized character identity for Mind Movies and storyboards."
      },
      {
        title: "Use the Transformation Coach",
        content: "Get AI-powered coaching tailored to your archetype and Chief Aim. The coach identifies gaps between who you are and who you need to become."
      }
    ],
    tips: [
      "The 11 spheres range from Amen (Sphere 0 - The Witness) to Geb (Sphere 10 - The Builder)",
      "Create your Hero Character BEFORE generating Mind Movies for consistent identity",
      "Shadow answers reveal your biggest growth opportunities — don't avoid them",
      "Your hero images appear in all AI-generated scenes featuring you",
      "Retake the survey after each 21-day cycle to track your evolution"
    ]
  },
  {
    id: "episodes",
    icon: <Film className="w-6 h-6" />,
    title: "Episodes System",
    description: "Break your Chief Aim into tactical sprints with dedicated productions",
    steps: [
      {
        title: "What Are Episodes?",
        content: "Episodes are time-bound tactical sprints (7-day, 14-day, 21-day, or 30-day) that break your Chief Aim into achievable milestones. Each episode has its own objective, Mind Movie, and soundtrack."
      },
      {
        title: "Create an Episode",
        content: "Navigate to Episodes and click 'Create Episode'. Define your episode title, objective, deadline, and duration type. The Episode Wizard guides you through linking it to your Chief Aim."
      },
      {
        title: "Episode Production Dashboard",
        content: "Each episode has a Production Dashboard with a step-by-step workflow: Create Script → Generate Visuals → Edit & Animate → Export Movie. Or use 'Upload My Movie' to skip the production steps."
      },
      {
        title: "Episode Mind Movies",
        content: "Create episode-specific Mind Movies that visualize your sprint goal. These can be watched in The Theater alongside your main Mind Movie."
      },
      {
        title: "Create Episode Anthem",
        content: "Convert your episode objective into a custom AI-generated song. Click 'Create Episode Anthem' to generate a motivating soundtrack for your sprint."
      },
      {
        title: "Track Episode Progress",
        content: "The Episode Timeline shows all your episodes chronologically. View active, completed, paused, and abandoned episodes. Delete any episode you no longer need."
      },
      {
        title: "Episode Character Dashboard",
        content: "Each episode includes character analysis showing what traits you need to develop during the sprint, aligned with your required character for the Chief Aim."
      }
    ],
    tips: [
      "Use 7-day episodes for quick wins and momentum",
      "21-day episodes align with the transformation cycle system",
      "Episodes can have their own challenges and adversity training",
      "Watch episode movies in The Theater's Episode Movies mode",
      "Delete episodes that are no longer relevant to declutter your timeline"
    ]
  },
  {
    id: "movie-studio",
    icon: <Clapperboard className="w-6 h-6" />,
    title: "Psycho Cinematic Movie Studio",
    description: "Your unified hub for all production tools",
    steps: [
      {
        title: "Access the Studio",
        content: "Click the 'Psycho Cinematic Movie Studio' card on your dashboard. This opens a panel with all four production modules organized by workflow."
      },
      {
        title: "1. Storyboard — Plan Your Vision",
        content: "Start here to map out your Mind Movie scenes. Use the AI Storyboard Wizard to generate scenes based on your Chief Aim. Each scene includes prompts for image and video generation."
      },
      {
        title: "2. The Edit Bay — Create Your Assets",
        content: "Generate AI images and videos for your scenes. Supports text-to-image, image-to-video, and video-to-video generation with models like Veo 3, Wan 2.1, and Kling."
      },
      {
        title: "3. Soundtrack Studio — Add Music",
        content: "Create custom AI-generated songs with 50+ genre options. Generate lyrics based on your Chief Aim, choose vocal styles, and produce your Mind Movie soundtrack."
      },
      {
        title: "4. Mind Movie Vault — Manage & Watch",
        content: "Store, organize, and watch your completed Mind Movies. Submit to the community for voting, or keep private for personal use."
      },
      {
        title: "Timeline Editor",
        content: "Access the professional non-linear video editor from The Edit Bay. Assemble your scenes, add transitions, mix audio, and export in up to 4K resolution."
      }
    ],
    tips: [
      "Follow the workflow: Storyboard → Edit Bay → Soundtrack → Vault",
      "Generate your soundtrack first if you want to time scenes to music",
      "Use the Timeline Editor for quick edits without external software",
      "Submit your best work to the community for recognition"
    ]
  },
  {
    id: "challenges",
    icon: <Swords className="w-6 h-6" />,
    title: "Adversity Challenges",
    description: "Train your nervous system to respond like your best self",
    steps: [
      {
        title: "What Are Adversity Challenges?",
        content: "Adversity Challenges are scenarios that trigger emotional reactions. You practice visualizing your ideal response, essentially rehearsing how your 'best self' would handle difficult situations."
      },
      {
        title: "Generate a Challenge",
        content: "The AI generates personalized adversity scenarios based on your Chief Aim and character profile. Each challenge targets a specific trait you need to develop."
      },
      {
        title: "Define Your Ideal Response",
        content: "Describe how your transformed self would respond to this challenge. What emotions would you feel? What actions would you take? What would your inner dialogue be?"
      },
      {
        title: "Create a Storyboard",
        content: "Generate a visual storyboard of your ideal response. These AI-generated scenes help you visualize yourself handling adversity with grace and power."
      },
      {
        title: "Generate a Challenge Soundtrack",
        content: "Create an AI song that embodies your empowered response. This anchors the emotional state of your ideal response to music."
      },
      {
        title: "The KUT Technique",
        content: "When you catch yourself reacting negatively: 1) Recognize the trigger, 2) Mentally yell 'KUT!' to stop, 3) Take 3 deep breaths to reset, 4) Resume with aligned action."
      }
    ],
    tips: [
      "Practice adversity challenges daily to build emotional resilience",
      "Link challenges to specific episodes for focused training",
      "The KUT technique is your pattern-interrupt — use it in real life",
      "Storyboard visuals help your brain 'pre-live' ideal responses"
    ]
  },
  {
    id: "getting-started",
    icon: <Play className="w-6 h-6" />,
    title: "Getting Started & Notifications",
    description: "Account setup and push notification configuration",
    steps: [
      {
        title: "Create Your Account",
        content: "Sign up with your email or Google account. You'll receive a 3-day free trial with 250 credits to explore all features."
      },
      {
        title: "Enable Push Notifications",
        content: "Go to Settings → Preferences to enable push notifications. You'll receive morning ritual reminders, journal prompts, and evening scorecard check-ins."
      },
      {
        title: "Push Diagnostics (iOS)",
        content: "If notifications stop working on iOS, use the 'Push Diagnostics' panel in Settings → Preferences. The 'Repair Push' button re-registers your device with a fresh subscription."
      },
      {
        title: "Connect Integrations",
        content: "Visit Settings → Integrations to connect Notion, Slack, Telegram, ElevenLabs, and social media for a seamless workflow experience."
      }
    ],
    tips: [
      "iOS users must install the app to Home Screen for push notifications to work",
      "Use 'Repair Push' if test notifications don't arrive on your device",
      "Connect Notion to automatically sync your journal and scorecards"
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
    id: "daily-ritual",
    icon: <Calendar className="w-6 h-6" />,
    title: "Daily Rituals & Scorecard",
    description: "Track your progress and build unstoppable momentum",
    steps: [
      {
        title: "Morning Ritual",
        content: "Start each day by: 1) Reading your Chief Aim aloud (Script Review), 2) Watching your Mind Movie, 3) Setting your 'Three Things' (3 key tasks for the day)."
      },
      {
        title: "Script Review",
        content: "Click the 'Script Review' ritual item to open your full Definite Chief Aim script. Read it aloud with emotion and conviction — this is the foundation of daily reprogramming."
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
        title: "Character Scorecard",
        content: "Rate yourself on the specific character traits required for your Chief Aim. Track your progress on traits like discipline, confidence, or creativity over time."
      },
      {
        title: "Build Your Streak",
        content: "Consecutive days of completed scorecards build your streak. The streak banner on your dashboard celebrates your consistency and shows milestone achievements."
      },
      {
        title: "View Excuse Analytics",
        content: "Visit the Actions page to see patterns in your incomplete tasks. The Excuse Analytics dashboard reveals your most common barriers and patterns."
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
    id: "director-ai",
    icon: <Mic className="w-6 h-6" />,
    title: "Director AI Coach",
    description: "Your personal voice coach with customizable personality",
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
        title: "Get Lyric Assistance",
        content: "Director AI is trained in 'How to Rap' fundamentals and can help you craft lyrics for your soundtracks and anthems."
      },
      {
        title: "Use the KUT Technique",
        content: "When spiraling into negative thoughts, the AI guides you through the 4-step reset: Recognize, KUT, Reset (3 breaths), and Resume with aligned action."
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
    id: "soundtrack-studio",
    icon: <Music className="w-6 h-6" />,
    title: "Soundtrack Studio & Director Radio",
    description: "Create custom soundtracks and stream motivation",
    steps: [
      {
        title: "Access Soundtrack Studio",
        content: "Open the Psycho Cinematic Movie Studio and click 'Soundtrack Studio', or navigate directly to /soundtrack."
      },
      {
        title: "Generate Custom Soundtracks",
        content: "Create AI-powered songs with 50+ genre options, vocal customization, and optional lyrics based on your Chief Aim or episode objectives."
      },
      {
        title: "Create Chief Aim Anthem",
        content: "Generate a personalized anthem from your Definite Chief Aim. This becomes your signature transformation song."
      },
      {
        title: "Listen to Director Radio",
        content: "Browse curated playlists and featured tracks from the community. Listen to motivation-boosting music while you work on your transformation."
      },
      {
        title: "Submit to Director Radio",
        content: "In the Media Library, click 'Submit to Radio' on any audio track you've generated. Admins review submissions and add approved tracks to community playlists."
      }
    ],
    tips: [
      "Generate soundtracks that match your Chief Aim energy for maximum impact",
      "Create episode-specific anthems for each tactical sprint",
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
        title: "Director's Corner",
        content: "Visit /director-corner to browse the community feed, see other directors' profiles, and discover collaboration opportunities."
      },
      {
        title: "Submit to Community",
        content: "In the Movie Vault, click 'Submit to Community' on any completed Mind Movie to share it with other Directors for voting and feedback."
      },
      {
        title: "Vote for Mind Movies",
        content: "Browse community submissions and vote for your favorites. Top-voted movies are featured as 'Movie of the Week'."
      },
      {
        title: "Create Your Public Profile",
        content: "Customize your director profile with a cover image, bio, skills, and collaboration preferences. Other directors can view your public profile at /director/:id."
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
    question: "What are the 11 Metu Neter Archetypes?",
    answer: "The 11 archetypes are based on the Spheres and Laws of the Metu Neter (Paut Neteru/Tree of Life). Each sphere represents a divine Kemetic principle: Sphere 0 (Amen - The Witness), Sphere 1 (Ausar - The Sovereign), Sphere 2 (Tehuti - The Master Mind), Sphere 3 (Seker - The Alchemist), Sphere 4 (Maat - The Divine Analyst), Sphere 5 (Herukhuti - The Sacred Judge), Sphere 6 (Heru - The Hero), Sphere 7 (Het-Heru - The Harmonizer), Sphere 8 (Sebek - The Strategist), Sphere 9 (Auset - The Nurturer), and Sphere 10 (Geb - The Builder)."
  },
  {
    question: "What is the Episode System?",
    answer: "Episodes are time-bound tactical sprints (7, 14, 21, or 30 days) that break your Chief Aim into achievable milestones. Each episode has its own objective, Mind Movie, soundtrack, and production workflow. Episodes help you focus on specific goals without losing sight of your overall transformation."
  },
  {
    question: "What is the Psycho Cinematic Movie Studio?",
    answer: "The Movie Studio is your unified hub for all production tools: Storyboard (plan your vision), The Edit Bay (generate images and videos), Soundtrack Studio (create custom music), and Mind Movie Vault (store and manage your movies). Access it from the main dashboard."
  },
  {
    question: "What is the Final Scene Countdown?",
    answer: "When you set your 'By When' date in your Definite Chief Aim, a countdown clock appears on your dashboard banner showing days, hours, and minutes until your deadline. This creates urgency and keeps your goal front and center."
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
    question: "What is the KUT technique?",
    answer: "KUT is a 4-step mental reset technique for when you catch yourself in negative thought patterns: 1) Recognize - notice the off-script thought, 2) KUT - mentally yell 'KUT!' to stop the scene, 3) Reset - take 3 deep breaths and reconnect with your Director self, 4) Resume - take an aligned action that matches your Chief Aim identity."
  },
  {
    question: "What are Adversity Challenges?",
    answer: "Adversity Challenges are AI-generated scenarios that trigger emotional reactions, allowing you to practice your ideal response. You visualize and storyboard how your 'best self' would handle difficult situations, building emotional resilience and new neural pathways for better responses."
  },
  {
    question: "How do I create an Episode Anthem?",
    answer: "In the Episode Detail View, click 'Create Episode Anthem' to generate a custom AI song based on your episode objective. This becomes the motivating soundtrack for your sprint, similar to how your Chief Aim can become a rap or song."
  },
  {
    question: "What's included in the subscription?",
    answer: "The $29/month subscription includes 1,000 monthly credits for AI generation, unlimited access to Director AI coaching, Mind Movie tools, the Edit Bay studio, Timeline Editor, Episodes System, daily tracking features, and community access. You also get a 3-day free trial with 250 credits to explore."
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
    question: "How do I get the best results from AI generation?",
    answer: "Be specific and descriptive in your prompts. Include details about setting, lighting, mood, and style. For personal likeness, create your Hero Character first. The AI will use your hero images as references for all generations."
  },
  {
    question: "How long should I watch my Mind Movie?",
    answer: "Watch your Mind Movie every morning right after waking (when your mind is most suggestible) and every evening before sleep. Keep the video under 5 minutes for maximum focus. Consistency matters more than duration - a 90-day streak is transformational."
  },
  {
    question: "How many credits do I get per month?",
    answer: "Subscribers receive 1,000 credits monthly. You can purchase additional credits in packs of $10 (1,000), $20 (2,200 with bonus), or $30 (3,500 with bonus). Credits never expire."
  },
  {
    question: "Can I delete Episodes?",
    answer: "Yes! You can delete any episode regardless of its status (active, completed, paused, or abandoned). Open the episode card and click the delete button. A confirmation dialog ensures you don't delete by accident."
  },
  {
    question: "How do I submit my Mind Movie to the community?",
    answer: "Open the Movie Vault from the Mind Movie Studio. Find a completed movie with a video, then click 'Submit to Community'. Add a description and confirm. Your movie will appear in the community voting pool where other Directors can vote and provide feedback."
  },
  {
    question: "What is Director Radio?",
    answer: "Director Radio is a curated music streaming feature within Psycho-Cinematics™. It includes admin-curated playlists, community-submitted tracks, and featured 'Now Playing' songs. Listen while you work on your transformation for motivation and focus."
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel anytime from Settings → Subscription. You'll retain access until the end of your billing period. Purchased credits never expire and remain available even after cancellation."
  },
  {
    question: "How do I change the Director AI voice?",
    answer: "In the Director AI interface, click the Settings icon (gear) to access Voice & Personality settings. Choose from 10 AI voices — 5 male and 5 female. Your selection is saved automatically."
  },
  {
    question: "What personality presets are available for Director AI?",
    answer: "There are 6 personality presets: Swag Coach (confident street energy), Executive Coach (professional strategic), Hype Master (high energy motivation), Zen Guide (calm mindful approach), Drill Sergeant (direct no-nonsense), and Best Friend (warm supportive). Each changes how the AI communicates while maintaining the Psycho-Cinematics methodology."
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
            Your complete guide to mastering the Psycho-Cinematics™ system and creating your transformation
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="quick-start" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
            <TabsTrigger value="quick-start" className="gap-2">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Start</span>
              <span className="sm:hidden">Start</span>
            </TabsTrigger>
            <TabsTrigger value="manuals" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Manuals</span>
              <span className="sm:hidden">Manuals</span>
            </TabsTrigger>
            <TabsTrigger value="user-manual" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Full Guide</span>
              <span className="sm:hidden">Guide</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">FAQ</span>
              <span className="sm:hidden">FAQ</span>
            </TabsTrigger>
          </TabsList>

          {/* Quick Start Tab */}
          <TabsContent value="quick-start" className="space-y-6">
            {/* Progress Tracker */}
            <Card className="border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gold" />
                    Your Progress
                  </span>
                  <Badge variant="outline" className="border-gold text-gold">
                    {completedSections.length} / {tutorialSections.length} Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gold to-amber-500 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tutorial Sections */}
            <div className="space-y-4">
              {tutorialSections.map((section) => (
                <Card key={section.id} className={completedSections.includes(section.id) ? "border-green-500/50 bg-green-500/5" : ""}>
                  <Accordion type="single" collapsible>
                    <AccordionItem value={section.id} className="border-none">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center gap-4 w-full">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            completedSections.includes(section.id) 
                              ? "bg-green-500/20 text-green-500" 
                              : "bg-gold/20 text-gold"
                          }`}>
                            {completedSections.includes(section.id) 
                              ? <CheckCircle2 className="w-6 h-6" />
                              : section.icon
                            }
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-lg">{section.title}</h3>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <div className="space-y-6 ml-16">
                          {/* Steps */}
                          <div className="space-y-4">
                            {section.steps.map((step, index) => (
                              <div key={index} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0 text-sm font-bold text-gold">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium mb-1">{step.title}</p>
                                  <p className="text-sm text-muted-foreground">{step.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Tips */}
                          {section.tips && section.tips.length > 0 && (
                            <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                              <h4 className="font-semibold text-gold mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                Pro Tips
                              </h4>
                              <ul className="space-y-1">
                                {section.tips.map((tip, index) => (
                                  <li key={index} className="text-sm text-muted-foreground flex gap-2">
                                    <span className="text-gold">•</span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Mark Complete Button */}
                          <Button 
                            variant={completedSections.includes(section.id) ? "outline" : "default"}
                            onClick={() => toggleComplete(section.id)}
                            className="gap-2"
                          >
                            {completedSections.includes(section.id) ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Completed!
                              </>
                            ) : (
                              <>
                                <CirclePlay className="w-4 h-4" />
                                Mark as Complete
                              </>
                            )}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Manuals Tab */}
          <TabsContent value="manuals" className="space-y-6">
            <Tabs defaultValue="chief-aim" className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-6">
                <TabsTrigger value="chief-aim" className="data-[state=active]:bg-gold/20">Chief Aim</TabsTrigger>
                <TabsTrigger value="hero-character" className="data-[state=active]:bg-gold/20">Hero Character</TabsTrigger>
                <TabsTrigger value="archetypes" className="data-[state=active]:bg-gold/20">11 Spheres</TabsTrigger>
                <TabsTrigger value="episodes" className="data-[state=active]:bg-gold/20">Episodes</TabsTrigger>
                <TabsTrigger value="movie-studio" className="data-[state=active]:bg-gold/20">Movie Studio</TabsTrigger>
                <TabsTrigger value="edit-bay" className="data-[state=active]:bg-gold/20">Edit Bay</TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-gold/20">Timeline Editor</TabsTrigger>
                <TabsTrigger value="challenges" className="data-[state=active]:bg-gold/20">Challenges</TabsTrigger>
                <TabsTrigger value="rituals" className="data-[state=active]:bg-gold/20">Daily Rituals</TabsTrigger>
                <TabsTrigger value="integrations" className="data-[state=active]:bg-gold/20">Integrations</TabsTrigger>
                <TabsTrigger value="community" className="data-[state=active]:bg-gold/20">Community</TabsTrigger>
              </TabsList>

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
                            A specific date by which you'll achieve this goal. Creates your countdown clock.
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

                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Final Scene Countdown
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Once you set your "By When" date, a countdown clock appears on your dashboard banner 
                        showing exactly how many days, hours, and minutes remain until your deadline.
                      </p>
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
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">2</span>
                          <div>
                            <p className="font-medium">Describe Your Ideal Self</p>
                            <p className="text-sm text-muted-foreground">
                              Enter your desired physical characteristics: height, weight, build, and distinguishing features.
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">3</span>
                          <div>
                            <p className="font-medium">Generate Hero Images</p>
                            <p className="text-sm text-muted-foreground">
                              Click "Generate Hero Images" to create professional front, side, and back views.
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <span className="w-8 h-8 rounded-full bg-gold text-background font-bold flex items-center justify-center shrink-0">4</span>
                          <div>
                            <p className="font-medium">Download & Use</p>
                            <p className="text-sm text-muted-foreground">
                              Images are automatically used as references for all future AI generations.
                            </p>
                          </div>
                        </li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 11 Spheres / Archetypes */}
              <TabsContent value="archetypes" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-gold" />
                      The 11 Metu Neter Spheres
                    </CardTitle>
                    <CardDescription>
                      Understanding your archetype through the Tree of Life
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                      <h4 className="font-semibold text-gold mb-2">The Metu Neter System</h4>
                      <p className="text-sm text-muted-foreground">
                        The 11 archetypes are based on the Spheres and Laws of the Metu Neter (Paut Neteru/Tree of Life). 
                        Each sphere represents a divine principle and law that governs transformation. Understanding your 
                        archetype helps you recognize your natural gifts, anticipate your blind spots, and navigate your 
                        hero's journey with greater awareness.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">The 11 Spheres</h4>
                      <div className="space-y-3">
                        {[
                          { sphere: 0, name: "The Witness", deity: "Amen", law: "Law of Divine Consciousness" },
                          { sphere: 1, name: "The Sovereign", deity: "Ausar", law: "Law of Divine Selfhood" },
                          { sphere: 2, name: "The Master Mind", deity: "Tehuti", law: "Law of Divine Wisdom" },
                          { sphere: 3, name: "The Alchemist", deity: "Seker", law: "Law of Divine Transformation" },
                          { sphere: 4, name: "The Divine Analyst", deity: "Maat", law: "Law of Divine Truth" },
                          { sphere: 5, name: "The Sacred Judge", deity: "Herukhuti", law: "Law of Divine Justice" },
                          { sphere: 6, name: "The Hero", deity: "Heru", law: "Law of Divine Will" },
                          { sphere: 7, name: "The Harmonizer", deity: "Het-Heru", law: "Law of Divine Love" },
                          { sphere: 8, name: "The Strategist", deity: "Sebek", law: "Law of Divine Intelligence" },
                          { sphere: 9, name: "The Nurturer", deity: "Auset", law: "Law of Divine Devotion" },
                          { sphere: 10, name: "The Builder", deity: "Geb", law: "Law of Divine Materialization" }
                        ].map((item) => (
                          <div key={item.sphere} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-gold">{item.sphere}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{item.name}</span>
                                  <Badge variant="outline" className="text-xs border-gold/30 text-gold">{item.deity}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{item.law}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Profile Elements</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
                          <p className="font-medium text-sm text-gold">Deity/Principle</p>
                          <p className="text-xs text-muted-foreground">The Kemetic Neter that governs this sphere</p>
                        </div>
                        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                          <p className="font-medium text-sm text-cyan-400">The Law</p>
                          <p className="text-xs text-muted-foreground">The spiritual law this archetype embodies</p>
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <p className="font-medium text-sm text-emerald-400">Role</p>
                          <p className="text-xs text-muted-foreground">How this archetype functions in your life</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                          <p className="font-medium text-sm text-purple-400">Director's Note</p>
                          <p className="text-xs text-muted-foreground">A coaching mantra capturing the essence</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Episodes */}
              <TabsContent value="episodes" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Film className="w-6 h-6 text-gold" />
                      Episodes System
                    </CardTitle>
                    <CardDescription>
                      Break your Chief Aim into tactical sprints with dedicated productions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                      <h4 className="font-semibold text-gold mb-2">What Are Episodes?</h4>
                      <p className="text-sm text-muted-foreground">
                        Episodes are time-bound tactical sprints (7, 14, 21, or 30 days) that break your Chief Aim 
                        into achievable milestones. Each episode has its own objective, Mind Movie, soundtrack, and 
                        production workflow.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Episode Features</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">🎬 Episode Mind Movies</p>
                          <p className="text-xs text-muted-foreground">Create sprint-specific visualizations</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">🎵 Episode Anthems</p>
                          <p className="text-xs text-muted-foreground">Generate songs from your episode objective</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">📊 Production Dashboard</p>
                          <p className="text-xs text-muted-foreground">Track your episode's production progress</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">⚔️ Episode Challenges</p>
                          <p className="text-xs text-muted-foreground">Link adversity training to specific sprints</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">📺 Theater Playback</p>
                          <p className="text-xs text-muted-foreground">Watch episode movies in The Theater</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-medium text-sm">🗑️ Delete Anytime</p>
                          <p className="text-xs text-muted-foreground">Remove episodes regardless of status</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-green-400">Pro Tip:</strong> Use "Upload My Movie" in the Production Dashboard 
                        to skip the full production workflow and directly upload a completed video.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Movie Studio */}
              <TabsContent value="movie-studio" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clapperboard className="w-6 h-6 text-gold" />
                      Psycho Cinematic Movie Studio
                    </CardTitle>
                    <CardDescription>
                      Your unified hub for all production tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                      <h4 className="font-semibold text-gold mb-2">The Movie Studio</h4>
                      <p className="text-sm text-muted-foreground">
                        Access all production tools from one unified hub. The Movie Studio organizes your workflow 
                        from planning to completion.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">The Four Modules</h4>
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
                          <div className="flex items-center gap-3 mb-2">
                            <Film className="w-6 h-6 text-amber-500" />
                            <span className="font-semibold text-amber-400">1. Storyboard — Plan Your Vision</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Map out your Mind Movie scenes with AI-generated storyboards based on your Chief Aim.
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border border-gold/30 bg-gold/10">
                          <div className="flex items-center gap-3 mb-2">
                            <Palette className="w-6 h-6 text-gold" />
                            <span className="font-semibold text-gold">2. The Edit Bay — Create Assets</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Generate AI images and videos using Veo 3, Wan 2.1, Kling, and other cutting-edge models.
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border border-pink-500/30 bg-pink-500/10">
                          <div className="flex items-center gap-3 mb-2">
                            <Music className="w-6 h-6 text-pink-500" />
                            <span className="font-semibold text-pink-400">3. Soundtrack Studio — Add Music</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Create custom AI-generated songs with 50+ genres and optional lyrics from your Chief Aim.
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
                          <div className="flex items-center gap-3 mb-2">
                            <Save className="w-6 h-6 text-amber-500" />
                            <span className="font-semibold text-amber-400">4. Mind Movie Vault — Manage & Watch</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Store, organize, and watch your completed Mind Movies. Submit to community for recognition.
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
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">A</kbd>
                          <span className="text-sm">Add Audio Track</span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">Space</kbd>
                          <span className="text-sm">Play/Pause</span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">⌘/Ctrl+Z</kbd>
                          <span className="text-sm">Undo</span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                          <kbd className="px-2 py-1 rounded bg-background border text-xs font-mono">Delete</kbd>
                          <span className="text-sm">Remove Selected</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Challenges */}
              <TabsContent value="challenges" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Swords className="w-6 h-6 text-gold" />
                      Adversity Challenges
                    </CardTitle>
                    <CardDescription>
                      Train your nervous system to respond like your best self
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                      <h4 className="font-semibold text-gold mb-2">What Are Adversity Challenges?</h4>
                      <p className="text-sm text-muted-foreground">
                        Adversity Challenges are AI-generated scenarios that trigger emotional reactions, allowing you 
                        to practice your ideal response. You essentially rehearse how your "best self" would handle 
                        difficult situations, building new neural pathways for better real-life responses.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">The KUT Technique</h4>
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                          <p className="font-medium text-sm text-red-400">1. Recognize</p>
                          <p className="text-xs text-muted-foreground">Notice the off-script thought or reaction</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <p className="font-medium text-sm text-amber-400">2. KUT!</p>
                          <p className="text-xs text-muted-foreground">Mentally yell "KUT!" to stop the scene</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <p className="font-medium text-sm text-blue-400">3. Reset</p>
                          <p className="text-xs text-muted-foreground">Take 3 deep breaths and reconnect with your Director self</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <p className="font-medium text-sm text-green-400">4. Resume</p>
                          <p className="text-xs text-muted-foreground">Take an aligned action that matches your Chief Aim identity</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Daily Rituals */}
              <TabsContent value="rituals" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-gold" />
                      Daily Rituals & Scorecard
                    </CardTitle>
                    <CardDescription>
                      The daily practice that drives transformation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4">Morning Ritual</h4>
                      <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                        <li><strong>Script Review</strong> — Read your Definite Chief Aim aloud (click to open full script)</li>
                        <li><strong>Morning Screening</strong> — Watch your Mind Movie in The Theater</li>
                        <li><strong>Three Things</strong> — Set your 3 priority tasks for the day</li>
                      </ol>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4">Evening Scorecard (0-3 Scale)</h4>
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

                    <div>
                      <h4 className="font-semibold mb-4">Scoring Rubric</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                          <p className="font-bold text-red-400">0</p>
                          <p className="text-xs text-muted-foreground">Off-Script</p>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                          <p className="font-bold text-amber-400">1</p>
                          <p className="text-xs text-muted-foreground">Rehearsing</p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                          <p className="font-bold text-blue-400">2</p>
                          <p className="text-xs text-muted-foreground">In Character</p>
                        </div>
                        <div className="p-2 rounded-lg bg-gold/10 border border-gold/30 text-center">
                          <p className="font-bold text-gold">3</p>
                          <p className="text-xs text-muted-foreground">Oscar-Worthy</p>
                        </div>
                      </div>
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
                      All integrations are managed in <strong>Settings → Integrations</strong>.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-foreground" />
                          <span className="font-medium">Notion</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Auto-sync journal, scorecards, and Chief Aim to your Notion workspace.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-5 h-5 text-foreground" />
                          <span className="font-medium">Slack</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Morning ritual and evening scorecard reminders in Slack.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Send className="w-5 h-5 text-foreground" />
                          <span className="font-medium">Telegram</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Mobile push notifications for all reminders and achievements.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Mic2 className="w-5 h-5 text-foreground" />
                          <span className="font-medium">ElevenLabs</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Use your cloned voices in Voice Changer and Director AI.
                        </p>
                      </div>
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
                    <div>
                      <h4 className="font-semibold mb-4">Recognition Programs</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Film className="w-5 h-5 text-purple-400" />
                            <span className="font-medium">Movie of the Week</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Highest-voted community Mind Movie featured on the homepage.
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-green-400" />
                            <span className="font-medium">Director of the Month</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Monthly recognition for top performers based on streaks and scores.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4">Annual Awards</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
                          <p className="font-medium text-sm text-gold">🏆 Best Mind Movie</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                          <p className="font-medium text-sm text-purple-400">🔥 Longest Streak</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <p className="font-medium text-sm text-blue-400">⭐ Top Director Score</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <p className="font-medium text-sm text-green-400">🎬 Most Movies Created</p>
                        </div>
                        <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
                          <p className="font-medium text-sm text-pink-400">💫 Community Favorite</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <p className="font-medium text-sm text-amber-400">🌟 Rising Star</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Full User Manual Tab */}
          <TabsContent value="user-manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-gold" />
                  Complete User Manual
                </CardTitle>
                <CardDescription>
                  Comprehensive documentation of all features and functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <div className="space-y-8 text-sm">
                  {/* Section 1: Overview */}
                  <section id="manual-overview">
                    <h3 className="text-xl font-semibold text-gold mb-4">1. Overview</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        <strong>Psycho-Cinematics™ Director's OS</strong> is a transformational lifestyle app for 
                        entrepreneurs and high-achievers. It combines Maxwell Maltz's Psycho-Cybernetics, Napoleon Hill's 
                        17 Laws of Success, and the ancient wisdom of the Metu Neter with modern AI technology.
                      </p>
                      <p>
                        You are the <strong>Director</strong> of your life movie. This platform gives you the tools to 
                        visualize, script, and produce the transformation you desire through daily rituals, AI coaching, 
                        and creative production tools.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 2: Chief Aim */}
                  <section id="manual-chief-aim">
                    <h3 className="text-xl font-semibold text-gold mb-4">2. Definite Chief Aim</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        Your Definite Chief Aim is the foundation of your transformation. It consists of four components:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>The Dream (What)</strong> — Exactly what you want to achieve</li>
                        <li><strong>The Deadline (By When)</strong> — A specific target date</li>
                        <li><strong>The Exchange (What You'll Give)</strong> — Your committed sacrifice</li>
                        <li><strong>The Plan (First Steps)</strong> — Immediate actions to begin</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">Final Scene Countdown</h4>
                      <p>
                        Once you set your "By When" date, a countdown clock appears on your dashboard banner showing 
                        days, hours, and minutes until your deadline.
                      </p>
                      <h4 className="font-semibold text-foreground">Script Review Ritual</h4>
                      <p>
                        Click the "Script Review" item in your Daily Rituals to open your full Chief Aim script. 
                        Read it aloud with emotion every morning and evening.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 3: Character & Archetypes */}
                  <section id="manual-character">
                    <h3 className="text-xl font-semibold text-gold mb-4">3. Character Builder & 11 Spheres</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <h4 className="font-semibold text-foreground">The 11 Metu Neter Archetypes</h4>
                      <p>
                        The Character Builder uses 11 gender-neutral archetypes based on the Spheres and Laws of the 
                        Metu Neter (Paut Neteru/Tree of Life). Each profile includes:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Sphere Number</strong> — Position on the Tree of Life (0-10)</li>
                        <li><strong>Deity/Principle</strong> — The Kemetic Neter governing this sphere</li>
                        <li><strong>The Law</strong> — The spiritual principle embodied</li>
                        <li><strong>Role</strong> — How this archetype functions in your life</li>
                        <li><strong>Director's Note</strong> — A coaching mantra</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">Hero Character Creator</h4>
                      <p>
                        Create your visual "Best Self" identity by uploading a reference photo and describing your 
                        ideal physical traits. Generate hero images (front, side, back) that are used as references 
                        for all AI-generated content.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 4: Episodes */}
                  <section id="manual-episodes">
                    <h3 className="text-xl font-semibold text-gold mb-4">4. Episodes System</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        Episodes are time-bound tactical sprints (7, 14, 21, or 30 days) that break your Chief Aim 
                        into achievable milestones.
                      </p>
                      <h4 className="font-semibold text-foreground">Episode Features</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Episode Mind Movies</strong> — Sprint-specific visualizations</li>
                        <li><strong>Episode Anthems</strong> — AI songs from your episode objective</li>
                        <li><strong>Production Dashboard</strong> — Step-by-step workflow tracking</li>
                        <li><strong>Upload My Movie</strong> — Skip production and upload directly</li>
                        <li><strong>Theater Playback</strong> — Watch episode movies in The Theater</li>
                        <li><strong>Delete Anytime</strong> — Remove episodes regardless of status</li>
                      </ul>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 5: Movie Studio */}
                  <section id="manual-movie-studio">
                    <h3 className="text-xl font-semibold text-gold mb-4">5. Psycho Cinematic Movie Studio</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        The Movie Studio is your unified hub for all production tools, organized by workflow:
                      </p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li><strong>Storyboard</strong> — Plan your vision with AI-generated scenes</li>
                        <li><strong>The Edit Bay</strong> — Generate images and videos with AI</li>
                        <li><strong>Soundtrack Studio</strong> — Create custom AI music and lyrics</li>
                        <li><strong>Mind Movie Vault</strong> — Store and manage your movies</li>
                      </ol>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 6: Challenges */}
                  <section id="manual-challenges">
                    <h3 className="text-xl font-semibold text-gold mb-4">6. Adversity Challenges</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        Adversity Challenges are AI-generated scenarios that trigger emotional reactions. You practice 
                        visualizing your ideal response, building new neural pathways for better real-life responses.
                      </p>
                      <h4 className="font-semibold text-foreground">The KUT Technique</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li><strong>Recognize</strong> — Notice the off-script thought</li>
                        <li><strong>KUT!</strong> — Mentally yell "KUT!" to stop</li>
                        <li><strong>Reset</strong> — Take 3 deep breaths</li>
                        <li><strong>Resume</strong> — Take an aligned action</li>
                      </ol>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 7: Daily Rituals */}
                  <section id="manual-rituals">
                    <h3 className="text-xl font-semibold text-gold mb-4">7. Daily Rituals & Scorecard</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <h4 className="font-semibold text-foreground">Morning Ritual</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Read your Definite Chief Aim aloud (Script Review)</li>
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

                  {/* Section 8: 21-Day Cycles */}
                  <section id="manual-cycles">
                    <h3 className="text-xl font-semibold text-gold mb-4">8. 21-Day Transformation Cycles</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        Research shows it takes approximately 21 days to form new neural pathways and habits. Each 21-day 
                        cycle is a focused period for embedding one aspect of your transformation.
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

                  {/* Section 9: Community */}
                  <section id="manual-community">
                    <h3 className="text-xl font-semibold text-gold mb-4">9. Community & Awards</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <h4 className="font-semibold text-foreground">Director's Corner</h4>
                      <p>
                        Share your Mind Movies with the community. Vote for others' work. Get inspired by seeing what 
                        fellow Directors are manifesting. Create your public profile with collaboration preferences.
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
