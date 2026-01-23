import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WHITE_PAPER_CONTENT = `
PSYCHO-CINEMATICS™ DIRECTOR'S OS
COMPREHENSIVE WHITE PAPER
Version 1.0 | Confidential - Admin Use Only

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY

Psycho-Cinematics™ is a revolutionary behavioral transformation system that leverages the psychology of filmmaking to engineer lasting identity shifts. By treating life as a production and the user as both the Director and Lead Actor of their own movie, the system creates powerful subconscious associations that bypass conscious resistance to change.

The platform combines Maxwell Maltz's Psycho-Cybernetics principles with Napoleon Hill's Laws of Success, delivered through Michael Rabiger's cinematic grammar. The result is a daily operating system that transforms goals into visceral, emotionally-charged visualizations that the subconscious mind accepts as reality.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 1: THEORETICAL FOUNDATION

1.1 THE THREE PILLARS

PILLAR 1: PSYCHO-CYBERNETICS (Maxwell Maltz)
- The self-image is the key to human personality and behavior
- Change the self-image and you change the personality and behavior
- The subconscious cannot distinguish between real and vividly imagined experiences
- The "Theater of the Mind" technique creates new neural pathways

PILLAR 2: THE LAWS OF SUCCESS (Napoleon Hill)
- The Definite Chief Aim provides singular focus and direction
- Auto-suggestion programs the subconscious through repetition
- The Master Mind principle amplifies individual power through community
- Faith, reinforced through ritual, manifests desired outcomes

PILLAR 3: CINEMATIC GRAMMAR (Michael Rabiger)
- Shot psychology creates specific emotional responses
- Editing rhythm controls the pace of subconscious programming
- Character arc structure provides a roadmap for transformation
- The "Observer vs. Storyteller" duality enables objective self-analysis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.2 THE THREE ROLES

Every user operates in three distinct roles:

ROLE 1: THE DIRECTOR
- Strategic vision and long-term planning
- Makes decisions about "what scenes to shoot"
- Responsible for the overall arc of the transformation
- Uses the AI Director as consultant and advisor

ROLE 2: THE LEAD ACTOR
- Daily execution and "staying in character"
- Embodies the traits of the Future Self
- Performs the actions aligned with the new identity
- Uses the Daily Scorecard to measure performance

ROLE 3: THE EDITOR
- Reflection and adjustment
- Reviews daily footage in the Director's Journal
- Makes "cuts" to remove negative behaviors
- Uses the KUT! Reset technique for pattern interrupts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 2: THE 7-PHASE FRAMEWORK

PHASE 1: PRE-PRODUCTION (Setup)
Duration: Days 1-7
Focus: Define the vision, create the Definite Chief Aim
Key Activities:
- Complete Character Survey to identify current archetype
- Write the 4-part Definite Chief Aim statement
- Create or designate Chief Aim Anthem
- Set up daily ritual schedule

PHASE 2: SCRIPT DEVELOPMENT (Design)
Duration: Week 2
Focus: Design the character and story arc
Key Activities:
- Define character traits for the Future Self
- Identify "marks" (triggers) and planned responses
- Create storyboards for key transformation scenes
- Establish Episode 1 goals

PHASE 3: CASTING & REHEARSAL (Practice)
Duration: Weeks 3-4
Focus: Begin embodying the new character
Key Activities:
- Daily "rehearsals" through visualization
- Practice character responses to triggers
- Record reference footage (Mind Movies)
- Refine the performance based on feedback

PHASE 4: PRINCIPAL PHOTOGRAPHY (Action)
Duration: Months 2-3
Focus: Full immersion in the new identity
Key Activities:
- Execute Episode sprints (7-21 day cycles)
- Track daily actions via Three Things module
- Score performance on Daily Scorecard
- Use KUT! Reset for pattern interrupts

PHASE 5: POST-PRODUCTION (Reflection)
Duration: Month 4
Focus: Review, edit, and refine
Key Activities:
- Weekly reviews in Director's Journal
- AI Character Analysis for data-driven insights
- Cycle reviews and Episode wrap reports
- Adjust character based on learnings

PHASE 6: DISTRIBUTION (Expansion)
Duration: Months 5-6
Focus: Share and amplify transformation
Key Activities:
- Share progress in Director's Corner community
- Create testimonials and case studies
- Submit content to Director Radio
- Participate in community challenges

PHASE 7: AWARDS SEASON (Celebration)
Duration: Ongoing / Annual
Focus: Recognition and continuation
Key Activities:
- Compete for monthly and annual awards
- Achieve Director Score milestones
- Set new Definite Chief Aim for next "season"
- Mentor new Directors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 3: CORE MODULES

3.1 THE DEFINITE CHIEF AIM (The Script)

The foundational module containing the user's 4-part vision statement:

Component 1: WHAT I WANT
- Specific, measurable outcome
- Written in present tense as if already achieved
- Emotionally charged language

Component 2: BY WHEN
- Specific deadline date
- Creates urgency and focus
- Aligned with Episode cycles

Component 3: THE EXCHANGE
- What the user will give in return
- Specific actions and sacrifices
- Creates accountability

Component 4: THE PLAN
- Step-by-step action items
- Broken into Episode-sized chunks
- Daily actionable tasks

CHIEF AIM ANTHEM
- Musical reinforcement of the vision
- AI-generated rap/song using character traits
- Daily listening completes ritual requirement
- Must be played uninterrupted for ritual credit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.2 MIND MOVIES (The Visualization Engine)

Purpose: Create visceral, emotionally-charged visualization content

Components:
- Storyboard Wizard: AI-assisted scene planning
- Image Generator: Creates visual scenes from prompts
- Video Generator: Animates storyboards into movies
- Edit Bay: Timeline editor for final production
- Movie Vault: Storage and playback of completed movies

Technical Features:
- Reference photo integration for character consistency
- Cinematography style selection (film noir, motivational, etc.)
- Scene-by-scene script input
- AI prompt enhancement for optimal results

Viewing Ritual:
- Must watch complete movie without interruption
- Tracked in Daily Ritual Checklist
- Viewing history recorded for streak calculation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.3 EPISODES (Sprint-Based Transformation)

Purpose: Break long-term goals into focused transformation sprints

Structure:
- Duration: 7-21 days (user-defined)
- Focus: Single theme or behavior change
- Goal: Specific, measurable outcome

Features:
- Episode Wizard for setup
- Episode Timeline for progress tracking
- Episode Character Dashboard
- Episode-specific Mind Movie creation
- Episode Wrap Report with AI analysis

Metrics:
- Daily check-ins
- Three Things completion rate
- Character score trends
- Episode alignment percentage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.4 THREE THINGS (Daily Actions)

Purpose: Focus daily energy on character-aligned actions

Mechanics:
- Select 3 priority actions each day
- Must align with active Episode goals
- AI suggests actions based on context
- Drag-and-drop priority ordering

Completion:
- Check off completed actions
- Capture excuse/reason if incomplete
- AI analyzes excuse patterns
- Weekly comparison reports

Integration:
- Feeds into Daily Scorecard
- Affects Director Score
- Triggers streak calculations
- Data used in AI Character Analysis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.5 THE KUT! RESET (Pattern Interrupt)

Purpose: Immediate intervention when falling out of character

Technique:
1. Recognize the negative pattern (trigger awareness)
2. Yell "KUT!" (either aloud or mentally)
3. Physically reset (shake, breathe, move)
4. Recall character traits and Chief Aim
5. Resume scene "from the top"

Digital Implementation:
- KUT! Reset modal with guided process
- Records the trigger and response
- Tracks frequency and improvement over time
- Feeds into Character Analysis

Psychology:
- Pattern interrupt breaks neural loop
- Creates space for conscious choice
- Reinforces Director role (authority over scene)
- Builds metacognitive awareness

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.6 DAILY DIRECTOR SCORECARD

Purpose: Objective measurement of character performance

The 0-3 Rubric:
0 = Off-Script (Did not embody the character)
1 = Rehearsing (Attempted but inconsistent)
2 = In-Character (Solid performance, minor breaks)
3 = Oscar-Worthy (Flawless embodiment)

Categories:
- IDENTITY: How well did I embody my character today?
- BEHAVIOR: Did my actions align with my Chief Aim?
- EMOTION: Did I maintain the emotional state of my Future Self?
- PROGRESS: Did I move meaningfully toward my goal?

Data Usage:
- Daily average feeds into Director Score
- Trend analysis in AI Character Analysis
- Episode wrap-up scoring
- Annual awards qualification

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.7 DIRECTOR'S JOURNAL

Purpose: Reflective writing for "dailies review"

Features:
- Daily journal entries
- Mood tracking
- AI prompt suggestions
- Mood trend visualization
- Integration with scorecard

Writing Prompts:
- What scenes did I capture today?
- Where did I break character?
- What adjustments for tomorrow?
- Gratitude and wins

Analysis:
- AI sentiment analysis
- Pattern detection over time
- Correlation with scorecard trends
- Export for external journaling apps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.8 CHARACTER CENTRAL

Purpose: Deep identity engineering and tracking

Components:

Character Survey:
- Comprehensive personality assessment
- Identifies current archetype
- Maps strengths and growth areas
- Creates baseline for transformation

Character Creator:
- Define Future Self traits
- Visual character sheet
- Trait-based AI prompts
- Integration with all modules

Character Analysis (AI):
- Data-driven transformation coaching
- Napoleon Hill Law prescriptions
- Pattern identification
- Personalized recommendations

Character Evolution:
- Tracks trait development over time
- Visualizes progress toward Future Self
- Celebrates character milestones
- Suggests next-level traits

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.9 SOUNDTRACK STUDIO

Purpose: Audio reinforcement of transformation

Features:
- AI lyrics generation based on Chief Aim
- Multiple genre support (Rap, Pop, Rock, etc.)
- Voice style selection
- Music generation via AI
- Integration with Score player

Chief Aim Anthem:
- Special song type tied to Definite Chief Aim
- Daily listening ritual requirement
- Must complete uninterrupted
- Can be updated/regenerated

The Score (/score):
- Personal music library
- Offline playback support
- Media Session API for lock screen controls
- Track designation as Chief Aim Anthem

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.10 DIRECTOR RADIO

Purpose: Community-curated motivation and inspiration

Features:
- Admin-curated playlists
- User-submitted tracks
- 24/7 streaming capability
- Community voting

Content:
- Motivational speeches
- User success stories
- Transformation anthems
- Interview segments

Integration:
- Submit from Score page
- Admin approval workflow
- Featured artist spotlights
- Credits for submissions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.11 DIRECTOR'S CORNER (Community)

Purpose: Master Mind community for mutual support

Features:
- Post creation and sharing
- Voting and engagement
- Profile customization
- Community challenges

Content Types:
- Transformation updates
- Mind Movie shares
- Questions and advice
- Celebration posts

Gamification:
- Engagement rewards
- Featured content selection
- Community awards
- Leaderboard integration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.12 AWARDS & GAMIFICATION

Purpose: Recognition and motivation through game mechanics

Director Score:
- Composite score from all activities
- Visible on dashboard and leaderboard
- Unlocks features and recognition
- Resets with new transformation cycles

Awards:
- Monthly recognition ceremonies
- Annual "Oscar" awards
- Category-specific achievements
- Community voting component

Streaks:
- Consecutive days of activity
- Multiple streak types (viewing, journal, etc.)
- Milestone celebrations
- Recovery mechanics

Credits:
- In-app currency for AI generations
- Monthly allocation
- Purchase options
- Usage tracking

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 4: AI INTEGRATION

4.1 DIRECTOR AI

The AI coaching system that provides:
- Real-time guidance and feedback
- Script analysis and suggestions
- Character coaching
- Pattern identification
- Personalized recommendations

Modes:
- Chat interface
- Voice interaction
- Proactive notifications
- Context-aware suggestions

Knowledge Base:
- Psycho-Cybernetics principles
- Napoleon Hill Laws of Success
- Cinematic grammar
- User-specific context

4.2 AI GENERATION CAPABILITIES

Images:
- Scene visualization
- Character portraits
- Storyboard frames
- Reference photo integration

Videos:
- Animated storyboards
- Mind Movie sequences
- Transformation visualizations

Music:
- Anthem generation
- Lyrics creation
- Voice synthesis

Text:
- Script enhancement
- Journal prompts
- Analysis reports

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 5: TECHNICAL ARCHITECTURE

5.1 DAILY RITUAL SYSTEM

The Daily Ritual Checklist tracks completion of:
1. Chief Aim reading/listening (reading OR anthem)
2. Mind Movie viewing (complete, uninterrupted)
3. Three Things planning
4. Daily Scorecard completion
5. Journal entry (optional)

Streak Calculation:
- Resets at midnight local time
- Requires minimum 3 of 5 core rituals
- Viewing must be uninterrupted
- Anthem must play completely

5.2 DATA FLOW

User Input → Supabase Database → AI Analysis → Personalized Output

Tables:
- user_profiles: Core user data
- daily_rituals: Checklist completion
- viewing_history: Mind Movie watches
- journal_entries: Written reflections
- daily_scores: Scorecard data
- episodes: Sprint definitions
- mindMovie_scripts: Storyboards
- generated_media: AI outputs

5.3 INTEGRATION POINTS

External:
- Notion sync (optional)
- Calendar integration
- Social media sharing
- Webhook notifications

Internal:
- Cross-module data sharing
- AI context building
- Streak and score calculations
- Community features

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 6: IMPLEMENTATION NOTES

6.1 USER ONBOARDING

Flow:
1. Sign up / Sign in
2. Welcome modal with video
3. Character Survey (optional, recommended)
4. Definite Chief Aim wizard
5. Dashboard tutorial
6. First Episode setup

6.2 DAILY USER FLOW

Recommended sequence:
1. Morning: Chief Aim + Anthem + Mind Movie
2. Mid-day: Three Things check-in
3. Evening: Scorecard + Journal
4. As needed: KUT! Reset

6.3 ADMIN CAPABILITIES

Dashboard includes:
- Platform analytics
- User management
- Content moderation
- Radio management
- Featured content curation
- Testimonial approval

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APPENDIX A: GLOSSARY

Chief Aim: The 4-part vision statement (What, When, Exchange, Plan)
Director Score: Composite gamification metric
Episode: Time-boxed transformation sprint
KUT!: Pattern interrupt technique
Mind Movie: Visualization video content
The Score: Personal music library
Three Things: Daily priority actions
Scorecard: 0-3 performance rating system

APPENDIX B: CONTACT

For technical support or questions about this system:
- In-app: Director AI chat
- Community: Director's Corner
- Settings: Notification preferences

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

© Psycho-Cinematics™ | Confidential Documentation
All Rights Reserved
`;

export const PsychoCinematicsWhitePaper = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create a printable HTML document
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Psycho-Cinematics™ White Paper</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              color: #1a1a1a;
              background: white;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              font-family: 'Georgia', serif;
              font-size: 11pt;
            }
            @media print {
              body { padding: 20px; }
              pre { font-size: 10pt; }
            }
          </style>
        </head>
        <body>
          <pre>${WHITE_PAPER_CONTENT}</pre>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([printContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing to PDF
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }

      toast({
        title: "White Paper Ready",
        description: "Use your browser's Print dialog to save as PDF (Ctrl/Cmd + P → Save as PDF)",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate white paper. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([WHITE_PAPER_CONTENT], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Psycho-Cinematics-WhitePaper.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "White paper text file saved successfully.",
    });
  };

  return (
    <Card className="border-gold/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gold" />
            </div>
            <div>
              <CardTitle className="text-lg">Psycho-Cinematics™ White Paper</CardTitle>
              <CardDescription>Comprehensive system documentation for administrators</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {showPreview ? "Hide Preview" : "Preview"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadText}
            >
              <Download className="w-4 h-4 mr-2" />
              .TXT
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showPreview && (
        <CardContent>
          <ScrollArea className="h-[500px] w-full rounded-lg border bg-muted/30 p-4">
            <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/80">
              {WHITE_PAPER_CONTENT}
            </pre>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
};
