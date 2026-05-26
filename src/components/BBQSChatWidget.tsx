import { useEffect, useRef, useState } from "react";
import { Send, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Who studies zebrafish behavior?",
  "Show me pose-estimation tools",
  "What datasets are available?",
  "Find publications on social behavior",
];

export default function BBQSChatWidget() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const query = text.trim();
    if (!query || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: query }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        toast({
          title: "Sign in required",
          description: "Please sign in to use the BBQS assistant.",
          variant: "destructive",
        });
        setMessages((m) => m.slice(0, -2));
        setStreaming(false);
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discovery-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = {
                  role: "assistant",
                  content: next[next.length - 1].content + delta,
                };
                return next;
              });
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "assistant", content: `⚠️ ${msg}` };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-[460px]">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <div className="p-1.5 rounded-lg bg-primary/15">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground">BBQS Discovery Assistant</h2>
          <p className="text-xs text-muted-foreground">Ask about people, projects, tools, and publications.</p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
          Beta
        </span>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Try one of these prompts, or ask your own question:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "user" ? (
              <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm bg-primary text-primary-foreground text-sm">
                {m.content}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-foreground prose-a:text-primary prose-p:my-1.5 prose-ul:my-1.5">
                {m.content ? (
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => {
                        const isInternal = href?.startsWith("/");
                        return isInternal ? (
                          <Link to={href!} className="text-primary underline">
                            {children}
                          </Link>
                        ) : (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-background"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the BBQS assistant…"
          disabled={streaming}
          className="flex-1 bg-transparent text-sm px-2 py-1.5 outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="sm" disabled={streaming || !input.trim()}>
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}