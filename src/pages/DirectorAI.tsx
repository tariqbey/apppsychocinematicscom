import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import VoiceCoach from "@/components/director-ai/VoiceCoach";
import GptLiveCoach from "@/components/director-ai/GptLiveCoach";
import { GPT_LIVE_VOICES } from "@/lib/gptLive";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type VoiceEngine = "gpt-live" | "gemini";

function readPref(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preferences are a convenience only.
  }
}
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DirectorAI() {
  useDocumentTitle("Director AI | Live Voice Coach");
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [thinkingLevel, setThinkingLevel] = useState<"low" | "medium">("low");
  const [engine, setEngine] = useState<VoiceEngine>(() => (readPref("director-ai-engine", "gpt-live") === "gemini" ? "gemini" : "gpt-live"));
  const [voice, setVoice] = useState<string>(() => readPref("director-ai-gpt-live-voice", "cedar"));
  const [avatarOn, setAvatarOn] = useState<boolean>(() => readPref("director-ai-avatar", "on") === "on");
  const [searchParams] = useSearchParams();

  const context = searchParams.get("context"); // e.g. "post-screening"
  const autoStart = searchParams.get("autostart") === "1" || context === "post-screening";

  const openingPrompt = useMemo(() => {
    if (context !== "post-screening") return undefined;
    const hour = new Date().getHours();
    const isEvening = hour >= 17 || hour < 4;
    if (isEvening) {
      return "The user just finished their EVENING Mind Movie screening. Greet them warmly by name like a real coach (e.g. 'Yo, what's up — ready to close this day out strong?'). Then immediately review the day with them: ask what they actually executed on, what they journaled about, and whether they hit or ducked their three things. If they bullshitted, call it out with love. End by asking them what tomorrow's win looks like — and if they give you one, SUGGEST_TASK it.";
    }
    return "The user just finished their MORNING Mind Movie screening. Greet them warmly by name like a real coach (e.g. 'What's up — you ready to go?'). Then immediately help them lock in their three priority actions for the day, anchored to their Definite Chief Aim. Ask what they're already planning. If they're stuck or vague, propose concrete next moves and use SUGGEST_TASK so they can one-tap-add them.";
  }, [context]);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/80 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gold tracking-wide">DIRECTOR AI</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Live Voice Coach · {engine === "gpt-live" ? "GPT-Live" : "Gemini Live"}
            </p>
          </div>
          <div className="w-16" />
        </div>

        {/* Engine, voice and thinking level */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <Tabs
            value={engine}
            onValueChange={(v) => {
              setEngine(v as VoiceEngine);
              writePref("director-ai-engine", v);
            }}
          >
            <TabsList className="bg-card/40 border border-gold/20">
              <TabsTrigger value="gpt-live" className="text-xs data-[state=active]:bg-gold data-[state=active]:text-black">
                GPT-Live
              </TabsTrigger>
              <TabsTrigger value="gemini" className="text-xs data-[state=active]:bg-gold data-[state=active]:text-black">
                Gemini
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {engine === "gpt-live" && !avatarOn && (
            <Select
              value={voice}
              onValueChange={(v) => {
                setVoice(v);
                writePref("director-ai-gpt-live-voice", v);
              }}
            >
              <SelectTrigger className="h-9 w-32 text-xs bg-card/40 border-gold/20" aria-label="Voice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GPT_LIVE_VOICES.map((v) => (
                  <SelectItem key={v} value={v} className="text-xs capitalize">
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {engine === "gpt-live" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = !avatarOn;
                setAvatarOn(next);
                writePref("director-ai-avatar", next ? "on" : "off");
              }}
              className={`h-9 text-xs border-gold/20 ${avatarOn ? "bg-gold text-black hover:bg-gold/90" : "bg-card/40"}`}
              aria-pressed={avatarOn}
            >
              {avatarOn ? "Avatar on" : "Avatar off"}
            </Button>
          )}
          <Tabs value={thinkingLevel} onValueChange={(v) => setThinkingLevel(v as "low" | "medium")}>
            <TabsList className="bg-card/40 border border-gold/20">
              <TabsTrigger value="low" className="text-xs data-[state=active]:bg-gold data-[state=active]:text-black">
                <Zap className="w-3 h-3 mr-1" /> Fast
              </TabsTrigger>
              <TabsTrigger value="medium" className="text-xs data-[state=active]:bg-gold data-[state=active]:text-black">
                <Brain className="w-3 h-3 mr-1" /> Deep
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Voice coach */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {engine === "gpt-live" ? (
            <GptLiveCoach
              key={`${voice}-${avatarOn}`}
              thinkingLevel={thinkingLevel}
              openingPrompt={openingPrompt}
              autoStart={autoStart}
              // The avatar is Ava, so she always speaks in Ava's voice.
              voice={avatarOn ? "marin" : voice}
              avatar={avatarOn}
            />
          ) : (
            <VoiceCoach thinkingLevel={thinkingLevel} openingPrompt={openingPrompt} autoStart={autoStart} />
          )}
        </div>

        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/60 mt-6">
          Real-time conversation · Mic stays open until you end the session
        </p>
      </div>
    </div>
  );
}
