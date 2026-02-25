import { useState, useCallback, useMemo } from "react";
import { ForceGraph } from "@/components/knowledge-graph/ForceGraph";
import { NodeDrawer } from "@/components/knowledge-graph/NodeDrawer";
import { GraphLegend } from "@/components/knowledge-graph/GraphLegend";
import { GraphAnalytics } from "@/components/knowledge-graph/GraphAnalytics";
import { useKnowledgeGraphData } from "@/hooks/useKnowledgeGraphData";
import type { GraphNode } from "@/hooks/useKnowledgeGraphData";
import { Loader2, Network } from "lucide-react";

export default function MetadataAssistant() {
  const { data: graphData, isLoading } = useKnowledgeGraphData();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(true);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const nodeCounts = useMemo(() => {
    if (!graphData) return {};
    const counts: Record<string, number> = {};
    for (const node of graphData.nodes) {
      counts[node.type] = (counts[node.type] || 0) + 1;
    }
    return counts;
  }, [graphData]);

  if (isLoading || !graphData) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Building knowledge graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-background relative overflow-hidden">
      {/* Header bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg">
          <Network className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">Knowledge Graph</h1>
          <span className="text-xs text-muted-foreground ml-1">
            {graphData.nodes.length} nodes · {graphData.links.length} edges
          </span>
        </div>
      </div>

      {/* Graph Analytics panel */}
      {showAnalytics && (
        <div className="absolute top-16 left-4 z-10 w-56">
          <GraphAnalytics graphData={graphData} />
        </div>
      )}

      {/* D3 Force Graph */}
      <ForceGraph
        nodes={graphData.nodes}
        links={graphData.links}
        onNodeClick={handleNodeClick}
        selectedNodeId={selectedNode?.id}
        filterType={filterType}
      />

      {/* Legend / filter bar */}
      <GraphLegend
        activeFilter={filterType}
        onFilterChange={setFilterType}
        nodeCounts={nodeCounts}
      />

      {/* Node detail drawer */}
      {selectedNode && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={handleCloseDrawer}
          />
          <NodeDrawer node={selectedNode} onClose={handleCloseDrawer} graphData={graphData} />
        </>
      )}
    </div>
  );
}
