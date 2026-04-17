import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2, CheckCircle2, AlertTriangle, XCircle, Shield, ChevronDown, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TypingIndicator } from "@/components/neuromcp/TypingIndicator";

import { SuggestedActions, WORKFLOW_ACTIONS } from "@/components/metadata-assistant/SuggestedActions";
import { VoiceAgentButton } from "@/components/metadata-assistant/VoiceAgentButton";
import ReactMarkdown from "react-markdown";
import type { ChatMessage, ValidationResult } from "@/hooks/useMetadataChat";
import { cn } from "@/lib/utils";

interface AssistantChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  completeness: number;
  onSend: (msg: string) => void;
  onClear: () => void;
  projectTitle?: string;
  lastValidation?: ValidationResult | null;
  fieldsUpdated?: string[];
  /** Called when the user picks a candidate project from a discovery card. */
  onSelectCandidate?: (grantNumber: string) => void;
  /** Called when the user confirms adding a new grant proposed by the router. */
  onConfirmAddGrant?: (grantNumber: string) => void;
}


function ValidationChecklist({ validation }: { validation: ValidationResult }) {
  const [expanded, setExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);

  // Flatten all checks with a global index for staggered reveal
  const allChecks: { protocol: string; check: (typeof validation.checks)[0]; globalIdx: number }[] = [];
  const byProtocol: Record<string, typeof validation.checks> = {};
  let gi = 0;
  for (const check of validation.checks) {
    const proto = check.protocol || "general";
    if (!byProtocol[proto]) byProtocol[proto] = [];
    byProtocol[proto].push(check);
    allChecks.push({ protocol: proto, check, globalIdx: gi++ });
  }
  const totalChecks = allChecks.length;

  // Staggered reveal effect
  useEffect(() => {
    setVisibleCount(0);
    if (totalChecks === 0) return;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleCount(current);
      if (current >= totalChecks) clearInterval(interval);
    }, 180);
    return () => clearInterval(interval);
  }, [totalChecks, validation]);

  const statusIcon = (status: string, revealed: boolean) => {
    if (!revealed) return <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0 animate-pulse" />;
    if (status === "pass") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 animate-scale-in" />;
    if (status === "warning") return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-scale-in" />;
    return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 animate-scale-in" />;
  };

  const overallConfig = {
    approved: { label: "All Checks Passed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    needs_review: { label: "Warnings Found", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    rejected: { label: "Issues Found", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  };
  const overall = overallConfig[validation.overall_status];
  const allRevealed = visibleCount >= totalChecks;

  // Track which global index each protocol/check maps to
  let globalCounter = 0;

  return (
    <div className={cn("rounded-xl border mx-1 mb-3 overflow-hidden", overall.bg)}>
      {/* Header - clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-foreground/5 transition-colors"
      >
        <Shield className={cn("h-3.5 w-3.5 shrink-0", overall.color)} />
        <span className={cn("text-xs font-semibold uppercase tracking-wide", overall.color)}>
          {allRevealed ? overall.label : "Running checks…"}
        </span>
        <div className="flex items-center gap-2 ml-auto text-[10px] text-muted-foreground">
          {allRevealed ? (
            <>
              <span className="flex items-center gap-0.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />{validation.summary.passed}
              </span>
              {validation.summary.warnings > 0 && (
                <span className="flex items-center gap-0.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />{validation.summary.warnings}
                </span>
              )}
              {validation.summary.failed > 0 && (
                <span className="flex items-center gap-0.5">
                  <XCircle className="h-3 w-3 text-red-500" />{validation.summary.failed}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground/60">{visibleCount}/{totalChecks}</span>
          )}
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", expanded && "rotate-180")} />
      </button>

      {/* Checklist items */}
      {expanded && (
        <div className="border-t border-border/30 px-3 py-2 space-y-1">
          {Object.entries(byProtocol).map(([protocol, checks]) => {
            const startIdx = globalCounter;
            globalCounter += checks.length;
            // Only show protocol header once at least one check in it is visible
            if (visibleCount <= startIdx) return null;
            return (
              <div key={protocol}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-1 mb-0.5 px-0.5 animate-fade-in">
                  {protocol}
                </p>
                {checks.map((check, idx) => {
                  const gi = startIdx + idx;
                  const revealed = gi < visibleCount;
                  const justAppeared = gi === visibleCount - 1;
                  if (gi >= visibleCount) return null;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-start gap-2 py-1.5 px-2 rounded-lg text-xs transition-all duration-300",
                        justAppeared && "animate-fade-in",
                        revealed && check.status === "fail" && "bg-red-500/5",
                        revealed && check.status === "warning" && "bg-amber-500/5",
                      )}
                    >
                      {statusIcon(check.status, revealed)}
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-foreground/90 transition-opacity duration-200", !revealed && "opacity-50")}>
                          {check.message}
                        </span>
                        {revealed && check.suggestions && check.suggestions.length > 0 && (
                          <span className="block text-[10px] text-muted-foreground mt-0.5 animate-fade-in">
                            💡 {check.suggestions.join(", ")}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground/50 shrink-0 mt-0.5">{check.field}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export function AssistantChat({ messages, isLoading, completeness, onSend, onClear, projectTitle, lastValidation, fieldsUpdated = [], onSelectCandidate, onConfirmAddGrant }: AssistantChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, lastValidation]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-tight">Metadata Assistant</h2>
            {completeness > 0 && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${completeness}%`,
                      background: completeness >= 70
                        ? "hsl(168, 55%, 42%)"
                        : completeness >= 40
                          ? "hsl(222, 47%, 35%)"
                          : "hsl(220, 15%, 65%)",
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{completeness}%</span>
              </div>
            )}
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClear}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>


      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
              <Sparkles className="h-6 w-6 text-primary/60" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-foreground">
                {projectTitle ? projectTitle : "How can I help?"}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {projectTitle
                  ? "Choose a workflow below to get started, or describe your experiments in plain language."
                  : "Search by PI or project title, paste a NIH grant ID, or ask anything about the consortium."}
              </p>
            </div>
            {projectTitle ? (
              <div className="grid grid-cols-2 gap-2 w-full max-w-md mt-1">
                {WORKFLOW_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(action.prompt)}
                    className="group flex items-start gap-2.5 text-left text-xs px-3.5 py-3 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary/20 text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <span className="text-primary/60 group-hover:text-primary mt-0.5 shrink-0">{action.icon}</span>
                    <span className="leading-snug font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 w-full max-w-md mt-1">
                {[
                  { label: "Find a project by PI name", prompt: "Find projects by " },
                  { label: "Look up a NIH grant ID", prompt: "Is grant R34DA059510 in the consortium?" },
                  { label: "What is BBQS?", prompt: "What is the BBQS consortium?" },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(action.prompt)}
                    className="group flex items-center gap-2.5 text-left text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary/20 text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary shrink-0" />
                    <span className="leading-snug font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "user" ? (
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%] text-sm shadow-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[85%] bg-secondary/40 rounded-2xl rounded-bl-md px-4 py-3 prose prose-sm dark:prose-invert text-sm text-foreground">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
            {/* Show validation checklist after the last assistant message */}
            {msg.role === "assistant" && i === messages.length - 1 && lastValidation && (
              <div className="mt-3">
                <ValidationChecklist validation={lastValidation} />
              </div>
            )}
            {/* Show suggested follow-up actions after the last assistant message */}
            {msg.role === "assistant" && i === messages.length - 1 && (
              <SuggestedActions
                onSend={onSend}
                lastAssistantMsg={msg.content}
                hasValidation={!!lastValidation}
                fieldsUpdated={fieldsUpdated}
                isLoading={isLoading}
              />
            )}
            {/* Undo button after the last assistant message if fields were updated */}
            {msg.role === "assistant" && i === messages.length - 1 && fieldsUpdated.length > 0 && !isLoading && (
              <div className="flex justify-start mt-2 ml-1">
                <button
                  onClick={() => onSend("Undo my last change — revert the fields that were just modified and restore their previous values.")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  <Undo2 className="h-3 w-3" />
                  Undo last action
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary/40 rounded-2xl rounded-bl-md px-4 py-3">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-5 py-4 shrink-0 bg-gradient-to-t from-secondary/20 to-transparent">
        <div className="flex items-end gap-2">
          <VoiceAgentButton />
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your experiment, methods, species..."
            disabled={isLoading}
            className="min-h-[44px] max-h-32 resize-none text-sm rounded-xl border-border/80 bg-background shadow-sm focus-visible:ring-primary/30 flex-1"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-sm transition-all"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
