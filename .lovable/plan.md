

## Fix Video Player for iOS

### Root Cause

The video player has **two critical bugs** preventing playback on iOS:

1. **`crossOrigin="anonymous"` kills iOS video loading** - Your videos are served from public Supabase storage URLs (e.g., `https://gawcojyqqfskewuxxqhm.supabase.co/storage/v1/object/public/mind-movies/...`). Setting `crossOrigin="anonymous"` on the `<video>` tag forces iOS Safari to make a CORS preflight request. Supabase public storage doesn't always return the CORS headers iOS expects, so Safari **silently refuses to load the video**. Since these are same-origin public URLs that don't need CORS, this attribute must be removed.

2. **Unstable `useEffect` dependency array causes infinite re-renders** - The effect that sets up video event listeners depends on all the `useCallback` handlers (`handleEnded`, `handleError`, etc.). On every render cycle, these callbacks can be recreated if their own dependencies shift, which causes the effect to tear down and re-run -- destroying the video source mid-load. On desktop this is fast enough to recover; on iOS it causes the video to never finish loading.

### Fix (2 changes in 1 file)

**File: `src/components/theater/MindMoviePlayerSimple.tsx`**

1. **Remove `crossOrigin="anonymous"`** from the `<video>` tag. Public storage URLs don't need it, and it's the primary cause of iOS load failure.

2. **Stabilize the `useEffect`** by removing callback functions from the dependency array. Instead, use refs for the callbacks so the effect only re-runs when `videoSrc` or `disableSeeking` changes -- not on every render. This prevents the video element from being torn down and rebuilt while it's trying to buffer.

### Technical Detail

```text
Before (broken on iOS):
  <video crossOrigin="anonymous" ... />
  useEffect(() => { ... }, [videoSrc, handleEnded, handleError, handlePause, handlePlay, ...])

After (stable):
  <video ... />  (no crossOrigin)
  useEffect(() => { ... }, [videoSrc, disableSeeking])
  // callbacks accessed via stable refs
```

This fix applies to all surfaces using the player: Theater Mode, Movie Preview Modal, and Episode Movie Preview -- since they all import from the same component.

