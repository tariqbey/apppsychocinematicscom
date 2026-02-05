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
    name: "The Witness",
    sphere: 0,
    deity: "Amen (The Concealed/The Unconditioned)",
    law: "Potential. The realization that the essential self is unconditioned energy, meaning you are not your script, your role, or your past history. You are the silence before the film starts.",
    role: "The source of infinite possibility. It represents the 'peace' (Hetep) that comes from realizing you are none of the things you create. It is the ability to 'zero out' and detach from the drama of the movie.",
    directorsNote: "I am not the movie. I am the silence behind the sound.",
    lightExpression: "Complete detachment from ego, pure presence, infinite creative potential, inner peace regardless of external chaos, ability to start fresh without baggage.",
    shadowExpression: "Spiritual bypassing, avoiding responsibility by claiming 'none of it matters,' dissociation from reality, inability to commit or take action.",
    signatureTraits: ["Meditative", "Detached", "Present", "Adaptable", "Unconditioned"],
    storyFuel: "The conflict between remaining in peaceful emptiness versus being called to create something meaningful in the world."
  },
  {
    id: "resurrector",
    name: "The Resurrector",
    sphere: 1,
    deity: "Ausar (The Indwelling Intelligence)",
    law: "Oneness. The recognition that all parts of the production (life) are integral parts of a single Whole. It is the ability to see unity in diversity.",
    role: "The visionary who holds the 'True Self.' This character does not identify with the limited personality (the actor) but with the intelligence running the whole show. It represents the state where there is no conflict, only a single, unified vision.",
    directorsNote: "I don't take sides. I see the whole picture.",
    lightExpression: "Unified vision, seeing connections others miss, natural leadership through wisdom, ability to hold space for all perspectives, resurrection from any setback.",
    shadowExpression: "Arrogance of 'knowing better,' dismissing others' valid concerns as 'small picture thinking,' becoming detached from human emotions.",
    signatureTraits: ["Visionary", "Unifying", "Wise", "Resilient", "Holistic"],
    storyFuel: "The struggle to maintain unified vision while others try to fragment it, and the journey of resurrection after being 'dismembered' by life's challenges."
  },
  {
    id: "oracle",
    name: "The Oracle",
    sphere: 2,
    deity: "Tehuti (Wisdom/Measurement)",
    law: "Wisdom. The ability to quell mental noise to receive intuitive guidance. It uses 'Oracles' and 'Mathematics' to place everything in its correct time and space.",
    role: "The master planner. This character does not guess; they calculate. They possess the blueprint. They represent the 'Double Measure'—weighing the script against reality to ensure accuracy and truth.",
    directorsNote: "Show me the proof. If the math doesn't work, the scene doesn't work.",
    lightExpression: "Crystal-clear intuition, perfect timing, strategic foresight, ability to receive divine guidance, mastery of sacred patterns and cycles.",
    shadowExpression: "Analysis paralysis, waiting for 'perfect conditions' that never come, over-reliance on signs and omens, intellectual arrogance.",
    signatureTraits: ["Intuitive", "Strategic", "Precise", "Patient", "Prophetic"],
    storyFuel: "The tension between trusting inner knowing versus external evidence, and the responsibility of seeing what others cannot."
  },
  {
    id: "architect",
    name: "The Architect",
    sphere: 3,
    deity: "Seker (Structure/Cycles/Life Force)",
    law: "Structure. The imposition of discipline, cycles, and limitations to build the container for power. This sphere is often associated with the 'death' of the old to make way for the new.",
    role: "The force that builds the set and establishes the schedule. They understand that without a strict container (discipline), the energy (Life Force) dissipates. They manage the 'destiny' or the 'plan' of the production.",
    directorsNote: "Stick to the schedule. No structure, no power.",
    lightExpression: "Masterful discipline, ability to build lasting foundations, comfortable with necessary endings, channeling life force through structure.",
    shadowExpression: "Rigidity, fear of change, using rules to control others, workaholism, inability to rest or celebrate.",
    signatureTraits: ["Disciplined", "Systematic", "Enduring", "Transformative", "Grounded"],
    storyFuel: "The necessity of letting something die to build something greater, and the tension between structure and spontaneity."
  },
  {
    id: "arbiter",
    name: "The Arbiter",
    sphere: 4,
    deity: "Maat (Law/Truth/Abundance)",
    law: "Balance. The understanding of the interdependence of all things. Giving and sharing creates abundance. It is the 'optimistic' view that sees the whole.",
    role: "The judge who ensures the script follows the 'Divine Law.' They represent optimism, generosity, and the 'overview' that connects disparate parts. They ensure the production is balanced and resources are shared.",
    directorsNote: "Is it balanced? Does it serve the whole production, or just one actor?",
    lightExpression: "Natural sense of justice, generous spirit, ability to create abundance through balance, optimistic outlook, diplomatic wisdom.",
    shadowExpression: "Self-righteousness, judging others harshly while excusing oneself, over-giving to the point of depletion, naive optimism.",
    signatureTraits: ["Just", "Generous", "Balanced", "Optimistic", "Diplomatic"],
    storyFuel: "The challenge of maintaining balance when forces pull toward extremes, and the weight of being the one who must judge fairly."
  },
  {
    id: "guardian",
    name: "The Guardian",
    sphere: 5,
    deity: "Herukhuti (Divine Justice/Defense)",
    law: "Justice. The analytical separator. It protects the righteous and enforces consequences. It represents immediate action and the 'immune system' of the narrative.",
    role: "The warrior who clears the path. They use 'analysis' to separate friend from foe. They are the analytical force that cuts through confusion to protect the integrity of the Director's vision.",
    directorsNote: "I cut the scenes that don't belong. I protect the vision at all costs.",
    lightExpression: "Fearless defender of truth, surgical precision in removing what doesn't serve, righteous anger channeled constructively, protective power.",
    shadowExpression: "Destructive anger, seeing enemies everywhere, using 'protection' as excuse for aggression, inability to forgive.",
    signatureTraits: ["Protective", "Decisive", "Analytical", "Fierce", "Discerning"],
    storyFuel: "The warrior's dilemma: when to fight and when to show mercy, and the price of being the one who must make the hard cuts."
  },
  {
    id: "commander",
    name: "The Commander",
    sphere: 6,
    deity: "Heru (The Will/Freedom)",
    law: "The Will. The freedom to ignore emotional impulses to follow the higher law. It is the victory of the higher self over the lower instincts.",
    role: "The central protagonist who must fight to reclaim the throne from the 'Lower Self' (Set). They represent the ability to command the self and others, not through force, but through authority and will.",
    directorsNote: "I don't react to the noise. I command the action.",
    lightExpression: "Mastery over impulses, natural authority, ability to inspire others, victory through will rather than force, freedom from reactivity.",
    shadowExpression: "Suppressing valid emotions, false stoicism, using willpower to override intuition, control issues, isolation.",
    signatureTraits: ["Willful", "Commanding", "Free", "Victorious", "Self-Mastered"],
    storyFuel: "The eternal battle between higher and lower nature, and the lonely path of the one who must rule themselves before they can lead others."
  },
  {
    id: "alchemist",
    name: "The Alchemist",
    sphere: 7,
    deity: "Het-Heru (Imagination/Joy)",
    law: "Creative Imagination. The gestation of the will through joy, pleasure, and visualization. It uses imagery to 'program' the life force.",
    role: "The artistic force. They use beauty, visuals, and emotional arousal to fuel the production. They turn the dry script into a vivid, sensory experience. They are the 'lens' through which the future is seen.",
    directorsNote: "If you can't visualize it, you can't film it. Make it beautiful.",
    lightExpression: "Vivid imagination, ability to manifest through visualization, infectious joy, artistic genius, making the invisible visible.",
    shadowExpression: "Fantasy addiction, escapism, superficiality, using pleasure to avoid pain, inability to execute on visions.",
    signatureTraits: ["Creative", "Joyful", "Visionary", "Sensual", "Inspiring"],
    storyFuel: "The tension between imagination and execution, and the danger of getting lost in beautiful visions while neglecting reality."
  },
  {
    id: "strategist",
    name: "The Strategist",
    sphere: 8,
    deity: "Sebek (Logic/Communication)",
    law: "Verbal Logic. Defining, naming, and communicating information. Separating things by their external differences/form.",
    role: "The editor and diplomat. They manage the files, the definitions, and the specific details. They can become the 'Trickster' if not guided by wisdom (Sphere 2), but they are essential for technical execution and easing the way.",
    directorsNote: "Let's define the terms. Let's look at the technical specs.",
    lightExpression: "Brilliant communication, diplomatic finesse, technical mastery, ability to translate complex ideas, strategic networking.",
    shadowExpression: "Manipulation, using words to deceive, over-intellectualizing, becoming the 'trickster' who serves only self-interest.",
    signatureTraits: ["Articulate", "Technical", "Diplomatic", "Clever", "Networked"],
    storyFuel: "The temptation to use communication skills for manipulation versus service, and the challenge of remaining truthful while being strategic."
  },
  {
    id: "vessel",
    name: "The Vessel",
    sphere: 9,
    deity: "Auset (Devotion/Receptivity)",
    law: "Receptivity. The subconscious memory and the power of trance/hypnosis. It is the foundation that receives the seed of the Will.",
    role: "The vessel that holds the programming. Instead of 'Mother,' think of this as the Foundation. It is the trance state that allows the script to sink into the subconscious. It nurtures the vision until it is ready to be born.",
    directorsNote: "I hold the vision in the dark until it is ready for the light.",
    lightExpression: "Deep devotion, ability to receive and nurture ideas, powerful subconscious programming, unwavering faith, patient cultivation.",
    shadowExpression: "Codependency, over-attachment, inability to let go of what's been received, becoming consumed by others' visions.",
    signatureTraits: ["Devoted", "Receptive", "Nurturing", "Patient", "Faithful"],
    storyFuel: "The sacrifice of holding space for something greater than yourself, and the challenge of maintaining identity while being a vessel for others."
  },
  {
    id: "materializer",
    name: "The Materializer",
    sphere: 10,
    deity: "Geb (Earth/Physics)",
    law: "Verification. The physical body and resources. The check-and-balance of spiritual work in the physical realm.",
    role: "The reality check. They ensure the 'Divine Plan' actually works on set (physical reality). They deal with the budget, the physical health of the crew, and the tangible results.",
    directorsNote: "It's not real until it's on film. Let's see the physical results.",
    lightExpression: "Grounded practicality, ability to manifest in physical form, resource management, physical vitality, tangible results.",
    shadowExpression: "Materialism, dismissing anything non-physical, hoarding resources, over-focus on body/money at expense of spirit.",
    signatureTraits: ["Practical", "Grounded", "Resourceful", "Physical", "Tangible"],
    storyFuel: "The tension between spiritual vision and physical limitation, and the humility required when grand plans meet earthly constraints."
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
