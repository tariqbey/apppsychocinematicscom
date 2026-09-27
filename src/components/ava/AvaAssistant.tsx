import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Mic, MicOff, Minimize2, PhoneOff, Sparkles, X } from "lucide-react";
import { JarvisOrb } from "@/components/director-ai/JarvisOrb";
import { useGptLiveSession } from "@/hooks/useGptLiveSession";
import { AVA_DESTINATIONS, runAvaUiTool, type AvaVisual } from "@/lib/ava/uiTools";

/**
 * Ava: the in-app assistant. A floating button on every page opens a live video
 * avatar (Anam, lip-synced to the GPT-Live voice). She talks with the user, coaches,
 * and operates the app: navigating, opening websites, showing visuals, and managing
 * tasks and notes. The session lives here at the app root, so it keeps going while
 * she moves you between pages.
 */

const AVATAR_VIDEO_ID = "ava-avatar-video";
const HIDDEN_ON = ["/signup", "/reset-password"];

function readPref(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function VisualCard({ visual, onClose }: { visual: AvaVisual; onClose: () => void }) {
  const lines = (visual.body ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className="relative rounded-xl border border-gold/25 bg-background/95 p-4 shadow-xl animate-fade-in">
      <button onClick={onClose} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" aria-label="Close card">
        <X className="w-4 h-4" />
      </button>
      <p className="pr-6 font-display text-base text-gold">{visual.title}</p>
      {visual.imageUrl && (
        <img src={visual.imageUrl} alt={visual.title} className="mt-3 w-full rounded-lg object-cover max-h-56" />
      )}
      {lines.length > 0 && (
        <div className="mt-2 space-y-1 text-sm text-foreground/90 max-h-56 overflow-y-auto">
          {lines.map((line, i) =>
            line.startsWith("- ") || line.startsWith("• ") ? (
              <p key={i} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gold">
                {line.slice(2)}
              </p>
            ) : (
              <p key={i}>{line}</p>
            ),
          )}
        </div>
      )}
      {visual.link && (
        <a
          href={visual.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-xs font-medium text-black hover:bg-gold/90"
        >
          {visual.link.label} <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

export function AvaAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [visual, setVisual] = useState<AvaVisual | null>(null);
  const locationRef = useRef(location);
  locationRef.current = location;

  const currentPath = useCallback(() => {
    const loc = locationRef.current;
    return `${loc.pathname}${loc.search}`;
  }, []);

  const pageLabel = useCallback((path: string) => {
    const pathname = path.split("?")[0];
    return AVA_DESTINATIONS.find((d) => d.path === pathname)?.label ?? pathname;
  }, []);

  const live = useGptLiveSession({
    persona: "ava",
    voice: readPref("ava-voice", "marin"),
    avatarVideoId: readPref("ava-avatar", "on") === "on" ? AVATAR_VIDEO_ID : undefined,
    extraContext: () => ({ currentPage: pageLabel(currentPath()) }),
    onExtraTool: (name, args) =>
      runAvaUiTool(name, args, {
        navigate: (path) => navigate(path),
        currentPath,
        showVisual: setVisual,
      }),
  });
  const { status, active, error, muted, transcript, micLevel, avatarLive, audioElRef, start, stop, toggleMute, addSilentContext, user } = live;

  // Keep Ava aware of where the user is when they move around on their own.
  const lastPathRef = useRef(location.pathname);
  useEffect(() => {
    if (!active || location.pathname === lastPathRef.current) return;
    lastPathRef.current = location.pathname;
    addSilentContext(`The user is now on the ${pageLabel(location.pathname)} page.`);
  }, [active, addSilentContext, location.pathname, pageLabel]);

  // Start after the panel (and its <video> element) has rendered.
  const [pendingStart, setPendingStart] = useState(false);
  useEffect(() => {
    if (open && pendingStart) {
      setPendingStart(false);
      if (!active) void start();
    }
  }, [active, open, pendingStart, start]);

  const openAndStart = () => {
    setOpen(true);
    setMinimized(false);
    setPendingStart(true);
  };

  const end = () => {
    stop();
    setVisual(null);
    setOpen(false);
    setMinimized(false);
  };

  if (!user || HIDDEN_ON.includes(location.pathname)) return null;

  const orbState =
    status === "speaking" ? "speaking" : status === "thinking" || status === "connecting" ? "processing" : status === "listening" ? "listening" : "idle";
  const lastLine = transcript[transcript.length - 1];

  return (
    <>
      <audio ref={audioElRef} autoPlay className="hidden" />

      {/* Launcher */}
      {!open && (
        <button
          onClick={openAndStart}
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-[60] flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-amber-500 pl-3 pr-4 py-2.5 text-black shadow-lg shadow-gold/30 hover:scale-105 transition-transform"
          aria-label="Talk to Ava"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">Ava</span>
        </button>
      )}

      {/* Panel (kept mounted while open so the session and video survive navigation) */}
      {open && (
        <div
          className={
            minimized
              ? "fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-[60]"
              : "fixed inset-x-2 bottom-2 sm:inset-x-auto sm:right-6 sm:bottom-6 z-[60] sm:w-[380px]"
          }
        >
          <div
            className={
              minimized
                ? "relative h-20 w-20 overflow-hidden rounded-full border-2 border-gold shadow-lg shadow-gold/30 cursor-pointer"
                : "relative overflow-hidden rounded-2xl border border-gold/30 bg-card/95 backdrop-blur shadow-2xl shadow-black/50"
            }
            onClick={minimized ? () => setMinimized(false) : undefined}
          >
            {/* Avatar */}
            <div className={minimized ? "absolute inset-0" : "relative aspect-[4/5] sm:aspect-[4/5] max-h-[46vh] w-full bg-black"}>
              <video id={AVATAR_VIDEO_ID} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
              {!avatarLive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-cinematic-midnight to-black">
                  <div className={minimized ? "scale-[0.35]" : "scale-75"}>
                    <JarvisOrb state={orbState} audioLevel={status === "speaking" ? 0.6 : muted ? 0 : micLevel} />
                  </div>
                </div>
              )}
              {!minimized && (
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                  <span className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] uppercase tracking-widest text-gold">
                    Ava ·{" "}
                    {status === "connecting"
                      ? "connecting"
                      : status === "thinking"
                        ? "working"
                        : status === "speaking"
                          ? "speaking"
                          : status === "listening"
                            ? muted
                              ? "muted"
                              : "listening"
                            : status}
                  </span>
                  <button
                    onClick={() => setMinimized(true)}
                    className="rounded-full bg-black/50 p-1.5 text-white/80 hover:text-white"
                    aria-label="Minimize Ava"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {!minimized && (
              <div className="space-y-3 p-3">
                {visual && <VisualCard visual={visual} onClose={() => setVisual(null)} />}

                {lastLine && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    <span className={lastLine.role === "user" ? "mr-1 uppercase" : "mr-1 uppercase text-gold/80"}>
                      {lastLine.role === "user" ? "You:" : "Ava:"}
                    </span>
                    {lastLine.text}
                  </p>
                )}
                {error && <p className="text-xs text-red-300">{error}</p>}

                <div className="flex items-center justify-center gap-2">
                  {active ? (
                    <>
                      <Button variant="outline" size="icon" onClick={toggleMute} className="rounded-full h-11 w-11" aria-label={muted ? "Unmute" : "Mute"}>
                        {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </Button>
                      <Button variant="destructive" onClick={end} className="gap-2 rounded-full px-5">
                        {status === "connecting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4" />}
                        End
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="gold" onClick={() => void start()} className="gap-2 rounded-full px-5">
                        <Sparkles className="w-4 h-4" /> Talk to Ava
                      </Button>
                      <Button variant="ghost" size="icon" onClick={end} className="rounded-full" aria-label="Close Ava">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
