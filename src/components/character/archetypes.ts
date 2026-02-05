 export interface Archetype {
   id: string;
   name: string;
   cinematicDefinition: string;
   superpower: string;
   superpowerDescription: string;
   shadow: string;
   shadowDescription: string;
   directorsNote: string;
   lightShadow: { light: string; shadow: string };
 }
 
 export const ARCHETYPES: Archetype[] = [
   {
     id: "concerned_observer",
     name: "The Concerned Observer",
     cinematicDefinition: "Derived from Michael Rabiger's concept of the 'Concerned Observer'—the weightless spirit that watches events with empathy but does not intercede.",
     superpower: "High-Fidelity Perception",
     superpowerDescription: "They see the 'Mise-en-scène' clearly without emotional distortion. They hold the space for the cast.",
     shadow: "The Passive Spectator",
     shadowDescription: "They watch the dailies of their life without ever yelling 'Action.' They suffer from 'Analysis Paralysis' or becoming a voyeur of their own existence.",
     directorsNote: "You capture the perfect shot, but you refuse to release the shutter.",
     lightShadow: { light: "High-Fidelity Perception", shadow: "Passive Spectator" }
   },
   {
     id: "showrunner",
     name: "The Showrunner",
     cinematicDefinition: "The person with ultimate creative and management authority who ensures the 'Bible' of the show is followed.",
     superpower: "Total Production Control",
     superpowerDescription: "They instinctively understand the 'Superobjective' of the entire production. They ensure the crew and cast are aligned.",
     shadow: "The Micromanager",
     shadowDescription: "They stifle the actors' spontaneity. They try to control every light and prop, leading to 'Sensory Overload' and production burnout.",
     directorsNote: "You are running the set, but you forgot to let the actors breathe.",
     lightShadow: { light: "Total Production Control", shadow: "Micromanager" }
   },
   {
     id: "lead_editor",
     name: "The Lead Editor",
     cinematicDefinition: "The architect of the 'Final Cut.' They ruthlessly remove scenes that do not serve the story.",
     superpower: "The K-U-T",
     superpowerDescription: "They possess the ability to 'cut out destructive frames' and spot inconsistency immediately. They value narrative flow over sentimentality.",
     shadow: "The Butcher",
     shadowDescription: "They cut so aggressively that the movie loses its soul. They focus on the flaws in the footage rather than the potential of the scene.",
     directorsNote: "You cut the truth, but you left the emotion on the floor.",
     lightShadow: { light: "The K-U-T", shadow: "The Butcher" }
   },
   {
     id: "studio_executive",
     name: "The Studio Executive",
     cinematicDefinition: "The 'Greenlight' authority. They hold the purse strings and demand that the movie be profitable and meet the 'embedded values' of the studio.",
     superpower: "High Standards",
     superpowerDescription: "They ensure the 'Production Value' is elite. They refuse to accept B-movie effort for an A-list life.",
     shadow: "The Killjoy",
     shadowDescription: "They cancel the project before it starts because the budget (emotional risk) looks too high. They judge the 'dailies' too harshly before post-production is finished.",
     directorsNote: "You are judging the rough cut like it's the premiere.",
     lightShadow: { light: "High Standards", shadow: "The Killjoy" }
   },
   {
     id: "screenwriter",
     name: "The Screenwriter",
     cinematicDefinition: "The architect of the 'Paradigm.' They understand structure, plot points, and the linear progression of the story.",
     superpower: "The Blueprint",
     superpowerDescription: "They create the 'Three-Act Structure' that makes success inevitable. They value logic and cause-and-effect.",
     shadow: "The Formulaic Hack",
     shadowDescription: "They become obsessed with the 'formula' rather than the 'form'. They create rigid scripts that allow no room for improvisation or the 'magic if'.",
     directorsNote: "You wrote a perfect script, but there's no life in the dialogue.",
     lightShadow: { light: "The Blueprint", shadow: "Formulaic Hack" }
   },
   {
     id: "script_doctor",
     name: "The Script Doctor",
     cinematicDefinition: "The expert brought in to fix a broken story. They diagnose 'plot holes' and 'character inconsistencies'.",
     superpower: "Diagnostic Logic",
     superpowerDescription: "They can look at a life that isn't working and immediately identify the 'Inciting Incident' that caused the problem.",
     shadow: "The Critic",
     shadowDescription: "They can explain why the movie is bad, but they cannot create a good one. They are stuck in 'intellectualizing' the role rather than living it.",
     directorsNote: "You can analyze the scene, but can you play it?",
     lightShadow: { light: "Diagnostic Logic", shadow: "The Critic" }
   },
   {
     id: "method_actor",
     name: "The Method Actor",
     cinematicDefinition: "The performer who uses 'Emotional Memory' to completely transform into the character. They don't act; they are.",
     superpower: "Identity Shifting",
     superpowerDescription: "They can completely overwrite their 'Old Self' with a 'New Self' through sheer intensity of belief.",
     shadow: "Lost in Character",
     shadowDescription: "They lose their 'Grounding' and cannot separate the role from reality. They risk emotional burnout from high-intensity performance without a 'KUT!' mechanism.",
     directorsNote: "You're deep in the role, but you forgot who you are when the camera stops.",
     lightShadow: { light: "Identity Shifting", shadow: "Lost in Character" }
   },
   {
     id: "stunt_coordinator",
     name: "The Stunt Coordinator",
     cinematicDefinition: "The expert who manages high-risk sequences. They ensure 'Safety' while executing dangerous maneuvers.",
     superpower: "Risk Mitigation",
     superpowerDescription: "They anticipate danger before it happens. They protect the 'Lead Actor' (the self) from physical and emotional harm.",
     shadow: "The Paranoiac",
     shadowDescription: "They refuse to let the actor perform the stunt because it 'might' go wrong. They pad the set so much that the movie becomes boring and safe.",
     directorsNote: "You padded the walls so well that we can't hear the dialogue.",
     lightShadow: { light: "Risk Mitigation", shadow: "The Paranoiac" }
   },
   {
     id: "ensemble_director",
     name: "The Ensemble Director",
     cinematicDefinition: "The director who specializes in 'Casting' and 'Chemistry.' They focus on the interplay between the supporting cast.",
     superpower: "Chemistry Management",
     superpowerDescription: "They ensure the 'Supporting Cast' supports the Lead. They create a 'Safe Set' policy where everyone thrives.",
     shadow: "The People Pleaser",
     shadowDescription: "They refuse to fire a 'Supporting Actor' who is sabotaging the production because they want everyone to get along. They let the extras crowd the frame.",
     directorsNote: "You're keeping the extras happy at the expense of the star.",
     lightShadow: { light: "Chemistry Management", shadow: "People Pleaser" }
   },
   {
     id: "location_scout",
     name: "The Location Scout",
     cinematicDefinition: "The visionary who goes out before production to find the perfect world for the story to take place.",
     superpower: "Visionary Exploration",
     superpowerDescription: "They find 'New Worlds' and possibilities that others cannot see. They are always looking at the horizon/future acts.",
     shadow: "The Escapist",
     shadowDescription: "They are always scouting the next movie and never actually shooting the current one. They prefer the dream of the location to the reality of the set.",
     directorsNote: "Stop scouting. Start filming.",
     lightShadow: { light: "Visionary Exploration", shadow: "The Escapist" }
   },
   {
     id: "distributor",
     name: "The Distributor",
     cinematicDefinition: "The force that connects the movie to the audience. They understand 'Marketability' and 'Genre'.",
     superpower: "Connection",
     superpowerDescription: "They know how to 'Pitch' the vision to the world. They weave the personal story into the collective narrative (The Hive Mind).",
     shadow: "The Sellout",
     shadowDescription: "They edit the movie just to please the audience (social approval) rather than honoring the Director's vision. They lose their 'Artistic Identity' for likes and views.",
     directorsNote: "You sold the tickets, but you lost the movie.",
     lightShadow: { light: "Connection", shadow: "The Sellout" }
   }
 ];

export function getArchetypeById(id: string): Archetype | undefined {
  return ARCHETYPES.find(a => a.id === id);
}
 
 // Legacy ID mapping for backward compatibility with existing database records
 export const LEGACY_ID_MAP: Record<string, string> = {
   "still_center": "concerned_observer",
   "sovereign": "showrunner",
   "truth_keeper": "lead_editor",
   "sacred_judge": "studio_executive",
   "master_builder": "screenwriter",
   "divine_analyst": "script_doctor",
   "alchemist": "method_actor",
   "protector": "stunt_coordinator",
   "harmonizer": "ensemble_director",
   "wayfinder": "location_scout",
   "weaver": "distributor"
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
