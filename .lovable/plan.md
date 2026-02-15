

# Fix: Director AI Voice Loop Breaking After First Exchange

## Problem

The voice conversation stops working after the AI's first response. The user speaks, the AI responds with voice, but then it can no longer hear the user. There are three root causes:

---

## Root Cause 1: `stopSpeaking()` destroys the audio element permanently

In `stopSpeaking()` (line 454-457), when the AI finishes speaking or is interrupted, the code sets `audioRef.current = null`. This means the next time `speakText` runs, it creates a new `Audio()` element -- but on iOS, that new element was never "unlocked" by a user gesture, so playback silently fails. When playback fails, `onended` never fires, and the auto-resume-listening logic never triggers.

**Fix**: Stop clearing `audioRef.current = null` in `stopSpeaking`. Instead, just pause and reset the src without destroying the reference.

---

## Root Cause 2: `stopListening()` inside `onSilence` kills the mic before the transcript submits

When silence is detected (line 129-138 in DirectorAI.tsx), the `onSilence` callback calls `setVoiceEnabled(false)`, which is correct. But then in `streamChat` (line 490), `stopListening()` is called again. The real issue is that after the full AI response + TTS cycle completes and `startListening()` is called to resume, the `permissionGranted` flag in `useVoiceInput` may have been reset because `stopAudioAnalysis` (called from `stopListening`) closes the AudioContext and stops all media tracks. On the next `startListening`, the hook tries to request microphone permission again -- which on iOS requires a user gesture and silently fails without one.

**Fix**: Persist `permissionGranted` across stop/start cycles. Once granted, it should stay granted for the session. Also, avoid calling `startAudioAnalysis` on every `startListening` since it creates a new media stream each time. Cache the permission state.

---

## Root Cause 3: iOS `continuous` mode is disabled, causing recognition to end after one result

On iOS (line 177), `recognition.continuous` is set to `false` because iOS Safari doesn't support continuous mode well. This means after getting one final result, recognition ends. The `onend` handler (line 187-204) checks `continuous && hasStartedRef.current` to auto-restart, but since `continuous` is `false` on iOS, it never auto-restarts. The silence timer fires and submits, but by then recognition is already dead.

**Fix**: In the `onend` handler, also auto-restart when `hasStartedRef.current` is true regardless of the `continuous` flag. The key signal is whether the user/system still wants to be listening (`hasStartedRef.current`), not the browser API mode.

---

## Implementation Steps

### Step 1: Fix `stopSpeaking` to preserve the audio element

In `src/pages/DirectorAI.tsx`, change `stopSpeaking` to NOT null out `audioRef.current`:

```typescript
// Before:
audioRef.current.pause();
audioRef.current.src = "";
audioRef.current = null;

// After:
audioRef.current.pause();
audioRef.current.src = "";
// Keep the reference alive for iOS audio unlock persistence
```

### Step 2: Fix `useVoiceInput` auto-restart on iOS

In `src/hooks/useVoiceInput.ts`, update the `onend` handler to restart recognition whenever `hasStartedRef.current` is true, not just when `continuous` is true:

```typescript
// Before:
if (continuous && hasStartedRef.current) {

// After:
if (hasStartedRef.current) {
```

### Step 3: Persist microphone permission across stop/start cycles

In `src/hooks/useVoiceInput.ts`, do NOT reset `permissionGranted` when stopping. Also skip redundant `startAudioAnalysis` calls if permission was already granted and we're on iOS (where audio analysis is already skipped).

### Step 4: Prevent `stopAudioAnalysis` from killing media tracks on iOS

Since iOS already skips audio analysis (line in `startListening`), ensure `stopAudioAnalysis` doesn't try to close non-existent contexts. This is already mostly handled, but add a guard to prevent side effects.

### Step 5: Add resilient listening recovery

In `DirectorAI.tsx`, after TTS ends and `startListening()` is called, add a verification check 2 seconds later that confirms `isListening` is actually true. If not, retry `startListening()`. This acts as a safety net for edge cases where the browser silently drops the recognition session.

---

## Technical Details

### Files to modify:
1. **`src/pages/DirectorAI.tsx`** -- Fix `stopSpeaking`, add listening recovery check
2. **`src/hooks/useVoiceInput.ts`** -- Fix `onend` auto-restart for iOS, persist permission state

### No new dependencies or database changes needed.

