

# Fix Plan: Audio Playback Issues (Choppy, Double-Playing, Orphaned Audio)

## Problem Summary

Your music/audio system has multiple independent audio players that don't communicate with each other. When you:
1. Play music on the home page (Director Radio card)
2. Then open the Theater for your Mind Movie
3. Or navigate to another page with music

...the original audio keeps playing in the background because nothing tells it to stop. This causes:
- **Two tracks playing at once** (audio collision)
- **Audio continuing off-screen** when you close dialogs/navigate
- **Choppy playback** from multiple audio streams competing for resources

---

## Solution: Centralized Audio Manager

I'll create a **single, global audio manager** that ensures only one audio source plays at a time across the entire app. When any component wants to play audio, it will:
1. Register with the global manager
2. Automatically pause any other playing audio
3. Properly clean up when unmounted

---

## Technical Implementation

### Step 1: Create a Global Audio Context

Create a new context provider that manages a single audio instance:

**File**: `src/contexts/AudioContext.tsx`

```text
Purpose:
- Holds a single HTMLAudioElement instance
- Provides play/pause/stop methods
- Tracks which component "owns" the current playback
- Exposes state (isPlaying, currentTrack, currentTime, etc.)
- Automatically stops previous audio when a new source starts
```

Key features:
- `playAudio(source, metadata)` - stops any current audio and plays new source
- `pauseAudio()` - pauses current audio
- `stopAudio()` - stops and resets
- `audioOwner` - tracks which component is currently playing
- When component unmounts, if it "owns" the audio, audio stops

### Step 2: Update App.tsx to Wrap with AudioProvider

Wrap the entire app with the new `AudioProvider` so all components share the same audio state.

### Step 3: Refactor Each Audio Component

Update these components to use the global audio context instead of creating their own `new Audio()`:

| Component | Current Behavior | New Behavior |
|-----------|------------------|--------------|
| `DirectorRadioCard.tsx` | Creates own Audio | Uses global context |
| `useRadio.ts` | Creates own Audio | Uses global context |
| `Score.tsx` | Creates own Audio | Uses global context |
| `Radio.tsx` | Creates own Audio | Uses global context |
| `DefiniteChiefAimCard.tsx` | Creates own Audio | Uses global context |
| `ChallengeSoundtrackGenerator.tsx` | Creates own Audio | Uses global context |
| `SoundtrackPlayer.tsx` | Uses `<audio>` element | Uses global context |

For each component:
1. Remove local `audioRef` and `new Audio()` creation
2. Import and use `useAudio()` hook from context
3. Call `playAudio()` instead of creating local audio
4. Cleanup functions become unnecessary (context handles it)

### Step 4: Auto-Pause When Opening Theater

When the `TheaterView` opens:
1. Call `stopAudio()` from the global context
2. This immediately silences any music that was playing
3. The video can play without audio collision

### Step 5: Fix Console Warnings (Secondary)

Fix the `forwardRef` warnings in:
- `Badge` component usage in `FeaturedArtistBanner.tsx`
- `Tooltip` component usage in `Header.tsx`

These cause unnecessary re-renders that can contribute to audio restarts.

---

## Component-Specific Changes

### DirectorRadioCard.tsx
- Remove local `audioRef` state
- Use `const { playAudio, pauseAudio, isPlaying, currentTrack } = useAudio()`
- The toggle button calls `playAudio(trackUrl, { title, artist, owner: 'radio-card' })`

### DefiniteChiefAimCard.tsx
- Remove local `audioRef` and `isPlaying` state
- Use global context
- Before playing anthem: `stopAudio()` then `playAudio(chiefAimSongUrl, ...)`

### TheaterView.tsx
- On mount: call `stopAudio()` to silence any background music
- On unmount: no action needed (video uses `<video>` element, not audio context)

### Score.tsx and Radio.tsx
- These full pages will "take ownership" of the audio context
- When user navigates away, audio automatically stops

---

## User Experience After Fix

1. **Single Source**: Only one audio/video source plays at a time
2. **Clean Transitions**: Opening Theater automatically stops music
3. **No Orphaned Audio**: Navigating away from a page stops its audio
4. **Visible Control**: The play/pause button always reflects actual playback state
5. **Background Playback**: Media Session API still works for lock-screen controls

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/AudioContext.tsx` | Global audio manager context |
| `src/hooks/useGlobalAudio.ts` | Hook wrapper for the context |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Wrap with AudioProvider |
| `src/components/radio/DirectorRadioCard.tsx` | Use global audio |
| `src/components/dashboard/DefiniteChiefAimCard.tsx` | Use global audio |
| `src/components/theater/TheaterView.tsx` | Stop audio on mount |
| `src/pages/Radio.tsx` | Use global audio |
| `src/pages/Score.tsx` | Use global audio |
| `src/hooks/useRadio.ts` | Use global audio |
| `src/components/mind-movie/SoundtrackPlayer.tsx` | Use global audio |
| `src/components/challenges/ChallengeSoundtrackGenerator.tsx` | Use global audio |
| `src/components/dashboard/FeaturedArtistBanner.tsx` | Fix Badge ref warning |
| `src/components/layout/Header.tsx` | Fix Tooltip ref warning |

---

## Estimated Scope

- **New files**: 2
- **Modified files**: 11
- **Complexity**: Medium-High (touches core audio infrastructure)
- **Risk**: Low-Medium (audio still works if context fails, just falls back to current behavior)

