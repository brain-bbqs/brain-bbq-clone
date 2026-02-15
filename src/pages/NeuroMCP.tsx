import { useState, useRef, useEffect } from "react";
import { Send, Mic, Lock, Loader2, Database, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AdminPanel } from "@/components/neuromcp/AdminPanel";
import { WorkflowRecommender } from "@/components/neuromcp/WorkflowRecommender";
import { ChatHistory } from "@/components/neuromcp/ChatHistory";
import ReactMarkdown from "react-markdown";

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
      content: "Hi, I'm Hannah 👋 Ask me anything about BBQS projects, publications, workflows, or investigators.",
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

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || !session) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neuromcp-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: content.trim(),
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

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3rem)] max-w-lg mx-auto px-4 sm:px-6 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
          <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 sm:mb-3">Access Restricted</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
          NeuroMCP is only available to users with an MIT email address. 
          {!user 
            ? " Please sign in with your @mit.edu email to access this feature."
            : " Your current email is not authorized. Please sign in with your @mit.edu email."}
        </p>
        {!user ? (
          <Link to="/auth">
            <Button className="gap-2 w-full sm:w-auto">
              Sign In with MIT Email
            </Button>
          </Link>
        ) : (
          <Button variant="outline" onClick={() => window.location.href = "/auth"} className="w-full sm:w-auto">
            Sign In with Different Account
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="pt-4 sm:pt-6 pb-3 sm:pb-4 text-center border-b border-border/50 px-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Hannah</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Your BBQS research assistant</p>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 sm:px-6">
            {/* Admin Panel */}
            {session && <div className="pt-4"><AdminPanel accessToken={session.access_token} /></div>}

            {/* Workflow Recommender */}
            <div className="py-3">
              <WorkflowRecommender onAskHannah={(question) => sendMessage(question)} />
            </div>

            {/* Messages */}
            <div className="space-y-5 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="max-w-[90%] sm:max-w-[85%] space-y-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base text-muted-foreground">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      </div>
                      {message.contextSources && message.contextSources.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 ml-9">
                          <Database className="h-3 w-3 shrink-0" />
                          <span className="break-words">
                            Sources: {message.contextSources.map(s => s.title).slice(0, 2).join(", ")}
                            {message.contextSources.length > 2 && ` +${message.contextSources.length - 2} more`}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 max-w-[90%] sm:max-w-[85%] text-sm sm:text-base shadow-sm">
                      {message.content}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="inline-flex gap-1 pt-2">
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border/50 px-3 sm:px-6 py-3 sm:py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-secondary/50 rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5 border border-border/50">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about BBQS projects, workflows, publications..."
                disabled={isLoading}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
