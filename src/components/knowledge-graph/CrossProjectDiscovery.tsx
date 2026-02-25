import { useMemo } from "react";
import { Link2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GraphData, GraphNode } from "@/hooks/useKnowledgeGraphData";

interface CrossProjectDiscoveryProps {
  currentProjectId: string;
  graphData: GraphData;
}

interface SharedConnection {
  sharedNodeLabel: string;
  sharedNodeType: string;
  projects: { id: string; label: string }[];
}

export function CrossProjectDiscovery({ currentProjectId, graphData }: CrossProjectDiscoveryProps) {
  const connections = useMemo(() => {
    if (!graphData) return [];

    // Find all nodes connected to the current project
    const myLinks = graphData.links.filter(
      l => (l.source as any)?.id === currentProjectId || l.source === currentProjectId ||
           (l.target as any)?.id === currentProjectId || l.target === currentProjectId
    );

    const myConnectedNodeIds = new Set(
      myLinks.map(l => {
        const sId = typeof l.source === "object" ? (l.source as any).id : l.source;
        const tId = typeof l.target === "object" ? (l.target as any).id : l.target;
        return sId === currentProjectId ? tId : sId;
      })
    );

    // For each connected non-project node, find OTHER projects also connected to it
    const shared: SharedConnection[] = [];
    const nodeMap = new Map(graphData.nodes.map(n => [n.id, n]));

    for (const nodeId of myConnectedNodeIds) {
      const node = nodeMap.get(nodeId);
      if (!node || node.type === "project") continue;

      const otherProjects = graphData.links
        .filter(l => {
          const sId = typeof l.source === "object" ? (l.source as any).id : l.source;
          const tId = typeof l.target === "object" ? (l.target as any).id : l.target;
          return (sId === nodeId || tId === nodeId) &&
                 (sId !== currentProjectId && tId !== currentProjectId);
        })
        .map(l => {
          const sId = typeof l.source === "object" ? (l.source as any).id : l.source;
          const tId = typeof l.target === "object" ? (l.target as any).id : l.target;
          const projId = sId === nodeId ? tId : sId;
          const projNode = nodeMap.get(projId);
          return projNode?.type === "project" ? { id: projId, label: projNode.label } : null;
        })
        .filter(Boolean) as { id: string; label: string }[];

      if (otherProjects.length > 0) {
        shared.push({
          sharedNodeLabel: node.label,
          sharedNodeType: node.type,
          projects: otherProjects,
        });
      }
    }

    // Sort by most shared connections first
    return shared.sort((a, b) => b.projects.length - a.projects.length).slice(0, 8);
  }, [currentProjectId, graphData]);

  if (connections.length === 0) return null;

  const typeColors: Record<string, string> = {
    species: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    investigator: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    meta_tag: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Shared Connections
        </p>
        <Badge variant="secondary" className="text-[10px] ml-auto">{connections.length}</Badge>
      </div>

      <div className="space-y-2">
        {connections.map((conn, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <Badge
              variant="outline"
              className={`shrink-0 text-[10px] ${typeColors[conn.sharedNodeType] || "bg-muted text-muted-foreground"}`}
            >
              {conn.sharedNodeLabel}
            </Badge>
            <span className="text-muted-foreground flex items-center gap-1 flex-wrap">
              <ArrowRight className="h-3 w-3 shrink-0" />
              {conn.projects.length} other project{conn.projects.length !== 1 ? "s" : ""}
              <span className="text-foreground/60">
                ({conn.projects.slice(0, 2).map(p => p.label).join(", ")}
                {conn.projects.length > 2 ? ` +${conn.projects.length - 2}` : ""})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
