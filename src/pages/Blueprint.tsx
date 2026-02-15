import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Loader2, ChevronDown, ChevronRight,
  Users, Bot, Zap, User, Clock, Target, FileText, Trash2, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SOPStep {
  step: number;
  action: string;
  details: string;
  expected_output?: string;
  common_mistakes?: string;
}

interface SOP {
  title: string;
  for: string;
  objective: string;
  tools_needed?: string[];
  steps: SOPStep[];
  frequency?: string;
  success_criteria?: string;
  templates?: { name: string; content: string }[];
  prerequisites?: string[];
  estimated_time?: string;
  escalation_triggers?: string[];
}

interface PlanTask {
  title: string;
  description: string;
  delegatable: boolean;
  delegation_type: string;
  priority: string;
  estimated_time?: string;
}

interface PlanPhase {
  phase: string;
  description: string;
  timeline?: string;
  tasks: PlanTask[];
}

interface AutomationOpp {
  process: string;
  tool_suggestion: string;
  trigger: string;
  action: string;
}

interface BlueprintData {
  id: string;
  title: string;
  objective: string;
  strategic_plan: PlanPhase[];
  sops: SOP[];
  status: string;
  created_at: string;
}

const DELEGATION_ICONS: Record<string, typeof Users> = {
  va: Users,
  ai_agent: Bot,
  automation: Zap,
  self: User,
};

const DELEGATION_LABELS: Record<string, string> = {
  va: "Virtual Assistant",
  ai_agent: "AI Agent",
  automation: "Automation",
  self: "Director (You)",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function Blueprint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blueprints, setBlueprints] = useState<BlueprintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedBlueprint, setExpandedBlueprint] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedSops, setExpandedSops] = useState<Set<string>>(new Set());
  const [expandingSopTask, setExpandingSopTask] = useState<string | null>(null);
  const [customContext, setCustomContext] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (user) fetchBlueprints();
  }, [user]);

  const fetchBlueprints = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("blueprints")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBlueprints(data.map((b: any) => ({
        id: b.id,
        title: b.title,
        objective: b.objective,
        strategic_plan: (b.strategic_plan || []) as PlanPhase[],
        sops: (b.sops || []) as SOP[],
        status: b.status,
        created_at: b.created_at,
      })));
    }
    setLoading(false);
  };

  const generateBlueprint = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-blueprint`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            action: "generate",
            context: customContext || undefined,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate blueprint");
      }

      toast.success("Blueprint generated! 🏗️");
      setCustomContext("");
      setShowInput(false);
      await fetchBlueprints();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const expandTaskToSOP = async (task: PlanTask, blueprintId: string) => {
    const taskKey = `${blueprintId}-${task.title}`;
    setExpandingSopTask(taskKey);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-blueprint`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            action: "expand_sop",
            taskToExpand: task,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to expand SOP");

      const data = await res.json();
      const newSop = data.blueprint as SOP;

      // Update the blueprint's SOPs in the database
      const bp = blueprints.find((b) => b.id === blueprintId);
      if (bp) {
        const updatedSops = [...bp.sops, newSop];
        await supabase
          .from("blueprints")
          .update({ sops: updatedSops as any })
          .eq("id", blueprintId);

        setBlueprints((prev) =>
          prev.map((b) => (b.id === blueprintId ? { ...b, sops: updatedSops } : b))
        );
      }

      toast.success("SOP created! Ready for your VA 📋");
    } catch (err) {
      toast.error("Failed to expand SOP");
    } finally {
      setExpandingSopTask(null);
    }
  };

  const deleteBlueprint = async (id: string) => {
    await supabase.from("blueprints").delete().eq("id", id);
    setBlueprints((prev) => prev.filter((b) => b.id !== id));
    toast.success("Blueprint deleted");
  };

  const togglePhase = (key: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleSop = (key: string) => {
    setExpandedSops((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl bg-gradient-to-r from-gold to-amber-soft bg-clip-text text-transparent">
                The Blueprint
              </h1>
              <p className="text-sm text-muted-foreground">
                Strategic Plans & SOPs for VAs, AI Agents & Automation
              </p>
            </div>
          </div>
        </div>

        {/* Generate Section */}
        <Card className="border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
          <CardContent className="pt-6 space-y-4">
            {!showInput ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    setCustomContext("");
                    generateBlueprint();
                  }}
                  disabled={generating}
                  className="flex-1 bg-gradient-to-r from-gold to-amber-soft text-primary-foreground hover:opacity-90"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Auto-Generate Blueprint
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowInput(true)}
                  disabled={generating}
                  className="border-gold/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Custom Blueprint
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Describe what you need a plan for... e.g., 'Launch my online course in 30 days' or 'Build a lead generation system for my coaching business'"
                  className="w-full bg-secondary rounded-lg px-4 py-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={generateBlueprint}
                    disabled={generating || !customContext.trim()}
                    className="bg-gradient-to-r from-gold to-amber-soft text-primary-foreground"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Target className="w-4 h-4 mr-2" />
                    )}
                    Generate Blueprint
                  </Button>
                  <Button variant="ghost" onClick={() => setShowInput(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blueprints List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : blueprints.length === 0 ? (
          <Card className="border-dashed border-muted-foreground/30">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No blueprints yet.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Generate your first Blueprint to get a strategic execution plan with delegatable SOPs.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {blueprints.map((bp) => (
              <Card key={bp.id} className="border-border overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() =>
                    setExpandedBlueprint(expandedBlueprint === bp.id ? null : bp.id)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {expandedBlueprint === bp.id ? (
                          <ChevronDown className="w-4 h-4 text-gold shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                        )}
                        {bp.title}
                      </CardTitle>
                      <CardDescription className="mt-1 ml-6">{bp.objective}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(bp.created_at).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBlueprint(bp.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedBlueprint === bp.id && (
                  <CardContent className="space-y-6 border-t border-border pt-4">
                    {/* Strategic Plan Phases */}
                    {bp.strategic_plan?.length > 0 && (
                      <div>
                        <h3 className="font-display text-sm text-gold mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          STRATEGIC PLAN
                        </h3>
                        <div className="space-y-3">
                          {bp.strategic_plan.map((phase, pi) => {
                            const phaseKey = `${bp.id}-phase-${pi}`;
                            return (
                              <div key={pi} className="border border-border rounded-lg overflow-hidden">
                                <button
                                  onClick={() => togglePhase(phaseKey)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors text-left"
                                >
                                  <div>
                                    <p className="font-medium text-sm">{phase.phase}</p>
                                    <p className="text-xs text-muted-foreground">{phase.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {phase.timeline && (
                                      <Badge variant="outline" className="text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {phase.timeline}
                                      </Badge>
                                    )}
                                    {expandedPhases.has(phaseKey) ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </div>
                                </button>
                                {expandedPhases.has(phaseKey) && (
                                  <div className="border-t border-border p-3 space-y-2">
                                    {phase.tasks?.map((task, ti) => {
                                      const Icon = DELEGATION_ICONS[task.delegation_type] || User;
                                      const taskKey = `${bp.id}-${task.title}`;
                                      return (
                                        <div
                                          key={ti}
                                          className="flex items-start gap-3 p-2 rounded-lg bg-secondary/20"
                                        >
                                          <Icon className="w-4 h-4 mt-0.5 shrink-0 text-gold" />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <p className="font-medium text-sm">{task.title}</p>
                                              <Badge
                                                variant="outline"
                                                className={cn(
                                                  "text-[10px] px-1.5 py-0",
                                                  PRIORITY_COLORS[task.priority]
                                                )}
                                              >
                                                {task.priority}
                                              </Badge>
                                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                {DELEGATION_LABELS[task.delegation_type] || task.delegation_type}
                                              </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                              {task.description}
                                            </p>
                                            {task.delegatable && task.delegation_type !== "self" && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-1 h-7 text-xs text-gold hover:text-gold"
                                                disabled={expandingSopTask === taskKey}
                                                onClick={() => expandTaskToSOP(task, bp.id)}
                                              >
                                                {expandingSopTask === taskKey ? (
                                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                ) : (
                                                  <RefreshCw className="w-3 h-3 mr-1" />
                                                )}
                                                Expand to SOP
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SOPs */}
                    {bp.sops?.length > 0 && (
                      <div>
                        <h3 className="font-display text-sm text-gold mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          SOPs — READY TO DELEGATE
                        </h3>
                        <div className="space-y-3">
                          {bp.sops.map((sop, si) => {
                            const sopKey = `${bp.id}-sop-${si}`;
                            const Icon = DELEGATION_ICONS[sop.for] || Users;
                            return (
                              <div key={si} className="border border-gold/20 rounded-lg overflow-hidden bg-gold/5">
                                <button
                                  onClick={() => toggleSop(sopKey)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-gold/10 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-gold shrink-0" />
                                    <div>
                                      <p className="font-medium text-sm">{sop.title}</p>
                                      <p className="text-xs text-muted-foreground">{sop.objective}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="outline" className="text-[10px]">
                                      {DELEGATION_LABELS[sop.for] || sop.for}
                                    </Badge>
                                    {sop.frequency && (
                                      <Badge variant="secondary" className="text-[10px]">
                                        {sop.frequency}
                                      </Badge>
                                    )}
                                    {expandedSops.has(sopKey) ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </div>
                                </button>
                                {expandedSops.has(sopKey) && (
                                  <div className="border-t border-gold/20 p-4 space-y-4">
                                    {sop.tools_needed && sop.tools_needed.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Tools Needed:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {sop.tools_needed.map((tool, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                              {tool}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="space-y-3">
                                      {sop.steps?.map((step) => (
                                        <div key={step.step} className="flex gap-3">
                                          <div className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold shrink-0">
                                            {step.step}
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-medium text-sm">{step.action}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                                              {step.details}
                                            </p>
                                            {step.expected_output && (
                                              <p className="text-xs text-emerald-400 mt-1">
                                                ✓ Expected: {step.expected_output}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {sop.templates && sop.templates.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Templates:</p>
                                        {sop.templates.map((tpl, i) => (
                                          <div key={i} className="bg-secondary/50 rounded-lg p-3 mb-2">
                                            <p className="text-xs font-medium mb-1">{tpl.name}</p>
                                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                                              {tpl.content}
                                            </pre>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {sop.success_criteria && (
                                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                        <p className="text-xs font-medium text-emerald-400">✓ Success Criteria:</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{sop.success_criteria}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
