import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ChatHistoryProps {
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string, grantNumber: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

export function ChatHistorySidebar({ activeConversationId, onSelectConversation, onDeleteConversation }: ChatHistoryProps) {
  const { user } = useAuth();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["chat-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("chat_conversations")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .like("title", "metadata:%")
        .order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">Sign in to see chat history</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-3 py-4 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">No conversations yet</p>
        <p className="text-[10px] text-muted-foreground/60">Select a project and start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Chat History</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{conversations.length}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {conversations.map(convo => {
          const grantNumber = convo.title?.replace("metadata:", "") || "";
          const isActive = convo.id === activeConversationId;

          return (
            <div
              key={convo.id}
              className={cn(
                "group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150",
                isActive
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/60 border border-transparent"
              )}
              onClick={() => onSelectConversation(convo.id, grantNumber)}
            >
              <MessageSquare className={cn(
                "h-3.5 w-3.5 shrink-0",
                isActive ? "text-primary" : "text-muted-foreground/60"
              )} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-medium truncate",
                  isActive ? "text-primary" : "text-foreground"
                )}>
                  {grantNumber}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {formatDistanceToNow(new Date(convo.updated_at), { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteConversation(convo.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                title="Delete conversation"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
