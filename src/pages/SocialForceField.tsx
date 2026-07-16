import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUserTier } from "@/hooks/useUserTier";
import { Lock, Layers, Info, Radio } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { LayerTabs } from "@/components/social-force-field/LayerTabs";


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
  const [lastPulse, setLastPulse] = useState<Date | null>(null);
  const [pulsing, setPulsing] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoading && !allowed) {
      const t = setTimeout(() => navigate("/", { replace: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [isLoading, allowed, navigate]);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        setPulsing(true);
        const { data: resp, error } = await supabase.functions.invoke("analytics-summary", { body: {} });
        if (cancelled) return;
        if (error) throw error;
        if (resp?.error) throw new Error(resp.error);
        setData(resp as Data);
        setLastPulse(new Date());
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Analytics data could not be loaded.";
        setLoadError(message);
      } finally {
        if (!cancelled) setTimeout(() => setPulsing(false), 700);
      }
    };
    fetchOnce();
    pollRef.current = window.setInterval(fetchOnce, 30_000);
    return () => {
      cancelled = true;
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [allowed]);

  const maxTopPageViews = useMemo(() => Math.max(1, ...(data?.topPages.map((p) => p.views) ?? [1])), [data]);
  const maxTopClick = useMemo(() => Math.max(1, ...(data?.topClickTargets.map((t) => t.count) ?? [1])), [data]);

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
        description="Admin view: three-layer social force field — interactional, cognitive, relational."
      />

      <header className="space-y-4">
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Engineering · Admin</span>
          </div>
          <LivePulse pulsing={pulsing} lastPulse={lastPulse} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Social Force Field</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Three layers of the consortium's identity — from words we reuse (micro) to mental
            models we share (meso) to group cohesion around cross-species synchronization (macro).
          </p>
        {data?.firstSeen && (
          <p className="text-xs text-muted-foreground">
            All-time analytics since {new Date(data.firstSeen).toLocaleDateString()}
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
      </header>

      <LayerTabs />

      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
          Raw signal · platform pulse
        </summary>
        <section className="grid gap-4 md:grid-cols-2 p-4">
          <MetricsTable
            title="Platform pulse"
            description="Live counts across all-time — updates every 30s"
            rows={[
              { label: "Page views", value: data?.pageviews ?? 0, delta: data?.pvDelta ?? 0 },
              { label: "Clicks", value: data?.clicks ?? 0, delta: data?.clickDelta ?? 0 },
              { label: "Sessions", value: data?.sessions ?? 0, delta: data?.sessionDelta ?? 0 },
              { label: "Signed-in users", value: data?.users ?? 0, delta: data?.userDelta ?? 0 },
            ]}
          />
          <MetricsTable
            title="Most-clicked things"
            description="Top interactive elements by count"
            rows={(data?.topClickTargets ?? []).slice(0, 8).map((t) => ({
              label: t.text, value: t.count, bar: t.count / maxTopClick,
            }))}
            emptyLabel="No click labels captured yet."
            loading={!data}
          />
          <div className="md:col-span-2">
            <MetricsTable
              title="Top pages by views"
              description="Every route people have visited — attention over time"
              rows={(data?.topPages ?? []).slice(0, 12).map((p) => ({
                label: p.path, value: p.views, sub: `${p.clicks.toLocaleString()} clicks`, bar: p.views / maxTopPageViews, mono: true,
              }))}
              emptyLabel="No page views yet."
              loading={!data}
            />
          </div>
        </section>
      </details>
    </div>
  );
}

// ── Live pulse indicator ─────────────────────────────────────────────
function LivePulse({ pulsing, lastPulse }: { pulsing: boolean; lastPulse: Date | null }) {
  const [ago, setAgo] = useState("just now");
  useEffect(() => {
    if (!lastPulse) return;
    const tick = () => {
      const s = Math.max(0, Math.round((Date.now() - lastPulse.getTime()) / 1000));
      setAgo(s < 5 ? "just now" : s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`);
    };
    tick();
    const id = window.setInterval(tick, 5_000);
    return () => window.clearInterval(id);
  }, [lastPulse]);
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-500"
      title="This page polls analytics every 30 seconds — constantly learning."
    >
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-500 ${pulsing ? "animate-ping opacity-75" : "opacity-0"}`} />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <Radio className="h-3 w-3" />
      <span className="font-medium">Live</span>
      <span className="text-emerald-500/70">· constantly learning · {lastPulse ? ago : "connecting…"}</span>
    </span>
  );
}

// ── Compact metrics table ────────────────────────────────────────────
type MetricRow = {
  label: string;
  value: number;
  delta?: number;
  sub?: string;
  bar?: number; // 0..1 optional bar
  mono?: boolean;
};
function MetricsTable({
  title, description, rows, emptyLabel, loading,
}: {
  title: string; description?: string; rows: MetricRow[];
  emptyLabel?: string; loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        {loading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && emptyLabel && (
          <div className="p-4 text-sm text-muted-foreground">{emptyLabel}</div>
        )}
        {!loading && rows.length > 0 && (
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.label}-${i}`} className="border-t first:border-t-0">
                  <td className={`px-4 py-2 truncate ${r.mono ? "font-mono text-xs" : ""}`}>
                    {r.label}
                  </td>
                  <td className="px-4 py-2 w-1/2">
                    {r.bar != null ? (
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-violet-500" style={{ width: `${Math.round(r.bar * 100)}%` }} />
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap">
                    {r.value.toLocaleString()}
                    {r.sub && <span className="ml-2 text-xs text-muted-foreground">{r.sub}</span>}
                    {r.delta != null && (
                      <span className={`ml-2 text-xs ${r.delta > 2 ? "text-emerald-500" : r.delta < -2 ? "text-rose-500" : "text-muted-foreground"}`}>
                        {r.delta > 0 ? "+" : ""}{r.delta}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
