import { X, ExternalLink, Users, FileText, Bug, Tag, Package, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GraphNode, GraphLink } from "@/hooks/useKnowledgeGraphData";

const TYPE_ICONS: Record<string, any> = {
  project: FolderOpen,
  species: Bug,
  investigator: Users,
  meta_tag: Tag,
  publication: FileText,
  resource: Package,
};

const TYPE_COLORS: Record<string, string> = {
  project: "hsl(210, 85%, 60%)",
  species: "hsl(140, 70%, 55%)",
  investigator: "hsl(35, 90%, 60%)",
  meta_tag: "hsl(280, 65%, 65%)",
  publication: "hsl(350, 75%, 60%)",
  resource: "hsl(180, 65%, 55%)",
};

const TYPE_LABELS: Record<string, string> = {
  project: "Project",
  species: "Species",
  investigator: "Investigator",
  meta_tag: "Meta Tag",
  publication: "Publication",
  resource: "Resource",
};

interface GraphDetailPanelProps {
  node: GraphNode | null;
  allNodes: GraphNode[];
  links: GraphLink[];
  onClose: () => void;
  onNavigate: (nodeId: string) => void;
}

export function GraphDetailPanel({ node, allNodes, links, onClose, onNavigate }: GraphDetailPanelProps) {
  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[hsl(220,35%,10%)] border-l border-[hsl(210,30%,18%)] px-6">
        <div className="h-14 w-14 rounded-2xl bg-[hsl(220,30%,14%)] flex items-center justify-center mb-4">
          <FolderOpen className="h-6 w-6 text-[hsl(210,20%,30%)]" />
        </div>
        <p className="text-sm font-medium text-[hsl(210,20%,60%)]">No node selected</p>
        <p className="text-[11px] text-[hsl(210,20%,40%)] mt-1 text-center">Click a node in the graph or search to view details</p>
      </div>
    );
  }

  const Icon = TYPE_ICONS[node.type] || Tag;
  const color = TYPE_COLORS[node.type] || "hsl(210, 50%, 50%)";

  // Find connected nodes grouped by type
  const connectedByType = new Map<string, { node: GraphNode; relationship: string }[]>();
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));

  for (const link of links) {
    const srcId = typeof link.source === "string" ? link.source : (link.source as any).id;
    const tgtId = typeof link.target === "string" ? link.target : (link.target as any).id;

    let connectedId: string | null = null;
    if (srcId === node.id) connectedId = tgtId;
    else if (tgtId === node.id) connectedId = srcId;

    if (connectedId) {
      const connected = nodeMap.get(connectedId);
      if (connected) {
        const group = connectedByType.get(connected.type) || [];
        group.push({ node: connected, relationship: link.label || link.type });
        connectedByType.set(connected.type, group);
      }
    }
  }

  const meta = node.metadata || {};

  return (
    <div className="h-full flex flex-col bg-[hsl(220,35%,10%)] border-l border-[hsl(210,30%,18%)]">
      {/* Header */}
      <div className="p-4 border-b border-[hsl(210,30%,18%)] shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div className="min-w-0">
              <Badge
                variant="secondary"
                className="text-[9px] mb-1 border-0"
                style={{ backgroundColor: `${color}15`, color }}
              >
                {TYPE_LABELS[node.type]}
              </Badge>
              <h3 className="text-sm font-semibold text-[hsl(210,20%,90%)] leading-tight break-words">
                {node.label}
              </h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 shrink-0 text-[hsl(210,20%,45%)] hover:text-[hsl(210,20%,80%)]"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Project-specific metadata */}
          {node.type === "project" && meta.abstract && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[hsl(210,20%,40%)] mb-1 font-semibold">Abstract</p>
              <p className="text-[11px] text-[hsl(210,20%,65%)] leading-relaxed line-clamp-6">
                {meta.abstract}
              </p>
            </div>
          )}

          {node.type === "project" && meta.nih_link && (
            <a
              href={meta.nih_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[hsl(210,85%,65%)] hover:text-[hsl(210,85%,80%)] transition-colors"
            >
              View on NIH Reporter <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {node.type === "investigator" && meta.orcid && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[hsl(210,20%,40%)] mb-1 font-semibold">ORCID</p>
              <p className="text-[11px] text-[hsl(210,20%,65%)]">{meta.orcid}</p>
            </div>
          )}

          {node.type === "publication" && meta.journal && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[hsl(210,20%,40%)] mb-1 font-semibold">Journal</p>
              <p className="text-[11px] text-[hsl(210,20%,65%)]">{meta.journal} ({meta.year})</p>
            </div>
          )}

          {/* Connected nodes by type */}
          {Array.from(connectedByType.entries()).map(([type, connected]) => {
            const TypeIcon = TYPE_ICONS[type] || Tag;
            const typeColor = TYPE_COLORS[type];
            return (
              <div key={type}>
                <p className="text-[9px] uppercase tracking-wider text-[hsl(210,20%,40%)] mb-1.5 font-semibold flex items-center gap-1">
                  <TypeIcon className="h-2.5 w-2.5" style={{ color: typeColor }} />
                  {TYPE_LABELS[type]}s ({connected.length})
                </p>
                <div className="space-y-0.5">
                  {connected.slice(0, 10).map(({ node: cn, relationship }) => (
                    <button
                      key={cn.id}
                      onClick={() => onNavigate(cn.id)}
                      className="w-full text-left px-2 py-1.5 rounded-md text-[11px] flex items-center gap-2 hover:bg-[hsl(220,30%,16%)] transition-colors group"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: typeColor }}
                      />
                      <span className="text-[hsl(210,20%,70%)] group-hover:text-[hsl(210,20%,90%)] truncate flex-1">
                        {cn.label}
                      </span>
                      <span className="text-[8px] text-[hsl(210,20%,35%)] shrink-0">{relationship}</span>
                    </button>
                  ))}
                  {connected.length > 10 && (
                    <p className="text-[10px] text-[hsl(210,20%,40%)] px-2 py-1">
                      + {connected.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {connectedByType.size === 0 && (
            <p className="text-[11px] text-[hsl(210,20%,40%)] text-center py-4">No connections found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
