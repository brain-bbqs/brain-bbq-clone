import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectGrid } from "@/components/metadata-assistant/ProjectGrid";
import { AssistantChat } from "@/components/metadata-assistant/AssistantChat";
import { MetadataTable } from "@/components/metadata-assistant/MetadataTable";
import { ForceGraph } from "@/components/knowledge-graph/ForceGraph";
import { GraphLegend } from "@/components/knowledge-graph/GraphLegend";
import { useKnowledgeGraphData } from "@/hooks/useKnowledgeGraphData";
import { useMetadataChat } from "@/hooks/useMetadataChat";
import type { GraphNode } from "@/hooks/useKnowledgeGraphData";
import { Network, Sparkles, Loader2, Database } from "lucide-react";

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
      {/* Page header with tabs */}
      <div className="border-b border-border px-5 py-3 shrink-0 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Database className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-tight">Metadata Workbench</h1>
              <p className="text-[11px] text-muted-foreground">Curate project metadata across the consortium</p>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="assistant" className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                Assistant
              </TabsTrigger>
              <TabsTrigger value="graph" className="gap-1.5 text-xs">
                <Network className="h-3.5 w-3.5" />
                Knowledge Graph
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Assistant tab */}
      {activeTab === "assistant" && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Project completeness grid */}
          <div className="border-b border-border shrink-0 overflow-auto max-h-[50vh]">
            <ProjectGrid selectedGrant={grantNumber} onSelectGrant={setGrantNumber} />
          </div>

          {/* Chat + metadata table */}
          <div className="flex-1 flex min-h-0">
            {/* Chat panel */}
            <div className="w-full lg:w-1/2 xl:w-[55%] border-r border-border flex flex-col min-h-0 p-3">
              <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border shadow-sm overflow-hidden bg-card">
                <AssistantChat
                  messages={messages}
                  isLoading={isLoading}
                  completeness={completeness}
                  onSend={sendMessage}
                  onClear={clearChat}
                  projectTitle={grantTitle || undefined}
                />
              </div>
            </div>

            {/* Metadata table panel */}
            <div className="hidden lg:flex flex-col flex-1 min-h-0 overflow-auto">
              {grantNumber ? (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                      <Database className="h-3 w-3 text-primary" />
                    </div>
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Metadata Fields</h3>
                  </div>
                  <MetadataTable grantNumber={grantNumber} highlightFields={fieldsUpdated} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                  <div className="h-12 w-12 rounded-xl bg-secondary/60 flex items-center justify-center">
                    <Database className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No project selected</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Click a project above to view and edit its metadata</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Graph tab */}
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
