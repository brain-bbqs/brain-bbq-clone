import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { WordCloud } from "./WordCloud";

type Term = { term: string; count: number; projects: number };
type Data = { terms: Term[]; bigrams: Term[]; grants: number };

export function InteractionalLayer() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: resp, error } = await supabase.functions.invoke("interactional-terms", { body: {} });
      if (cancel) return;
      if (error) { setErr(error.message); return; }
      if (resp?.error) { setErr(resp.error); return; }
      setData(resp as Data);
    })();
    return () => { cancel = true; };
  }, []);

  if (err) return <div className="p-6 text-sm text-rose-600">Failed to load: {err}</div>;
  if (!data) return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Tokenizing abstracts across {" "}
      <span className="font-mono">{"grants"}</span>…
    </div>
  );

  const maxProjects = Math.max(1, ...data.terms.map((t) => t.projects));
  const topContext = data.terms.slice(0, 15);
  const maxCtx = Math.max(1, ...topContext.map((t) => t.projects));

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground max-w-3xl">
        <strong className="text-foreground">Micro layer:</strong> word reuse and linguistic entrainment.
        Larger words appear more often; deeper color = shared across more projects. Tokens under {data.grants} project abstracts + keyword sets.
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Shared vocabulary</CardTitle>
          <CardDescription>Terms used in ≥2 projects — top {data.terms.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <WordCloud terms={data.terms} maxProjects={maxProjects} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Context switch</CardTitle>
            <CardDescription>How many different projects each top term shows up in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {topContext.map((t) => (
              <div key={t.term} className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium w-24 truncate" title={t.term}>{t.term}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-violet-500"
                         style={{ width: `${(t.projects / maxCtx) * 100}%` }} />
                  </div>
                </div>
                <span className="tabular-nums text-muted-foreground w-16 text-right">
                  {t.projects} projects
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shared bigrams</CardTitle>
            <CardDescription>Two-word phrases reused across projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.bigrams.length === 0 && (
              <div className="text-xs text-muted-foreground">No cross-project bigrams yet.</div>
            )}
            {data.bigrams.map((b) => (
              <div key={b.term} className="flex items-center justify-between text-xs border-t first:border-t-0 py-1">
                <span className="font-mono">{b.term}</span>
                <span className="text-muted-foreground tabular-nums">
                  {b.projects} projects · {b.count}×
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}