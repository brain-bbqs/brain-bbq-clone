import { useState, useRef, useEffect } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AdminPanel } from "@/components/neuromcp/AdminPanel";
import { WorkflowRecommender } from "@/components/neuromcp/WorkflowRecommender";
import { MessageBubble } from "@/components/neuromcp/MessageBubble";
import { ChatInput } from "@/components/neuromcp/ChatInput";
import { TypingIndicator } from "@/components/neuromcp/TypingIndicator";
import { PageMeta } from "@/components/PageMeta";

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

const INITIAL_MESSAGE: Message = {
  id: "1",
  role: "assistant",
  content: "Hi, I'm Hannah 👋 Ask me anything about BBQS projects, publications, workflows, or investigators.",
  timestamp: new Date(),
};

export default function NeuroMCP() {
  const { user, loading, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
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
          body: JSON.stringify({ message: content.trim(), conversationId }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get response");

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          contextSources: data.contextSources,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I apologize, but I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
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
        <PageMeta title="NeuroMCP – Access Restricted | BBQS" description="Sign in with your MIT email to access the NeuroMCP research assistant." />
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
            <Button className="gap-2 w-full sm:w-auto">Sign In with MIT Email</Button>
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
      <PageMeta title="Hannah – BBQS Research Assistant | NeuroMCP" description="Ask Hannah about BBQS projects, publications, workflows, and investigators." />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="pt-4 sm:pt-6 pb-3 sm:pb-4 text-center border-b border-border/50 px-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Hannah</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Your BBQS research assistant</p>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 sm:px-6">
            {session && <div className="pt-4"><AdminPanel accessToken={session.access_token} /></div>}
            <div className="py-3">
              <WorkflowRecommender onAskHannah={(question) => sendMessage(question)} />
            </div>
            <div className="space-y-5 py-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  contextSources={message.contextSources}
                />
              ))}
              {isLoading && <TypingIndicator />}
            </div>
          </div>
        </div>

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => sendMessage(input)}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
