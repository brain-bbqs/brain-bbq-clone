import { useState, useEffect } from "react";
import { History, ChevronDown, ChevronRight, User, Bot, Loader2, Clock } from "lucide-react";
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
}

export function ChatHistory({ accessToken }: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

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

  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setVisible(!visible)}
        className="gap-2 w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Consortium Chat History
        </span>
        {visible ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {visible && (
        <div className="mt-2 border border-border rounded-lg bg-muted/20">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No conversations yet.</p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="divide-y divide-border">
                {conversations.map((conv) => (
                  <div key={conv.id}>
                    <button
                      onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {conv.title || "Untitled conversation"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-primary font-medium">
                              @{extractUsername(conv.userEmail)}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(conv.updated_at)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {conv.messages.length} msgs
                            </span>
                          </div>
                        </div>
                        {expanded === conv.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </button>

                    {expanded === conv.id && (
                      <div className="px-3 pb-3 space-y-2 bg-background/50">
                        {conv.messages.map((msg, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex gap-2 text-sm",
                              msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            {msg.role === "assistant" && (
                              <Bot className="h-4 w-4 mt-1 text-primary shrink-0" />
                            )}
                            <div
                              className={cn(
                                "max-w-[85%] rounded-lg px-3 py-2",
                                msg.role === "user"
                                  ? "bg-secondary text-foreground"
                                  : "bg-muted/50 text-muted-foreground"
                              )}
                            >
                              <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                              {msg.role === "assistant" && msg.latency_ms && (
                                <p className="text-[10px] text-muted-foreground/50 mt-1">
                                  {msg.latency_ms}ms · {msg.tokens_used} tokens · {msg.model}
                                </p>
                              )}
                            </div>
                            {msg.role === "user" && (
                              <User className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
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
              className="w-full text-xs"
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
