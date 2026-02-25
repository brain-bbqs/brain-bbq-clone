import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GraphData } from "@/hooks/useKnowledgeGraphData";

interface GraphAnalyticsProps {
  graphData: GraphData;
}

interface NodeMetric {
  id: string;
  label: string;
  type: string;
  degree: number;
  color: string;
}

export function GraphAnalytics({ graphData }: GraphAnalyticsProps) {
  const metrics = useMemo(() => {
    if (!graphData) return { topNodes: [], clusters: 0, avgDegree: 0, isolatedCount: 0 };

    // Calculate degree for each node
    const degreeMap = new Map<string, number>();
    for (const node of graphData.nodes) {
      degreeMap.set(node.id, 0);
    }
    for (const link of graphData.links) {
      const sId = typeof link.source === "object" ? (link.source as any).id : link.source;
      const tId = typeof link.target === "object" ? (link.target as any).id : link.target;
      degreeMap.set(sId, (degreeMap.get(sId) || 0) + 1);
      degreeMap.set(tId, (degreeMap.get(tId) || 0) + 1);
    }

    const nodeMap = new Map(graphData.nodes.map(n => [n.id, n]));
    const nodeMetrics: NodeMetric[] = [];
    let totalDegree = 0;
    let isolatedCount = 0;

    for (const [id, degree] of degreeMap) {
      const node = nodeMap.get(id);
      if (!node) continue;
      totalDegree += degree;
      if (degree === 0) isolatedCount++;
      nodeMetrics.push({ id, label: node.label, type: node.type, degree, color: node.color });
    }

    // Simple cluster estimation via connected components
    const visited = new Set<string>();
    const adjacency = new Map<string, Set<string>>();
    for (const node of graphData.nodes) {
      adjacency.set(node.id, new Set());
    }
    for (const link of graphData.links) {
      const sId = typeof link.source === "object" ? (link.source as any).id : link.source;
      const tId = typeof link.target === "object" ? (link.target as any).id : link.target;
      adjacency.get(sId)?.add(tId);
      adjacency.get(tId)?.add(sId);
    }

    let clusters = 0;
    for (const nodeId of adjacency.keys()) {
      if (visited.has(nodeId)) continue;
      clusters++;
      const stack = [nodeId];
      while (stack.length) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);
        for (const neighbor of adjacency.get(current) || []) {
          if (!visited.has(neighbor)) stack.push(neighbor);
        }
      }
    }

    const topNodes = nodeMetrics
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 5);

    return {
      topNodes,
      clusters,
      avgDegree: graphData.nodes.length > 0 ? (totalDegree / graphData.nodes.length).toFixed(1) : "0",
      isolatedCount,
    };
  }, [graphData]);

  const typeLabels: Record<string, string> = {
    project: "Project",
    species: "Species",
    investigator: "PI",
    meta_tag: "Tag",
  };

  return (
    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg space-y-2.5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-semibold text-foreground">Graph Analytics</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-bold text-foreground">{metrics.clusters}</p>
          <p className="text-[10px] text-muted-foreground">Clusters</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-bold text-foreground">{metrics.avgDegree}</p>
          <p className="text-[10px] text-muted-foreground">Avg Degree</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-bold text-foreground">{metrics.isolatedCount}</p>
          <p className="text-[10px] text-muted-foreground">Isolated</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Most Connected</p>
        {metrics.topNodes.map((node, i) => (
          <div key={node.id} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-muted-foreground font-mono">{i + 1}</span>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
            <span className="text-foreground truncate flex-1">{node.label}</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
              {node.degree}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
