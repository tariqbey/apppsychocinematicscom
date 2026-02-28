export interface Archetype {
  id: string;
  name: string;
  sphere: number;
  deity: string;
  law: string;
  role: string;
  directorsNote: string;
  lightExpression: string;
  shadowExpression: string;
  signatureTraits: string[];
  storyFuel: string;
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "witness",
    name: "The Zero",
    sphere: 0,
    deity: "Amen — The Hidden One",
    law: "You are not your story. Before the first frame ever rolled, you were peace — unconditioned, unscripted, unlimited. That's not emptiness. That's the most dangerous thing in the world: pure potential with nothing to lose.",
    role: "Ground zero of the whole operation. The Zero is the factory reset — the state you return to when the noise gets too loud and the drama gets too thick. This is where spiritual power is generated: not from doing, but from the peace that can't be shaken. Every Director who has ever come back from the dead started here.",
    directorsNote: "I'm not the movie. I'm the silence the whole soundtrack was built on.",
    lightExpression: "Unshakable stillness under pressure, generating spiritual power through peace, ability to detach from any situation and see clearly, starting fresh without baggage.",
    shadowExpression: "Using detachment as an excuse to check out, spiritual bypassing, 'nothing matters' as a cop-out for not showing up, dissociation disguised as enlightenment.",
    signatureTraits: ["Still", "Untouchable", "Present", "Limitless", "Unconditioned"],
    storyFuel: "The pull between the peace of nothingness and the call to create something real — knowing you have to leave the silence to step into the chaos."
  },
  {
    id: "resurrector",
    name: "The One",
    sphere: 1,
    deity: "Ausar — The Indwelling Intelligence",
    law: "Oneness. Underneath every difference, every conflict, every separation — there's one consciousness running through all of it. You and your enemy are lit by the same light passing through different colored glass. Act accordingly.",
    role: "The true self. The One doesn't identify with the limited actor on screen — they ARE the intelligence running the whole production. When life dismembers you, you reassemble. When they count you out, you rise. Because you can't kill what was never born — the essential you is indivisible, eternal, and always whole.",
    directorsNote: "I don't take sides. I see through all the masks — including my own.",
    lightExpression: "Unified vision, seeing the connections others miss, rising from any fall, natural leadership through inner knowing, treating adversity as part of the script — not against you.",
    shadowExpression: "God complex, dismissing real pain as 'just an illusion,' detaching from emotion to the point of being cold, arrogance disguised as wisdom.",
    signatureTraits: ["Unified", "Unbreakable", "Perceptive", "Resilient", "Whole"],
    storyFuel: "Maintaining the vision of oneness while the world keeps trying to divide you — and the relentless act of resurrection when everything falls apart."
  },
  {
    id: "oracle",
    name: "The Cipher",
    sphere: 2,
    deity: "Tehuti — Wisdom & Sacred Measurement",
    law: "Wisdom. Silence the noise. Receive the download. Real knowledge isn't loud — it comes when the mind is quiet enough to hear what the universe has been trying to tell you. The Cipher doesn't guess. They calculate.",
    role: "The master decoder. While everyone else is reacting, The Cipher is reading the pattern underneath the pattern. They possess the blueprint before the first brick is laid. Wisdom isn't just knowing — it's knowing WHEN. Timing is everything, and The Cipher never moves early or late.",
    directorsNote: "If the math don't add up, the scene don't shoot. Period.",
    lightExpression: "Crystal-clear downloads, impeccable timing, seeing around corners, receiving guidance others can't access, mastery of sacred patterns and cycles.",
    shadowExpression: "Analysis paralysis, waiting for 'perfect conditions' that never come, hoarding knowledge instead of applying it, intellectual superiority complex.",
    signatureTraits: ["Intuitive", "Calculated", "Precise", "Patient", "Prophetic"],
    storyFuel: "The burden of seeing what nobody else can see — and the tension between trusting the inner download versus demanding external proof."
  },
  {
    id: "architect",
    name: "The Grid",
    sphere: 3,
    deity: "Seker — Structure, Cycles & Life Force",
    law: "Structure. Without a container, the energy bleeds out. Discipline isn't punishment — it's the architecture that gives your power somewhere to go. And sometimes the old structure has to be demolished before the new one can rise.",
    role: "The one who builds the framework and enforces the schedule. The Grid understands a fundamental truth: life force without structure is just chaos. They manage the cycles — the 21-day sprints, the seasons of creation and destruction. They're not afraid to let something die if the foundation is cracked.",
    directorsNote: "No structure, no power. Stick to the schedule or watch it all leak out.",
    lightExpression: "Masterful discipline, building systems that compound over time, comfortable with necessary endings, channeling raw life force through airtight structure.",
    shadowExpression: "Rigidity, using rules to control others, workaholism disguised as dedication, fear of spontaneity, inability to rest or celebrate.",
    signatureTraits: ["Disciplined", "Systematic", "Enduring", "Cyclical", "Foundational"],
    storyFuel: "The necessity of demolishing what's expired to build something greater — and navigating the tension between structure and flow."
  },
  {
    id: "arbiter",
    name: "The Equalizer",
    sphere: 4,
    deity: "Maat — Law, Truth & Interdependence",
    law: "Balance & Love. Everything in nature is interdependent — flowers need bees, bees need flowers. Love isn't soft — it's the executive force of oneness. It's the most powerful emotion in the hierarchy. When two forces collide, the superior one replaces the other. Love wins. Every time.",
    role: "The force that keeps the whole production in balance. The Equalizer understands interdependence as a law of nature, not a suggestion. They ensure resources flow, no single actor eats all the screen time, and the production serves the whole. Their weapon isn't force — it's the overwhelming power of love expressed through balance.",
    directorsNote: "Does it serve the whole production? Or just one actor's ego? Adjust accordingly.",
    lightExpression: "Natural sense of justice, creating abundance through balance, understanding love as a force — not just a feeling, generous spirit that strengthens the whole.",
    shadowExpression: "Self-righteousness, judging others while excusing yourself, giving until you're empty, naive optimism that ignores hard truths.",
    signatureTraits: ["Just", "Generous", "Balanced", "Loving", "Interdependent"],
    storyFuel: "Holding the center when forces pull toward extremes — and wielding love as a weapon of transformation, not submission."
  },
  {
    id: "guardian",
    name: "The Blade",
    sphere: 5,
    deity: "Herukhuti — Divine Justice & Defense",
    law: "Justice. The surgical separator. For every action, there's an equal reaction — spiritual forces push and pull just like physical ones. The Blade protects the righteous and enforces consequences. No negotiations.",
    role: "The immune system of the narrative. The Blade uses razor-sharp analysis to separate what serves from what threatens. They don't just defend — they generate spiritual power through opposition. The greater the challenge met with peace, the greater the power generated. That's the secret weapon.",
    directorsNote: "I cut the scenes that don't belong. I protect the vision at all costs.",
    lightExpression: "Fearless defense of truth, surgical precision in removing what doesn't serve, generating power through adversity, righteous fire channeled with purpose.",
    shadowExpression: "Destructive rage, seeing enemies everywhere, using 'justice' as an excuse for vengeance, inability to forgive, confusing aggression with strength.",
    signatureTraits: ["Protective", "Decisive", "Surgical", "Fierce", "Righteous"],
    storyFuel: "When to cut and when to show mercy — and understanding that the greatest power comes from meeting the greatest opposition with peace."
  },
  {
    id: "commander",
    name: "The Sovereign",
    sphere: 6,
    deity: "Heru — The Will & Freedom",
    law: "The Will. You have the power — but not the right — to ignore divine law. Your will is formless, devoid of energy. It doesn't execute — it DIRECTS. The emotions execute. Your job is to choose which laws your energy serves. That's real freedom.",
    role: "The protagonist reclaiming the throne from the lower self. The Sovereign understands that willpower isn't about forcing things — it's about choosing which impulses get your energy and which get starved. You're free to obey or disobey. But choosing to follow divine law with joy — that's when wisdom and spiritual power flow through you like electricity.",
    directorsNote: "I don't react to the noise. I choose what gets my energy. That's sovereignty.",
    lightExpression: "Mastery over impulses, commanding through choice not force, ignoring emotional reflexes that run counter to divinity, freedom from reactivity.",
    shadowExpression: "Suppressing valid emotions, fake stoicism, using willpower to bulldoze intuition, confusing control with sovereignty, isolation.",
    signatureTraits: ["Willful", "Sovereign", "Free", "Self-Directed", "Commanding"],
    storyFuel: "The eternal war between higher and lower nature — and discovering that true freedom is choosing divine law with joy, not white-knuckling through discipline."
  },
  {
    id: "alchemist",
    name: "The Projector",
    sphere: 7,
    deity: "Het-Heru — Imagination & Programming",
    law: "Creative Imagination. Your nervous system can't tell the difference between a vividly imagined experience and a real one. Images call up and manipulate emotions. That's not woo-woo — that's neuroscience. The question isn't what you're imagining. It's WHO is imagining. A human? Or a divine being?",
    role: "The programming faculty. The Projector uses imagery to literally reprogram the spirit — behavior, health, performance, everything. You're angry or afraid in a situation not because the situation is frightening, but because you IMAGE that response. You're free to image differently. Het-Heru means 'House of Heru' — the imagination must be controlled by the will.",
    directorsNote: "If you can't see it in your mind, you can't shoot it in your life. Program the vision.",
    lightExpression: "Vivid visualization that rewires reality, using imagery to program peace in adversity, making the invisible undeniable, infectious creative energy.",
    shadowExpression: "Fantasy addiction, escapism through beautiful images, accepting detrimental imagery without filtering, all vision no execution, confusing daydreaming with directing.",
    signatureTraits: ["Visual", "Magnetic", "Programmable", "Creative", "Intentional"],
    storyFuel: "The tension between imagination and execution — and the responsibility of knowing that every image you entertain is literally programming your spirit."
  },
  {
    id: "strategist",
    name: "The Signal",
    sphere: 8,
    deity: "Sebek — Logic, Words & Verbal Programming",
    law: "Verbal Logic. Words are programming tools — not just communication. Every affirmation, every belief you declare out loud is coding your subconscious. Positive thinking fails because the person affirming is still identifying as human. It's not WHAT you affirm. It's WHO is affirming.",
    role: "The broadcaster. The Signal names it, defines it, communicates it with precision. But this isn't just diplomacy — it's verbal programming. Like imagery, words can reprogram behavior, health, and performance. The catch: affirmations built on belief eventually collapse. Affirmations built on KNOWLEDGE — on understanding all 11 laws — are unshakable.",
    directorsNote: "Define the terms. Speak it into existence. But know WHO is speaking.",
    lightExpression: "Brilliant communication, verbal programming mastery, translating complex truths for any audience, strategic articulation that moves people to action.",
    shadowExpression: "Manipulation through words, silver tongue serving only self-interest, over-intellectualizing, becoming the trickster when wisdom isn't guiding the gift.",
    signatureTraits: ["Articulate", "Precise", "Strategic", "Vocal", "Networked"],
    storyFuel: "The temptation to use the gift of language for manipulation versus truth — and learning that WHO is speaking matters more than WHAT is said."
  },
  {
    id: "vessel",
    name: "The Frequency",
    sphere: 9,
    deity: "Auset — Receptivity & Trance Programming",
    law: "Receptivity. Your spirit has states — beta (waking, critical, resistant), alpha (meditation, open, programmable), gamma (ecstatic, intense, one-shot programming), delta (deep sleep, maximum receptivity). Most people try to reprogram themselves while wide awake. That's like trying to plant seeds on concrete. You need to drop into the right frequency first.",
    role: "The tuning dial. The Frequency controls HOW DEEP the programming goes. Imagery and affirmations are the tools — but receptivity determines whether they take root. This is why meditation works, why music bypasses the critical mind, why the morning screening hits different than reading your goals at lunch. The Frequency is the difference between surface-level positive thinking and deep subconscious installation.",
    directorsNote: "I hold the vision in the dark until it's ready for the light. Drop the frequency. Let it in.",
    lightExpression: "Deep receptivity, powerful subconscious programming, mastery of trance states, unwavering devotion to the vision, patient cultivation in the dark.",
    shadowExpression: "Over-receptivity without discernment, absorbing others' programming uncritically, codependency, losing identity inside someone else's frequency.",
    signatureTraits: ["Receptive", "Deep", "Devoted", "Patient", "Attuned"],
    storyFuel: "The sacrifice of dropping your defenses to receive — and the discipline of choosing WHAT you let in when you're in your most vulnerable state."
  },
  {
    id: "materializer",
    name: "The Receipt",
    sphere: 10,
    deity: "Geb — Earth, Body & Physical Verification",
    law: "Verification. The physical world is the final exam. All the meditation, all the visualization, all the affirmations — none of it means anything until it shows up in your body, your bank account, your relationships. Geb is the reality check. Show me the receipts.",
    role: "The proof of concept. The Receipt makes sure the divine plan actually works on set. They deal in tangible results — physical health, material resources, measurable outcomes. The spiritual and the physical aren't separate — Geb is where the invisible becomes undeniable. If it's not on film, it didn't happen.",
    directorsNote: "It's not real until it's on film. Talk is over. Show me the receipts.",
    lightExpression: "Grounded execution, manifesting spiritual work into physical proof, resource mastery, physical vitality, delivering results you can measure.",
    shadowExpression: "Pure materialism, dismissing anything you can't touch or count, hoarding resources, obsessing over the physical at the expense of spiritual foundation.",
    signatureTraits: ["Practical", "Grounded", "Proven", "Physical", "Accountable"],
    storyFuel: "The tension between spiritual vision and physical limitation — and the humility required when grand plans meet earthly constraints. The receipts don't lie."
  }
];

export function getArchetypeById(id: string): Archetype | undefined {
  return ARCHETYPES.find(a => a.id === id);
}

// Legacy ID mapping for backward compatibility with existing database records
// Maps original mystical IDs → cinematic IDs → previous IDs → current IDs
export const LEGACY_ID_MAP: Record<string, string> = {
  // Original mystical names → current
  "still_center": "witness",
  "sovereign": "resurrector",
  "truth_keeper": "guardian",
  "sacred_judge": "arbiter",
  "master_builder": "architect",
  "divine_analyst": "oracle",
  "alchemist": "alchemist",
  "protector": "materializer",
  "harmonizer": "vessel",
  "wayfinder": "commander",
  "weaver": "strategist",
  // Previous cinematic names → current
  "concerned_observer": "witness",
  "showrunner": "resurrector",
  "lead_editor": "guardian",
  "studio_executive": "arbiter",
  "screenwriter": "architect",
  "script_doctor": "oracle",
  "method_actor": "alchemist",
  "stunt_coordinator": "materializer",
  "ensemble_director": "vessel",
  "location_scout": "commander",
  "distributor": "strategist",
  // Previous Metu Neter names → current
  "blank_canvas": "witness",
  "auteur": "resurrector",
  "system_builder": "architect",
  "law_keeper": "arbiter",
  "sentinel": "guardian",
  "sovereign_will": "commander",
  "creative_muse": "alchemist",
  "analyst": "strategist",
  "deep_memory": "vessel",
  "anchor": "materializer"
};

export function getArchetypeByIdWithLegacy(id: string): Archetype | undefined {
  // First try direct lookup
  let archetype = ARCHETYPES.find(a => a.id === id);
  if (archetype) return archetype;
  
  // Try legacy mapping
  const newId = LEGACY_ID_MAP[id];
  if (newId) {
    return ARCHETYPES.find(a => a.id === newId);
  }
  
  return undefined;
}
