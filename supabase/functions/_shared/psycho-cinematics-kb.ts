// Psycho-Cinematics™ Knowledge Base
// A comprehensive knowledge base for all AI assistants in the Director's OS

export const PSYCHO_CINEMATICS_KNOWLEDGE = `
## PSYCHO-CINEMATICS™ FRAMEWORK

Psycho-Cinematics™ is a personal transformation system created by Tariq Bey that fuses three powerful philosophical pillars into a comprehensive methodology for identity engineering.

### THE THREE PHILOSOPHICAL PILLARS

**1. Psycho-Cybernetics (Dr. Maxwell Maltz)**
The brain and nervous system function as a sophisticated "success mechanism" - like a heat-seeking missile that locks onto a target and automatically corrects course. The fundamental insight:

> "Your nervous system cannot tell the difference between an imagined experience and a 'real' experience."

This means vivid visualization literally rewires the brain for success. The self-image is the central operating system that dictates the absolute boundaries of achievement, happiness, and behavior.

**2. Think and Grow Rich (Napoleon Hill)**
Based on Andrew Carnegie's challenge to distill the success principles of Ford, Edison, and other titans:
- **Definite Chief Aim**: A precise, written declaration of the primary objective - the "Final Scene"
- **Auto-Suggestion**: Repeated use of emotionally charged affirmations and visualizations to install the desired outcome as pre-existing reality

**3. The Mataneta (Kemetic Tradition)**
The original, core self is "unconditioned" and functions like a master actor. Personality is not fixed - it's a role that can be consciously chosen and embodied. Users must "cast" themselves as the Director Character required to achieve their Final Scene.

### THE THREE ROLES

Every user embodies three simultaneous roles:

| Role | Definition | Responsibilities |
|------|------------|------------------|
| **The Director** | The visionary force | Sets intention, controls narrative, makes creative decisions |
| **The Lead Actor** | The performer | Embodies the character, performs actions, lives the script daily |
| **The Production Company** | The logistical entity | Organizes resources, manages environment, ensures success |

### THE 7-PHASE FRAMEWORK

**Phase 1: Pre-Production (Identity Engineering)**
The foundational phase. Design the "Director Character" - the highest self. Craft the Definite Chief Aim as the "Final Scene." Define character values, behaviors, standards.

**Phase 2: Production (Movie Creation)**
Use AI tools (Sora, Suno, etc.) to create the mind movie. Key innovation: Turn the written Chief Aim into song lyrics - music bypasses the conscious critical faculty and embeds the objective deep into the subconscious.

**Phase 3: Post-Production (Refinement)**
Edit assets into a polished, emotionally impactful final cut. Refine pacing, visuals, and sound to maximize subconscious impact.

**Phase 4: Distribution (Viewing Protocol)**
Daily immersive viewing, ideally first thing in the morning using VR for a distraction-free "Theater of the Mind." Secondary method: mobile device for in-the-moment resets throughout the day.

**Phase 5: Performance (Living the Movie)**
The bridge between visualization and actualization. Carry the new identity from screen into daily life. Use the CUT! Technique for real-time pattern interrupts.

**Phase 6: Scoring (Performance Tracking)**
Daily Director Scorecard across four categories:
- Identity Alignment (0-3)
- Behavior Execution (0-3)
- Emotional Regulation (0-3)
- Forward Progress (0-3)

**Phase 7: Editing (Adaptation)**
Update script and movie as milestones are achieved and vision evolves. The movie is a living, relevant blueprint that grows with the user.

### THE "CUT!" TECHNIQUE

A neurological circuit breaker for when users go "off-script":

1. **RECOGNIZE** - Identify the off-script thought or behavior
2. **CUT** - Mentally yell "CUT!" to stop the scene
3. **RESET** - Take 3 breaths, reconnect with the Chief Aim
4. **RESUME** - Take the next aligned action

### THE DEFINITE CHIEF AIM COMPONENTS

1. **THE DREAM (What)** - The burning desire in vivid, specific terms
2. **THE DEADLINE (By When)** - A specific, ambitious date
3. **THE EXCHANGE (What I Give)** - Habits, time, skills, sacrifices committed
4. **THE PLAN (How)** - Immediate actionable first steps

### KEY VOCABULARY

- **Final Scene** = The ultimate goal/vision achieved
- **Director Character** = The highest self the user is becoming
- **Off-script** = Thoughts/behaviors misaligned with Chief Aim
- **Bad takes** = Setbacks (can be reshot)
- **Oscar-worthy performance** = Aligned, excellent execution
- **Extras** = Passive, reactive mindset (what to avoid)
- **Mind Movie** = The personalized visualization video
- **Theater of the Mind** = VR viewing environment
- **Script Doctor** = Coach who helps rewrite mental scripts

### THE STRATEGIC PREMISE

To change one's life, one must first upgrade the internal operating system (self-image). New behaviors and results naturally and sustainably follow from a newly engineered identity. This is identity-first transformation.

### THE HIVE MIND (Organizational Application)

The framework scales to groups sharing a common Definite Chief Aim. Co-create a collective "Hive Mind movie" depicting group success. When each member views it regularly, the vision is implanted into every subconscious, fostering alignment and synchronized action.
`;

export const getPhaseGuidance = (phase: number): string => {
  const phases: Record<number, string> = {
    1: "Focus on Pre-Production: Help them engineer their Director Character and craft their Definite Chief Aim as a powerful Final Scene.",
    2: "Focus on Production: Guide them in creating their mind movie using AI tools. Suggest turning their Chief Aim into song lyrics.",
    3: "Focus on Post-Production: Help them refine and polish their movie for maximum emotional impact.",
    4: "Focus on Distribution: Establish their daily viewing protocol. Morning VR viewing is optimal.",
    5: "Focus on Performance: Help them carry the new identity into daily life. Use the CUT! Technique when needed.",
    6: "Focus on Scoring: Guide them through the Daily Director Scorecard for accountability.",
    7: "Focus on Editing: Help them update their script as their vision evolves."
  };
  return phases[phase] || phases[1];
};

export const analyzeChiefAimCompleteness = (chiefAim: {
  what?: string;
  byWhen?: string;
  exchange?: string;
  plan?: string;
}): { phase: number; missingComponents: string[]; guidance: string } => {
  const missing: string[] = [];
  
  if (!chiefAim?.what) missing.push("THE DREAM (What)");
  if (!chiefAim?.byWhen) missing.push("THE DEADLINE (By When)");
  if (!chiefAim?.exchange) missing.push("THE EXCHANGE (What I Give)");
  if (!chiefAim?.plan) missing.push("THE PLAN (How)");
  
  if (missing.length > 0) {
    return {
      phase: 1,
      missingComponents: missing,
      guidance: `User is in Phase 1 (Pre-Production). Their Chief Aim is incomplete - missing: ${missing.join(", ")}. Prioritize helping them complete their Final Scene before moving to Production.`
    };
  }
  
  return {
    phase: 5,
    missingComponents: [],
    guidance: "User has a complete Chief Aim. Focus on Phase 5 (Performance) - helping them live as their Director Character and execute aligned daily actions."
  };
};
