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

// Latin name mapping for species
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

interface SpeciesRow {
  species: string;
  latinName: string;
  project: string;
  grantId: string;
  behavior: string;
  color: string;
}

// Strip PI name prefix from shortName (e.g. "Dyer – Cichlid Arena" → "Cichlid Arena")
const getProjectTitle = (shortName: string) => {
  const parts = shortName.split(" – ");
  return parts.length > 1 ? parts.slice(1).join(" – ").trim() : shortName;
};

const rows: SpeciesRow[] = MARR_PROJECTS.map((p) => ({
  species: p.species,
  latinName: LATIN_NAMES[p.species] || "",
  project: getProjectTitle(p.shortName),
  grantId: p.id,
  behavior: p.computational.join("; "),
  color: p.color,
}));

const SpeciesBadge = ({ value, data }: { value: string; data: SpeciesRow }) => (
  <div className="flex flex-col py-1">
    <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
      {value}
    </span>
    {data.latinName && (
      <span className="text-xs text-muted-foreground italic ml-4">{data.latinName}</span>
    )}
  </div>
);

const ProjectLink = ({ value, data }: { value: string; data: SpeciesRow }) => {
  const grantId = data.grantId;
  // Strip common prefixes like "1" or "5" from grant numbers for NIH Reporter links
  const cleanId = grantId.replace(/^\d(?=[A-Z])/, "");
  const url = `https://reporter.nih.gov/project-details/${cleanId}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer text-sm"
    >
      {value}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
};

const BehaviorBadges = ({ value }: { value: string }) => {
  if (!value) return null;
  const items = value.split("; ");
  return (
    <div className="flex flex-wrap gap-1 py-1">
      {items.map((item) => (
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
      { field: "project", headerName: "Project", width: 260, cellRenderer: ProjectLink },
      { field: "behavior", headerName: "Behavior", flex: 1, minWidth: 300, cellRenderer: BehaviorBadges },
    ],
    []
  );

  const speciesCount = useMemo(() => new Set(rows.map((r) => r.species)).size, []);

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
              {speciesCount} species · {rows.length} projects
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
