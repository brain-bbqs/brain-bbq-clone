"use client";

import { useState, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import type { Resource } from "@/data/resources";
import { useResources } from "@/hooks/useResources";
import { ExternalLink, Loader2 } from "lucide-react";
import "@/styles/ag-grid-theme.css";

const NameLink = ({ value, data }: { value: string; data: Resource }) => (
  <a href={data.url} target="_blank" rel="noopener noreferrer"
    onClick={(e) => { e.stopPropagation(); window.open(data.url, '_blank'); }}
    className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1.5 font-semibold transition-colors cursor-pointer">
    {value}<ExternalLink className="h-3.5 w-3.5 opacity-60" />
  </a>
);

export default function Protocols() {
  const [quickFilterText, setQuickFilterText] = useState("");
  const { data: protocolResources = [], isLoading } = useResources("Protocols");
  const [hoveredRow, setHoveredRow] = useState<Resource | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const defaultColDef = useMemo<ColDef>(() => ({ sortable: true, resizable: true, unSortIcon: true }), []);

  const columnDefs = useMemo<ColDef<Resource>[]>(() => [
    { field: "name", headerName: "Name", flex: 1, minWidth: 250, cellRenderer: NameLink },
    { field: "species", headerName: "Species", width: 300 },
    { field: "implementation", headerName: "Format", width: 100 },
  ], []);

  const onCellMouseOver = useCallback((event: any) => {
    if (event.data && event.event) {
      setHoveredRow(event.data);
      setHoverPosition({ x: event.event.clientX, y: event.event.clientY });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Protocols</h1>
          <p className="text-muted-foreground mb-4">
            Methodological protocols for behavioral neuroscience research.
          </p>
          <div className="flex items-center gap-4 mb-4">
            <input type="text" placeholder="Quick filter..." value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="px-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full max-w-md" />
            <span className="text-sm text-muted-foreground">{protocolResources.length} protocols</span>
          </div>
        </div>
        <div className="ag-theme-alpine rounded-lg border border-border overflow-hidden" style={{ height: "calc(100vh - 240px)" }}>
          <AgGridReact<Resource>
            rowData={protocolResources} columnDefs={columnDefs} defaultColDef={defaultColDef}
            quickFilterText={quickFilterText} animateRows={true} pagination={true} paginationPageSize={25}
            suppressCellFocus={true} enableCellTextSelection={true} rowHeight={36} headerHeight={40}
            onCellMouseOver={onCellMouseOver} onCellMouseOut={() => setHoveredRow(null)}
            loading={isLoading}
            loadingOverlayComponent={() => (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading protocols...
              </div>
            )}
          />
        </div>
        {hoveredRow && (
          <div className="fixed z-[9999] bg-card border border-border rounded-lg shadow-xl p-4 max-w-md pointer-events-none"
            style={{ left: Math.min(hoverPosition.x + 15, window.innerWidth - 420), top: Math.min(hoverPosition.y + 10, window.innerHeight - 300) }}>
            <h3 className="font-semibold text-foreground mb-3">{hoveredRow.name}</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Description: </span><span className="text-foreground">{hoveredRow.algorithm}</span></div>
              <div><span className="text-muted-foreground">Species: </span><span className="text-foreground">{hoveredRow.species}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
