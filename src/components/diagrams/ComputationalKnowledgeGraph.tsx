import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { computationalCategories, TreeNode } from "@/data/computational-models";
import { Brain, FlaskConical, Users, FileText, X, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: "root" | "category" | "model";
  color: string;
  radius: number;
  meta?: TreeNode["meta"];
  categoryId?: string;
  description?: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
}

/* ------------------------------------------------------------------ */
/*  Colour palette                                                     */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, string> = {
  "computer-vision": "#6366f1",
  "behavioral-segmentation": "#f59e0b",
  "acoustic-attribution": "#10b981",
  "neural-decoding": "#ef4444",
  "generative-embodied": "#8b5cf6",
  "data-ecosystems": "#06b6d4",
};

const ROOT_COLOR = "#3b82f6";

/* ------------------------------------------------------------------ */
/*  Build initial graph (root + categories only)                       */
/* ------------------------------------------------------------------ */

function buildInitialGraph(): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const root: GraphNode = {
    id: "root",
    label: "Computational\nLandscape",
    type: "root",
    color: ROOT_COLOR,
    radius: 42,
  };
  nodes.push(root);

  computationalCategories.forEach((cat) => {
    const catNode: GraphNode = {
      id: cat.id,
      label: cat.title.replace(/^\d+\.\s*/, ""),
      type: "category",
      color: CATEGORY_COLORS[cat.id] || "#94a3b8",
      radius: 30,
      description: cat.description,
      categoryId: cat.id,
    };
    nodes.push(catNode);
    links.push({ id: `root->${cat.id}`, source: "root", target: cat.id });
  });

  return { nodes, links };
}

/* ------------------------------------------------------------------ */
/*  Build model nodes for a category                                   */
/* ------------------------------------------------------------------ */

function buildModelNodes(categoryId: string): { nodes: GraphNode[]; links: GraphLink[] } {
  const cat = computationalCategories.find((c) => c.id === categoryId);
  if (!cat) return { nodes: [], links: [] };

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  (cat.tree.children ?? []).forEach((model, idx) => {
    const nodeId = `${categoryId}::${idx}`;
    nodes.push({
      id: nodeId,
      label: model.name,
      type: "model",
      color: CATEGORY_COLORS[categoryId] || "#94a3b8",
      radius: 18,
      meta: model.meta,
      categoryId,
    });
    links.push({ id: `${categoryId}->${nodeId}`, source: categoryId, target: nodeId });
  });

  return { nodes, links };
}

/* ------------------------------------------------------------------ */
/*  Detail Panel                                                       */
/* ------------------------------------------------------------------ */

function DetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-card border-l border-border shadow-2xl z-20 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex-1 truncate">
          {node.type === "root" ? "Root" : node.type === "category" ? "Category" : "Model"}
        </span>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h3 className="text-sm font-bold text-foreground leading-snug">{node.label.replace(/\n/g, " ")}</h3>

        {node.description && (
          <p className="text-xs text-muted-foreground">{node.description}</p>
        )}

        {node.meta?.goal && (
          <div className="flex items-start gap-2">
            <Brain className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Goal: </span>{node.meta.goal}
            </span>
          </div>
        )}
        {node.meta?.algorithm && (
          <div className="flex items-start gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Method: </span>{node.meta.algorithm}
            </span>
          </div>
        )}
        {node.meta?.species && (
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{node.meta.species}</Badge>
          </div>
        )}
        {node.meta?.grant && (
          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-mono">{node.meta.grant}</span>
          </div>
        )}
        {node.meta?.pis && (
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{node.meta.pis}</span>
          </div>
        )}

        {node.type === "category" && (
          <p className="text-[10px] text-muted-foreground/60 pt-2 border-t border-border">
            Click this node in the graph to expand its models.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Legend                                                              */
/* ------------------------------------------------------------------ */

function Legend({ expandedCategories }: { expandedCategories: Set<string> }) {
  const items = [
    { color: ROOT_COLOR, label: "Computational Landscape" },
    ...computationalCategories.map((c) => ({
      color: CATEGORY_COLORS[c.id] || "#94a3b8",
      label: c.title.replace(/^\d+\.\s*/, "").split("&")[0].trim(),
    })),
  ];

  return (
    <div className="absolute top-3 right-3 bg-card/90 backdrop-blur border border-border rounded-lg p-3 z-10 space-y-1.5 max-w-[180px]">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Node Types</p>
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
          <span className="text-[10px] text-muted-foreground leading-tight truncate">{it.label}</span>
        </div>
      ))}
      <p className="text-[9px] text-muted-foreground/50 pt-1 border-t border-border">
        {expandedCategories.size} expanded
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function ComputationalKnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDimensions({ width: Math.max(400, width), height: Math.max(400, Math.min(700, width * 0.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Initialize graph
  useEffect(() => {
    const { nodes: n, links: l } = buildInitialGraph();
    setNodes(n);
    setLinks(l);
  }, []);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        // Collapse: remove model nodes
        next.delete(categoryId);
        setNodes((ns) => ns.filter((n) => n.categoryId !== categoryId || n.type === "category"));
        setLinks((ls) => ls.filter((l) => {
          const srcId = typeof l.source === "string" ? l.source : (l.source as GraphNode).id;
          const tgtId = typeof l.target === "string" ? l.target : (l.target as GraphNode).id;
          return !(srcId === categoryId && tgtId.startsWith(`${categoryId}::`));
        }));
      } else {
        // Expand: add model nodes
        next.add(categoryId);
        const { nodes: mn, links: ml } = buildModelNodes(categoryId);
        // Position model nodes near category
        setNodes((ns) => {
          const catNode = ns.find((n) => n.id === categoryId);
          const cx = catNode?.x ?? dimensions.width / 2;
          const cy = catNode?.y ?? dimensions.height / 2;
          mn.forEach((m, i) => {
            const angle = (2 * Math.PI * i) / mn.length;
            m.x = cx + 60 * Math.cos(angle);
            m.y = cy + 60 * Math.sin(angle);
          });
          return [...ns, ...mn];
        });
        setLinks((ls) => [...ls, ...ml]);
      }
      return next;
    });
  }, [dimensions]);

  // D3 simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance((l) => {
        const src = l.source as GraphNode;
        const tgt = l.target as GraphNode;
        if (src.type === "root" || tgt.type === "root") return 160;
        return 80;
      }).strength(0.6))
      .force("charge", d3.forceManyBody().strength((d: any) => d.type === "root" ? -600 : d.type === "category" ? -300 : -120))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.05))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => d.radius + 6))
      .alphaDecay(0.02)
      .on("tick", () => {
        setNodes((ns) => [...ns]);
      });

    simRef.current = sim;
    return () => { sim.stop(); };
  }, [nodes.length, links.length, dimensions]);

  // Re-heat on expand/collapse
  useEffect(() => {
    simRef.current?.alpha(0.6).restart();
  }, [expandedCategories.size]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    const sim = simRef.current;
    if (!sim) return;

    sim.alphaTarget(0.3).restart();
    node.fx = node.x;
    node.fy = node.y;

    const onMove = (ev: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      node.fx = ev.clientX - rect.left;
      node.fy = ev.clientY - rect.top;
    };
    const onUp = () => {
      sim.alphaTarget(0);
      node.fx = null;
      node.fy = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const handleNodeClick = useCallback((e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    setSelectedNode(node);
    if (node.type === "category") {
      toggleCategory(node.id);
    }
  }, [toggleCategory]);

  // Wrap long labels
  const wrapLabel = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return [text];
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    words.forEach((w) => {
      if ((cur + " " + w).trim().length > maxLen && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = (cur + " " + w).trim();
      }
    });
    if (cur) lines.push(cur);
    return lines.slice(0, 3).map((l, i, a) => (i === a.length - 1 && lines.length > 3 ? l.slice(0, maxLen - 1) + "…" : l));
  };

  return (
    <div ref={containerRef} className="relative w-full rounded-xl border border-border bg-background overflow-hidden">
      <Legend expandedCategories={expandedCategories} />

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-grab active:cursor-grabbing"
        onClick={() => setSelectedNode(null)}
      >
        {/* Links */}
        {links.map((link) => {
          const src = typeof link.source === "string" ? nodes.find((n) => n.id === link.source) : (link.source as GraphNode);
          const tgt = typeof link.target === "string" ? nodes.find((n) => n.id === link.target) : (link.target as GraphNode);
          if (!src || !tgt || src.x == null || tgt.x == null) return null;
          return (
            <line
              key={link.id}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              className="stroke-border"
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          if (node.x == null || node.y == null) return null;
          const isSelected = selectedNode?.id === node.id;
          const isExpanded = node.type === "category" && expandedCategories.has(node.id);
          const labelMaxLen = node.type === "root" ? 14 : node.type === "category" ? 16 : 12;
          const lines = wrapLabel(node.label.replace(/\n/g, " "), labelMaxLen);
          const fontSize = node.type === "root" ? 9 : node.type === "category" ? 7.5 : 6;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x},${node.y})`}
              onMouseDown={(e) => handleDragStart(e, node)}
              onClick={(e) => handleNodeClick(e, node)}
              className="cursor-pointer"
            >
              {/* Glow ring on selected */}
              {isSelected && (
                <circle r={node.radius + 5} fill="none" stroke={node.color} strokeWidth={2} strokeOpacity={0.4} />
              )}
              {/* Expand ring */}
              {isExpanded && (
                <circle r={node.radius + 3} fill="none" stroke={node.color} strokeWidth={1.5} strokeDasharray="4 2" strokeOpacity={0.5} />
              )}
              {/* Main circle */}
              <circle
                r={node.radius}
                fill={node.color}
                fillOpacity={node.type === "model" ? 0.7 : 0.85}
                stroke={isSelected ? "hsl(var(--foreground))" : node.color}
                strokeWidth={isSelected ? 2 : 1}
              />
              {/* Label */}
              {lines.map((line, i) => (
                <text
                  key={i}
                  y={(i - (lines.length - 1) / 2) * (fontSize + 2)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={fontSize}
                  fontWeight={node.type === "root" ? 700 : 600}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>

      {selectedNode && <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  );
}
