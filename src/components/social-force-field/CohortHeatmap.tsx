import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Model = "bigfive" | "hexaco";
type Cohort = "R61" | "R34";

const BF_KEYS = ["e", "a", "c", "s", "o"] as const;
const HX_KEYS = ["h", "e", "x", "a", "c", "o"] as const;
const BF_LABEL: Record<string, string> = { e: "Extra", a: "Agree", c: "Consc", s: "Stab", o: "Open" };
const HX_LABEL: Record<string, string> = { h: "H-H", e: "Emo", x: "Extra", a: "Agree", c: "Consc", o: "Open" };

type Row = {
  investigator_id: string;
  full_name: string;
  scores: Record<string, number>;
  clicks: number;
  pageviews: number;
  linked: boolean;
};

const COHORT_META: Record<Cohort, { title: string; subtitle: string; hue: number }> = {
  R61: {
    title: "R61 · Translational Neural Devices",
    subtitle:
      "Shared mental model: engineering next-generation neural interfaces for human translation — closed-loop stimulation, decoding, and clinical BCI.",
    hue: 200,
  },
  R34: {
    title: "R34 · Animal Behavior, Intelligence & Collective Behavior",
    subtitle:
      "Shared mental model: quantifying naturalistic behavior across species — collective dynamics, learning, and computational ethology.",
    hue: 30,
  },
};

function zscore(xs: number[]): number[] {
  const n = xs.length; if (!n) return [];
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / n) || 1;
  return xs.map((x) => (x - mean) / sd);
}

function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const d = Math.sqrt(dx * dy);
  return d === 0 ? 0 : num / d;
}

export function CohortHeatmap({ cohort, model }: { cohort: Cohort; model: Model }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [muted, setMuted] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: cohortRows }, { data: scores }, { data: invs }, { data: att }] =
        await Promise.all([
          supabase.from("investigator_cohorts").select("investigator_id, cohort").eq("cohort", cohort),
          supabase.from("personality_scores").select("investigator_id, big_five, hexaco"),
          supabase.from("investigators").select("id, full_name, user_id"),
          supabase.rpc("get_investigator_attention"),
        ]);
      if (cancelled) return;
      const cohortIds = new Set((cohortRows ?? []).map((r: any) => r.investigator_id));
      const scoreMap = new Map((scores ?? []).map((s: any) => [s.investigator_id, s]));
      const attMap = new Map((att ?? []).map((a: any) => [a.investigator_id, a]));
      const built: Row[] = [];
      const mutedList: Row[] = [];
      for (const inv of invs ?? []) {
        if (!cohortIds.has(inv.id)) continue;
        const s: any = scoreMap.get(inv.id);
        const a: any = attMap.get(inv.id);
        const scoresBlock = (model === "bigfive" ? s?.big_five : s?.hexaco) ?? {};
        const r: Row = {
          investigator_id: inv.id,
          full_name: inv.full_name,
          scores: scoresBlock,
          clicks: a?.clicks ?? 0,
          pageviews: a?.pageviews ?? 0,
          linked: !!inv.user_id,
        };
        if (r.linked && (r.clicks + r.pageviews) > 0) built.push(r);
        else mutedList.push(r);
      }
      built.sort((a, b) => (b.clicks + b.pageviews) - (a.clicks + a.pageviews));
      mutedList.sort((a, b) => a.full_name.localeCompare(b.full_name));
      setRows(built); setMuted(mutedList);
    })();
    return () => { cancelled = true; };
  }, [cohort, model]);

  const meta = COHORT_META[cohort];
  const keys = model === "bigfive" ? BF_KEYS : HX_KEYS;
  const labels = model === "bigfive" ? BF_LABEL : HX_LABEL;

  const { attentionZ, correlations, traitZ } = useMemo(() => {
    if (!rows || rows.length < 2) return { attentionZ: [] as number[], correlations: {} as Record<string, number>, traitZ: {} as Record<string, number[]> };
    const att = rows.map((r) => Math.log1p(r.clicks + r.pageviews));
    const az = zscore(att);
    const tz: Record<string, number[]> = {};
    const cor: Record<string, number> = {};
    for (const k of keys) {
      const raw = rows.map((r) => Number(r.scores[k]) || 0);
      tz[k] = zscore(raw);
      cor[k] = pearson(raw, att);
    }
    return { attentionZ: az, correlations: cor, traitZ: tz };
  }, [rows, keys]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: `hsl(${meta.hue} 75% 55%)` }}
          />
          {meta.title}
        </CardTitle>
        <CardDescription>{meta.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows === null ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading cohort…
          </div>
        ) : rows.length === 0 && muted.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No investigators in this cohort yet.</div>
        ) : (
          <>
            {/* Header row */}
            <div className="grid gap-2 text-[10px] uppercase text-muted-foreground mb-2"
                 style={{ gridTemplateColumns: `minmax(120px,1.4fr) repeat(${keys.length}, minmax(0,1fr)) minmax(90px,1fr)` }}>
              <div>Investigator</div>
              {keys.map((k) => <div key={k} className="text-center">{labels[k]}</div>)}
              <div className="text-right">Attention (z)</div>
            </div>

            {/* Rows */}
            <div className="space-y-0.5">
              {rows.map((r, i) => {
                const az = attentionZ[i] ?? 0;
                return (
                  <div key={r.investigator_id}
                       className="grid gap-2 items-center"
                       style={{ gridTemplateColumns: `minmax(120px,1.4fr) repeat(${keys.length}, minmax(0,1fr)) minmax(90px,1fr)` }}>
                    <div className="text-xs truncate" title={r.full_name}>{r.full_name}</div>
                    {keys.map((k, ki) => {
                      const z = traitZ[k]?.[i] ?? 0;
                      const clamped = Math.max(-2, Math.min(2, z));
                      // diverging: below-mean = cool grey, above-mean = cohort hue
                      const alpha = Math.abs(clamped) / 2;
                      const bg = clamped >= 0
                        ? `hsl(${meta.hue} 75% ${65 - alpha * 25}%)`
                        : `hsl(220 10% ${85 - alpha * 30}%)`;
                      return (
                        <div key={k} className="h-5 rounded-sm" style={{ backgroundColor: bg }}
                             title={`${labels[k]}: raw ${(r.scores[k] ?? 0).toFixed(3)} · z ${z.toFixed(2)}`} />
                      );
                    })}
                    <div className="flex items-center gap-1 justify-end">
                      <div className="h-2 rounded-sm bg-muted overflow-hidden flex-1 max-w-[80px]">
                        <div className="h-full"
                             style={{
                               width: `${Math.min(100, Math.abs(az) * 40)}%`,
                               marginLeft: az < 0 ? "auto" : 0,
                               backgroundColor: `hsl(${meta.hue} 75% 55%)`,
                             }} />
                      </div>
                      <div className="w-8 text-[10px] tabular-nums text-right text-muted-foreground">
                        {az.toFixed(1)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Correlation strip */}
            {rows.length >= 3 && (
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-[10px] uppercase text-muted-foreground mb-2">
                  Personality × attention correlation (Pearson r within cohort, n = {rows.length})
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {keys.map((k) => {
                    const r = correlations[k] ?? 0;
                    const strong = Math.abs(r) >= 0.3;
                    return (
                      <span key={k} className="inline-flex items-center gap-1.5">
                        <span className="text-muted-foreground">{labels[k]}</span>
                        <span className={`tabular-nums font-medium ${strong ? (r > 0 ? "text-emerald-600" : "text-rose-600") : "text-muted-foreground"}`}>
                          {r >= 0 ? "+" : ""}{r.toFixed(2)}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Muted / unassigned-attention block */}
            {muted.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border opacity-50">
                <div className="text-[10px] uppercase text-muted-foreground mb-1.5">
                  No attention signal yet ({muted.length}) — shown for cohort completeness
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {muted.map((m) => (
                    <span key={m.investigator_id} title={m.linked ? "Linked account, no activity" : "No linked account"}>
                      {m.full_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
