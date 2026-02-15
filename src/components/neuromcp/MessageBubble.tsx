import { Bot, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ContextSource {
  type: string;
  title: string;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  contextSources?: ContextSource[];
}

export function MessageBubble({ role, content, contextSources }: MessageBubbleProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 max-w-[90%] sm:max-w-[85%] text-sm sm:text-base shadow-sm">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] sm:max-w-[85%] space-y-2">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base text-muted-foreground">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
        {contextSources && contextSources.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 ml-9">
            <Database className="h-3 w-3 shrink-0" />
            <span className="break-words">
              Sources: {contextSources.map(s => s.title).slice(0, 2).join(", ")}
              {contextSources.length > 2 && ` +${contextSources.length - 2} more`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
