import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { isPreviewMode } from "@/lib/preview-mode";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface ProfileRow {
  investigator_id: string;
  full_name: string;
  personality_score: number | null;
  science_score: number | null;
  adhesion: number | null;
  token_count: number;
  last_computed_at: string;
  liwc: Record<string, number>;
  attention_clicks?: number;
  attention_top_path?: string | null;
}

interface TrendRow {
  snapshot_date: string;
  mean_personality: number;
  mean_science: number;
  mean_adhesion: number;
  n: number;
}

export function CoordinationInstrumentation() {
  // Preview builds get synthetic data so the panel is visible while developing.
  const useMock = isPreviewMode();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [, setTrend] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      if (useMock) {
        const mock = buildMockData();
        setRows(mock.rows);
        setTrend(mock.trend);
        setLoading(false);
        return;
      }
      await reload();
      const { data: existing } = await supabase.rpc("ir_list_profiles");
      if (!existing || (existing as unknown[]).length === 0) {
        await autoCompute();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reload() {
    setLoading(true);
    const [{ data: profiles }, { data: t }, { data: invList }, { data: clicks }] = await Promise.all([
      supabase.rpc("ir_list_profiles"),
      supabase.rpc("ir_consortium_trend"),
      supabase.from("investigators").select("id, name, user_id").order("name"),
      supabase.from("analytics_clicks").select("user_id, path").not("user_id", "is", null).limit(10000),
    ]);

    // Build attention (click count + top path) per user_id
    const attentionByUser = new Map<string, { count: number; paths: Map<string, number> }>();
    for (const c of (clicks ?? []) as { user_id: string | null; path: string | null }[]) {
      if (!c.user_id) continue;
      const rec = attentionByUser.get(c.user_id) ?? { count: 0, paths: new Map() };
      rec.count += 1;
      if (c.path) rec.paths.set(c.path, (rec.paths.get(c.path) ?? 0) + 1);
      attentionByUser.set(c.user_id, rec);
    }
    const topPathFor = (uid: string | null) => {
      if (!uid) return { count: 0, path: null as string | null };
      const rec = attentionByUser.get(uid);
      if (!rec) return { count: 0, path: null };
      let top: string | null = null; let max = 0;
      rec.paths.forEach((v, k) => { if (v > max) { max = v; top = k; } });
      return { count: rec.count, path: top };
    };

    // Merge: every investigator gets a row, whether or not a profile exists.
    const profileById = new Map<string, ProfileRow>();
    for (const p of ((profiles ?? []) as ProfileRow[])) profileById.set(p.investigator_id, p);
    const merged: ProfileRow[] = ((invList ?? []) as { id: string; name: string; user_id: string | null }[])
      .map((inv) => {
        const p = profileById.get(inv.id);
        const att = topPathFor(inv.user_id);
        if (p) return { ...p, full_name: p.full_name || inv.name || "(unknown)", attention_clicks: att.count, attention_top_path: att.path };
        return {
          investigator_id: inv.id,
          full_name: inv.name || "(unknown)",
          personality_score: null,
          science_score: null,
          adhesion: null,
          token_count: 0,
          last_computed_at: new Date(0).toISOString(),
          liwc: {},
          attention_clicks: att.count,
          attention_top_path: att.path,
        };
      });
    setRows(merged);
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

  // ── Derived psychology dimensions from the raw LIWC vector ──────────────
  const enriched = useMemo(() => rows.map((r) => {
    const l = r.liwc ?? {};
    const g = (k: string) => Number(l[k] ?? 0);
    return {
      ...r,
      tone: g("posemo") - g("negemo"),
      emotion: g("posemo") + g("negemo") + g("anxiety") + g("anger") + g("sadness"),
      analytic: Math.max(0, g("insight") + g("causation") + g("cogproc") - g("fillers") - g("nonfluencies")),
      certainty_balance: g("certainty") - g("tentative"),
      self_focus: g("first_person_singular") || g("i"),
      group_focus: g("first_person_plural") || g("we"),
      social: g("social") + g("humans") + g("friends") + g("family"),
      long_words: g("long_words"),
    };
  }), [rows]);

  const means = useMemo(() => {
    if (enriched.length === 0) return null;
    const keys = ["tone", "analytic", "long_words"] as const;
    const acc: Record<string, number> = {};
    keys.forEach((k) => {
      acc[k] = enriched.reduce((s, r) => s + (r as any)[k], 0) / enriched.length;
    });
    return acc as Record<(typeof keys)[number], number>;
  }, [enriched]);

  // ── Person × Person cosine similarity across the full LIWC vector ───────
  const corr = useMemo(() => {
    if (rows.length < 2) return null;
    const cats = Array.from(new Set(rows.flatMap((r) => Object.keys(r.liwc ?? {}))))
      .filter((k) => k !== "long_words");
    const vs = rows.map((r) => cats.map((k) => Number(r.liwc?.[k] ?? 0)));
    const ns = vs.map((v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1);
    const M = rows.map((_, i) => rows.map((__, j) => {
      let dot = 0;
      for (let k = 0; k < cats.length; k++) dot += vs[i][k] * vs[j][k];
      return dot / (ns[i] * ns[j]);
    }));
    return { M, names: rows.map((r) => r.full_name), ids: rows.map((r) => r.investigator_id) };
  }, [rows]);

  const columnDefs = useMemo<ColDef<any>[]>(() => {
    const numFmt = (p: any) => (p.value == null ? "—" : Number(p.value).toFixed(3));
    const pctFmt = (p: any) => (p.value == null ? "—" : (Number(p.value) * 100).toFixed(2) + "%");
    return [
      { headerName: "Person", field: "full_name", pinned: "left", minWidth: 180, flex: 1 },
      { headerName: "Tokens", field: "token_count", width: 100, type: "numericColumn", cellClass: "tabular-nums text-right" },
      { headerName: "Attention (clicks)", field: "attention_clicks", width: 150, type: "numericColumn",
        headerTooltip: "Total tracked clicks by this person across the platform", cellClass: "tabular-nums text-right",
        valueFormatter: (p: any) => (p.value == null ? "—" : Number(p.value).toLocaleString()) },
      { headerName: "Top page", field: "attention_top_path", width: 200,
        headerTooltip: "Page where this person clicks most — proxy for where their attention lives",
        cellClass: "font-mono text-xs",
        valueFormatter: (p: any) => p.value ?? "—" },
      { headerName: "Tone (pos−neg)", field: "tone", width: 140, valueFormatter: numFmt,
        headerTooltip: "Positive minus negative emotion word share", cellClass: "tabular-nums text-right" },
      { headerName: "Emotion", field: "emotion", width: 110, valueFormatter: pctFmt,
        headerTooltip: "Total share of affect words", cellClass: "tabular-nums text-right" },
      { headerName: "Analytic", field: "analytic", width: 110, valueFormatter: pctFmt,
        headerTooltip: "Insight + causation + cognitive processing (minus fillers)", cellClass: "tabular-nums text-right" },
      { headerName: "Certainty", field: "certainty_balance", width: 120, valueFormatter: numFmt,
        headerTooltip: "Certainty minus tentative language", cellClass: "tabular-nums text-right" },
      { headerName: "Self focus (I)", field: "self_focus", width: 130, valueFormatter: pctFmt,
        headerTooltip: "First-person singular pronouns", cellClass: "tabular-nums text-right" },
      { headerName: "Group focus (we)", field: "group_focus", width: 150, valueFormatter: pctFmt,
        headerTooltip: "First-person plural pronouns", cellClass: "tabular-nums text-right" },
      { headerName: "Social", field: "social", width: 110, valueFormatter: pctFmt,
        headerTooltip: "Social references: people, family, colleagues", cellClass: "tabular-nums text-right" },
      { headerName: "Long words", field: "long_words", width: 120, valueFormatter: pctFmt,
        headerTooltip: "Share of tokens > 6 letters — verbal complexity proxy", cellClass: "tabular-nums text-right" },
    ];
  }, []);

  const defaultColDef = useMemo<ColDef>(() => ({ sortable: true, filter: true, resizable: true }), []);
  const selectedRow = enriched.find((r) => r.investigator_id === selected) ?? null;

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
                {useMock && <Badge variant="outline">Preview · synthetic</Badge>}
                {computing && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> updating…
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Psycholinguistic fingerprints · word-choice similarity between people
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
          Purpose is coordination, never evaluation. Each row is one person's word-choice
          fingerprint: tone, emotional intensity, analytical framing, self- vs group-focus,
          verbal complexity. The heatmap below shows how similar each person's fingerprint
          is to everyone else's. Not visible to non-admin members. Do not share out.
        </p>
      </div>

      {means && (
        <div className="grid gap-3 md:grid-cols-4">
          <MiniCard label="People" value={rows.length.toString()} />
          <MiniCard label="Mean tone" value={means.tone.toFixed(3)} hint="pos − neg emotion" />
          <MiniCard label="Mean analytic" value={(means.analytic * 100).toFixed(2) + "%"} hint="cognitive framing share" />
          <MiniCard label="Mean long-word share" value={(means.long_words * 100).toFixed(2) + "%"} hint="verbal complexity" />
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Per-person profiles</CardTitle>
          <CardDescription>
            Word-choice dimensions per person. Attention columns come from tracked clicks —
            proxy for where each person's focus lives on the platform. Click a row to see their
            top LIWC categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LiwcLegend />
          <div className="ag-theme-alpine mt-3" style={{ width: "100%", height: 560 }}>
            <AgGridReact
              rowData={enriched}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowSelection="single"
              onRowClicked={(e) => setSelected(e.data.investigator_id)}
              animateRows
              suppressCellFocus
              overlayNoRowsTemplate={
                loading || computing
                  ? '<span style="color:hsl(var(--muted-foreground))">Loading…</span>'
                  : '<span style="color:hsl(var(--muted-foreground))">No people yet.</span>'
              }
            />
          </div>
          <CardDescription>
            Word-choice dimensions per person. Click a row to see their top LIWC categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ag-theme-alpine" style={{ width: "100%", height: 460 }}>
            <AgGridReact
              rowData={enriched}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowSelection="single"
              onRowClicked={(e) => setSelected(e.data.investigator_id)}
              animateRows
              suppressCellFocus
              overlayNoRowsTemplate={
                loading || computing
                  ? '<span style="color:hsl(var(--muted-foreground))">Loading…</span>'
                  : '<span style="color:hsl(var(--muted-foreground))">No profiles yet — corpus empty or worker failed.</span>'
              }
            />
          </div>
          {selectedRow && (
            <div className="mt-4 rounded-lg border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-2">
                Top LIWC categories for{" "}
                <span className="text-foreground font-medium">{selectedRow.full_name}</span> · share of tokens
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {Object.entries(selectedRow.liwc ?? {})
                  .filter(([k]) => k !== "long_words")
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .slice(0, 12)
                  .map(([cat, pct]) => (
                    <div key={cat} className="flex justify-between">
                      <span className="text-muted-foreground">{cat.replace(/_/g, " ")}</span>
                      <span className="tabular-nums">{((pct as number) * 100).toFixed(2)}%</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {corr && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Psychology correlation graph</CardTitle>
            <CardDescription>
              Cosine similarity between each pair of people, computed on the full LIWC
              category vector. Warmer = more similar word-choice fingerprint.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CorrelationHeatmap data={corr} />
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Views of this section are logged. No per-person value here is exposed to consortium
        members.
      </p>
    </section>
  );
}

function MiniCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card/40 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function CorrelationHeatmap({
  data,
}: { data: { M: number[][]; names: string[]; ids: string[] } }) {
  const { M, names } = data;
  const n = names.length;
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i === j) continue;
    if (M[i][j] < lo) lo = M[i][j];
    if (M[i][j] > hi) hi = M[i][j];
  }
  if (!isFinite(lo)) { lo = 0; hi = 1; }
  const range = hi - lo || 1;
  const color = (v: number) => {
    const t = Math.max(0, Math.min(1, (v - lo) / range));
    const h = 210 - t * 170; // blue → amber
    const l = 25 + t * 30;
    return `hsl(${h} 70% ${l}%)`;
  };
  const cell = 28;
  const labelW = 160;
  return (
    <div className="overflow-auto">
      <div className="inline-block">
        <div className="flex" style={{ paddingLeft: labelW }}>
          {names.map((nm) => (
            <div
              key={`h-${nm}`}
              className="text-[10px] text-muted-foreground"
              style={{
                width: cell, height: 90,
                writingMode: "vertical-rl", transform: "rotate(180deg)",
                overflow: "hidden", whiteSpace: "nowrap",
              }}
              title={nm}
            >
              {nm}
            </div>
          ))}
        </div>
        {names.map((rowName, i) => (
          <div key={`r-${rowName}-${i}`} className="flex items-center">
            <div
              className="text-[11px] text-muted-foreground truncate pr-2 text-right"
              style={{ width: labelW }}
              title={rowName}
            >
              {rowName}
            </div>
            {names.map((colName, j) => {
              const v = M[i][j];
              return (
                <div
                  key={`c-${i}-${j}`}
                  title={`${rowName} × ${colName}: ${v.toFixed(3)}`}
                  style={{
                    width: cell, height: cell,
                    background: i === j ? "hsl(var(--muted))" : color(v),
                    borderRight: "1px solid hsl(var(--background))",
                    borderBottom: "1px solid hsl(var(--background))",
                  }}
                />
              );
            })}
          </div>
        ))}
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>less similar</span>
          <div
            className="h-2 w-40 rounded"
            style={{
              background: `linear-gradient(to right, ${color(lo)}, ${color((lo + hi) / 2)}, ${color(hi)})`,
            }}
          />
          <span>more similar</span>
          <span className="ml-2 tabular-nums">{lo.toFixed(2)} → {hi.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function buildMockData(): { rows: ProfileRow[]; trend: TrendRow[] } {
  const names = [
    "Ada Okafor", "Rahul Menon", "Sofía Álvarez", "Wen Zhang", "Priya Iyer",
    "Jonas Berg", "Amara Diallo", "Kenji Watanabe", "Lena Novak", "Mateo Rossi",
    "Yasmin Haddad", "Noah Fischer",
  ];
  // Real LIWC-dict keys so derived psychology fields populate in preview.
  const liwcCats = [
    "posemo", "negemo", "anxiety", "anger", "sadness",
    "cogproc", "insight", "causation", "tentative", "certainty",
    "social", "family", "friends", "humans",
    "first_person_singular", "first_person_plural", "second_person",
    "work", "achievement",
  ];
  const seed = (n: number) => {
    const x = Math.sin(n * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  const rows: ProfileRow[] = names.map((full_name, i) => {
    const liwc: Record<string, number> = {};
    liwcCats.forEach((c, j) => {
      liwc[c] = 0.005 + seed(i * 31 + j) * 0.06;
    });
    liwc.long_words = 0.15 + seed(i + 91) * 0.2;
    return {
      investigator_id: `mock-${i}`,
      full_name,
      personality_score: (seed(i + 1) - 0.5) * 2,
      science_score: (seed(i + 2) - 0.5) * 2,
      adhesion: (seed(i + 3) - 0.5) * 2,
      token_count: 1200 + Math.floor(seed(i + 7) * 4000),
      last_computed_at: new Date().toISOString(),
      liwc,
    };
  });
  const trend: TrendRow[] = [];
  return { rows, trend };
}