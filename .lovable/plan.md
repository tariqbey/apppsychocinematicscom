
## What I’m seeing (from the current code + a mobile preview)
- The flaming countdown module **is still wired up** on the dashboard route `/` in `src/pages/Index.tsx` and should render **directly under** `DirectorBanner` when `chiefAim.byWhen` has a value.
- The Director AI overlay **does open** and renders, but the mobile experience can still feel “off” (scrolling/spacing, close button visibility, and potential freezes depending on device/browser).
- Important: iPhone/iOS often **does not support browser Speech Recognition** (`webkitSpeechRecognition`). If your “mobile app” is an iPhone Home Screen install, voice input can appear broken even when the UI looks correct. We can make it stable + responsive regardless, and optionally add a real mobile-grade voice connection.

## Likely causes of “Director AI not responsive / page freezes”
1. **Auto-start / auto-resume voice** happening outside a user tap can trigger permission/AudioContext issues and make Safari feel frozen.
   - In `DirectorAIAgent.tsx`, `streamChat()` currently does `setTimeout(() => setVoiceEnabled(true), 300)` in a couple places, which can kick off mic/audio logic without an explicit gesture.
2. **Too many heavy loops at once** (canvas `requestAnimationFrame` + audio analysis `requestAnimationFrame` + timers + large overlays) can spike CPU on mobile and feel unresponsive.
3. **Layout/scroll structure**: the overlay uses a full-page scroll container (`overflow-y-auto`) plus sticky header + fixed buttons. On some phones this produces odd spacing, “funny” scaling, and controls drifting.

## Goal / Acceptance criteria
- Director AI opens instantly on mobile without freezing the page.
- The overlay fits the screen (safe areas), no weird scaling, no horizontal overflow.
- Close/exit controls are always visible and tappable.
- Text chat always works.
- Voice controls:
  - If the device/browser supports speech recognition: mic works only when the user taps it (no auto-start).
  - If not supported (common on iOS): we show a clear “Voice not available on this device yet” state instead of broken behavior.
  - Optional upgrade: true mobile voice agent using ElevenLabs realtime conversation (works on iOS).

---

## Implementation plan (code changes)

### A) Restore/guarantee the flaming countdown module visibility
1. **Keep the countdown directly under the welcome module** (already in `Index.tsx`).
2. Improve `ChiefAimCountdown.tsx` resilience so it doesn’t silently disappear:
   - If `byWhen` is present but can’t be parsed, show a compact “Set your deadline” / “Fix your date format” helper instead of returning `null`.
   - Ensure the fire background is not clipped on small devices (confirm padding + rounded container).
3. Add a tiny debug-only console log (dev only) when countdown doesn’t render due to missing/invalid `byWhen` so we can trace “where did it go?” reports.

### B) Redesign Director AI mobile layout to be truly responsive
Refactor `DirectorAIAgent.tsx` overlay structure from “page scroll” to a **3-row layout**:
1. Container: `fixed inset-0` with `h-[100dvh] w-full`.
2. Use CSS grid or flex:
   - **Header** (sticky, safe-area top padding)
   - **Middle** (scrollable transcript area only)
   - **Footer** (input + action buttons pinned, safe-area bottom padding)
3. Remove outer `overflow-y-auto` and instead make only the transcript section scrollable (prevents the whole UI from drifting when the keyboard opens).
4. Ensure the floating close button renders with guaranteed contrast:
   - Force icon color (e.g., `text-black` on the icon itself) and add an outline ring so it’s visible even over glow backgrounds.

### C) Stop the freezes: remove auto mic start + reduce heavy work
In `DirectorAIAgent.tsx`:
1. **Remove automatic voice resume** after responses/errors:
   - Delete/replace `setTimeout(() => setVoiceEnabled(true), 300)` behavior.
   - Replace with: “Voice stays off unless the user explicitly taps Mic.”
2. Add a “Speaking/Processing” state that never tries to start listening automatically.
3. Reduce global “kill all audio elements” behavior:
   - Replace `document.querySelectorAll("audio")...` with stopping only the audio instances the component owns (less risky + less heavy).
4. Add body scroll-lock while Director AI is open:
   - `document.body.style.overflow = 'hidden'` on open; restore on close.

### D) Mobile performance: throttle the orb animation
In `VoiceOrb.tsx`:
1. Make canvas size responsive (smaller on mobile, e.g., 200–240px instead of 280px).
2. Throttle rendering to ~30fps on mobile (time-based skip frames) to reduce CPU.
3. Respect reduced motion:
   - If `prefers-reduced-motion`, render a static orb (no `requestAnimationFrame` loop).

### E) Make voice behavior correct across devices
1. Improve the “not supported” pathway:
   - If SpeechRecognition isn’t available, keep the UI stable and show a clear message + hide/disable the mic button.
2. Optional (recommended for iPhone): **true mobile voice agent using ElevenLabs realtime conversation**:
   - Add a backend function to mint a short-lived conversation token (server-side, secure).
   - Use `@elevenlabs/react`’s `useConversation` with WebRTC for iOS-friendly speech-to-speech.
   - Wire transcripts into `AgentTranscript`.
   - Keep the existing text-based `director-ai` function as a fallback or “Text Mode”.

> This optional step requires your ElevenLabs **Agent ID**. If you don’t have one yet, we’ll still ship the stability + responsive UI fixes and leave voice as text-only on iPhone (instead of broken).

---

## Testing plan (mobile-first)
1. iPhone Safari + Home Screen install (if applicable):
   - Open Director AI → verify no freeze, UI fits, close works.
   - Verify mic behavior shows correct “not supported” message (unless ElevenLabs voice agent is enabled).
2. Android Chrome:
   - Open Director AI → tap mic → grant permission → speak → confirm transcript and/or auto-submit works.
3. Stress tests:
   - Open/close Director AI repeatedly (10x) → no degraded performance.
   - Rotate portrait/landscape with Director AI open → layout remains stable.
4. Verify the flaming countdown:
   - With a valid “By When” date → fire module shows.
   - With missing/invalid date → module shows helpful prompt instead of disappearing.

---

## Files expected to change
- `src/components/director-ai/DirectorAIAgent.tsx` (layout + freeze fixes + voice behavior)
- `src/components/director-ai/VoiceOrb.tsx` (mobile perf)
- `src/components/dashboard/ChiefAimCountdown.tsx` (countdown resilience + mobile polish)
- (Optional if enabling iPhone voice) create backend function for ElevenLabs token + add a small client integration layer using `@elevenlabs/react`

---

## One decision I need from you (only if you want iPhone voice to truly work)
- Do you want the Director AI voice on iPhone to work via ElevenLabs realtime voice agent?
  - If yes: you’ll provide the ElevenLabs **Agent ID**, and I’ll implement the token-backed WebRTC connection.
  - If no: I’ll make the experience stable and responsive and keep iPhone in text mode with clear messaging.
