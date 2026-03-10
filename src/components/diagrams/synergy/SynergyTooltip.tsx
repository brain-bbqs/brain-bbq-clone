import { SYNERGY_TYPE_COLORS, type SynergyLink, type SynergyNode } from "@/data/marr-synergies";

interface TooltipData {
  x: number;
  y: number;
  nodeId?: string;
  relId?: string;
}

interface SynergyTooltipProps {
  tooltip: TooltipData | null;
  tooltipNode: SynergyNode | undefined | null;
  tooltipLink: SynergyLink | undefined | null;
  findNode: (id: string) => SynergyNode | undefined;
}

export function SynergyTooltip({ tooltip, tooltipNode, tooltipLink, findNode }: SynergyTooltipProps) {
  if (!tooltip || (!tooltipNode && !tooltipLink)) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none bg-popover/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-3.5 max-w-xs text-xs animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: tooltip.x + 14,
        top: tooltip.y - 20,
      }}
    >
      {tooltipNode && (
        <>
          <div className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/10"
              style={{ background: tooltipNode.color }}
            />
            <span className="truncate">{tooltipNode.shortName}</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">{tooltipNode.l1Goal}</p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
            <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-mono font-semibold text-[10px]">
              {tooltipNode.grantType}
            </span>
            <span className="text-muted-foreground text-[10px]">
              {tooltipNode.species}
            </span>
          </div>
        </>
      )}
      {tooltipLink && (
        <>
          <div className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: SYNERGY_TYPE_COLORS[tooltipLink.synergyType] }}
            />
            <span className="truncate">
              {findNode(tooltipLink.source)?.shortName} → {findNode(tooltipLink.target)?.shortName}
            </span>
          </div>
          <p className="text-muted-foreground leading-relaxed">{tooltipLink.description}</p>
          <span
            className="inline-block mt-2 px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: SYNERGY_TYPE_COLORS[tooltipLink.synergyType] + "18",
              color: SYNERGY_TYPE_COLORS[tooltipLink.synergyType],
            }}
          >
            {tooltipLink.synergyType}
          </span>
        </>
      )}
    </div>
  );
}
