import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { supabase } from "@/integrations/supabase/client";
import { useUserTier } from "@/hooks/useUserTier";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageMeta } from "@/components/PageMeta";
import { Lock, Activity } from "lucide-react";

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

type GraphNode = {
  id: string;
  kind: "grant" | "publication" | "org" | "device";
  label: string;
  hop: number;
  ts: number;
  x?: number; y?: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null;
};
type GraphLink = { source: string | GraphNode; target: string | GraphNode; relation: string };

const NODE_COLOR: Record<string, string> = {
  grant: "hsl(229 50% 35%)",
  publication: "hsl(38 90% 50%)",
  org: "hsl(170 60% 40%)",
  device: "hsl(280 55% 55%)",
};

export default function AdminKgLive() {
  const { isCurator, isLoading } = useUserTier();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nodesRef = useRef<Map<string, GraphNode>>(new Map());
  const linksRef = useRef<GraphLink[]>([]);
  const simRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [tick, setTick] = useState(0);
  // Queue of "hop events" — bunnies to animate from one node to another
  const bunnyQueueRef = useRef<{ from: string; to: string; ts: number }[]>([]);

  // Initial pull of recent runs
  const { data: runs = [], refetch: refetchRuns } = useQuery({
    queryKey: ["kg-live-runs"],
    enabled: isCurator,
    queryFn: async () => {
      const { data } = await supabase
        .from("harvester_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      return (data ?? []) as Run[];
    },
    refetchInterval: 5000,
  });

  const active = runs.filter((r) => !r.finished_at && r.phase !== "done" && r.phase !== "error");

  // Initial pull of recent traversal paths (last 30 minutes) — seed the graph
  useEffect(() => {
    if (!isCurator) return;
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("grant_methods_traversal_paths")
        .select("id,seed_grant_number,chain_score,path,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      for (const row of data ?? []) ingestPath(row);
      const { data: ev } = await supabase
        .from("grant_methods_evidence")
        .select("source_grant_number,source_org,device_class,extracted_at")
        .gte("extracted_at", since)
        .limit(500);
      if (cancelled) return;
      for (const r of ev ?? []) ingestEvidence(r);
      setTick((t) => t + 1);
      startSim();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurator]);

  // Realtime subscription
  useEffect(() => {
    if (!isCurator) return;
    const ch = supabase
      .channel("kg-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "grant_methods_traversal_paths" }, (p) => {
        ingestPath(p.new as any);
        setTick((t) => t + 1);
        startSim();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "grant_methods_evidence" }, (p) => {
        ingestEvidence(p.new as any);
        setTick((t) => t + 1);
        startSim();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "harvester_runs" }, () => {
        refetchRuns();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurator]);

  function upsertNode(n: GraphNode) {
    const cur = nodesRef.current.get(n.id);
    if (cur) {
      cur.hop = Math.min(cur.hop, n.hop);
      cur.ts = Math.max(cur.ts, n.ts);
      return cur;
    }
    nodesRef.current.set(n.id, n);
    return n;
  }

  function ingestPath(row: any) {
    const path = Array.isArray(row?.path) ? row.path : [];
    let prevId: string | null = null;
    for (const step of path) {
      const id = `${step.node_type}:${step.node_id}`;
      upsertNode({
        id,
        kind: (step.node_type === "grant" ? "grant" : "publication") as any,
        label: step.label || step.node_id,
        hop: step.hop ?? 0,
        ts: Date.now(),
      });
      if (prevId && step.relation_in) {
        linksRef.current.push({ source: prevId, target: id, relation: step.relation_in });
        bunnyQueueRef.current.push({ from: prevId, to: id, ts: Date.now() });
      }
      prevId = id;
    }
  }

  function ingestEvidence(row: any) {
    if (row.source_org) {
      const orgId = `org:${row.source_org}`;
      upsertNode({ id: orgId, kind: "org", label: row.source_org, hop: 2, ts: Date.now() });
      if (row.source_grant_number) {
        const from = `grant:${row.source_grant_number}`;
        linksRef.current.push({ source: from, target: orgId, relation: "at_org" });
        bunnyQueueRef.current.push({ from, to: orgId, ts: Date.now() });
      }
    }
    for (const d of (row.device_class ?? []) as string[]) {
      const id = `device:${d}`;
      upsertNode({ id, kind: "device", label: d, hop: 3, ts: Date.now() });
      if (row.source_org) {
        const from = `org:${row.source_org}`;
        linksRef.current.push({ source: from, target: id, relation: "uses" });
        bunnyQueueRef.current.push({ from, to: id, ts: Date.now() });
      }
    }
  }

  function startSim() {
    const svg = svgRef.current;
    if (!svg) return;
    const w = svg.clientWidth, h = svg.clientHeight;
    const nodes = Array.from(nodesRef.current.values());
    // Dedup links by endpoint+relation
    const seenLink = new Set<string>();
    const links = linksRef.current.filter((l) => {
      const s = typeof l.source === "string" ? l.source : l.source.id;
      const t = typeof l.target === "string" ? l.target : l.target.id;
      const k = `${s}->${t}:${l.relation}`;
      if (seenLink.has(k)) return false;
      seenLink.add(k);
      // ensure both endpoints exist
      return nodesRef.current.has(s) && nodesRef.current.has(t);
    });
    linksRef.current = links;

    if (simRef.current) simRef.current.stop();
    const sim = d3
      .forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(60).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-160))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collide", d3.forceCollide<GraphNode>().radius(14))
      .alpha(0.7)
      .alphaDecay(0.04);
    simRef.current = sim;

    const sel = d3.select(svg);
    sel.selectAll("*").remove();
    const linkSel = sel
      .append("g")
      .attr("stroke", "hsl(220 15% 60% / 0.4)")
      .attr("stroke-width", 1)
      .selectAll("line")
      .data(links)
      .join("line");

    const g = sel.append("g").selectAll("g").data(nodes).join("g");
    g.append("circle")
      .attr("r", (d) => (d.kind === "grant" ? 9 : d.kind === "org" ? 7 : d.kind === "device" ? 6 : 4))
      .attr("fill", (d) => NODE_COLOR[d.kind])
      .attr("stroke", "white").attr("stroke-width", 1.5);
    g.append("title").text((d) => `${d.kind}: ${d.label}`);
    g.append("text")
      .attr("dx", 10).attr("dy", 4)
      .attr("font-size", 9).attr("fill", "hsl(229 50% 25%)")
      .text((d) => (d.label && d.label.length > 30 ? d.label.slice(0, 28) + "…" : d.label));

    // Bunny layer — emoji bunnies that hop along edges as discovery happens
    const bunnyLayer = sel.append("g").attr("class", "bunnies");

    sim.on("tick", () => {
      linkSel
        .attr("x1", (d: any) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d: any) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d: any) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d: any) => (d.target as GraphNode).y ?? 0);
      g.attr("transform", (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Drain the bunny queue every 400ms — launch one hopping bunny per event
    const launchBunny = (ev: { from: string; to: string }) => {
      const a = nodesRef.current.get(ev.from);
      const b = nodesRef.current.get(ev.to);
      if (!a || !b || a.x == null || b.x == null) return;
      const bunny = bunnyLayer.append("text")
        .attr("font-size", 22)
        .attr("text-anchor", "middle")
        .attr("dy", 6)
        .attr("x", a.x).attr("y", a.y!)
        .text("🐰");
      // Hop in 4 arcs from a to b
      const hops = 4;
      const dur = 220;
      let i = 0;
      const hop = () => {
        i++;
        const t = i / hops;
        const x = (a.x! + (b.x! - a.x!) * t);
        const y = (a.y! + (b.y! - a.y!) * t);
        bunny.transition().duration(dur).ease(d3.easeQuadOut)
          .attr("x", x).attr("y", y - 18)
          .transition().duration(dur).ease(d3.easeQuadIn)
          .attr("y", y)
          .on("end", () => { if (i < hops) hop(); else bunny.transition().duration(400).style("opacity", 0).remove(); });
      };
      hop();
    };
    const interval = window.setInterval(() => {
      const next = bunnyQueueRef.current.splice(0, 3);
      next.forEach(launchBunny);
    }, 400);
    // Stash on sim so we can clear on restart
    (sim as any)._bunnyInterval && window.clearInterval((sim as any)._bunnyInterval);
    (sim as any)._bunnyInterval = interval;
  }

  const stats = useMemo(() => {
    const nodes = Array.from(nodesRef.current.values());
    return {
      total: nodes.length,
      grants: nodes.filter((n) => n.kind === "grant").length,
      pubs: nodes.filter((n) => n.kind === "publication").length,
      orgs: nodes.filter((n) => n.kind === "org").length,
      devices: nodes.filter((n) => n.kind === "device").length,
      links: linksRef.current.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

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
      <PageMeta title="KG Live — Admin" description="Real-time view of the multi-hop harvester running" />
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">KG Live</h1>
          <p className="text-xs text-muted-foreground">
            Real-time graph of the multi-hop harvester. Nodes appear as paths are discovered.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <Card className="p-2 bg-background">
          <svg
            ref={svgRef}
            style={{ width: "100%", height: "70vh", minHeight: 480 }}
            className="rounded border border-border bg-muted/20"
          />
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2 px-2">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: NODE_COLOR.grant }} /> Grants ({stats.grants})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: NODE_COLOR.publication }} /> Pubs ({stats.pubs})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: NODE_COLOR.org }} /> Orgs ({stats.orgs})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: NODE_COLOR.device }} /> Devices ({stats.devices})</span>
            <span>· {stats.links} links</span>
          </div>
        </Card>

        <div className="space-y-3">
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
                <div className="text-muted-foreground">
                  pubs {r.pubs_found} · ev {r.evidence_rows} · fc {r.firecrawl_calls}
                </div>
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