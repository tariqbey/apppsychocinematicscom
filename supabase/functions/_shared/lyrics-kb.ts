// Genre-Adaptive Lyrics Knowledge Base
// Used by AI to generate well-crafted song lyrics for Mind Movies across multiple genres

const GENERAL_SONGWRITING_FUNDAMENTALS = `
## SONGWRITING FUNDAMENTALS

### CONTENT APPROACHES

**First-Person Affirmative Language (For Manifestation)**
- Use "I am", "I have", "I see myself" - present tense as if achieved
- Transform desires into declarations: "I want success" → "I am successful"
- Speak directly to the subconscious through confident assertion

**Universal Themes**
- Focus on substance and meaning
- Blend personal journey with universal inspiration
- Use metaphors of growth, transformation, and ascension
- Reference overcoming obstacles and persistence

### SONG STRUCTURE FOR MIND MOVIES

**Intro (4-8 bars/lines)**
- Set the tone and vision
- Establish the transformation theme

**Verse 1 (16 lines or 8-12 lines depending on genre)**
- Introduce the journey
- Current state → transformation begins
- Specific, vivid imagery

**Chorus/Hook (8 lines)**
- The Chief Aim as anthem
- Most memorable, repeated section
- Simple, powerful affirmation
- Should be singable

**Verse 2 (16 lines or 8-12 lines depending on genre)**
- The exchange and plan in action
- Obstacles overcome, progress made

**Bridge (8 lines)**
- Emotional peak / breakthrough moment
- Shift in perspective or intensity

**Outro/Final Chorus (8-12 lines)**
- The Final Scene achieved
- Victory, celebration, gratitude

### POWER WORDS & IMAGERY

**Universal Power Words**
- Vision, dream, destiny, purpose, calling
- Rise, climb, build, create, manifest
- Transform, breakthrough, elevate, ascend
- Light, fire, wings, horizon, summit

**Imagery Categories**
- Nature: mountain, sunrise, ocean, phoenix, eagle, stars
- Construction: build, foundation, architect, blueprint
- Journey: path, road, climb, destination, horizon
- Light: shine, glow, radiance, illuminate, dawn

**Avoid**
- Victim mentality language
- Past-tense achievement (stay present/future)
- Vague generalizations
- Clichés without personalization
`;

const HIP_HOP_KNOWLEDGE = `
## HIP-HOP/RAP SPECIFIC TECHNIQUES

### FLOW FUNDAMENTALS

**Voice as Percussion**
- Each syllable is a drum hit
- Some syllables hit harder (stressed) than others
- Flow = the rhythmic pattern of stressed/unstressed syllables

**Beat Structure**
- 4/4 time, 4 beats per bar
- Typical verse = 16 bars
- Typical chorus = 8 bars

### RHYME TECHNIQUES

**Perfect Rhyme**: Matching final consonant AND vowel sounds
**Assonance**: Matching vowel sounds without consonant match  
**Multisyllable Rhymes**: Rhyming multiple syllables for impact
**Internal Rhymes**: Rhymes within a single line

**Rhyme Schemes**
- AABB: Couplets (punchy, direct)
- ABAB: Alternating (builds anticipation)

### RAP-SPECIFIC ELEMENTS
- Wordplay and clever metaphors
- Confident, assertive delivery
- Rhythmic complexity
- Strategic pauses for emphasis
`;

const POP_KNOWLEDGE = `
## POP MUSIC SPECIFIC TECHNIQUES

### MELODY-FIRST APPROACH
- Lyrics should flow naturally with singable melodies
- Emphasis on hooks that get stuck in your head
- Repetition of key phrases
- Simple, universal language

### STRUCTURE
- Typically shorter verses than rap
- Pre-chorus builds to chorus
- Bridge provides contrast
- Focus on emotional resonance

### POP ELEMENTS
- Conversational, relatable lyrics
- Emotional vulnerability
- Universal themes of hope and love
- Anthemic, uplifting choruses
`;

const ELECTRONIC_KNOWLEDGE = `
## ELECTRONIC/EDM SPECIFIC TECHNIQUES

### MINIMALIST APPROACH
- Fewer words, more impact
- Repetitive, mantra-like phrases
- Lyrics that work with drops and builds
- Chant-worthy hooks

### STRUCTURE
- Build-up sections with tension
- Drop sections with release
- Hypnotic, trance-inducing repetition
- Short, punchy phrases

### ELECTRONIC ELEMENTS
- Energy and momentum
- Euphoric, transcendent imagery
- Movement and rhythm in words
- Future-focused language
`;

const CINEMATIC_KNOWLEDGE = `
## CINEMATIC/ORCHESTRAL SPECIFIC TECHNIQUES

### EPIC STORYTELLING
- Grand, sweeping narratives
- Theatrical, dramatic phrasing
- Visual, scene-setting language
- Emotional crescendos

### STRUCTURE
- Can be more free-form
- Builds to climactic moments
- Space for instrumental breaks
- Dynamic range in intensity

### CINEMATIC ELEMENTS
- Movie/film imagery natural fit
- Hero's journey narrative arc
- Triumphant, victorious language
- Imagery of scale and grandeur
`;

const RNB_SOUL_KNOWLEDGE = `
## R&B/SOUL SPECIFIC TECHNIQUES

### EMOTIONAL DEPTH
- Smooth, flowing lyrics
- Heartfelt expression
- Sensual, warm imagery
- Groove-oriented flow

### STRUCTURE
- Melodic verses
- Soulful choruses
- Ad-libs and vocal runs implied
- Call-and-response elements

### R&B ELEMENTS
- Vulnerability and strength
- Love (including self-love)
- Smooth, sophisticated language
- Emotional authenticity
`;

const COUNTRY_FOLK_KNOWLEDGE = `
## COUNTRY/FOLK SPECIFIC TECHNIQUES

### STORYTELLING FOCUS
- Narrative-driven lyrics
- Specific, grounded details
- Conversational, honest tone
- Connection to roots and values

### STRUCTURE
- Clear verse-chorus structure
- Story builds through verses
- Memorable, singalong chorus
- Often acoustic-friendly

### COUNTRY/FOLK ELEMENTS
- Home, family, journey imagery
- Working hard, staying true
- Simple but profound truths
- Authentic, down-to-earth language
`;

const getGenreKnowledge = (musicStyle: string): string => {
  const style = musicStyle.toLowerCase();
  
  if (style.includes('hip-hop') || style.includes('rap') || style.includes('trap') || style.includes('lo-fi')) {
    return HIP_HOP_KNOWLEDGE;
  }
  if (style.includes('pop') || style.includes('indie pop')) {
    return POP_KNOWLEDGE;
  }
  if (style.includes('electronic') || style.includes('edm') || style.includes('ambient') || style.includes('synthwave')) {
    return ELECTRONIC_KNOWLEDGE;
  }
  if (style.includes('cinematic') || style.includes('orchestral') || style.includes('epic')) {
    return CINEMATIC_KNOWLEDGE;
  }
  if (style.includes('r&b') || style.includes('soul') || style.includes('gospel')) {
    return RNB_SOUL_KNOWLEDGE;
  }
  if (style.includes('country') || style.includes('folk') || style.includes('acoustic')) {
    return COUNTRY_FOLK_KNOWLEDGE;
  }
  
  // Default to pop for general appeal
  return POP_KNOWLEDGE;
};

const getGenreDescription = (musicStyle: string): string => {
  const style = musicStyle.toLowerCase();
  
  if (style.includes('hip-hop') || style.includes('rap')) {
    return 'Write lyrics with strong rhythmic flow, clever rhyme schemes, and confident delivery.';
  }
  if (style.includes('trap')) {
    return 'Write modern trap-style lyrics with triplet flows, hard-hitting lines, and motivational energy.';
  }
  if (style.includes('lo-fi')) {
    return 'Write chill, reflective lyrics with a laid-back flow and introspective mood.';
  }
  if (style.includes('pop')) {
    return 'Write catchy, singable lyrics with memorable hooks and universal emotional appeal.';
  }
  if (style.includes('electronic') || style.includes('edm')) {
    return 'Write energetic, anthemic lyrics with repetitive hooks perfect for builds and drops.';
  }
  if (style.includes('ambient') || style.includes('synthwave')) {
    return 'Write atmospheric, dreamy lyrics with futuristic imagery and hypnotic repetition.';
  }
  if (style.includes('cinematic') || style.includes('orchestral') || style.includes('epic')) {
    return 'Write grand, theatrical lyrics with dramatic arc and heroic imagery befitting an epic soundtrack.';
  }
  if (style.includes('r&b') || style.includes('soul')) {
    return 'Write smooth, soulful lyrics with emotional depth and melodic flow.';
  }
  if (style.includes('gospel')) {
    return 'Write uplifting, spiritual lyrics with powerful declarations of faith and triumph.';
  }
  if (style.includes('country') || style.includes('folk')) {
    return 'Write storytelling lyrics with honest, grounded language and heartfelt emotion.';
  }
  if (style.includes('acoustic')) {
    return 'Write intimate, stripped-back lyrics with poetic imagery and emotional authenticity.';
  }
  if (style.includes('rock')) {
    return 'Write powerful, anthem-style lyrics with driving energy and bold declarations.';
  }
  
  return 'Write inspiring, melodic lyrics with emotional resonance and memorable hooks.';
};

export const generateLyricsSystemPrompt = (chiefAim: {
  what: string;
  byWhen: string;
  exchange: string;
  plan: string;
}, scenes: Array<{ title: string; emotional_tone: string; narrative: string }>, musicStyle: string): string => {
  const sceneSummary = scenes.map((s, i) => 
    `Scene ${i + 1} "${s.title}": ${s.emotional_tone} - ${s.narrative}`
  ).join('\n');

  const genreKnowledge = getGenreKnowledge(musicStyle);
  const genreDirection = getGenreDescription(musicStyle);

  return `You are a master songwriter specializing in ${musicStyle} music. Your task is to write personalized lyrics for a Mind Movie visualization soundtrack.

${GENERAL_SONGWRITING_FUNDAMENTALS}

${genreKnowledge}

## THE USER'S CHIEF AIM (This is their transformation goal)

**THE DREAM (What):** ${chiefAim.what}

**THE DEADLINE (By When):** ${chiefAim.byWhen}

**THE EXCHANGE (What They Give):** ${chiefAim.exchange}

**THE PLAN (How):** ${chiefAim.plan}

## THE STORYBOARD (Emotional Journey)

${sceneSummary}

## MUSIC STYLE: ${musicStyle}

${genreDirection}

## YOUR TASK

Write complete song lyrics that:
1. Transform the Chief Aim into a powerful musical affirmation
2. Follow the emotional arc of the storyboard scenes
3. Use first-person, present-tense language ("I am", "I have")
4. Match the style and conventions of ${musicStyle} music
5. Create a memorable, singable chorus that embodies the Final Scene
6. Balance personal specifics with universal inspiration

## OUTPUT FORMAT

Return lyrics in this exact structure:

[INTRO]
(4-8 lines setting the vision)

[VERSE 1]
(8-16 lines - transformation begins)

[CHORUS]
(6-8 lines - the Chief Aim anthem)

[VERSE 2]
(8-16 lines - the exchange and plan in action)

[BRIDGE]
(4-8 lines - emotional breakthrough)

[CHORUS]
(repeat)

[OUTRO]
(4-8 lines - Final Scene achieved)

Write the complete lyrics now. Be specific to their Chief Aim, not generic motivation. Match the ${musicStyle} genre authentically.`;
};
