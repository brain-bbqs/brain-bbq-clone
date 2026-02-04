import { useState, useRef, useEffect } from "react";
import { Send, Mic, Lock, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  contextSources?: { type: string; title: string }[];
}

const isMitEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase().endsWith("@mit.edu");
};

export default function NeuroMCP() {
  const { user, loading, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi, I'm Hannah. Ask me anything about BBQS projects, publications, or investigators.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasAccess = user && isMitEmail(user.email);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !session) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://vpexxhfpvghlejljwpvt.supabase.co/functions/v1/neuromcp-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: userMessage.content,
            conversationId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        contextSources: data.contextSources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3rem)] max-w-3xl mx-auto px-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access restricted message if not authenticated or not MIT email
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3rem)] max-w-lg mx-auto px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-3">Access Restricted</h1>
        <p className="text-muted-foreground mb-6">
          NeuroMCP is only available to users with an MIT email address. 
          {!user 
            ? " Please sign in with your @mit.edu email to access this feature."
            : " Your current email is not authorized. Please sign in with your @mit.edu email."}
        </p>
        {!user ? (
          <Link to="/auth">
            <Button className="gap-2">
              Sign In with MIT Email
            </Button>
          </Link>
        ) : (
          <Button variant="outline" onClick={() => window.location.href = "/auth"}>
            Sign In with Different Account
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] max-w-3xl mx-auto px-6">
      {/* Header */}
      <div className="pt-8 pb-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Hannah</h1>
        <p className="text-muted-foreground text-sm mt-1">Your BBQS research assistant</p>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2"
      >
        <div className="space-y-6 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" ? (
                <div className="max-w-[85%] space-y-2">
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {message.content}
                  </div>
                  {message.contextSources && message.contextSources.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <Database className="h-3 w-3" />
                      <span>
                        Sources: {message.contextSources.map(s => s.title).slice(0, 2).join(", ")}
                        {message.contextSources.length > 2 && ` +${message.contextSources.length - 2} more`}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-secondary text-foreground rounded-2xl px-4 py-2.5 max-w-[85%]">
                  {message.content}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="inline-flex gap-1 px-2">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="py-4">
        <div className="flex items-center gap-2 bg-secondary/50 rounded-full px-2 py-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about BBQS projects, publications, or investigators..."
            disabled={isLoading}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
