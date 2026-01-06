import { Scroll, Calendar, ArrowRight, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChiefAimData {
  what: string;
  byWhen: string;
  exchange: string;
  plan: string;
}

interface DefiniteChiefAimCardProps {
  aim: ChiefAimData;
  onEdit?: () => void;
}

export const DefiniteChiefAimCard = ({ aim, onEdit }: DefiniteChiefAimCardProps) => {
  const hasAim = aim.what && aim.byWhen && aim.exchange && aim.plan;

  return (
    <div className="glass-card p-6 cinematic-border animate-slide-up relative overflow-hidden" style={{ animationDelay: "0.2s" }}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/10 to-transparent rounded-bl-full" />
      
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
            <Scroll className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-xl font-display tracking-wide">The Script</h3>
            <p className="text-sm text-muted-foreground">Your Definite Chief Aim</p>
          </div>
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="gap-2 text-muted-foreground hover:text-gold"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">{hasAim ? "Edit" : "Create with AI"}</span>
          </Button>
        )}
      </div>

      <div className="space-y-4 relative">
        <div className="p-4 rounded-lg bg-secondary/50 border-l-2 border-gold">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">What I Want</p>
          <p className="text-foreground font-medium">{aim.what}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gold" />
              <p className="text-sm text-muted-foreground uppercase tracking-wider">By When</p>
            </div>
            <p className="text-foreground font-medium">{aim.byWhen}</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-2 mb-1">
            <ArrowRight className="w-4 h-4 text-amber-soft" />
            <p className="text-sm text-muted-foreground uppercase tracking-wider">The Exchange</p>
          </div>
          <p className="text-foreground/80 text-sm">{aim.exchange}</p>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-gold/5 to-transparent border border-gold/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-gold" />
            <p className="text-sm text-gold uppercase tracking-wider">The Plan</p>
          </div>
          <p className="text-foreground/90 text-sm">{aim.plan}</p>
        </div>
      </div>
    </div>
  );
};
