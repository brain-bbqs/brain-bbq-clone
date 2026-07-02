import ReactMarkdown from "react-markdown";
import { ScrollText, Github } from "lucide-react";
import { constitution } from "@/data/roadmap-themes";
import { PageMeta } from "@/components/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Constitution() {
  return (
    <>
      <PageMeta
        title="Constitution · BBQS Engineering"
        description="The principles every BBQS roadmap item, spec, and pull request must uphold. Public, versioned, and amendable by PR."
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <ScrollText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Constitution</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Principles every roadmap item, spec, and PR must uphold.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[10px]">
              .specify/memory/constitution.md
            </Badge>
            <Badge variant="outline">Public · versioned · amendable by PR</Badge>
            <Button asChild variant="outline" size="sm" className="ml-auto h-7">
              <a
                href="https://github.com/lovable-dev/brain-bbq-clone/blob/main/.specify/memory/constitution.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-3.5 h-3.5 mr-1.5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </header>

        <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none rounded-xl border bg-card p-6 sm:p-8">
          <ReactMarkdown>{constitution}</ReactMarkdown>
        </article>

        <p className="text-xs text-muted-foreground">
          To propose an amendment, open a PR that edits{" "}
          <code className="font-mono">.specify/memory/constitution.md</code> and references at least one
          existing spec impacted by the change.
        </p>
      </div>
    </>
  );
}