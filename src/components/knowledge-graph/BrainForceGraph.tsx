import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import type { GraphNode, GraphLink } from "@/hooks/useKnowledgeGraphData";
import { getHomePosition, constrainToBrain, getBrainPath, TYPE_REGIONS } from "@/lib/brain-layout";

interface BrainForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  focusNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  hiddenTypes: Set<string>;
  depth: 1 | 2;
}

interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  homeX?: number;
  homeY?: number;
  isFocus?: boolean;
  hopDistance?: number;
}

interface SimLink extends GraphLink {
  source: any;
  target: any;
}

const GLOW_COLORS: Record<string, { fill: string; glow: string }> = {
  project:      { fill: "hsl(210, 85%, 60%)", glow: "hsl(210, 90%, 50%)" },
  species:      { fill: "hsl(140, 70%, 55%)", glow: "hsl(140, 80%, 45%)" },
  investigator: { fill: "hsl(35, 90%, 60%)",  glow: "hsl(35, 95%, 50%)" },
  meta_tag:     { fill: "hsl(280, 65%, 65%)", glow: "hsl(280, 70%, 55%)" },
  publication:  { fill: "hsl(350, 75%, 60%)", glow: "hsl(350, 80%, 50%)" },
  resource:     { fill: "hsl(180, 65%, 55%)", glow: "hsl(180, 70%, 45%)" },
};

export function BrainForceGraph({
  nodes,
  links,
  focusNodeId,
  onNodeClick,
  hiddenTypes,
  depth,
}: BrainForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(width, 300), height: Math.max(height, 300) });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Build adjacency map
    const adjacency = new Map<string, Set<string>>();
    for (const link of links) {
      const s = link.source as string;
      const t = link.target as string;
      if (!adjacency.has(s)) adjacency.set(s, new Set());
      if (!adjacency.has(t)) adjacency.set(t, new Set());
      adjacency.get(s)!.add(t);
      adjacency.get(t)!.add(s);
    }

    // Compute ego network
    let visibleIds: Set<string>;
    const hopDistances = new Map<string, number>();

    if (focusNodeId) {
      visibleIds = new Set([focusNodeId]);
      hopDistances.set(focusNodeId, 0);

      // 1-hop
      const hop1 = adjacency.get(focusNodeId) || new Set();
      for (const id of hop1) {
        if (!hiddenTypes.has(nodes.find(n => n.id === id)?.type || "")) {
          visibleIds.add(id);
          hopDistances.set(id, 1);
        }
      }

      // 2-hop (if depth === 2)
      if (depth === 2) {
        const hop1Array = [...hop1];
        for (const h1 of hop1Array) {
          const hop2 = adjacency.get(h1) || new Set();
          let count = 0;
          for (const id of hop2) {
            if (visibleIds.has(id)) continue;
            const nodeType = nodes.find(n => n.id === id)?.type || "";
            if (hiddenTypes.has(nodeType)) continue;
            // Cap per type at 2-hop
            if (nodeType === "meta_tag" && count > 5) continue;
            visibleIds.add(id);
            hopDistances.set(id, 2);
            count++;
          }
        }
      }
    } else {
      // No focus: show all projects + their direct species/investigators
      visibleIds = new Set<string>();
      for (const n of nodes) {
        if (n.type === "project") {
          visibleIds.add(n.id);
          hopDistances.set(n.id, 0);
          const neighbors = adjacency.get(n.id) || new Set();
          for (const nid of neighbors) {
            const nn = nodes.find(nd => nd.id === nid);
            if (nn && (nn.type === "species" || nn.type === "investigator") && !hiddenTypes.has(nn.type)) {
              visibleIds.add(nid);
              hopDistances.set(nid, 1);
            }
          }
        }
      }
    }

    // Filter by hidden types
    const visibleNodes = nodes.filter(n => visibleIds.has(n.id) && !hiddenTypes.has(n.type));
    const visibleLinks = links.filter(l =>
      visibleIds.has(l.source as string) && visibleIds.has(l.target as string) &&
      !hiddenTypes.has(nodes.find(n => n.id === l.source)?.type || "") &&
      !hiddenTypes.has(nodes.find(n => n.id === l.target)?.type || "")
    );

    // Count nodes per type for home position calculation
    const typeCounters: Record<string, { count: number; index: number }> = {};
    for (const n of visibleNodes) {
      if (!typeCounters[n.type]) typeCounters[n.type] = { count: 0, index: 0 };
      typeCounters[n.type].count++;
    }

    const simNodes: SimNode[] = visibleNodes.map(d => {
      const tc = typeCounters[d.type];
      const home = getHomePosition(d.type, tc.index, tc.count, width, height);
      tc.index++;
      const hopDist = hopDistances.get(d.id) ?? 2;
      return {
        ...d,
        x: home.x + (Math.random() - 0.5) * 30,
        y: home.y + (Math.random() - 0.5) * 30,
        homeX: home.x,
        homeY: home.y,
        isFocus: d.id === focusNodeId,
        hopDistance: hopDist,
        radius: d.id === focusNodeId ? d.radius * 1.6 : hopDist === 1 ? d.radius : d.radius * 0.7,
      };
    });

    const simLinks: SimLink[] = visibleLinks.map(d => ({ ...d }));

    // --- SVG setup ---
    const defs = svg.append("defs");

    // Glow filter
    const glowFilter = defs.append("filter")
      .attr("id", "node-glow")
      .attr("x", "-60%").attr("y", "-60%")
      .attr("width", "220%").attr("height", "220%");
    glowFilter.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", "3").attr("result", "blur");
    glowFilter.append("feMerge")
      .selectAll("feMergeNode")
      .data(["blur", "SourceGraphic"])
      .join("feMergeNode").attr("in", d => d);

    // Focus glow
    const focusFilter = defs.append("filter")
      .attr("id", "focus-glow")
      .attr("x", "-80%").attr("y", "-80%")
      .attr("width", "260%").attr("height", "260%");
    focusFilter.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", "6").attr("result", "blur");
    focusFilter.append("feMerge")
      .selectAll("feMergeNode")
      .data(["blur", "blur", "SourceGraphic"])
      .join("feMergeNode").attr("in", d => d);

    // Radial gradients
    Object.entries(GLOW_COLORS).forEach(([type, colors]) => {
      const grad = defs.append("radialGradient").attr("id", `bg-${type}`);
      grad.append("stop").attr("offset", "0%").attr("stop-color", colors.fill).attr("stop-opacity", 1);
      grad.append("stop").attr("offset", "70%").attr("stop-color", colors.fill).attr("stop-opacity", 0.8);
      grad.append("stop").attr("offset", "100%").attr("stop-color", colors.glow).attr("stop-opacity", 0.3);
    });

    const g = svg.append("g");

    // Brain outline (subtle)
    g.append("path")
      .attr("d", getBrainPath(width, height))
      .attr("fill", "none")
      .attr("stroke", "hsl(210, 30%, 18%)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.5);

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Simulation
    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force("link", d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(60).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-120).distanceMax(300))
      .force("collision", d3.forceCollide<SimNode>().radius(d => d.radius + 4))
      // Pull toward brain-region home positions
      .force("homeX", d3.forceX<SimNode>().x(d => d.homeX || width / 2).strength(0.08))
      .force("homeY", d3.forceY<SimNode>().y(d => d.homeY || height / 2).strength(0.08));

    // Links
    const link = g.append("g")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "hsl(210, 30%, 30%)")
      .attr("stroke-opacity", d => {
        const src = simNodes.find(n => n.id === (typeof d.source === "string" ? d.source : d.source.id));
        return src?.isFocus ? 0.4 : 0.12;
      })
      .attr("stroke-width", d => {
        const src = simNodes.find(n => n.id === (typeof d.source === "string" ? d.source : d.source.id));
        return src?.isFocus ? 1.2 : 0.6;
      });

    // Ambient glow
    const glowLayer = g.append("g");
    const glowCircle = glowLayer
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(simNodes.filter(n => n.hopDistance === 0 || n.hopDistance === 1))
      .join("circle")
      .attr("r", d => d.radius * 2)
      .attr("fill", d => GLOW_COLORS[d.type]?.glow || "hsl(210,50%,50%)")
      .attr("opacity", d => d.isFocus ? 0.15 : 0.06)
      .style("pointer-events", "none");

    // Node groups
    const node = g.append("g")
      .selectAll<SVGGElement, SimNode>("g")
      .data(simNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, SimNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x; d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      );

    // Circles
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => `url(#bg-${d.type})`)
      .attr("filter", d => d.isFocus ? "url(#focus-glow)" : "url(#node-glow)")
      .attr("stroke", d => d.isFocus ? "hsl(0,0%,95%)" : GLOW_COLORS[d.type]?.fill || "hsl(210,50%,50%)")
      .attr("stroke-width", d => d.isFocus ? 2.5 : 0.6)
      .attr("stroke-opacity", d => d.isFocus ? 1 : 0.3)
      .attr("opacity", d => d.hopDistance === 2 ? 0.5 : 1);

    // Labels (only for focus + 1-hop, or project nodes)
    node.filter(d => d.hopDistance! <= 1 || d.type === "project")
      .append("text")
      .text(d => {
        const l = d.label;
        return l.length > 22 ? l.slice(0, 20) + "…" : l;
      })
      .attr("dy", d => d.radius + 12)
      .attr("text-anchor", "middle")
      .attr("fill", d => GLOW_COLORS[d.type]?.fill || "hsl(210,50%,50%)")
      .attr("fill-opacity", d => d.isFocus ? 0.95 : 0.6)
      .attr("font-size", d => d.isFocus ? "11px" : d.type === "project" ? "9px" : "8px")
      .attr("font-weight", d => d.isFocus ? "700" : "400")
      .attr("pointer-events", "none")
      .style("text-shadow", "0 0 8px rgba(0,0,0,0.9)");

    // 2-hop nodes: tooltip only
    node.filter(d => d.hopDistance === 2)
      .append("title")
      .text(d => d.label);

    // Click
    node.on("click", (event, d) => {
      event.stopPropagation();
      onNodeClick(d.id);
    });

    // Hover
    node.on("mouseenter", function(event, d) {
      d3.select(this).select("circle")
        .transition().duration(150)
        .attr("filter", "url(#focus-glow)")
        .attr("stroke", "hsl(0,0%,90%)")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 1);

      // Show tooltip-like label for 2-hop nodes
      if (d.hopDistance === 2) {
        d3.select(this).append("text")
          .attr("class", "hover-label")
          .text(d.label.length > 25 ? d.label.slice(0, 23) + "…" : d.label)
          .attr("dy", d.radius + 12)
          .attr("text-anchor", "middle")
          .attr("fill", GLOW_COLORS[d.type]?.fill || "white")
          .attr("fill-opacity", 0.9)
          .attr("font-size", "8px")
          .attr("pointer-events", "none")
          .style("text-shadow", "0 0 8px rgba(0,0,0,0.9)");
      }

      link.transition().duration(150)
        .attr("stroke-opacity", l =>
          (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id ? 0.5 : 0.05
        )
        .attr("stroke", l =>
          (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id
            ? GLOW_COLORS[d.type]?.fill || "white"
            : "hsl(210, 30%, 30%)"
        );
    }).on("mouseleave", function(event, d) {
      d3.select(this).select("circle")
        .transition().duration(250)
        .attr("filter", d.isFocus ? "url(#focus-glow)" : "url(#node-glow)")
        .attr("stroke", d.isFocus ? "hsl(0,0%,95%)" : GLOW_COLORS[d.type]?.fill || "hsl(210,50%,50%)")
        .attr("stroke-width", d.isFocus ? 2.5 : 0.6)
        .attr("stroke-opacity", d.isFocus ? 1 : 0.3);

      d3.select(this).selectAll(".hover-label").remove();

      link.transition().duration(250)
        .attr("stroke-opacity", l => {
          const src = l.source as SimNode;
          return src.isFocus ? 0.4 : 0.12;
        })
        .attr("stroke", "hsl(210, 30%, 30%)");
    });

    // Tick — constrain to brain on each tick
    simulation.on("tick", () => {
      // Constrain nodes to brain silhouette
      simNodes.forEach(d => {
        if (d.fx != null) return; // don't constrain dragged nodes
        const c = constrainToBrain(d.x!, d.y!, width, height);
        d.x = c.x;
        d.y = c.y;
      });

      link
        .attr("x1", d => (d.source as SimNode).x!)
        .attr("y1", d => (d.source as SimNode).y!)
        .attr("x2", d => (d.target as SimNode).x!)
        .attr("y2", d => (d.target as SimNode).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
      glowCircle.attr("cx", d => d.x!).attr("cy", d => d.y!);
    });

    // Center view
    setTimeout(() => {
      svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.9));
    }, 300);

    return () => { simulation.stop(); };
  }, [nodes, links, dimensions, focusNodeId, hiddenTypes, depth]);

  return (
    <div ref={containerRef} className="w-full h-full" style={{ background: "hsl(220, 40%, 8%)" }}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
    </div>
  );
}
