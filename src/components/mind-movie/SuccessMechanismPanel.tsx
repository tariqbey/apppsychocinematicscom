import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Brain, ChevronDown, Plus, Trophy, Unlock, Swords, Gauge, HeartHandshake } from "lucide-react";
import { FAILURE_SYMPTOMS, type PsychoCyberneticsInputs } from "@/lib/psychoCybernetics";

interface SuccessMechanismPanelProps {
  value: PsychoCyberneticsInputs;
  onChange: (value: PsychoCyberneticsInputs) => void;
}

/**
 * Collects the Psycho-Cybernetics inputs that turn a mind movie into a target
 * for the success mechanism: past wins, a belief to dehypnotize, a situation to
 * shadow-box, the failure symptom to correct, and an old hurt to release.
 */
export function SuccessMechanismPanel({ value, onChange }: SuccessMechanismPanelProps) {
  const [open, setOpen] = useState(true);
  const set = <K extends keyof PsychoCyberneticsInputs>(k: K, v: PsychoCyberneticsInputs[K]) => onChange({ ...value, [k]: v });

  const filled =
    value.successMemories.filter((m) => m.trim()).length +
    [value.limitingBelief, value.rehearsalSituation, value.failureSymptom, value.scarToRelease].filter((v) => v.trim()).length;

  return (
    <Card className="border-sky-500/30 bg-gradient-to-br from-sky-500/5 via-background to-gold/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="w-10 h-10 rounded-full bg-sky-500/15 flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-sky-300" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Program Your Success Mechanism</h3>
          <p className="text-sm text-muted-foreground">
            Psycho-Cybernetics: your nervous system can't tell a vividly imagined experience from a real one. These
            answers become specific scenes: a real past win to relive, an old belief to break, and a moment to rehearse.
          </p>
          <p className="text-xs text-sky-300/80 mt-1">{filled} filled · all optional, but each one adds a scene</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <CardContent className="space-y-5 pt-0">
          {/* Winning Feeling */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="w-4 h-4 text-amber-300" /> Winning Feeling: real wins you've already had
            </Label>
            <p className="text-xs text-muted-foreground">
              Be specific: where you were, what happened, how it felt. These become Success Replay scenes that call up
              the feeling of winning on demand.
            </p>
            {value.successMemories.map((m, i) => (
              <Input
                key={i}
                value={m}
                placeholder={
                  i === 0
                    ? "e.g. Closing my first $10K client in their office, the handshake, walking out to my car grinning"
                    : "Another win (big or small)"
                }
                onChange={(e) => {
                  const next = [...value.successMemories];
                  next[i] = e.target.value;
                  set("successMemories", next);
                }}
              />
            ))}
            {value.successMemories.length < 3 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => set("successMemories", [...value.successMemories, ""])}
              >
                <Plus className="w-3 h-3" /> Add another win
              </Button>
            )}
          </div>

          {/* Dehypnotize */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Unlock className="w-4 h-4 text-violet-300" /> Dehypnotize: an old belief that's been running you
            </Label>
            <Input
              value={value.limitingBelief}
              placeholder={'e.g. "People like me don\'t get paid that kind of money"'}
              onChange={(e) => set("limitingBelief", e.target.value)}
            />
            <Input
              value={value.truthStatement}
              placeholder="What's actually true? e.g. I've already delivered results clients pay premium prices for"
              onChange={(e) => set("truthStatement", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Ask yourself: is this belief based on fact, or on a conclusion I drew?</p>
          </div>

          {/* Shadow-box */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Swords className="w-4 h-4 text-emerald-300" /> Shadow-Box: a situation coming up that you want to nail
            </Label>
            <Textarea
              rows={2}
              value={value.rehearsalSituation}
              placeholder="e.g. Pitching my project to the investor panel next Thursday"
              onChange={(e) => set("rehearsalSituation", e.target.value)}
            />
          </div>

          {/* Failure mechanism */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Gauge className="w-4 h-4 text-orange-300" /> Which failure signal shows up most for you?
            </Label>
            <div className="flex flex-wrap gap-2">
              {FAILURE_SYMPTOMS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => set("failureSymptom", value.failureSymptom === s.key ? "" : s.key)}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
                    value.failureSymptom === s.key
                      ? "border-orange-400 bg-orange-500/15 text-orange-200"
                      : "border-border/60 text-muted-foreground hover:border-orange-400/50"
                  }`}
                >
                  <span className="font-bold mr-1">{s.letter}</span>
                  {s.name}
                </button>
              ))}
            </div>
            {value.failureSymptom && (
              <p className="text-xs text-muted-foreground">
                Correction: {FAILURE_SYMPTOMS.find((s) => s.key === value.failureSymptom)?.correction} It becomes a Course
                Correction scene.
              </p>
            )}
          </div>

          {/* Scar release */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <HeartHandshake className="w-4 h-4 text-rose-300" /> Scar Release: an old hurt to forgive (optional)
            </Label>
            <Input
              value={value.scarToRelease}
              placeholder="Someone else, or yourself: mistakes are things you did, not who you are"
              onChange={(e) => set("scarToRelease", e.target.value)}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
