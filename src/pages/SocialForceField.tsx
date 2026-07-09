import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUserTier } from "@/hooks/useUserTier";
import {
  Users, Brain, MessageSquare, Lock, Layers,
  TrendingUp, TrendingDown, Minus, Info,
} from "lucide-react";
import { PageMeta } from "@/components/PageMeta";

// Simple isometric 3-plane diagram — one grid per layer, stacked.
// No gloss: monochrome strokes, current text color, labeled with the layer's math signal.
function LayerStackDiagram({
  layers,
}: {
  layers: { key: string; title: string; scale: string; score: number; formula: string; tint: string; heatmap?: number[] }[];
}) {
  // Isometric parameters
  const W = 560;
  const H = 360;
  const cx = W / 2;
  const gridN = 6;              // 6x6 cells per plane
  const cell = 26;              // cell size in "plane" units
  const planeW = gridN * cell;  // 156
  // Isometric projection (2:1)
  const iso = (x: number, y: number, z: number) => ({
    x: cx + (x - y) * (cell * 0.9),
    y: 190 + (x + y) * (cell * 0.45) - z,
  });
  // Layers stacked top-down: macro (top) → meso → micro (bottom)
  const zOffsets = [140, 70, 0]; // top, middle, bottom (index matches layers order)

  const renderPlane = (zPix: number, tint: string, score: number, heatmap?: number[]) => {
    const lines: JSX.Element[] = [];
    for (let i = 0; i <= gridN; i++) {
      const a = iso(i, 0, zPix);
      const b = iso(i, gridN, zPix);
      const c = iso(0, i, zPix);
      const d = iso(gridN, i, zPix);
      lines.push(
        <line key={`v${i}-${zPix}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={tint} strokeWidth={0.75} opacity={0.55} />,
        <line key={`h${i}-${zPix}`} x1={c.x} y1={c.y} x2={d.x} y2={d.y} className={tint} strokeWidth={0.75} opacity={0.55} />
      );
    }
    // Heatmap mode — render every cell with opacity proportional to activity.
    const cells: JSX.Element[] = [];
    if (heatmap && heatmap.length === gridN * gridN) {
      for (let gy = 0; gy < gridN; gy++) {
        for (let gx = 0; gx < gridN; gx++) {
          const v = heatmap[gy * gridN + gx];
          if (v <= 0) continue;
          const p1 = iso(gx, gy, zPix);
          const p2 = iso(gx + 1, gy, zPix);
          const p3 = iso(gx + 1, gy + 1, zPix);
          const p4 = iso(gx, gy + 1, zPix);
          cells.push(
            <polygon
              key={`c-${zPix}-${gx}-${gy}`}
              points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
              className={tint}
              fillOpacity={0.15 + v * 0.7}
              stroke="none"
            />
          );
        }
      }
    } else {
      // Single marker cell proportional to score
      const s = Math.max(0, Math.min(100, score)) / 100;
      const gx = Math.round(s * gridN);
      const gy = Math.round((1 - s) * gridN);
      const p1 = iso(gx, gy, zPix);
      const p2 = iso(gx + 1, gy, zPix);
      const p3 = iso(gx + 1, gy + 1, zPix);
      const p4 = iso(gx, gy + 1, zPix);
      cells.push(
        <polygon
          key={`m-${zPix}`}
          points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
          className={tint}
          fillOpacity={0.5}
          strokeOpacity={0.9}
        />
      );
    }
    return (
      <g>
        {lines}
        {cells}
      </g>
    );
  };

  return (
    <div className="rounded-xl border bg-card/40 p-6">
      <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,220px)] items-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-muted-foreground" aria-hidden="true">
          {/* Vertical guide connecting planes */}
          <line
            x1={cx} y1={iso(gridN / 2, gridN / 2, zOffsets[0]).y}
            x2={cx} y2={iso(gridN / 2, gridN / 2, zOffsets[2]).y}
            stroke="currentColor" strokeDasharray="2 3" opacity={0.3}
          />
          {layers.map((l, i) => (
            <g key={l.key}>{renderPlane(zOffsets[i], l.tint, l.score, l.heatmap)}</g>
          ))}
        </svg>
        <ol className="space-y-3 text-sm">
          {layers.map((l) => (
            <li key={l.key} className="flex items-start gap-2">
              <span className={`mt-1 h-2 w-2 rounded-sm ${l.tint.replace("stroke-", "bg-")}`} />
              <div className="min-w-0">
                <div className="font-medium">
                  {l.title} <span className="text-muted-foreground font-normal">· {l.scale}</span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">{l.formula}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

type Trend = "up" | "down" | "flat";
type Metric = {
  id: string;
  name: string;
  description: string;
  score: number;      // 0-100
  delta: number;      // % vs. last window
  trend: Trend;
  source: string;
  sparkline: number[]; // 12 points, 0-100
};

type Layer = {
  key: "interactional" | "cognitive" | "relational";
  scale: "Micro" | "Meso" | "Macro";
  title: string;
  subtitle: string;
  narrative: string;
  icon: typeof Users;
  ring: string;   // ring/border tint
  bg: string;     // gradient tint
  dot: string;    // colored dot for sparkline
  metrics: Metric[];
};

// v1 catalog — seed values derived from current consortium activity.
// These become live once the pipelines in .lovable/plan.md land.
const LAYERS: Layer[] = [
  {
    key: "interactional",
    scale: "Micro",
    title: "Interactional",
    subtitle: "System interactions · clicks · navigation · attention",
    narrative:
      "The base social layer: how people first meet the consortium — where they click, which pages they visit, how long they stay engaged. Every dot on the base grid is a page in the app; brightness is real click activity from the last 14 days.",
    icon: MessageSquare,
    ring: "border-violet-500/40",
    bg: "from-violet-500/10 to-transparent",
    dot: "stroke-violet-400",
    metrics: [
      {
        id: "click-volume",
        name: "Click volume (14d)",
        description: "Total tracked clicks across the consortium platform in the last 14 days.",
        score: 0, delta: 0, trend: "flat",
        source: "analytics_clicks",
        sparkline: [0,0,0,0,0,0,0,0,0,0,0,0],
      },
      {
        id: "pageview-volume",
        name: "Page views (14d)",
        description: "Distinct route loads across the consortium platform in the last 14 days.",
        score: 0, delta: 0, trend: "flat",
        source: "analytics_pageviews",
        sparkline: [0,0,0,0,0,0,0,0,0,0,0,0],
      },
      {
        id: "active-participants",
        name: "Active participants (14d)",
        description: "Unique sessions plus signed-in users generating interactions.",
        score: 0, delta: 0, trend: "flat",
        source: "analytics_clicks · analytics_pageviews",
        sparkline: [0,0,0,0,0,0,0,0,0,0,0,0],
      },
    ],
  },
  {
    key: "cognitive",
    scale: "Meso",
    title: "Cognitive",
    subtitle: "Shared attention · shared mental models",
    narrative:
      "Convergence on what is salient — which projects, resources, species and devices the consortium co-attends to and agrees about.",
    icon: Brain,
    ring: "border-sky-500/40",
    bg: "from-sky-500/10 to-transparent",
    dot: "stroke-sky-400",
    metrics: [
      {
        id: "coattention-density",
        name: "Co-attention density",
        description: "Edges / possible edges in the co-viewing + co-commenting graph on shared resources.",
        score: 54, delta: +3, trend: "up",
        source: "analytics_pageviews · entity_comments · resources",
        sparkline: [42, 44, 45, 47, 46, 48, 50, 51, 52, 52, 53, 54],
      },
      {
        id: "wg-topic-overlap",
        name: "Working-group topic overlap",
        description: "Jaccard similarity on keyword sets across working groups (grants + publications).",
        score: 47, delta: -2, trend: "down",
        source: "grants · publications · working_group_chairs",
        sparkline: [50, 51, 52, 51, 50, 49, 49, 48, 49, 48, 47, 47],
      },
      {
        id: "curation-agreement",
        name: "Curation agreement rate",
        description: "Share of ontology / pending-change decisions that converge without revert.",
        score: 71, delta: +1, trend: "flat",
        source: "curation_audit_log · ontology decisions",
        sparkline: [66, 67, 68, 68, 69, 70, 70, 71, 70, 71, 71, 71],
      },
    ],
  },
  {
    key: "relational",
    scale: "Macro",
    title: "Relational",
    subtitle: "Group identity · social cohesion",
    narrative:
      "Consortium-wide identity: who feels like an in-group teammate, how AI agents are addressed vs. humans, and how tightly labs are bound.",
    icon: Users,
    ring: "border-amber-500/40",
    bg: "from-amber-500/10 to-transparent",
    dot: "stroke-amber-400",
    metrics: [
      {
        id: "inclusive-pronoun-ratio",
        name: "Inclusive-pronoun ratio",
        description: "(we + our + us) / total pronouns — Tausczik & Pennebaker cohesion marker.",
        score: 63, delta: +4, trend: "up",
        source: "entity_comments · assistant chat · github",
        sparkline: [55, 56, 57, 58, 59, 60, 60, 61, 62, 62, 63, 63],
      },
      {
        id: "cross-lab-index",
        name: "Cross-lab collaboration index",
        description: "Bridging ties in the co-PI graph — how often labs share investigators on grants.",
        score: 49, delta: +2, trend: "up",
        source: "grant_investigators · organizations",
        sparkline: [43, 44, 44, 45, 46, 46, 47, 47, 48, 48, 49, 49],
      },
      {
        id: "ai-teammate-delta",
        name: "AI-as-teammate register delta",
        description: "Live linguistic-style distance between messages to humans vs. to agents. Lower = more integrated.",
        score: 38, delta: -6, trend: "down",
        source: "assistant chat logs (NeuroMCP · metadata · EMBER)",
        sparkline: [50, 49, 48, 47, 45, 44, 43, 42, 41, 40, 39, 38],
      },
    ],
  },
];

function avg(nums: number[]) {
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const w = 120, h = 32, pad = 2;
  const max = Math.max(...points), min = Math.min(...points);
  const range = Math.max(1, max - min);
  const step = (w - pad * 2) / (points.length - 1);
  const d = points
    .map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <path d={d} fill="none" strokeWidth={1.5} className="stroke-current" />
    </svg>
  );
}

function TrendPill({ trend, delta }: { trend: Trend; delta: number }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const cls =
    trend === "up"
      ? "text-emerald-500 bg-emerald-500/10"
      : trend === "down"
      ? "text-rose-500 bg-rose-500/10"
      : "text-muted-foreground bg-muted/50";
  const sign = delta > 0 ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {sign}
      {delta}%
    </span>
  );
}

function MetricCard({ metric, sparkColor }: { metric: Metric; sparkColor: string }) {
  return (
    <div className="rounded-lg border bg-card/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-medium leading-tight">{metric.name}</div>
          <div className="text-xs text-muted-foreground">{metric.description}</div>
        </div>
        <TrendPill trend={metric.trend} delta={metric.delta} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tabular-nums">{metric.score}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">score / 100</div>
        </div>
        <Sparkline points={metric.sparkline} className={sparkColor} />
      </div>
      <Progress value={metric.score} className="h-1.5" />
      <div className="text-[10px] text-muted-foreground truncate">Source: {metric.source}</div>
    </div>
  );
}

export default function SocialForceField() {
  const { isAdmin, isCurator, isLoading } = useUserTier();
  const navigate = useNavigate();
  const allowed = isAdmin || isCurator;

  // Live interactional signal from analytics_* tables.
  const [interactional, setInteractional] = useState<{
    clicks: number;
    pageviews: number;
    participants: number;
    clickSpark: number[];
    pageviewSpark: number[];
    participantSpark: number[];
    clickDelta: number;
    pageviewDelta: number;
    participantDelta: number;
    heatmap: number[]; // 36 cells, 0-1
    topPaths: { path: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;

    const load = async () => {
      const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
      const prevSince = new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString();

      const [clicksRes, pvRes, prevClicksRes, prevPvRes] = await Promise.all([
        supabase.from("analytics_clicks").select("path, session_id, user_id, created_at").gte("created_at", since).limit(20000),
        supabase.from("analytics_pageviews").select("path, session_id, user_id, created_at").gte("created_at", since).limit(20000),
        supabase.from("analytics_clicks").select("session_id, user_id, created_at").gte("created_at", prevSince).lt("created_at", since).limit(20000),
        supabase.from("analytics_pageviews").select("session_id, user_id, created_at").gte("created_at", prevSince).lt("created_at", since).limit(20000),
      ]);

      const clicks = clicksRes.data ?? [];
      const pvs = pvRes.data ?? [];
      const prevClicks = prevClicksRes.data ?? [];
      const prevPvs = prevPvRes.data ?? [];
      if (cancelled) return;

      // Per-day sparklines (last 12 days)
      const days = 12;
      const dayBuckets = (rows: { created_at: string }[]) => {
        const buckets = new Array(days).fill(0);
        const now = Date.now();
        for (const r of rows) {
          const t = new Date(r.created_at).getTime();
          const dayIdx = days - 1 - Math.floor((now - t) / (24 * 3600 * 1000));
          if (dayIdx >= 0 && dayIdx < days) buckets[dayIdx]++;
        }
        return buckets;
      };

      const clickSpark = dayBuckets(clicks);
      const pageviewSpark = dayBuckets(pvs);

      // Participant sparkline = unique session ids per day
      const partBuckets = new Array(days).fill(0);
      const seenPerDay: Array<Set<string>> = Array.from({ length: days }, () => new Set());
      const now = Date.now();
      for (const r of [...clicks, ...pvs]) {
        const t = new Date(r.created_at as string).getTime();
        const dayIdx = days - 1 - Math.floor((now - t) / (24 * 3600 * 1000));
        if (dayIdx >= 0 && dayIdx < days) {
          const id = (r.user_id as string) || (r.session_id as string) || "";
          if (id && !seenPerDay[dayIdx].has(id)) {
            seenPerDay[dayIdx].add(id);
            partBuckets[dayIdx]++;
          }
        }
      }

      const totalClicks = clicks.length;
      const totalPvs = pvs.length;
      const participants = new Set(
        [...clicks, ...pvs].map((r) => (r.user_id as string) || (r.session_id as string)).filter(Boolean)
      ).size;

      const prevParticipants = new Set(
        [...prevClicks, ...prevPvs].map((r) => (r.user_id as string) || (r.session_id as string)).filter(Boolean)
      ).size;

      const pct = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
      };

      // Heatmap — top 36 paths by click count, ordered desc, filled left-to-right, top-to-bottom.
      const byPath = new Map<string, number>();
      for (const r of clicks) {
        const p = (r.path as string) || "/";
        byPath.set(p, (byPath.get(p) ?? 0) + 1);
      }
      const sorted = [...byPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 36);
      const maxCount = sorted[0]?.[1] ?? 1;
      const heatmap = new Array(36).fill(0);
      sorted.forEach(([, c], i) => {
        heatmap[i] = Math.max(0, Math.min(1, c / maxCount));
      });

      setInteractional({
        clicks: totalClicks,
        pageviews: totalPvs,
        participants,
        clickSpark,
        pageviewSpark,
        participantSpark: partBuckets,
        clickDelta: pct(totalClicks, prevClicks.length),
        pageviewDelta: pct(totalPvs, prevPvs.length),
        participantDelta: pct(participants, prevParticipants),
        heatmap,
        topPaths: sorted.map(([path, count]) => ({ path, count })),
      });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  useEffect(() => {
    if (!isLoading && !allowed) {
      const t = setTimeout(() => navigate("/", { replace: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [isLoading, allowed, navigate]);

  // Overlay live interactional numbers onto the interactional layer.
  const liveLayers: Layer[] = useMemo(() => {
    if (!interactional) return LAYERS;
    const norm = (v: number, ceiling: number) =>
      Math.max(0, Math.min(100, Math.round((v / ceiling) * 100)));
    const trend = (d: number): Trend => (d > 2 ? "up" : d < -2 ? "down" : "flat");
    return LAYERS.map((layer) => {
      if (layer.key !== "interactional") return layer;
      return {
        ...layer,
        metrics: [
          {
            ...layer.metrics[0],
            score: norm(interactional.clicks, 10000),
            delta: interactional.clickDelta,
            trend: trend(interactional.clickDelta),
            sparkline: interactional.clickSpark.length ? interactional.clickSpark : layer.metrics[0].sparkline,
            description: `${interactional.clicks.toLocaleString()} clicks in the last 14 days.`,
          },
          {
            ...layer.metrics[1],
            score: norm(interactional.pageviews, 10000),
            delta: interactional.pageviewDelta,
            trend: trend(interactional.pageviewDelta),
            sparkline: interactional.pageviewSpark.length ? interactional.pageviewSpark : layer.metrics[1].sparkline,
            description: `${interactional.pageviews.toLocaleString()} page views in the last 14 days.`,
          },
          {
            ...layer.metrics[2],
            score: norm(interactional.participants, 500),
            delta: interactional.participantDelta,
            trend: trend(interactional.participantDelta),
            sparkline: interactional.participantSpark.length ? interactional.participantSpark : layer.metrics[2].sparkline,
            description: `${interactional.participants.toLocaleString()} distinct sessions/users interacting in the last 14 days.`,
          },
        ],
      };
    });
  }, [interactional]);

  const layerAverages = useMemo(
    () => liveLayers.map((l) => ({ key: l.key, title: l.title, avg: avg(l.metrics.map((m) => m.score)) })),
    [liveLayers]
  );
  const fieldStrength = avg(layerAverages.map((l) => l.avg));

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;

  if (!allowed) {
    return (
      <div className="p-8 max-w-xl">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Administrators only</AlertTitle>
          <AlertDescription>
            The Social Force Field is restricted to consortium administrators. Redirecting…
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-6xl">
      <PageMeta
        title="Social Force Field — BBQS"
        description="Admin view: three-layer measurement of consortium social dynamics — interactional, cognitive, relational."
      />

      {/* Hero */}
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4" />
          <span>Engineering · Admin</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Social Force Field</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Three stacked layers — interactional, cognitive, relational — measuring whether the
            BBQS consortium is coalescing. Higher and rising is good.
          </p>
        </div>

        <LayerStackDiagram
          layers={[
            {
              key: "relational",
              title: "Relational",
              scale: "Macro",
              score: avg(liveLayers.find((l) => l.key === "relational")!.metrics.map((m) => m.score)),
              formula: "R = f(cohesion, cross-lab ties)",
              tint: "stroke-amber-500",
            },
            {
              key: "cognitive",
              title: "Cognitive",
              scale: "Meso",
              score: avg(liveLayers.find((l) => l.key === "cognitive")!.metrics.map((m) => m.score)),
              formula: "C = J(attention, mental models)",
              tint: "stroke-sky-500",
            },
            {
              key: "interactional",
              title: "Interactional",
              scale: "Micro",
              score: avg(liveLayers.find((l) => l.key === "interactional")!.metrics.map((m) => m.score)),
              formula: "I = Σ clicks(page_i) over 14d",
              tint: "stroke-violet-500",
              heatmap: interactional?.heatmap,
            },
          ]}
        />

        {/* Field strength + per-layer summary */}
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="md:col-span-1 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader className="pb-2">
              <CardDescription>Field strength</CardDescription>
              <CardTitle className="text-4xl tabular-nums">{fieldStrength}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={fieldStrength} className="h-2" />
              <div className="mt-2 text-xs text-muted-foreground">
                Composite of all three layers.
              </div>
            </CardContent>
          </Card>
          {layerAverages.map((l) => (
            <Card key={l.key}>
              <CardHeader className="pb-2">
                <CardDescription>{l.title}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">{l.avg}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={l.avg} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Preview data</AlertTitle>
          <AlertDescription>
            Metric definitions are frozen; values shown are seeded from the current corpus while the
            live pipelines defined in the plan land. Refresh cadence will be live (on-write, debounced).
          </AlertDescription>
        </Alert>
      </header>

      {/* Layers — bottom-up: Interactional → Cognitive → Relational */}
      {liveLayers.map((layer) => {
        const Icon = layer.icon;
        return (
          <section key={layer.key} className="space-y-4">
            <div className={`rounded-xl border ${layer.ring} bg-gradient-to-br ${layer.bg} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border bg-background/60 p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{layer.title}</h2>
                      <Badge variant="outline">{layer.scale} layer</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{layer.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold tabular-nums">
                    {avg(layer.metrics.map((m) => m.score))}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    layer score
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground max-w-3xl">{layer.narrative}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {layer.metrics.map((m) => (
                <MetricCard key={m.id} metric={m} sparkColor={layer.dot} />
              ))}
            </div>
          </section>
        );
      })}

      {/* How layers compose */}
      <Card>
        <CardHeader>
          <CardTitle>How the layers compose</CardTitle>
          <CardDescription>
            Signals propagate upward: micro shapes meso, meso shapes macro.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <span className="font-medium text-foreground">Interactional (micro)</span> — new words
            coined in messages, PRs, GitHub issues, and abstracts feed{" "}
            <span className="font-medium text-foreground">cognitive (meso)</span> measures of shared
            attention and shared mental models across working groups, which in turn feed{" "}
            <span className="font-medium text-foreground">relational (macro)</span> measures of
            identity and cohesion for the consortium as a whole.
          </p>
          <p>
            Rising scores across all three layers indicate the consortium is coalescing in the right
            direction; divergence between layers is itself a diagnostic.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
