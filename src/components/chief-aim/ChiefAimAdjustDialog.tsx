import { useState } from "react";
import { Wand2, Loader2, X, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ChiefAimData {
  what: string;
  byWhen: string;
  exchange: string;
  plan: string;
}

interface ChiefAimAdjustDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentAim: ChiefAimData;
  onSave: (aim: ChiefAimData) => Promise<void>;
}

export const ChiefAimAdjustDialog = ({
  isOpen,
  onClose,
  currentAim,
  onSave,
}: ChiefAimAdjustDialogProps) => {
  const [adjustmentRequest, setAdjustmentRequest] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [adjustedAim, setAdjustedAim] = useState<ChiefAimData | null>(null);
  const [summary, setSummary] = useState("");

  const handleAdjust = async () => {
    if (!adjustmentRequest.trim()) {
      toast.error("Please describe what adjustment you want to make.");
      return;
    }

    setIsAdjusting(true);
    try {
      const { data, error } = await supabase.functions.invoke("adjust-chief-aim", {
        body: {
          currentAim,
          adjustmentRequest: adjustmentRequest.trim(),
        },
      });

      if (error) throw error;

      if (data?.adjustedAim) {
        setAdjustedAim(data.adjustedAim);
        setSummary(data.adjustedAim.summary || "");
        toast.success("AI has adjusted your Chief Aim!");
      }
    } catch (err: any) {
      console.error("Adjust error:", err);
      if (err?.message?.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please wait a moment.");
      } else if (err?.message?.includes("Credits")) {
        toast.error("Credits exhausted. Please add more credits.");
      } else {
        toast.error(err?.message || "Failed to adjust. Please try again.");
      }
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleSave = async () => {
    if (!adjustedAim) return;

    setIsSaving(true);
    try {
      await onSave(adjustedAim);
      toast.success("Your adjusted Chief Aim has been saved!");
      handleClose();
    } catch (error) {
      toast.error("Failed to save Chief Aim");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setAdjustmentRequest("");
    setAdjustedAim(null);
    setSummary("");
    onClose();
  };

  const handleReset = () => {
    setAdjustedAim(null);
    setSummary("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Wand2 className="w-5 h-5 text-gold" />
            Adjust Your Chief Aim
          </DialogTitle>
          <DialogDescription>
            Tell the AI what changes you want to make to your Definite Chief Aim, and it will help you rewrite it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Current Aim Preview */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Current Chief Aim</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gold font-medium">The Dream:</span>{" "}
                <span className="text-foreground/80">{currentAim.what || "Not set"}</span>
              </div>
              <div>
                <span className="text-gold font-medium">The Deadline:</span>{" "}
                <span className="text-foreground/80">{currentAim.byWhen || "Not set"}</span>
              </div>
              <div>
                <span className="text-gold font-medium">The Exchange:</span>{" "}
                <span className="text-foreground/80">{currentAim.exchange || "Not set"}</span>
              </div>
              <div>
                <span className="text-gold font-medium">The Plan:</span>{" "}
                <span className="text-foreground/80">{currentAim.plan || "Not set"}</span>
              </div>
            </div>
          </div>

          {/* Adjustment Input */}
          {!adjustedAim && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                What adjustment would you like to make?
              </label>
              <Textarea
                value={adjustmentRequest}
                onChange={(e) => setAdjustmentRequest(e.target.value)}
                placeholder="e.g., 'I want to change my deadline to December 2026' or 'Make the plan more specific with weekly milestones' or 'I've decided to focus on building a SaaS business instead'"
                className="min-h-[100px]"
                disabled={isAdjusting}
              />
              <Button
                onClick={handleAdjust}
                disabled={!adjustmentRequest.trim() || isAdjusting}
                className="w-full gap-2 bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-background"
              >
                {isAdjusting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI is Rewriting...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Adjust with AI
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Adjusted Aim Preview */}
          {adjustedAim && (
            <div className="space-y-4">
              {summary && (
                <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
                  <p className="text-sm text-gold">
                    <span className="font-medium">Changes made:</span> {summary}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-lg bg-gradient-to-br from-gold/5 to-transparent border-2 border-gold/30">
                <h4 className="text-sm font-medium text-gold mb-3 flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Adjusted Chief Aim
                </h4>
                <div className="space-y-3 text-sm">
                  <div className={cn(
                    "p-3 rounded-lg transition-colors",
                    adjustedAim.what !== currentAim.what && "bg-gold/10 border border-gold/20"
                  )}>
                    <span className="text-gold font-medium">The Dream:</span>{" "}
                    <span className="text-foreground">{adjustedAim.what}</span>
                    {adjustedAim.what !== currentAim.what && (
                      <span className="ml-2 text-xs text-gold">(updated)</span>
                    )}
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg transition-colors",
                    adjustedAim.byWhen !== currentAim.byWhen && "bg-gold/10 border border-gold/20"
                  )}>
                    <span className="text-gold font-medium">The Deadline:</span>{" "}
                    <span className="text-foreground">{adjustedAim.byWhen}</span>
                    {adjustedAim.byWhen !== currentAim.byWhen && (
                      <span className="ml-2 text-xs text-gold">(updated)</span>
                    )}
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg transition-colors",
                    adjustedAim.exchange !== currentAim.exchange && "bg-gold/10 border border-gold/20"
                  )}>
                    <span className="text-gold font-medium">The Exchange:</span>{" "}
                    <span className="text-foreground">{adjustedAim.exchange}</span>
                    {adjustedAim.exchange !== currentAim.exchange && (
                      <span className="ml-2 text-xs text-gold">(updated)</span>
                    )}
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg transition-colors",
                    adjustedAim.plan !== currentAim.plan && "bg-gold/10 border border-gold/20"
                  )}>
                    <span className="text-gold font-medium">The Plan:</span>{" "}
                    <span className="text-foreground">{adjustedAim.plan}</span>
                    {adjustedAim.plan !== currentAim.plan && (
                      <span className="ml-2 text-xs text-gold">(updated)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={isSaving}
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Different Adjustment
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
