import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { computationalCategories, TreeNode } from "@/data/computational-models";
import { Brain, FlaskConical, Users, FileText, X, Download, MessageSquare, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
/*  Colour palette - high contrast for dark bg                         */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, string> = {
  "computer-vision": "#818cf8",
  "behavioral-segmentation": "#fbbf24",
  "acoustic-attribution": "#34d399",
  "neural-decoding": "#f87171",
  "generative-embodied": "#a78bfa",
  "data-ecosystems": "#22d3ee",
};

const ROOT_COLOR = "#60a5fa";

/* ------------------------------------------------------------------ */
/*  Build initial graph                                                */
/* ------------------------------------------------------------------ */

function buildInitialGraph(): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const root: GraphNode = {
    id: "root",
    label: "Computational\nLandscape",
    type: "root",
    color: ROOT_COLOR,
    radius: 60,
  };
  nodes.push(root);

  computationalCategories.forEach((cat) => {
    const catNode: GraphNode = {
      id: cat.id,
      label: cat.title.replace(/^\d+\.\s*/, ""),
      type: "category",
      color: CATEGORY_COLORS[cat.id] || "#94a3b8",
      radius: 44,
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
      radius: 28,
      meta: model.meta,
      categoryId,
    });
    links.push({ id: `${categoryId}->${nodeId}`, source: categoryId, target: nodeId });
  });

  return { nodes, links };
}

/* ------------------------------------------------------------------ */
/*  RDF Export for computational models                                 */
/* ------------------------------------------------------------------ */

function generateComputationalRdf(): string {
  const lines: string[] = [];
  lines.push("@prefix bbqs: <https://bbqs.dev/ontology/computational#> .");
  lines.push("@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .");
  lines.push("@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .");
  lines.push("@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .");
  lines.push("");

  lines.push('bbqs:ComputationalLandscape rdf:type bbqs:RootNode ;');
  lines.push('    rdfs:label "BBQS Computational Landscape" .');
  lines.push("");

  computationalCategories.forEach((cat) => {
    const catId = cat.id.replace(/-/g, "_");
    lines.push(`bbqs:Category_${catId} rdf:type bbqs:MethodologicalCategory ;`);
    lines.push(`    rdfs:label "${cat.title.replace(/^\d+\.\s*/, "")}" ;`);
    lines.push(`    bbqs:description "${cat.description.replace(/"/g, '\\"')}" ;`);
    lines.push(`    bbqs:partOf bbqs:ComputationalLandscape .`);
    lines.push("");

    (cat.tree.children ?? []).forEach((model, idx) => {
      const modelId = `${catId}_model_${idx}`;
      lines.push(`bbqs:Model_${modelId} rdf:type bbqs:ComputationalModel ;`);
      lines.push(`    rdfs:label "${model.name.replace(/"/g, '\\"')}" ;`);
      lines.push(`    bbqs:belongsToCategory bbqs:Category_${catId} ;`);
      if (model.meta?.species) lines.push(`    bbqs:studiesSpecies "${model.meta.species}" ;`);
      if (model.meta?.goal) lines.push(`    bbqs:goal "${model.meta.goal.replace(/"/g, '\\"')}" ;`);
      if (model.meta?.algorithm) lines.push(`    bbqs:method "${model.meta.algorithm.replace(/"/g, '\\"')}" ;`);
      if (model.meta?.grant) lines.push(`    bbqs:grantNumber "${model.meta.grant}" ;`);
      if (model.meta?.pis) lines.push(`    bbqs:principalInvestigators "${model.meta.pis}" ;`);
      // Fix last semicolon to period
      const lastIdx = lines.length - 1;
      lines[lastIdx] = lines[lastIdx].replace(/ ;$/, " .");
      lines.push("");
    });
  });

  return lines.join("\n");
}

function downloadRdf() {
  const content = generateComputationalRdf();
  const blob = new Blob([content], { type: "text/turtle;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bbqs-computational-landscape.ttl";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJsonLd() {
  const graph: any[] = [
    {
      "@type": "bbqs:RootNode",
      "@id": "bbqs:ComputationalLandscape",
      "rdfs:label": "BBQS Computational Landscape",
    },
  ];

  computationalCategories.forEach((cat) => {
    const catId = cat.id.replace(/-/g, "_");
    graph.push({
      "@type": "bbqs:MethodologicalCategory",
      "@id": `bbqs:Category_${catId}`,
      "rdfs:label": cat.title.replace(/^\d+\.\s*/, ""),
      "bbqs:description": cat.description,
      "bbqs:partOf": { "@id": "bbqs:ComputationalLandscape" },
    });

    (cat.tree.children ?? []).forEach((model, idx) => {
      graph.push({
        "@type": "bbqs:ComputationalModel",
        "@id": `bbqs:Model_${catId}_model_${idx}`,
        "rdfs:label": model.name,
        "bbqs:belongsToCategory": { "@id": `bbqs:Category_${catId}` },
        ...(model.meta?.species && { "bbqs:studiesSpecies": model.meta.species }),
        ...(model.meta?.goal && { "bbqs:goal": model.meta.goal }),
        ...(model.meta?.algorithm && { "bbqs:method": model.meta.algorithm }),
        ...(model.meta?.grant && { "bbqs:grantNumber": model.meta.grant }),
        ...(model.meta?.pis && { "bbqs:principalInvestigators": model.meta.pis }),
      });
    });
  });

  const jsonLd = {
    "@context": {
      bbqs: "https://bbqs.dev/ontology/computational#",
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    },
    "@graph": graph,
  };

  const blob = new Blob([JSON.stringify(jsonLd, null, 2)], { type: "application/ld+json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bbqs-computational-landscape.jsonld";
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Detail Panel                                                       */
/* ------------------------------------------------------------------ */

function DetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-[hsl(220,30%,12%)] border-l border-[hsl(220,20%,25%)] shadow-2xl z-20 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(220,20%,25%)] shrink-0">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
        <span className="text-xs font-medium text-[hsl(220,15%,65%)] uppercase tracking-wider flex-1 truncate">
          {node.type === "root" ? "Root" : node.type === "category" ? "Category" : "Model"}
        </span>
        <button onClick={onClose} className="p-1 rounded hover:bg-[hsl(220,20%,20%)] transition-colors">
          <X className="h-4 w-4 text-[hsl(220,15%,65%)]" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h3 className="text-sm font-bold text-white leading-snug">{node.label.replace(/\n/g, " ")}</h3>

        {node.description && (
          <p className="text-xs text-[hsl(220,15%,65%)]">{node.description}</p>
        )}

        {node.meta?.goal && (
          <div className="flex items-start gap-2">
            <Brain className="h-3.5 w-3.5 text-[hsl(210,80%,65%)] mt-0.5 shrink-0" />
            <span className="text-xs text-[hsl(220,15%,65%)]">
              <span className="font-medium text-white">Goal: </span>{node.meta.goal}
            </span>
          </div>
        )}
        {node.meta?.algorithm && (
          <div className="flex items-start gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-[hsl(210,80%,65%)] mt-0.5 shrink-0" />
            <span className="text-xs text-[hsl(220,15%,65%)]">
              <span className="font-medium text-white">Method: </span>{node.meta.algorithm}
            </span>
          </div>
        )}
        {node.meta?.species && (
          <div className="flex items-start gap-2">
            <Badge className="text-[10px] px-1.5 py-0 bg-[hsl(220,20%,20%)] text-white border-[hsl(220,20%,30%)]">{node.meta.species}</Badge>
          </div>
        )}
        {node.meta?.grant && (
          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3 text-[hsl(220,15%,55%)]" />
            <span className="text-[10px] text-[hsl(220,15%,65%)] font-mono">{node.meta.grant}</span>
          </div>
        )}
        {node.meta?.pis && (
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-[hsl(220,15%,55%)]" />
            <span className="text-[10px] text-[hsl(220,15%,65%)]">{node.meta.pis}</span>
          </div>
        )}

        {node.type === "category" && (
          <p className="text-[10px] text-[hsl(220,15%,45%)] pt-2 border-t border-[hsl(220,20%,20%)]">
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
    <div className="absolute top-3 left-3 bg-[hsl(220,30%,10%)]/90 backdrop-blur border border-[hsl(220,20%,25%)] rounded-lg p-3 z-10 space-y-1.5 max-w-[200px]">
      <p className="text-[10px] font-semibold text-[hsl(220,15%,55%)] uppercase tracking-wider mb-2">Node Types</p>
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
          <span className="text-[11px] text-[hsl(220,10%,75%)] leading-tight truncate">{it.label}</span>
        </div>
      ))}
      <p className="text-[9px] text-[hsl(220,15%,45%)] pt-1 border-t border-[hsl(220,20%,20%)]">
        {expandedCategories.size} expanded
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat Panel                                                         */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/computational-kg-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: allMessages }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        toast.error(err.error || `Error ${resp.status}`);
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[hsl(220,30%,10%)] border-t border-[hsl(220,20%,25%)]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[hsl(220,20%,20%)]">
        <MessageSquare className="h-4 w-4 text-[hsl(210,80%,65%)]" />
        <span className="text-xs font-semibold text-[hsl(220,10%,75%)]">Knowledge Graph Chat</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-2" ref={scrollRef}>
        {messages.length === 0 && (
          <p className="text-xs text-[hsl(220,15%,45%)] text-center py-4">
            Ask questions about the computational landscape or request updates to the knowledge graph.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <div
              className={`inline-block max-w-[85%] px-3 py-2 rounded-lg text-xs ${
                msg.role === "user"
                  ? "bg-[hsl(210,80%,50%)] text-white"
                  : "bg-[hsl(220,25%,18%)] text-[hsl(220,10%,80%)]"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-xs prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="text-left mb-3">
            <div className="inline-block px-3 py-2 rounded-lg bg-[hsl(220,25%,18%)] text-[hsl(220,15%,55%)] text-xs">
              Thinking...
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-[hsl(220,20%,20%)] flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask about models, species, grants..."
          className="min-h-[36px] max-h-[80px] resize-none text-xs bg-[hsl(220,25%,15%)] border-[hsl(220,20%,25%)] text-white placeholder:text-[hsl(220,15%,40%)]"
          rows={1}
        />
        <Button
          size="sm"
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="shrink-0 bg-[hsl(210,80%,50%)] hover:bg-[hsl(210,80%,45%)] text-white h-9 w-9 p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
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
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });
  const [chatOpen, setChatOpen] = useState(false);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const vh = window.innerHeight;
      setDimensions({ width: Math.max(400, width), height: Math.max(500, vh - 200) });
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
        next.delete(categoryId);
        setNodes((ns) => ns.filter((n) => n.categoryId !== categoryId || n.type === "category"));
        setLinks((ls) => ls.filter((l) => {
          const srcId = typeof l.source === "string" ? l.source : (l.source as GraphNode).id;
          const tgtId = typeof l.target === "string" ? l.target : (l.target as GraphNode).id;
          return !(srcId === categoryId && tgtId.startsWith(`${categoryId}::`));
        }));
      } else {
        next.add(categoryId);
        const { nodes: mn, links: ml } = buildModelNodes(categoryId);
        setNodes((ns) => {
          const catNode = ns.find((n) => n.id === categoryId);
          const cx = catNode?.x ?? dimensions.width / 2;
          const cy = catNode?.y ?? dimensions.height / 2;
          mn.forEach((m, i) => {
            const angle = (2 * Math.PI * i) / mn.length;
            m.x = cx + 90 * Math.cos(angle);
            m.y = cy + 90 * Math.sin(angle);
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
        if (src.type === "root" || tgt.type === "root") return 200;
        return 100;
      }).strength(0.5))
      .force("charge", d3.forceManyBody().strength((d: any) => d.type === "root" ? -800 : d.type === "category" ? -400 : -150))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.04))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => d.radius + 8))
      .alphaDecay(0.02)
      .on("tick", () => {
        setNodes((ns) => [...ns]);
      });

    simRef.current = sim;
    return () => { sim.stop(); };
  }, [nodes.length, links.length, dimensions]);

  // Zoom
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svgRef.current) return;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        svg.select("g.graph-content").attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Initial zoom to fit
    setTimeout(() => {
      svg.call(zoom.transform, d3.zoomIdentity.translate(dimensions.width * 0.05, dimensions.height * 0.05).scale(0.9));
    }, 300);
  }, [dimensions]);

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

    const svg = svgRef.current;
    const gContent = svg?.querySelector("g.graph-content");
    const transform = gContent ? d3.zoomTransform(svg as any) : d3.zoomIdentity;

    const onMove = (ev: MouseEvent) => {
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = ev.clientX - rect.left;
      const mouseY = ev.clientY - rect.top;
      node.fx = (mouseX - transform.x) / transform.k;
      node.fy = (mouseY - transform.y) / transform.k;
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

  // Wrap long labels for SVG
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
    <div className="flex flex-col gap-0 rounded-xl border border-[hsl(220,20%,25%)] overflow-hidden" style={{ background: "hsl(220, 30%, 8%)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(220,20%,20%)]" style={{ background: "hsl(220, 30%, 10%)" }}>
        <span className="text-xs font-semibold text-[hsl(220,10%,70%)]">Knowledge Graph</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadRdf}
            className="text-[hsl(220,10%,70%)] hover:text-white hover:bg-[hsl(220,20%,20%)] text-xs h-7 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            RDF/Turtle
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadJsonLd}
            className="text-[hsl(220,10%,70%)] hover:text-white hover:bg-[hsl(220,20%,20%)] text-xs h-7 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            JSON-LD
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChatOpen(!chatOpen)}
            className={`text-xs h-7 gap-1.5 ${chatOpen ? "bg-[hsl(210,80%,50%)] text-white hover:bg-[hsl(210,80%,45%)]" : "text-[hsl(220,10%,70%)] hover:text-white hover:bg-[hsl(220,20%,20%)]"}`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </Button>
        </div>
      </div>

      <div className="flex flex-1" style={{ height: dimensions.height }}>
        {/* Graph */}
        <div ref={containerRef} className="relative flex-1">
          <Legend expandedCategories={expandedCategories} />

          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            className="cursor-grab active:cursor-grabbing"
            onClick={() => setSelectedNode(null)}
          >
            <g className="graph-content">
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
                    stroke="hsl(220, 20%, 30%)"
                    strokeWidth={2}
                    strokeOpacity={0.6}
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                if (node.x == null || node.y == null) return null;
                const isSelected = selectedNode?.id === node.id;
                const isExpanded = node.type === "category" && expandedCategories.has(node.id);
                const labelMaxLen = node.type === "root" ? 16 : node.type === "category" ? 18 : 16;
                const lines = wrapLabel(node.label.replace(/\n/g, " "), labelMaxLen);
                const fontSize = node.type === "root" ? 13 : node.type === "category" ? 11 : 9;

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
                      <circle r={node.radius + 6} fill="none" stroke={node.color} strokeWidth={3} strokeOpacity={0.5} />
                    )}
                    {/* Expand ring */}
                    {isExpanded && (
                      <circle r={node.radius + 4} fill="none" stroke={node.color} strokeWidth={2} strokeDasharray="5 3" strokeOpacity={0.6} />
                    )}
                    {/* Main circle */}
                    <circle
                      r={node.radius}
                      fill={node.color}
                      fillOpacity={node.type === "model" ? 0.8 : 0.9}
                      stroke={isSelected ? "white" : node.color}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                    {/* Label - dark text on lighter colors, white on darker */}
                    {lines.map((line, i) => (
                      <text
                        key={i}
                        y={(i - (lines.length - 1) / 2) * (fontSize + 3)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize={fontSize}
                        fontWeight={node.type === "root" ? 700 : 600}
                        stroke="hsl(220, 30%, 8%)"
                        strokeWidth={3}
                        paintOrder="stroke"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                );
              })}
            </g>
          </svg>

          {selectedNode && <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />}
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="w-80 border-l border-[hsl(220,20%,25%)]" style={{ height: dimensions.height }}>
            <ChatPanel />
          </div>
        )}
      </div>
    </div>
  );
}
