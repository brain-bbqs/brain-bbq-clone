import { useState, useEffect, useMemo } from "react";
import { Search, Users, MessageSquare, Clock, Bot, User, Loader2, Lock, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
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

const isMitEmail = (email: string | undefined) => email?.toLowerCase().endsWith("@mit.edu");

export default function ConsortiaHistory() {
  const { user, loading: authLoading, session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const hasAccess = user && isMitEmail(user.email);

  const fetchHistory = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neuromcp-history`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` } }
      );
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) fetchHistory();
  }, [hasAccess]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      c.title?.toLowerCase().includes(q) ||
      c.userEmail?.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const uniqueUsers = useMemo(() => new Set(conversations.map((c) => c.userEmail)).size, [conversations]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  const extractUsername = (email: string) => email.split("@")[0];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3rem)] max-w-lg mx-auto px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Consortium Chat Archive is only available to MIT users.
          {!user ? " Please sign in with your @mit.edu email." : " Your current email is not authorized."}
        </p>
        {!user && (
          <Link to="/auth"><Button className="gap-2">Sign In with MIT Email</Button></Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="border-b border-border px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-primary" />
            Consortium Chat Archive
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search and explore conversations, workflows, and insights shared across the consortium.
          </p>

          {/* Search + stats */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people, workflows, tools, species..."
                className="pl-9 pr-9 h-10 bg-background"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading} className="gap-1.5 h-10 shrink-0">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {uniqueUsers} members</span>
            <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {conversations.length} conversations</span>
            {searchQuery && <span className="text-primary font-medium">{filtered.length} results</span>}
          </div>
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">
              {searchQuery ? "No conversations match your search." : "No conversations yet."}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((conv) => (
                <div key={conv.id} className="rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors">
                  <button
                    onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                    className="w-full text-left px-4 py-3"
                  >
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {conv.title || "Untitled conversation"}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                        @{extractUsername(conv.userEmail)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatTime(conv.updated_at)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> {conv.messages.length} messages
                      </span>
                    </div>
                  </button>

                  {expanded === conv.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-3">
                      {conv.messages.map((msg, i) => (
                        <div
                          key={i}
                          className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
                        >
                          {msg.role === "assistant" && (
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Bot className="h-3.5 w-3.5 text-primary" />
                            </div>
                          )}
                          <div className={cn(
                            "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                            msg.role === "user" ? "bg-primary/10 text-foreground" : "bg-muted/50 text-muted-foreground"
                          )}>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          </div>
                          {msg.role === "user" && (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
