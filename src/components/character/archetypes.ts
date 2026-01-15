export interface Archetype {
  id: string;
  name: string;
  tagline: string;
  socialCorrespondence: string[];
  strengths: string[];
  weaknesses: string[];
  storyFuel: string;
  conflictPattern: string;
  lightShadow: { light: string; shadow: string };
  signature: {
    dialogueStyle: string;
    physicalPresence: string;
    moralTemptation: string;
    breakPoint: string;
    redemptionBeat: string;
  };
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "still_center",
    name: "The Still Center",
    tagline: "I can hold everybody… except myself.",
    socialCorrespondence: [
      "ER/trauma nurse, paramedic, therapist, mediator, crisis negotiator",
      "Monastic leader, veteran mentor, hospice worker",
      "COO-type 'stability operator,' air-traffic controller, incident commander"
    ],
    strengths: ["Calm aura", "Emotional containment", "Sees through panic", "Stabilizes groups"],
    weaknesses: ["Emotionally hard to access", "Avoids vulnerability", "Can delay confronting personal pain"],
    storyFuel: "Everyone confides in them—until they finally crack.",
    conflictPattern: "I can hold everybody… except myself.",
    lightShadow: { light: "Healer", shadow: "Avoidant ghost" },
    signature: {
      dialogueStyle: "Measured, calm, reassuring with underlying depth",
      physicalPresence: "Grounded, unhurried movements, steady eye contact",
      moralTemptation: "Using calm as a wall to avoid their own healing",
      breakPoint: "When the weight of everyone else's pain breaks through",
      redemptionBeat: "Finally allowing themselves to be held by others"
    }
  },
  {
    id: "sovereign",
    name: "The Sovereign",
    tagline: "If I don't control it, it'll collapse.",
    socialCorrespondence: [
      "Mayor/governor, military commander, CEO/founder, union leader",
      "Judge (administrative), principal, head coach, lead detective"
    ],
    strengths: ["Decisive", "Protective", "Mission-first", "Inspires loyalty", "Takes responsibility"],
    weaknesses: ["Control issues", "Pride", "Authoritarian reflex", "Struggles with equals"],
    storyFuel: "Must learn the difference between command and domination.",
    conflictPattern: "If I don't control it, it'll collapse.",
    lightShadow: { light: "Protector-leader", shadow: "Tyrant" },
    signature: {
      dialogueStyle: "Commanding, direct, with authority",
      physicalPresence: "Dominant posture, purposeful stride",
      moralTemptation: "Believing the ends justify authoritarian means",
      breakPoint: "When their control destroys what they were protecting",
      redemptionBeat: "Learning to trust and empower others"
    }
  },
  {
    id: "truth_keeper",
    name: "The Truth-Keeper",
    tagline: "If I soften it, I'm lying.",
    socialCorrespondence: [
      "Investigative journalist, prosecutor, whistleblower, auditor, compliance officer",
      "Scientist, fact-checker, detective, ethicist, philosopher",
      "Documentarian, courtroom strategist"
    ],
    strengths: ["Sees lies", "Clean logic", "Fearless speech", "Exposes rot"],
    weaknesses: ["Bluntness", "Isolation", "Righteousness", "Can become joyless"],
    storyFuel: "Truth costs them relationships, safety, status—do they still speak?",
    conflictPattern: "If I soften it, I'm lying.",
    lightShadow: { light: "Liberator", shadow: "Destroyer-by-truth" },
    signature: {
      dialogueStyle: "Precise, uncompromising, fact-driven",
      physicalPresence: "Intense gaze, still when listening, sharp when speaking",
      moralTemptation: "Using truth as a weapon rather than a light",
      breakPoint: "When their truth destroys an innocent",
      redemptionBeat: "Learning compassion without compromising integrity"
    }
  },
  {
    id: "sacred_judge",
    name: "The Sacred Judge",
    tagline: "Someone must pay—or nothing means anything.",
    socialCorrespondence: [
      "Judge, mediator, HR head, ombudsman, ethics board chair",
      "Community organizer, restorative justice facilitator",
      "Contract lawyer, arbitrator, policy architect"
    ],
    strengths: ["Fairness", "Boundaries", "Consequences", "Restores right measure"],
    weaknesses: ["Punitive streak", "Perfectionism", "Scorekeeping", "Can freeze in moral complexity"],
    storyFuel: "Learns mercy without abandoning accountability.",
    conflictPattern: "Someone must pay—or nothing means anything.",
    lightShadow: { light: "Restorer", shadow: "Executioner" },
    signature: {
      dialogueStyle: "Balanced, measured, weighing each word",
      physicalPresence: "Dignified bearing, formal posture",
      moralTemptation: "Becoming the punisher rather than the healer",
      breakPoint: "When they must judge someone they love",
      redemptionBeat: "Choosing restoration over retribution"
    }
  },
  {
    id: "master_builder",
    name: "The Master Builder",
    tagline: "Feelings don't matter—results do.",
    socialCorrespondence: [
      "Architect, engineer, contractor, project manager, operations lead",
      "Systems designer, logistics chief, planner, supply chain strategist",
      "Accountant, product manager, 'fixer' who makes chaos functional"
    ],
    strengths: ["Structure", "Discipline", "Execution", "Long-term plans", "Practicality"],
    weaknesses: ["Workaholic", "Rigid", "Undervalues emotion/art", "Can be controlling"],
    storyFuel: "Their 'perfect system' breaks when the human heart enters.",
    conflictPattern: "Feelings don't matter—results do.",
    lightShadow: { light: "Stabilizer", shadow: "Cage-maker" },
    signature: {
      dialogueStyle: "Efficient, solution-oriented, minimal words",
      physicalPresence: "Organized, precise movements, always doing something",
      moralTemptation: "Sacrificing relationships for results",
      breakPoint: "When their system fails someone they care about",
      redemptionBeat: "Building something that serves hearts, not just minds"
    }
  },
  {
    id: "divine_analyst",
    name: "The Divine Analyst",
    tagline: "I can explain everything—except why I'm stuck.",
    socialCorrespondence: [
      "Strategist, intelligence analyst, behavioral profiler, counselor",
      "Lawyer (argumentation), teacher, speechwriter, negotiator",
      "UX researcher, data scientist, technical lead"
    ],
    strengths: ["Pattern recognition", "Precise language", "Planning", "Teaches others"],
    weaknesses: ["Analysis paralysis", "Coldness", "Can weaponize intelligence"],
    storyFuel: "Knows the answer but can't take the leap.",
    conflictPattern: "I can explain everything—except why I'm stuck.",
    lightShadow: { light: "Wise strategist", shadow: "Cold manipulator" },
    signature: {
      dialogueStyle: "Analytical, questioning, sees multiple angles",
      physicalPresence: "Thoughtful, observing, often in their head",
      moralTemptation: "Using insight to manipulate rather than serve",
      breakPoint: "When analysis cannot solve an emotional truth",
      redemptionBeat: "Making a leap of faith despite uncertainty"
    }
  },
  {
    id: "alchemist",
    name: "The Alchemist",
    tagline: "If it's not extreme, it's not real.",
    socialCorrespondence: [
      "Recovery sponsor, trauma therapist, ex-con turned mentor",
      "Firefighter, combat vet, crisis responder",
      "Artist who channels pain, underground healer, transformation coach"
    ],
    strengths: ["Resilience", "Depth", "Fearless shadow-facing", "Rebirth energy"],
    weaknesses: ["Intensity addiction", "Self-sabotage", "Scorched-earth decisions", "Secrets"],
    storyFuel: "They can save others—but will they stop burning themselves?",
    conflictPattern: "If it's not extreme, it's not real.",
    lightShadow: { light: "Rebuilder", shadow: "Self-immolator" },
    signature: {
      dialogueStyle: "Raw, honest, cuts through pretense",
      physicalPresence: "Scarred, intense, magnetic presence",
      moralTemptation: "Believing they must suffer to be authentic",
      breakPoint: "When their intensity hurts someone they're saving",
      redemptionBeat: "Finding peace without losing their fire"
    }
  },
  {
    id: "protector",
    name: "The Protector",
    tagline: "I'd rather be feared than harmed.",
    socialCorrespondence: [
      "Security chief, bodyguard, soldier, martial arts instructor",
      "Child advocate, protective parent figure, rescue worker",
      "Cybersecurity, investigator, emergency planner"
    ],
    strengths: ["Courage", "Boundaries", "Decisive defense", "High vigilance"],
    weaknesses: ["Paranoia", "Aggression", "Mistrust", "Overreacts to threats"],
    storyFuel: "Must learn that not every shadow is an enemy.",
    conflictPattern: "I'd rather be feared than harmed.",
    lightShadow: { light: "Guardian", shadow: "Paranoid aggressor" },
    signature: {
      dialogueStyle: "Alert, protective, threat-assessing",
      physicalPresence: "Ready stance, scanning surroundings, physically capable",
      moralTemptation: "Becoming the very threat they protect against",
      breakPoint: "When protection becomes imprisonment",
      redemptionBeat: "Learning to protect through trust, not control"
    }
  },
  {
    id: "harmonizer",
    name: "The Harmonizer",
    tagline: "If I keep everyone happy, we'll be safe.",
    socialCorrespondence: [
      "Diplomat, social worker, event producer, community leader",
      "Musician, designer, PR lead, brand storyteller",
      "Couples counselor, hospitality manager, culture builder"
    ],
    strengths: ["Warmth", "Charm", "Cohesion", "Morale", "Beauty-making"],
    weaknesses: ["Conflict avoidance", "People-pleasing", "Hidden resentment", "Manipulation-by-niceness"],
    storyFuel: "The peacemaker finally draws a line—and shocks everyone.",
    conflictPattern: "If I keep everyone happy, we'll be safe.",
    lightShadow: { light: "Unifier", shadow: "Appeaser" },
    signature: {
      dialogueStyle: "Warm, inclusive, smoothing tensions",
      physicalPresence: "Open body language, approachable, connects with touch",
      moralTemptation: "Sacrificing truth for temporary peace",
      breakPoint: "When peace requires them to abandon themselves",
      redemptionBeat: "Speaking their truth even if it disrupts harmony"
    }
  },
  {
    id: "wayfinder",
    name: "The Wayfinder",
    tagline: "If I commit, I might miss my real destiny.",
    socialCorrespondence: [
      "Explorer, guide, strategist, visionary founder",
      "Pastor/chaplain, philosopher, life coach, political reformer",
      "Scout leader, investigative traveler, 'maps the future' analyst"
    ],
    strengths: ["Vision", "Meaning", "Moral compass", "Inspires direction"],
    weaknesses: ["Idealism", "Restlessness", "Commitment issues", "Neglects mundane needs"],
    storyFuel: "Forced to choose one path and burn the alternatives.",
    conflictPattern: "If I commit, I might miss my real destiny.",
    lightShadow: { light: "Visionary", shadow: "Runaway idealist" },
    signature: {
      dialogueStyle: "Inspiring, future-focused, questions assumptions",
      physicalPresence: "Restless energy, always looking ahead, lean and mobile",
      moralTemptation: "Abandoning the present for an imagined future",
      breakPoint: "When running means abandoning someone who needs them",
      redemptionBeat: "Committing fully to one path with conviction"
    }
  },
  {
    id: "weaver",
    name: "The Weaver",
    tagline: "If they leave me, I disappear.",
    socialCorrespondence: [
      "Campaign manager, community organizer, producer, talent manager",
      "Network builder, recruiter, partnership exec, fundraiser",
      "Gang/crew leader (light or dark version), movement architect"
    ],
    strengths: ["Alliance-making", "Social intelligence", "Mobilizes groups", "Unifies factions"],
    weaknesses: ["Image management", "Manipulation", "Dependency on attention", "Politics addiction"],
    storyFuel: "Can gather a crowd—can they gather a true tribe?",
    conflictPattern: "If they leave me, I disappear.",
    lightShadow: { light: "Movement builder", shadow: "Social puppeteer" },
    signature: {
      dialogueStyle: "Connecting, persuasive, remembers everyone's story",
      physicalPresence: "Magnetic, works the room, always networking",
      moralTemptation: "Using connections for power rather than purpose",
      breakPoint: "When their network turns against them",
      redemptionBeat: "Building genuine community, not just followers"
    }
  }
];

export function getArchetypeById(id: string): Archetype | undefined {
  return ARCHETYPES.find(a => a.id === id);
}
