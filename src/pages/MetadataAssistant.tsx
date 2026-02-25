import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectGrid } from "@/components/metadata-assistant/ProjectGrid";
import { AssistantChat } from "@/components/metadata-assistant/AssistantChat";
import { MetadataTable } from "@/components/metadata-assistant/MetadataTable";
import { useMetadataChat } from "@/hooks/useMetadataChat";
import { Database } from "lucide-react";

export default function MetadataAssistant() {
  const [grantNumber, setGrantNumber] = useState<string | null>(null);

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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
      {/* Page header */}
      <div className="border-b border-border px-5 py-3 shrink-0 bg-card">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Database className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">BBQS Workbench</h1>
            <p className="text-[11px] text-muted-foreground">Curate project metadata across the consortium</p>
          </div>
        </div>
      </div>

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
    </div>
  );
}
