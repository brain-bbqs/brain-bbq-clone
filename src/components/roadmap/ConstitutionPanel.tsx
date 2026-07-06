import ReactMarkdown from "react-markdown";
import { constitution } from "@/data/roadmap-themes";
import { ScrollText } from "lucide-react";

export function ConstitutionPanel() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <ScrollText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">AI Constitution</h2>
          <p className="text-sm text-muted-foreground">
            Principles every roadmap item, spec, and PR must uphold. Public and versioned in{" "}
            <code className="text-xs">.specify/memory/constitution.md</code>.
          </p>
        </div>
      </div>
      <article className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{constitution}</ReactMarkdown>
      </article>
    </div>
  );
}