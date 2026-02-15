import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-secondary/80 hover:bg-secondary text-secondary-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="bg-[hsl(229_50%_12%)] border border-[hsl(229_45%_20%)] rounded-lg p-4 text-xs font-mono text-[hsl(220_20%_85%)] overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}
