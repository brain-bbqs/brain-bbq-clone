import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserTier } from "@/hooks/useUserTier";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageMeta } from "@/components/PageMeta";
import { Lock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Zap, ExternalLink } from "lucide-react";

type Run = {
  id: string;
  seed_grant: string;
  phase: string;
  current_hop: number;
  current_target: string | null;
  pubs_found: number;
  evidence_rows: number;
  firecrawl_calls: number;
  errors: number;
  last_message: string | null;
  started_at: string;
  finished_at: string | null;
};

type Kind = "grant" | "publication" | "org" | "device";
type N2 = {
  id: string;
  kind: Kind;
  label: string;
  hop: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};
type L2 = { source: string; target: string; relation: string };
type Pulse = { from: string; to: string; id: number; t0: number };

const NODE_COLOR: Record<Kind, string> = {
  grant: "hsl(229, 50%, 32%)",
  publication: "hsl(38, 90%, 50%)",
  org: "hsl(174, 62%, 47%)",
  device: "hsl(265, 84%, 70%)",
};
const NODE_R: Record<Kind, number> = {
  grant: 9, publication: 6, org: 7, device: 6,
};

const VIEW_W = 1100;
const VIEW_H = 620;

function Bunny({ scale = 1 }: { scale?: number }) {
  // Side-view full-body bunny, drawn in SVG. Centered at (0,0).
  return (
    <g transform={`scale(${scale})`}>
      <ellipse cx="0" cy="2" rx="9" ry="6.5" fill="white" stroke="hsl(229 40% 25%)" strokeWidth="0.9" />
      <circle cx="-8" cy="1" r="2.6" fill="white" stroke="hsl(229 40% 25%)" strokeWidth="0.7" />
      <circle cx="7.5" cy="-2.5" r="5" fill="white" stroke="hsl(229 40% 25%)" strokeWidth="0.9" />
      <ellipse cx="5.8" cy="-9" rx="1.3" ry="4" fill="white" stroke="hsl(229 40% 25%)" strokeWidth="0.7" />
      <ellipse cx="9" cy="-9" rx="1.3" ry="4" fill="white" stroke="hsl(229 40% 25%)" strokeWidth="0.7" />
      <ellipse cx="5.8" cy="-9" rx="0.5" ry="2.5" fill="hsl(38 90% 60%)" />
      <ellipse cx="9" cy="-9" rx="0.5" ry="2.5" fill="hsl(38 90% 60%)" />
      <circle cx="9" cy="-2.8" r="0.65" fill="hsl(229 50% 15%)" />
      <circle cx="11" cy="-1.4" r="0.5" fill="hsl(38 90% 50%)" />
      <ellipse cx="-2.5" cy="8" rx="2.4" ry="1.4" fill="white" stroke="hsl(229 40% 25%)" strokeWidth="0.6" />
      <ellipse cx="3.5" cy="8" rx="2.4" ry="1.4" fill="white" stroke="hsl(229 40% 25%)" strokeWidth="0.6" />
    </g>
  );
}

function Graph2D({
  nodesRef, linksRef, pulsesRef,
}: {
  nodesRef: React.MutableRefObject<Map<string, N2>>;
  linksRef: React.MutableRefObject<L2[]>;
  pulsesRef: React.MutableRefObject<Pulse[]>;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const nodes = Array.from(nodesRef.current.values());
      const ns = nodes.length;
      // Repulsion
      for (let i = 0; i < ns; i++) {
        for (let j = i + 1; j < ns; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx*dx + dy*dy + 0.5;
          const f = 2400 / d2;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * f, fy = (dy / d) * f;
          a.vx += fx * dt; a.vy += fy * dt;
          b.vx -= fx * dt; b.vy -= fy * dt;
        }
      }
      // Springs
      for (const l of linksRef.current) {
        const a = nodesRef.current.get(l.source);
        const b = nodesRef.current.get(l.target);
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx*dx + dy*dy) || 0.001;
        const target = 110;
        const f = (d - target) * 1.4;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx * dt; a.vy += fy * dt;
        b.vx -= fx * dt; b.vy -= fy * dt;
      }
      // Gravity + damping + integrate
      for (const n of nodes) {
        n.vx += (VIEW_W / 2 - n.x) * 0.4 * dt;
        n.vy += (VIEW_H / 2 - n.y) * 0.4 * dt;
        n.vx *= 0.86; n.vy *= 0.86;
        n.x += n.vx; n.y += n.vy;
        // Clamp inside viewport
        n.x = Math.max(20, Math.min(VIEW_W - 20, n.x));
        n.y = Math.max(20, Math.min(VIEW_H - 20, n.y));
      }
      // Drop expired pulses
      const T = performance.now() / 1000;
      pulsesRef.current = pulsesRef.current.filter((p) => T - p.t0 < 2.0);
      force((v) => (v + 1) % 1_000_000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nodesRef, linksRef, pulsesRef]);

  const nodes = Array.from(nodesRef.current.values());
  const links = linksRef.current;
  const now = performance.now() / 1000;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", background: "hsl(220 20% 99%)" }}
    >
      <defs>
        <pattern id="kg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(220 14% 92%)" strokeWidth="1" />
        </pattern>
        <radialGradient id="kg-pulse" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(38 90% 55%)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(38 90% 55%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} fill="url(#kg-grid)" />

      {/* Links */}
      <g stroke="hsl(220 14% 75%)" strokeWidth="1">
        {links.map((l, i) => {
          const a = nodesRef.current.get(l.source);
          const b = nodesRef.current.get(l.target);
          if (!a || !b) return null;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
      </g>

      {/* Pulses traveling along edges */}
      {pulsesRef.current.map((p) => {
        const a = nodesRef.current.get(p.from);
        const b = nodesRef.current.get(p.to);
        if (!a || !b) return null;
        const DURATION = 1.6;
        const t = Math.min(1, (now - p.t0) / DURATION);
        const x = a.x + (b.x - a.x) * t;
        const HOPS = 4;
        const segT = (t * HOPS) % 1;
        const arc = Math.sin(segT * Math.PI) * 16;
        const y = a.y + (b.y - a.y) * t - arc;
        const facing = (b.x - a.x) >= 0 ? 1 : -1;
        return (
          <g key={p.id} transform={`translate(${x},${y}) scale(${facing * 1.4},1.4)`}>
            <ellipse cx="0" cy={arc / 1.4 + 9} rx={8 - arc * 0.12} ry="1.4" fill="hsl(229 30% 15%)" opacity="0.2" />
            <Bunny />
          </g>
        );
      })}

      {/* Idle parked bunny — visible even when no traversal is running */}
      {pulsesRef.current.length === 0 && nodes.length > 0 && (() => {
        const home = nodes[0];
        const bob = Math.sin(now * 2.2) * 1.5;
        return (
          <g transform={`translate(${home.x + 26},${home.y - 14 + bob}) scale(1.5,1.5)`}>
            <ellipse cx="0" cy="10" rx="9" ry="1.4" fill="hsl(229 30% 15%)" opacity="0.18" />
            <Bunny />
          </g>
        );
      })()}

      {/* Nodes */}
      {nodes.map((n) => (
        <g key={n.id} transform={`translate(${n.x},${n.y})`}>
          <circle
            r={NODE_R[n.kind]}
            fill={NODE_COLOR[n.kind]}
            stroke="white"
            strokeWidth="1.5"
          />
          <text
            x={NODE_R[n.kind] + 4}
            y={3}
            fontSize="10"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fill="hsl(229 30% 25%)"
            style={{ pointerEvents: "none" }}
          >
            {n.label.length > 32 ? n.label.slice(0, 30) + "…" : n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function AdminKgLive() {
  const { isCurator, isLoading } = useUserTier();
  const nodesRef = useRef<Map<string, N2>>(new Map());
  const linksRef = useRef<L2[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const pulseIdRef = useRef(0);
  const [version, setVersion] = useState(0);
  const [continuous, setContinuous] = useState(true);
  const [tickIntervalSec, setTickIntervalSec] = useState(25);
  const [pings, setPings] = useState<{ at: string; ok: boolean; msg: string }[]>([]);
  const [lastPingAt, setLastPingAt] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);

  const fireTick = async (source: string) => {
    return fireTickInternal(source, false);
  };
  const fireTickInternal = async (source: string, force: boolean) => {
    setPinging(true);
    const at = new Date().toLocaleTimeString();
    try {
      const { data, error } = await supabase.functions.invoke("harvester-tick", {
        body: { source, force },
      });
      const msg = error
        ? `error: ${error.message}`
        : data?.kicked
          ? `${data.forced ? "forced" : "kicked"} ${data.kicked}${data.run_id ? ` · run ${String(data.run_id).slice(0, 8)}` : ""}`
          : data?.skipped
            ? `skipped: ${data.skipped}${data.active ? ` (${data.active} active)` : ""}${data.reason ? ` — ${data.reason}` : ""}`
            : JSON.stringify(data ?? {});
      setPings((p) => [{ at, ok: !error, msg }, ...p].slice(0, 30));
    } catch (e: any) {
      setPings((p) => [{ at, ok: false, msg: `throw: ${e?.message ?? e}` }, ...p].slice(0, 30));
    } finally {
      setLastPingAt(Date.now());
      setPinging(false);
      refetchRuns();
    }
  };

  // Live evidence trace: rolling list of inserted rows with URLs
  const [trace, setTrace] = useState<Array<{
    at: string; grant?: string; pmid?: string | null; title?: string;
    url?: string | null; org?: string | null; devices?: string[];
  }>>([]);

  const { data: runs = [], refetch: refetchRuns } = useQuery({
    queryKey: ["kg-live-runs"],
    enabled: isCurator,
    queryFn: async () => {
      const { data } = await supabase
        .from("harvester_runs").select("*")
        .order("started_at", { ascending: false }).limit(20);
      return (data ?? []) as Run[];
    },
    refetchInterval: 5000,
  });

  // Continuous client-side ticker (in addition to the 2-min pg_cron schedule)
  useEffect(() => {
    if (!isCurator || !continuous) return;
    fireTick("kg-live-mount");
    const t = window.setInterval(() => fireTick("kg-live-interval"), tickIntervalSec * 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurator, continuous, tickIntervalSec]);

  const active = runs.filter((r) => !r.finished_at && r.phase !== "done" && r.phase !== "error");

  const upsertNode = (id: string, kind: Kind, label: string, hop: number) => {
    const cur = nodesRef.current.get(id);
    if (cur) { cur.hop = Math.min(cur.hop, hop); return; }
    const s = nodesRef.current.size + 1;
    const r = 80 + hop * 90;
    const theta = (s * 137.5) * (Math.PI / 180);
    nodesRef.current.set(id, {
      id, kind, label: label || id, hop,
      x: VIEW_W / 2 + Math.cos(theta) * r,
      y: VIEW_H / 2 + Math.sin(theta) * r,
      vx: 0, vy: 0,
    });
  };

  const addLink = (from: string, to: string, relation: string) => {
    linksRef.current.push({ source: from, target: to, relation });
    pulsesRef.current.push({ from, to, id: ++pulseIdRef.current, t0: performance.now() / 1000 });
  };

  const ingestPath = (row: any) => {
    const path = Array.isArray(row?.path) ? row.path : [];
    let prevId: string | null = null;
    for (const step of path) {
      const id = `${step.node_type}:${step.node_id}`;
      const kind: Kind = step.node_type === "grant" ? "grant" : "publication";
      upsertNode(id, kind, step.label || step.node_id, step.hop ?? 0);
      if (prevId && step.relation_in) addLink(prevId, id, step.relation_in);
      prevId = id;
    }
  };

  const ingestEvidence = (row: any, opts?: { trace?: boolean }) => {
    if (opts?.trace !== false) {
      setTrace((t) => [{
        at: new Date().toLocaleTimeString(),
        grant: row.source_grant_number,
        pmid: row.pmid,
        title: row.publication_title,
        url: row.source_url,
        org: row.source_org,
        devices: row.device_class ?? [],
      }, ...t].slice(0, 40));
    }
    if (row.source_org) {
      const orgId = `org:${row.source_org}`;
      upsertNode(orgId, "org", row.source_org, 2);
      if (row.source_grant_number) addLink(`grant:${row.source_grant_number}`, orgId, "at_org");
    }
    for (const d of (row.device_class ?? []) as string[]) {
      const id = `device:${d}`;
      upsertNode(id, "device", d, 3);
      if (row.source_org) addLink(`org:${row.source_org}`, id, "uses");
    }
  };

  // Initial load (7d window) + realtime subscriptions
  useEffect(() => {
    if (!isCurator) return;
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: paths } = await supabase
        .from("grant_methods_traversal_paths")
        .select("id,seed_grant_number,chain_score,path,created_at")
        .gte("created_at", since).order("created_at", { ascending: true }).limit(500);
      if (cancelled) return;
      (paths ?? []).forEach(ingestPath);
      const { data: ev } = await supabase
        .from("grant_methods_evidence")
        .select("source_grant_number,source_org,device_class,extracted_at,source_url,pmid,publication_title")
        .gte("extracted_at", since).order("extracted_at", { ascending: false }).limit(1000);
      if (cancelled) return;
      // Graph nodes from all rows, but only seed the trace with the latest 30
      (ev ?? []).forEach((r) => ingestEvidence(r, { trace: false }));
      const seedTrace = (ev ?? []).slice(0, 30).map((r: any) => ({
        at: new Date(r.extracted_at).toLocaleTimeString(),
        grant: r.source_grant_number,
        pmid: r.pmid,
        title: r.publication_title,
        url: r.source_url,
        org: r.source_org,
        devices: r.device_class ?? [],
      }));
      setTrace(seedTrace);
      setVersion((v) => v + 1);
    })();
    const ch = supabase
      .channel("kg-live-3d")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "grant_methods_traversal_paths" },
        (p) => { ingestPath(p.new as any); setVersion((v) => v + 1); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "grant_methods_evidence" },
        (p) => { ingestEvidence(p.new as any); setVersion((v) => v + 1); })
      .on("postgres_changes", { event: "*", schema: "public", table: "harvester_runs" },
        () => refetchRuns())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurator]);

  const stats = useMemo(() => {
    const ns = Array.from(nodesRef.current.values());
    return {
      grants: ns.filter((n) => n.kind === "grant").length,
      pubs: ns.filter((n) => n.kind === "publication").length,
      orgs: ns.filter((n) => n.kind === "org").length,
      devices: ns.filter((n) => n.kind === "device").length,
      links: linksRef.current.length,
    };
  }, [version]);

  if (isLoading) return <div className="container mx-auto px-4 py-8">Loading…</div>;
  if (!isCurator) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-8 text-center space-y-3">
          <Lock className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold">Admin only</h1>
          <p className="text-sm text-muted-foreground">The live KG view is restricted to consortium curators and admins.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <PageMeta title="KG Live — Admin" description="Real-time 2D view of the multi-hop harvester running" />
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Knowledge Graph · Live Harvest</h1>
          <p className="text-xs text-muted-foreground">
            Real-time view of NIH RePORTER multi-hop traversal. Pulses mark newly discovered relationships.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <Card className="p-0 overflow-hidden bg-background">
          <div style={{ width: "100%", height: "70vh", minHeight: 520 }}>
            <Graph2D nodesRef={nodesRef} linksRef={linksRef} pulsesRef={pulsesRef} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground p-3 border-t">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: NODE_COLOR.grant }} /> Grants ({stats.grants})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: NODE_COLOR.publication }} /> Pubs ({stats.pubs})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: NODE_COLOR.org }} /> Orgs ({stats.orgs})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: NODE_COLOR.device }} /> Devices ({stats.devices})</span>
            <span>· {stats.links} edges · {pulsesRef.current.length} active traversals</span>
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${pinging ? "bg-amber-500 animate-pulse" : continuous ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                Cycler
              </h2>
              <label className="flex items-center gap-2 text-xs">
                Continuous
                <Switch checked={continuous} onCheckedChange={setContinuous} />
              </label>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Every {tickIntervalSec}s (client) · every 2m (cron) · daily 09:00 UTC refresh
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => fireTick("manual")} disabled={pinging}>
                  Check next
                </Button>
                <Button size="sm" variant="default" onClick={() => fireTickInternal("manual-force", true)} disabled={pinging}>
                  <Zap className="w-3 h-3 mr-1" /> Force run
                </Button>
              </div>
            </div>
            <div className="flex gap-1 text-[10px]">
              {[10, 25, 60, 120].map((s) => (
                <button
                  key={s}
                  onClick={() => setTickIntervalSec(s)}
                  className={`px-2 py-0.5 rounded border ${tickIntervalSec === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                >
                  {s}s
                </button>
              ))}
            </div>
            <div className="space-y-0.5 max-h-[180px] overflow-y-auto text-[11px] font-mono border-t pt-2">
              {pings.length === 0 && (
                <div className="text-muted-foreground italic">No pings yet…</div>
              )}
              {pings.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <span className={p.ok ? "text-emerald-600" : "text-destructive"}>●</span>
                  <span className="text-muted-foreground">{p.at}</span>
                  <span className="truncate">{p.msg}</span>
                </div>
              ))}
            </div>
            {lastPingAt && (
              <div className="text-[10px] text-muted-foreground">
                Last ping {Math.round((Date.now() - lastPingAt) / 1000)}s ago
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-2">
            <h2 className="text-sm font-semibold flex items-center justify-between">
              <span>Live trace</span>
              <span className="text-[10px] font-normal text-muted-foreground">{trace.length} captured</span>
            </h2>
            <p className="text-[10px] text-muted-foreground -mt-1">
              Each evidence row landed in the DB — grant, paper, source URL, org, devices.
            </p>
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto text-[11px] border-t pt-2">
              {trace.length === 0 && (
                <div className="text-muted-foreground italic">Waiting for the next evidence row…</div>
              )}
              {trace.map((t, i) => (
                <div key={i} className="border rounded p-1.5 space-y-0.5">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="font-mono">{t.grant ?? "—"}</span>
                    <span>{t.at}</span>
                  </div>
                  {t.title && <div className="line-clamp-2 leading-tight">{t.title}</div>}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {t.pmid && (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${t.pmid}/`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-primary hover:underline"
                      >
                        PMID {t.pmid}<ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {t.url && (
                      <a
                        href={t.url}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-primary hover:underline truncate max-w-[180px]"
                        title={t.url}
                      >
                        source<ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {t.org && <Badge variant="outline" className="text-[9px] py-0">{t.org}</Badge>}
                  </div>
                  {t.devices && t.devices.length > 0 && (
                    <div className="flex flex-wrap gap-0.5">
                      {t.devices.slice(0, 4).map((d, k) => (
                        <Badge key={k} variant="secondary" className="text-[9px] py-0">{d}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h2 className="text-sm font-semibold">Active runs <Badge variant="secondary">{active.length}</Badge></h2>
            {active.length === 0 && <p className="text-xs text-muted-foreground">Idle. Background tick will pick up the next eligible seed.</p>}
            {active.map((r) => (
              <div key={r.id} className="border rounded p-2 text-xs space-y-1">
                <div className="font-mono font-semibold">{r.seed_grant}</div>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline">{r.phase}</Badge>
                  <Badge variant="outline">hop {r.current_hop}</Badge>
                </div>
                {r.current_target && <div className="text-muted-foreground truncate">{r.current_target}</div>}
                <div className="text-muted-foreground">pubs {r.pubs_found} · ev {r.evidence_rows} · fc {r.firecrawl_calls}</div>
                {r.last_message && <div className="italic text-muted-foreground line-clamp-2">{r.last_message}</div>}
              </div>
            ))}
          </Card>

          <Card className="p-4 space-y-2">
            <h2 className="text-sm font-semibold">Recent runs</h2>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {runs.filter((r) => r.finished_at || r.phase === "done" || r.phase === "error").slice(0, 12).map((r) => (
                <div key={r.id} className="flex justify-between text-xs border-b pb-1">
                  <span className="font-mono truncate max-w-[140px]">{r.seed_grant}</span>
                  <span className="text-muted-foreground">{r.evidence_rows} ev</span>
                  <Badge variant={r.phase === "error" ? "destructive" : "secondary"} className="text-[10px]">
                    {r.phase}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}