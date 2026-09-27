/**
 * Psycho-Cybernetics layer for the mind movie builder (front-end mirror of
 * supabase/functions/_shared/psycho-cybernetics-kb.ts). Principles from
 * Dr. Maxwell Maltz, *Psycho-Cybernetics*, in our own words.
 */

export interface PsychoCyberneticsInputs {
  /** Real past wins to relive for the Winning Feeling. */
  successMemories: string[];
  /** An old belief that has been "hypnotizing" the user. */
  limitingBelief: string;
  /** The realistic true statement that replaces it. */
  truthStatement: string;
  /** An upcoming situation to shadow-box (rehearse calmly). */
  rehearsalSituation: string;
  /** Key of the FAILURE symptom that shows up most. */
  failureSymptom: string;
  /** An old hurt to forgive (others or self). */
  scarToRelease: string;
}

export const EMPTY_PSYCHO_CYBERNETICS: PsychoCyberneticsInputs = {
  successMemories: ["", ""],
  limitingBelief: "",
  truthStatement: "",
  rehearsalSituation: "",
  failureSymptom: "",
  scarToRelease: "",
};

export const FAILURE_SYMPTOMS = [
  { key: "frustration", letter: "F", name: "Frustration", correction: "Set a realistic goal you can move on today." },
  { key: "aggressiveness", letter: "A", name: "Aggressiveness", correction: "Point the energy at the goal, not at people." },
  { key: "insecurity", letter: "I", name: "Insecurity", correction: "Measure progress, not an impossible ideal." },
  { key: "loneliness", letter: "L", name: "Loneliness", correction: "Give first; take the emotional walls down." },
  { key: "uncertainty", letter: "U", name: "Uncertainty", correction: "Decide, then correct course as you go." },
  { key: "resentment", letter: "R", name: "Resentment", correction: "Forgive and own your response." },
  { key: "emptiness", letter: "E", name: "Emptiness", correction: "Choose a goal that means something and move." },
] as const;

export const SUCCESS_TYPE = [
  "Sense of Direction",
  "Understanding",
  "Courage",
  "Charity",
  "Esteem",
  "Self-Confidence",
  "Self-Acceptance",
] as const;

export const MIND_MOVIE_TECHNIQUES: Record<string, { name: string; purpose: string; className: string }> = {
  quiet_room: { name: "Quiet Room", purpose: "Relax first so the subconscious accepts what follows.", className: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  dehypnotize: { name: "Dehypnotize", purpose: "Break an old belief and install the truth.", className: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  success_replay: { name: "Success Replay", purpose: "Relive a real past win to summon the Winning Feeling.", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  self_image: { name: "New Self-Image", purpose: "See the realistic best version of you in action.", className: "bg-gold/15 text-gold border-gold/30" },
  shadow_box: { name: "Shadow-Box", purpose: "Rehearse an upcoming challenge going well.", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  course_correction: { name: "Course Correction", purpose: "Use a miss as feedback: notice, correct, continue.", className: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  scar_release: { name: "Scar Release", purpose: "Forgive an old hurt and free the personality.", className: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  winning_feeling: { name: "Winning Feeling", purpose: "The Chief Aim lived as already done.", className: "bg-gold/25 text-gold border-gold/50" },
  achievement: { name: "Achievement", purpose: "A milestone win on the way.", className: "bg-primary/15 text-primary border-primary/30" },
};

/** Remove empty fields before sending to the storyboard generator. */
export function cleanPsychoCyberneticsInputs(inputs: PsychoCyberneticsInputs): Partial<PsychoCyberneticsInputs> {
  const memories = inputs.successMemories.map((m) => m.trim()).filter(Boolean);
  const out: Partial<PsychoCyberneticsInputs> = {};
  if (memories.length) out.successMemories = memories;
  (["limitingBelief", "truthStatement", "rehearsalSituation", "failureSymptom", "scarToRelease"] as const).forEach((k) => {
    const v = inputs[k].trim();
    if (v) out[k] = v;
  });
  return out;
}
