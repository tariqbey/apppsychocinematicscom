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
    default:
      return undefined;
  }
}
