import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectMeta {
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
}

function useExplorerData() {
  return useQuery<ProjectMeta[]>({
    queryKey: ["explorer-heatmap"],
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
        };
      }).filter((p) => {
        // Only include projects with some metadata
        return p.study_species.length > 0 || p.use_approaches.length > 0 || 
               p.develope_software_type.length > 0 || p.develope_hardware_type.length > 0;
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

type DimensionKey = "study_species" | "use_approaches" | "use_sensors" | "produce_data_modality" | 
  "produce_data_type" | "use_analysis_types" | "use_analysis_method" | 
  "develope_software_type" | "develope_hardware_type" | "keywords";

const DIMENSION_TABS: { key: DimensionKey; label: string }[] = [
  { key: "study_species", label: "Species" },
  { key: "use_approaches", label: "Approaches" },
  { key: "use_sensors", label: "Sensors" },
  { key: "produce_data_modality", label: "Data Modalities" },
  { key: "produce_data_type", label: "Data Types" },
  { key: "use_analysis_types", label: "Analysis Types" },
  { key: "use_analysis_method", label: "Analysis Methods" },
  { key: "develope_software_type", label: "Software" },
  { key: "develope_hardware_type", label: "Hardware" },
  { key: "keywords", label: "Keywords" },
];

function HeatmapMatrix({ data, dimension }: { data: ProjectMeta[]; dimension: DimensionKey }) {
  // Collect unique values for selected dimension
  const uniqueValues = useMemo(() => {
    const set = new Set<string>();
    for (const p of data) {
      for (const v of (p[dimension] as string[])) {
        set.add(v);
      }
    }
    return Array.from(set).sort();
  }, [data, dimension]);

  // Short project labels
  const projectLabels = useMemo(() => 
    data.map((p) => ({
      label: p.grant_title.length > 40 ? p.grant_title.slice(0, 37) + "..." : p.grant_title,
      full: p.grant_title,
      grant: p.grant_number,
    })), [data]);

  if (uniqueValues.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        No data available for this dimension yet.
      </div>
    );
  }

  return (
    <div className="overflow-auto border border-border rounded-xl">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-muted px-3 py-2 text-left text-xs font-semibold text-muted-foreground min-w-[240px] border-b border-r border-border">
              Project
            </th>
            {uniqueValues.map((v) => (
              <th key={v} className="px-1 py-2 border-b border-border min-w-[48px]">
                <div className="text-[10px] font-medium text-muted-foreground writing-vertical whitespace-nowrap"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", maxHeight: 130 }}>
                  {v}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((project, i) => {
            const values = new Set(project[dimension] as string[]);
            return (
              <tr key={project.grant_number} className="hover:bg-muted/30 transition-colors">
                <td className="sticky left-0 z-10 bg-background px-3 py-1.5 text-xs text-foreground border-r border-border truncate max-w-[240px]"
                  title={projectLabels[i].full}>
                  {projectLabels[i].label}
                </td>
                {uniqueValues.map((v) => {
                  const active = values.has(v);
                  return (
                    <td key={v} className="p-0 border-border">
                      <div className={`w-full h-8 flex items-center justify-center transition-colors ${
                        active 
                          ? "bg-primary/70 hover:bg-primary/90" 
                          : "bg-transparent hover:bg-muted/20"
                      }`}>
                        {active && (
                          <div className="w-3 h-3 rounded-sm bg-primary-foreground/80" />
                        )}
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
  const [dimension, setDimension] = useState<DimensionKey>("study_species");

  const stats = useMemo(() => {
    const allValues = new Set<string>();
    for (const p of data) {
      for (const v of (p[dimension] as string[])) allValues.add(v);
    }
    return { projects: data.length, values: allValues.size };
  }, [data, dimension]);

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
            Adjacency matrix showing which projects use specific species, tools, methods, and resources across the BBQS consortium.
          </p>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{stats.projects} projects</Badge>
            <Badge variant="outline">{stats.values} {DIMENSION_TABS.find(t => t.key === dimension)?.label.toLowerCase()}</Badge>
          </div>
        </div>

        <Tabs value={dimension} onValueChange={(v) => setDimension(v as DimensionKey)} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            {DIMENSION_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {DIMENSION_TABS.map((tab) => (
            <TabsContent key={tab.key} value={tab.key}>
              <HeatmapMatrix data={data} dimension={tab.key} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
