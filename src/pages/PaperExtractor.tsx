import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Upload, FileText, Send, Sparkles, Trash2, Loader2, CheckCircle2,
  Database, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypingIndicator } from "@/components/neuromcp/TypingIndicator";
import { PageMeta } from "@/components/PageMeta";
import ReactMarkdown from "react-markdown";
import { usePaperExtractor } from "@/hooks/usePaperExtractor";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "@/styles/ag-grid-theme.css";

/* ── Color map for entity badges ── */
const ENTITY_COLORS: Record<string, string> = {
  study_species: "bg-emerald-100 text-emerald-800 border-emerald-200",
  use_sensors: "bg-violet-100 text-violet-800 border-violet-200",
  use_approaches: "bg-blue-100 text-blue-800 border-blue-200",
  produce_data_modality: "bg-amber-100 text-amber-800 border-amber-200",
  produce_data_type: "bg-rose-100 text-rose-800 border-rose-200",
  use_analysis_method: "bg-cyan-100 text-cyan-800 border-cyan-200",
  use_analysis_types: "bg-teal-100 text-teal-800 border-teal-200",
  develope_software_type: "bg-indigo-100 text-indigo-800 border-indigo-200",
  develope_hardware_type: "bg-orange-100 text-orange-800 border-orange-200",
  keywords: "bg-slate-100 text-slate-700 border-slate-200",
  grant_numbers: "bg-sky-100 text-sky-800 border-sky-200",
  orcids: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
};

const ENTITY_FIELDS = [
  { key: "study_species", label: "Species" },
  { key: "use_sensors", label: "Sensors" },
  { key: "use_approaches", label: "Approaches" },
  { key: "produce_data_modality", label: "Data Modalities" },
  { key: "produce_data_type", label: "Data Types" },
  { key: "use_analysis_method", label: "Analysis Methods" },
  { key: "use_analysis_types", label: "Analysis Types" },
  { key: "develope_software_type", label: "Software Types" },
  { key: "develope_hardware_type", label: "Hardware Types" },
  { key: "keywords", label: "Keywords" },
  { key: "grant_numbers", label: "Grant IDs" },
  { key: "orcids", label: "ORCIDs" },
] as const;

export default function PaperExtractor() {
  const {
    extraction, isExtracting, extractionStep, chatMessages, isChatLoading,
    uploadAndExtract, sendChat, clearAll,
  } = usePaperExtractor();

  const [chatInput, setChatInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const { data: pastExtractions, refetch } = useQuery({
    queryKey: ["paper-extractions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("paper_extractions")
        .select("id, filename, title, keywords, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  useEffect(() => {
    if (extraction?.status === "completed") refetch();
  }, [extraction?.status, refetch]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo(0, chatScrollRef.current.scrollHeight);
  }, [chatMessages, isChatLoading]);

  const handleFile = useCallback((file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) return;
    uploadAndExtract(file);
  }, [uploadAndExtract]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSendChat = () => {
    if (!chatInput.trim() || isChatLoading) return;
    sendChat(chatInput);
    setChatInput("");
  };

  const gridColDefs = useMemo<ColDef[]>(() => [
    {
      headerName: "Title",
      field: "title",
      flex: 3,
      minWidth: 250,
      wrapText: true,
      autoHeight: true,
      cellRenderer: (params: any) => params.value || params.data?.filename || "Untitled",
      cellStyle: { lineHeight: "1.4", padding: "8px 12px" },
    },
    {
      headerName: "Keywords",
      field: "keywords",
      flex: 2,
      minWidth: 200,
      wrapText: true,
      autoHeight: true,
      cellStyle: { lineHeight: "1.4", padding: "8px 12px", fontSize: "12px" },
      cellRenderer: (params: any) => {
        const vals = params.value as string[] | null;
        if (!vals?.length) return "—";
        return vals.slice(0, 5).join(" · ");
      },
    },
    {
      headerName: "Date",
      field: "created_at",
      width: 100,
      cellStyle: { fontSize: "12px", padding: "8px 12px" },
      valueFormatter: (params: any) =>
        params.value ? new Date(params.value).toLocaleDateString() : "",
    },
  ], []);

  const entityCount = extraction
    ? ENTITY_FIELDS.reduce((acc, { key }) => {
        const meta = extraction.extracted_metadata || {};
        const v = (meta as any)[key] as string[] | undefined;
        return acc + (v?.length || 0);
      }, 0)
    : 0;

  return (
    <>
      <PageMeta
        title="Paper Extractor | BBQS"
        description="Extract structured metadata from neuroscience papers using AI-powered NER aligned to the BBQS LinkML schema."
      />

      <div className="flex flex-col min-h-[calc(100vh-4rem)]">

        {/* ── Header + Upload ── */}
        <div className="shrink-0 px-6 pt-6 pb-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Paper Extractor</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a PDF → AI extracts LinkML-aligned metadata → refine via chat
              </p>
            </div>
            {extraction && (
              <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>

          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200",
              extraction ? "py-3 px-5" : "py-10 px-6",
              dragOver
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
              isExtracting && "pointer-events-none opacity-60",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {isExtracting ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-md">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground font-medium">
                    {extractionStep === "reading" && "Reading PDF…"}
                    {extractionStep === "uploading" && "Uploading to storage…"}
                    {extractionStep === "extracting" && "AI is extracting entities…"}
                    {extractionStep === "done" && "Finalizing…"}
                  </p>
                </div>
                <Progress
                  value={
                    extractionStep === "reading" ? 15 :
                    extractionStep === "uploading" ? 40 :
                    extractionStep === "extracting" ? 75 :
                    extractionStep === "done" ? 100 : 0
                  }
                  className="h-2 w-full"
                />
                <div className="flex justify-between w-full text-[10px] text-muted-foreground/60">
                  <span className={cn(extractionStep === "reading" && "text-primary font-medium")}>Read</span>
                  <span className={cn(extractionStep === "uploading" && "text-primary font-medium")}>Upload</span>
                  <span className={cn(extractionStep === "extracting" && "text-primary font-medium")}>Extract</span>
                  <span className={cn(extractionStep === "done" && "text-primary font-medium")}>Done</span>
                </div>
              </div>
            ) : extraction ? (
              <div className="flex items-center gap-4 w-full">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{extraction.title || extraction.filename}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {extraction.doi && <span className="font-mono text-primary/80">{extraction.doi}</span>}
                    <span>{entityCount} entities extracted</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground/60 shrink-0 hidden sm:inline">Drop another PDF to replace</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Drop a neuroscience PDF here
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    or click to browse — entities are extracted using the BBQS LinkML schema
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Two-panel: Chat + Entities ── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 mx-6 rounded-xl border border-border overflow-hidden"
          style={{ height: "min(52vh, 480px)" }}
        >
          {/* Panel: Chat */}
          <div className="border-b lg:border-b-0 lg:border-r border-border flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 shrink-0 bg-muted/30">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Refine</span>
            </div>

            <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {!extraction && chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-2 opacity-50">
                  <Sparkles className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    Upload a paper first, then chat here to refine metadata
                  </p>
                </div>
              )}

              {extraction && chatMessages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
                  {[
                    "What sensors were detected?",
                    "Add 'deep learning' to approaches",
                    "Which fields are still empty?",
                  ].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendChat(s)}
                      className="flex items-center gap-2 w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <ArrowRight className="h-3 w-3 text-primary/60 group-hover:text-primary transition-colors shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "user" ? (
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[85%] text-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[85%] bg-muted/50 rounded-2xl rounded-bl-sm px-3.5 py-2.5 prose prose-sm dark:prose-invert text-sm text-foreground">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border px-3 py-2.5 shrink-0">
              <div className="flex items-end gap-2">
                <Textarea
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  placeholder={extraction ? "Ask about or refine the extraction…" : "Upload a paper first"}
                  disabled={!extraction || isChatLoading}
                  className="min-h-[38px] max-h-20 resize-none text-sm rounded-lg border-muted-foreground/20"
                  rows={1}
                />
                <Button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isChatLoading || !extraction}
                  size="icon"
                  className="shrink-0 h-[38px] w-[38px] rounded-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Panel: Extracted Entities */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border shrink-0 bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-primary" /> Entities
              </span>
              {extraction && (
                <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {entityCount} found
                </span>
              )}
            </div>

            <ScrollArea className="flex-1">
              {!extraction ? (
                <div className="flex flex-col items-center justify-center h-48 text-center gap-2 opacity-50">
                  <FileText className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    Extracted metadata will appear here
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {ENTITY_FIELDS.map(({ key, label }) => {
                    const meta = extraction.extracted_metadata || {};
                    const values = (meta as any)[key] as string[] | undefined;
                    if (!values || values.length === 0) return null;
                    return (
                      <div key={key} className="rounded-lg border border-border/60 p-2.5 bg-background">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
                          <span className="text-[10px] text-muted-foreground">{values.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {values.map((v, i) => (
                            <span
                              key={i}
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
                                ENTITY_COLORS[key] || "bg-secondary text-secondary-foreground border-border",
                              )}
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Show empty fields collapsed */}
                  {(() => {
                    const emptyFields = ENTITY_FIELDS.filter(({ key }) => {
                      const v = (extraction as any)[key] as string[] | undefined;
                      return !v || v.length === 0;
                    });
                    if (emptyFields.length === 0) return null;
                    return (
                      <div className="rounded-lg border border-dashed border-border/40 p-2.5">
                        <p className="text-[10px] text-muted-foreground/60">
                          Empty: {emptyFields.map(f => f.label).join(", ")}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* ── Extraction History ── */}
        <div className="px-6 py-5 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Extraction History</h2>
            <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {pastExtractions?.length || 0}
            </span>
          </div>

          <div className="ag-theme-alpine border border-border rounded-xl overflow-hidden">
            <AgGridReact
              rowData={pastExtractions || []}
              columnDefs={gridColDefs}
              domLayout="autoHeight"
              suppressCellFocus
              pagination
              paginationPageSize={10}
              defaultColDef={{
                sortable: true,
                resizable: true,
                filter: true,
                unSortIcon: true,
              }}
              overlayNoRowsTemplate='<span style="padding:24px;color:hsl(var(--muted-foreground));font-size:13px;">No papers extracted yet — upload one above</span>'
            />
          </div>
        </div>
      </div>
    </>
  );
}
