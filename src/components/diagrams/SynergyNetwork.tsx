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

type FilterType = "all" | SynergyLink["synergyType"];

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

  // Build neighbor set for hover highlighting
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
          n.grantType === "U01" ? 28 : n.grantType === "U24" || n.grantType === "R24" ? 24 : 20;

        return {
          id: n.id,
          size,
          color: dimmed ? `${n.color}33` : n.color,
          caption: n.shortName.split(" – ").pop() || n.shortName,
          captionSize: 3,
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
          color: dimmed ? `${color}22` : color,
          width: dimmed ? 1 : 2,
          caption: l.synergyType,
          captionSize: 2.5,
        };
      }),
    [filteredLinks, highlightSet]
  );

  // Tooltip helpers
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
      <div className="relative border border-border rounded-lg overflow-hidden bg-card" style={{ height: 600 }}>
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
        {tooltip && (tooltipNode || tooltipLink) && (
          <div
            className="fixed z-[9999] pointer-events-none bg-popover border border-border rounded-lg shadow-lg p-3 max-w-sm text-xs"
            style={{
              left: tooltip.x + 14,
              top: tooltip.y - 20,
            }}
          >
            {tooltipNode && (
              <>
                <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: tooltipNode.color }}
                  />
                  {tooltipNode.shortName}
                </div>
                <p className="text-muted-foreground">{tooltipNode.l1Goal}</p>
                <div className="flex gap-2 mt-1.5 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium">
                    {tooltipNode.grantType}
                  </span>
                  <span className="text-muted-foreground">{tooltipNode.species}</span>
                </div>
              </>
            )}
            {tooltipLink && (
              <>
                <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: SYNERGY_TYPE_COLORS[tooltipLink.synergyType],
                    }}
                  />
                  {findNode(tooltipLink.source)?.shortName} → {findNode(tooltipLink.target)?.shortName}
                </div>
                <p className="text-muted-foreground leading-relaxed">{tooltipLink.description}</p>
                <span
                  className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    background: SYNERGY_TYPE_COLORS[tooltipLink.synergyType] + "22",
                    color: SYNERGY_TYPE_COLORS[tooltipLink.synergyType],
                  }}
                >
                  {tooltipLink.synergyType}
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
