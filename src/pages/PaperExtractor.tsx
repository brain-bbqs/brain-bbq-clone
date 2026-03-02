import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload, FileText, Send, Sparkles, Trash2, Loader2, CheckCircle2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypingIndicator } from "@/components/neuromcp/TypingIndicator";
import { PageMeta } from "@/components/PageMeta";
import ReactMarkdown from "react-markdown";
import { usePaperExtractor } from "@/hooks/usePaperExtractor";
import { cn } from "@/lib/utils";

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
    extraction, isExtracting, chatMessages, isChatLoading,
    uploadAndExtract, sendChat, clearAll,
  } = usePaperExtractor();

  const [chatInput, setChatInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo(0, chatScrollRef.current.scrollHeight);
  }, [chatMessages, isChatLoading]);

  const handleFile = useCallback((file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return;
    }
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

  return (
    <>
      <PageMeta
        title="Paper Extractor | BBQS"
        description="Extract structured metadata from neuroscience papers using AI-powered NER aligned to the BBQS LinkML schema."
      />
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Paper Extractor</h1>
              <p className="text-sm text-muted-foreground">
                Upload a PDF → AI extracts LinkML-aligned metadata → refine via chat
              </p>
            </div>
            {extraction && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <Trash2 className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Three-panel layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
          {/* Panel 1: Upload */}
          <div className="border-r border-border flex flex-col overflow-auto p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" /> Upload PDF
            </h2>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex-1 min-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-primary/5",
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
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Extracting entities...</p>
                </div>
              ) : extraction ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium text-foreground">{extraction.filename}</p>
                  <p className="text-xs text-muted-foreground">Click or drop another PDF to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">
                    Drop a PDF here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Neuroscience papers work best — entities are extracted using the BBQS LinkML schema
                  </p>
                </div>
              )}
            </div>

            {/* Quick stats */}
            {extraction && (
              <div className="mt-4 space-y-2">
                {extraction.title && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Title</p>
                    <p className="text-sm text-foreground">{extraction.title}</p>
                  </div>
                )}
                {extraction.authors && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Authors</p>
                    <p className="text-sm text-foreground truncate">{extraction.authors}</p>
                  </div>
                )}
                {extraction.doi && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">DOI</p>
                    <p className="text-sm text-primary">{extraction.doi}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Panel 2: Chat */}
          <div className="border-r border-border flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Refine Extraction</h2>
            </div>

            <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {!extraction && chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-3">
                  <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Upload a paper first, then chat here to refine the extracted metadata
                  </p>
                </div>
              )}

              {extraction && chatMessages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Extraction complete! Try asking:
                  </p>
                  {[
                    "What sensors were detected?",
                    "Add 'deep learning' to approaches",
                    "Which fields are still empty?",
                  ].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendChat(s)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border bg-background hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      → {s}
                    </button>
                  ))}
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "user" ? (
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3 py-2 max-w-[85%] text-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[85%] bg-secondary/40 rounded-2xl rounded-bl-md px-3 py-2.5 prose prose-sm dark:prose-invert text-sm text-foreground">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary/40 rounded-2xl rounded-bl-md px-3 py-2.5">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border px-4 py-3 shrink-0">
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
                  placeholder={extraction ? "Ask about or refine the extraction..." : "Upload a paper first"}
                  disabled={!extraction || isChatLoading}
                  className="min-h-[40px] max-h-24 resize-none text-sm rounded-xl"
                  rows={1}
                />
                <Button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isChatLoading || !extraction}
                  size="icon"
                  className="shrink-0 h-9 w-9 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Panel 3: Results */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-border shrink-0">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Extracted Entities
              </h2>
            </div>

            <ScrollArea className="flex-1 px-4 py-4">
              {!extraction ? (
                <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Extracted metadata will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ENTITY_FIELDS.map(({ key, label }) => {
                    const values = (extraction as any)[key] as string[] | undefined;
                    if (!values || values.length === 0) {
                      return (
                        <Card key={key} className="border-border/50">
                          <CardHeader className="py-2 px-3">
                            <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 pb-2">
                            <p className="text-xs text-muted-foreground italic">No entities extracted</p>
                          </CardContent>
                        </Card>
                      );
                    }
                    return (
                      <Card key={key} className="border-border/50">
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                            {label}
                            <Badge variant="secondary" className="text-[10px]">{values.length}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-2">
                          <div className="flex flex-wrap gap-1.5">
                            {values.map((v, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {v}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
}
