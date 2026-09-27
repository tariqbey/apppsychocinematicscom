import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Brain, Loader2, Minus, Network, Plus, RefreshCw, Search, Sparkles, Trash2, X } from "lucide-react";
import { deleteMemory, deleteNode, loadGraph, loadMemories, type KgEdge, type KgNode } from "@/lib/ava/memoryTools";

/**
 * The user's knowledge graph: the people, goals, projects, habits, fears,
 * strengths and ideas in their life and how they connect. Ava builds it from
 * conversations (graph_add + the end-of-session summary). Also lists everything
 * Ava remembers, with the option to delete any of it.
 */

const TYPE_GROUPS: { key: string; label: string; color: string; types: string[] }[] = [
  { key: "people", label: "People", color: "#E8B84A", types: ["person"] },
  { key: "aims", label: "Goals & projects", color: "#F97316", types: ["goal", "project", "business", "event"] },
  { key: "power", label: "Strengths & habits", color: "#34D399", types: ["strength", "habit", "skill", "resource"] },
  { key: "shadow", label: "Fears & beliefs", color: "#F87171", types: ["fear", "belief"] },
  { key: "spirit", label: "Values & wisdom", color: "#A78BFA", types: ["value", "law", "reading"] },
  { key: "other", label: "Ideas & places", color: "#38BDF8", types: ["idea", "place"] },
];

const groupOf = (type: string) => TYPE_GROUPS.find((g) => g.types.includes(type)) ?? TYPE_GROUPS[TYPE_GROUPS.length - 1];

interface Pos {
  x: number;
  y: number;
}

/** Simple force-directed layout (repulsion + springs + centering), run once. */
function layout(nodes: KgNode[], edges: KgEdge[], width: number, height: number): Map<string, Pos> {
  const pos = new Map<string, Pos & { vx: number; vy: number }>();
  const n = nodes.length;
  nodes.forEach((node, i) => {
    const a = (i / Math.max(1, n)) * Math.PI * 2;
    const r = Math.min(width, height) * 0.35;
    pos.set(node.id, { x: width / 2 + Math.cos(a) * r, y: height / 2 + Math.sin(a) * r, vx: 0, vy: 0 });
  });
  const links = edges.filter((e) => pos.has(e.source_id) && pos.has(e.target_id));
  const ideal = Math.max(width < 640 ? 60 : 70, Math.min(140, Math.sqrt((width * height) / Math.max(1, n)) * 0.8));
  const iterations = n > 200 ? 160 : 300;

  for (let it = 0; it < iterations; it++) {
    const cooling = 1 - it / iterations;
    const arr = Array.from(pos.values());
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 0.01) {
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
          d2 = 0.5;
        }
        const f = (ideal * ideal) / d2;
        a.vx += dx * f * 0.05;
        a.vy += dy * f * 0.05;
        b.vx -= dx * f * 0.05;
        b.vy -= dy * f * 0.05;
      }
    }
    for (const e of links) {
      const a = pos.get(e.source_id)!;
      const b = pos.get(e.target_id)!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = ((d - ideal) / d) * 0.08;
      a.vx += dx * f;
      a.vy += dy * f;
      b.vx -= dx * f;
      b.vy -= dy * f;
    }
    for (const p of arr) {
      p.vx += (width / 2 - p.x) * 0.004;
      p.vy += (height / 2 - p.y) * 0.004;
      const max = 12 * cooling + 1;
      p.x += Math.max(-max, Math.min(max, p.vx));
      p.y += Math.max(-max, Math.min(max, p.vy));
      p.vx *= 0.6;
      p.vy *= 0.6;
    }
  }
  // Fit the whole layout inside the canvas with a margin (labels sit below the dots).
  const pts = Array.from(pos.values());
  if (!pts.length) return new Map();
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const narrow = width < 640;
  const mx = narrow ? 44 : 90;
  const my = 40;
  const fit = Math.min((width - mx * 2) / Math.max(1, maxX - minX), (height - my * 2 - 20) / Math.max(1, maxY - minY), 2.4);
  // On phones, don't squash a big graph into a clump: keep it readable and let the user pan.
  const scale = narrow ? Math.max(fit, 0.7) : fit;
  let offX = (width - (maxX - minX) * scale) / 2;
  let offY = (height - 20 - (maxY - minY) * scale) / 2;
  if (scale > fit) {
    // Zoomed past "fit" on a phone: start centered on the most-connected node.
    const deg = new Map<string, number>();
    links.forEach((e) => {
      deg.set(e.source_id, (deg.get(e.source_id) ?? 0) + 1);
      deg.set(e.target_id, (deg.get(e.target_id) ?? 0) + 1);
    });
    const hubId = Array.from(pos.keys()).sort((a, b) => (deg.get(b) ?? 0) - (deg.get(a) ?? 0))[0];
    const hub = pos.get(hubId)!;
    offX = width / 2 - (hub.x - minX) * scale;
    offY = (height - 20) / 2 - (hub.y - minY) * scale;
  }
  return new Map(
    Array.from(pos.entries()).map(([id, p]) => [id, { x: offX + (p.x - minX) * scale, y: offY + (p.y - minY) * scale }]),
  );
}

type Memory = Awaited<ReturnType<typeof loadMemories>>[number];

export default function KnowledgeGraph() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<KgNode[]>([]);
  const [edges, setEdges] = useState<KgEdge[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [positions, setPositions] = useState<Map<string, Pos>>(new Map());
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });

  // The canvas uses real screen pixels, so labels stay readable on phones.
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 640 });
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      if (w > 0 && h > 0) setSize((s) => (Math.abs(s.w - w) > 8 || Math.abs(s.h - h) > 8 ? { w, h } : s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = size.w;
  const H = size.h;
  const graphRef = useRef<{ nodes: KgNode[]; edges: KgEdge[] }>({ nodes: [], edges: [] });

  const userId = user?.id;
  const refresh = useCallback(async () => {
    if (!userId) return;
    const [graph, mems] = await Promise.all([loadGraph(userId), loadMemories(userId)]);
    graphRef.current = graph;
    setNodes(graph.nodes);
    setEdges(graph.edges);
    setMemories(mems);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener("ava:graph-changed", onChange);
    window.addEventListener("ava:memory-changed", onChange);
    return () => {
      window.removeEventListener("ava:graph-changed", onChange);
      window.removeEventListener("ava:memory-changed", onChange);
    };
  }, [refresh]);

  useEffect(() => {
    setPositions(layout(nodes, edges, W, H));
    setView({ x: 0, y: 0, k: 1 });
  }, [nodes, edges, W, H]);

  const degree = useMemo(() => {
    const d = new Map<string, number>();
    edges.forEach((e) => {
      d.set(e.source_id, (d.get(e.source_id) ?? 0) + 1);
      d.set(e.target_id, (d.get(e.target_id) ?? 0) + 1);
    });
    return d;
  }, [edges]);

  const visibleNodes = useMemo(() => nodes.filter((n) => !hidden.has(groupOf(n.type).key)), [nodes, hidden]);
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? new Set(nodes.filter((n) => `${n.label} ${n.description ?? ""}`.toLowerCase().includes(q)).map((n) => n.id)) : null;
  }, [nodes, query]);

  const neighbors = useMemo(() => {
    if (!selected) return null;
    const s = new Set<string>([selected]);
    edges.forEach((e) => {
      if (e.source_id === selected) s.add(e.target_id);
      if (e.target_id === selected) s.add(e.source_id);
    });
    return s;
  }, [edges, selected]);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const selectedNode = selected ? byId.get(selected) : undefined;
  const selectedLinks = useMemo(
    () =>
      selected
        ? edges
            .filter((e) => e.source_id === selected || e.target_id === selected)
            .map((e) =>
              e.source_id === selected
                ? { id: e.id, text: `${e.relation} → ${byId.get(e.target_id)?.label ?? "?"}`, other: e.target_id }
                : { id: e.id, text: `${byId.get(e.source_id)?.label ?? "?"} ${e.relation} →`, other: e.source_id },
            )
        : [],
    [byId, edges, selected],
  );

  // Pan (background drag) and node drag, with pointer events so it works on phones.
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ kind: "pan" | "node"; id?: string; startX: number; startY: number; orig: Pos; moved: boolean } | null>(null);

  const toSvgDelta = (dx: number, dy: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    const scale = rect ? W / rect.width : 1;
    return { dx: (dx * scale) / view.k, dy: (dy * scale) / view.k };
  };

  const onPointerDown = (e: React.PointerEvent, id?: string) => {
    e.stopPropagation();
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can't be captured; dragging still works inside the canvas.
    }
    drag.current = id
      ? { kind: "node", id, startX: e.clientX, startY: e.clientY, orig: positions.get(id) ?? { x: 0, y: 0 }, moved: false }
      : { kind: "pan", startX: e.clientX, startY: e.clientY, orig: { x: view.x, y: view.y }, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const { dx, dy } = toSvgDelta(e.clientX - d.startX, e.clientY - d.startY);
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (d.kind === "node" && d.id) {
      const id = d.id;
      setPositions((prev) => new Map(prev).set(id, { x: d.orig.x + dx, y: d.orig.y + dy }));
    } else {
      setView((v) => ({ ...v, x: d.orig.x + dx * v.k, y: d.orig.y + dy * v.k }));
    }
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) setSelected(d.kind === "node" && d.id ? (selected === d.id ? null : d.id) : null);
  };
  const zoom = (factor: number) =>
    setView((v) => {
      const k = Math.min(3, Math.max(0.4, v.k * factor));
      // Keep the center of the canvas fixed while zooming.
      return { k, x: W / 2 - ((W / 2 - v.x) * k) / v.k, y: H / 2 - ((H / 2 - v.y) * k) / v.k };
    });

  const removeNode = async (id: string) => {
    if (!user) return;
    await deleteNode(user.id, id);
    setSelected(null);
    void refresh();
  };
  const removeMemory = async (id: string) => {
    if (!user) return;
    setMemories((m) => m.filter((x) => x.id !== id));
    await deleteMemory(user.id, id);
  };

  const sessionSummaries = memories.filter((m) => m.kind === "session_summary");
  const facts = memories.filter((m) => m.kind !== "session_summary");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 pt-28 sm:pt-32 pb-32 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label="Back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl bg-gradient-to-r from-gold to-amber-soft bg-clip-text text-transparent">
                Knowledge Graph
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your world as Ava sees it: {nodes.length} {nodes.length === 1 ? "thing" : "things"}, {edges.length} {edges.length === 1 ? "connection" : "connections"}, {facts.length} {facts.length === 1 ? "memory" : "memories"}.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="graph">
          <div className="flex items-center justify-between gap-2">
          <TabsList className="bg-card/40 border border-gold/20">
            <TabsTrigger value="graph" className="gap-1.5 data-[state=active]:bg-gold data-[state=active]:text-black">
              <Network className="w-4 h-4" /> Graph
            </TabsTrigger>
            <TabsTrigger value="memories" className="gap-1.5 data-[state=active]:bg-gold data-[state=active]:text-black">
              <Brain className="w-4 h-4" /> Memories
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="icon" onClick={() => void refresh()} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          </div>

          <TabsContent value="graph" className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative flex-1 min-w-0 sm:min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a person, goal, project…"
                  className="w-full h-9 rounded-md border border-gold/20 bg-card/40 pl-9 pr-3 text-sm outline-none focus:border-gold/50"
                />
              </div>
              <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex !flex-nowrap gap-2 overflow-x-auto [scrollbar-width:none]">
              {TYPE_GROUPS.map((g) => {
                const off = hidden.has(g.key);
                return (
                  <button
                    key={g.key}
                    onClick={() =>
                      setHidden((h) => {
                        const next = new Set(h);
                        if (off) next.delete(g.key);
                        else next.add(g.key);
                        return next;
                      })
                    }
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap transition-opacity ${off ? "opacity-40 border-border" : "border-gold/25"}`}
                    aria-pressed={!off}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.color }} />
                    {g.label}
                  </button>
                );
              })}
              </div>
            </div>

            <div ref={canvasRef} className="relative h-[62vh] min-h-[380px] overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-b from-card/60 to-black/60">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gold" />
                </div>
              ) : nodes.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <Sparkles className="w-8 h-8 text-gold" />
                  <p className="font-display text-lg">Your graph is empty, for now.</p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Talk to Ava. Every person, goal, project, fear and win you mention gets mapped here and connected, and she remembers it all next time.
                  </p>
                </div>
              ) : (
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${W} ${H}`}
                  className="h-full w-full touch-none select-none cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => onPointerDown(e)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onWheel={(e) => zoom(e.deltaY < 0 ? 1.1 : 0.9)}
                >
                  <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
                    {edges.map((e) => {
                      const a = positions.get(e.source_id);
                      const b = positions.get(e.target_id);
                      if (!a || !b || !visibleIds.has(e.source_id) || !visibleIds.has(e.target_id)) return null;
                      const lit = neighbors ? neighbors.has(e.source_id) && neighbors.has(e.target_id) : true;
                      return (
                        <g key={e.id} opacity={lit ? 1 : 0.12}>
                          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#D4AF37" strokeOpacity={0.35} strokeWidth={1.2} />
                          {selected && lit && (
                            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" fontSize={10} fill="#d6c79a">
                              {e.relation}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {visibleNodes.map((n) => {
                      const p = positions.get(n.id);
                      if (!p) return null;
                      const g = groupOf(n.type);
                      const r = 7 + Math.min(10, (degree.get(n.id) ?? 0) * 1.6);
                      const dim = (neighbors && !neighbors.has(n.id)) || (matches && !matches.has(n.id));
                      const isSel = selected === n.id;
                      return (
                        <g
                          key={n.id}
                          transform={`translate(${p.x} ${p.y})`}
                          opacity={dim ? 0.18 : 1}
                          onPointerDown={(e) => onPointerDown(e, n.id)}
                          className="cursor-pointer"
                        >
                          <circle r={r + 6} fill={g.color} opacity={isSel ? 0.35 : 0.12} />
                          <circle r={r} fill={g.color} stroke={isSel ? "#fff" : "#000"} strokeWidth={isSel ? 2 : 1} />
                          <text y={r + 13} textAnchor="middle" fontSize={12} fill="#f5f0e1" style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 3 }}>
                            {n.label.length > 26 ? `${n.label.slice(0, 24)}…` : n.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}

              {nodes.length > 0 && (
                <div className="absolute right-3 top-3 flex flex-col gap-1.5">
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-black/50" onClick={() => zoom(1.25)} aria-label="Zoom in">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-black/50" onClick={() => zoom(0.8)} aria-label="Zoom out">
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {selectedNode && (
                <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:left-3 sm:w-80 rounded-xl border border-gold/30 bg-background/95 p-4 shadow-2xl animate-fade-in">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg text-gold leading-tight">{selectedNode.label}</p>
                      <Badge variant="outline" className="mt-1 text-[10px] capitalize" style={{ borderColor: groupOf(selectedNode.type).color }}>
                        {selectedNode.type}
                      </Badge>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedNode.description && <p className="mt-2 text-sm text-foreground/90">{selectedNode.description}</p>}
                  {selectedLinks.length > 0 && (
                    <ul className="mt-3 space-y-1 max-h-40 overflow-y-auto text-sm">
                      {selectedLinks.map((l) => (
                        <li key={l.id}>
                          <button className="text-left hover:text-gold" onClick={() => setSelected(l.other)}>
                            {l.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button variant="ghost" size="sm" className="mt-3 h-8 gap-1.5 text-red-300 hover:text-red-200" onClick={() => void removeNode(selectedNode.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> Remove from graph
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Drag to move around, tap anything to see its connections. Tell Ava about your people and projects and the graph grows.</p>
          </TabsContent>

          <TabsContent value="memories" className="space-y-5">
            {sessionSummaries.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs uppercase tracking-[0.2em] text-gold/80">Recent conversations</h2>
                {sessionSummaries.slice(0, 8).map((m) => (
                  <div key={m.id} className="rounded-lg border border-gold/15 bg-card/40 p-3 text-sm">
                    <p className="text-[11px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</p>
                    <p>{m.content}</p>
                  </div>
                ))}
              </section>
            )}
            <section className="space-y-2">
              <h2 className="text-xs uppercase tracking-[0.2em] text-gold/80">What Ava remembers</h2>
              {facts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing yet. Talk to Ava and tell her what you're building.</p>
              ) : (
                facts.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 rounded-lg border border-gold/15 bg-card/40 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">{m.kind.replace("_", " ")}</Badge>
                        <span className="text-[11px] text-gold/80" aria-label={`Importance ${m.importance} of 5`}>
                          {"●".repeat(m.importance)}
                          <span className="text-muted-foreground/40">{"●".repeat(5 - m.importance)}</span>
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{m.content}</p>
                    </div>
                    <button onClick={() => void removeMemory(m.id)} className="text-muted-foreground hover:text-red-300" aria-label="Forget this">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
