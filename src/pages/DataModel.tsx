import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PageMeta } from "@/components/PageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, Search, X } from "lucide-react";
import { DOMAINS, RELATIONS, TABLES, type DomainKey } from "@/data/data-model-schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, Sparkles, Waypoints, Cpu } from "lucide-react";

// ---- Layout: cluster tables by domain into a grid of boxes ----

const DOMAIN_ORDER: DomainKey[] = [
  "core",
  "projects",
  "people",
  "community",
  "devices",
  "knowledge",
  "auth",
  "ops",
  "agent",
];

const DOMAIN_COLS = 4;
const CLUSTER_W = 520;
const CLUSTER_H = 460;
const NODE_W = 210;
const NODE_H = 62;

function layoutNodes(activeDomains: Set<DomainKey>): Node[] {
  const nodes: Node[] = [];
  DOMAIN_ORDER.forEach((domain, idx) => {
    if (!activeDomains.has(domain)) return;
    const col = idx % DOMAIN_COLS;
    const row = Math.floor(idx / DOMAIN_COLS);
    const cx = col * CLUSTER_W;
    const cy = row * CLUSTER_H;

    const tables = TABLES.filter((t) => t.domain === domain);
    tables.forEach((t, i) => {
      const perCol = 2;
      const tCol = i % perCol;
      const tRow = Math.floor(i / perCol);
      nodes.push({
        id: t.name,
        type: "table",
        position: { x: cx + tCol * (NODE_W + 24) + 20, y: cy + tRow * (NODE_H + 14) + 60 },
        data: { table: t, hue: DOMAINS[domain].color, domainLabel: DOMAINS[domain].label },
      });
    });
  });
  return nodes;
}

function buildEdges(activeDomains: Set<DomainKey>, highlightTable: string | null): Edge[] {
  const nameToDomain = new Map(TABLES.map((t) => [t.name, t.domain]));
  return RELATIONS.filter((r) => {
    const fd = nameToDomain.get(r.from);
    const td = nameToDomain.get(r.to);
    return fd && td && activeDomains.has(fd) && activeDomains.has(td);
  }).map((r) => {
    const isHi =
      highlightTable && (r.from === highlightTable || r.to === highlightTable);
    return {
      id: `${r.from}__${r.via}__${r.to}`,
      source: r.from,
      target: r.to,
      label: r.via,
      animated: !!isHi,
      style: {
        stroke: isHi ? "hsl(38 90% 50%)" : "hsl(220 10% 55% / 0.55)",
        strokeWidth: isHi ? 2.2 : 1.2,
        strokeDasharray: r.kind === "self" ? "4 4" : undefined,
      },
      labelStyle: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
      labelBgStyle: { fill: "hsl(var(--background))", fillOpacity: 0.85 },
      markerEnd: { type: MarkerType.ArrowClosed, color: isHi ? "hsl(38 90% 50%)" : "hsl(220 10% 55%)" },
    } satisfies Edge;
  });
}

// ---- Custom node ----

type TableNodeData = {
  table: (typeof TABLES)[number];
  hue: string;
  domainLabel: string;
};

function TableNode({ data, selected }: NodeProps) {
  const { table, hue, domainLabel } = data as TableNodeData;
  return (
    <div
      className="rounded-md border bg-card shadow-sm transition-all"
      style={{
        width: NODE_W,
        borderColor: selected ? hue : "hsl(var(--border))",
        borderWidth: selected ? 2 : 1,
        boxShadow: selected ? `0 0 0 3px ${hue}22, 0 4px 12px ${hue}33` : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: hue, width: 6, height: 6 }} />
      <div className="flex items-start gap-2 px-3 py-2">
        <span
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: hue, boxShadow: table.hub ? `0 0 0 3px ${hue}33` : undefined }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-mono font-semibold text-foreground">
              {table.name}
            </span>
            {table.hub && (
              <Badge variant="secondary" className="h-4 px-1 text-[9px]">HUB</Badge>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {table.cols} cols · {domainLabel}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: hue, width: 6, height: 6 }} />
    </div>
  );
}

const nodeTypes = { table: TableNode };

// ---- Page ----

export default function DataModel() {
  const [activeDomains, setActiveDomains] = useState<Set<DomainKey>>(
    () => new Set(DOMAIN_ORDER),
  );
  const [selected, setSelected] = useState<string | null>("resources");
  const [search, setSearch] = useState("");

  const initialNodes = useMemo(() => layoutNodes(activeDomains), [activeDomains]);
  const initialEdges = useMemo(() => buildEdges(activeDomains, selected), [activeDomains, selected]);

  const [, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setEdges(buildEdges(activeDomains, selected));
  }, [activeDomains, selected, setEdges]);

  const toggleDomain = (d: DomainKey) => {
    setActiveDomains((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelected(node.id);
  }, []);

  const selectedTable = selected ? TABLES.find((t) => t.name === selected) : null;
  const selectedRelations = selected
    ? RELATIONS.filter((r) => r.from === selected || r.to === selected)
    : [];

  const searchMatches = search.trim()
    ? TABLES.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  const filteredNodes = useMemo(() => {
    // Re-derive nodes with selected state applied
    return layoutNodes(activeDomains).map((n) => ({
      ...n,
      selected: n.id === selected,
    }));
  }, [activeDomains, selected]);

  return (
    <>
      <PageMeta
        title="Data Model · BBQS Engineering"
        description="Interactive view of the BBQS Supabase data model — tables, domains, and how they connect through the 3-layer graph."
      />
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 space-y-4">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Data Model</h1>
            <Badge variant="outline" className="ml-2">
              {TABLES.length} tables · {RELATIONS.length} relations
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">
            The BBQS backend follows a 3-layer graph model on Postgres/Supabase:
            <span className="mx-1 font-medium text-foreground">tenant</span> (organizations),
            <span className="mx-1 font-medium text-foreground">node hub</span> (<code className="font-mono">resources</code>) and
            <span className="mx-1 font-medium text-foreground">edges</span> (UUID foreign keys + join tables).
            Click a table to inspect its connections.
          </p>
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground max-w-3xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full" style={{ background: "hsl(265 80% 65%)" }} />
              <span className="font-medium text-foreground">Two Supabase projects, one graph</span>
            </div>
            <p>
              The <span className="font-medium text-foreground">Knowledge Graph</span> lives in
              project <code className="font-mono">vpexxhfpvghlejljwpvt</code> (this app). The
              conversational agent at <code className="font-mono">agent.brain-bbqs.org</code> runs
              on a separate project (<code className="font-mono">srcxgglijkhxggyauajc</code>) with
              its own <code className="font-mono">agent.*</code> tables shown in the purple domain
              below. The bridge is{" "}
              <code className="font-mono">agent.resource_embeddings.source_id</code> →{" "}
              <code className="font-mono">resources.id</code>: the agent embeds KG rows into its
              own vector store, and proposed edits round-trip back through{" "}
              <code className="font-mono">agent.pending_writes</code> and{" "}
              <code className="font-mono">agent.audit_log</code> (which mirrors upstream audit ids).
            </p>
          </div>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a table…"
              className="h-8 w-56 pl-7 text-xs"
            />
            {searchMatches.length > 0 && (
              <div className="absolute z-10 mt-1 w-56 rounded-md border bg-popover shadow-md">
                {searchMatches.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => {
                      setSelected(m.name);
                      setSearch("");
                    }}
                    className="block w-full px-2 py-1 text-left text-xs font-mono hover:bg-accent"
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {DOMAIN_ORDER.map((d) => {
            const on = activeDomains.has(d);
            return (
              <button
                key={d}
                onClick={() => toggleDomain(d)}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors"
                style={{
                  borderColor: on ? DOMAINS[d].color : "hsl(var(--border))",
                  background: on ? `${DOMAINS[d].color}18` : "transparent",
                  color: on ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                }}
                aria-pressed={on}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: DOMAINS[d].color }}
                />
                {DOMAINS[d].label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* Canvas */}
          <div
            className="relative rounded-lg border bg-muted/20"
            style={{ height: "calc(100vh - 320px)", minHeight: 520 }}
          >
            <ReactFlow
              nodes={filteredNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              onPaneClick={() => setSelected(null)}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              minZoom={0.2}
              maxZoom={1.6}
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={20} color="hsl(var(--border))" />
              <Controls showInteractive={false} />
              <MiniMap
                pannable
                zoomable
                nodeColor={(n) => {
                  const t = TABLES.find((x) => x.name === n.id);
                  return t ? DOMAINS[t.domain].color : "#999";
                }}
                maskColor="hsl(var(--background) / 0.6)"
                style={{ background: "hsl(var(--card))" }}
              />
            </ReactFlow>
          </div>

          {/* Detail panel */}
          <Card className="h-fit lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-mono">
                    {selectedTable ? selectedTable.name : "Select a table"}
                  </CardTitle>
                  {selectedTable && (
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: DOMAINS[selectedTable.domain].color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {DOMAINS[selectedTable.domain].label} · {selectedTable.cols} columns
                      </span>
                    </div>
                  )}
                </div>
                {selected && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setSelected(null)}
                    aria-label="Clear selection"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {!selectedTable && (
                <p className="text-xs text-muted-foreground">
                  Click any table in the graph — or search above — to see its notes and connections.
                </p>
              )}
              {selectedTable && (
                <>
                  {selectedTable.note && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedTable.note}
                    </p>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      Domain
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {DOMAINS[selectedTable.domain].description}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      Relations ({selectedRelations.length})
                    </h4>
                    {selectedRelations.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No inferred foreign-key edges. May still be referenced by RPC/RLS logic.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {selectedRelations.map((r) => {
                          const other = r.from === selected ? r.to : r.from;
                          const dir = r.from === selected ? "→" : "←";
                          return (
                            <li
                              key={`${r.from}-${r.via}-${r.to}`}
                              className="flex items-center gap-1.5 text-xs"
                            >
                              <span className="text-muted-foreground">{dir}</span>
                              <button
                                onClick={() => setSelected(other)}
                                className="font-mono text-primary hover:underline"
                              >
                                {other}
                              </button>
                              <span className="text-muted-foreground">via</span>
                              <code className="font-mono text-[10px] text-muted-foreground">
                                {r.via}
                              </code>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          Snapshot maintained by hand in <code className="font-mono">src/data/data-model-schema.ts</code>.
          Postgres foreign-key constraints aren't enforced on most edges — relations are inferred from column naming
          (<code className="font-mono">*_id</code>) and RLS logic.
        </p>

        <KnowledgeGraphHopping />
      </div>
    </>
  );
}

// ---- Knowledge graph hopping / discovery algorithms ----

function KnowledgeGraphHopping() {
  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <Waypoints className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight">Knowledge Graph Hopping</h2>
        <Badge variant="outline" className="text-[10px]">discovery layer</Badge>
      </div>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Because <code className="font-mono">resources</code> is a single hub and almost every edge
        is a UUID pointer or a row in <code className="font-mono">resource_links</code>, we can
        traverse the graph in <em>hops</em> — following relationships from a starting node outward
        to surface non-obvious connections. This is where new science comes from: a device used in
        one grant turns out to share a modality with a publication from a different lab studying a
        different species.
      </p>

      <Tabs defaultValue="hops" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="hops" className="text-xs">Hop patterns</TabsTrigger>
          <TabsTrigger value="algos" className="text-xs">Algorithms</TabsTrigger>
          <TabsTrigger value="devices" className="text-xs">Devices example</TabsTrigger>
          <TabsTrigger value="stack" className="text-xs">Stack</TabsTrigger>
        </TabsList>

        <TabsContent value="hops" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <HopCard
              n={1}
              title="1-hop · direct edges"
              body="Given a device, follow resource_links to its manuals, the grants that use it, and the publications that cite it. Cheap SQL join, no inference."
            />
            <HopCard
              n={2}
              title="2-hop · shared neighbors"
              body="From device → grants → other devices used by those same grants. Surfaces the practical 'rig' — devices that tend to co-appear even without an explicit relation."
            />
            <HopCard
              n={3}
              title="3-hop · cross-domain bridges"
              body="Device → grant → species → other devices used on that species elsewhere. This is where we find candidate transfers across labs and across model organisms."
            />
          </div>
        </TabsContent>

        <TabsContent value="algos" className="mt-4 space-y-3">
          <AlgoRow
            icon={<Sparkles className="h-4 w-4" />}
            name="Jaccard co-occurrence"
            where="suggest-related edge function"
            body="Already live for projects. Compares species / sensor / modality / method vocab sets between two nodes. score = |A ∩ B| / |A ∪ B|. Averaged across fields; threshold 0.15 writes suggestions to metadata.related_project_ids."
          />
          <AlgoRow
            icon={<GitBranch className="h-4 w-4" />}
            name="Personalized PageRank (planned)"
            where="over resources + resource_links"
            body="Seed a random walk from one device node, weight edges by link kind (uses > cites > mentions), read off the top-N stationary probabilities. Good for 'what is closest in graph-distance to this device' without hand-picking a hop count."
          />
          <AlgoRow
            icon={<Cpu className="h-4 w-4" />}
            name="Vector-similarity fallback"
            where="pgvector on resource embeddings"
            body="When there are no graph edges yet — a brand-new device manual, a newly ingested publication — cosine-similarity on the embedding surfaces likely neighbors. The unified learning loop then promotes confirmed matches to real resource_links rows so the next PageRank pass sees them."
          />
          <AlgoRow
            icon={<Waypoints className="h-4 w-4" />}
            name="Ontology-mediated bridging"
            where="ontology approval + metadata.vocab"
            body="Once a curator approves a canonical term (e.g. 'Neuropixels 2.0' aliases 'NP2'), every resource tagged with either form collapses to one graph node. That single approval can create dozens of new 2-hop paths overnight."
          />
        </TabsContent>

        <TabsContent value="devices" className="mt-4">
          <Card>
            <CardContent className="pt-4 space-y-3 text-sm">
              <p className="text-muted-foreground">
                Concrete run against the devices sub-graph. Starting node:
                <code className="mx-1 font-mono">Neuropixels 2.0</code>.
              </p>
              <pre className="text-[11px] font-mono bg-muted/40 rounded-md p-3 overflow-x-auto leading-relaxed">
{`hop 1  Neuropixels 2.0
       ├── manual        → imec quickstart PDF          (resource_links: has_manual)
       ├── used_by       → grant R01-NS-12345           (resource_links: uses_device)
       └── used_by       → grant U19-…-99887

hop 2  grant R01-NS-12345
       ├── studies       → Mus musculus                 (projects.study_species)
       ├── uses_device   → Miniscope v4                 ← co-rig candidate
       └── produces      → dandiset:000409              (ember_dandisets)

hop 3  Mus musculus
       └── used_in       → grant R21-…-55221 (other lab)
             └── uses_device → 2p mesoscope             ← cross-lab transfer
                                                          candidate for
                                                          Neuropixels 2.0 users`}
              </pre>
              <p className="text-xs text-muted-foreground">
                The <code className="font-mono">2p mesoscope</code> node is 3 hops from Neuropixels
                but never appears in the same grant — that's the kind of edge the recommender is
                meant to surface, and the kind of relationship a curator confirms once and then
                exists as a first-class <code className="font-mono">resource_links</code> row forever.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stack" className="mt-4">
          <Card>
            <CardContent className="pt-4 text-sm space-y-2">
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Storage:</span> Postgres +
                  pgvector. Graph lives in <code className="font-mono">resources</code> +
                  <code className="font-mono"> resource_links</code>; embeddings on
                  <code className="font-mono"> resources.embedding</code>.
                </li>
                <li>
                  <span className="font-medium text-foreground">Traversal:</span> recursive CTEs
                  for bounded k-hop queries; edge functions materialize expensive walks nightly.
                </li>
                <li>
                  <span className="font-medium text-foreground">Scoring:</span> Jaccard today,
                  Personalized PageRank + embedding cosine next.
                </li>
                <li>
                  <span className="font-medium text-foreground">Human loop:</span> ontology
                  approval collapses aliases; curator sign-off promotes suggestions from
                  <code className="font-mono"> metadata.related_*</code> to real link rows.
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function HopCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ background: "hsl(38 90% 50% / 0.15)", color: "hsl(38 90% 40%)" }}
          >
            {n}
          </span>
          <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
      </CardContent>
    </Card>
  );
}

function AlgoRow({
  icon,
  name,
  where,
  body,
}: {
  icon: React.ReactNode;
  name: string;
  where: string;
  body: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold">{name}</h4>
              <code className="text-[10px] font-mono text-muted-foreground">{where}</code>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{body}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}