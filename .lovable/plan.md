

## Fix: Journal Entry Crash on Mobile

### Root Cause

The DirectorsJournal component is always mounted inside `Index.tsx` (line 742), even when closed. While it returns `null` when not open, its parent page (`Index.tsx`) keeps **all dashboard hooks and heavy components** alive underneath the journal overlay. On mobile devices (especially iOS PWA), this creates significant memory pressure. Every keystroke in the journal Textarea triggers a React re-render of the journal component, and combined with the heavyweight dashboard underneath, this can exceed the WebKit process memory limit and crash the app.

### Fix Strategy

**1. Lazy-mount the journal (Index.tsx)**
- Change `<DirectorsJournal isOpen={showJournal} .../>` to `{showJournal && <DirectorsJournal .../>}` so it only mounts when actually open, matching how TheaterView and EditBay are already handled
- This ensures the component fully unmounts when closed, freeing memory

**2. Add an error boundary around the journal (new: JournalErrorBoundary)**
- Wrap the journal in a React error boundary so that if it does crash, it catches the error gracefully instead of taking down the whole app
- Show a "Something went wrong" card with a retry button

**3. Optimize the Textarea input (DirectorsJournal.tsx)**
- Use `useRef` for the textarea value during active typing instead of calling `setContent()` on every keystroke
- Only sync to React state on blur or submit, reducing re-renders from potentially hundreds (while typing) to just one
- This dramatically reduces the render load on mobile

### Files Modified

1. **`src/pages/Index.tsx`** -- Conditional render for journal (1-line change)
2. **`src/components/journal/DirectorsJournal.tsx`** -- Optimize textarea to use ref-based input, reduce re-renders; add error boundary wrapper
