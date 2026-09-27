/**
 * Director AI coaching tools, shared by voice engines that execute tools in the
 * browser under the signed-in user's session (RLS applies).
 *
 * Used by the GPT-Live coach. Mirrors the tool set in VoiceCoach (Gemini Live).
 */
import { supabase } from "@/integrations/supabase/client";

type Json = Record<string, unknown>;

/** JSON Schema function tools, in the shape the OpenAI Live/Responses APIs expect. */
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

/** Same date convention as VoiceCoach and the rest of the task code (UTC date). */
function todayLocal(): string {
  return new Date().toISOString().split("T")[0];
}

/** Runs a coach tool for the given user. Always resolves; errors come back as { error }. */
export async function runCoachTool(userId: string, name: string, args: Json): Promise<Json> {
  const today = todayLocal();
  try {
    switch (name) {
      case "getCurrentChiefAim": {
        const { data } = await supabase
          .from("user_profiles")
          .select("chief_aim_what, chief_aim_by_when, chief_aim_exchange, chief_aim_plan, director_character_name, display_name")
          .eq("user_id", userId)
          .maybeSingle();
        return data ?? { error: "No Chief Aim set yet" };
      }
      case "getRecentJournalEntries": {
        const { data } = await supabase
          .from("journal_entries")
          .select("content, mood, ai_analysis, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3);
        return data && data.length ? { entries: data } : { error: "No journal entries yet" };
      }
      case "getTodaysTasks": {
        const { data } = await supabase
          .from("daily_tasks")
          .select("id, task_text, is_completed, incomplete_reason, priority")
          .eq("user_id", userId)
          .eq("task_date", today)
          .order("priority", { ascending: true });
        if (!data || data.length === 0) return { error: "No tasks set for today." };
        return { total: data.length, completed: data.filter((t) => t.is_completed).length, tasks: data };
      }
      case "getTodaysRituals": {
        const { data } = await supabase
          .from("daily_rituals")
          .select("morning_screening, script_review, chief_aim_listened, action_execution, evening_review, journal_entry")
          .eq("user_id", userId)
          .eq("ritual_date", today)
          .maybeSingle();
        return data ?? { error: "No ritual data recorded today." };
      }
      case "getRecentExcuses": {
        const { data } = await supabase
          .from("daily_tasks")
          .select("task_text, incomplete_reason, task_date")
          .eq("user_id", userId)
          .eq("is_completed", false)
          .not("incomplete_reason", "is", null)
          .order("task_date", { ascending: false })
          .limit(10);
        if (!data || data.length === 0) return { excuses: [], message: "No recent excuses logged." };
        const patterns: Record<string, number> = {};
        data.forEach((t) => {
          if (t.incomplete_reason) patterns[t.incomplete_reason] = (patterns[t.incomplete_reason] || 0) + 1;
        });
        return { patterns, recent: data };
      }
      case "getTodaysScorecard": {
        const { data } = await supabase
          .from("daily_scorecards")
          .select("total_score, scorecard_date")
          .eq("user_id", userId)
          .eq("scorecard_date", today)
          .maybeSingle();
        return data ?? { error: "No scorecard filled out today." };
      }
      case "getActivityStreak": {
        const { data, error } = await supabase.rpc("calculate_activity_streak", { p_user_id: userId });
        if (error) return { error: error.message };
        const row = (Array.isArray(data) ? data[0] : data) as Json | undefined;
        if (!row) return { error: "No streak data" };
        const daysInactive = Number(row.days_inactive ?? 0);
        return { ...row, is_cold_streak: daysInactive >= 2 || Number(row.current_streak ?? 0) === 0 };
      }
      case "getPersonalAnalysis": {
        // Table added by the Law of Success Personal Analysis feature; absent until that migration runs.
        const { data, error } = await (supabase as unknown as {
          from: (t: string) => {
            select: (c: string) => {
              eq: (k: string, v: string) => {
                order: (k: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: Json[] | null; error: { message: string } | null }> };
              };
            };
          };
        })
          .from("law_of_success_analyses")
          .select("created_at, general_average, chief_aim_grade, law_scores, danger_points, blind_spots, dominant_fear, maat_alignment")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (error) return { error: "Personal Analysis not available yet." };
        return data?.[0] ?? { error: "The user hasn't taken the Law of Success Personal Analysis yet." };
      }
      case "addTaskToToday": {
        const task_text = String(args.task_text ?? "").trim();
        if (!task_text) return { error: "Task text required" };
        const priority = typeof args.priority === "number" ? args.priority : 99;
        const { data, error } = await supabase
          .from("daily_tasks")
          .insert({ user_id: userId, task_text, task_date: today, priority })
          .select("id, task_text, priority")
          .single();
        if (error) return { error: error.message };
        window.dispatchEvent(new CustomEvent("director-ai:task-added", { detail: data }));
        return { success: true, task: data };
      }
      case "updateTask": {
        const task_id = String(args.task_id ?? "");
        if (!task_id) return { error: "task_id required" };
        const patch: Json = {};
        if (typeof args.task_text === "string") patch.task_text = args.task_text;
        if (typeof args.is_completed === "boolean") patch.is_completed = args.is_completed;
        if (typeof args.priority === "number") patch.priority = args.priority;
        if (Object.keys(patch).length === 0) return { error: "Nothing to update" };
        const { error } = await supabase.from("daily_tasks").update(patch).eq("id", task_id).eq("user_id", userId);
        return error ? { error: error.message } : { success: true };
      }
      case "saveSessionNote": {
        const note = String(args.note ?? "").trim();
        if (!note) return { error: "Empty note" };
        const topic = args.topic ? String(args.topic) : null;
        const { error } = await supabase.from("coaching_session_notes").insert({ user_id: userId, note, topic });
        return error ? { error: error.message } : { success: true };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tool failed" };
  }
}
