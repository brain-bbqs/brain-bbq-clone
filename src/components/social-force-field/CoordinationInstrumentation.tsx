import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProfileRow {
  investigator_id: string;
  full_name: string;
  personality_score: number | null;
  science_score: number | null;
  adhesion: number | null;
  token_count: number;
  last_computed_at: string;
  liwc: Record<string, number>;
}

interface TrendRow {
  snapshot_date: string;
  mean_personality: number;
  mean_science: number;
  mean_adhesion: number;
  n: number;
}

export function CoordinationInstrumentation() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      await reload();
      // If we have no profiles yet, run a compute automatically so admins never see an empty pane.
      const { data: existing } = await supabase.rpc("ir_list_profiles");
      if (!existing || (existing as unknown[]).length === 0) {
        await autoCompute();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reload() {
    setLoading(true);
    const [{ data: profiles }, { data: t }] = await Promise.all([
      supabase.rpc("ir_list_profiles"),
      supabase.rpc("ir_consortium_trend"),
    ]);
    setRows((profiles ?? []) as ProfileRow[]);
    setTrend((t ?? []) as TrendRow[]);
    setLoading(false);
  }

  async function autoCompute() {
    setComputing(true);
    const { data, error } = await supabase.functions.invoke("internal-research-worker", {
      body: { mode: "backfill" },
    });
    setComputing(false);
    if (error) {
      // Read the real error body — supabase.functions.invoke masks non-2xx bodies otherwise.
      let detail = error.message;
      try {
        const ctx: any = (error as any).context;
        if (ctx?.text) detail = (await ctx.text()) || detail;
      } catch { /* ignore */ }
      toast({ title: "Coordination data unavailable", description: detail, variant: "destructive" });
      return;
    }
    if ((data as any)?.error) {
      toast({ title: "Coordination data unavailable", description: (data as any).error, variant: "destructive" });
      return;
    }
    await reload();
  }

  const avg = useMemo(() => {
    if (rows.length === 0) return null;
    const s = rows.reduce(
      (a, r) => ({
        p: a.p + (Number(r.personality_score) || 0),
        s: a.s + (Number(r.science_score) || 0),
        a: a.a + (Number(r.adhesion) || 0),
      }),
      { p: 0, s: 0, a: 0 },
    );
    return { p: s.p / rows.length, s: s.s / rows.length, a: s.a / rows.length };
  }, [rows]);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border bg-background/60 p-2">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Coordination instrumentation</h2>
                <Badge variant="outline">Admin-only</Badge>
                {computing && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> updating…
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Psycholinguistic profiles · mutual-vocabulary similarity · social adhesion
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
          Purpose is coordination, never evaluation. Numbers are z-scored against the current
          consortium and drift as the group drifts. Not visible to non-admin members. Do not
          share out.
        </p>
      </div>

      {avg && (
        <div className="grid gap-3 md:grid-cols-4">
          <MiniCard label="People" value={rows.length.toString()} />
          <MiniCard label="Mean personality" value={avg.p.toFixed(2)} />
          <MiniCard label="Mean science" value={avg.s.toFixed(2)} />
          <MiniCard label="Mean adhesion" value={avg.a.toFixed(2)} />
        </div>
      )}

      {trend.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Adhesion trend</CardTitle>
            <CardDescription>Consortium-wide mean adhesion across daily snapshots</CardDescription>
          </CardHeader>
          <CardContent>
            <Sparkline values={trend.map((t) => Number(t.mean_adhesion) || 0)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Per-person profiles</CardTitle>
          <CardDescription>Click a row to see the top LIWC categories</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2 font-medium">Person</th>
                <th className="p-2 font-medium text-right">Personality</th>
                <th className="p-2 font-medium text-right">Science</th>
                <th className="p-2 font-medium text-right">Adhesion</th>
              </tr>
            </thead>
            <tbody>
              {(loading || computing) && rows.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
                </td></tr>
              )}
              {!loading && !computing && rows.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">
                  No profiles yet — the corpus is empty or the worker failed. Check function logs.
                </td></tr>
              )}
              {rows.map((r) => (
                <FragmentRow
                  key={r.investigator_id}
                  row={r}
                  expanded={expanded === r.investigator_id}
                  onToggle={() =>
                    setExpanded((cur) => (cur === r.investigator_id ? null : r.investigator_id))
                  }
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Views of this section are logged. No per-person value here is exposed to consortium
        members.
      </p>
    </section>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/40 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="text-xs text-muted-foreground">Not enough snapshots yet.</div>;
  }
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const w = 600, h = 60;
  const pts = values.map((v, i) =>
    `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`
  ).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16 text-amber-400">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={pts} />
    </svg>
  );
}

function FragmentRow({
  row, expanded, onToggle,
}: { row: ProfileRow; expanded: boolean; onToggle: () => void }) {
  const num = (n: number | null) => (n == null ? "—" : Number(n).toFixed(2));
  const topCats = useMemo(() => {
    return Object.entries(row.liwc ?? {})
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 8);
  }, [row.liwc]);
  return (
    <>
      <tr className="border-t border-border cursor-pointer hover:bg-muted/30" onClick={onToggle}>
        <td className="p-2">{row.full_name}</td>
        <td className="p-2 text-right tabular-nums">{num(row.personality_score)}</td>
        <td className="p-2 text-right tabular-nums">{num(row.science_score)}</td>
        <td className="p-2 text-right tabular-nums font-medium">{num(row.adhesion)}</td>
      </tr>
      {expanded && (
        <tr className="border-t border-border bg-muted/20">
          <td colSpan={4} className="p-3">
            <div className="text-xs text-muted-foreground mb-2">
              Top LIWC categories (share of tokens)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {topCats.map(([cat, pct]) => (
                <div key={cat} className="flex justify-between">
                  <span className="text-muted-foreground">{cat}</span>
                  <span className="tabular-nums">{((pct as number) * 100).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}