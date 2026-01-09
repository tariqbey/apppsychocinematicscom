// Rap Lyrics Knowledge Base
// Based on Paul Edwards' "How to Rap" and "How to Rap 2" books
// Used by AI to generate authentic, well-crafted rap lyrics for Mind Movies

export const RAP_LYRICS_KNOWLEDGE = `
## RAP SONGWRITING FUNDAMENTALS

### CONTENT APPROACHES

**First-Person Affirmative Language (For Manifestation)**
- Use "I am", "I have", "I see myself" - present tense as if achieved
- Transform desires into declarations: "I want success" → "I am successful"
- Speak directly to the subconscious through confident assertion

**Conscious/Motivational Content**
- Focus on substance and meaning over empty flexing
- Blend personal journey with universal inspiration
- Use metaphors of growth, transformation, and ascension
- Reference overcoming obstacles and persistence

**Real-Life vs Fictional Content**
- Real-life content = authentic experiences and genuine emotions
- Fictional content = aspirational scenarios and future states
- For Mind Movies: blend current truth with achieved-future visualization

### FLOW FUNDAMENTALS

**Voice as Percussion**
The voice is treated like a drum in hip-hop:
- Each syllable is a drum hit
- Some syllables hit harder (stressed) than others (unstressed)
- Flow = the rhythmic pattern of stressed/unstressed syllables

**Beat and Bar Structure**
- Most hip-hop beats are 4/4 time
- 4 beats per bar (measure)
- Typical verse = 16 bars
- Typical chorus/hook = 8 bars
- Each beat can be subdivided into smaller notes

**Writing From Rhythm First**
1. Feel the beat's groove and tempo
2. Tap out a rhythmic pattern that fits
3. Add syllables that match the rhythm
4. Then shape words around those syllable placements

**The Pocket**
- "In the pocket" = perfectly locked to the beat
- Syllables land exactly on subdivisions of the beat
- Creates satisfying, head-nodding groove
- Essential for motivational anthems

### RHYME TECHNIQUES

**Perfect Rhyme**
- Matching final consonant AND vowel sounds
- Example: "dream/stream", "goal/soul", "rise/eyes"
- Creates strongest sense of resolution

**Assonance (Vowel Rhymes)**
- Matching vowel sounds without consonant match
- Example: "time/life", "road/gold", "make/change"
- More subtle, sophisticated sound

**Compound/Multisyllable Rhymes**
- Rhyming multiple syllables for impact
- Example: "director/protector", "achieving/believing"
- Creates memorable, quotable lines

**Rhyme Schemes**
- AABB: Couplets (most common, punchy)
- ABAB: Alternating (builds anticipation)
- ABBA: Enclosed (sophisticated)
- Internal rhymes: Rhymes within a single line

**Extra Rhymes**
- Adding rhymes beyond the end of lines
- Creates density and complexity
- "I'm the DIRECTOR, SUCCESS COLLECTOR, no OBJECTOR to my SECTOR"

### RHYTHM & SUBDIVISION

**16th Notes**
- 4 notes per beat (standard rap subdivision)
- Allows for faster, more complex flows
- "1-e-and-a, 2-e-and-a, 3-e-and-a, 4-e-and-a"

**Triplets**
- 3 notes per beat (creates different feel)
- Popular in modern trap flows
- Creates urgency and momentum

**Rests & Space**
- Strategic silence creates impact
- Let important words breathe
- "I AM... [rest] ...THE DIRECTOR" hits harder than cramming words

**Sliding Off the Beat (Lazy Tails)**
- Slightly delaying syllables for swagger
- Creates laid-back, confident feel
- Used sparingly for emphasis

### SONG STRUCTURE FOR MIND MOVIES

**Intro (4-8 bars)**
- Set the tone and vision
- Establish the transformation theme
- Can be spoken word or sung

**Verse 1 (16 bars)**
- Introduce the journey
- Current state → transformation begins
- Specific, vivid imagery of the Director Character

**Chorus/Hook (8 bars)**
- The Chief Aim as anthem
- Most memorable, repeated section
- Simple, powerful affirmation
- Should be singable/chantable

**Verse 2 (16 bars)**
- The exchange and plan in action
- What you're giving up, what you're doing
- Obstacles overcome, progress made

**Bridge (8 bars)**
- Emotional peak / breakthrough moment
- Shift in perspective or intensity
- Building to final resolution

**Outro/Final Chorus (8-12 bars)**
- The Final Scene achieved
- Victory, celebration, gratitude
- Resolution of the transformation

### DELIVERY & VOCAL TECHNIQUES

**Tone Choices**
- Confident but not arrogant
- Determined but not desperate
- Joyful in achievement (even if not yet real)
- Authentic emotion, not performance

**Emphasis Techniques**
- Stretch key words for emotional impact
- Rise in pitch on power words
- Lower register for authority
- Breath and pauses for weight

**Mixing Spoken and Sung**
- Verses: more rhythmic speech
- Hooks: more melodic/sung
- Bridge: can shift style entirely

### MOTIVATIONAL RAP SPECIFICS

**Power Words to Include**
- Director, vision, scene, script, movie
- Rise, climb, build, create, manifest
- Dream, destiny, purpose, calling
- Transform, breakthrough, elevate, ascend

**Imagery Categories**
- Cinematic: camera, spotlight, screen, cut, action
- Nature: mountain, sunrise, ocean, phoenix, eagle
- Construction: build, foundation, architect, blueprint
- Royalty: crown, throne, kingdom, reign

**Avoid**
- Victim mentality language
- Past-tense achievement (stay present/future)
- Vague generalizations
- Borrowed phrases without personalization
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

  return `You are a master songwriter specializing in motivational hip-hop/rap. Your task is to write personalized lyrics for a Mind Movie visualization soundtrack.

${RAP_LYRICS_KNOWLEDGE}

## THE USER'S CHIEF AIM (This is their transformation goal)

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
4. Apply proper flow techniques with strong rhyme schemes
5. Create a memorable, singable chorus that embodies the Final Scene
6. Balance personal specifics with universal inspiration

## OUTPUT FORMAT

Return lyrics in this exact structure:

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

Write the complete lyrics now. Be specific to their Chief Aim, not generic motivation.`;
};
