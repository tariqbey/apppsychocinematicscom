## Definite Chief Aim Builder + Law of Success Knowledge + ClickUp

### 1. Ingest "Law of Success" book (Volumes 1-4)

**Static KB layer (always-on in prompts):**
- Parse PDF, extract per-Law summaries, key quotes, application rules, exercises.
- Expand `supabase/functions/_shared/success-principles-kb.ts` with a richer structure per law: `{ name, law, teaching, quote, application, diagnostic_signals, exercises, journal_prompts }`.
- Add helper `getLawsForSituation(situationTags)` that returns the 2-3 most relevant laws given tags like `procrastination`, `fear`, `mastermind-needed`, `indecision`, `enthusiasm-low`, etc.

**RAG layer (deep retrieval):**
- New table `law_of_success_chunks (id, volume, lesson, chapter, content, embedding vector(1536))` using pgvector + `openai/text-embedding-3-small`.
- One-time ingestion script (run via `code--exec`) chunks the PDF (~800-1200 chars, overlap 150) and embeds via Lovable AI Gateway.
- New edge function `law-of-success-search` — embeds the query and returns top-K chunks. Called by builder + Director AI when deep citations needed.

### 2. Upgrade existing Chief Aim Wizard into the Hill Builder

Refactor `src/components/chief-aim/ChiefAimWizard.tsx` from the current 4-step (Dream/Deadline/Exchange/Plan) into a 6-step Napoleon Hill flow, keeping the existing DB fields and adding new optional ones:

1. **Burning Desire** (The Dream / What) — vivid, present-tense, sensory.
2. **Definite Quantity & Deadline** — Hill's "exact amount of money / exact thing" + "by when".
3. **Exchange / Definite Service** — what you'll give in return.
4. **Definite Plan** — first concrete actions (auto-broken into tasks).
5. **Written Statement** — auto-composed sacred script the user reads twice daily (reuses existing Script Review modal).
6. **Self-Confidence Formula + Auto-Suggestion** — 5-line affirmation Hill prescribes, attached to the rituals.

Per step:
- Voice-to-text + AI Help already exists — keep.
- New "Which Laws apply here?" panel: pulls 2-3 laws from the static KB + 1-2 RAG citations, with one-line "How to use it for THIS goal."
- "Strengthen" button calls `enhance-chief-aim` (already exists) — extended to inject relevant laws.

Wizard mode: if user has no Chief Aim, route them into the builder automatically from dashboard CTA. If they have one, the same component runs in "refine" mode.

DB: extend `chief_aims` (or whatever table currently stores it — confirm in implementation) with `definite_quantity TEXT`, `self_confidence_formula TEXT`, `written_statement TEXT`, `laws_applied JSONB`. Non-breaking, all nullable.

### 3. Journal ↔ Laws cross-reference

- Extend `analyze-journal` edge function: after summarizing an entry, tag it with `relevant_laws[]` (from the 17 Laws) and `fear_signals[]` (from the Six Basic Fears). Store on `journal_entries` (add `relevant_laws JSONB`, `fear_signals JSONB`).
- In `DirectorsJournal.tsx`, render a "Laws to apply" chip strip under each entry, click → opens a side sheet with the law card + RAG passage.
- Director AI gets new tool `getJournalLawPatterns(days)` → returns laws/fears appearing repeatedly so the coach can say "Yo, you've been showing Fear of Criticism three days straight — here's what Hill says about it."

### 4. AI Suggestion → Confirm → Auto-Add to Actions

Replace silent auto-add with the user's preferred flow:

- In `VoiceCoach.tsx` and `DirectorAIChat.tsx`, when the coach prescribes an action, emit a structured `suggested_task` payload (title, due_date, est_minutes, linked_law, linked_chief_aim_component).
- Render an inline card with **"Add to Actions"** / **"Not now"** buttons.
- On confirm: insert into `daily_tasks` (today by default, or scheduled date). Also push to ClickUp (see §5) when connection exists.
- Same flow works in voice mode: coach says "Want me to add that?" → user says "yes" → tool call `confirmAddTask` fires.

### 5. ClickUp integration (per-user OAuth)

No Lovable connector exists for ClickUp → custom OAuth.

- User creates a ClickUp OAuth app once at developer level — we store **client_id** + **client_secret** as Supabase secrets (`CLICKUP_CLIENT_ID`, `CLICKUP_CLIENT_SECRET`).
- New table `user_clickup_connections (user_id, access_token, default_workspace_id, default_list_id, default_space_id, connected_at)`. RLS: user owns own row.
- Edge functions:
  - `clickup-oauth-start` → returns ClickUp authorize URL.
  - `clickup-oauth-callback` → exchanges code for token, stores it.
  - `clickup-create-task` → creates task in user's chosen list, called when "Add to Actions" fires.
  - `clickup-list-workspaces` / `clickup-list-lists` → for the settings picker.
- New `ClickUpIntegrationCard.tsx` in Settings → Integrations: Connect button, workspace/space/list picker, disconnect.
- "Schedule my day" command in Director AI: groups today's `daily_tasks` into time blocks, creates them as scheduled ClickUp tasks with `due_date` + `start_date`.

### 6. Director AI upgrades

- New tools: `getRelevantLaws(situation)`, `searchLawOfSuccess(query)`, `suggestTask(title, dueDate, linkedLawId)`, `confirmAddTask(taskId)`, `getJournalLawPatterns(days)`, `pushToClickUp(taskId)`.
- System prompt addition: cite laws by name, always tie advice back to user's Chief Aim, and use the suggest→confirm→add pattern instead of silently logging.

### 7. Verification

- Targeted: run `lovable_ai.py` over a sample of chunks to confirm retrieval quality; manually walk the 6-step wizard; trigger ClickUp create-task end-to-end.
- Security: validate all edge function inputs with the shared `input-validation.ts`, RLS on new tables, never expose ClickUp tokens to client.

### Files / surfaces touched

- New: `supabase/functions/law-of-success-search/`, `clickup-oauth-start`, `clickup-oauth-callback`, `clickup-create-task`, `clickup-list-workspaces`; `src/components/settings/ClickUpIntegrationCard.tsx`; migration for `law_of_success_chunks`, `user_clickup_connections`, `chief_aims` extensions, `journal_entries` extensions.
- Updated: `_shared/success-principles-kb.ts`, `ChiefAimWizard.tsx`, `enhance-chief-aim`, `analyze-journal`, `DirectorsJournal.tsx`, `VoiceCoach.tsx`, `DirectorAIChat.tsx`, `director-ai/index.ts`, dashboard CTA → builder.

### Sequencing

1. Parse PDF + write static KB + run migration + ingest embeddings.
2. Builder wizard refactor (6 steps + laws panel).
3. Journal cross-reference.
4. Suggest→Confirm→Add flow in Director AI.
5. ClickUp OAuth + sync.
6. End-to-end QA.