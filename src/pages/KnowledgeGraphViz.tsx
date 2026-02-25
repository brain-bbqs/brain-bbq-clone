import { useState, useMemo, useCallback } from "react";
import { ForceGraph } from "@/components/knowledge-graph/ForceGraph";
import { GraphLegend } from "@/components/knowledge-graph/GraphLegend";
import { useKnowledgeGraphData } from "@/hooks/useKnowledgeGraphData";
import type { GraphNode } from "@/hooks/useKnowledgeGraphData";
import { Loader2, Network } from "lucide-react";

export default function KnowledgeGraphViz() {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const { data: graphData, isLoading } = useKnowledgeGraphData();

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  const nodeCounts = useMemo(() => {
    if (!graphData) return {};
    const counts: Record<string, number> = {};
    for (const node of graphData.nodes) {
      counts[node.type] = (counts[node.type] || 0) + 1;
    }
    return counts;
  }, [graphData]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
      <div className="border-b border-border px-5 py-3 shrink-0 bg-card">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Network className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">Knowledge Graph</h1>
            <p className="text-[11px] text-muted-foreground">Interactive visualization of consortium relationships</p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        {isLoading || !graphData ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <ForceGraph
              nodes={graphData.nodes}
              links={graphData.links}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id}
              filterType={filterType}
            />
            <div className="absolute bottom-0 left-0 right-0">
              <GraphLegend
                activeFilter={filterType}
                onFilterChange={setFilterType}
                nodeCounts={nodeCounts}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
