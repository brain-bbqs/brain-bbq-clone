import { useRef, useEffect, useCallback, useState } from "react";
import * as d3 from "d3";
import type { GraphNode, GraphLink } from "@/hooks/useKnowledgeGraphData";

interface ForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick: (node: GraphNode) => void;
  selectedNodeId?: string | null;
  filterType?: string | null;
}

interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink extends GraphLink {
  source: any;
  target: any;
}

// Vibrant, saturated colors for the dark canvas
const GLOW_COLORS: Record<string, { fill: string; glow: string }> = {
  project:      { fill: "hsl(210, 85%, 60%)", glow: "hsl(210, 90%, 50%)" },
  species:      { fill: "hsl(140, 70%, 55%)", glow: "hsl(140, 80%, 45%)" },
  investigator: { fill: "hsl(35, 90%, 60%)",  glow: "hsl(35, 95%, 50%)" },
  meta_tag:     { fill: "hsl(280, 65%, 65%)", glow: "hsl(280, 70%, 55%)" },
  publication:  { fill: "hsl(350, 75%, 60%)", glow: "hsl(350, 80%, 50%)" },
  resource:     { fill: "hsl(180, 65%, 55%)", glow: "hsl(180, 70%, 45%)" },
};

export function ForceGraph({ nodes, links, onNodeClick, selectedNodeId, filterType }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
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

    // Filter nodes and links
    let visibleNodes = nodes;
    let visibleLinks = links;
    if (filterType && filterType !== "all") {
      const nodeIds = new Set(
        nodes.filter(n => n.type === filterType).map(n => n.id)
      );
      for (const link of links) {
        if (nodeIds.has(link.source) || nodeIds.has(link.target)) {
          nodeIds.add(link.source as string);
          nodeIds.add(link.target as string);
        }
      }
      visibleNodes = nodes.filter(n => nodeIds.has(n.id));
      visibleLinks = links.filter(l =>
        nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
      );
    }

    const simNodes: SimNode[] = visibleNodes.map(d => ({ ...d }));
    const simLinks: SimLink[] = visibleLinks.map(d => ({ ...d }));

    // --- SVG Defs for glow filters ---
    const defs = svg.append("defs");

    // Create a glow filter for each type
    Object.entries(GLOW_COLORS).forEach(([type, colors]) => {
      const filter = defs.append("filter")
        .attr("id", `glow-${type}`)
        .attr("x", "-80%").attr("y", "-80%")
        .attr("width", "260%").attr("height", "260%");
      
      filter.append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", "4")
        .attr("result", "blur");
      
      filter.append("feColorMatrix")
        .attr("in", "blur")
        .attr("type", "saturate")
        .attr("values", "2")
        .attr("result", "saturated");
      
      filter.append("feMerge")
        .selectAll("feMergeNode")
        .data(["saturated", "SourceGraphic"])
        .join("feMergeNode")
        .attr("in", d => d);
    });

    // Strong glow for selected node
    const selectedFilter = defs.append("filter")
      .attr("id", "glow-selected")
      .attr("x", "-100%").attr("y", "-100%")
      .attr("width", "300%").attr("height", "300%");
    
    selectedFilter.append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", "8")
      .attr("result", "blur");
    
    selectedFilter.append("feMerge")
      .selectAll("feMergeNode")
      .data(["blur", "blur", "SourceGraphic"])
      .join("feMergeNode")
      .attr("in", d => d);

    // Radial gradient for each type (center bright, edges transparent)
    Object.entries(GLOW_COLORS).forEach(([type, colors]) => {
      const grad = defs.append("radialGradient")
        .attr("id", `grad-${type}`);
      
      grad.append("stop").attr("offset", "0%").attr("stop-color", colors.fill).attr("stop-opacity", 1);
      grad.append("stop").attr("offset", "60%").attr("stop-color", colors.fill).attr("stop-opacity", 0.85);
      grad.append("stop").attr("offset", "100%").attr("stop-color", colors.glow).attr("stop-opacity", 0.4);
    });

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Simulation with stronger clustering
    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force("link", d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(70).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-250).distanceMax(400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SimNode>().radius(d => d.radius + 5))
      .force("x", d3.forceX(width / 2).strength(0.02))
      .force("y", d3.forceY(height / 2).strength(0.02));

    simulationRef.current = simulation;

    // --- Links ---
    const link = g.append("g")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "hsl(210, 30%, 35%)")
      .attr("stroke-opacity", 0.15)
      .attr("stroke-width", 0.8);

    // --- Outer glow circles (behind main nodes) ---
    const glowLayer = g.append("g");
    const glowCircle = glowLayer
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(simNodes)
      .join("circle")
      .attr("r", d => d.radius * 2.2)
      .attr("fill", d => {
        const c = GLOW_COLORS[d.type] || GLOW_COLORS.project;
        return c.glow;
      })
      .attr("opacity", d => d.type === "project" ? 0.12 : 0.08)
      .style("pointer-events", "none");

    // --- Node groups ---
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

    // Main circles with radial gradient
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => `url(#grad-${d.type})`)
      .attr("filter", d => d.id === selectedNodeId ? "url(#glow-selected)" : `url(#glow-${d.type})`)
      .attr("stroke", d => {
        const c = GLOW_COLORS[d.type] || GLOW_COLORS.project;
        return d.id === selectedNodeId ? "hsl(0, 0%, 95%)" : c.fill;
      })
      .attr("stroke-width", d => d.id === selectedNodeId ? 2.5 : 0.8)
      .attr("stroke-opacity", d => d.id === selectedNodeId ? 1 : 0.4);

    // Labels
    node.append("text")
      .text(d => {
        const l = d.label;
        return l.length > 20 ? l.slice(0, 18) + "…" : l;
      })
      .attr("dy", d => d.radius + 13)
      .attr("text-anchor", "middle")
      .attr("fill", d => {
        const c = GLOW_COLORS[d.type] || GLOW_COLORS.project;
        return c.fill;
      })
      .attr("fill-opacity", 0.7)
      .attr("font-size", d => d.type === "project" ? "10px" : d.type === "meta_tag" ? "7px" : "8px")
      .attr("font-weight", d => d.type === "project" ? "600" : "400")
      .attr("pointer-events", "none")
      .style("text-shadow", "0 0 6px rgba(0,0,0,0.8)");

    // Click handler
    node.on("click", (event, d) => {
      event.stopPropagation();
      onNodeClick(d);
    });

    // Hover effects
    node.on("mouseenter", function(event, d) {
      const colors = GLOW_COLORS[d.type] || GLOW_COLORS.project;

      d3.select(this).select("circle")
        .transition().duration(200)
        .attr("filter", "url(#glow-selected)")
        .attr("stroke", "hsl(0, 0%, 90%)")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 1);

      // Brighten label
      d3.select(this).select("text")
        .transition().duration(200)
        .attr("fill-opacity", 1);

      // Highlight connected links
      link.transition().duration(200)
        .attr("stroke-opacity", l =>
          (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id ? 0.6 : 0.05
        )
        .attr("stroke", l =>
          (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id
            ? colors.fill
            : "hsl(210, 30%, 35%)"
        )
        .attr("stroke-width", l =>
          (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id ? 1.5 : 0.8
        );

      // Dim unconnected nodes
      const connectedIds = new Set<string>();
      connectedIds.add(d.id);
      simLinks.forEach(l => {
        const sId = (l.source as SimNode).id || l.source;
        const tId = (l.target as SimNode).id || l.target;
        if (sId === d.id) connectedIds.add(tId as string);
        if (tId === d.id) connectedIds.add(sId as string);
      });

      node.selectAll("circle")
        .transition().duration(200)
        .attr("opacity", (n: any) => connectedIds.has(n.id) ? 1 : 0.15);

      glowCircle.transition().duration(200)
        .attr("opacity", (n: any) => connectedIds.has(n.id) ? 0.2 : 0.02);

    }).on("mouseleave", function() {
      d3.select(this).select("circle")
        .transition().duration(300)
        .attr("filter", (d: any) => d.id === selectedNodeId ? "url(#glow-selected)" : `url(#glow-${d.type})`)
        .attr("stroke", (d: any) => {
          const c = GLOW_COLORS[d.type] || GLOW_COLORS.project;
          return d.id === selectedNodeId ? "hsl(0, 0%, 95%)" : c.fill;
        })
        .attr("stroke-width", (d: any) => d.id === selectedNodeId ? 2.5 : 0.8)
        .attr("stroke-opacity", (d: any) => d.id === selectedNodeId ? 1 : 0.4);

      d3.select(this).select("text")
        .transition().duration(300)
        .attr("fill-opacity", 0.7);

      link.transition().duration(300)
        .attr("stroke-opacity", 0.15)
        .attr("stroke", "hsl(210, 30%, 35%)")
        .attr("stroke-width", 0.8);

      node.selectAll("circle")
        .transition().duration(300)
        .attr("opacity", 1);

      glowCircle.transition().duration(300)
        .attr("opacity", (d: any) => d.type === "project" ? 0.12 : 0.08);
    });

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as SimNode).x!)
        .attr("y1", d => (d.source as SimNode).y!)
        .attr("x2", d => (d.target as SimNode).x!)
        .attr("y2", d => (d.target as SimNode).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
      glowCircle.attr("cx", d => d.x!).attr("cy", d => d.y!);
    });

    // Initial zoom
    setTimeout(() => {
      svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.85));
    }, 500);

    return () => { simulation.stop(); };
  }, [nodes, links, dimensions, selectedNodeId, onNodeClick, filterType]);

  return (
    <div ref={containerRef} className="w-full h-full" style={{ background: "hsl(220, 40%, 8%)" }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}
