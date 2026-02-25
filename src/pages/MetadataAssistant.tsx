import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectPicker } from "@/components/metadata-assistant/ProjectPicker";
import { AssistantChat } from "@/components/metadata-assistant/AssistantChat";
import { MetadataTable } from "@/components/metadata-assistant/MetadataTable";
import { ForceGraph } from "@/components/knowledge-graph/ForceGraph";
import { GraphLegend } from "@/components/knowledge-graph/GraphLegend";
import { useKnowledgeGraphData } from "@/hooks/useKnowledgeGraphData";
import { useMetadataChat } from "@/hooks/useMetadataChat";
import type { GraphNode } from "@/hooks/useKnowledgeGraphData";
import { Network, Sparkles, Loader2 } from "lucide-react";

export default function MetadataAssistant() {
  const [grantNumber, setGrantNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("assistant");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const { data: grantTitle } = useQuery({
    queryKey: ["grant-title", grantNumber],
    queryFn: async () => {
      if (!grantNumber) return null;
      const { data } = await supabase
        .from("grants")
        .select("title")
        .eq("grant_number", grantNumber)
        .maybeSingle();
      return data?.title || null;
    },
    enabled: !!grantNumber,
  });

  const { messages, isLoading, completeness, fieldsUpdated, sendMessage, clearChat } = useMetadataChat(grantNumber);
  const { data: graphData, isLoading: graphLoading } = useKnowledgeGraphData();

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
      {/* Top bar: project picker + tabs */}
      <div className="border-b border-border px-4 py-3 shrink-0 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:max-w-md">
          <ProjectPicker value={grantNumber} onChange={setGrantNumber} />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="sm:ml-auto">
          <TabsList>
            <TabsTrigger value="assistant" className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Metadata Assistant
            </TabsTrigger>
            <TabsTrigger value="graph" className="gap-1.5 text-xs">
              <Network className="h-3.5 w-3.5" />
              Knowledge Graph
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab content */}
      {activeTab === "assistant" && (
        <div className="flex-1 flex min-h-0">
          {/* Chat panel */}
          <div className="w-full lg:w-1/2 xl:w-[55%] border-r border-border flex flex-col min-h-0">
            <AssistantChat
              messages={messages}
              isLoading={isLoading}
              completeness={completeness}
              onSend={sendMessage}
              onClear={clearChat}
              projectTitle={grantTitle || undefined}
            />
          </div>

          {/* Metadata table panel */}
          <div className="hidden lg:flex flex-col flex-1 min-h-0 overflow-auto px-4 py-3">
            {grantNumber ? (
              <MetadataTable grantNumber={grantNumber} highlightFields={fieldsUpdated} />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Select a project to view metadata
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "graph" && (
        <div className="flex-1 relative min-h-0">
          {graphLoading || !graphData ? (
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
      )}
    </div>
  );
}
