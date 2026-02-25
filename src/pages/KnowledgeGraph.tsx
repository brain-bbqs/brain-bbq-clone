import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectData {
  grant_number: string;
  grant_title: string;
  study_species: string[];
  use_approaches: string[];
  use_sensors: string[];
  produce_data_modality: string[];
  produce_data_type: string[];
  use_analysis_types: string[];
  use_analysis_method: string[];
  develope_software_type: string[];
  develope_hardware_type: string[];
  keywords: string[];
  metadata: Record<string, any>;
}

// Marr-level mapping
interface MarrRow {
  project: string;
  grantNumber: string;
  category: string;
  goals: string[];
  tools: string[];      // approaches + methods
  resources: string[];   // sensors + hardware + software
}

function useExplorerData() {
  return useQuery<ProjectData[]>({
    queryKey: ["explorer-data"],
    queryFn: async () => {
      const [grantsRes, projectsRes] = await Promise.all([
        supabase.from("grants").select("id, grant_number, title").order("title"),
        (supabase.from("projects" as any) as any).select("*"),
      ]);
      if (grantsRes.error) throw grantsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      const grants = grantsRes.data || [];
      const projects = (projectsRes.data || []) as any[];

      return grants.map((g) => {
        const p = projects.find((p: any) => p.grant_number === g.grant_number) || {};
        return {
          grant_number: g.grant_number,
          grant_title: g.title,
          study_species: p.study_species || [],
          use_approaches: p.use_approaches || [],
          use_sensors: p.use_sensors || [],
          produce_data_modality: p.produce_data_modality || [],
          produce_data_type: p.produce_data_type || [],
          use_analysis_types: p.use_analysis_types || [],
          use_analysis_method: p.use_analysis_method || [],
          develope_software_type: p.develope_software_type || [],
          develope_hardware_type: p.develope_hardware_type || [],
          keywords: p.keywords || [],
          metadata: p.metadata || {},
        };
      }).filter((p) =>
        p.study_species.length > 0 || p.use_approaches.length > 0 ||
        p.develope_software_type.length > 0 || p.develope_hardware_type.length > 0
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}

function buildMarrRows(data: ProjectData[]): MarrRow[] {
  return data.map((p) => ({
    project: p.grant_title,
    grantNumber: p.grant_number,
    category: p.metadata?.methodological_category || "Uncategorized",
    goals: [
      ...(p.metadata?.ethological_goals || []),
      ...p.keywords.slice(0, 3),
    ],
    tools: [...p.use_approaches, ...p.use_analysis_method],
    resources: [...p.use_sensors, ...p.develope_hardware_type, ...p.develope_software_type],
  }));
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  "Computer Vision & Kinematics": "hsl(var(--primary))",
  "Behavioral Segmentation": "hsl(142 71% 45%)",
  "Acoustic Attribution": "hsl(45 93% 47%)",
  "Neural Encoding/Decoding & Latent State Inference": "hsl(280 60% 55%)",
  "Generative & Embodied Agent-Based Models": "hsl(200 80% 50%)",
  "Uncategorized": "hsl(var(--muted-foreground))",
};

function TagList({ items, variant = "secondary" }: { items: string[]; variant?: "secondary" | "outline" | "default" }) {
  if (!items || items.length === 0) return <span className="text-xs text-muted-foreground/50 italic">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <Badge key={`${item}-${i}`} variant={variant} className="text-[10px] font-normal whitespace-nowrap">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function MarrTable({ rows }: { rows: MarrRow[] }) {
  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, MarrRow[]>();
    for (const row of rows) {
      const existing = map.get(row.category) || [];
      existing.push(row);
      map.set(row.category, existing);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [rows]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {grouped.map(([category, catRows]) => {
        const isCollapsed = collapsed.has(category);
        const color = CATEGORY_COLORS[category] || CATEGORY_COLORS["Uncategorized"];

        return (
          <div key={category} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(category)}
              className="w-full flex items-center gap-3 px-5 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-sm font-semibold text-foreground flex-1">{category}</span>
              <Badge variant="outline" className="text-[10px]">{catRows.length} projects</Badge>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !isCollapsed && "rotate-180")} />
            </button>

            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground w-[220px]">Project</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground w-[280px]">
                        <span className="text-emerald-600 dark:text-emerald-400">Goals</span>
                      </th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground w-[280px]">
                        <span className="text-blue-600 dark:text-blue-400">Tools (Algorithms)</span>
                      </th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">
                        <span className="text-amber-600 dark:text-amber-400">Resources (Implementation)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {catRows.map((row) => (
                      <tr key={row.grantNumber} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 align-top">
                          <a
                            href={`https://reporter.nih.gov/project-details/${row.grantNumber.replace(/^\d(?=[A-Z])/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-primary hover:underline leading-snug block"
                          >
                            {row.project.length > 50 ? row.project.slice(0, 47) + "..." : row.project}
                          </a>
                          <span className="text-[10px] text-muted-foreground font-mono">{row.grantNumber}</span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <TagList items={row.goals} variant="default" />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <TagList items={row.tools} variant="secondary" />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <TagList items={row.resources} variant="outline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Heatmap tab
type DimensionKey = "study_species" | "use_approaches" | "use_sensors" | "produce_data_modality" |
  "use_analysis_method" | "develope_software_type" | "develope_hardware_type" | "keywords";

const DIMENSION_OPTIONS: { key: DimensionKey; label: string }[] = [
  { key: "study_species", label: "Species" },
  { key: "use_approaches", label: "Approaches" },
  { key: "use_sensors", label: "Sensors" },
  { key: "produce_data_modality", label: "Data Modalities" },
  { key: "use_analysis_method", label: "Analysis Methods" },
  { key: "develope_software_type", label: "Software" },
  { key: "develope_hardware_type", label: "Hardware" },
  { key: "keywords", label: "Keywords" },
];

function HeatmapMatrix({ data, dimension }: { data: ProjectData[]; dimension: DimensionKey }) {
  const uniqueValues = useMemo(() => {
    const set = new Set<string>();
    for (const p of data) for (const v of (p[dimension] as string[])) set.add(v);
    return Array.from(set).sort();
  }, [data, dimension]);

  if (uniqueValues.length === 0) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground">No data for this dimension yet.</div>;
  }

  return (
    <div className="overflow-auto border border-border rounded-xl">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-muted px-3 py-2 text-left text-xs font-semibold text-muted-foreground min-w-[240px] border-b border-r border-border">Project</th>
            {uniqueValues.map((v) => (
              <th key={v} className="px-1 py-2 border-b border-border min-w-[48px]">
                <div className="text-[10px] font-medium text-muted-foreground" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", maxHeight: 130 }}>{v}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((project) => {
            const values = new Set(project[dimension] as string[]);
            return (
              <tr key={project.grant_number} className="hover:bg-muted/30 transition-colors">
                <td className="sticky left-0 z-10 bg-background px-3 py-1.5 text-xs text-foreground border-r border-border truncate max-w-[240px]" title={project.grant_title}>
                  {project.grant_title.length > 40 ? project.grant_title.slice(0, 37) + "..." : project.grant_title}
                </td>
                {uniqueValues.map((v) => {
                  const active = values.has(v);
                  return (
                    <td key={v} className="p-0">
                      <div className={`w-full h-8 flex items-center justify-center ${active ? "bg-primary/70 hover:bg-primary/90" : "bg-transparent hover:bg-muted/20"}`}>
                        {active && <div className="w-3 h-3 rounded-sm bg-primary-foreground/80" />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function KnowledgeGraph() {
  const { data = [], isLoading } = useExplorerData();
  const [heatmapDim, setHeatmapDim] = useState<DimensionKey>("study_species");

  const marrRows = useMemo(() => buildMarrRows(data), [data]);
  const categories = useMemo(() => new Set(marrRows.map((r) => r.category)), [marrRows]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading explorer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Explorer</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            Explore BBQS projects organized by computational goals, algorithmic tools, and implementation resources.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{data.length} projects</Badge>
            <Badge variant="outline">{categories.size} categories</Badge>
          </div>
        </div>

        <Tabs defaultValue="marr" className="space-y-4">
          <TabsList>
            <TabsTrigger value="marr">Goals · Tools · Resources</TabsTrigger>
            <TabsTrigger value="heatmap">Adjacency Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="marr">
            <MarrTable rows={marrRows} />
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-4">
            <div className="flex flex-wrap gap-1">
              {DIMENSION_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setHeatmapDim(opt.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                    heatmapDim === opt.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <HeatmapMatrix data={data} dimension={heatmapDim} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
