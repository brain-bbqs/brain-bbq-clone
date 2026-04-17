import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectPicker } from "@/components/metadata-assistant/ProjectPicker";
import { AssistantChat } from "@/components/metadata-assistant/AssistantChat";
import { MetadataTable } from "@/components/metadata-assistant/MetadataTable";
import { ChatHistorySidebar } from "@/components/metadata-assistant/ChatHistorySidebar";
import { AddProjectDialog } from "@/components/metadata-assistant/AddProjectDialog";
import { useMetadataChat } from "@/hooks/useMetadataChat";
import { useAuth } from "@/contexts/AuthContext";
import { useCanEditProject } from "@/hooks/useCanEditProject";
import { useUserTier } from "@/hooks/useUserTier";
import { Database, BookOpen, X, ShieldAlert, PanelLeftClose, PanelLeftOpen, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MetadataAssistant() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { isCurator } = useUserTier(); // tier 1 (admin) or tier 2 (curator)
  const [showBanner, setShowBanner] = useState(() => {
    return !localStorage.getItem("bbqs-tutorial-dismissed");
  });
  const [grantNumber, setGrantNumber] = useState<string | null>(
    () => searchParams.get("grant")
  );
  const [showHistory, setShowHistory] = useState(false);
  const { canEdit } = useCanEditProject(grantNumber);

  // When ?grant= is present, the assistant is being used in PROPOSE mode from
  // a project profile context — suggestions go to pending_changes for review.
  const proposeMode = !!searchParams.get("grant");

  // Sync URL param into local state (e.g. when navigating between project profiles)
  useEffect(() => {
    const param = searchParams.get("grant");
    if (param && param !== grantNumber) setGrantNumber(param);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const {
    messages, isLoading, completeness, fieldsUpdated, lastValidation,
    conversationId, sendMessage, clearChat, loadConversationById, deleteConversation,
  } = useMetadataChat(grantNumber, { mode: proposeMode ? "propose" : "apply" });

  const handleSelectConversation = (convoId: string, convoGrantNumber: string) => {
    setGrantNumber(convoGrantNumber);
    loadConversationById(convoId, convoGrantNumber);
  };

  const handleDeleteConversation = async (convoId: string) => {
    await deleteConversation(convoId);
    queryClient.invalidateQueries({ queryKey: ["chat-history"] });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
      {/* Page header */}
      <div className="border-b border-border px-5 py-3 shrink-0 bg-card">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Database className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-foreground leading-tight">BBQS Workbench</h1>
            <p className="text-[11px] text-muted-foreground">Curate project metadata across the consortium</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setShowHistory(prev => !prev)}
            title={showHistory ? "Hide chat history" : "Show chat history"}
          >
            {showHistory ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Tutorial banner */}
      {showBanner && (
        <div className="border-b border-primary/20 bg-primary/5 px-5 py-2.5 shrink-0 flex items-center gap-3">
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs text-foreground flex-1">
            <span className="font-medium">New here?</span>{" "}
            <Link to="/tutorials" className="text-primary hover:underline font-medium">
              Take the interactive tutorial
            </Link>{" "}
            to learn how to curate your project metadata.
          </p>
          <button
            onClick={() => { setShowBanner(false); localStorage.setItem("bbqs-tutorial-dismissed", "1"); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Chat history sidebar */}
        {showHistory && user && (
          <div className="w-56 shrink-0 border-r border-border bg-card/50">
            <ChatHistorySidebar
              activeConversationId={conversationId}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Project selector */}
          <div className="border-b border-border shrink-0 px-5 py-3 bg-card">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <label className="text-xs font-medium text-muted-foreground">Select Project</label>
              {isCurator && (
                <AddProjectDialog onProjectAdded={(gn) => setGrantNumber(gn)} />
              )}
            </div>
            <ProjectPicker value={grantNumber} onChange={setGrantNumber} />
          </div>

          {/* Permission banner */}
          {grantNumber && !canEdit && user && (
            <div className="border-b border-destructive/20 bg-destructive/5 px-5 py-2 shrink-0 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-foreground">
                <span className="font-medium">Read-only mode.</span> Your organization doesn't have edit access to this project.
              </p>
            </div>
          )}
          {grantNumber && !user && (
            <div className="border-b border-primary/20 bg-primary/5 px-5 py-2 shrink-0 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-foreground">
                <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link> to edit project metadata.
              </p>
            </div>
          )}
          {grantNumber && proposeMode && canEdit && (
            <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 to-transparent px-5 py-2 shrink-0 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-foreground flex-1">
                <span className="font-medium">Suggestion mode.</span> Edits will appear as pending suggestions on the project profile for team review.
              </p>
              <Link
                to={`/projects/${grantNumber}/profile`}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1 shrink-0"
              >
                Open profile <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}

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
                  lastValidation={lastValidation}
                  fieldsUpdated={fieldsUpdated}
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
    </div>
  );
}
