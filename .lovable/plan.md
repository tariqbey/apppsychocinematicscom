## Plan: Make Director AI sharper, less repetitive, and fully context-aware

### Goals
- Stop the Director AI from getting stuck asking the same question repeatedly.
- Give it stronger access to journal entries, daily actions, ritual execution, excuses, Chief Aim, and character alignment.
- Tune the coach voice toward the direct “you bullshitting / whose movie are you in?” swag accountability style while still motivating hard when the user is winning.

### What I’ll change

1. **Fix the loop/repetition behavior in live voice mode**
   - Update `src/components/director-ai/VoiceCoach.tsx` so the opening prompt does not restart the same greeting pattern every reconnect/session turn.
   - Strengthen the live system prompt with explicit anti-loop rules: never repeat the previous question, acknowledge if the user has not answered, and move to a different angle/action instead of asking the same thing again.
   - Add a small transcript-aware guard so recent user/assistant turns can be summarized into the prompt before opening or reconnecting.

2. **Expand the live voice tools/context**
   - Add tools in `VoiceCoach.tsx` for:
     - recent journal entries,
     - today’s tasks/action executions,
     - recent incomplete-task excuses,
     - today’s ritual status,
     - Chief Aim details.
   - Update tool descriptions so Gemini Live knows when to call them instead of guessing.

3. **Upgrade the Director AI backend coaching context**
   - Update `supabase/functions/director-ai/index.ts` to fetch richer status from the database:
     - today’s completed and incomplete tasks,
     - action execution ritual status,
     - recent journal themes/moods,
     - recent excuse patterns,
     - scorecard status if available,
     - Chief Aim as the authoritative source.
   - Add an “accountability read” section that interprets the data instead of merely listing it: green light, yellow light, or bullshit alert.

4. **Tune the voice/personality**
   - Strengthen the `swag`/`hustler` coaching style to match your requested tone:
     - “Yo, you bullshitting today” when actions do not match the Chief Aim,
     - “Whose movie are you in?” when the user is acting out of alignment,
     - “KUT, reset, resume” when they’re off-script,
     - “Keep pushing, baby” / high-energy celebration when they’re executing.
   - Keep it short, spoken, and TTS-friendly with numbers spelled out.

5. **Make the greeting proactive**
   - Update `generateProactiveOpening` in `DirectorAIAgent.tsx` and the backend greeting logic so the first thing the coach says is based on current status:
     - if tasks/journal/action execution are missing: direct accountability,
     - if excuses repeat: call the pattern out,
     - if actions are done: celebrate and push forward,
     - if Chief Aim is missing or incomplete: drive them back to the Final Scene.

6. **Safety/quality checks**
   - Verify the chat and voice code still uses authenticated calls.
   - Check that prompts do not encourage harmful abuse; the coach stays blunt, motivating, and aligned with the user’s preferred style.
   - Run targeted verification through code inspection and any available function/log checks if needed.

### Technical notes
- Frontend files likely touched:
  - `src/components/director-ai/VoiceCoach.tsx`
  - `src/components/director-ai/DirectorAIAgent.tsx`
- Backend file likely touched:
  - `supabase/functions/director-ai/index.ts`
- No new database tables are needed; the app already has journals, tasks, rituals, scorecards, profiles, and chat history.