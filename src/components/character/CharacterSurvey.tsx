import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, User, X } from "lucide-react";
import { ARCHETYPES, Archetype } from "./archetypes";

interface SurveyQuestion {
  id: string;
  question: string;
  category: string;
  options: {
    text: string;
    archetypeScores: Record<string, number>;
    isNegative?: boolean;
  }[];
}

// Napoleon Hill-inspired comprehensive character assessment with shadow options
const SURVEY_QUESTIONS: SurveyQuestion[] = [
  // DESIRE & GOAL SETTING (Sovereign, Wayfinder)
  {
    id: "q1",
    question: "Do you have a DEFINITE MAJOR PURPOSE in life, and if so, what plan have you adopted for attaining it?",
    category: "Desire & Purpose",
    options: [
      { text: "I have a clear vision and a structured plan to achieve it", archetypeScores: { sovereign: 3, master_builder: 2 } },
      { text: "I have a vision but my path to it is still forming", archetypeScores: { wayfinder: 3, alchemist: 1 } },
      { text: "I focus more on meaningful daily actions than end goals", archetypeScores: { still_center: 2, harmonizer: 2 } },
      { text: "I'm still discovering what my true purpose is", archetypeScores: { divine_analyst: 2, truth_keeper: 2 } },
      { text: "I don't have a plan - I just go where life takes me", archetypeScores: { wayfinder: 1 }, isNegative: true },
      { text: "I've given up on having a major purpose - it feels pointless", archetypeScores: { still_center: 1 }, isNegative: true }
    ]
  },
  {
    id: "q2",
    question: "Do you work with a DEFINITE CHIEF AIM that you review and affirm daily?",
    category: "Goal Setting",
    options: [
      { text: "Yes, I have a written aim I review every morning and night", archetypeScores: { master_builder: 3, sovereign: 2 } },
      { text: "I have goals in my mind but don't formalize them", archetypeScores: { wayfinder: 2, divine_analyst: 2 } },
      { text: "I prefer to stay flexible and respond to opportunities", archetypeScores: { harmonizer: 2, alchemist: 2 } },
      { text: "I'm working on defining my aim more clearly", archetypeScores: { truth_keeper: 2, still_center: 2 } },
      { text: "I've tried but I can never stick to reviewing it", archetypeScores: { wayfinder: 1 }, isNegative: true },
      { text: "I don't believe in goal-setting - it just leads to disappointment", archetypeScores: { alchemist: 1 }, isNegative: true }
    ]
  },
  // FAITH & SELF-CONFIDENCE (Sovereign, Protector)
  {
    id: "q3",
    question: "When facing impossible odds, what do you rely on most?",
    category: "Faith",
    options: [
      { text: "Unshakeable belief in my ability to figure it out", archetypeScores: { sovereign: 3, protector: 1 } },
      { text: "Trust in a higher power or universal intelligence", archetypeScores: { still_center: 3, wayfinder: 1 } },
      { text: "My network of relationships and alliances", archetypeScores: { weaver: 3, harmonizer: 1 } },
      { text: "Careful analysis and preparation", archetypeScores: { divine_analyst: 3, master_builder: 1 } },
      { text: "Honestly, I freeze up and hope someone else handles it", archetypeScores: { harmonizer: 1 }, isNegative: true },
      { text: "I usually give up before trying - the odds are impossible for a reason", archetypeScores: { still_center: 1 }, isNegative: true }
    ]
  },
  {
    id: "q4",
    question: "How would you rate your level of SELF-CONFIDENCE?",
    category: "Self-Confidence",
    options: [
      { text: "Very high - I believe in myself completely", archetypeScores: { sovereign: 3, alchemist: 1 } },
      { text: "High in my areas of expertise, developing in others", archetypeScores: { master_builder: 2, divine_analyst: 2 } },
      { text: "I draw confidence from supporting others", archetypeScores: { protector: 2, harmonizer: 2 } },
      { text: "Growing through overcoming past struggles", archetypeScores: { alchemist: 3, wayfinder: 1 } },
      { text: "Low - I constantly doubt myself and my abilities", archetypeScores: { truth_keeper: 1 }, isNegative: true },
      { text: "I fake confidence but inside I feel like an imposter", archetypeScores: { weaver: 1 }, isNegative: true }
    ]
  },
  // AUTO-SUGGESTION & MINDSET (Alchemist, Divine Analyst)
  {
    id: "q5",
    question: "How do you typically talk to yourself when facing setbacks?",
    category: "Self-Talk",
    options: [
      { text: "I analyze what went wrong and adjust my approach", archetypeScores: { divine_analyst: 3, master_builder: 1 } },
      { text: "I use the challenge as fuel for transformation", archetypeScores: { alchemist: 3, protector: 1 } },
      { text: "I remind myself of my purpose and stay the course", archetypeScores: { sovereign: 2, wayfinder: 2 } },
      { text: "I seek wisdom and maintain inner peace", archetypeScores: { still_center: 3, truth_keeper: 1 } },
      { text: "I beat myself up - calling myself stupid, a failure, worthless", archetypeScores: { alchemist: 1 }, isNegative: true },
      { text: "I spiral into blame - it's always someone else's fault", archetypeScores: { sacred_judge: 1 }, isNegative: true },
      { text: "I go into victim mode - 'why does this always happen to me?'", archetypeScores: { harmonizer: 1 }, isNegative: true }
    ]
  },
  {
    id: "q6",
    question: "Do you practice any form of daily mental conditioning or visualization?",
    category: "Mental Discipline",
    options: [
      { text: "Yes, I have a structured morning/evening routine", archetypeScores: { master_builder: 3, sovereign: 1 } },
      { text: "I visualize my goals and desired outcomes regularly", archetypeScores: { wayfinder: 2, alchemist: 2 } },
      { text: "I practice meditation or mindfulness", archetypeScores: { still_center: 3, harmonizer: 1 } },
      { text: "I prefer intellectual study and learning", archetypeScores: { divine_analyst: 2, truth_keeper: 2 } },
      { text: "I've tried but I can't stick to any routine", archetypeScores: { wayfinder: 1 }, isNegative: true },
      { text: "No - I think that stuff is a waste of time", archetypeScores: { master_builder: 1 }, isNegative: true }
    ]
  },
  // SPECIALIZED KNOWLEDGE (Divine Analyst, Master Builder)
  {
    id: "q7",
    question: "How do you approach acquiring knowledge in your field?",
    category: "Knowledge",
    options: [
      { text: "Deep specialization - mastering one domain completely", archetypeScores: { master_builder: 3, divine_analyst: 1 } },
      { text: "Broad curiosity - connecting knowledge across fields", archetypeScores: { divine_analyst: 2, wayfinder: 2 } },
      { text: "Practical application - learning by doing", archetypeScores: { alchemist: 2, protector: 2 } },
      { text: "Social learning - through relationships and mentors", archetypeScores: { weaver: 2, harmonizer: 2 } },
      { text: "I don't invest in learning - I already know enough", archetypeScores: { sovereign: 1 }, isNegative: true },
      { text: "I'm too overwhelmed to learn anything new", archetypeScores: { still_center: 1 }, isNegative: true }
    ]
  },
  {
    id: "q8",
    question: "What's your relationship with truth and honesty?",
    category: "Integrity",
    options: [
      { text: "I speak truth regardless of consequences", archetypeScores: { truth_keeper: 3, sacred_judge: 1 } },
      { text: "I balance honesty with tact and timing", archetypeScores: { harmonizer: 2, divine_analyst: 2 } },
      { text: "I believe actions speak louder than words", archetypeScores: { master_builder: 2, protector: 2 } },
      { text: "I seek deeper truths beyond surface appearances", archetypeScores: { still_center: 2, alchemist: 2 } },
      { text: "I often lie or exaggerate to make myself look better", archetypeScores: { weaver: 1 }, isNegative: true },
      { text: "I tell people what they want to hear to avoid conflict", archetypeScores: { harmonizer: 1 }, isNegative: true }
    ]
  },
  // IMAGINATION (Wayfinder, Alchemist)
  {
    id: "q9",
    question: "How do you typically use your imagination?",
    category: "Imagination",
    options: [
      { text: "To envision and plan future possibilities", archetypeScores: { wayfinder: 3, sovereign: 1 } },
      { text: "To solve problems creatively", archetypeScores: { divine_analyst: 2, master_builder: 2 } },
      { text: "To transform pain into meaning and art", archetypeScores: { alchemist: 3, still_center: 1 } },
      { text: "To understand others' perspectives", archetypeScores: { harmonizer: 2, weaver: 2 } },
      { text: "To imagine all the ways things could go wrong (catastrophizing)", archetypeScores: { divine_analyst: 1 }, isNegative: true },
      { text: "I rarely use my imagination - I'm too practical for that", archetypeScores: { master_builder: 1 }, isNegative: true }
    ]
  },
  // ORGANIZED PLANNING (Master Builder, Sovereign)
  {
    id: "q10",
    question: "How would you describe your approach to planning?",
    category: "Planning",
    options: [
      { text: "Systematic and detailed - I plan everything thoroughly", archetypeScores: { master_builder: 3, divine_analyst: 1 } },
      { text: "Strategic - I focus on key leverage points", archetypeScores: { sovereign: 2, weaver: 2 } },
      { text: "Flexible - I adapt plans as circumstances change", archetypeScores: { wayfinder: 2, alchemist: 2 } },
      { text: "Intuitive - I trust the process to unfold", archetypeScores: { still_center: 2, harmonizer: 2 } },
      { text: "I make plans but never follow through on them", archetypeScores: { wayfinder: 1 }, isNegative: true },
      { text: "I wing everything - planning feels like a waste of time", archetypeScores: { alchemist: 1 }, isNegative: true }
    ]
  },
  // DECISION (Sovereign, Sacred Judge)
  {
    id: "q11",
    question: "How do you typically make important decisions?",
    category: "Decision Making",
    options: [
      { text: "Quickly and definitively - I trust my judgment", archetypeScores: { sovereign: 3, protector: 1 } },
      { text: "After careful analysis of all factors", archetypeScores: { divine_analyst: 3, truth_keeper: 1 } },
      { text: "Based on what's fair and just for all involved", archetypeScores: { sacred_judge: 3, harmonizer: 1 } },
      { text: "By listening to my inner guidance", archetypeScores: { still_center: 2, wayfinder: 2 } },
      { text: "I avoid decisions as long as possible - I hate choosing", archetypeScores: { harmonizer: 1 }, isNegative: true },
      { text: "I let others decide for me so I don't have to take responsibility", archetypeScores: { weaver: 1 }, isNegative: true }
    ]
  },
  {
    id: "q12",
    question: "Once you make a decision, how do you handle it?",
    category: "Commitment",
    options: [
      { text: "I commit fully and don't look back", archetypeScores: { sovereign: 3, master_builder: 1 } },
      { text: "I stay open to new information that might change things", archetypeScores: { divine_analyst: 2, wayfinder: 2 } },
      { text: "I defend my decision but remain fair", archetypeScores: { sacred_judge: 2, protector: 2 } },
      { text: "I hold my decision lightly, trusting the outcome", archetypeScores: { still_center: 2, alchemist: 2 } },
      { text: "I second-guess myself constantly and change my mind", archetypeScores: { divine_analyst: 1 }, isNegative: true },
      { text: "I blame the decision if things go wrong - 'I knew this would happen'", archetypeScores: { truth_keeper: 1 }, isNegative: true }
    ]
  },
  // PERSISTENCE (Alchemist, Master Builder)
  {
    id: "q13",
    question: "When you face repeated failure, what do you do?",
    category: "Persistence",
    options: [
      { text: "I persist until I break through - failure is not an option", archetypeScores: { alchemist: 3, sovereign: 1 } },
      { text: "I analyze patterns and adjust my strategy", archetypeScores: { divine_analyst: 2, master_builder: 2 } },
      { text: "I seek support from my network and allies", archetypeScores: { weaver: 2, harmonizer: 2 } },
      { text: "I look for the lesson and redirect if needed", archetypeScores: { wayfinder: 2, still_center: 2 } },
      { text: "I quit - clearly I'm not meant to succeed at this", archetypeScores: { alchemist: 1 }, isNegative: true },
      { text: "I keep doing the same thing hoping for different results", archetypeScores: { master_builder: 1 }, isNegative: true }
    ]
  },
  {
    id: "q14",
    question: "What drives your persistence most?",
    category: "Motivation",
    options: [
      { text: "The need to prove myself and achieve mastery", archetypeScores: { sovereign: 2, master_builder: 2 } },
      { text: "A burning desire to transform my circumstances", archetypeScores: { alchemist: 3, wayfinder: 1 } },
      { text: "Responsibility to those who depend on me", archetypeScores: { protector: 3, harmonizer: 1 } },
      { text: "A vision of what's possible for the world", archetypeScores: { truth_keeper: 2, wayfinder: 2 } },
      { text: "Fear of being seen as a failure", archetypeScores: { sovereign: 1 }, isNegative: true },
      { text: "Nothing really - I struggle to stay motivated", archetypeScores: { still_center: 1 }, isNegative: true }
    ]
  },
  // MASTERMIND (Weaver, Harmonizer)
  {
    id: "q15",
    question: "How do you prefer to work with others?",
    category: "Collaboration",
    options: [
      { text: "I build and lead powerful alliances", archetypeScores: { weaver: 3, sovereign: 1 } },
      { text: "I create harmony and cooperation in groups", archetypeScores: { harmonizer: 3, still_center: 1 } },
      { text: "I prefer to work independently with occasional input", archetypeScores: { master_builder: 2, divine_analyst: 2 } },
      { text: "I mentor and develop others", archetypeScores: { still_center: 2, truth_keeper: 2 } },
      { text: "I avoid teamwork - other people just slow me down", archetypeScores: { sovereign: 1 }, isNegative: true },
      { text: "I let others do the work while I take credit", archetypeScores: { weaver: 1 }, isNegative: true }
    ]
  },
  {
    id: "q16",
    question: "What role do you naturally take in a group?",
    category: "Group Dynamics",
    options: [
      { text: "The leader who sets direction", archetypeScores: { sovereign: 3, master_builder: 1 } },
      { text: "The connector who brings people together", archetypeScores: { weaver: 3, harmonizer: 1 } },
      { text: "The protector who ensures everyone is safe", archetypeScores: { protector: 3, sacred_judge: 1 } },
      { text: "The wise one others come to for counsel", archetypeScores: { still_center: 2, divine_analyst: 2 } },
      { text: "The one who sits back and criticizes everyone else", archetypeScores: { sacred_judge: 1 }, isNegative: true },
      { text: "I fade into the background - I don't want to be noticed", archetypeScores: { harmonizer: 1 }, isNegative: true }
    ]
  },
  // THE SUBCONSCIOUS MIND & BRAIN (Still Center, Divine Analyst)
  {
    id: "q17",
    question: "How do you access your deeper wisdom?",
    category: "Inner Wisdom",
    options: [
      { text: "Through quiet reflection and meditation", archetypeScores: { still_center: 3, wayfinder: 1 } },
      { text: "Through rigorous analysis and study", archetypeScores: { divine_analyst: 3, truth_keeper: 1 } },
      { text: "Through intense experiences and challenges", archetypeScores: { alchemist: 3, protector: 1 } },
      { text: "Through dialogue and connection with others", archetypeScores: { harmonizer: 2, weaver: 2 } },
      { text: "I distract myself constantly - silence is uncomfortable", archetypeScores: { still_center: 1 }, isNegative: true },
      { text: "I don't believe I have any deeper wisdom", archetypeScores: { divine_analyst: 1 }, isNegative: true }
    ]
  },
  // THE SIXTH SENSE (Still Center, Wayfinder)
  {
    id: "q18",
    question: "Do you trust your intuition?",
    category: "Intuition",
    options: [
      { text: "Completely - it's my primary guidance system", archetypeScores: { still_center: 3, wayfinder: 1 } },
      { text: "I verify intuition with logic before acting", archetypeScores: { divine_analyst: 2, master_builder: 2 } },
      { text: "I use it for reading people and situations", archetypeScores: { weaver: 2, protector: 2 } },
      { text: "I'm developing my trust in it", archetypeScores: { alchemist: 2, truth_keeper: 2 } },
      { text: "No - my gut is usually wrong", archetypeScores: { truth_keeper: 1 }, isNegative: true },
      { text: "I ignore my intuition because it's not 'logical'", archetypeScores: { divine_analyst: 1 }, isNegative: true }
    ]
  },
  // OVERCOMING THE SIX BASIC FEARS (Protector, Alchemist)
  {
    id: "q19",
    question: "Which fear has been your greatest teacher?",
    category: "Fear Mastery",
    options: [
      { text: "Fear of criticism - I've learned to trust my own judgment", archetypeScores: { sovereign: 2, truth_keeper: 2 } },
      { text: "Fear of poverty - I've built security and abundance", archetypeScores: { master_builder: 2, protector: 2 } },
      { text: "Fear of loss of love - I've learned to love unconditionally", archetypeScores: { harmonizer: 2, still_center: 2 } },
      { text: "Fear of death/failure - I've transformed my relationship with endings", archetypeScores: { alchemist: 3, wayfinder: 1 } },
      { text: "Fear still controls me - I haven't learned from it", archetypeScores: { protector: 1 }, isNegative: true },
      { text: "I pretend I'm not afraid but fear runs most of my decisions", archetypeScores: { sovereign: 1 }, isNegative: true }
    ]
  },
  {
    id: "q20",
    question: "How do you respond when fear arises?",
    category: "Fear Response",
    options: [
      { text: "I take action immediately - move through it", archetypeScores: { protector: 2, sovereign: 2 } },
      { text: "I analyze the fear to understand its root", archetypeScores: { divine_analyst: 2, truth_keeper: 2 } },
      { text: "I sit with it and let it transform", archetypeScores: { alchemist: 2, still_center: 2 } },
      { text: "I seek support from trusted allies", archetypeScores: { weaver: 2, harmonizer: 2 } },
      { text: "I freeze and do nothing", archetypeScores: { still_center: 1 }, isNegative: true },
      { text: "I lash out in anger to mask the fear", archetypeScores: { protector: 1 }, isNegative: true },
      { text: "I run away or avoid the situation entirely", archetypeScores: { wayfinder: 1 }, isNegative: true }
    ]
  },
  // RESPONSE PATTERNS (All archetypes)
  {
    id: "q21",
    question: "When facing a crisis, what's your first instinct?",
    category: "Crisis Response",
    options: [
      { text: "Stay calm and help others stabilize", archetypeScores: { still_center: 3, protector: 1 } },
      { text: "Take charge and direct the response", archetypeScores: { sovereign: 3, master_builder: 1 } },
      { text: "Analyze what went wrong and find the truth", archetypeScores: { truth_keeper: 3, divine_analyst: 2 } },
      { text: "Rally people together for collective action", archetypeScores: { weaver: 3, harmonizer: 1 } },
      { text: "Panic and make things worse", archetypeScores: { alchemist: 1 }, isNegative: true },
      { text: "Blame someone and look for a scapegoat", archetypeScores: { sacred_judge: 1 }, isNegative: true }
    ]
  },
  {
    id: "q22",
    question: "What energizes you the most?",
    category: "Energy Source",
    options: [
      { text: "Creating order from chaos", archetypeScores: { master_builder: 3, sovereign: 1 } },
      { text: "Deep, meaningful conversations", archetypeScores: { still_center: 2, truth_keeper: 2 } },
      { text: "Bringing people together for a cause", archetypeScores: { weaver: 3, harmonizer: 1 } },
      { text: "Exploring new ideas and possibilities", archetypeScores: { wayfinder: 3, divine_analyst: 1 } },
      { text: "Drama and conflict - I thrive in chaos", archetypeScores: { alchemist: 1 }, isNegative: true },
      { text: "Nothing really energizes me anymore", archetypeScores: { still_center: 1 }, isNegative: true }
    ]
  },
  // EMOTIONAL PATTERNS (Harmonizer, Protector)
  {
    id: "q23",
    question: "When someone wrongs you, what do you feel first?",
    category: "Emotional Response",
    options: [
      { text: "A need to understand why they did it", archetypeScores: { divine_analyst: 3, truth_keeper: 1 } },
      { text: "A drive to set things right and fair", archetypeScores: { sacred_judge: 3, sovereign: 1 } },
      { text: "Protection instincts for myself and others", archetypeScores: { protector: 3, still_center: 1 } },
      { text: "I tend to transform pain into growth", archetypeScores: { alchemist: 3, wayfinder: 1 } },
      { text: "Rage - I want revenge", archetypeScores: { protector: 1 }, isNegative: true },
      { text: "I stuff it down and pretend I'm fine", archetypeScores: { harmonizer: 1 }, isNegative: true },
      { text: "I obsess about it for days/weeks/years", archetypeScores: { divine_analyst: 1 }, isNegative: true }
    ]
  },
  {
    id: "q24",
    question: "How do you handle conflict?",
    category: "Conflict Style",
    options: [
      { text: "I try to find common ground", archetypeScores: { harmonizer: 3, still_center: 1 } },
      { text: "I address it directly and decisively", archetypeScores: { sovereign: 2, truth_keeper: 2 } },
      { text: "I protect those who can't protect themselves", archetypeScores: { protector: 3, sacred_judge: 1 } },
      { text: "I use it as fuel for transformation", archetypeScores: { alchemist: 3, wayfinder: 1 } },
      { text: "I avoid it at all costs - conflict terrifies me", archetypeScores: { harmonizer: 1 }, isNegative: true },
      { text: "I escalate it - I never back down from a fight", archetypeScores: { protector: 1 }, isNegative: true },
      { text: "I talk behind people's backs instead of addressing them", archetypeScores: { weaver: 1 }, isNegative: true }
    ]
  },
  // SOCIAL PATTERNS (Weaver, Harmonizer)
  {
    id: "q25",
    question: "What do others most often come to you for?",
    category: "Social Role",
    options: [
      { text: "Emotional support and a calm presence", archetypeScores: { still_center: 3, harmonizer: 1 } },
      { text: "Leadership and direction", archetypeScores: { sovereign: 3, master_builder: 1 } },
      { text: "Honest feedback and truth-telling", archetypeScores: { truth_keeper: 3, sacred_judge: 1 } },
      { text: "Connections and introductions", archetypeScores: { weaver: 3, divine_analyst: 1 } },
      { text: "Nothing - people don't really come to me", archetypeScores: { still_center: 1 }, isNegative: true },
      { text: "To dump their problems - I'm everyone's emotional dumpster", archetypeScores: { harmonizer: 1 }, isNegative: true }
    ]
  },
  // SHADOW PATTERNS (All archetypes)
  {
    id: "q26",
    question: "What's your biggest personal struggle?",
    category: "Shadow Work",
    options: [
      { text: "Taking on too much responsibility", archetypeScores: { sovereign: 2, still_center: 2 } },
      { text: "Analysis paralysis and overthinking", archetypeScores: { divine_analyst: 3, wayfinder: 1 } },
      { text: "Intensity and self-destructive patterns", archetypeScores: { alchemist: 3, protector: 1 } },
      { text: "Caring too much what others think", archetypeScores: { harmonizer: 2, weaver: 2 } },
      { text: "Laziness and lack of discipline", archetypeScores: { master_builder: 1 }, isNegative: true },
      { text: "Addiction or compulsive behaviors", archetypeScores: { alchemist: 1 }, isNegative: true },
      { text: "Chronic negativity and pessimism", archetypeScores: { truth_keeper: 1 }, isNegative: true }
    ]
  },
  {
    id: "q27",
    question: "What's your biggest fear in relationships?",
    category: "Vulnerability",
    options: [
      { text: "Being seen as weak or incompetent", archetypeScores: { sovereign: 2, protector: 2 } },
      { text: "Being abandoned or forgotten", archetypeScores: { weaver: 3, harmonizer: 1 } },
      { text: "Losing my independence or being trapped", archetypeScores: { wayfinder: 3, alchemist: 1 } },
      { text: "Not being understood at my core", archetypeScores: { still_center: 2, divine_analyst: 2 } },
      { text: "I push everyone away before they can hurt me", archetypeScores: { protector: 1 }, isNegative: true },
      { text: "I become obsessive and controlling in relationships", archetypeScores: { sovereign: 1 }, isNegative: true }
    ]
  },
  // LEGACY & PURPOSE (Wayfinder, Master Builder)
  {
    id: "q28",
    question: "What legacy do you want to leave?",
    category: "Legacy",
    options: [
      { text: "Systems and structures that outlast me", archetypeScores: { master_builder: 3, sovereign: 1 } },
      { text: "Truth and justice revealed", archetypeScores: { truth_keeper: 2, sacred_judge: 2 } },
      { text: "Transformed lives and communities", archetypeScores: { alchemist: 2, wayfinder: 2 } },
      { text: "Bridges built between people", archetypeScores: { weaver: 2, harmonizer: 2 } },
      { text: "I don't care about legacy - I just want to survive", archetypeScores: { protector: 1 }, isNegative: true },
      { text: "I worry I won't leave any meaningful mark", archetypeScores: { wayfinder: 1 }, isNegative: true }
    ]
  }
];

interface CharacterSurveyProps {
  onComplete: (archetype: Archetype, scores: Record<string, number>, responses: Record<string, string>) => void;
  onClose: () => void;
}

export function CharacterSurvey({ onComplete, onClose }: CharacterSurveyProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});

  const question = SURVEY_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / SURVEY_QUESTIONS.length) * 100;

  const handleAnswer = (optionIndex: number) => {
    const option = question.options[optionIndex];
    
    // Update responses
    setResponses(prev => ({
      ...prev,
      [question.id]: option.text
    }));

    // Update archetype scores
    const newScores = { ...scores };
    Object.entries(option.archetypeScores).forEach(([archetype, score]) => {
      newScores[archetype] = (newScores[archetype] || 0) + score;
    });
    setScores(newScores);

    // Move to next question or complete
    if (currentQuestion < SURVEY_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Calculate winner
      const sortedArchetypes = Object.entries(newScores)
        .sort((a, b) => b[1] - a[1]);
      
      const winningArchetypeId = sortedArchetypes[0]?.[0];
      const winningArchetype = ARCHETYPES.find(a => a.id === winningArchetypeId);
      
      if (winningArchetype) {
        onComplete(winningArchetype, newScores, responses);
      }
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl glass-card cinematic-border">
          <CardHeader className="text-center space-y-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-gold" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display tracking-wide text-gold-gradient">
                Character Central
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Napoleon Hill Character Assessment
              </p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Question {currentQuestion + 1} of {SURVEY_QUESTIONS.length}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Category Tag */}
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {question.category}
              </span>
            </div>

            {/* Question */}
            <h3 className="text-lg font-medium text-center leading-relaxed px-2">
              {question.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full p-4 rounded-lg border transition-all text-left group ${
                    option.isNegative
                      ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40"
                      : "border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {option.isNegative && (
                      <span className="text-red-400 text-xs font-medium shrink-0 mt-0.5 px-2 py-0.5 bg-red-500/20 rounded">SHADOW</span>
                    )}
                    <span className={`text-sm transition-colors ${
                      option.isNegative 
                        ? "text-red-200/80 group-hover:text-red-200" 
                        : "group-hover:text-primary"
                    }`}>
                      {option.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Be brutally honest — shadow answers reveal growth opportunities.
            </p>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={currentQuestion === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Exit Survey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}