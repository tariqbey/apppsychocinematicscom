

# Comprehensive Episodes Enhancement & Home Page Declutter Plan

This plan addresses multiple interconnected requests to enhance the Episodes module, simplify the Home page, and add new features.

---

## Overview

The changes fall into 4 main categories:

1. **Theater View Enhancement** - Add episode movie playback option alongside Mind Movie
2. **Episodes Module Enhancements** - Consolidate episode-related features, add delete capability, upload bypass
3. **Home Page Declutter** - Create "Psycho Cinematic Movie Studio" module, move features, add countdown clock
4. **Episode Script-to-Song Conversion** - Add ability to convert episode objectives to rap/songs

---

## Section 1: Theater View - Episode Movies

**Location:** `src/components/theater/TheaterView.tsx`

### Changes:
- Add a selector/toggle to switch between "Mind Movie" and "Episode Movies"
- Fetch user's active episode(s) with linked movies
- Allow watching individual episode movies from the Theater
- Create "Episode Playlist" mode to cycle through all episode movies

```text
+--------------------------------------------------+
|  THE THEATER                                      |
|  +------------+  +--------------------+           |
|  | Mind Movie |  | Episode Movies [v] |           |
|  +------------+  +--------------------+           |
|                                                   |
|     [  Video Player Area  ]                       |
|                                                   |
|  Episode: "Launch MVP"    3/5 movies              |
+--------------------------------------------------+
```

---

## Section 2: Episodes Module Consolidation

### 2.1 Move Episode Character Dashboard to Episodes

**From:** `src/pages/Index.tsx` (lines 565-568)  
**To:** `src/components/episodes/EpisodeDetailView.tsx`

- Remove `EpisodeCharacterDashboard` rendering from Index.tsx
- Add it to the EpisodeDetailView for comprehensive episode management

### 2.2 Move Challenges & Adversity into Episodes

**Current:** Standalone page at `/challenges` with ModuleCard on Index.tsx  
**New:** Accessed through Episodes as a tab or section

Changes to `src/pages/Episodes.tsx`:
- Add a new tab: "Challenges" alongside "All Episodes" and "Timeline"
- Embed the Challenges components within Episodes

### 2.3 Enable Episode Deletion for All Episodes

**File:** `src/components/episodes/EpisodeCard.tsx`

Currently, the delete button is only shown when expanded and episode status is not "abandoned". Update to:
- Always show delete button for all episode statuses (active, completed, paused, abandoned)
- Add confirmation dialog for safety

### 2.4 Direct Movie Upload Option in Production Dashboard

**File:** `src/components/episodes/EpisodeProductionDashboard.tsx`

Add "Upload My Movie" button at the top of the production workflow:
- Bypasses the Script > Visuals > Edit > Animate > Export flow
- Directly uploads and links a video file to the episode
- Marks production as complete once uploaded

```text
Production Steps:
[ Upload My Movie - Skip Production ]  <-- NEW
      |
1. Episode Created ✓
2. Mind Movie Script
3. Generate Visuals
4. Edit & Animate
5. Export & Watch
```

---

## Section 3: Home Page Declutter

### 3.1 Create "Psycho Cinematic Movie Studio" Module

**File:** `src/pages/Index.tsx`

Bundle these existing modules under one unified entry point:

| Current Separate Cards | New Location |
|------------------------|--------------|
| The Edit Bay | Inside Studio |
| Mind Movie Vault | Inside Studio |
| Soundtrack Studio | Inside Studio |
| Storyboard | Inside Studio |

Create new component: `src/components/dashboard/MovieStudioModule.tsx`
- Single card on home page: "Psycho Cinematic Movie Studio"
- When clicked, opens a panel/modal with 4 sub-modules organized logically

**Logical Organization (User Flow):**
1. **Storyboard** - Plan your vision (first step)
2. **The Edit Bay** - Generate images & videos (creation)
3. **Soundtrack Studio** - Add music (enhancement)
4. **Mind Movie Vault** - Store & manage (organization)

### 3.2 Hide Definite Chief Aim Script Section

**Current:** Full `DefiniteChiefAimCard` with all 4 sections displayed prominently
**New:** Move the detailed script into a collapsible/modal view

- Keep a minimal "Definite Chief Aim" summary card on the home page
- Add "View Full Script" button that opens the detailed view
- Move detailed script content (What I Want, By When, Exchange, Plan) into a modal or dedicated page

### 3.3 Make Script Review Section Clickable

When user clicks on the Script Review ritual item in `DailyRitualChecklist`, it should:
- Open the full Definite Chief Aim script view (the one we're hiding above)
- Allow reading the full script and marking the ritual complete

### 3.4 Add Definite Chief Aim Countdown Clock

**File:** `src/pages/Index.tsx` or new component

Add a prominent countdown clock to the "BY WHEN" date from the user's Chief Aim:

```text
+------------------------------------------+
|  ⭐ FINAL SCENE COUNTDOWN               |
|                                          |
|   127 DAYS  :  14 HRS  :  32 MIN        |
|   ═══════════════════════════════════   |
|   Until December 31, 2026               |
|                                          |
|   "Launch to 100K Subscribers"          |
+------------------------------------------+
```

New component: `src/components/dashboard/ChiefAimCountdown.tsx`
- Calculate days/hours/minutes until `profile.chief_aim_by_when`
- Show motivational text with the goal summary
- Animate on home page for visual impact

---

## Section 4: Episode Script-to-Song Conversion

### 4.1 Add "Convert to Song" for Episode Objectives

**Location:** Add to `EpisodeDetailView.tsx` and/or `EpisodeRitualSection.tsx`

Similar to how the Definite Chief Aim can be converted to a rap/song:
- Add button: "Create Episode Anthem"
- Pass episode objective/title to Soundtrack Studio
- Store the generated song URL on the episode or as a linked track

```text
Episode: "Launch MVP Sprint"
Objective: "Ship the core product to 100 beta testers..."

[ Create Episode Anthem 🎵 ]  <-- NEW
```

Implementation:
- Navigate to `/soundtrack?fromEpisode=true`
- Pass episode context via sessionStorage (similar to chief aim flow)
- Return and link the song to the episode

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/MovieStudioModule.tsx` | New consolidated studio entry point |
| `src/components/dashboard/ChiefAimCountdown.tsx` | Countdown clock component |
| `src/components/theater/EpisodeMovieSelector.tsx` | Episode movie selection in Theater |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Remove individual studio cards, add MovieStudioModule, add countdown, remove EpisodeCharacterDashboard |
| `src/components/theater/TheaterView.tsx` | Add episode movie playback toggle/selector |
| `src/components/episodes/EpisodeDetailView.tsx` | Add EpisodeCharacterDashboard, add song conversion button |
| `src/components/episodes/EpisodeCard.tsx` | Enable delete for all statuses |
| `src/components/episodes/EpisodeProductionDashboard.tsx` | Add "Upload My Movie" bypass option |
| `src/pages/Episodes.tsx` | Add Challenges tab, integrate challenge components |
| `src/components/dashboard/DefiniteChiefAimCard.tsx` | Simplify to summary view, add modal for full script |
| `src/components/dashboard/DailyRitualChecklist.tsx` | Make Script Review clickable to open full script |

---

## Technical Notes

### Episode Movies in Theater
- Query `episodes` table joined with `mind_movie_scripts` to get movie URLs
- Support both single-episode view and playlist mode
- Track viewing progress per episode (similar to main Mind Movie)

### Countdown Clock
- Parse `profile.chief_aim_by_when` (format: "December 31, 2026" or similar)
- Use `date-fns` for calculations
- Update every minute for accuracy

### Movie Studio Module
- Use a Dialog/Sheet component for the sub-module selection
- Maintain current navigation patterns (e.g., Soundtrack navigates to `/soundtrack`)
- Keep individual components unchanged, just reorganize entry points

