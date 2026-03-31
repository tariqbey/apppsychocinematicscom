

# Full Codebase Optimization Plan

## Part A: Fix Build Errors (Immediate)

The `NodeJS.Timeout` type is unavailable because `tsconfig.app.json` doesn't include Node types. Replace all `NodeJS.Timeout` references with `ReturnType<typeof setTimeout>` across six files:

- `src/components/challenges/ChallengeSoundtrackGenerator.tsx` (line 65)
- `src/components/testimonials/TestimonialRecorder.tsx` (lines 74, 78)
- `src/contexts/PointsContext.tsx` (line 53)
- `src/hooks/useScheduledReminders.ts` (lines 62, 63)
- `src/hooks/useVoiceInput.ts` (line 60)

---

## Part B: Performance — Lazy Loading (High Impact)

**File: `src/App.tsx`**

Convert all page imports to `React.lazy()` and wrap `<Routes>` in `<Suspense fallback={<AppLoader />}>`. This cuts initial bundle by ~40-60%.

Pages to lazy-load (all except `Index` which is the landing):
- Signup, DirectorCorner, Subscribe, SubscriptionSuccess, CreditsSuccess, Credits, DirectorsGuide, AdminDashboard, AwardsCeremony, Settings, Actions, Character, Episodes, Soundtrack, Music, Radio, Score, DoneForYou, DFYSuccess, Challenges, ResetPassword, DirectorProfile, DirectorAI, Blueprint, NotFound

---

## Part C: Route Cleanup

**File: `src/App.tsx`**

Replace duplicate route aliases with `<Navigate>` redirects:

```text
/user-manual → redirect to /guide
/manual      → redirect to /guide
/tutorial    → redirect to /guide
/tutorials   → redirect to /guide
```

---

## Part D: Error Boundaries

**New file: `src/components/ui/FeatureErrorBoundary.tsx`**

Create a reusable error boundary component with cinematic styling (dark card, gold accent, "Scene interrupted" messaging, retry button).

Wrap these high-risk sections in `Index.tsx` and other pages:
- TheaterView
- DirectorAIChat / DirectorAIAgent
- EditBay (timeline editor)
- MindMovieScriptWizard
- DirectorsJournal (already has one — keep it)

---

## Part E: Consolidate Audio Context

**File: `src/contexts/AudioContext.tsx`**

Remove `useAudioOptional()`. Search all consumers — any component using `useAudioOptional` should be confirmed as always rendered inside `<AudioProvider>` (which wraps the entire app), then switched to `useAudio()`.

---

## Part F: Branded Loading State

**File: `src/components/ui/AppLoader.tsx`**

The cinematic splash already exists. Ensure the `<Suspense>` fallback in Part B uses `<AppLoader />` (the simple variant) so lazy-loaded pages get the branded spinner with the Psycho-Cinematics logo instead of a blank screen.

---

## Part G: Empty States

Audit key list views and add cinematic empty states with clear CTAs:
- Episodes list (no episodes) → "Your story hasn't started. Create Episode One."
- Journal entries (none) → "The Director's chair is empty. Write your first entry."
- Movie Vault (no movies) → "No footage in the vault. Shoot your first Mind Movie."
- Community posts (none) → "The Director's Corner is quiet. Start the conversation."

Each empty state: dark card, subtle film grain texture, gold CTA button, one-line motivational copy.

**Files affected:**
- `src/components/episodes/EpisodesList.tsx`
- `src/components/journal/DirectorsJournal.tsx`
- `src/components/mind-movie/MovieVault.tsx`
- `src/components/community/CreatePostForm.tsx` or the community feed component

---

## Part H: Accessibility Quick Wins

- Director AI floating button: add `role="button"`, `aria-label="Open Director AI coach"`, keyboard focus ring
- Gold-on-dark contrast: audit key text elements, bump gold from `#D4AF37` to `#E5C158` where needed for WCAG AA
- Add per-route `<title>` via a small `useDocumentTitle` hook

---

## Part I: Meta Tags Per Route

**New file: `src/hooks/useDocumentTitle.ts`**

Simple hook that sets `document.title` on mount. Call it in each page component:
```
useDocumentTitle("Episodes | Director's OS")
```

---

## Implementation Order

1. **Part A** — Fix build errors (unblocks everything)
2. **Part B + C + F** — Lazy loading + route cleanup + branded fallback (biggest perf win)
3. **Part D** — Error boundaries (stability)
4. **Part E** — Audio context consolidation (code quality)
5. **Part G** — Empty states (UX)
6. **Part H + I** — Accessibility + meta tags (polish)

Total files created: 2 (`FeatureErrorBoundary.tsx`, `useDocumentTitle.ts`)
Total files edited: ~15

