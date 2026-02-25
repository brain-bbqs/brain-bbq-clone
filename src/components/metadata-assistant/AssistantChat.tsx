import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypingIndicator } from "@/components/neuromcp/TypingIndicator";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/hooks/useMetadataChat";
import { cn } from "@/lib/utils";

interface AssistantChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  completeness: number;
  onSend: (msg: string) => void;
  onClear: () => void;
  projectTitle?: string;
}

const STARTERS = [
  "We study mice using calcium imaging with two-photon microscopes",
  "Our lab develops open-source Python tools for spike sorting",
  "We record from zebrafish using light-sheet microscopy",
  "What metadata fields are still missing?",
];

export function AssistantChat({ messages, isLoading, completeness, onSend, onClear, projectTitle }: AssistantChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
                {projectTitle ? projectTitle : "Select a project to begin"}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {projectTitle
                  ? "Describe your experiments in plain language and I'll organize the metadata for you."
                  : "Click on a project above to start curating its metadata with AI assistance."}
              </p>
            </div>
            {projectTitle && (
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-1">
                {STARTERS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(s)}
                    className="group text-left text-xs px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary/20 text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <span className="opacity-50 group-hover:opacity-80 mr-1.5">→</span>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
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
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your experiment, methods, species..."
            disabled={isLoading}
            className="min-h-[44px] max-h-32 resize-none text-sm rounded-xl border-border/80 bg-background shadow-sm focus-visible:ring-primary/30"
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
