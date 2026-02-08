

## Rebuild Video Player for iOS Stability

### Problem

The video player crashes on iOS when rotating to landscape because:

1. **CSS compositor crash**: The video container in TheaterView uses `rounded-lg`, `overflow-hidden`, and `aspect-video` CSS. When iOS Safari rotates, it triggers a full GPU compositor recalculation on the video layer. Clipping a hardware-decoded video surface with border-radius causes WebKit to crash.

2. **Cleanup kills the video mid-rotation**: The orientation change triggers React re-renders. The `useEffect` cleanup runs `video.removeAttribute("src"); video.load()` which destroys the active decoder pipeline. Even with the 150ms delay, this races against iOS's orientation animation.

3. **TheaterView unmount cleanup is too aggressive**: The parent `TheaterView` also queries `document.querySelectorAll('video.theater-video')` on unmount and force-destroys all video elements, which can fire during rotation-triggered re-renders.

### Solution: Complete Player Rebuild

Replace the current player with an ultra-minimal implementation that avoids all known iOS crash triggers.

**File: `src/components/theater/MindMoviePlayerSimple.tsx`** - Full rewrite

Key changes:
- **No cleanup that destroys the source**: Remove `video.removeAttribute("src"); video.load()` from the effect cleanup entirely. Let the browser garbage-collect the element naturally when the component unmounts. This prevents the orientation-change crash.
- **Orientation-aware guard**: Add a `ResizeObserver` or `orientationchange` listener that pauses event processing during rotation, preventing state thrash.
- **No CSS clipping on the video element**: The `<video>` tag itself gets zero border-radius and no overflow clipping. The parent container can style around it.
- **`webkit-playsinline` attribute**: Explicitly add the legacy WebKit attribute alongside `playsInline` for older iOS versions.
- **Simplified retry**: Keep the 2-attempt retry for network/decode errors but with a longer 1-second delay to give iOS more recovery time.

**File: `src/components/theater/TheaterView.tsx`** - Container fixes

Key changes:
- Remove `overflow-hidden` and `rounded-lg` from the video container div for ALL devices (not just iOS standalone). These CSS properties are the primary crash trigger.
- Remove the aggressive unmount cleanup that queries and destroys all `video.theater-video` elements from the DOM. Replace with a simple `playerRef.current?.pause()`.
- Remove `video.removeAttribute("src"); video.load()` from `stopAllMedia` -- just pause instead.

### Technical Detail

```text
Player changes (MindMoviePlayerSimple.tsx):
  - Remove deferred cleanup (removeAttribute src + load)
  - Add webkit-playsinline attribute
  - Keep stable refs pattern (already correct)
  - Keep auto-retry with longer delay (1s instead of 500ms)
  - Remove theater-video className (stops TheaterView DOM query from targeting it)

Container changes (TheaterView.tsx):
  - Video container: remove overflow-hidden and border-radius
  - stopAllMedia: just video.pause(), no source destruction
  - Unmount cleanup: just pause, no DOM querySelectorAll destruction
```

### Files Modified

1. `src/components/theater/MindMoviePlayerSimple.tsx` -- Rebuilt player with no aggressive cleanup
2. `src/components/theater/TheaterView.tsx` -- Safe container CSS and cleanup

