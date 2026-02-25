"use client";

import { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2 } from "lucide-react";
import "@/styles/ag-grid-theme.css";

interface SpeciesRow {
  species: string;
  commonName: string;
  taxonomyClass: string;
  project: string;
  grantNumber: string;
  behavior: string[];
  color: string;
}

const SPECIES_COLORS: Record<string, string> = {
  "mouse": "#81c784", "mice": "#81c784", "mus musculus": "#81c784",
  "rat": "#aed581", "rats": "#aed581",
  "human": "#ef9a9a", "homo sapiens": "#ef9a9a",
  "marmoset": "#ffe082", "callithrix jacchus": "#ffe082",
  "gerbil": "#ffb74d", "meriones unguiculatus": "#ffb74d",
  "cichlid": "#4fc3f7", "cichlidae": "#4fc3f7",
  "cowbird": "#ce93d8", "molothrus ater": "#ce93d8",
  "ferret": "#f48fb1", "mustela putorius furo": "#f48fb1",
  "sheep": "#bcaaa4", "ovis aries": "#bcaaa4",
  "zebrafish": "#80deea", "danio rerio": "#80deea",
  "capuchin": "#b39ddb", "cebus capucinus": "#b39ddb",
  "worm": "#90a4ae", "acoel": "#90a4ae", "acoela": "#90a4ae",
  "fly": "#ffcc80", "drosophila": "#ffcc80",
};

function getSpeciesColor(species: string): string {
  const lower = species.toLowerCase();
  for (const [key, color] of Object.entries(SPECIES_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#78909c";
}

function useSpeciesData() {
  return useQuery<SpeciesRow[]>({
    queryKey: ["species-grid"],
    queryFn: async () => {
      // Fetch species table, grants, and projects in parallel
      const [speciesRes, grantsRes, projectsRes] = await Promise.all([
        (supabase.from("species" as any) as any).select("*"),
        supabase.from("grants").select("id, grant_number, title").order("grant_number"),
        (supabase.from("projects" as any) as any).select("*"),
      ]);
      if (grantsRes.error) throw grantsRes.error;

      const speciesLookup = new Map<string, any>();
      if (speciesRes.data) {
        for (const s of speciesRes.data as any[]) {
          speciesLookup.set(s.name.toLowerCase(), s);
        }
      }

      const grants = grantsRes.data || [];
      const projects = (projectsRes.data || []) as any[];
      const rows: SpeciesRow[] = [];

      for (const grant of grants) {
        const meta = projects.find((m: any) => m.grant_number === grant.grant_number);
        const speciesList = (meta?.study_species || []) as string[];
        if (speciesList.length === 0) continue;

        const behavior: string[] = [];
        if (meta?.use_approaches) behavior.push(...(meta.use_approaches as string[]));
        const dynMeta = meta?.metadata || {};
        if (dynMeta.behaviors) behavior.push(...(dynMeta.behaviors as string[]));
        if (dynMeta.ethological_goals) behavior.push(...(dynMeta.ethological_goals as string[]));

        for (const sp of speciesList) {
          const speciesInfo = speciesLookup.get(sp.toLowerCase());
          rows.push({
            species: sp,
            commonName: speciesInfo?.common_name || "",
            taxonomyClass: speciesInfo?.taxonomy_class || "",
            project: grant.title,
            grantNumber: grant.grant_number,
            behavior,
            color: getSpeciesColor(sp),
          });
        }
      }

      return rows;
    },
    staleTime: 5 * 60 * 1000,
  });
}

const SpeciesBadge = ({ value, data }: { value: string; data: SpeciesRow }) => (
  <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
    {value}
  </span>
);

const ProjectLink = ({ value, data }: { value: string; data: SpeciesRow }) => {
  const cleanId = data.grantNumber.replace(/^\d(?=[A-Z])/, "");
  const url = `https://reporter.nih.gov/project-details/${cleanId}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer text-sm">
      {value.length > 60 ? value.slice(0, 57) + "..." : value}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
};

const BehaviorBadges = ({ value }: { value: string[] }) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground text-xs italic">Not set</span>;
  return (
    <div className="flex flex-wrap gap-1 py-1">
      {value.map((item) => (
        <Badge key={item} variant="secondary" className="text-[10px] font-normal whitespace-nowrap">
          {item}
        </Badge>
      ))}
    </div>
  );
};

export default function Species() {
  const [quickFilterText, setQuickFilterText] = useState("");
  const { data: rows = [], isLoading } = useSpeciesData();

  const defaultColDef = useMemo<ColDef>(
    () => ({ sortable: true, resizable: true, unSortIcon: true, wrapText: true, autoHeight: true }),
    []
  );

  const columnDefs = useMemo<ColDef<SpeciesRow>[]>(
    () => [
      { field: "species", headerName: "Species", width: 160, cellRenderer: SpeciesBadge },
      { field: "commonName", headerName: "Common Name", width: 130 },
      { field: "taxonomyClass", headerName: "Class", width: 110 },
      { field: "project", headerName: "Project", width: 300, cellRenderer: ProjectLink },
      { field: "behavior", headerName: "Behavior / Approaches", flex: 1, minWidth: 300, cellRenderer: (params: any) => <BehaviorBadges value={params.value} /> },
    ],
    []
  );

  const speciesCount = useMemo(() => new Set(rows.map((r) => r.species)).size, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Species</h1>
          <p className="text-muted-foreground mb-4">
            Overview of species studied across BBQS consortium projects and the behaviors being investigated.
          </p>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Filter by species, project, behavior..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="px-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full max-w-md"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {speciesCount} species · {rows.length} entries
            </span>
          </div>
        </div>

        <div className="ag-theme-alpine rounded-lg border border-border overflow-hidden" style={{ width: "100%" }}>
          <AgGridReact<SpeciesRow>
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
            animateRows={true}
            domLayout="autoHeight"
            suppressCellFocus={true}
            enableCellTextSelection={true}
            headerHeight={40}
            loading={isLoading}
            loadingOverlayComponent={() => (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading species data...
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
