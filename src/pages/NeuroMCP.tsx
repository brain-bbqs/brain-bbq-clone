import { useState, useRef, useEffect } from "react";
import { Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function NeuroMCP() {
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

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] max-w-4xl mx-auto px-6">
      {/* Header */}
      <div className="pt-8 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">NeuroMCP</h1>
        <p className="text-muted-foreground">Your AI research assistant with access to the library</p>
      </div>

      {/* Audio Waveform Visualization */}
      <div className="flex justify-center py-8">
        <div className="flex items-center gap-[2px] h-8">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="w-[3px] bg-primary/60 rounded-full"
              style={{
                height: `${Math.random() * 24 + 8}px`,
                opacity: 0.4 + Math.random() * 0.6,
              }}
            />
          ))}
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-center text-muted-foreground text-sm mb-6">
        Ask NeuroMCP anything about your research
      </p>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-card rounded-xl border border-border overflow-y-auto"
      >
        <div className="p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                message.role === "user" ? "text-right" : "text-center"
              )}
            >
              {message.role === "assistant" ? (
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {message.content}
                </div>
              ) : (
                <div className="inline-block bg-primary text-primary-foreground rounded-2xl px-4 py-2 max-w-[80%] text-left">
                  {message.content}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="text-center">
              <div className="inline-flex gap-1">
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
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Mic className="h-5 w-5" />
          </Button>
          <div className="w-px h-6 bg-border" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question or click the mic..."
            disabled={isLoading}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 rounded-lg bg-accent hover:bg-accent/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
