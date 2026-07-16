import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Summary = { summary: string; n_grants: number; generated_at: string };
type SummaryResp = Record<"R61" | "R34", Summary>;

type AttentionData = {
  projectClicks?: { grant_number: string; title: string | null; count: number }[];
};

const COHORTS = [
  { key: "R61" as const, title: "R61 · Translational Neural Devices", hue: 200 },
  { key: "R34" as const, title: "R34 · Animal Behavior & Collective Intelligence", hue: 30 },
];

export function CognitiveLayer() {
  const [summaries, setSummaries] = useState<SummaryResp | null>(null);
  const [attention, setAttention] = useState<AttentionData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const [s, a] = await Promise.all([
        supabase.functions.invoke("cohort-mental-model-summary", { body: {} }),
        supabase.functions.invoke("analytics-summary", { body: {} }),
      ]);
      if (cancel) return;
      if (s.error) setErr(s.error.message);
      else setSummaries(s.data as SummaryResp);
      if (!a.error) setAttention(a.data as AttentionData);
    })();
    return () => { cancel = true; };
  }, []);

  const maxClicks = Math.max(1, ...(attention?.projectClicks ?? []).map((p) => p.count));

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground max-w-3xl">
        <strong className="text-foreground">Meso layer:</strong> shared mental models (grant abstracts, synthesized by AI)
        and shared attention (where consortium members actually go on the platform).
      </div>

      {err && <div className="p-3 text-sm text-rose-600">Summary error: {err}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {COHORTS.map((c) => {
          const s = summaries?.[c.key];
          return (
            <Card key={c.key}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(${c.hue} 75% 55%)` }} />
                  {c.title}
                </CardTitle>
                <CardDescription>
                  Shared mental model{s?.n_grants ? ` — synthesized from ${s.n_grants} grant abstracts` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!s ? (
                  <div className="text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Reading abstracts…
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{s.summary || "No abstracts available yet."}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Shared attention — which projects people actually visit</CardTitle>
          <CardDescription>Aggregate clicks + page opens per project across all consortium users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {!attention?.projectClicks?.length && (
            <div className="text-xs text-muted-foreground">
              No project attention captured yet — this list populates once consortium members start opening project pages.
            </div>
          )}
          {(attention?.projectClicks ?? []).slice(0, 15).map((p) => (
            <div key={p.grant_number} className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs border-t first:border-t-0 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-muted-foreground w-28 shrink-0">{p.grant_number}</span>
                <span className="truncate">{p.title || "—"}</span>
                <div className="h-1.5 flex-1 min-w-16 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(p.count / maxClicks) * 100}%` }} />
                </div>
              </div>
              <span className="tabular-nums text-muted-foreground w-16 text-right">{p.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}