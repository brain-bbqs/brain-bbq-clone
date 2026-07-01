import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

type NodeType = "grant" | "publication" | "device" | "manufacturer" | "manual";

interface GNode {
  id: string;
  label: string;
  type: NodeType;
  url?: string;
  pmid?: string;
  confidence?: number;
  extracted_at?: string;
  val?: number;
}
interface GLink {
  source: string;
  target: string;
  kind: string;
}

interface EvidenceRow {
  seed_grant_number: string;
  source_grant_number: string | null;
  pmid: string | null;
  publication_title: string | null;
  source_url: string | null;
  device_class: string[] | null;
  device_model: string[] | null;
  manufacturer: string[] | null;
  manual_urls: string[] | null;
  species: string[] | null;
  environment_tags: string[] | null;
  confidence: number | null;
  extracted_at: string | null;
}

const COLORS: Record<NodeType, string> = {
  grant: "hsl(38 90% 50%)",       // orange = seed of truth
  publication: "hsl(220 70% 60%)", // blue = source paper
  device: "hsl(150 60% 45%)",      // green = device
  manufacturer: "hsl(280 60% 60%)",// purple = vendor
  manual: "hsl(0 0% 60%)",         // grey = pdf
};

const LEGEND: { type: NodeType; label: string }[] = [
  { type: "grant", label: "Grant" },
  { type: "publication", label: "Publication" },
  { type: "device", label: "Device" },
  { type: "manufacturer", label: "Manufacturer" },
  { type: "manual", label: "Manual" },
];

export default function DevicesGraph() {
  const [rows, setRows] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<GNode | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);
  const [envFilter, setEnvFilter] = useState<string | null>(null);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("grant_methods_evidence")
        .select("seed_grant_number,source_grant_number,pmid,publication_title,source_url,device_class,device_model,manufacturer,manual_urls,species,environment_tags,confidence,extracted_at")
        .limit(500);
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      setSize({ w: r.width, h: Math.max(500, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { nodes, links, speciesOptions, envOptions } = useMemo(() => {
    const nodes = new Map<string, GNode>();
    const links: GLink[] = [];
    const speciesSet = new Set<string>();
    const envSet = new Set<string>();

    for (const r of rows) {
      (r.species || []).forEach((s) => speciesSet.add(s));
      (r.environment_tags || []).forEach((t) => envSet.add(t));

      if (speciesFilter && !(r.species || []).includes(speciesFilter)) continue;
      if (envFilter && !(r.environment_tags || []).includes(envFilter)) continue;

      const seedId = `grant:${r.seed_grant_number}`;
      if (!nodes.has(seedId)) nodes.set(seedId, { id: seedId, label: r.seed_grant_number, type: "grant", val: 6 });

      const srcGrantNum = r.source_grant_number || r.seed_grant_number;
      const srcId = `grant:${srcGrantNum}`;
      if (!nodes.has(srcId)) nodes.set(srcId, { id: srcId, label: srcGrantNum, type: "grant", val: 4 });
      if (srcId !== seedId) links.push({ source: seedId, target: srcId, kind: "similar" });

      if (r.pmid) {
        const pubId = `pub:${r.pmid}`;
        if (!nodes.has(pubId)) {
          nodes.set(pubId, {
            id: pubId,
            label: (r.publication_title || `PMID ${r.pmid}`).slice(0, 60),
            type: "publication",
            pmid: r.pmid,
            url: r.source_url || `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`,
            confidence: r.confidence ?? undefined,
            extracted_at: r.extracted_at ?? undefined,
            val: 3,
          });
        }
        links.push({ source: srcId, target: pubId, kind: "produced" });

        const models = (r.device_model && r.device_model.length ? r.device_model : r.device_class) || [];
        for (const m of models) {
          if (!m) continue;
          const devId = `device:${m}`;
          if (!nodes.has(devId)) nodes.set(devId, { id: devId, label: m, type: "device", val: 4 });
          links.push({ source: pubId, target: devId, kind: "uses" });

          for (const mfr of r.manufacturer || []) {
            const mfrId = `mfr:${mfr}`;
            if (!nodes.has(mfrId)) nodes.set(mfrId, { id: mfrId, label: mfr, type: "manufacturer", val: 4 });
            links.push({ source: devId, target: mfrId, kind: "made_by" });
          }
          for (const mu of r.manual_urls || []) {
            if (!mu) continue;
            const muId = `manual:${mu}`;
            if (!nodes.has(muId)) nodes.set(muId, { id: muId, label: "Manual", type: "manual", url: mu, val: 2 });
            links.push({ source: devId, target: muId, kind: "manual" });
          }
        }
      }
    }
    return {
      nodes: Array.from(nodes.values()),
      links,
      speciesOptions: Array.from(speciesSet).sort(),
      envOptions: Array.from(envSet).sort(),
    };
  }, [rows, speciesFilter, envFilter]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <PageMeta
        title="Devices — Knowledge Graph"
        description="Provenance graph: which grants and publications each device fact came from."
      />
      <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-3">
            <Link to="/resources/devices"><ArrowLeft className="h-4 w-4 mr-1" />Back to devices</Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Device knowledge graph</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every device fact traces back to a grant → publication → device → manufacturer → manual chain.
            Hover to see the source URL.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {LEGEND.map((l) => (
            <span key={l.type} className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-border">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[l.type] }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="text-xs text-muted-foreground self-center mr-2">Species:</div>
        <Badge
          variant={speciesFilter === null ? "default" : "outline"}
          className="cursor-pointer text-[10px]"
          onClick={() => setSpeciesFilter(null)}
        >all</Badge>
        {speciesOptions.map((s) => (
          <Badge
            key={s}
            variant={speciesFilter === s ? "default" : "outline"}
            className="cursor-pointer text-[10px]"
            onClick={() => setSpeciesFilter(s)}
          >{s.replace(/_/g, " ")}</Badge>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="text-xs text-muted-foreground self-center mr-2">Environment:</div>
        <Badge
          variant={envFilter === null ? "default" : "outline"}
          className="cursor-pointer text-[10px]"
          onClick={() => setEnvFilter(null)}
        >all</Badge>
        {envOptions.map((t) => (
          <Badge
            key={t}
            variant={envFilter === t ? "default" : "outline"}
            className="cursor-pointer text-[10px]"
            onClick={() => setEnvFilter(t)}
          >{t.replace(/_/g, " ")}</Badge>
        ))}
      </div>

      <div className="relative rounded-lg border border-border bg-card overflow-hidden" ref={wrapRef} style={{ height: 640 }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading graph…
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm px-6 text-center">
            No evidence yet. The harvester is running in the background — refresh in a few minutes.
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef as any}
            width={size.w}
            height={size.h}
            graphData={{ nodes, links } as any}
            nodeColor={(n: any) => COLORS[(n as GNode).type]}
            nodeLabel={(n: any) => `<div style="font-size:12px"><b>${(n as GNode).label}</b><br/>${(n as GNode).type}</div>`}
            linkColor={() => "hsl(220 15% 50% / 0.35)"}
            linkWidth={1}
            linkDirectionalParticles={1}
            linkDirectionalParticleSpeed={0.004}
            cooldownTicks={80}
            onNodeHover={(n: any) => setHover((n as GNode) || null)}
            onNodeClick={(n: any) => {
              const node = n as GNode;
              if (node.url) window.open(node.url, "_blank");
              else if (node.type === "grant") window.open(`/projects/${node.label}/profile`, "_self");
            }}
            nodeCanvasObjectMode={() => "after"}
            nodeCanvasObject={(node: any, ctx: any, scale: any) => {
              if (scale < 1.2) return;
              const n = node as GNode & { x: number; y: number };
              ctx.font = `${10 / scale}px sans-serif`;
              ctx.fillStyle = "hsl(220 10% 20%)";
              ctx.textAlign = "left";
              ctx.fillText(n.label.slice(0, 40), n.x + 6, n.y + 3);
            }}
          />
        )}

        {hover && (
          <div className="absolute bottom-3 left-3 max-w-md bg-background/95 backdrop-blur border border-border rounded-md px-3 py-2 text-xs shadow-lg pointer-events-none">
            <div className="font-semibold text-foreground mb-0.5">{hover.label}</div>
            <div className="text-muted-foreground uppercase tracking-wide text-[10px]">{hover.type}</div>
            {hover.pmid && <div className="text-muted-foreground mt-1">PMID {hover.pmid}</div>}
            {hover.confidence != null && <div className="text-muted-foreground">confidence {hover.confidence.toFixed(2)}</div>}
            {hover.extracted_at && <div className="text-muted-foreground">extracted {new Date(hover.extracted_at).toLocaleDateString()}</div>}
            {hover.url && (
              <div className="text-primary mt-1 inline-flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> click to open
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        {nodes.length} nodes · {links.length} edges · showing at most 500 evidence rows.
      </div>
    </div>
  );
}