import { useState, useMemo, useCallback, useRef } from "react";
import { InteractiveNvlWrapper } from "@neo4j-nvl/react";
import type { Node, Relationship } from "@neo4j-nvl/base";
import {
  SYNERGY_NODES,
  SYNERGY_LINKS,
  SYNERGY_TYPE_COLORS,
  type SynergyLink,
} from "@/data/marr-synergies";
import { cn } from "@/lib/utils";
import { SynergyTooltip } from "./synergy/SynergyTooltip";
import { SynergyLegend } from "./synergy/SynergyLegend";
import { SynergyFilters, type FilterType } from "./synergy/SynergyFilters";
import { SynergyStats } from "./synergy/SynergyStats";

interface TooltipData {
  x: number;
  y: number;
  nodeId?: string;
  relId?: string;
}

export function SynergyNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const filteredLinks = useMemo(
    () => SYNERGY_LINKS.filter((l) => filter === "all" || l.synergyType === filter),
    [filter]
  );

  const connectedIds = useMemo(() => {
    const ids = new Set<string>();
    filteredLinks.forEach((l) => {
      ids.add(l.source);
      ids.add(l.target);
    });
    return ids;
  }, [filteredLinks]);

  const neighborsOf = useCallback(
    (nodeId: string) => {
      const s = new Set<string>();
      s.add(nodeId);
      filteredLinks.forEach((l) => {
        if (l.source === nodeId || l.target === nodeId) {
          s.add(l.source);
          s.add(l.target);
        }
      });
      return s;
    },
    [filteredLinks]
  );

  const highlightSet = useMemo(
    () => (hoveredNodeId ? neighborsOf(hoveredNodeId) : null),
    [hoveredNodeId, neighborsOf]
  );

  const nvlNodes: Node[] = useMemo(
    () =>
      SYNERGY_NODES.map((n) => {
        const dimmed =
          (filter !== "all" && !connectedIds.has(n.id)) ||
          (highlightSet && !highlightSet.has(n.id));

        const size =
          n.grantType === "U01" ? 30 : n.grantType === "U24" || n.grantType === "R24" ? 26 : 22;

        return {
          id: n.id,
          size,
          color: dimmed ? `${n.color}22` : n.color,
          caption: n.shortName.split(" – ").pop() || n.shortName,
          captionSize: 3.5,
        };
      }),
    [filter, connectedIds, highlightSet]
  );

  const nvlRels: Relationship[] = useMemo(
    () =>
      filteredLinks.map((l, i) => {
        const dimmed = highlightSet && !(highlightSet.has(l.source) && highlightSet.has(l.target));
        const color = SYNERGY_TYPE_COLORS[l.synergyType];
        return {
          id: `rel-${i}`,
          from: l.source,
          to: l.target,
          color: dimmed ? `${color}15` : color,
          width: dimmed ? 0.5 : 2.5,
          caption: "",
          captionSize: 0,
        };
      }),
    [filteredLinks, highlightSet]
  );

  const findNode = (id: string) => SYNERGY_NODES.find((n) => n.id === id);
  const findLink = (relId: string) => {
    const idx = parseInt(relId.replace("rel-", ""), 10);
    return filteredLinks[idx];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mouseCallbacks: any = useMemo(
    () => ({
      onHover: (element: any, hitTargets: any, evt: globalThis.MouseEvent) => {
        if (hitTargets?.nodes?.length > 0) {
          const node = hitTargets.nodes[0];
          const nodeId = node.id ?? node.getId?.();
          if (nodeId) {
            setHoveredNodeId(nodeId);
            setTooltip({ x: evt.clientX, y: evt.clientY, nodeId });
          }
        } else if (hitTargets?.relationships?.length > 0) {
          const rel = hitTargets.relationships[0];
          const relId = rel.id ?? rel.getId?.();
          if (relId) {
            setTooltip({ x: evt.clientX, y: evt.clientY, relId });
          }
          setHoveredNodeId(null);
        } else {
          setHoveredNodeId(null);
          setTooltip(null);
        }
      },
      onZoom: true,
      onPan: true,
      onDrag: true,
    }),
    []
  );

  const tooltipNode = tooltip?.nodeId ? findNode(tooltip.nodeId) : null;
  const tooltipLink = tooltip?.relId ? findLink(tooltip.relId) : null;

  return (
    <div ref={containerRef} className="relative w-full space-y-4">
      {/* Stats bar */}
      <SynergyStats
        totalNodes={SYNERGY_NODES.length}
        totalEdges={SYNERGY_LINKS.length}
        filteredEdges={filteredLinks.length}
        connectedNodes={connectedIds.size}
        filter={filter}
      />

      {/* Filters */}
      <SynergyFilters filter={filter} onFilterChange={setFilter} />

      {/* Network */}
      <div
        className="relative rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg"
        style={{ height: 620 }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <InteractiveNvlWrapper
          nodes={nvlNodes}
          rels={nvlRels}
          mouseEventCallbacks={mouseCallbacks}
          nvlOptions={{
            initialZoom: 1,
            layout: "forceDirected",
            renderer: "canvas",
            styling: {
              defaultNodeColor: "hsl(var(--muted))",
              defaultRelationshipColor: "hsl(var(--border))",
            },
          }}
        />

        {/* Tooltip */}
        <SynergyTooltip
          tooltip={tooltip}
          tooltipNode={tooltipNode}
          tooltipLink={tooltipLink}
          findNode={findNode}
        />
      </div>

      {/* Legend */}
      <SynergyLegend />
    </div>
  );
}
