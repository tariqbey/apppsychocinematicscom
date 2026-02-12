

## Fix: Lock Down Dashboard Layout and Force PWA Cache Refresh

### Problem
The dashboard layout code (countdown, streak, rituals) is currently correct in the source code. The likely reason it appears missing on your device is the **PWA service worker caching an old version** of the app. Every time code changes are made, the PWA may serve a stale cached build that doesn't include the latest updates.

### Solution (3 parts)

**1. Force PWA cache bust (sw.js)**
- Update the service worker to use a versioned cache key so old caches are automatically cleared when new builds deploy
- This prevents the "old version still showing" problem permanently

**2. Add a layout integrity safeguard (Index.tsx)**
- Add a `key` prop tied to a layout version constant so React fully re-mounts the dashboard section if the layout structure changes
- Add defensive console logging in dev mode so layout issues are immediately visible

**3. Verify all components render correctly**
- Confirm `ChiefAimCountdown` handles empty `byWhen` gracefully (already does)
- Confirm `StreakBanner` renders in all states (already does)
- Confirm `DailyRitualChecklist` collapsible works (already does)
- No actual layout code changes needed -- the hierarchy is correct

### Files Modified

1. **`public/sw.js`** -- Update cache version and add cache-busting logic to force old PWA installs to pull fresh content
2. **`src/pages/Index.tsx`** -- Add layout version constant and key prop for bulletproof re-mounting; no layout order changes needed since the order is already correct

### What You Should Do After This Deploys
- On your phone/device, close the app completely and reopen it
- If using iOS PWA: delete the home screen shortcut and re-add it
- The PWA update prompt should also trigger automatically

