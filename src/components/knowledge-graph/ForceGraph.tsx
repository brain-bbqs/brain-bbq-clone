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

export function ForceGraph({ nodes, links, onNodeClick, selectedNodeId, filterType }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Observe container size
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
      // Also include connected project nodes
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

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Simulation
    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force("link", d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(80).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SimNode>().radius(d => d.radius + 4))
      .force("x", d3.forceX(width / 2).strength(0.03))
      .force("y", d3.forceY(height / 2).strength(0.03));

    simulationRef.current = simulation;

    // Links
    const link = g.append("g")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "hsl(0, 0%, 40%)")
      .attr("stroke-opacity", 0.25)
      .attr("stroke-width", 1);

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
      .attr("fill", d => d.color)
      .attr("stroke", d => d.id === selectedNodeId ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 20%)")
      .attr("stroke-width", d => d.id === selectedNodeId ? 3 : 1.5)
      .attr("opacity", 0.9);

    // Labels
    node.append("text")
      .text(d => d.label)
      .attr("dy", d => d.radius + 12)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(0, 0%, 70%)")
      .attr("font-size", d => d.type === "project" ? "10px" : d.type === "meta_tag" ? "8px" : "9px")
      .attr("pointer-events", "none")
      .each(function(d) {
        // Truncate long labels
        const text = d3.select(this);
        const label = d.label;
        if (label.length > 25) {
          text.text(label.slice(0, 22) + "...");
        }
      });

    // Click handler
    node.on("click", (event, d) => {
      event.stopPropagation();
      onNodeClick(d);
    });

    // Hover effects
    node.on("mouseenter", function(event, d) {
      d3.select(this).select("circle")
        .transition().duration(150)
        .attr("stroke", "hsl(0, 0%, 100%)")
        .attr("stroke-width", 2.5);

      // Highlight connected links
      link.attr("stroke-opacity", l =>
        (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id ? 0.7 : 0.1
      ).attr("stroke", l =>
        (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id ? d.color : "hsl(0, 0%, 40%)"
      );
    }).on("mouseleave", function() {
      d3.select(this).select("circle")
        .transition().duration(150)
        .attr("stroke", (d: any) => d.id === selectedNodeId ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 20%)")
        .attr("stroke-width", (d: any) => d.id === selectedNodeId ? 3 : 1.5);

      link.attr("stroke-opacity", 0.25).attr("stroke", "hsl(0, 0%, 40%)");
    });

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as SimNode).x!)
        .attr("y1", d => (d.source as SimNode).y!)
        .attr("x2", d => (d.target as SimNode).x!)
        .attr("y2", d => (d.target as SimNode).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Initial zoom to fit
    setTimeout(() => {
      svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.8));
    }, 500);

    return () => {
      simulation.stop();
    };
  }, [nodes, links, dimensions, selectedNodeId, onNodeClick, filterType]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
    </div>
  );
}
