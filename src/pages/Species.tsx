"use client";

import { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { MARR_PROJECTS } from "@/data/marr-projects";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import "@/styles/ag-grid-theme.css";

const LATIN_NAMES: Record<string, string> = {
  "Cichlid": "Cichlidae",
  "Mouse": "Mus musculus",
  "Gerbil": "Meriones unguiculatus",
  "Cowbird": "Molothrus ater",
  "Rats/Mice": "Rattus / Mus",
  "Human": "Homo sapiens",
  "Sheep": "Ovis aries",
  "Zebrafish/Fly": "Danio rerio / Drosophila",
  "Acoel Worm": "Acoela",
  "Ferret": "Mustela putorius furo",
  "Capuchin Monkey": "Cebus capucinus",
  "Marmoset": "Callithrix jacchus",
};

interface ProjectInfo {
  name: string;
  grantId: string;
}

interface SpeciesRow {
  species: string;
  latinName: string;
  projects: ProjectInfo[];
  behaviors: string[];
  color: string;
  projectCount: number;
}

const getProjectTitle = (shortName: string) => {
  const parts = shortName.split(" – ");
  return parts.length > 1 ? parts.slice(1).join(" – ").trim() : shortName;
};

// Group projects by species
const rows: SpeciesRow[] = (() => {
  const grouped = new Map<string, { projects: ProjectInfo[]; behaviors: Set<string>; color: string }>();

  for (const p of MARR_PROJECTS) {
    const existing = grouped.get(p.species);
    const project: ProjectInfo = { name: getProjectTitle(p.shortName), grantId: p.id };
    if (existing) {
      existing.projects.push(project);
      p.computational.forEach((b) => existing.behaviors.add(b));
    } else {
      grouped.set(p.species, {
        projects: [project],
        behaviors: new Set(p.computational),
        color: p.color,
      });
    }
  }

  return Array.from(grouped.entries()).map(([species, data]) => ({
    species,
    latinName: LATIN_NAMES[species] || "",
    projects: data.projects,
    behaviors: Array.from(data.behaviors),
    color: data.color,
    projectCount: data.projects.length,
  }));
})();

const SpeciesBadge = ({ value, data }: { value: string; data: SpeciesRow }) => (
  <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
    {value}
    <Badge variant="secondary" className="text-[10px] ml-1">{data.projectCount}</Badge>
  </span>
);

const ProjectLinks = ({ data }: { value: any; data: SpeciesRow }) => (
  <div className="flex flex-col gap-1 py-1">
    {data.projects.map((p) => {
      const cleanId = p.grantId.replace(/^\d(?=[A-Z])/, "");
      const url = `https://reporter.nih.gov/project-details/${cleanId}`;
      return (
        <a
          key={p.grantId}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 font-medium transition-colors cursor-pointer text-sm"
        >
          {p.name}
          <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />
        </a>
      );
    })}
  </div>
);

const BehaviorBadges = ({ data }: { value: any; data: SpeciesRow }) => {
  if (!data.behaviors.length) return null;
  return (
    <div className="flex flex-wrap gap-1 py-1">
      {data.behaviors.map((item) => (
        <Badge key={item} variant="secondary" className="text-[10px] font-normal whitespace-nowrap">
          {item}
        </Badge>
      ))}
    </div>
  );
};

export default function Species() {
  const [quickFilterText, setQuickFilterText] = useState("");

  const defaultColDef = useMemo<ColDef>(
    () => ({ sortable: true, resizable: true, unSortIcon: true, wrapText: true, autoHeight: true }),
    []
  );

  const columnDefs = useMemo<ColDef<SpeciesRow>[]>(
    () => [
      { field: "species", headerName: "Species", width: 180, cellRenderer: SpeciesBadge },
      { field: "latinName", headerName: "Taxonomy", width: 200, cellStyle: { fontStyle: "italic" } },
      { field: "projects", headerName: "Projects", width: 300, cellRenderer: ProjectLinks,
        getQuickFilterText: (params) => params.data?.projects.map((p) => p.name).join(" ") || "" },
      { field: "behaviors", headerName: "Behaviors", flex: 1, minWidth: 300, cellRenderer: BehaviorBadges,
        getQuickFilterText: (params) => params.data?.behaviors.join(" ") || "" },
    ],
    []
  );

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
              {rows.length} species · {MARR_PROJECTS.length} projects
            </span>
          </div>
        </div>

        <div
          className="ag-theme-alpine rounded-lg border border-border overflow-hidden"
          style={{ width: "100%" }}
        >
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
          />
        </div>
      </div>
    </div>
  );
}
