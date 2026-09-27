// Long-term memory + knowledge graph tools for the GPT-Live Responses backend.
// Keep in sync with src/lib/ava/memoryTools.ts, which executes them in the browser.

export const NODE_TYPES = [
  "person", "goal", "project", "business", "habit", "fear", "strength", "value",
  "belief", "skill", "place", "event", "idea", "reading", "law", "resource",
];

export const MEMORY_KINDS = [
  "fact", "goal", "win", "struggle", "commitment", "person", "preference", "insight", "session_summary",
];

export const MEMORY_FUNCTION_TOOLS = [
  {
    type: "function",
    name: "remember",
    description:
      "Save something durable about the user to long-term memory so you know it in every future session: facts about their life, goals, wins, struggles, commitments, people, preferences, insights. Save proactively whenever they tell you something that will still matter next week. One memory per call, written as a short third-person sentence.",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "e.g. 'Closing the Atlanta studio deal by Oct 15.'" },
        kind: { type: "string", enum: MEMORY_KINDS },
        importance: { type: "number", description: "1 (minor) to 5 (core to who they are / their Chief Aim). Default 3." },
      },
      required: ["content", "kind"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "recall",
    description:
      "Search long-term memory and the knowledge graph for anything related to a topic, person or word. Use before answering questions about their past, people, projects, or 'what did I say about...'.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "A few keywords." } },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "forget",
    description: "Delete a memory when the user asks you to forget something or it's no longer true. Get the id from recall.",
    parameters: {
      type: "object",
      properties: { memory_id: { type: "string" } },
      required: ["memory_id"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "graph_add",
    description:
      "Add to the user's knowledge graph: the people, goals, projects, businesses, habits, fears, strengths, values, beliefs, readings and ideas in their life, and how they connect. Nodes are matched by label, so re-using a label links to the existing node. Call whenever they mention someone or something that matters and how it relates to their Chief Aim.",
    parameters: {
      type: "object",
      properties: {
        nodes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              type: { type: "string", enum: NODE_TYPES },
              description: { type: "string" },
            },
            required: ["label", "type"],
            additionalProperties: false,
          },
        },
        edges: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string", description: "Label of the source node." },
              to: { type: "string", description: "Label of the target node." },
              relation: { type: "string", description: "Short verb phrase, e.g. 'works on', 'blocks', 'mentors', 'serves'." },
            },
            required: ["from", "to", "relation"],
            additionalProperties: false,
          },
        },
      },
      required: ["nodes"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "graph_query",
    description: "Look up a node in the knowledge graph and everything connected to it. Leave label empty for an overview of the whole graph.",
    parameters: {
      type: "object",
      properties: { label: { type: "string" } },
      additionalProperties: false,
    },
  },
];
