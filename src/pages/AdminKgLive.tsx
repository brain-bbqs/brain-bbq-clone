import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";
import { useUserTier } from "@/hooks/useUserTier";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageMeta } from "@/components/PageMeta";
import { Lock, Activity } from "lucide-react";
import { Bunny3D } from "@/components/admin/kg/Bunny3D";

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
type N3 = {
  id: string;
  kind: Kind;
  label: string;
  hop: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
};
type L3 = { source: string; target: string; relation: string };
type Hop = { from: string; to: string; id: number; t0: number };

const NODE_COLOR: Record<Kind, string> = {
  grant: "#3a4a8c",
  publication: "#f5a524",
  org: "#2dd4bf",
  device: "#c084fc",
};
const NODE_SCALE: Record<Kind, number> = {
  grant: 0.55, publication: 0.35, org: 0.45, device: 0.4,
};

function rand(s: number) {
  // deterministic-ish jitter
  return (Math.sin(s * 9301 + 49297) * 233280) % 1;
}

// 3D force-directed scene: applies repulsion + link springs + center gravity
// each frame. Bunnies hop along emitted edges.
function Scene({
  nodesRef, linksRef, hopsRef, version,
}: {
  nodesRef: React.MutableRefObject<Map<string, N3>>;
  linksRef: React.MutableRefObject<L3[]>;
  hopsRef: React.MutableRefObject<Hop[]>;
  version: number;
}) {
  // Force tick
  useFrame((_, dt) => {
    const nodes = Array.from(nodesRef.current.values());
    const ns = nodes.length;
    if (ns === 0) return;
    const step = Math.min(dt, 0.05);
    // Repulsion
    for (let i = 0; i < ns; i++) {
      for (let j = i + 1; j < ns; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.pos.x - b.pos.x, dy = a.pos.y - b.pos.y, dz = a.pos.z - b.pos.z;
        const d2 = dx*dx + dy*dy + dz*dz + 0.05;
        const f = 4 / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f, fy = (dy / d) * f, fz = (dz / d) * f;
        a.vel.x += fx * step; a.vel.y += fy * step; a.vel.z += fz * step;
        b.vel.x -= fx * step; b.vel.y -= fy * step; b.vel.z -= fz * step;
      }
    }
    // Spring links
    for (const l of linksRef.current) {
      const a = nodesRef.current.get(l.source);
      const b = nodesRef.current.get(l.target);
      if (!a || !b) continue;
      const dx = b.pos.x - a.pos.x, dy = b.pos.y - a.pos.y, dz = b.pos.z - a.pos.z;
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.001;
      const target = 2.2;
      const f = (d - target) * 0.6;
      const fx = (dx / d) * f, fy = (dy / d) * f, fz = (dz / d) * f;
      a.vel.x += fx * step; a.vel.y += fy * step; a.vel.z += fz * step;
      b.vel.x -= fx * step; b.vel.y -= fy * step; b.vel.z -= fz * step;
    }
    // Gravity to center + damping + integrate
    for (const n of nodes) {
      n.vel.x += -n.pos.x * 0.05 * step;
      n.vel.y += -n.pos.y * 0.05 * step;
      n.vel.z += -n.pos.z * 0.05 * step;
      n.vel.multiplyScalar(0.88);
      n.pos.x += n.vel.x; n.pos.y += n.vel.y; n.pos.z += n.vel.z;
      // keep above the grid floor a bit
      if (n.pos.y < -2) { n.pos.y = -2; n.vel.y = Math.abs(n.vel.y) * 0.3; }
    }
  });

  // Snapshot for render
  const nodes = Array.from(nodesRef.current.values());
  const links = linksRef.current;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[8, 12, 6]} intensity={1.1} castShadow />
      <directionalLight position={[-6, 4, -4]} intensity={0.4} />
      <Grid
        args={[40, 40]}
        position={[0, -2.05, 0]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#c8d0e0"
        sectionSize={2}
        sectionThickness={1.2}
        sectionColor="#3a4a8c"
        fadeDistance={28}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Links */}
      {links.map((l, i) => {
        const a = nodesRef.current.get(l.source);
        const b = nodesRef.current.get(l.target);
        if (!a || !b) return null;
        return (
          <Line
            key={i}
            points={[a.pos.toArray() as [number, number, number], b.pos.toArray() as [number, number, number]]}
            color="#94a3b8"
            transparent
            opacity={0.55}
            lineWidth={1.2}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => (
        <group key={n.id} position={n.pos.toArray() as [number, number, number]}>
          <mesh castShadow>
            <sphereGeometry args={[NODE_SCALE[n.kind], 18, 18]} />
            <meshStandardMaterial color={NODE_COLOR[n.kind]} emissive={NODE_COLOR[n.kind]} emissiveIntensity={0.18} roughness={0.45} />
          </mesh>
          <Html position={[0, NODE_SCALE[n.kind] + 0.18, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
            <div style={{
              fontSize: 10, color: "#1a2547", background: "rgba(255,255,255,0.85)",
              padding: "1px 5px", borderRadius: 4, whiteSpace: "nowrap",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}>
              {n.label.length > 28 ? n.label.slice(0, 26) + "…" : n.label}
            </div>
          </Html>
        </group>
      ))}

      {/* Hopping bunnies */}
      {hopsRef.current.map((h) => (
        <BunnyHop key={h.id} hop={h} nodesRef={nodesRef} hopsRef={hopsRef} />
      ))}

      <OrbitControls makeDefault enableDamping dampingFactor={0.12} />
      {/* Force re-render when version changes */}
      <group visible={false}><mesh><boxGeometry args={[0,0,0]} /><meshBasicMaterial /></mesh><Html><span style={{display:"none"}}>{version}</span></Html></group>
    </>
  );
}

function BunnyHop({
  hop, nodesRef, hopsRef,
}: {
  hop: Hop;
  nodesRef: React.MutableRefObject<Map<string, N3>>;
  hopsRef: React.MutableRefObject<Hop[]>;
}) {
  const ref = useRef<THREE.Group>(null!);
  const DURATION = 2.4; // seconds for full traversal
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const a = nodesRef.current.get(hop.from);
    const b = nodesRef.current.get(hop.to);
    if (!a || !b) return;
    const t = (clock.getElapsedTime() - hop.t0) / DURATION;
    if (t >= 1) {
      hopsRef.current = hopsRef.current.filter((h) => h.id !== hop.id);
      return;
    }
    // 4 mini-arc hops along the segment
    const HOPS = 5;
    const segT = (t * HOPS) % 1;
    const x = a.pos.x + (b.pos.x - a.pos.x) * t;
    const y = a.pos.y + (b.pos.y - a.pos.y) * t + Math.sin(segT * Math.PI) * 0.4;
    const z = a.pos.z + (b.pos.z - a.pos.z) * t;
    ref.current.position.set(x, y, z);
    // Face direction of travel
    const dir = new THREE.Vector3(b.pos.x - a.pos.x, 0, b.pos.z - a.pos.z);
    if (dir.lengthSq() > 0.0001) {
      ref.current.rotation.y = Math.atan2(dir.z, dir.x) * -1;
    }
  });
  return (
    <group ref={ref}>
      <Bunny3D color="#fafafa" />
    </group>
  );
}

export default function AdminKgLive() {
  const { isCurator, isLoading } = useUserTier();
  const nodesRef = useRef<Map<string, N3>>(new Map());
  const linksRef = useRef<L3[]>([]);
  const hopsRef = useRef<Hop[]>([]);
  const hopIdRef = useRef(0);
  const [version, setVersion] = useState(0);

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

  const active = runs.filter((r) => !r.finished_at && r.phase !== "done" && r.phase !== "error");

  const upsertNode = (id: string, kind: Kind, label: string, hop: number) => {
    const cur = nodesRef.current.get(id);
    if (cur) { cur.hop = Math.min(cur.hop, hop); return; }
    const s = nodesRef.current.size + 1;
    const r = 3 + hop * 1.8;
    const theta = rand(s) * Math.PI * 2;
    const phi = rand(s + 7) * Math.PI;
    nodesRef.current.set(id, {
      id, kind, label: label || id, hop,
      pos: new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * r,
        Math.cos(phi) * r * 0.5,
        Math.sin(phi) * Math.sin(theta) * r,
      ),
      vel: new THREE.Vector3(),
    });
  };

  const addLink = (from: string, to: string, relation: string) => {
    linksRef.current.push({ source: from, target: to, relation });
    hopsRef.current.push({ from, to, id: ++hopIdRef.current, t0: performance.now() / 1000 });
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

  const ingestEvidence = (row: any) => {
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
        .select("source_grant_number,source_org,device_class,extracted_at")
        .gte("extracted_at", since).limit(1000);
      if (cancelled) return;
      (ev ?? []).forEach(ingestEvidence);
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
      <PageMeta title="KG Live 3D — Admin" description="Real-time 3D view of the multi-hop harvester running" />
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">KG Live · 3D</h1>
          <p className="text-xs text-muted-foreground">
            Drag to orbit, scroll to zoom. Bunnies hop along edges as NIH RePORTER paths are discovered.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <Card className="p-0 overflow-hidden bg-background">
          <div style={{ width: "100%", height: "70vh", minHeight: 520, background: "linear-gradient(180deg, #eef2fb 0%, #dde4f5 100%)" }}>
            <Canvas shadows camera={{ position: [8, 6, 10], fov: 50 }}>
              <Scene nodesRef={nodesRef} linksRef={linksRef} hopsRef={hopsRef} version={version} />
            </Canvas>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground p-2">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: NODE_COLOR.grant }} /> Grants ({stats.grants})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: NODE_COLOR.publication }} /> Pubs ({stats.pubs})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: NODE_COLOR.org }} /> Orgs ({stats.orgs})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: NODE_COLOR.device }} /> Devices ({stats.devices})</span>
            <span>· {stats.links} links · 🐰 {hopsRef.current.length} hopping</span>
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