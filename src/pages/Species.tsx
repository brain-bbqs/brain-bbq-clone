"use client";

import { useState, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { MARR_PROJECTS } from "@/data/marr-projects";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import "@/styles/ag-grid-theme.css";
import { SpeciesHeatmap } from "@/components/diagrams/SpeciesHeatmap";

interface SpeciesRow {
  species: string;
  project: string;
  pi: string;
  grantId: string;
  computational: string;
  algorithmic: string;
  implementation: string;
  color: string;
}

const rows: SpeciesRow[] = MARR_PROJECTS.map((p) => ({
  species: p.species,
  project: p.shortName,
  pi: p.pi,
  grantId: p.id,
  computational: p.computational.join("; "),
  algorithmic: p.algorithmic.join("; "),
  implementation: p.implementation.join("; "),
  color: p.color,
}));

const GrantLink = ({ value }: { value: string }) => {
  const url = value.startsWith("R")
    ? `https://reporter.nih.gov/project-details/${value}`
    : `https://reporter.nih.gov/project-details/${value}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 font-mono text-xs transition-colors"
    >
      {value}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
};

const BadgeList = ({ value }: { value: string }) => {
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

const SpeciesBadge = ({ value, data }: { value: string; data: SpeciesRow }) => (
  <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
    {value}
  </span>
);

export default function Species() {
  const [quickFilterText, setQuickFilterText] = useState("");

  const defaultColDef = useMemo<ColDef>(
    () => ({ sortable: true, resizable: true, unSortIcon: true, wrapText: true, autoHeight: true }),
    []
  );

  const columnDefs = useMemo<ColDef<SpeciesRow>[]>(
    () => [
      { field: "species", headerName: "Species", width: 160, cellRenderer: SpeciesBadge },
      { field: "project", headerName: "Project", width: 220 },
      { field: "pi", headerName: "PI", width: 160 },
      { field: "grantId", headerName: "Grant", width: 170, cellRenderer: GrantLink },
      { field: "computational", headerName: "Computational Goals", flex: 1, minWidth: 260, cellRenderer: BadgeList },
      { field: "algorithmic", headerName: "Methods", flex: 1, minWidth: 240, cellRenderer: BadgeList },
      { field: "implementation", headerName: "Tools & Resources", flex: 1, minWidth: 220, cellRenderer: BadgeList },
    ],
    []
  );

  // Summary stats
  const speciesCount = useMemo(() => new Set(rows.map((r) => r.species)).size, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Species</h1>
          <p className="text-muted-foreground mb-4">
            Overview of species studied across BBQS consortium projects, mapped to Marr's three levels of analysis.
          </p>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Filter by species, PI, method, tool..."
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
          className="ag-theme-alpine rounded-lg border border-border overflow-hidden mb-12"
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

        {/* Cross-species heatmap */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Cross-Species Feature Sharing</h2>
          <p className="text-muted-foreground mb-6">
            Heatmap showing shared computational goals, methods, and tools across species studied in BBQS projects.
          </p>
          <SpeciesHeatmap />
        </div>
      </div>
    </div>
  );
}
