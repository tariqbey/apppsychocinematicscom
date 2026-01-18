// Professional Cinematography Techniques & NLP Knowledge Base
// For AI-assisted Mind Movie storyboard generation

export const CINEMATOGRAPHY_TECHNIQUES = {
  // Camera Angles and their psychological effects
  cameraAngles: {
    lowAngle: {
      name: "Low Angle Shot",
      description: "Camera positioned below eye level, looking up at subject",
      psychologicalEffect: "Power, authority, dominance, heroism, invincibility",
      useFor: ["Moments of triumph", "Leadership decisions", "Overcoming obstacles", "Manifesting authority"],
      prompt: "low angle shot looking up, empowering perspective, heroic framing"
    },
    highAngle: {
      name: "High Angle Shot", 
      description: "Camera positioned above eye level, looking down at subject",
      psychologicalEffect: "Vulnerability initially, then transcendence when character rises",
      useFor: ["Before transformation moments", "Showing journey's start", "Creating contrast"],
      prompt: "high angle shot, expansive view, showing the world below"
    },
    eyeLevel: {
      name: "Eye Level Shot",
      description: "Camera at subject's eye level, neutral perspective",
      psychologicalEffect: "Relatability, connection, authenticity, equality",
      useFor: ["Direct affirmations", "Personal moments", "Intimate declarations"],
      prompt: "eye level shot, direct gaze, intimate connection with viewer"
    },
    dutchAngle: {
      name: "Dutch Angle (Tilted)",
      description: "Camera tilted on its axis",
      psychologicalEffect: "Disruption, transformation, breaking old patterns",
      useFor: ["CUT! moments", "Pattern interrupts", "Paradigm shifts"],
      prompt: "dynamic dutch angle, tilted frame suggesting transformation"
    },
    overTheShoulder: {
      name: "Over the Shoulder",
      description: "Camera positioned behind subject looking at their view",
      psychologicalEffect: "Perspective taking, future vision, directing one's path",
      useFor: ["Visualizing goals", "Looking toward the future", "Director perspective"],
      prompt: "over the shoulder shot, protagonist looking toward their future"
    },
    birdsEye: {
      name: "Bird's Eye View",
      description: "Directly overhead shot",
      psychologicalEffect: "Omniscience, seeing the bigger picture, divine perspective",
      useFor: ["Showing the full journey", "Act transitions", "Climactic realizations"],
      prompt: "bird's eye view, godlike perspective, seeing the complete picture"
    },
    wormEye: {
      name: "Worm's Eye View",
      description: "Extreme low angle from ground level",
      psychologicalEffect: "Maximum power, larger than life, unstoppable force",
      useFor: ["Peak achievement moments", "Final victory scenes", "Ultimate transformation"],
      prompt: "extreme low angle worm's eye view, towering presence, monumental achievement"
    }
  },

  // Shot sizes and their emotional impact
  shotSizes: {
    extremeCloseUp: {
      name: "Extreme Close-Up (ECU)",
      description: "Focus on specific detail (eyes, hands, object)",
      psychologicalEffect: "Intense emotion, revelation, moment of truth",
      useFor: ["Key affirmation moments", "Emotional peaks", "Decisive moments"],
      prompt: "extreme close-up, intense focus on eyes/face, raw emotion visible"
    },
    closeUp: {
      name: "Close-Up (CU)",
      description: "Head and shoulders framing",
      psychologicalEffect: "Intimacy, emotion, character connection",
      useFor: ["Internal monologue", "Affirmations", "Character transformation moments"],
      prompt: "close-up portrait, emotional depth, character intimacy"
    },
    mediumCloseUp: {
      name: "Medium Close-Up (MCU)",
      description: "Chest up framing",
      psychologicalEffect: "Personal connection while showing some context",
      useFor: ["Declarations", "Commitments", "Dialogue moments"],
      prompt: "medium close-up, confident posture visible, personal yet contextual"
    },
    mediumShot: {
      name: "Medium Shot (MS)",
      description: "Waist up framing",
      psychologicalEffect: "Balance of emotion and action",
      useFor: ["Taking action", "Demonstrating behaviors", "Showing body language"],
      prompt: "medium shot, body language and expression visible, action-ready"
    },
    fullShot: {
      name: "Full Shot (FS)",
      description: "Entire body in frame",
      psychologicalEffect: "Character in their world, ready for action",
      useFor: ["Stepping into new identity", "Physical achievements", "Walking toward goal"],
      prompt: "full body shot, complete figure in environment, purposeful stance"
    },
    wideShot: {
      name: "Wide Shot (WS)",
      description: "Subject with significant environment",
      psychologicalEffect: "Context, journey scope, world of possibility",
      useFor: ["Establishing new reality", "Showing achievements", "World building"],
      prompt: "wide establishing shot, protagonist in their achieved environment"
    },
    extremeWideShot: {
      name: "Extreme Wide Shot (EWS)",
      description: "Subject small in vast environment",
      psychologicalEffect: "Epic scale, destiny, universe supporting the journey",
      useFor: ["Opening/closing scenes", "Showing life transformation scope", "Epic moments"],
      prompt: "extreme wide shot, epic scale, protagonist in vast successful landscape"
    }
  },

  // Lighting techniques for emotional programming
  lighting: {
    goldenHour: {
      name: "Golden Hour",
      description: "Warm, soft light of sunrise/sunset",
      psychologicalEffect: "Hope, new beginnings, warmth, success, optimism",
      useFor: ["New chapter moments", "Achievements", "Positive affirmations", "Endings with promise"],
      prompt: "golden hour lighting, warm sunlight, magical hour glow, optimistic atmosphere"
    },
    blueHour: {
      name: "Blue Hour",
      description: "Cool, ethereal light before sunrise/after sunset",
      psychologicalEffect: "Introspection, calm clarity, peaceful power",
      useFor: ["Meditation moments", "Inner clarity", "Peaceful confidence"],
      prompt: "blue hour lighting, serene twilight, contemplative atmosphere"
    },
    dramaticShadows: {
      name: "Chiaroscuro / Dramatic Shadows",
      description: "Strong contrast between light and dark",
      psychologicalEffect: "Depth, mystery, transformation, duality transcended",
      useFor: ["Overcoming darkness", "Decisive moments", "Power declarations"],
      prompt: "dramatic chiaroscuro lighting, bold shadows, powerful contrast"
    },
    rimLight: {
      name: "Rim/Back Light",
      description: "Light from behind creating a halo effect",
      psychologicalEffect: "Divine quality, transcendence, emerging into light",
      useFor: ["Transformation complete", "Spiritual moments", "Triumphant scenes"],
      prompt: "dramatic rim lighting, glowing backlight, angelic halo effect"
    },
    softDiffused: {
      name: "Soft Diffused Light",
      description: "Even, flattering light without harsh shadows",
      psychologicalEffect: "Comfort, safety, nurturing, self-acceptance",
      useFor: ["Self-love affirmations", "Gratitude moments", "Peaceful acceptance"],
      prompt: "soft diffused lighting, gentle flattering light, warmth and comfort"
    },
    highKey: {
      name: "High Key Lighting",
      description: "Bright, even lighting with minimal shadows",
      psychologicalEffect: "Clarity, purity, success, achievement",
      useFor: ["Celebrating wins", "Clear vision moments", "Joy and celebration"],
      prompt: "high key lighting, bright optimistic atmosphere, minimal shadows"
    },
    lowKey: {
      name: "Low Key Lighting",
      description: "Dramatic with deep shadows and single light source",
      psychologicalEffect: "Focus, intensity, determination, singular purpose",
      useFor: ["Focused determination", "Cutting through distractions", "Single-minded pursuit"],
      prompt: "low key lighting, dramatic single light source, intense focus"
    },
    practicalLight: {
      name: "Practical/Motivated Light",
      description: "Light from visible sources in scene (lamps, windows, screens)",
      psychologicalEffect: "Authenticity, real-world grounding, achievable reality",
      useFor: ["Daily action scenes", "Office/business success", "Realistic achievement"],
      prompt: "naturalistic practical lighting, real-world light sources, authentic atmosphere"
    }
  },

  // Camera movements for emotional impact
  cameraMovement: {
    pushIn: {
      name: "Push In / Dolly In",
      description: "Camera moves toward subject",
      psychologicalEffect: "Increasing importance, revelation, focus intensifying",
      useFor: ["Building to affirmation climax", "Moments of realization", "Commitment"],
      prompt: "cinematic push-in framing, drawing viewer into the moment"
    },
    pullBack: {
      name: "Pull Back / Dolly Out",
      description: "Camera moves away from subject",
      psychologicalEffect: "Reveal of larger context, seeing bigger picture",
      useFor: ["Showing achievement scope", "Revealing transformation", "End of journey"],
      prompt: "cinematic pull-back reveal, showing the expansive achievement"
    },
    crane: {
      name: "Crane/Jib Shot",
      description: "Camera rises up and over",
      psychologicalEffect: "Elevation, rising above, transcendence",
      useFor: ["Rising to new level", "Overcoming obstacle", "Ascending to success"],
      prompt: "sweeping crane shot rising up, elevation and transcendence"
    },
    steadicam: {
      name: "Steadicam/Following Shot",
      description: "Smooth camera following subject",
      psychologicalEffect: "Journey, momentum, forward progress",
      useFor: ["Moving toward goal", "Daily execution", "Progress scenes"],
      prompt: "smooth steadicam following shot, purposeful forward movement"
    },
    orbit: {
      name: "Orbit/360 Shot",
      description: "Camera circles around subject",
      psychologicalEffect: "Complete perspective, centeredness, power position",
      useFor: ["Character fully realized", "Complete transformation", "Centered confidence"],
      prompt: "orbiting camera movement, subject as powerful center"
    }
  }
};

export const NLP_AFFIRMATION_PATTERNS = {
  // Core NLP language patterns for maximum subconscious impact
  patterns: {
    presupposition: {
      name: "Presupposition",
      description: "Assumes the desired outcome is already happening or will happen",
      examples: [
        "As I continue to succeed...",
        "The more I embody [trait], the more...",
        "Now that I am [identity]...",
        "Since I've decided to become..."
      ],
      useFor: ["Opening affirmations", "Building momentum", "Mid-movie scenes"]
    },
    embeddedCommand: {
      name: "Embedded Command",
      description: "Commands hidden within larger statements that bypass conscious resistance",
      examples: [
        "You might find yourself naturally TAKING BOLD ACTION...",
        "People often discover they can FEEL COMPLETELY CONFIDENT...",
        "It's interesting how you BEGIN TO NOTICE your power..."
      ],
      useFor: ["Behavior change scenes", "Action sequences", "Building new patterns"]
    },
    nominalizations: {
      name: "Nominalizations",
      description: "Abstract nouns that allow personal interpretation while directing outcome",
      examples: [
        "Success flows to me naturally",
        "My transformation is complete",
        "Abundance is my birthright"
      ],
      useFor: ["Universal achievement scenes", "Identity statements", "Final scenes"]
    },
    binds: {
      name: "Double Binds",
      description: "Choices that all lead to the desired outcome",
      examples: [
        "Whether through challenge or ease, I always reach my goal",
        "Every experience either teaches me or proves my strength",
        "I grow stronger through both victory and lesson"
      ],
      useFor: ["Resilience scenes", "Challenge overcoming", "Act 2 midpoint"]
    },
    futureMemory: {
      name: "Future Memory Installation",
      description: "Speaking of future events as if remembering them",
      examples: [
        "I remember the day I finally achieved...",
        "Looking back now, I see how...",
        "This is the moment I'll always remember..."
      ],
      useFor: ["Final act scenes", "Achievement visualization", "Goal manifestation"]
    },
    identityStatements: {
      name: "Identity-Level Statements",
      description: "I AM declarations that program identity at the deepest level",
      examples: [
        "I am the person who...",
        "I am naturally and authentically...",
        "I am becoming more [trait] every moment"
      ],
      useFor: ["Core identity scenes", "Character transformation", "Opening declarations"]
    },
    sensoryRich: {
      name: "Sensory-Rich Language (VAK)",
      description: "Visual, Auditory, Kinesthetic language for full-brain encoding",
      examples: [
        "I see my success clearly (V), hear the applause (A), and feel the triumph (K)",
        "The vision shines bright (V), the words of praise echo (A), the sensation of power fills me (K)"
      ],
      useFor: ["Immersive scenes", "Peak emotional moments", "Multi-sensory experiences"]
    },
    temporalShift: {
      name: "Temporal Shift",
      description: "Moving between past, present, and future to install certainty",
      examples: [
        "From where I stand now, looking back at who I was, I see who I'm becoming",
        "This moment becomes the foundation of every future success"
      ],
      useFor: ["Transition scenes", "Act breaks", "Timeline shifts"]
    }
  },

  // Emotional intensity levels for scene progression
  intensityProgression: {
    awakening: ["realize", "notice", "begin to sense", "become aware"],
    building: ["embrace", "embody", "step into", "claim"],
    peak: ["I AM", "I COMMAND", "I DECLARE", "I MANIFEST"],
    integration: ["naturally", "effortlessly", "automatically", "always"]
  },

  // Power words that trigger subconscious response
  powerWords: {
    action: ["NOW", "DECIDE", "CLAIM", "COMMAND", "CREATE", "MANIFEST", "ATTRACT", "ACHIEVE"],
    identity: ["I AM", "I EMBODY", "I BECOME", "I LIVE AS", "I WALK AS", "I BREATHE AS"],
    certainty: ["ALWAYS", "NATURALLY", "EFFORTLESSLY", "INEVITABLY", "UNSTOPPABLY"],
    emotion: ["POWERFUL", "CONFIDENT", "UNSTOPPABLE", "MAGNETIC", "RADIANT", "TRIUMPHANT"]
  }
};

// Scene composition techniques for visual storytelling
export const COMPOSITION_TECHNIQUES = {
  ruleOfThirds: {
    description: "Subject placed at intersection points for dynamic balance",
    useFor: ["Most scenes", "Character positioning", "Goal visualization"],
    prompt: "rule of thirds composition, subject at power point intersection"
  },
  centeredSymmetry: {
    description: "Subject perfectly centered for power and stability",
    useFor: ["Power moments", "Authority scenes", "Declaration scenes"],
    prompt: "centered symmetrical composition, powerful balanced framing"
  },
  leadingLines: {
    description: "Lines drawing eye toward subject or goal",
    useFor: ["Journey scenes", "Goal focus", "Path to success"],
    prompt: "strong leading lines drawing toward subject, purposeful composition"
  },
  framingWithinFrame: {
    description: "Subject framed by environmental elements",
    useFor: ["Focus moments", "Isolation of important elements", "Emphasis"],
    prompt: "frame within frame composition, subject elegantly framed by environment"
  },
  negativeSpace: {
    description: "Empty space creating breathing room and emphasis",
    useFor: ["Contemplation", "Power through simplicity", "Clear vision"],
    prompt: "elegant negative space composition, minimalist power"
  },
  goldenRatio: {
    description: "Fibonacci spiral composition for natural flow",
    useFor: ["Organic scenes", "Natural success", "Flowing abundance"],
    prompt: "golden ratio composition, naturally flowing visual harmony"
  }
};

// Generate cinematography direction for a specific scene type
export const getCinematographyForScene = (sceneType: string, emotionalTone: string, actNumber: number): {
  cameraAngle: string;
  shotSize: string;
  lighting: string;
  composition: string;
  movement: string;
  nlpPattern: string;
  fullPromptAddition: string;
} => {
  const techniques = CINEMATOGRAPHY_TECHNIQUES;
  const nlp = NLP_AFFIRMATION_PATTERNS;
  const comp = COMPOSITION_TECHNIQUES;
  
  // Map scene types to cinematography choices
  const cinematographyMap: Record<string, any> = {
    awakening: {
      cameraAngle: techniques.cameraAngles.eyeLevel,
      shotSize: techniques.shotSizes.closeUp,
      lighting: techniques.lighting.blueHour,
      composition: comp.centeredSymmetry,
      movement: techniques.cameraMovement.pushIn,
      nlpPattern: nlp.patterns.presupposition
    },
    decision: {
      cameraAngle: techniques.cameraAngles.lowAngle,
      shotSize: techniques.shotSizes.mediumShot,
      lighting: techniques.lighting.dramaticShadows,
      composition: comp.centeredSymmetry,
      movement: techniques.cameraMovement.pushIn,
      nlpPattern: nlp.patterns.identityStatements
    },
    transformation: {
      cameraAngle: techniques.cameraAngles.dutchAngle,
      shotSize: techniques.shotSizes.fullShot,
      lighting: techniques.lighting.rimLight,
      composition: comp.leadingLines,
      movement: techniques.cameraMovement.crane,
      nlpPattern: nlp.patterns.temporalShift
    },
    action: {
      cameraAngle: techniques.cameraAngles.lowAngle,
      shotSize: techniques.shotSizes.mediumShot,
      lighting: techniques.lighting.highKey,
      composition: comp.leadingLines,
      movement: techniques.cameraMovement.steadicam,
      nlpPattern: nlp.patterns.embeddedCommand
    },
    challenge: {
      cameraAngle: techniques.cameraAngles.highAngle,
      shotSize: techniques.shotSizes.wideShot,
      lighting: techniques.lighting.lowKey,
      composition: comp.negativeSpace,
      movement: techniques.cameraMovement.pushIn,
      nlpPattern: nlp.patterns.binds
    },
    triumph: {
      cameraAngle: techniques.cameraAngles.wormEye,
      shotSize: techniques.shotSizes.fullShot,
      lighting: techniques.lighting.goldenHour,
      composition: comp.centeredSymmetry,
      movement: techniques.cameraMovement.crane,
      nlpPattern: nlp.patterns.futureMemory
    },
    achievement: {
      cameraAngle: techniques.cameraAngles.lowAngle,
      shotSize: techniques.shotSizes.extremeWideShot,
      lighting: techniques.lighting.goldenHour,
      composition: comp.goldenRatio,
      movement: techniques.cameraMovement.pullBack,
      nlpPattern: nlp.patterns.nominalizations
    },
    celebration: {
      cameraAngle: techniques.cameraAngles.eyeLevel,
      shotSize: techniques.shotSizes.mediumCloseUp,
      lighting: techniques.lighting.highKey,
      composition: comp.ruleOfThirds,
      movement: techniques.cameraMovement.orbit,
      nlpPattern: nlp.patterns.sensoryRich
    },
    reflection: {
      cameraAngle: techniques.cameraAngles.overTheShoulder,
      shotSize: techniques.shotSizes.mediumShot,
      lighting: techniques.lighting.softDiffused,
      composition: comp.framingWithinFrame,
      movement: techniques.cameraMovement.steadicam,
      nlpPattern: nlp.patterns.presupposition
    },
    manifestation: {
      cameraAngle: techniques.cameraAngles.lowAngle,
      shotSize: techniques.shotSizes.extremeWideShot,
      lighting: techniques.lighting.goldenHour,
      composition: comp.centeredSymmetry,
      movement: techniques.cameraMovement.crane,
      nlpPattern: nlp.patterns.futureMemory
    }
  };

  // Default to action if scene type not found
  const config = cinematographyMap[sceneType.toLowerCase()] || cinematographyMap.action;
  
  // Build the full prompt addition
  const fullPromptAddition = `${config.shotSize.prompt}, ${config.cameraAngle.prompt}, ${config.lighting.prompt}, ${config.composition.prompt || ''}, cinematic 16:9 aspect ratio, photorealistic, volumetric lighting, shallow depth of field, professional cinematography`;

  return {
    cameraAngle: config.cameraAngle.name,
    shotSize: config.shotSize.name,
    lighting: config.lighting.name,
    composition: config.composition.description,
    movement: config.movement.name,
    nlpPattern: config.nlpPattern.name,
    fullPromptAddition
  };
};

// Generate NLP-enhanced affirmation based on scene context
export const generateNLPAffirmation = (
  trait: string,
  sceneType: string,
  actNumber: number
): { pattern: string; example: string; intensityLevel: string } => {
  const nlp = NLP_AFFIRMATION_PATTERNS;
  
  // Select intensity based on act
  let intensityLevel: string;
  let intensityWords: string[];
  
  if (actNumber === 1) {
    intensityLevel = "awakening";
    intensityWords = nlp.intensityProgression.awakening;
  } else if (actNumber === 2) {
    intensityLevel = "building";
    intensityWords = nlp.intensityProgression.building;
  } else {
    intensityLevel = "peak";
    intensityWords = nlp.intensityProgression.peak;
  }

  // Map scene types to NLP patterns
  const patternMap: Record<string, keyof typeof nlp.patterns> = {
    awakening: "presupposition",
    decision: "identityStatements",
    transformation: "temporalShift",
    action: "embeddedCommand",
    challenge: "binds",
    triumph: "futureMemory",
    achievement: "nominalizations",
    celebration: "sensoryRich",
    reflection: "presupposition",
    manifestation: "futureMemory"
  };

  const patternKey = patternMap[sceneType.toLowerCase()] || "identityStatements";
  const pattern = nlp.patterns[patternKey];
  
  // Generate example with trait
  const verb = intensityWords[Math.floor(Math.random() * intensityWords.length)];
  let example: string;
  
  switch (patternKey) {
    case "identityStatements":
      example = `I AM the embodiment of ${trait}. This is who I naturally am.`;
      break;
    case "presupposition":
      example = `As I continue to ${verb} my ${trait}, everything aligns perfectly.`;
      break;
    case "embeddedCommand":
      example = `You might notice yourself naturally EXPRESSING ${trait.toUpperCase()} in every moment.`;
      break;
    case "futureMemory":
      example = `I remember this moment—when my ${trait} became unstoppable.`;
      break;
    case "binds":
      example = `Whether through ease or challenge, my ${trait} only grows stronger.`;
      break;
    case "temporalShift":
      example = `From where I stand now, I see how my ${trait} has transformed everything.`;
      break;
    case "sensoryRich":
      example = `I see my ${trait} shining bright, hear the world responding, feel the power within.`;
      break;
    default:
      example = `I AM ${trait}. This is my truth.`;
  }

  return {
    pattern: pattern.name,
    example,
    intensityLevel
  };
};

// Export the complete cinematography prompt builder
export const buildCinematicPrompt = (
  sceneDescription: string,
  sceneType: string,
  emotionalTone: string,
  actNumber: number,
  visualStyle: string
): string => {
  const cinematography = getCinematographyForScene(sceneType, emotionalTone, actNumber);
  
  return `${sceneDescription}. ${cinematography.fullPromptAddition}. Style: ${visualStyle || 'cinematic and inspiring'}. Emotional tone: ${emotionalTone}.`;
};
