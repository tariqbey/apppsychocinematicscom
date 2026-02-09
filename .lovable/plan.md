

## New Approach: Let iOS Handle the Video Natively

### The Real Problem

Every crash happens because **our custom inline player fights iOS Safari's GPU compositor** during fullscreen and rotation. No amount of CSS fixes or cleanup guards will solve this -- WebKit simply cannot handle a clipped, inline `<video>` element transitioning to landscape fullscreen without crashing the GPU process.

### The Solution: Native Handoff on iOS

Instead of trying to make our inline player survive rotation, we **hand the video to iOS's built-in native player** when the user wants to watch. Safari's native video player handles fullscreen, rotation, and hardware decoding perfectly -- it's what Apple built it for.

**How it works:**
- On **iOS devices**: Tapping play calls `video.webkitEnterFullscreen()`, which opens the video in Safari's rock-solid native fullscreen player. The user can rotate freely, and it never crashes.
- On **desktop/Android**: The inline player works exactly as it does now (no changes needed there).
- The video element stays in the DOM, so our `onended` callback still fires and records the viewing completion.

### What Changes

**File 1: `src/components/theater/MindMoviePlayerSimple.tsx`**
- Detect iOS at mount time
- On iOS: remove `playsInline` attribute so the native player can take over
- Add a `webkitEnterFullscreen()` call when play is triggered on iOS
- Keep all existing event listeners (ended, error, etc.) -- they still fire even when the native player is active
- Remove the orientation guard (no longer needed since iOS handles rotation natively)

**File 2: `src/components/theater/TheaterView.tsx`**
- Remove the `isIOSStandalone` conditional CSS logic (no longer relevant)
- Keep the safe `pause()` cleanup (already correct)

### Technical Detail

```text
iOS flow:
  User taps Play --> video.webkitEnterFullscreen()
  --> iOS native player opens (handles rotation natively)
  --> User watches, rotates freely, no crash
  --> Video ends --> "ended" event fires on our <video> element
  --> onComplete callback records viewing

Desktop/Android flow:
  Unchanged -- inline player with controls, works as before

Key API: HTMLVideoElement.webkitEnterFullscreen()
  - Safari-only API, perfect for this use case
  - Hands rendering to the native video layer
  - All DOM events (ended, error, timeupdate) still fire
  - No CSS compositor involvement = no crash
```

### Files Modified

1. `src/components/theater/MindMoviePlayerSimple.tsx` -- iOS native fullscreen handoff
2. `src/components/theater/TheaterView.tsx` -- Remove iOS-specific CSS workarounds

