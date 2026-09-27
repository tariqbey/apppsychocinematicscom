/**
 * Psycho-Cybernetics knowledge base for Psycho-Cinematics™.
 *
 * Distilled, in our own words, from the principles in Dr. Maxwell Maltz's
 * *Psycho-Cybernetics* (1960) and *The New Psycho-Cybernetics* (Maltz & Dan Kennedy).
 * Only short attributed quotes are used. Do not paste book text into this file.
 *
 * Used by generate-storyboard (mind movie scenes) and the Director AI coaching prompts.
 */

export const PSYCHO_CYBERNETICS_CORE = {
  selfImage:
    "The self-image is the blueprint every action and feeling stays consistent with. Change the self-image and behavior follows; force behavior against the self-image and it snaps back. The new self-image must be realistic: neither more nor less than you are, but the best of what you truly are.",
  successMechanism:
    "The nervous system works like a goal-seeking servo-mechanism. Give it a clear target and it steers toward it automatically, using negative feedback (mistakes) to correct course, then forgetting the misses and remembering the hits. It needs a target, not a worry.",
  imagination:
    "The nervous system cannot tell the difference between an imagined experience and a real one vividly enough imagined. Mental rehearsal in detail, from your own eyes, with feeling, is practice the body accepts as real.",
  theaterOfTheMind:
    "Daily practice: relax, close your eyes, and in a private mental theater watch yourself acting, feeling and being the way you want to be. Vivid, detailed, sensory, present tense. Maltz recommended about 30 minutes a day and observed that a new self-image usually takes around 21 days of practice to set.",
  dehypnotize:
    "Most limits are beliefs accepted as true without examination, which then act on us like a hypnotist's suggestion. Ask: Is this belief based on fact, or on a conclusion I drew? Replace it with what is actually true, and support the new belief with deep feeling.",
  rationalThinking:
    "Conscious thought chooses the target and questions beliefs; the automatic mechanism does the work. Think about what you want, not what you fear. Stop giving power to the past; act as if the ability is already there.",
  relaxation:
    "Tension blocks the mechanism. Relax first, then set the goal, then let go of strained effort. Build a mental quiet room to retreat to and reset.",
  happinessHabit:
    "Happiness is a mental habit practiced now, not a reward waiting in the future. React to setbacks with a goal, not a grievance.",
  emotionalScars:
    "Old hurts form scars that protect but isolate. Remove them with real forgiveness of others and of yourself: mistakes are things you did, not who you are. Be too big to feel threatened by small slights.",
  crisis:
    "Pressure is energy. Rehearse without pressure (shadow-boxing: act out the scene calmly, in private, many times), keep an offensive goal rather than a defensive one, and ask what the realistic worst case is.",
  winningFeeling:
    "The feeling of success can be recalled on demand by reliving past wins in vivid detail. Carry that winning feeling into the new situation; the mechanism reads the feeling as 'this is already done'.",
};

/** Maltz's picture of the success-type personality. */
export const SUCCESS_TYPE = [
  { letter: "S", name: "Sense of Direction", cue: "Moving toward a goal worth wanting; restless without one." },
  { letter: "U", name: "Understanding", cue: "Seeing situations and people as they really are, not as feared." },
  { letter: "C", name: "Courage", cue: "Acting on the goal before certainty arrives." },
  { letter: "C", name: "Charity", cue: "Genuine regard for other people's needs and feelings." },
  { letter: "E", name: "Esteem", cue: "A true estimate of your own worth." },
  { letter: "S", name: "Self-Confidence", cue: "Built by remembering successes, not rehearsing failures." },
  { letter: "S", name: "Self-Acceptance", cue: "Being who you are, flaws included, without self-condemnation." },
];

/** Maltz's failure mechanism: symptoms that signal the mechanism is off course. */
export const FAILURE_SYMPTOMS = [
  { key: "frustration", letter: "F", name: "Frustration", correction: "Set a realistic goal you can move on today." },
  { key: "aggressiveness", letter: "A", name: "Aggressiveness (misdirected)", correction: "Point the energy at the goal, not at people." },
  { key: "insecurity", letter: "I", name: "Insecurity", correction: "Stop measuring yourself against an impossible ideal; measure progress." },
  { key: "loneliness", letter: "L", name: "Loneliness", correction: "Reach out and give first; remove the emotional walls." },
  { key: "uncertainty", letter: "U", name: "Uncertainty", correction: "Make a decision and correct course as you go." },
  { key: "resentment", letter: "R", name: "Resentment", correction: "Forgive, and take responsibility for your own response." },
  { key: "emptiness", letter: "E", name: "Emptiness", correction: "Choose a goal that means something and start moving." },
] as const;

/** Scene techniques a Psycho-Cinematics mind movie can use. Keys are returned on each scene. */
export const MIND_MOVIE_TECHNIQUES = {
  quiet_room: {
    name: "Quiet Room",
    purpose: "Opening relaxation that lowers tension so the subconscious will accept what follows.",
    direction: "Slow, still, soft light, breathing pace. The Director alone in a calm private space, shoulders dropping, eyes closing.",
  },
  dehypnotize: {
    name: "Dehypnotize",
    purpose: "Break an old limiting belief by showing it as a false suggestion and replacing it with the truth.",
    direction: "Show the old belief as a fading projection, a label peeling off, or a voice going quiet; then the true statement in light. Affirmation states the new truth.",
  },
  success_replay: {
    name: "Success Replay",
    purpose: "Relive a real past win in vivid detail to summon the Winning Feeling.",
    direction: "Recreate the user's actual past success from their own eyes: what they saw, heard, felt. Warm light, proud posture.",
  },
  self_image: {
    name: "New Self-Image",
    purpose: "See yourself as the realistic best version of who you are, acting from that identity.",
    direction: "Believable, specific daily-life moment of the new self: posture, voice, choices. Present tense. Not fantasy, but you at your best.",
  },
  shadow_box: {
    name: "Shadow-Box Rehearsal",
    purpose: "Rehearse a specific upcoming challenge calmly and successfully, so the real moment feels already practiced.",
    direction: "The exact upcoming situation, played from the start, the Director calm and on the offense, handling it well. Steady camera, clear light.",
  },
  course_correction: {
    name: "Course Correction",
    purpose: "Show a miss being used as feedback: notice, correct, continue, without self-condemnation.",
    direction: "A small mistake or failure symptom appears; the Director notices, adjusts, and moves forward. Quick recovery, no dwelling.",
  },
  scar_release: {
    name: "Scar Release",
    purpose: "Forgive an old hurt (others or self) to free the personality.",
    direction: "Letting go gesture: releasing, unclenching, walking out of a shadowed space into open light.",
  },
  winning_feeling: {
    name: "Winning Feeling",
    purpose: "The achieved goal experienced as done, felt fully in the body.",
    direction: "The final scene of the Chief Aim, lived from inside: sensory detail, emotion at its peak, calm certainty.",
  },
  achievement: {
    name: "Achievement",
    purpose: "A milestone win on the way to the Chief Aim.",
    direction: "Concrete progress moment tied to the Definite Chief Aim.",
  },
} as const;

export type MindMovieTechnique = keyof typeof MIND_MOVIE_TECHNIQUES;

export interface PsychoCyberneticsInputs {
  successMemories?: string[];
  limitingBelief?: string;
  truthStatement?: string;
  rehearsalSituation?: string;
  failureSymptom?: string;
  scarToRelease?: string;
}

/** Prompt block for mind movie generation. */
export function buildPsychoCyberneticsDirection(inputs: PsychoCyberneticsInputs | undefined, sceneCount: number): string {
  const i = inputs ?? {};
  const memories = (i.successMemories ?? []).map((m) => m.trim()).filter(Boolean);
  const symptom = FAILURE_SYMPTOMS.find((s) => s.key === i.failureSymptom);

  const techniqueList = Object.entries(MIND_MOVIE_TECHNIQUES)
    .map(([key, t]) => `- ${key} (${t.name}): ${t.purpose} Direction: ${t.direction}`)
    .join("\n");

  const required: string[] = [
    `Scene 1 MUST be quiet_room: a short relaxation opening. Tension blocks the success mechanism.`,
  ];
  if (i.limitingBelief) {
    required.push(
      `One Act One scene MUST be dehypnotize. Old belief: "${i.limitingBelief}". ` +
        (i.truthStatement ? `The truth to install: "${i.truthStatement}".` : "Write the realistic true statement that replaces it."),
    );
  }
  memories.forEach((m, idx) =>
    required.push(`A success_replay scene (${idx === 0 ? "in Act One or early Act Two" : "anywhere before the finale"}) recreating this REAL past win from the user's own eyes: "${m}".`),
  );
  if (i.rehearsalSituation) {
    required.push(`One Act Two scene MUST be shadow_box: rehearse this upcoming situation going well, calmly, on the offense: "${i.rehearsalSituation}".`);
  }
  if (symptom) {
    required.push(`One Act Two scene MUST be course_correction for the failure symptom "${symptom.name}": show it appear, be recognized, and be corrected (${symptom.correction}).`);
  }
  if (i.scarToRelease) {
    required.push(`One scene MUST be scar_release for: "${i.scarToRelease}".`);
  }
  required.push(`The final scene (scene ${sceneCount}) MUST be winning_feeling: the Chief Aim experienced as already done.`);
  required.push(`Most remaining scenes should be self_image or achievement.`);

  return `
═══════════════════════════════════════════════
PSYCHO-CYBERNETICS: PROGRAMMING THE SUCCESS MECHANISM
═══════════════════════════════════════════════
This mind movie is a target for the user's success mechanism, not a fantasy reel. Apply these principles (Maxwell Maltz):
- SELF-IMAGE FIRST: ${PSYCHO_CYBERNETICS_CORE.selfImage}
- THE MECHANISM: ${PSYCHO_CYBERNETICS_CORE.successMechanism}
- IMAGINATION: ${PSYCHO_CYBERNETICS_CORE.imagination}
- WINNING FEELING: ${PSYCHO_CYBERNETICS_CORE.winningFeeling}
- RELAX: ${PSYCHO_CYBERNETICS_CORE.relaxation}

SCENE RULES FROM PSYCHO-CYBERNETICS:
1. Show the protagonist from believable, realistic moments of their best self, not superhuman fantasy. The subconscious rejects what the self-image can't accept.
2. Rich sensory detail: what they see, hear, feel, even smell. Present tense. Wherever possible, frame from their own point of view.
3. Show the target, never the fear. No scenes that dwell on what they don't want; the old self appears only to be released or corrected.
4. Every affirmation is present tense, first person, and carries a feeling word.
5. Pace the wins: small believable wins build to the big one, the way confidence is built from success to success.

TECHNIQUES (tag every scene with exactly one "technique" key):
${techniqueList}

REQUIRED SCENES FOR THIS USER:
${required.map((r) => `• ${r}`).join("\n")}
`;
}

/** Short coaching reference for the Director AI and chief-aim prompts. */
export const PSYCHO_CYBERNETICS_COACHING = `
PSYCHO-CYBERNETICS (Maxwell Maltz) — use when coaching:
- Self-image sets the limits of achievement. Work on the self-image, not just behavior.
- The success mechanism needs a clear target and uses mistakes as feedback. Correct and forget; don't replay failures.
- Nervous system can't tell a vividly imagined experience from a real one: prescribe Theater of the Mind practice (relax, then watch yourself succeed in detail) daily, about 21 days for a new self-image to set.
- Dehypnotize: ask "Is this belief based on fact?" and install the true statement with feeling.
- Winning Feeling: have them relive a specific past success before a challenge.
- Shadow-boxing: rehearse upcoming situations calmly in private.
- SUCCESS type: ${SUCCESS_TYPE.map((s) => s.name).join(", ")}.
- FAILURE symptoms (warning lights, not verdicts): ${FAILURE_SYMPTOMS.map((s) => s.name).join(", ")}.
`;
