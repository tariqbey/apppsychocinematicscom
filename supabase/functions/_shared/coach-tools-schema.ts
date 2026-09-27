// Director AI coaching tool schemas for the GPT-Live Responses backend.
// Keep in sync with src/lib/coachTools.ts, which executes these tools in the browser.
export const COACH_FUNCTION_TOOLS = [
  {
    type: "function",
    name: "getCurrentChiefAim",
    description: "Pull the user's current Definite Chief Aim (what, by when, exchange, plan) plus their Director Character name.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "getRecentJournalEntries",
    description: "Read the user's 3 most recent journal entries, including mood and AI analysis.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "getTodaysTasks",
    description: "Check today's Three Things: which are done and which are pending, with task ids.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "getTodaysRituals",
    description: "Check today's rituals: morning screening, script review, action execution, evening review, journal, anthem.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "getRecentExcuses",
    description: "Recent incomplete-task reasons, grouped, so you can name excuse patterns.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "getTodaysScorecard",
    description: "Today's Daily Director Scorecard total, if filled out.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "getActivityStreak",
    description: "Current and best streak, last activity date, days_inactive, is_cold_streak. Call early in every session.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "getPersonalAnalysis",
    description: "The user's latest Law of Success Personal Analysis: law grades, danger points, blind spots, dominant fear, Maat alignment.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "addTaskToToday",
    description: "Add an action to today's list whenever the user commits to doing something. One task per call.",
    parameters: {
      type: "object",
      properties: {
        task_text: { type: "string", description: "Concise action, e.g. 'Call back the prospect from Tuesday'." },
        priority: { type: "number", description: "Optional order; lower is higher priority. Default 99." },
      },
      required: ["task_text"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "updateTask",
    description: "Modify or complete an existing task by id (get ids from getTodaysTasks).",
    parameters: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        task_text: { type: "string" },
        is_completed: { type: "boolean" },
        priority: { type: "number" },
      },
      required: ["task_id"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "saveSessionNote",
    description: "Save an important insight, decision or commitment from this session.",
    parameters: {
      type: "object",
      properties: {
        note: { type: "string", description: "The insight or commitment to remember." },
        topic: { type: "string", description: "Optional short topic label." },
      },
      required: ["note"],
      additionalProperties: false,
    },
  },
] as const;
