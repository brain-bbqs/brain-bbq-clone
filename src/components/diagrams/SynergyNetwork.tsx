import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import {
  SYNERGY_NODES,
  SYNERGY_LINKS,
  SYNERGY_TYPE_COLORS,
  type SynergyNode,
  type SynergyLink,
} from "@/data/marr-synergies";
import { cn } from "@/lib/utils";

type FilterType = "all" | SynergyLink["synergyType"];

interface TooltipData {
  x: number;
  y: number;
  node?: SynergyNode;
  link?: { source: SynergyNode; target: SynergyNode; description: string; synergyType: string };
}

interface SimNode extends d3.SimulationNodeDatum, SynergyNode {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  description: string;
  synergyType: SynergyLink["synergyType"];
}

export function SynergyNetwork() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = Math.min(containerRef.current.clientWidth, 1100);
        setDimensions({ width: w, height: Math.max(500, w * 0.65) });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const draw = useCallback(() => {
    if (!svgRef.current) return;
    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const nodes: SimNode[] = SYNERGY_NODES.map((n) => ({ ...n }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = SYNERGY_LINKS
      .filter((l) => filter === "all" || l.synergyType === filter)
      .map((l) => ({
        source: nodeMap.get(l.source)!,
        target: nodeMap.get(l.target)!,
        description: l.description,
        synergyType: l.synergyType,
      }))
      .filter((l) => l.source && l.target);

    // Connected node ids
    const connectedIds = new Set<string>();
    links.forEach((l) => {
      connectedIds.add((l.source as SimNode).id);
      connectedIds.add((l.target as SimNode).id);
    });

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links).distance(120).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(28))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    const g = svg.append("g");

    // Zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => g.attr("transform", event.transform))
    );

    // Arrow markers
    const defs = svg.append("defs");
    Object.entries(SYNERGY_TYPE_COLORS).forEach(([type, color]) => {
      defs
        .append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 22)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", color)
        .attr("d", "M0,-5L10,0L0,5");
    });

    // Links
    const linkSel = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => SYNERGY_TYPE_COLORS[d.synergyType])
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.5)
      .attr("marker-end", (d) => `url(#arrow-${d.synergyType})`)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("stroke-opacity", 1).attr("stroke-width", 3);
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          link: {
            source: d.source as SimNode,
            target: d.target as SimNode,
            description: d.description,
            synergyType: d.synergyType,
          },
        });
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke-opacity", 0.5).attr("stroke-width", 1.5);
        setTooltip(null);
      });

    // Node groups
    const nodeSel = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .call(
        d3.drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("mouseenter", (_, d) => setHoveredId(d.id))
      .on("mouseleave", () => setHoveredId(null));

    // Node circles
    nodeSel
      .append("circle")
      .attr("r", (d) => {
        if (d.grantType === "U01") return 14;
        if (d.grantType === "U24" || d.grantType === "R24") return 12;
        return 10;
      })
      .attr("fill", (d) => d.color)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 1.5)
      .attr("opacity", (d) => (filter !== "all" && !connectedIds.has(d.id) ? 0.2 : 0.9));

    // Grant type indicator ring
    nodeSel
      .filter((d) => d.grantType === "R61")
      .append("circle")
      .attr("r", 13)
      .attr("fill", "none")
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "3,2");

    // Labels
    nodeSel
      .append("text")
      .text((d) => d.shortName.split(" – ").pop() || d.shortName)
      .attr("dy", (d) => {
        if (d.grantType === "U01") return 24;
        if (d.grantType === "U24" || d.grantType === "R24") return 22;
        return 20;
      })
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-size", 9)
      .attr("font-weight", 500)
      .attr("opacity", (d) => (filter !== "all" && !connectedIds.has(d.id) ? 0.15 : 0.9))
      .attr("pointer-events", "none");

    // Tick
    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Hover highlighting
    if (hoveredId) {
      const connToHovered = new Set<string>();
      connToHovered.add(hoveredId);
      links.forEach((l) => {
        const sId = (l.source as SimNode).id;
        const tId = (l.target as SimNode).id;
        if (sId === hoveredId || tId === hoveredId) {
          connToHovered.add(sId);
          connToHovered.add(tId);
        }
      });

      nodeSel.select("circle").attr("opacity", (d) => (connToHovered.has(d.id) ? 1 : 0.1));
      nodeSel.select("text").attr("opacity", (d) => (connToHovered.has(d.id) ? 1 : 0.05));
      linkSel.attr("stroke-opacity", (d) => {
        const sId = (d.source as SimNode).id;
        const tId = (d.target as SimNode).id;
        return sId === hoveredId || tId === hoveredId ? 0.85 : 0.03;
      });
    }

    return () => simulation.stop();
  }, [filter, hoveredId, dimensions]);

  useEffect(() => {
    const cleanup = draw();
    return cleanup;
  }, [draw]);

  const filters: { key: FilterType; label: string; color?: string }[] = [
    { key: "all", label: "All Synergies" },
    { key: "algorithmic", label: "Algorithmic", color: SYNERGY_TYPE_COLORS.algorithmic },
    { key: "hardware", label: "Hardware", color: SYNERGY_TYPE_COLORS.hardware },
    { key: "data", label: "Data", color: SYNERGY_TYPE_COLORS.data },
    { key: "theoretical", label: "Theoretical", color: SYNERGY_TYPE_COLORS.theoretical },
    { key: "infrastructure", label: "Infrastructure", color: SYNERGY_TYPE_COLORS.infrastructure },
  ];

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {f.color && (
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: f.color }}
              />
            )}
            {f.label}
          </button>
        ))}
      </div>

      {/* Network */}
      <div className="relative border border-border rounded-lg overflow-hidden bg-card">
        <svg ref={svgRef} className="w-full" style={{ minHeight: 500 }} />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none bg-popover border border-border rounded-lg shadow-lg p-3 max-w-sm text-xs"
            style={{
              left: Math.min(tooltip.x + 12, dimensions.width - 280),
              top: Math.max(tooltip.y - 20, 10),
            }}
          >
            {tooltip.link && (
              <>
                <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: SYNERGY_TYPE_COLORS[tooltip.link.synergyType as keyof typeof SYNERGY_TYPE_COLORS] }}
                  />
                  {tooltip.link.source.shortName} → {tooltip.link.target.shortName}
                </div>
                <p className="text-muted-foreground leading-relaxed">{tooltip.link.description}</p>
                <span
                  className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    background: SYNERGY_TYPE_COLORS[tooltip.link.synergyType as keyof typeof SYNERGY_TYPE_COLORS] + "22",
                    color: SYNERGY_TYPE_COLORS[tooltip.link.synergyType as keyof typeof SYNERGY_TYPE_COLORS],
                  }}
                >
                  {tooltip.link.synergyType}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-col sm:flex-row justify-center gap-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-muted border border-border" />
          <span><strong>R34</strong> Planning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-muted border border-border border-dashed" />
          <span><strong>R61</strong> Translational</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-muted border border-border" />
          <span><strong>U01</strong> Cooperative</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted border border-border" />
          <span><strong>U24/R24</strong> Infrastructure</span>
        </div>
      </div>
    </div>
  );
}
