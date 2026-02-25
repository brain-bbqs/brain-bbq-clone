import { useState, useMemo, useCallback } from "react";
import { useKnowledgeGraphData } from "@/hooks/useKnowledgeGraphData";
import type { GraphNode } from "@/hooks/useKnowledgeGraphData";
import { BrainForceGraph } from "@/components/knowledge-graph/BrainForceGraph";
import { GraphSearchPanel } from "@/components/knowledge-graph/GraphSearchPanel";
import { GraphDetailPanel } from "@/components/knowledge-graph/GraphDetailPanel";
import { Loader2 } from "lucide-react";

export default function KnowledgeGraphViz() {
  const { data: graphData, isLoading } = useKnowledgeGraphData();

  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<GraphNode[]>([]);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [depth, setDepth] = useState<1 | 2>(1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const nodeMap = useMemo(() => {
    if (!graphData) return new Map<string, GraphNode>();
    return new Map(graphData.nodes.map(n => [n.id, n]));
  }, [graphData]);

  const navigateToNode = useCallback((nodeId: string) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    setFocusNodeId(nodeId);
    setSelectedNode(node);

    setBreadcrumbs(prev => {
      // If clicking an existing breadcrumb, trim to it
      const existingIdx = prev.findIndex(b => b.id === nodeId);
      if (existingIdx >= 0) return prev.slice(0, existingIdx + 1);
      // Otherwise append
      return [...prev.slice(-8), node]; // Cap at 9
    });
  }, [nodeMap]);

  const handleBreadcrumbClick = useCallback((index: number) => {
    const node = breadcrumbs[index];
    if (node) {
      setFocusNodeId(node.id);
      setSelectedNode(node);
      setBreadcrumbs(prev => prev.slice(0, index + 1));
    }
  }, [breadcrumbs]);

  const handleToggleType = useCallback((type: string) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (isLoading || !graphData) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center" style={{ background: "hsl(220, 40%, 8%)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(210,20%,40%)]" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Left: Search + Filters + Breadcrumbs */}
      <div className="w-56 shrink-0">
        <GraphSearchPanel
          nodes={graphData.nodes}
          focusNodeId={focusNodeId}
          onFocusNode={navigateToNode}
          breadcrumbs={breadcrumbs}
          onBreadcrumbClick={handleBreadcrumbClick}
          hiddenTypes={hiddenTypes}
          onToggleType={handleToggleType}
          depth={depth}
          onDepthChange={setDepth}
        />
      </div>

      {/* Center: Brain-shaped graph */}
      <div className="flex-1 min-w-0">
        <BrainForceGraph
          nodes={graphData.nodes}
          links={graphData.links}
          focusNodeId={focusNodeId}
          onNodeClick={navigateToNode}
          hiddenTypes={hiddenTypes}
          depth={depth}
        />
      </div>

      {/* Right: Detail Panel */}
      <div className="w-72 shrink-0">
        <GraphDetailPanel
          node={selectedNode}
          allNodes={graphData.nodes}
          links={graphData.links}
          onClose={handleCloseDetail}
          onNavigate={navigateToNode}
        />
      </div>
    </div>
  );
}
