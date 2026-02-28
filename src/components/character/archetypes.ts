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
    name: "The Ghost",
    sphere: 0,
    deity: "Amen (The Concealed / The Unconditioned)",
    law: "Potential. You are not your script, your role, or your past. You are the silence before the film starts — pure, unwritten, limitless.",
    role: "The blank screen before the first frame drops. The Ghost is infinite possibility. It's the ability to zero out, detach from the drama, and remember: none of this defines you. That's where real power lives.",
    directorsNote: "I'm not the movie. I'm the silence behind the sound.",
    lightExpression: "Complete detachment from ego, pure presence, infinite creative potential, inner stillness no matter the chaos, ability to start clean without baggage.",
    shadowExpression: "Spiritual bypassing, dodging accountability by claiming 'nothing matters,' checking out from reality, refusing to commit or act.",
    signatureTraits: ["Invisible", "Present", "Unshakable", "Adaptable", "Unconditioned"],
    storyFuel: "The pull between staying in peaceful emptiness and answering the call to build something that matters."
  },
  {
    id: "resurrector",
    name: "The Phoenix",
    sphere: 1,
    deity: "Ausar (The Indwelling Intelligence)",
    law: "Oneness. Every part of your production — every scene, every setback — is connected. See the whole picture, not just the frame in front of you.",
    role: "The one who always comes back. The Phoenix doesn't identify with the limited actor — they see the intelligence running the whole show. No matter how many times life dismembers you, you reassemble. Unified vision. No conflict, just clarity.",
    directorsNote: "I don't take sides. I see the whole picture.",
    lightExpression: "Unified vision, seeing connections others miss, natural leadership through wisdom, holding space for every perspective, rising from any fall.",
    shadowExpression: "Arrogance of 'knowing better,' dismissing real concerns as 'small thinking,' becoming emotionally disconnected.",
    signatureTraits: ["Visionary", "Unbreakable", "Wise", "Resilient", "Holistic"],
    storyFuel: "Maintaining unified vision while everything tries to fragment it, and the relentless resurrection after life tears you apart."
  },
  {
    id: "oracle",
    name: "The Cipher",
    sphere: 2,
    deity: "Tehuti (Wisdom / Measurement)",
    law: "Wisdom. Silence the noise. Receive the download. The Cipher doesn't guess — they calculate, decode, and reveal what's hidden in the pattern.",
    role: "The master decoder. The Cipher reads the room, reads the energy, reads the math. They possess the blueprint before anyone else sees it. Double-checking the script against reality to ensure nothing is off.",
    directorsNote: "Show me the math. If the numbers don't add up, the scene doesn't shoot.",
    lightExpression: "Crystal-clear intuition, impeccable timing, strategic foresight, downloading divine intel, mastery of patterns and cycles.",
    shadowExpression: "Analysis paralysis, waiting for 'perfect conditions' forever, over-relying on signs and omens, intellectual superiority complex.",
    signatureTraits: ["Intuitive", "Strategic", "Precise", "Patient", "Prophetic"],
    storyFuel: "Trusting the inner knowing versus demanding external proof, and carrying the weight of seeing what nobody else can."
  },
  {
    id: "architect",
    name: "The Blueprint",
    sphere: 3,
    deity: "Seker (Structure / Cycles / Life Force)",
    law: "Structure. Without a container, the energy dissipates. Discipline is the set you build so the power has somewhere to go. Sometimes the old set has to be demolished first.",
    role: "The force that builds the framework and sets the schedule. The Blueprint understands that without strict structure, life force bleeds out. They manage the master plan — and they're not afraid to demolish what's expired to make room for what's next.",
    directorsNote: "Stick to the schedule. No structure, no power.",
    lightExpression: "Masterful discipline, building foundations that last, comfortable with necessary endings, channeling raw energy through systems.",
    shadowExpression: "Rigidity, fear of change, weaponizing rules to control people, grinding without rest, inability to celebrate.",
    signatureTraits: ["Disciplined", "Systematic", "Enduring", "Transformative", "Grounded"],
    storyFuel: "Letting something die so something greater can be built, and navigating the tension between structure and spontaneity."
  },
  {
    id: "arbiter",
    name: "The Scales",
    sphere: 4,
    deity: "Maat (Law / Truth / Abundance)",
    law: "Balance. Everything is interdependent. Give and it flows back. Hoard and it dries up. The Scales see the overview that connects all the moving pieces.",
    role: "The judge who checks the script against Divine Law. Optimism, generosity, and the wide-angle view that ties everything together. They make sure the production is balanced — resources shared, no one actor eating all the screen time.",
    directorsNote: "Is it balanced? Does it serve the whole production, or just one actor's ego?",
    lightExpression: "Natural sense of justice, generous spirit, creating abundance through equilibrium, unshakable optimism, diplomatic finesse.",
    shadowExpression: "Self-righteousness, judging others while excusing yourself, giving until you're empty, naive optimism that ignores reality.",
    signatureTraits: ["Just", "Generous", "Balanced", "Optimistic", "Diplomatic"],
    storyFuel: "Holding the center when forces pull toward extremes, and the weight of being the one who must call it fair."
  },
  {
    id: "guardian",
    name: "The Enforcer",
    sphere: 5,
    deity: "Herukhuti (Divine Justice / Defense)",
    law: "Justice. The surgical separator. Protects what's righteous, eliminates what's not. Immediate action. The immune system of the narrative.",
    role: "The one who clears the path. The Enforcer uses razor-sharp analysis to separate real ones from threats. They cut through confusion with precision to protect the Director's vision — at all costs.",
    directorsNote: "I cut the scenes that don't belong. I protect the vision at all costs.",
    lightExpression: "Fearless defender of truth, surgical removal of what doesn't serve, righteous fire channeled constructively, protective force.",
    shadowExpression: "Destructive rage, seeing enemies everywhere, using 'protection' to justify aggression, inability to forgive or let go.",
    signatureTraits: ["Protective", "Decisive", "Surgical", "Fierce", "Discerning"],
    storyFuel: "The warrior's dilemma — when to swing and when to show mercy, and the price of being the one who makes the hard cuts."
  },
  {
    id: "commander",
    name: "The Crown",
    sphere: 6,
    deity: "Heru (The Will / Freedom)",
    law: "The Will. Freedom isn't doing what you feel — it's ignoring the noise to follow the higher law. Victory of the higher self over the lower instincts.",
    role: "The central protagonist reclaiming the throne from the Lower Self. The Crown commands — not through force, but through authority, will, and self-mastery. They don't react. They direct.",
    directorsNote: "I don't react to the noise. I command the action.",
    lightExpression: "Mastery over impulses, natural authority, inspiring others without force, winning through willpower, freedom from reactivity.",
    shadowExpression: "Suppressing valid emotions, fake stoicism, overriding intuition with brute will, control issues, isolation.",
    signatureTraits: ["Willful", "Commanding", "Sovereign", "Victorious", "Self-Mastered"],
    storyFuel: "The eternal war between higher and lower nature, and the solitary path of ruling yourself before you can lead anyone else."
  },
  {
    id: "alchemist",
    name: "The Lens",
    sphere: 7,
    deity: "Het-Heru (Imagination / Joy)",
    law: "Creative Imagination. The will gestates through joy, pleasure, and visualization. Use imagery to program the life force. If you can't see it, you can't shoot it.",
    role: "The artistic eye. The Lens turns a dry script into a vivid, sensory experience. They use beauty, visuals, and emotional charge to fuel the production. They are the filter through which the future becomes visible — making the invisible undeniable.",
    directorsNote: "If you can't visualize it, you can't film it. Make it beautiful.",
    lightExpression: "Vivid imagination, manifesting through visualization, infectious energy, artistic brilliance, making the invisible visible.",
    shadowExpression: "Fantasy addiction, escapism, chasing aesthetics over substance, using pleasure to dodge pain, all vision no execution.",
    signatureTraits: ["Creative", "Magnetic", "Visionary", "Sensual", "Inspiring"],
    storyFuel: "The tension between imagination and execution — the danger of getting lost in beautiful visions while the real world waits."
  },
  {
    id: "strategist",
    name: "The Plug",
    sphere: 8,
    deity: "Sebek (Logic / Communication)",
    law: "Verbal Logic. Define it, name it, communicate it. Separate things by form and function. Words are weapons — use them wisely.",
    role: "The editor and diplomat. The Plug manages the details, the definitions, the technical specs. They can flip into the Trickster if wisdom isn't guiding them — but when locked in, they're the ultimate connector and closer.",
    directorsNote: "Let's define the terms. Let's look at the specs.",
    lightExpression: "Brilliant communication, diplomatic precision, technical mastery, translating complex ideas for any audience, strategic networking.",
    shadowExpression: "Manipulation, using words as weapons of deception, over-intellectualizing everything, becoming the con artist who only serves self.",
    signatureTraits: ["Articulate", "Technical", "Diplomatic", "Sharp", "Connected"],
    storyFuel: "The temptation to use your gift of gab for manipulation versus service, and staying real while playing the game."
  },
  {
    id: "vessel",
    name: "The Vault",
    sphere: 9,
    deity: "Auset (Devotion / Receptivity)",
    law: "Receptivity. The subconscious memory bank. The power of trance and programming. The foundation that receives the seed of the Will and holds it until it's ready.",
    role: "The deep storage. The Vault holds the programming in the dark until it's ready for the light. It's the trance state that lets the script sink into the subconscious — nurturing the vision with unwavering faith until it's time to deliver.",
    directorsNote: "I hold the vision in the dark until it's ready for the light.",
    lightExpression: "Deep devotion, receiving and nurturing ideas, powerful subconscious programming, unwavering faith, patient cultivation.",
    shadowExpression: "Codependency, over-attachment, inability to release what's been received, losing identity inside someone else's vision.",
    signatureTraits: ["Devoted", "Receptive", "Nurturing", "Patient", "Faithful"],
    storyFuel: "The sacrifice of holding space for something greater than yourself, and keeping your identity while being the vessel for others."
  },
  {
    id: "materializer",
    name: "The Closer",
    sphere: 10,
    deity: "Geb (Earth / Physics)",
    law: "Verification. The physical body and resources. The final check — does the divine plan actually work on set? Show me the receipts.",
    role: "The reality check. The Closer makes sure the grand vision actually lands in the physical world. Budget, health, tangible results — if it's not on film, it's not real. They deal in proof, not promises.",
    directorsNote: "It's not real until it's on film. Show me the results.",
    lightExpression: "Grounded practicality, manifesting in physical form, resource mastery, physical vitality, delivering tangible proof.",
    shadowExpression: "Materialism, dismissing anything you can't touch, hoarding resources, obsessing over body and money at the expense of spirit.",
    signatureTraits: ["Practical", "Grounded", "Resourceful", "Physical", "Proven"],
    storyFuel: "The tension between spiritual vision and physical limitation, and the humility when grand plans meet earthly constraints."
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
