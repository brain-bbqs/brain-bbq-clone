import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUserTier } from "@/hooks/useUserTier";
import { MessageSquare, Lock, Layers, TrendingUp, TrendingDown, Minus, Info, MousePointerClick, Eye, Users as UsersIcon } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";

// Isometric single-plane grid — the "base social layer".
// Each cell = one page in the app; brightness = click intensity (14d).
function BaseLayerDiagram({ heatmap, labels }: { heatmap: number[]; labels: string[] }) {
  const W = 560;
  const H = 300;
  const cx = W / 2;
  const gridN = 6;
  const cell = 28;
  const iso = (x: number, y: number) => ({
    x: cx + (x - y) * (cell * 0.9),
    y: 150 + (x + y) * (cell * 0.45),
  });
  const lines: JSX.Element[] = [];
  for (let i = 0; i <= gridN; i++) {
    const a = iso(i, 0), b = iso(i, gridN), c = iso(0, i), d = iso(gridN, i);
    lines.push(
      <line key={`v${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-violet-500" strokeWidth={0.75} opacity={0.55} />,
      <line key={`h${i}`} x1={c.x} y1={c.y} x2={d.x} y2={d.y} className="stroke-violet-500" strokeWidth={0.75} opacity={0.55} />,
    );
  }
  const cells: JSX.Element[] = [];
  for (let gy = 0; gy < gridN; gy++) {
    for (let gx = 0; gx < gridN; gx++) {
      const idx = gy * gridN + gx;
      const v = heatmap[idx] ?? 0;
      if (v <= 0) continue;
      const p1 = iso(gx, gy), p2 = iso(gx + 1, gy), p3 = iso(gx + 1, gy + 1), p4 = iso(gx, gy + 1);
      cells.push(
        <polygon
          key={`c-${idx}`}
          points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
          className="fill-violet-500 stroke-violet-400"
          fillOpacity={0.15 + v * 0.75}
          strokeOpacity={0.5}
        >
          <title>{labels[idx] ?? ""}</title>
        </polygon>,
      );
    }
  }
  return (
    <div className="rounded-xl border bg-card/40 p-6">
      <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,240px)] items-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-muted-foreground" aria-hidden="true">
          {lines}
          {cells}
        </svg>
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-violet-500" />
            <span className="font-medium">Interactional · Micro</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">I = Σ clicks(page_i) over 14d</p>
          <p className="text-xs text-muted-foreground">
            The base social layer. Each cell is one page in the app; brightness reflects real
            click activity from the last 14 days. Hover a cell to see the page.
          </p>
        </div>
      </div>
    </div>
  );
}

type Trend = "up" | "down" | "flat";
function TrendPill({ trend, delta }: { trend: Trend; delta: number }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const cls =
    trend === "up" ? "text-emerald-500 bg-emerald-500/10"
    : trend === "down" ? "text-rose-500 bg-rose-500/10"
    : "text-muted-foreground bg-muted/50";
  const sign = delta > 0 ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {sign}{delta}%
    </span>
  );
}

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const w = 140, h = 36, pad = 2;
  const max = Math.max(...points, 1), min = Math.min(...points);
  const range = Math.max(1, max - min);
  const step = (w - pad * 2) / Math.max(1, points.length - 1);
  const d = points.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <path d={d} fill="none" strokeWidth={1.5} className="stroke-current" />
    </svg>
  );
}

function StatCard({
  icon: Icon, label, value, delta, spark, hint,
}: { icon: typeof Eye; label: string; value: string; delta: number; spark: number[]; hint?: string }) {
  const trend: Trend = delta > 2 ? "up" : delta < -2 ? "down" : "flat";
  return (
    <div className="rounded-lg border bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </div>
        <TrendPill trend={trend} delta={delta} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-3xl font-semibold tabular-nums">{value}</div>
        <Sparkline points={spark} className="text-violet-400" />
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

type Row = { path?: string | null; session_id?: string | null; user_id?: string | null; created_at: string; element_tag?: string | null; element_text?: string | null };

type Data = {
  clicks: number;
  pageviews: number;
  sessions: number;
  users: number;
  clickSpark: number[];
  pvSpark: number[];
  sessionSpark: number[];
  clickDelta: number;
  pvDelta: number;
  sessionDelta: number;
  userDelta: number;
  topPages: { path: string; views: number; clicks: number }[];
  topClickTargets: { text: string; count: number }[];
  tagBreakdown: { tag: string; count: number }[];
  heatmap: number[];
  heatmapLabels: string[];
  firstSeen: string | null;
};

const dayBuckets = (rows: Row[], days: number) => {
  const buckets = new Array(days).fill(0);
  const now = Date.now();
  for (const r of rows) {
    const idx = days - 1 - Math.floor((now - new Date(r.created_at).getTime()) / 86_400_000);
    if (idx >= 0 && idx < days) buckets[idx]++;
  }
  return buckets;
};

const uniqueDayBuckets = (rows: Row[], days: number) => {
  const seen: Array<Set<string>> = Array.from({ length: days }, () => new Set());
  const now = Date.now();
  for (const r of rows) {
    const idx = days - 1 - Math.floor((now - new Date(r.created_at).getTime()) / 86_400_000);
    const id = r.user_id || r.session_id;
    if (idx >= 0 && idx < days && id) seen[idx].add(id);
  }
  return seen.map((s) => s.size);
};

const pct = (curr: number, prev: number) => {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
};

export default function SocialForceField() {
  const { isAdmin, isCurator, isLoading } = useUserTier();
  const navigate = useNavigate();
  const allowed = isAdmin || isCurator;
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    if (!isLoading && !allowed) {
      const t = setTimeout(() => navigate("/", { replace: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [isLoading, allowed, navigate]);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;

    // Page through all rows in the table (RLS + PostgREST caps returns; we page in 1k chunks).
    const fetchAll = async <T,>(table: string, cols: string): Promise<T[]> => {
      const pageSize = 1000;
      const out: T[] = [];
      for (let from = 0; from < 200000; from += pageSize) {
        const { data, error } = await supabase
          .from(table as any)
          .select(cols)
          .order("created_at", { ascending: true })
          .range(from, from + pageSize - 1);
        if (error || !data || data.length === 0) break;
        out.push(...(data as T[]));
        if (data.length < pageSize) break;
      }
      return out;
    };

    (async () => {
      const [clicks, pvs] = await Promise.all([
        fetchAll<Row>("analytics_clicks", "path, session_id, user_id, created_at, element_tag, element_text"),
        fetchAll<Row>("analytics_pageviews", "path, session_id, user_id, created_at"),
      ]);
      if (cancelled) return;

      // Determine full history window in days for the sparkline
      const all = [...clicks, ...pvs];
      const firstTs = all.reduce((min, r) => Math.min(min, new Date(r.created_at).getTime()), Date.now());
      const days = Math.max(14, Math.min(180, Math.ceil((Date.now() - firstTs) / 86_400_000) + 1));
      const clickSpark = dayBuckets(clicks, days);
      const pvSpark = dayBuckets(pvs, days);
      const sessionSpark = uniqueDayBuckets(all, days);

      // Week-over-week delta (last 7d vs previous 7d)
      const w = 7 * 86_400_000;
      const now = Date.now();
      const inRange = (r: Row, a: number, b: number) => {
        const t = new Date(r.created_at).getTime();
        return t >= a && t < b;
      };
      const cLast = clicks.filter((r) => inRange(r, now - w, now)).length;
      const cPrevCount = clicks.filter((r) => inRange(r, now - 2 * w, now - w)).length;
      const pLast = pvs.filter((r) => inRange(r, now - w, now)).length;
      const pPrevCount = pvs.filter((r) => inRange(r, now - 2 * w, now - w)).length;
      const sLast = new Set(all.filter((r) => inRange(r, now - w, now)).map((r) => r.session_id).filter(Boolean)).size;
      const sPrev = new Set(all.filter((r) => inRange(r, now - 2 * w, now - w)).map((r) => r.session_id).filter(Boolean)).size;
      const uLast = new Set(all.filter((r) => inRange(r, now - w, now)).map((r) => r.user_id).filter(Boolean)).size;
      const uPrev = new Set(all.filter((r) => inRange(r, now - 2 * w, now - w)).map((r) => r.user_id).filter(Boolean)).size;

      const sessions = new Set(all.map((r) => r.session_id).filter(Boolean)).size;
      const users = new Set(all.map((r) => r.user_id).filter(Boolean)).size;

      // Top pages (by views), enriched with click counts
      const pvByPath = new Map<string, number>();
      pvs.forEach((r) => { const p = r.path || "/"; pvByPath.set(p, (pvByPath.get(p) ?? 0) + 1); });
      const clicksByPath = new Map<string, number>();
      clicks.forEach((r) => { const p = r.path || "/"; clicksByPath.set(p, (clicksByPath.get(p) ?? 0) + 1); });

      const topPages = [...pvByPath.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([path, views]) => ({ path, views, clicks: clicksByPath.get(path) ?? 0 }));

      // Top click targets by element_text
      const byText = new Map<string, number>();
      clicks.forEach((r) => {
        const t = (r.element_text || "").trim();
        if (!t) return;
        byText.set(t, (byText.get(t) ?? 0) + 1);
      });
      const topClickTargets = [...byText.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([text, count]) => ({ text, count }));

      // Tag breakdown
      const byTag = new Map<string, number>();
      clicks.forEach((r) => { const t = r.element_tag || "other"; byTag.set(t, (byTag.get(t) ?? 0) + 1); });
      const tagBreakdown = [...byTag.entries()].sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));

      // Heatmap — top 36 paths by clicks, mapped left→right, top→bottom
      const sortedClicks = [...clicksByPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 36);
      const maxCount = sortedClicks[0]?.[1] ?? 1;
      const heatmap = new Array(36).fill(0);
      const heatmapLabels = new Array(36).fill("");
      sortedClicks.forEach(([path, count], i) => {
        heatmap[i] = Math.max(0, Math.min(1, count / maxCount));
        heatmapLabels[i] = `${path} — ${count} clicks`;
      });

      setData({
        clicks: clicks.length,
        pageviews: pvs.length,
        sessions,
        users,
        clickSpark, pvSpark, sessionSpark,
        clickDelta: pct(cLast, cPrevCount),
        pvDelta: pct(pLast, pPrevCount),
        sessionDelta: pct(sLast, sPrev),
        userDelta: pct(uLast, uPrev),
        topPages, topClickTargets, tagBreakdown,
        heatmap, heatmapLabels,
        firstSeen: all.length ? new Date(firstTs).toISOString() : null,
      });
    })();

    return () => { cancelled = true; };
  }, [allowed]);

  const maxTopPageViews = useMemo(() => Math.max(1, ...(data?.topPages.map((p) => p.views) ?? [1])), [data]);
  const maxTopClick = useMemo(() => Math.max(1, ...(data?.topClickTargets.map((t) => t.count) ?? [1])), [data]);
  const totalTagged = useMemo(() => (data?.tagBreakdown ?? []).reduce((a, b) => a + b.count, 0), [data]);

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;

  if (!allowed) {
    return (
      <div className="p-8 max-w-xl">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Administrators only</AlertTitle>
          <AlertDescription>The Social Force Field is restricted to consortium administrators. Redirecting…</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl">
      <PageMeta
        title="Social Force Field — BBQS"
        description="Admin view: the base interactional layer — real website analytics from the consortium platform."
      />

      <header className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4" />
          <span>Engineering · Admin</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Social Force Field</h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          The base social layer — <span className="font-medium text-foreground">Interactional</span>.
          This is where people first meet the platform: which pages they load, what they click,
          and how often they come back. Cognitive and Relational layers will land as the pipelines
          mature.
        </p>
        {data?.firstSeen && (
          <p className="text-xs text-muted-foreground">
            All-time analytics since {new Date(data.firstSeen).toLocaleDateString()} · week-over-week deltas
          </p>
        )}
        </div>

        <BaseLayerDiagram
          heatmap={data?.heatmap ?? new Array(36).fill(0)}
          labels={data?.heatmapLabels ?? new Array(36).fill("")}
        />
      </header>

      {/* Layer header */}
      <section className="space-y-4">
        <div className="rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-transparent p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border bg-background/60 p-2">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Interactional</h2>
                  <Badge variant="outline">Micro layer</Badge>
                </div>
                <p className="text-sm text-muted-foreground">System interactions · clicks · navigation · attention</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
            Live analytics from <code className="text-xs">analytics_pageviews</code> and{" "}
            <code className="text-xs">analytics_clicks</code>. Everything on this page reflects
            actual visitor behavior over the last 14 days.
          </p>
        </div>

        {/* Top-line stats */}
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard
            icon={Eye} label="Page views (14d)"
            value={(data?.pageviews ?? 0).toLocaleString()}
            delta={data?.pvDelta ?? 0}
            spark={data?.pvSpark ?? new Array(14).fill(0)}
            hint="Route loads captured by useAnalytics."
          />
          <StatCard
            icon={MousePointerClick} label="Clicks (14d)"
            value={(data?.clicks ?? 0).toLocaleString()}
            delta={data?.clickDelta ?? 0}
            spark={data?.clickSpark ?? new Array(14).fill(0)}
            hint="Links, buttons, and tracked elements."
          />
          <StatCard
            icon={UsersIcon} label="Sessions (14d)"
            value={(data?.sessions ?? 0).toLocaleString()}
            delta={data?.sessionDelta ?? 0}
            spark={data?.sessionSpark ?? new Array(14).fill(0)}
            hint="Distinct browser sessions."
          />
          <StatCard
            icon={UsersIcon} label="Signed-in users (14d)"
            value={(data?.users ?? 0).toLocaleString()}
            delta={data?.userDelta ?? 0}
            spark={data?.sessionSpark ?? new Array(14).fill(0)}
            hint="Unique user_id values on captured events."
          />
        </div>

        {/* Top pages + top click targets */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top pages by views</CardTitle>
              <CardDescription>Last 14 days · from analytics_pageviews</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data?.topPages ?? []).map((p) => (
                <div key={p.path} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-mono text-xs">{p.path}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {p.views.toLocaleString()} views · {p.clicks.toLocaleString()} clicks
                    </span>
                  </div>
                  <Progress value={(p.views / maxTopPageViews) * 100} className="h-1.5" />
                </div>
              ))}
              {!data && <div className="text-sm text-muted-foreground">Loading…</div>}
              {data && data.topPages.length === 0 && (
                <div className="text-sm text-muted-foreground">No page views yet.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Most-clicked things</CardTitle>
              <CardDescription>Last 14 days · by element text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data?.topClickTargets ?? []).map((t) => (
                <div key={t.text} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{t.text}</span>
                    <span className="text-muted-foreground tabular-nums">{t.count.toLocaleString()}</span>
                  </div>
                  <Progress value={(t.count / maxTopClick) * 100} className="h-1.5" />
                </div>
              ))}
              {!data && <div className="text-sm text-muted-foreground">Loading…</div>}
              {data && data.topClickTargets.length === 0 && (
                <div className="text-sm text-muted-foreground">No click labels captured.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interaction shape */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Interaction shape</CardTitle>
            <CardDescription>Where the clicks go — link vs. button vs. other</CardDescription>
          </CardHeader>
          <CardContent>
            {data && totalTagged > 0 ? (
              <div className="space-y-3">
                <div className="flex h-3 w-full overflow-hidden rounded-full border">
                  {data.tagBreakdown.map((t, i) => {
                    const w = (t.count / totalTagged) * 100;
                    const colors = ["bg-violet-500", "bg-sky-500", "bg-amber-500", "bg-emerald-500"];
                    return <div key={t.tag} className={colors[i % colors.length]} style={{ width: `${w}%` }} title={`${t.tag}: ${t.count}`} />;
                  })}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {data.tagBreakdown.map((t, i) => {
                    const colors = ["bg-violet-500", "bg-sky-500", "bg-amber-500", "bg-emerald-500"];
                    const pctVal = Math.round((t.count / totalTagged) * 100);
                    return (
                      <div key={t.tag} className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-sm ${colors[i % colors.length]}`} />
                        <span className="font-mono">&lt;{t.tag}&gt;</span>
                        <span className="tabular-nums">{t.count.toLocaleString()} · {pctVal}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Loading…</div>
            )}
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Base layer only</AlertTitle>
          <AlertDescription>
            Cognitive (meso) and Relational (macro) layers are temporarily hidden. They'll return
            once their upstream pipelines — shared attention, working-group topic overlap,
            cohesion markers — are wired in.
          </AlertDescription>
        </Alert>
      </section>
    </div>
  );
}
