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
import { CoordinationInstrumentation } from "@/components/social-force-field/CoordinationInstrumentation";
import { isPreviewMode } from "@/lib/preview-mode";

// 3D-looking isometric plane — the "base social layer".
// Each cell = one page in the app; brightness/height = total click activity.
function BaseLayerDiagram({ heatmap, labels }: { heatmap: number[]; labels: string[] }) {
  const W = 620;
  const H = 360;
  const cx = W / 2;
  const gridN = 6;
  const cell = 30;
  const maxLift = 60; // pixel height a fully-hot cell rises
  const iso = (x: number, y: number, z = 0) => ({
    x: cx + (x - y) * (cell * 0.9),
    y: 170 + (x + y) * (cell * 0.45) - z,
  });

  // ground grid
  const grid: JSX.Element[] = [];
  for (let i = 0; i <= gridN; i++) {
    const a = iso(i, 0), b = iso(i, gridN), c = iso(0, i), d = iso(gridN, i);
    grid.push(
      <line key={`gv${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-violet-500/40" strokeWidth={0.75} />,
      <line key={`gh${i}`} x1={c.x} y1={c.y} x2={d.x} y2={d.y} className="stroke-violet-500/40" strokeWidth={0.75} />,
    );
  }

  // sort back-to-front so nearer bars overpaint farther ones
  const order: { gx: number; gy: number; v: number }[] = [];
  for (let gy = 0; gy < gridN; gy++) {
    for (let gx = 0; gx < gridN; gx++) {
      order.push({ gx, gy, v: heatmap[gy * gridN + gx] ?? 0 });
    }
  }
  order.sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));

  const bars: JSX.Element[] = order.map(({ gx, gy, v }) => {
    if (v <= 0) return <g key={`b-${gx}-${gy}`} />;
    const h = Math.max(4, v * maxLift);
    // bottom face corners
    const b1 = iso(gx, gy), b2 = iso(gx + 1, gy), b3 = iso(gx + 1, gy + 1), b4 = iso(gx, gy + 1);
    // top face corners (lifted by h)
    const t1 = iso(gx, gy, h), t2 = iso(gx + 1, gy, h), t3 = iso(gx + 1, gy + 1, h), t4 = iso(gx, gy + 1, h);
    const intensity = 0.35 + Math.min(1, v) * 0.55;
    return (
      <g key={`b-${gx}-${gy}`}>
        <title>{labels[gy * gridN + gx] ?? ""}</title>
        {/* right face (darker) */}
        <polygon points={`${b2.x},${b2.y} ${b3.x},${b3.y} ${t3.x},${t3.y} ${t2.x},${t2.y}`}
          fill="hsl(258 80% 45%)" fillOpacity={intensity * 0.6} stroke="hsl(258 90% 70%)" strokeOpacity={0.35} strokeWidth={0.5} />
        {/* left face (mid) */}
        <polygon points={`${b3.x},${b3.y} ${b4.x},${b4.y} ${t4.x},${t4.y} ${t3.x},${t3.y}`}
          fill="hsl(262 80% 55%)" fillOpacity={intensity * 0.75} stroke="hsl(258 90% 70%)" strokeOpacity={0.35} strokeWidth={0.5} />
        {/* top face (brightest) */}
        <polygon points={`${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y} ${t4.x},${t4.y}`}
          fill="hsl(268 95% 68%)" fillOpacity={0.45 + intensity * 0.5} stroke="hsl(272 95% 82%)" strokeOpacity={0.7} strokeWidth={0.75} />
      </g>
    );
  });

  return (
    <div className="rounded-xl border bg-card/40 p-6">
      <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,240px)] items-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-hidden="true">
          <defs>
            <radialGradient id="baseGlow" cx="50%" cy="55%" r="55%">
              <stop offset="0%" stopColor="hsl(268 90% 60% / 0.35)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="url(#baseGlow)" />
          {grid}
          {bars}
        </svg>
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-violet-500" />
            <span className="font-medium">Interactional · Micro</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">I = Σ clicks(page_i) all-time</p>
          <p className="text-xs text-muted-foreground">
            The base social layer. Each cell is one page in the app; bar height and brightness
            reflect total click activity since tracking began. Hover a bar to see the page.
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
  projectClicks?: { grant_number: string; title: string | null; count: number }[];
  topDestinations?: { href: string; count: number }[];
  tabClicks?: { path: string; label: string; count: number }[];
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
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !allowed) {
      const t = setTimeout(() => navigate("/", { replace: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [isLoading, allowed, navigate]);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadError(null);
        const { data: resp, error } = await supabase.functions.invoke("analytics-summary", { body: {} });
        if (cancelled) return;
        if (error) throw error;
        if (resp?.error) throw new Error(resp.error);
        setData(resp as Data);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Analytics data could not be loaded.";
        setData(null);
        setLoadError(message);
      }
    })();
    return () => { cancelled = true; };
  }, [allowed]);

  const maxTopPageViews = useMemo(() => Math.max(1, ...(data?.topPages.map((p) => p.views) ?? [1])), [data]);
  const maxTopClick = useMemo(() => Math.max(1, ...(data?.topClickTargets.map((t) => t.count) ?? [1])), [data]);
  const maxProject = useMemo(() => Math.max(1, ...((data?.projectClicks ?? []).map((p) => p.count))), [data]);
  const maxDest = useMemo(() => Math.max(1, ...((data?.topDestinations ?? []).map((d) => d.count))), [data]);
  const maxTab = useMemo(() => Math.max(1, ...((data?.tabClicks ?? []).map((t) => t.count))), [data]);
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
        {loadError && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Analytics could not be loaded</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
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
            actual visitor behavior since tracking began.
          </p>
        </div>

        {/* Top-line stats */}
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard
            icon={Eye} label="Page views (all-time)"
            value={(data?.pageviews ?? 0).toLocaleString()}
            delta={data?.pvDelta ?? 0}
            spark={data?.pvSpark ?? new Array(14).fill(0)}
            hint="Route loads · WoW delta"
          />
          <StatCard
            icon={MousePointerClick} label="Clicks (all-time)"
            value={(data?.clicks ?? 0).toLocaleString()}
            delta={data?.clickDelta ?? 0}
            spark={data?.clickSpark ?? new Array(14).fill(0)}
            hint="Links, buttons, tracked elements · WoW delta"
          />
          <StatCard
            icon={UsersIcon} label="Sessions (all-time)"
            value={(data?.sessions ?? 0).toLocaleString()}
            delta={data?.sessionDelta ?? 0}
            spark={data?.sessionSpark ?? new Array(14).fill(0)}
            hint="Distinct browser sessions · WoW delta"
          />
          <StatCard
            icon={UsersIcon} label="Signed-in users (all-time)"
            value={(data?.users ?? 0).toLocaleString()}
            delta={data?.userDelta ?? 0}
            spark={data?.sessionSpark ?? new Array(14).fill(0)}
            hint="Unique user_id values · WoW delta"
          />
        </div>

        {/* Top pages + top click targets */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top pages by views</CardTitle>
              <CardDescription>All-time · every route people have visited</CardDescription>
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
              <CardDescription>All-time · by element text</CardDescription>
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

        {/* Which projects are people opening */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Which projects are people opening?</CardTitle>
              <CardDescription>Grant profiles by clicks + landings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data?.projectClicks ?? []).map((p) => (
                <div key={p.grant_number} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">
                      <span className="font-mono text-xs text-muted-foreground mr-2">{p.grant_number}</span>
                      <span>{p.title ?? "(untitled)"}</span>
                    </span>
                    <span className="text-muted-foreground tabular-nums">{p.count.toLocaleString()}</span>
                  </div>
                  <Progress value={(p.count / maxProject) * 100} className="h-1.5" />
                </div>
              ))}
              {data && (data.projectClicks ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">No project opens yet.</div>
              )}
              {!data && <div className="text-sm text-muted-foreground">Loading…</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Where clicks send people</CardTitle>
              <CardDescription>Destination routes from side-nav & inline links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data?.topDestinations ?? []).map((d) => (
                <div key={d.href} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-mono text-xs">{d.href}</span>
                    <span className="text-muted-foreground tabular-nums">{d.count.toLocaleString()}</span>
                  </div>
                  <Progress value={(d.count / maxDest) * 100} className="h-1.5" />
                </div>
              ))}
              {data && (data.topDestinations ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">No internal destinations yet.</div>
              )}
              {!data && <div className="text-sm text-muted-foreground">Loading…</div>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tabs, filters & table headers</CardTitle>
            <CardDescription>
              Which sub-views inside a page people actually reach for — grouped by page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.tabClicks ?? []).map((t) => (
              <div key={`${t.path}::${t.label}`} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">
                    <span className="font-mono text-xs text-muted-foreground mr-2">{t.path}</span>
                    <span>{t.label}</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums">{t.count.toLocaleString()}</span>
                </div>
                <Progress value={(t.count / maxTab) * 100} className="h-1.5" />
              </div>
            ))}
            {data && (data.tabClicks ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground">No tab / header clicks captured.</div>
            )}
            {!data && <div className="text-sm text-muted-foreground">Loading…</div>}
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

      {(isAdmin || isPreviewMode()) && <CoordinationInstrumentation />}
    </div>
  );
}
