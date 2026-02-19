

# Daily Ritual: Auto-Advance Flow + Dashboard Progress Indicator

## What You'll Get

1. **Auto-advance between ritual steps** -- After completing one ritual (e.g., Morning Screening), the ritual dialog stays open and automatically highlights/scrolls to the next incomplete step instead of sending you back to the homepage.

2. **Next step "lit up"** -- The current/next incomplete ritual card gets a glowing highlight treatment so you always know what's next.

3. **Animated progress indicator on the Dashboard module card** -- The Daily Ritual card on the welcome page will show a live progress ring/bar so you can see at a glance how many scenes you've completed today without opening the ritual.

---

## Technical Details

### File 1: `src/components/dashboard/DailyRitualChecklist.tsx`

**Auto-advance after completing a step:**
- When `handleRitualClick` fires for "morning" (Theater), "script" (Script Review), "evening" (Evening Review), or "journal", the dialog currently closes or navigates away.
- Change the flow so after the sub-modal/view completes (e.g., Theater closes, Script Review modal closes), the ritual dialog **stays open** and the completion state refreshes.
- Add a `currentStepIndex` state that points to the first incomplete ritual. After any ritual is toggled complete, auto-advance `currentStepIndex` to the next incomplete one.

**"Lit up" next step:**
- Add a visual distinction for the "current" (next incomplete) ritual card -- a pulsing border glow, brighter background, and a "NOW PLAYING" or "UP NEXT" badge.
- Other incomplete steps remain dimmed; completed steps keep their gold "SHOT" styling.

**Keep dialog open after sub-actions:**
- For "morning" (Theater): Instead of closing the ritual dialog permanently, set a flag so that when `TheaterView` closes, the ritual dialog re-opens automatically.
- For "script" (Script Review): The `ScriptReviewModal` already opens within the same component -- just ensure the ritual dialog stays visible behind it or re-opens after.
- For "actions": Instead of `navigate("/actions")`, show a mini-task panel inline or open it as a modal, then return to the ritual flow.
- For "journal": Same pattern -- re-open ritual dialog after journal closes.

### File 2: `src/pages/Index.tsx`

**Re-open ritual dialog after sub-views close:**
- Add callback props so when Theater, Scorecard, or Journal close, they can signal the Index page to re-open `showDailyRitual`.
- Example: When `TheaterView` closes via `onClose`, check a flag and call `setShowDailyRitual(true)` to bring the user back to the ritual flow.

**Pass ritual progress data to the ModuleCard:**
- Fetch today's `daily_rituals` row in `Index.tsx` (or lift the state from `DailyRitualChecklist`) so we know `completedCount` and `totalRituals` at the dashboard level.

### File 3: `src/components/dashboard/ModuleCard.tsx`

**Add optional progress prop:**
- Add `progress?: number` (0-100) and `progressLabel?: string` (e.g., "3/5") to `ModuleCardProps`.
- When `progress` is provided, render an animated circular progress ring or a glowing linear progress bar at the bottom of the card.
- The progress bar will use the card's `colorScheme` for the fill color with a glow effect, and animate on mount using a CSS transition.

### New State Management

A small custom hook or lifted state in `Index.tsx` will:
1. Query `daily_rituals` for today on mount.
2. Also check `daily_tasks` for action execution status.
3. Expose `{ completedCount, totalRituals, ritualProgress }` so both the `ModuleCard` and `DailyRitualChecklist` share the same source of truth.
4. Provide a `refresh()` function that both components call after any ritual state change.

### Flow Summary

```text
User taps "Daily Ritual" card (sees progress: 2/5)
  -> Ritual dialog opens, Step 3 "Action Execution" is highlighted as "UP NEXT"
  -> User taps "Action Execution" 
  -> Mini task panel appears (or Actions modal)
  -> User completes tasks, closes panel
  -> Ritual dialog is still open, now Step 4 "Evening Session" is highlighted
  -> User taps "Evening Session"
  -> Evening Review modal opens
  -> User completes review, closes modal
  -> Ritual dialog still open, Step 5 "Journal" highlighted
  -> ...and so on until all 5 complete
```

### No Database Changes Required

All ritual data already lives in the `daily_rituals` and `daily_tasks` tables. This is purely a frontend flow improvement.

