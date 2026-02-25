"use client";

import { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { MARR_PROJECTS } from "@/data/marr-projects";
import { Badge } from "@/components/ui/badge";
import "@/styles/ag-grid-theme.css";

interface SpeciesRow {
  species: string;
  project: string;
  pis: string;
  behavior: string;
  color: string;
}

// Group PIs per project (in case multiple entries share the same project)
const rows: SpeciesRow[] = MARR_PROJECTS.map((p) => ({
  species: p.species,
  project: p.shortName,
  pis: p.pi,
  behavior: p.computational.join("; "),
  color: p.color,
}));

const SpeciesBadge = ({ value, data }: { value: string; data: SpeciesRow }) => (
  <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
    {value}
  </span>
);

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
      { field: "species", headerName: "Species", width: 160, cellRenderer: SpeciesBadge },
      { field: "project", headerName: "Project", width: 240 },
      { field: "pis", headerName: "PI(s)", width: 180 },
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
              placeholder="Filter by species, project, PI, behavior..."
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
