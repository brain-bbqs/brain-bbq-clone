import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, User, Bot, Loader2, Clock, RefreshCw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface HistoryMessage {
  role: string;
  content: string;
  created_at: string;
  tokens_used: number | null;
  latency_ms: number | null;
  model: string | null;
  context_sources: any;
}

interface Conversation {
  id: string;
  user_id: string;
  userEmail: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages: HistoryMessage[];
}

interface ChatHistoryProps {
  accessToken: string;
  mode?: "inline" | "sidebar";
}

export function ChatHistory({ accessToken, mode = "inline" }: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visible, setVisible] = useState(mode === "sidebar");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neuromcp-history`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && conversations.length === 0) {
      fetchHistory();
    }
  }, [visible]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const extractUsername = (email: string) => email.split("@")[0];

  // Sidebar mode — fills its container
  if (mode === "sidebar") {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {loading && conversations.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No conversations yet.</p>
        ) : (
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/50">
              {conversations.map((conv) => (
                <div key={conv.id}>
                  <button
                    onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm text-foreground line-clamp-2 leading-snug">
                      {conv.title || "Untitled conversation"}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                        @{extractUsername(conv.userEmail)}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(conv.updated_at)}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {conv.messages.length}
                      </span>
                    </div>
                  </button>

                  {expanded === conv.id && (
                    <div className="px-3 pb-3 space-y-2 bg-background/80 border-t border-border/30">
                      {conv.messages.map((msg, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex gap-2 text-xs",
                            msg.role === "user" ? "justify-end" : "justify-start"
                          )}
                        >
                          {msg.role === "assistant" && (
                            <Bot className="h-3.5 w-3.5 mt-1.5 text-primary shrink-0" />
                          )}
                          <div
                            className={cn(
                              "max-w-[90%] rounded-lg px-2.5 py-1.5",
                              msg.role === "user"
                                ? "bg-primary/10 text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            <div className="prose prose-xs dark:prose-invert max-w-none text-[11px] leading-relaxed">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          </div>
                          {msg.role === "user" && (
                            <User className="h-3.5 w-3.5 mt-1.5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHistory}
            disabled={loading}
            className="w-full text-xs gap-1.5"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>
    );
  }

  // Inline mode (mobile fallback)
  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setVisible(!visible)}
        className="gap-2 w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Consortium Chat History
        </span>
        {visible ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {visible && (
        <div className="mt-2 border border-border rounded-lg bg-muted/20 max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                  className="w-full text-left px-3 py-2 hover:bg-muted/40 transition-colors"
                >
                  <p className="text-xs text-foreground truncate">{conv.title || "Untitled"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-primary font-medium">@{extractUsername(conv.userEmail)}</span>
                    <span className="text-[10px] text-muted-foreground">{formatTime(conv.updated_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
