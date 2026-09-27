// Ava's in-app UI tools for the GPT-Live Responses backend.
// Keep in sync with src/lib/ava/uiTools.ts, which executes them in the browser.

export const AVA_DESTINATION_KEYS = [
  "home", "theater", "mind_movie_builder", "journal", "character", "actions", "episodes", "score",
  "challenges", "knowledge_graph", "blueprint", "director_ai", "soundtrack", "music", "radio", "community", "awards",
  "guide", "credits", "done_for_you", "settings",
];

export const AVA_DESTINATIONS_GUIDE = `
home: dashboard, daily rituals, Mind Movie studio
theater: watch the Mind Movie
mind_movie_builder: create or edit the Mind Movie storyboard
journal: write a journal entry
character: archetype, Law of Success Personal Analysis test, AI character analysis, scorecard
actions: today's tasks
episodes: sprints toward the Chief Aim
score: Daily Director Scorecard and stats
challenges: adversity challenges
knowledge_graph: the user's knowledge graph and everything Ava remembers about them
blueprint: personal success blueprint
director_ai: full-screen voice coaching
soundtrack / music / radio: the user's music
community: Director's Corner feed
awards, guide (how to use the app), credits (buy AI credits), done_for_you, settings`;

export const AVA_UI_TOOLS = [
  {
    type: "function",
    name: "navigate_to",
    description: "Take the user to a page in the Directors OS app. Use when they ask to go somewhere, see something, or when showing them the right screen helps.",
    parameters: {
      type: "object",
      properties: { destination: { type: "string", enum: AVA_DESTINATION_KEYS } },
      required: ["destination"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_current_page",
    description: "Which page of the app the user is looking at right now.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "open_url",
    description: "Open a website in a new browser tab (e.g. a source you found with web search, a tool, a booking page). http(s) only.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" },
        label: { type: "string", description: "Short name for the link." },
      },
      required: ["url"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "show_visual",
    description: "Put a card on screen next to Ava: a title plus short text (paragraphs or '- ' bullets), optionally an image URL and a link. Use for plans, lists, numbers, steps, quotes, or anything easier to see than hear.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string" },
        image_url: { type: "string" },
        link_url: { type: "string" },
        link_label: { type: "string" },
      },
      required: ["title"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "scroll_page",
    description: "Scroll the screen the user is looking at (or the open pop-up).",
    parameters: {
      type: "object",
      properties: { direction: { type: "string", enum: ["down", "up", "top", "bottom"] } },
      required: ["direction"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "read_screen",
    description: "See what's on the user's screen right now: headings, tappable buttons/links/tabs, and visible text. Use before tapping, or when they ask about what they're looking at.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "tap",
    description: "Tap a button, tab, link or checkbox on screen by its visible label (from read_screen). Anything that deletes, pays or signs out is refused; ask the user to tap those.",
    parameters: {
      type: "object",
      properties: { label: { type: "string" } },
      required: ["label"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "close_visual",
    description: "Remove the card Ava is showing.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
];
