/**
 * Law of Success — Personal Analysis
 *
 * Based on the "Personal Analysis Chart" in the Introductory Lesson of
 * Napoleon Hill's *The Law of Success in Sixteen Lessons* (1928), where the
 * student grades themselves 0–100% on each of the Fifteen Laws of Success
 * "before and after" the course, and on the "Six Most Dangerous Enemies"
 * (the six basic fears) essay that follows it.
 *
 * Hill's two rules for reading the chart:
 *   1. "All the successful men grade 100% on a Definite Chief Aim."
 *   2. "A grading of zero on any one of the Fifteen Laws of Success is
 *      sufficient to cause failure, even though all other grades are high."
 *
 * Psycho-Cinematics adds two things to Hill's method:
 *   - Behavioral statements per law, so the grade is based on what you do,
 *     not only on how you see yourself. Hill's own self-grade is kept too,
 *     and the gap between the two is reported as a blind spot.
 *   - A Maat alignment section (the seven principles of Maat from the
 *     Metu Neter), which checks that success is pursued "without violating
 *     the rights of other people" — Hill's own definition of success.
 *
 * Law numbers match NAPOLEON_HILL_17_LAWS in
 * supabase/functions/_shared/success-principles-kb.ts (2–16 are the
 * fifteen laws on Hill's chart).
 */

export type Frequency = 0 | 1 | 2 | 3 | 4;

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 0, label: "Never" },
  { value: 1, label: "Rarely" },
  { value: 2, label: "Sometimes" },
  { value: 3, label: "Usually" },
  { value: 4, label: "Always" },
];

export interface BehaviorStatement {
  id: string;
  text: string;
  /** When true, "Always" is the weakest answer (the statement describes the opposite of the law). */
  reversed?: boolean;
}

export interface LawOfSuccessFactor {
  key: string;
  /** Number in NAPOLEON_HILL_17_LAWS. */
  lawNumber: number;
  /** Roman numeral as printed on Hill's chart. */
  chartNumeral: string;
  name: string;
  /** What the lesson teaches, in Hill's framing. */
  teaching: string;
  /** A line from the 1928 text. */
  hillQuote?: string;
  statements: BehaviorStatement[];
}

export const FIFTEEN_LAWS: LawOfSuccessFactor[] = [
  {
    key: "definite_chief_aim",
    lawNumber: 2,
    chartNumeral: "I",
    name: "Definite Chief Aim",
    teaching:
      "Knowing exactly what you want, writing it down and fixing your heart on it, so effort stops being wasted on aimlessness.",
    hillQuote:
      "Success … is the attainment of your Definite Chief Aim without violating the rights of other people.",
    statements: [
      { id: "dca1", text: "I can state my chief aim in one or two specific sentences, with a date." },
      { id: "dca2", text: "I read my written aim, morning and night." },
      { id: "dca3", text: "My daily decisions are checked against my aim before I commit." },
    ],
  },
  {
    key: "self_confidence",
    lawNumber: 3,
    chartNumeral: "II",
    name: "Self-Confidence",
    teaching:
      "Belief in yourself based on definite, usable knowledge, and the mastery of the six basic fears. Not egotism.",
    hillQuote:
      "Self-confidence is the product of knowledge. Know yourself, know how much you know (and how little), why you know it, and how you are going to use it.",
    statements: [
      { id: "sc1", text: "I start important things before I feel fully ready." },
      { id: "sc2", text: "I pretend to know more than I actually do.", reversed: true },
      { id: "sc3", text: "Other people's doubts about my plans do not stop me." },
    ],
  },
  {
    key: "habit_of_saving",
    lawNumber: 4,
    chartNumeral: "III",
    name: "Habit of Saving",
    teaching:
      "Distributing income systematically so a definite percentage steadily accumulates, forming a source of personal power.",
    statements: [
      { id: "hs1", text: "A set percentage of every dollar I earn goes to savings or investment." },
      { id: "hs2", text: "I spend more than I earn.", reversed: true },
      { id: "hs3", text: "I know my monthly numbers: income, expenses and what I keep." },
    ],
  },
  {
    key: "initiative_leadership",
    lawNumber: 5,
    chartNumeral: "IV",
    name: "Initiative & Leadership",
    teaching:
      "Doing what ought to be done without being told, and leading others toward a definite end.",
    hillQuote: "Initiative is the pass-key that opens the door to opportunity.",
    statements: [
      { id: "il1", text: "I do what needs doing without being told or asked." },
      { id: "il2", text: "I wait for permission or perfect conditions before acting.", reversed: true },
      { id: "il3", text: "People follow my lead when I propose a plan." },
    ],
  },
  {
    key: "imagination",
    lawNumber: 6,
    chartNumeral: "V",
    name: "Imagination",
    teaching:
      "Reassembling old ideas and established facts into new combinations and putting them to new uses.",
    hillQuote:
      "Imagination is the workshop of the human mind wherein old ideas and established facts may be reassembled into new combinations and put to new uses.",
    statements: [
      { id: "im1", text: "I turn ideas into written plans, not just daydreams." },
      { id: "im2", text: "I combine ideas from different fields to solve problems." },
      { id: "im3", text: "I visualize the finished result before I start work." },
    ],
  },
  {
    key: "enthusiasm",
    lawNumber: 7,
    chartNumeral: "VI",
    name: "Enthusiasm",
    teaching:
      "A state of mind that inspires action. It is contagious and affects everyone the enthusiast deals with.",
    hillQuote:
      "Enthusiasm is a state of mind that inspires and arouses one to put action into the task at hand.",
    statements: [
      { id: "en1", text: "I bring real energy to my work, even on ordinary days." },
      { id: "en2", text: "My energy lifts the people around me." },
      { id: "en3", text: "I lose interest in projects once the novelty wears off.", reversed: true },
    ],
  },
  {
    key: "self_control",
    lawNumber: 8,
    chartNumeral: "VII",
    name: "Self-Control",
    teaching:
      "The balance wheel of the philosophy. It directs enthusiasm so that it builds up and does not tear down.",
    hillQuote:
      "Enthusiasm is the vital quality that arouses you to action, while self-control is the balance wheel that directs your action so that it will build up and not tear down.",
    statements: [
      { id: "ct1", text: "I react in anger, then regret it.", reversed: true },
      { id: "ct2", text: "I keep my commitments to myself when no one is watching." },
      { id: "ct3", text: "I can pause and choose my response when provoked." },
    ],
  },
  {
    key: "doing_more_than_paid_for",
    lawNumber: 9,
    chartNumeral: "VIII",
    name: "Habit of Doing More Than Paid For",
    teaching:
      "Rendering more and better service than you are paid for, which puts the Law of Increasing Returns to work for you.",
    statements: [
      { id: "dm1", text: "I deliver more than what was promised or paid for." },
      { id: "dm2", text: "I measure my effort by what I'm paid right now.", reversed: true },
      { id: "dm3", text: "Clients or colleagues describe my work as beyond expectations." },
    ],
  },
  {
    key: "pleasing_personality",
    lawNumber: 10,
    chartNumeral: "IX",
    name: "Pleasing Personality",
    teaching:
      "The fulcrum for all your effort: the sum of qualities that attracts people and wins their cooperation.",
    hillQuote:
      "Pleasing Personality is the 'fulcrum' on which you must place the 'crow-bar' of your efforts.",
    statements: [
      { id: "pp1", text: "I take a genuine interest in other people and their goals." },
      { id: "pp2", text: "People leave conversations with me feeling better than before." },
      { id: "pp3", text: "I talk more about myself than I listen.", reversed: true },
    ],
  },
  {
    key: "accurate_thinking",
    lawNumber: 11,
    chartNumeral: "X",
    name: "Accurate Thinking",
    teaching:
      "Separating facts from mere information, and important facts from unimportant ones, then building plans on facts.",
    statements: [
      { id: "at1", text: "Before deciding, I check whether something is fact or opinion." },
      { id: "at2", text: "I make decisions based on rumors or how I feel in the moment.", reversed: true },
      { id: "at3", text: "I change my view when the evidence changes." },
    ],
  },
  {
    key: "concentration",
    lawNumber: 12,
    chartNumeral: "XI",
    name: "Concentration",
    teaching:
      "Focusing the mind on a given desire until the ways and means to realize it are worked out and put into operation.",
    hillQuote:
      "Concentration is the act of focusing the mind upon a given desire until ways and means for its realization have been worked out and successfully put into operation.",
    statements: [
      { id: "co1", text: "I finish one important project before starting the next." },
      { id: "co2", text: "I get pulled off course by new ideas and opportunities.", reversed: true },
      { id: "co3", text: "I can work on one thing for a sustained, uninterrupted block." },
    ],
  },
  {
    key: "cooperation",
    lawNumber: 13,
    chartNumeral: "XII",
    name: "Cooperation",
    teaching:
      "Coordinated effort in a spirit of harmony. Before you can expect cooperation, you must show a willingness to cooperate.",
    hillQuote:
      "Before you can secure co-operation from others; nay, before you have the right to ask for or expect co-operation from other people, you must first show a willingness to co-operate with them.",
    statements: [
      { id: "cp1", text: "I have a group of people (a Master Mind) I work with toward shared goals." },
      { id: "cp2", text: "I try to do everything myself.", reversed: true },
      { id: "cp3", text: "I help others reach their goals as readily as I ask for help with mine." },
    ],
  },
  {
    key: "profiting_by_failure",
    lawNumber: 14,
    chartNumeral: "XIII",
    name: "Profiting by Failure",
    teaching:
      "Treating defeat as temporary and extracting the lesson from it, from your own failures and from other people's.",
    hillQuote:
      "Every failure is a blessing in disguise, providing it teaches some needed lesson one could not have learned without it.",
    statements: [
      { id: "pf1", text: "After a setback, I write down what I learned and change my approach." },
      { id: "pf2", text: "A single failure makes me quit the whole goal.", reversed: true },
      { id: "pf3", text: "I can name a past failure that led to a later success." },
    ],
  },
  {
    key: "tolerance",
    lawNumber: 15,
    chartNumeral: "XIV",
    name: "Tolerance",
    teaching:
      "Freedom from the prejudice and intolerance that make enemies of people who should be friends and destroy opportunity.",
    hillQuote:
      "Intolerance makes enemies of those who should be friends. It destroys opportunity and fills the mind with doubt, mistrust and prejudice.",
    statements: [
      { id: "to1", text: "I dismiss people whose background or beliefs differ from mine.", reversed: true },
      { id: "to2", text: "I seek out views that challenge my own." },
      { id: "to3", text: "I can work well with people I disagree with." },
    ],
  },
  {
    key: "golden_rule",
    lawNumber: 16,
    chartNumeral: "XV",
    name: "Practicing the Golden Rule",
    teaching:
      "Treating others as you would have them treat you, which wins harmonious cooperation from any individual or group.",
    statements: [
      { id: "gr1", text: "In deals and negotiations, I make sure the other side wins too." },
      { id: "gr2", text: "I treat people who can't help me the same as people who can." },
      { id: "gr3", text: "I cut corners with people when I think I won't get caught.", reversed: true },
    ],
  },
];

export interface BasicFear {
  key: string;
  name: string;
  /** The antidote in Psycho-Cinematics terms. */
  antidote: string;
  statements: BehaviorStatement[];
}

/** The Six Basic Fears, from "Your Six Most Dangerous Enemies" in the Introductory Lesson. */
export const SIX_BASIC_FEARS: BasicFear[] = [
  {
    key: "poverty",
    name: "Fear of Poverty",
    antidote: "A Definite Chief Aim with a concrete financial plan, plus the Habit of Saving.",
    statements: [
      { id: "fp1", text: "Worry about money keeps me from taking smart risks." },
      { id: "fp2", text: "I put off decisions because I'm afraid of losing what I have." },
    ],
  },
  {
    key: "criticism",
    name: "Fear of Criticism",
    antidote: "Self-Confidence built on competence. Act on your aim, not on other people's opinions.",
    statements: [
      { id: "fc1", text: "What people might say stops me from sharing my work or ideas." },
      { id: "fc2", text: "I shape my goals around what others will approve of." },
    ],
  },
  {
    key: "ill_health",
    name: "Fear of Ill-Health",
    antidote: "Consistent care of the body, and refusing to rehearse sickness in the mind.",
    statements: [
      { id: "fh1", text: "I worry about getting sick more than the facts justify." },
      { id: "fh2", text: "I use health concerns as a reason not to act." },
    ],
  },
  {
    key: "loss_of_love",
    name: "Fear of the Loss of Love",
    antidote: "Giving love freely without clinging, and building a life you'd respect alone.",
    statements: [
      { id: "fl1", text: "I hold back on my goals so I won't lose someone's approval or affection." },
      { id: "fl2", text: "Jealousy or suspicion shows up in my close relationships." },
    ],
  },
  {
    key: "old_age",
    name: "Fear of Old Age",
    antidote: "Treating experience as an asset. Wisdom compounds with time.",
    statements: [
      { id: "fo1", text: "I feel it's too late for me to do what I really want." },
      { id: "fo2", text: "I talk about my age as a reason something won't work." },
    ],
  },
  {
    key: "death",
    name: "Fear of Death",
    antidote: "Accepting death as transition and putting full attention on living and building.",
    statements: [
      { id: "fd1", text: "Thoughts of death or mortality leave me anxious or frozen." },
      { id: "fd2", text: "Fear of dying pulls my attention away from living fully." },
    ],
  },
];

export interface MaatPrinciple {
  key: string;
  name: string;
  statement: BehaviorStatement;
}

/** The seven principles of Maat, as used in the Maat Constitution. */
export const MAAT_PRINCIPLES: MaatPrinciple[] = [
  { key: "truth", name: "Truth", statement: { id: "m_truth", text: "I tell the truth even when a lie would be easier or more profitable." } },
  { key: "justice", name: "Justice", statement: { id: "m_justice", text: "I treat everyone involved fairly, not just the people with power over me." } },
  { key: "harmony", name: "Harmony", statement: { id: "m_harmony", text: "I resolve conflict instead of feeding it." } },
  { key: "balance", name: "Balance", statement: { id: "m_balance", text: "My life has room for work, health, rest and the people I love." } },
  { key: "order", name: "Order", statement: { id: "m_order", text: "My days, money and space are organized." } },
  { key: "reciprocity", name: "Reciprocity", statement: { id: "m_reciprocity", text: "I give back at least as much as I take." } },
  { key: "propriety", name: "Propriety", statement: { id: "m_propriety", text: "My words and actions fit the time, the place and the people." } },
];

/* ------------------------------------------------------------------ */
/* Scoring                                                              */
/* ------------------------------------------------------------------ */

export type Answers = Record<string, Frequency>;
/** Hill's own method: a direct 0–100 grade the person gives themselves per law. */
export type SelfGrades = Record<string, number>;

export interface LawResult {
  key: string;
  lawNumber: number;
  name: string;
  /** Grade from behavior statements, 0–100. */
  grade: number;
  /** Grade the person gave themselves, 0–100 (Hill's original method). */
  selfGrade: number | null;
  /** selfGrade − grade. Positive = overestimating. */
  blindSpot: number | null;
}

export interface FearResult {
  key: string;
  name: string;
  /** How strongly the fear shows up, 0–100. */
  intensity: number;
  antidote: string;
}

export interface MaatResult {
  key: string;
  name: string;
  alignment: number;
}

export interface PersonalAnalysisResult {
  laws: LawResult[];
  generalAverage: number;
  /** Laws at or below DANGER_THRESHOLD — Hill's "danger points". */
  dangerPoints: string[];
  /** Laws where the self-grade exceeds behavior by BLIND_SPOT_THRESHOLD or more. */
  blindSpots: string[];
  chiefAimGrade: number;
  fears: FearResult[];
  dominantFear: string | null;
  maat: MaatResult[];
  maatAlignment: number;
}

/**
 * Hill: a zero on any law "is sufficient to cause failure". Behavioral
 * answers rarely produce an exact zero, so anything at or below this is
 * treated as a danger point.
 */
export const DANGER_THRESHOLD = 25;
export const BLIND_SPOT_THRESHOLD = 25;
/** A fear counts as active at or above this intensity. */
export const FEAR_THRESHOLD = 50;

function statementScore(statement: BehaviorStatement, answer: Frequency | undefined): number {
  if (answer === undefined) return 0;
  return statement.reversed ? 4 - answer : answer;
}

function percent(points: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((points / max) * 100);
}

export function scoreLaw(law: LawOfSuccessFactor, answers: Answers): number {
  const points = law.statements.reduce((sum, s) => sum + statementScore(s, answers[s.id]), 0);
  return percent(points, law.statements.length * 4);
}

export function scoreFear(fear: BasicFear, answers: Answers): number {
  // Fear statements describe the fear itself, so a high answer = strong fear.
  const points = fear.statements.reduce((sum, s) => sum + (answers[s.id] ?? 0), 0);
  return percent(points, fear.statements.length * 4);
}

export function scorePersonalAnalysis(answers: Answers, selfGrades: SelfGrades): PersonalAnalysisResult {
  const laws: LawResult[] = FIFTEEN_LAWS.map((law) => {
    const grade = scoreLaw(law, answers);
    const selfGrade = typeof selfGrades[law.key] === "number" ? selfGrades[law.key] : null;
    return {
      key: law.key,
      lawNumber: law.lawNumber,
      name: law.name,
      grade,
      selfGrade,
      blindSpot: selfGrade === null ? null : selfGrade - grade,
    };
  });

  const generalAverage = Math.round(laws.reduce((sum, l) => sum + l.grade, 0) / laws.length);

  const fears: FearResult[] = SIX_BASIC_FEARS.map((fear) => ({
    key: fear.key,
    name: fear.name,
    intensity: scoreFear(fear, answers),
    antidote: fear.antidote,
  }));
  const strongestFear = [...fears].sort((a, b) => b.intensity - a.intensity)[0];

  const maat: MaatResult[] = MAAT_PRINCIPLES.map((p) => ({
    key: p.key,
    name: p.name,
    alignment: percent(answers[p.statement.id] ?? 0, 4),
  }));

  return {
    laws,
    generalAverage,
    dangerPoints: laws.filter((l) => l.grade <= DANGER_THRESHOLD).map((l) => l.key),
    blindSpots: laws
      .filter((l) => l.blindSpot !== null && l.blindSpot >= BLIND_SPOT_THRESHOLD)
      .map((l) => l.key),
    chiefAimGrade: laws.find((l) => l.key === "definite_chief_aim")?.grade ?? 0,
    fears,
    dominantFear: strongestFear && strongestFear.intensity >= FEAR_THRESHOLD ? strongestFear.key : null,
    maat,
    maatAlignment: Math.round(maat.reduce((sum, m) => sum + m.alignment, 0) / maat.length),
  };
}

export function lawByKey(key: string): LawOfSuccessFactor | undefined {
  return FIFTEEN_LAWS.find((l) => l.key === key);
}

export function fearByKey(key: string): BasicFear | undefined {
  return SIX_BASIC_FEARS.find((f) => f.key === key);
}

/** Total number of answers the full analysis collects (for progress bars). */
export const TOTAL_ITEMS =
  FIFTEEN_LAWS.reduce((n, l) => n + l.statements.length, 0) +
  SIX_BASIC_FEARS.reduce((n, f) => n + f.statements.length, 0) +
  MAAT_PRINCIPLES.length;
