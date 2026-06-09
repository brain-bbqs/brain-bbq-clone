import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserTier } from "@/hooks/useUserTier";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageMeta } from "@/components/PageMeta";
import { Lock, Search } from "lucide-react";

type Evidence = {
  id: string;
  seed_grant_number: string;
  source_grant_number: string;
  source_grant_title: string | null;
  source_org: string | null;
  source_org_type: string | null;
  depth: number;
  pmid: string | null;
  publication_title: string | null;
  device_hardware: string[] | null;
  analysis_metrics: string[] | null;
  setting: string | null;
  confidence: number | null;
  discovery_path_id: string | null;
  source_url: string | null;
  quote: string | null;
  device_class: string[] | null;
  species: string[] | null;
  study_arm: string | null;
};
type Path = { id: string; chain_score: number };

type AxisKey = "grants_hardware" | "orgs_conditions" | "investigators_hardware" | "orgs_devices";

// Hop band colors — orange = close, yellow = mid, pale = far
function depthColor(minDepth: number, intensity: number): string {
  // intensity 0..1 → alpha
  const a = Math.min(0.15 + intensity * 0.85, 1);
  if (minDepth <= 1) return `hsl(20 95% 55% / ${a})`;     // orange, hop 0–1
  if (minDepth === 2) return `hsl(45 95% 60% / ${a})`;   // gold, hop 2
  return `hsl(50 70% 80% / ${a})`;                       // pale, hop 3+
}

// Derive condition tag from a row (very rough — keyword on title + setting)
function deriveCondition(r: Evidence): string {
  const t = `${r.source_grant_title ?? ""} ${r.publication_title ?? ""} ${r.quote ?? ""}`.toLowerCase();
  if (/\btbi\b|traumatic brain|head injury|concussion/.test(t)) return "TBI";
  if (/stroke|ischemi|hemorrhag/.test(t)) return "Stroke";
  if (/depress|mdd|mood/.test(t)) return "Depression";
  if (/parkinson|pd\b/.test(t)) return "Parkinson's";
  if (/epilep|seizure/.test(t)) return "Epilepsy";
  if (/coma|disorders? of consciousness|vegetative|minimally conscious/.test(t)) return "DoC";
  if (/anxiety|ptsd|trauma/.test(t)) return "Anxiety/PTSD";
  if (/addiction|substance|opioid|alcohol/.test(t)) return "Addiction";
  if (/autism|asd\b/.test(t)) return "Autism";
  if (/schizo|psychos/.test(t)) return "Schizophrenia";
  if (r.setting === "ICU") return "Critical care";
  if (r.setting === "animal") return "Animal model";
  return "Other";
}

export default function AdminKgHeatmap() {
  const { isCurator, isLoading } = useUserTier();
  const [axis, setAxis] = useState<AxisKey>("grants_hardware");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<{ row: string; col: string; rows: Evidence[] } | null>(null);

  const { data: evidence = [] } = useQuery({
    queryKey: ["kg-heatmap-evidence"],
    enabled: isCurator,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grant_methods_evidence")
        .select("id,seed_grant_number,source_grant_number,source_grant_title,source_org,source_org_type,depth,pmid,publication_title,device_hardware,analysis_metrics,setting,confidence,discovery_path_id,source_url,quote,device_class,species,study_arm")
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as Evidence[];
    },
  });

  const { data: paths = [] } = useQuery({
    queryKey: ["kg-heatmap-paths"],
    enabled: isCurator,
    queryFn: async () => {
      const { data } = await supabase.from("grant_methods_traversal_paths").select("id,chain_score").limit(5000);
      return (data ?? []) as Path[];
    },
  });

  const { data: grantInvs = [] } = useQuery({
    queryKey: ["kg-heatmap-grant-investigators"],
    enabled: isCurator && axis === "investigators_hardware",
    queryFn: async () => {
      const { data } = await supabase
        .from("grant_investigators")
        .select("grant_id,role,investigators(full_name),grants(grant_number)")
        .limit(5000);
      return (data as any[]) ?? [];
    },
  });

  const pathScore = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of paths) m.set(p.id, p.chain_score);
    return m;
  }, [paths]);

  // Bridge orgs: orgs that appear in BOTH animal_model AND clinical_translational study_arms
  const bridgeOrgs = useMemo(() => {
    const animal = new Set<string>(), clinical = new Set<string>();
    for (const ev of evidence) {
      if (!ev.source_org) continue;
      if (ev.study_arm === "animal_model") animal.add(ev.source_org);
      if (ev.study_arm === "clinical_translational") clinical.add(ev.source_org);
    }
    return new Set([...animal].filter((o) => clinical.has(o)));
  }, [evidence]);

  // Build {row,col} → { count, sumScore, minDepth, rows[] }
  const matrix = useMemo(() => {
    const cells = new Map<string, { count: number; score: number; minDepth: number; rows: Evidence[] }>();
    const rowSet = new Set<string>();
    const colSet = new Set<string>();

    const grantToInvs: Record<string, string[]> = {};
    if (axis === "investigators_hardware") {
      for (const gi of grantInvs) {
        const gn = gi.grants?.grant_number;
        const name = gi.investigators?.full_name;
        if (gn && name) (grantToInvs[gn] ??= []).push(name);
      }
    }

    for (const ev of evidence) {
      const score = (ev.discovery_path_id && pathScore.get(ev.discovery_path_id))
        ?? (ev.confidence ?? 0.3);

      let rowVals: string[] = [];
      let colVals: string[] = [];
      if (axis === "grants_hardware") {
        rowVals = [ev.source_grant_number];
        colVals = (ev.device_hardware ?? []).filter(Boolean);
      } else if (axis === "orgs_conditions") {
        rowVals = ev.source_org ? [ev.source_org] : [];
        colVals = [deriveCondition(ev)];
      } else if (axis === "orgs_devices") {
        rowVals = ev.source_org ? [ev.source_org] : [];
        colVals = (ev.device_class ?? []).filter(Boolean);
      } else {
        rowVals = grantToInvs[ev.source_grant_number] ?? [];
        colVals = (ev.device_hardware ?? []).filter(Boolean);
      }
      for (const r of rowVals) {
        rowSet.add(r);
        for (const c of colVals) {
          colSet.add(c);
          const key = `${r}\u0001${c}`;
          const cell = cells.get(key) ?? { count: 0, score: 0, minDepth: 99, rows: [] };
          cell.count++;
          cell.score = Math.max(cell.score, score);
          cell.minDepth = Math.min(cell.minDepth, ev.depth);
          cell.rows.push(ev);
          cells.set(key, cell);
        }
      }
    }

    const rows = [...rowSet].sort();
    const cols = [...colSet].sort();
    return { rows, cols, cells };
  }, [evidence, axis, grantInvs, pathScore]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return matrix;
    const f = filter.toLowerCase();
    const rows = matrix.rows.filter((r) => r.toLowerCase().includes(f));
    const cols = matrix.cols.filter((c) => c.toLowerCase().includes(f));
    // Also surface rows/cols whose cell rows mention the filter
    const extraRows = new Set<string>();
    const extraCols = new Set<string>();
    for (const [key, cell] of matrix.cells) {
      const text = cell.rows.map(r => `${r.publication_title} ${r.source_grant_title} ${r.quote}`).join(" ").toLowerCase();
      if (text.includes(f)) {
        const [r, c] = key.split("\u0001");
        extraRows.add(r); extraCols.add(c);
      }
    }
    return {
      rows: [...new Set([...rows, ...extraRows])].sort(),
      cols: [...new Set([...cols, ...extraCols])].sort(),
      cells: matrix.cells,
    };
  }, [matrix, filter]);

  if (isLoading) return <div className="container mx-auto px-4 py-8">Loading…</div>;
  if (!isCurator) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-8 text-center space-y-3">
          <Lock className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold">Admin only</h1>
          <p className="text-sm text-muted-foreground">The Knowledge Graph Heatmap is restricted to consortium curators and admins.</p>
        </Card>
      </div>
    );
  }

  const maxScore = Math.max(0.01, ...[...matrix.cells.values()].map(c => c.score));

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <PageMeta title="KG Heatmap — Admin" description="Knowledge graph heatmap of evidence linkages (admin-only)" />
      <div>
        <h1 className="text-3xl font-bold">Knowledge Graph Heatmap</h1>
        <p className="text-muted-foreground mt-1">
          Multi-hop evidence across the consortium. Cell intensity = multi-hop chain score; hue = hop depth.
          Click any cell to inspect the underlying methods extractions.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter rows, columns, or evidence text (e.g. TBI, hospital name, EEG)…"
            className="pl-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-3 items-center text-xs">
          <span className="font-medium">Hop depth:</span>
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded" style={{ background: depthColor(1, 0.9) }} /> 0–1</span>
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded" style={{ background: depthColor(2, 0.9) }} /> 2</span>
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded" style={{ background: depthColor(3, 0.9) }} /> 3+</span>
        </div>
      </div>

      <Tabs value={axis} onValueChange={(v) => setAxis(v as AxisKey)}>
        <TabsList>
          <TabsTrigger value="grants_hardware">Grants × Hardware</TabsTrigger>
          <TabsTrigger value="orgs_conditions">Organizations × Conditions</TabsTrigger>
          <TabsTrigger value="orgs_devices">Orgs × Device-class</TabsTrigger>
          <TabsTrigger value="investigators_hardware">Investigators × Hardware</TabsTrigger>
        </TabsList>

        {(["grants_hardware", "orgs_conditions", "orgs_devices", "investigators_hardware"] as AxisKey[]).map((k) => (
          <TabsContent key={k} value={k}>
            <Card className="p-2 overflow-auto">
              {filtered.rows.length === 0 || filtered.cols.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No data yet. Run the multi-hop harvester on a grant first.
                </div>
              ) : (
                <table className="border-separate border-spacing-[2px] text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 top-0 bg-background z-20 p-1 text-left"></th>
                      {filtered.cols.map((c) => (
                        <th key={c} className="sticky top-0 bg-background z-10 p-1 align-bottom">
                          <div className="rotate-[-50deg] origin-bottom-left whitespace-nowrap text-[10px] font-medium h-20 w-6">
                            {c.length > 26 ? c.slice(0, 24) + "…" : c}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.rows.map((r) => (
                      <tr key={r}>
                        <th className="sticky left-0 bg-background z-10 text-left font-mono text-[10px] pr-2 align-middle whitespace-nowrap">
                          {(axis === "orgs_devices" || axis === "orgs_conditions") && bridgeOrgs.has(r) && (
                            <span title="Translational bridge: org spans animal + clinical arms" className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: "hsl(20 95% 55%)" }} />
                          )}
                          {r.length > 38 ? r.slice(0, 36) + "…" : r}
                        </th>
                        {filtered.cols.map((c) => {
                          const cell = matrix.cells.get(`${r}\u0001${c}`);
                          if (!cell) {
                            return <td key={c} className="w-5 h-5 bg-muted/30 rounded-sm" />;
                          }
                          const intensity = Math.min(1, cell.score / maxScore);
                          const isBridge = axis === "orgs_devices" && bridgeOrgs.has(r);
                          return (
                            <td key={c}>
                              <button
                                onClick={() => setSelected({ row: r, col: c, rows: cell.rows })}
                                title={`${cell.count} evidence · max chain ${cell.score.toFixed(2)} · min hop ${cell.minDepth}${isBridge ? " · translational bridge" : ""}`}
                                className={`w-5 h-5 rounded-sm hover:ring-2 hover:ring-primary transition-all ${isBridge ? "ring-1 ring-orange-500" : ""}`}
                                style={{ background: depthColor(cell.minDepth, intensity) }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <p className="text-xs text-muted-foreground mt-2">
              {filtered.rows.length} rows × {filtered.cols.length} columns · {evidence.length} evidence rows total.
            </p>
          </TabsContent>
        ))}
      </Tabs>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[480px] sm:max-w-[520px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base">
                  <span className="font-mono">{selected.row}</span> × <span>{selected.col}</span>
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-3 mt-4">
                {selected.rows.map((r) => (
                  <Card key={r.id} className="p-3 space-y-1 text-sm">
                    <div className="font-medium">{r.publication_title || "(untitled)"}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {r.source_grant_number} · hop {r.depth} · {r.source_org ?? "—"}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {r.setting && <Badge variant="secondary">{r.setting}</Badge>}
                      {r.confidence != null && <Badge variant="outline">conf {Number(r.confidence).toFixed(2)}</Badge>}
                    </div>
                    {r.quote && <blockquote className="italic text-xs border-l-2 border-primary pl-2">"{r.quote}"</blockquote>}
                    {r.source_url && (
                      <a href={r.source_url} target="_blank" rel="noreferrer" className="text-primary text-xs underline">
                        Open source
                      </a>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}