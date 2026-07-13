import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserTier } from "@/hooks/useUserTier";
import { PageMeta } from "@/components/PageMeta";
import NotFound from "./NotFound";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
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

export default function InternalCoordination() {
  const { isAdmin, isLoading } = useUserTier();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    // Audit trail: log the view.
    supabase.from("auth_audit_log").insert({ event: "internal_research_view" }).then(() => {});
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

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

  async function recompute() {
    setRecomputing(true);
    const { error } = await supabase.functions.invoke("internal-research-worker", {
      body: { mode: "backfill" },
    });
    setRecomputing(false);
    if (error) {
      toast({ title: "Recompute failed", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.rpc("ir_snapshot_now");
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

  if (isLoading) return null;
  if (!isAdmin) return <NotFound />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageMeta title="Admin" description="Admin" noindex />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Coordination Instrumentation</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Admin-only. Purpose is coordination, never evaluation. Numbers below are z-scored
            against the current consortium and drift as the group drifts. Do not share out.
          </p>
        </div>
        <Button onClick={recompute} disabled={recomputing} size="sm">
          {recomputing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Recompute
        </Button>
      </div>

      {avg && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card label="Investigators" value={rows.length.toString()} />
          <Card label="Mean personality" value={avg.p.toFixed(2)} />
          <Card label="Mean science" value={avg.s.toFixed(2)} />
          <Card label="Mean adhesion" value={avg.a.toFixed(2)} />
        </div>
      )}

      {trend.length > 0 && (
        <div className="rounded border border-border bg-card p-4 mb-6">
          <div className="text-sm font-medium mb-2">Adhesion trend</div>
          <Sparkline values={trend.map((t) => Number(t.mean_adhesion) || 0)} />
        </div>
      )}

      <div className="rounded border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2 font-medium">Investigator</th>
              <th className="p-2 font-medium text-right">Personality</th>
              <th className="p-2 font-medium text-right">Science</th>
              <th className="p-2 font-medium text-right">Adhesion</th>
              <th className="p-2 font-medium text-right">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
              </td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">
                No profiles yet. Click Recompute to build the first pass.
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
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Views of this page are logged. No per-person value on this page is ever exposed to
        consortium members.
      </p>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="text-xs text-muted-foreground">Not enough snapshots yet.</div>;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const w = 600, h = 60;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
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
        <td className="p-2 text-right tabular-nums text-muted-foreground">{row.token_count}</td>
      </tr>
      {expanded && (
        <tr className="border-t border-border bg-muted/20">
          <td colSpan={5} className="p-3">
            <div className="text-xs text-muted-foreground mb-2">Top LIWC categories (share of tokens)</div>
            <div className="grid grid-cols-4 gap-2 text-xs">
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