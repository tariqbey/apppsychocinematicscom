/**
 * Ava's in-app abilities: where she can take you, and what she can put on screen.
 * The backend model sees these as function tools (see
 * supabase/functions/_shared/ava-ui-tools-schema.ts); they run here in the browser.
 */

export interface AvaDestination {
  key: string;
  path: string;
  label: string;
  description: string;
}

/** Places Ava can navigate to. Keys are what the model passes to navigate_to. */
export const AVA_DESTINATIONS: AvaDestination[] = [
  { key: "home", path: "/", label: "Home / Dashboard", description: "Dashboard, daily rituals, Mind Movie studio" },
  { key: "theater", path: "/?openTheater=true", label: "The Theater", description: "Watch the Mind Movie (Theater of the Mind)" },
  { key: "mind_movie_builder", path: "/?openWizard=true", label: "Mind Movie Builder", description: "Create or edit the Mind Movie storyboard" },
  { key: "journal", path: "/?openJournal=true", label: "Journal", description: "Write a journal entry" },
  { key: "character", path: "/character", label: "Character", description: "Archetype, Self-Analysis (Law of Success test), AI character analysis, scorecard" },
  { key: "actions", path: "/actions", label: "Actions", description: "Today's tasks and action list" },
  { key: "episodes", path: "/episodes", label: "Episodes", description: "Sprints and episode movies toward the Chief Aim" },
  { key: "score", path: "/score", label: "Score", description: "Daily Director Scorecard and stats" },
  { key: "challenges", path: "/challenges", label: "Challenges", description: "Adversity challenges" },
  { key: "knowledge_graph", path: "/knowledge-graph", label: "Knowledge Graph", description: "The user's knowledge graph and everything Ava remembers" },
  { key: "blueprint", path: "/blueprint", label: "Blueprint", description: "The personal success blueprint" },
  { key: "director_ai", path: "/director-ai", label: "Director AI", description: "Full-screen voice coaching" },
  { key: "soundtrack", path: "/soundtrack", label: "Soundtrack", description: "Chief Aim anthem and soundtrack" },
  { key: "music", path: "/music", label: "Music", description: "Music library" },
  { key: "radio", path: "/radio", label: "Radio", description: "Radio stations" },
  { key: "community", path: "/community", label: "Director's Corner", description: "Community feed" },
  { key: "awards", path: "/awards", label: "Awards", description: "Awards ceremony" },
  { key: "guide", path: "/guide", label: "Director's Guide", description: "How to use the app" },
  { key: "credits", path: "/credits", label: "Credits", description: "Buy AI credits" },
  { key: "done_for_you", path: "/done-for-you", label: "Done For You", description: "Done-for-you mind movie service" },
  { key: "settings", path: "/settings", label: "Settings", description: "Account, integrations, AI preferences" },
];

export interface AvaVisual {
  title: string;
  /** Markdown-ish text: paragraphs and "- " bullets. */
  body?: string;
  imageUrl?: string;
  link?: { url: string; label: string };
}

type Json = Record<string, unknown>;

export interface AvaUiActions {
  navigate: (path: string) => void;
  currentPath: () => string;
  showVisual: (visual: AvaVisual | null) => void;
}

function safeHttpUrl(raw: unknown): string | null {
  try {
    const url = new URL(String(raw));
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Ava's own panel is never scrolled, read or tapped by her tools. */
const inAvaPanel = (el: Element) => Boolean(el.closest("[data-ava-panel]"));

function isVisible(el: Element): boolean {
  const r = (el as HTMLElement).getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

/** The thing that actually scrolls on this page: an open dialog, the window, or the biggest scroll area. */
function scrollTarget(): { el: HTMLElement | null; useWindow: boolean } {
  const dialog = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).filter((d) => !inAvaPanel(d)).pop();
  const scope: ParentNode = dialog ?? document;
  const candidates = Array.from(scope.querySelectorAll<HTMLElement>("*")).filter((el) => {
    if (inAvaPanel(el) || el.scrollHeight <= el.clientHeight + 40) return false;
    const oy = getComputedStyle(el).overflowY;
    return (oy === "auto" || oy === "scroll") && isVisible(el);
  });
  const biggest = candidates.sort((a, b) => b.clientHeight * b.clientWidth - a.clientHeight * a.clientWidth)[0] ?? null;
  const doc = document.scrollingElement as HTMLElement | null;
  const windowScrolls = !dialog && doc && doc.scrollHeight > window.innerHeight + 40;
  if (windowScrolls && (!biggest || biggest.clientHeight < window.innerHeight * 0.6)) return { el: null, useWindow: true };
  return { el: biggest, useWindow: !biggest && Boolean(windowScrolls) };
}

const BLOCKED_TAP = /\b(delete|remove|erase|destroy|cancel (my )?(plan|subscription)|unsubscribe|sign ?out|log ?out|pay|purchase|buy|checkout|subscribe)\b/i;

function tapTargets(): HTMLElement[] {
  const selector = 'button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="link"], input[type="checkbox"], [role="checkbox"], [role="switch"]';
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !inAvaPanel(el) && isVisible(el) && !(el as HTMLButtonElement).disabled,
  );
}

const labelOf = (el: HTMLElement) =>
  (el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || "").replace(/\s+/g, " ").trim().slice(0, 80);

/** Runs Ava's UI tools. Returns undefined for tools it doesn't own. */
export function runAvaUiTool(name: string, args: Json, ui: AvaUiActions): Json | undefined {
  switch (name) {
    case "navigate_to": {
      const dest = AVA_DESTINATIONS.find((d) => d.key === args.destination);
      if (!dest) return { error: `Unknown destination. Use one of: ${AVA_DESTINATIONS.map((d) => d.key).join(", ")}` };
      ui.navigate(dest.path);
      return { success: true, now_on: dest.label };
    }
    case "get_current_page": {
      const path = ui.currentPath();
      const dest = AVA_DESTINATIONS.find((d) => d.path === path);
      return { path, page: dest?.label ?? "Unknown page" };
    }
    case "open_url": {
      const url = safeHttpUrl(args.url);
      if (!url) return { error: "Only http(s) links can be opened." };
      const label = String(args.label ?? "Open link").slice(0, 80);
      // Browsers block pop-ups that don't come from a click, so always show a tap-to-open card too.
      // Note: passing "noopener" makes window.open return null even on success, so detach opener manually.
      const win = window.open(url, "_blank");
      if (win) win.opener = null;
      ui.showVisual({ title: label, body: win ? "Opened in a new tab." : "Tap to open it in a new tab.", link: { url, label } });
      return { success: true, opened_in_new_tab: Boolean(win), note: win ? undefined : "Browser blocked the pop-up; a tap-to-open card is showing." };
    }
    case "show_visual": {
      const title = String(args.title ?? "").slice(0, 120);
      if (!title) return { error: "title required" };
      const imageUrl = args.image_url ? safeHttpUrl(args.image_url) ?? undefined : undefined;
      const linkUrl = args.link_url ? safeHttpUrl(args.link_url) : null;
      ui.showVisual({
        title,
        body: args.body ? String(args.body).slice(0, 4000) : undefined,
        imageUrl,
        link: linkUrl ? { url: linkUrl, label: String(args.link_label ?? "Open") } : undefined,
      });
      return { success: true };
    }
    case "close_visual":
      ui.showVisual(null);
      return { success: true };
    case "scroll_page": {
      const direction = String(args.direction ?? "down");
      const { el, useWindow } = scrollTarget();
      if (!el && !useWindow) return { error: "Nothing on this screen scrolls." };
      const height = useWindow ? window.innerHeight : el!.clientHeight;
      const max = useWindow ? (document.scrollingElement?.scrollHeight ?? 0) : el!.scrollHeight;
      const opts: ScrollToOptions = { behavior: "smooth" };
      if (direction === "top") opts.top = 0;
      else if (direction === "bottom") opts.top = max;
      else {
        const current = useWindow ? window.scrollY : el!.scrollTop;
        opts.top = current + (direction === "up" ? -1 : 1) * height * 0.8;
      }
      if (useWindow) window.scrollTo(opts);
      else el!.scrollTo(opts);
      return { success: true, scrolled: direction };
    }
    case "read_screen": {
      const scope = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).filter((d) => !inAvaPanel(d)).pop() ?? document.body;
      const headings = Array.from(scope.querySelectorAll<HTMLElement>("h1, h2, h3, h4"))
        .filter((h) => !inAvaPanel(h) && isVisible(h))
        .map((h) => h.innerText.trim())
        .filter(Boolean)
        .slice(0, 15);
      const buttons = tapTargets().map(labelOf).filter(Boolean);
      const text = Array.from(scope.querySelectorAll<HTMLElement>("p, li, label, td, span"))
        .filter((e) => !inAvaPanel(e) && isVisible(e) && e.children.length === 0)
        .map((e) => e.innerText.trim())
        .filter((t) => t.length > 2)
        .join(" · ")
        .slice(0, 1500);
      return { page: ui.currentPath(), headings, tappable: Array.from(new Set(buttons)).slice(0, 40), visible_text: text };
    }
    case "tap": {
      const wanted = String(args.label ?? "").trim().toLowerCase();
      if (!wanted) return { error: "label required" };
      const targets = tapTargets();
      const match =
        targets.find((el) => labelOf(el).toLowerCase() === wanted) ??
        targets.find((el) => labelOf(el).toLowerCase().includes(wanted));
      if (!match) return { error: `No button or link called "${args.label}" on screen. Use read_screen to see what's tappable.` };
      const label = labelOf(match);
      if (BLOCKED_TAP.test(label)) {
        return { error: `"${label}" deletes, pays or signs out. Ask the user to tap it themselves.` };
      }
      match.scrollIntoView({ block: "center", behavior: "smooth" });
      match.click();
      return { success: true, tapped: label };
    }
    default:
      return undefined;
  }
}
