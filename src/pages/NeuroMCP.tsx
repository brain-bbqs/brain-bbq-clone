import { useState, useRef, useEffect } from "react";
import { Send, Mic, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const isMitEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase().endsWith("@mit.edu");
};

export default function NeuroMCP() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm NeuroMCP, your research assistant.\n\nAsk me about neuroscience models, brain data analysis, or any research in your library.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasAccess = user && isMitEmail(user.email);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Placeholder for actual AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a placeholder response. The AI backend will be connected soon.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
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
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
        <h1 className="text-2xl font-semibold text-foreground">NeuroMCP</h1>
        <p className="text-muted-foreground text-sm mt-1">Your AI research assistant</p>
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
                <div className="text-muted-foreground whitespace-pre-wrap max-w-[85%]">
                  {message.content}
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
            placeholder="Type your message..."
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
