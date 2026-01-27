
Goal
- Make Mind Movie playback complete reliably without kicking you out mid-way.
- Ensure audio cannot continue “off-screen” after The Theater closes.
- Prevent “two tracks at once” when re-opening The Theater.
- Improve full-screen/rotation experience (bigger video on landscape), especially in the installed app mode.

What I believe is happening (based on code + your description)
1) The Theater UI closes/reset (you see the dashboard again), but the Mind Movie’s audio keeps playing. This implies the underlying <video> pipeline is not being fully stopped when the Theater unmounts/resets (this can happen on mobile browsers/PWA when video is in a special playback state).
2) The cutoff is consistent at the same point, which strongly suggests a deterministic playback failure (Range/stream issue, codec/keyframe issue, or a player recovery path that reloads in a bad state). When it fails, the UI ends up back on the dashboard while the audio continues.
3) The app has multiple audio/video systems (global audio context + various “new Audio()” elements + video playback). The Theater currently only attempts to stop the global audio context, and even that check is conditional (only stops if globalAudio.isPlaying is true at mount time). This can let overlaps slip through.

Phase 1 — Stop runaway audio/video immediately (hard safety)
A) Add a “hard stop” path when Theater closes or unmounts
- Update src/components/theater/TheaterView.tsx:
  - Replace the current onClose usage with an internal closeTheater() that:
    1) Pauses the MindMoviePlayer video element via playerRef.current?.pause()
    2) Clears the underlying <video> source to force-stop audio on mobile:
       - video.removeAttribute("src")
       - video.load()
    3) Exits widescreen mode if active (so no fixed overlay remains)
    4) Stops any global audio (call stopAudio unconditionally, not only when isPlaying is true)
    5) Then calls the passed onClose() (which flips showTheater false)
  - Add a cleanup useEffect(() => () => closeTheater()) pattern that runs on unmount, but without re-calling onClose (so it doesn’t cause loops). This ensures if Theater disappears for any reason, audio cannot keep running.

B) Add a “hard stop” in the player itself
- Update src/components/theater/MindMoviePlayer.tsx:
  - On component unmount, explicitly:
    - pause()
    - remove src / set src to ""
    - load()
    - revoke any active Blob URL
    - abort any in-flight smooth-download fetch (AbortController)
  - This guarantees: if React removes the player, the browser media pipeline is forced to stop.

Expected outcome after Phase 1
- Even if the Theater UI unexpectedly closes/reset, the movie audio will not continue in the background.
- Re-opening the Theater will not result in two overlapping movie playbacks.

Phase 2 — Identify why Theater is “closing” mid-play (instrumentation + protection)
C) Add precise logging to pinpoint the trigger
- Update src/pages/Index.tsx and src/components/theater/TheaterView.tsx:
  - Log when showTheater flips true/false
  - Log when TheaterView unmounts
  - Log closeTheater() calls with a reason label:
    - “user_clicked_x”
    - “user_clicked_start_my_day”
    - “unmount_cleanup”
    - “pagehide/visibilitychange”
- Update src/components/theater/MindMoviePlayer.tsx:
  - Log key events with timestamps and currentTime/duration:
    - stalled, waiting, error, pause, ended (including “premature ended” branch)
  - This will show us whether the cutoff aligns with a particular event sequence (e.g., stalled → pause → ended → reload).

D) Add a defensive “don’t lose the Theater” guard (optional, but likely helpful)
- If we determine Index is remounting or showTheater is being reset indirectly:
  - Persist “theater_open=true” and “theater_opened_at” in sessionStorage when opened.
  - On Index mount, if theater_open=true and it’s recent (e.g., within last 10 minutes), automatically reopen Theater.
- This prevents the “I got kicked out and must restart” experience even if something external resets state.

Phase 3 — Fix the consistent cutoff (playback reliability)
E) Make smooth playback truly stable (no mid-play source swaps)
Right now, smooth playback can download in the background and then swap sources, which can be risky on mobile.
- Update MindMoviePlayer smooth mode rules:
  1) If smooth playback is enabled, do not switch src while the video is already playing.
  2) Prefer “download fully first, then play from Blob URL” as a single stable pipeline for the entire session.
  3) If the file is too large, do not attempt a full in-memory download; instead, stay in streaming mode and show a clear “This movie is too large for smooth mode on this device” message.

F) Enable smooth playback for Theater on Android too
- Update TheaterView to pass enableSmoothPlayback={true} to MindMoviePlayer.
- Keep an upper size cap and/or a “cancel download → stream” option so it doesn’t break large movies.

G) Improve streaming fallback recovery (when smooth mode can’t be used)
- If we detect a long stall (e.g., waiting/stalled for > N seconds or currentTime not advancing), attempt a controlled recovery:
  - save currentTime
  - video.load()
  - seek back to savedTime - small offset (e.g., -0.5s)
  - resume play
- This is more user-friendly than silently failing or “ending early”.

Phase 4 — Better “bigger video on rotation” experience
H) Allow landscape rotation in the installed app mode
- Your PWA manifest currently sets orientation: 'portrait' in vite.config.ts, which can block/limit rotation behavior in installed mode.
- Change manifest orientation from 'portrait' to 'any' (or remove the field), so rotating the phone can naturally expand the Theater.

I) Make Theater sizing more “cinema first”
- Update Theater layout to ensure the player uses the maximum usable viewport height on mobile:
  - Use dynamic viewport units (100dvh) and ensure no parent container constrains height.
  - Keep the MindMoviePlayer “widescreen overlay” as an explicit mode for maximum immersion.

Files involved (planned edits)
- src/components/theater/TheaterView.tsx
  - Unconditional globalAudio stop on mount
  - closeTheater() that force-stops video audio
  - Unmount cleanup to prevent runaway playback
  - Optional logging for close reasons
- src/components/theater/MindMoviePlayer.tsx
  - Strong unmount cleanup (pause + clear src + abort download + revoke blob)
  - Safer smooth playback rules (no mid-play src switching)
  - Stall recovery improvements
  - Additional debug logs
- src/pages/Index.tsx
  - Optional state persistence/reopen logic for theater
  - Debug logs for showTheater transitions
- vite.config.ts
  - PWA manifest orientation: change from 'portrait' to 'any' (rotation support)

How we will validate (acceptance checks)
1) Start Mind Movie → let it reach the previous “cutoff point”
   - Theater must stay open.
   - Video must continue past that point.
2) If a failure still occurs, Theater may close, but:
   - Audio must stop immediately (no off-screen audio).
3) Close Theater manually (X)
   - Audio stops immediately; no lingering playback.
4) Re-open Theater
   - No double audio; only one movie audio stream.
5) Rotate device in installed mode
   - The Theater video should expand properly in landscape.

Fallback if the cutoff persists even after player hardening
- Add an in-app “Optimize my Mind Movie for mobile” flow:
  - Encourage re-upload with “Optimize for iPhone playback” enabled (already present).
  - If needed, add clearer guidance to export in H.264 + AAC MP4 (baseline/main profile) to ensure universal stability.

Notes / risk management
- “Zero buffering forever” isn’t physically guaranteed for very large videos over unstable networks, but we can guarantee:
  - No mid-play UI kickouts
  - No runaway audio
  - Smooth-mode that pre-downloads first for small/medium videos to eliminate mid-play buffering
  - Better recovery for streaming mode when smooth-mode isn’t feasible
