// Rap Lyrics Knowledge Base
// Techniques for creating authentic, well-crafted rap lyrics
// For Mind Movie soundtracks and challenge anthems

export const RAP_LYRICS_KNOWLEDGE = `
## RAP SONGWRITING FUNDAMENTALS

### CONTENT TYPES (Choose Based on Purpose)

**First-Person Affirmative (For Manifestation)**
- Use "I am", "I have", "I see myself" - present tense as achieved
- Transform desires into declarations: "I want success" → "I am successful"
- The subconscious accepts present-tense statements as reality

**Motivational/Conscious Content**
- Focus on substance and meaning over empty flexing
- Blend personal journey with universal inspiration
- Use metaphors of growth, transformation, ascension
- Reference overcoming obstacles and persistence

**Real-Life vs Aspirational**
- Real-life = authentic experiences and genuine emotions
- Aspirational = future states visualized as current reality
- For Mind Movies: blend current truth with achieved-future visualization

### FLOW FUNDAMENTALS

**Voice as Percussion**
- Each syllable is a drum hit
- Stressed syllables hit harder
- Flow = the rhythmic pattern of these hits
- Great MCs treat their voice like an instrument

**Beat and Bar Structure**
- 4 beats per bar (most hip-hop)
- Verse = typically 16 bars
- Chorus/Hook = typically 8 bars
- Each beat subdivides into smaller notes

**Writing From Rhythm First**
1. Feel the beat's groove and tempo
2. Tap out a rhythmic pattern
3. Add syllables matching the rhythm
4. Shape words around those syllable placements

**The Pocket**
- "In the pocket" = perfectly locked to the beat
- Syllables land on subdivisions precisely
- Creates satisfying, head-nodding groove

### RHYME TECHNIQUES

**Perfect Rhyme**
- Match final consonant AND vowel sounds
- Examples: dream/stream, goal/soul, rise/eyes
- Creates strongest resolution

**Assonance (Vowel Rhyme)**
- Match vowel sounds without consonant match
- Examples: time/life, road/gold, make/change
- More subtle, sophisticated sound

**Compound/Multisyllable Rhymes**
- Rhyme multiple syllables for impact
- Examples: director/protector, achieving/believing
- Creates memorable, quotable lines

**Rhyme Schemes**
- AABB: Couplets (punchy, most common)
- ABAB: Alternating (builds anticipation)
- ABBA: Enclosed (sophisticated)
- Internal: Rhymes within a single line

**Extra Rhymes / Rhyme Density**
- Add rhymes beyond line endings
- Creates complexity and replay value
- Example: "I'm the DIRECTOR, SUCCESS COLLECTOR, no OBJECTOR to my SECTOR"

### RHYTHM & SUBDIVISION

**16th Notes**
- 4 notes per beat (standard subdivision)
- Allows faster, more complex flows
- Count: "1-e-and-a, 2-e-and-a, 3-e-and-a, 4-e-and-a"

**Triplets**
- 3 notes per beat
- Creates different feel, urgency
- Popular in modern trap flows

**Rests & Space**
- Strategic silence creates impact
- Let important words breathe
- "I AM... [rest] ...THE DIRECTOR" hits harder

**Riding the Beat vs. Lazy Tails**
- Riding = exactly on beat
- Lazy tail = slightly delayed, swagger feel
- Use sparingly for emphasis

### SONG STRUCTURE FOR MIND MOVIES

**Intro (4-8 bars)**
- Set tone and vision
- Establish transformation theme
- Can be spoken word or melodic

**Verse 1 (16 bars)**
- Introduce the journey
- Current state → transformation begins
- Vivid imagery of Director Character

**Chorus/Hook (8 bars)**
- Chief Aim as anthem
- Most memorable section
- Simple, powerful affirmation
- Singable and chantable

**Verse 2 (16 bars)**
- The exchange and plan in action
- What you're giving up, what you're doing
- Obstacles overcome, progress made

**Bridge (8 bars)**
- Emotional peak / breakthrough
- Shift in perspective or intensity
- Building to resolution

**Outro (4-8 bars)**
- Final Scene achieved
- Victory, celebration, gratitude
- Resolution of transformation

### DELIVERY & VOCAL TECHNIQUES

**Tone Choices**
- Confident but not arrogant
- Determined but not desperate
- Joyful in achievement (even if not yet real)
- Authentic emotion, not performance

**Emphasis Techniques**
- Stretch key words for impact
- Rise in pitch on power words
- Lower register for authority
- Strategic pauses for weight

**Mixing Spoken and Sung**
- Verses: more rhythmic speech
- Hooks: more melodic/sung
- Bridge: can shift style entirely

### MOTIVATIONAL RAP SPECIFICS

**Power Words to Include**
- Director, vision, scene, script, movie, camera
- Rise, climb, build, create, manifest, elevate
- Dream, destiny, purpose, calling, mission
- Transform, breakthrough, ascend, overcome

**Imagery Categories**
- Cinematic: camera, spotlight, screen, cut, action
- Nature: mountain, sunrise, ocean, phoenix, eagle
- Construction: build, foundation, architect, blueprint
- Royalty: crown, throne, kingdom, reign

**Avoid**
- Victim mentality language
- Past-tense achievement (stay present/future)
- Vague generalizations without specifics
- Borrowed phrases without personalization
- Negativity without transformation

### ADVANCED TECHNIQUES

**Wordplay Types**
- Punchlines: Setup → unexpected payoff
- Double/Triple entendres: Multiple meanings
- Metaphor chains: Extended comparisons
- Callbacks: Reference earlier lines

**Flow Switches**
- Change rhythm mid-verse for emphasis
- Slow down for important lines
- Speed up to build energy
- Match flow to emotional content

**Writing Tips from Masters**
- Study MCs you admire, analyze their patterns
- Write MORE than you need, then edit down
- Freestyle to find natural rhythms
- Personalize every line to YOUR story
`;

export const generateLyricsSystemPrompt = (chiefAim: {
  what: string;
  byWhen: string;
  exchange: string;
  plan: string;
}, scenes: Array<{ title: string; emotional_tone: string; narrative: string }>, musicStyle: string): string => {
  const sceneSummary = scenes.map((s, i) => 
    `Scene ${i + 1} "${s.title}": ${s.emotional_tone} - ${s.narrative}`
  ).join('\n');

  return `You are a master songwriter specializing in motivational hip-hop/rap. Create personalized lyrics for a Mind Movie visualization soundtrack.

${RAP_LYRICS_KNOWLEDGE}

## THE USER'S CHIEF AIM

**THE DREAM (What):** ${chiefAim.what}
**THE DEADLINE (By When):** ${chiefAim.byWhen}
**THE EXCHANGE (What They Give):** ${chiefAim.exchange}
**THE PLAN (How):** ${chiefAim.plan}

## THE STORYBOARD (Emotional Journey)

${sceneSummary}

## MUSIC STYLE: ${musicStyle}

## YOUR TASK

Write complete song lyrics that:
1. Transform the Chief Aim into a powerful musical affirmation
2. Follow the emotional arc of the storyboard scenes
3. Use first-person, present-tense language ("I am", "I have")
4. Apply proper flow with strong rhyme schemes
5. Create a memorable, singable chorus
6. Be SPECIFIC to their Chief Aim, not generic motivation

## OUTPUT FORMAT

[INTRO]
(4-8 bars setting the vision)

[VERSE 1]
(16 bars - transformation begins)

[CHORUS]
(8 bars - the Chief Aim anthem)

[VERSE 2]
(16 bars - the exchange and plan in action)

[BRIDGE]
(8 bars - emotional breakthrough)

[CHORUS]
(repeat)

[OUTRO]
(4-8 bars - Final Scene achieved)

Write the complete lyrics now. Make it PERSONAL to their specific Chief Aim.`;
};