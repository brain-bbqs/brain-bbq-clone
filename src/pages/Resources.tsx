"use client";

import { useState, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, CellMouseOverEvent, CellMouseOutEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { resources, Resource } from "@/data/resources";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, Clock, Circle } from "lucide-react";
import "@/styles/ag-grid-theme.css";

const CategoryBadge = ({ value }: { value: string }) => {
  const colorMap: Record<string, string> = {
    "General Tools": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Models": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Datasets": "bg-green-500/20 text-green-400 border-green-500/30",
    "Benchmarks": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Papers & Protocols": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  };
  return (
    <Badge variant="outline" className={`${colorMap[value] || ""} text-xs`}>
      {value}
    </Badge>
  );
};

const NameLink = ({ value, data }: { value: string; data: Resource }) => {
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1.5 font-semibold transition-colors"
    >
      {value}
      <ExternalLink className="h-3.5 w-3.5 opacity-60" />
    </a>
  );
};

const NeuroMcpStatusBadge = ({ value }: { value: Resource["neuroMcpStatus"] }) => {
  const statusConfig = {
    trained: {
      label: "Trained",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
      icon: Check,
    },
    pending: {
      label: "Pending",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: Clock,
    },
    "not-started": {
      label: "Not Started",
      className: "bg-muted/50 text-muted-foreground border-border",
      icon: Circle,
    },
  };

  const config = statusConfig[value] || statusConfig["not-started"];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} text-xs gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const Resources = () => {
  const [quickFilterText, setQuickFilterText] = useState("");
  const [hoveredRow, setHoveredRow] = useState<Resource | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  }), []);

  const columnDefs = useMemo<ColDef<Resource>[]>(() => [
    {
      field: "category",
      headerName: "Category",
      width: 140,
      flex: 0,
      cellRenderer: CategoryBadge,
    },
    {
      field: "name",
      headerName: "Name",
      flex: 2,
      minWidth: 250,
      cellRenderer: NameLink,
    },
    {
      field: "implementation",
      headerName: "Software",
      width: 160,
      flex: 0,
    },
    {
      field: "neuroMcpStatus",
      headerName: "NeuroMCP",
      width: 130,
      flex: 0,
      cellRenderer: NeuroMcpStatusBadge,
    },
  ], []);

  const onCellMouseOver = useCallback((event: CellMouseOverEvent) => {
    if (event.data && event.event) {
      const mouseEvent = event.event as MouseEvent;
      setHoveredRow(event.data);
      setHoverPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY });
    }
  }, []);

  const onCellMouseOut = useCallback((event: CellMouseOutEvent) => {
    setHoveredRow(null);
  }, []);

  const onGridReady = useCallback(() => {
    // Grid is ready
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tools</h1>
          <p className="text-muted-foreground mb-4">
            Browse tools, models, datasets, and benchmarks for behavioral neuroscience research.
          </p>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Quick filter..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="px-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full max-w-md"
            />
            <span className="text-sm text-muted-foreground">
              {resources.length} tools
            </span>
          </div>
        </div>

        <div 
          className="ag-theme-alpine rounded-lg border border-border overflow-hidden" 
          style={{ height: "calc(100vh - 240px)" }}
        >
          <AgGridReact<Resource>
            rowData={resources}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
            onGridReady={onGridReady}
            onCellMouseOver={onCellMouseOver}
            onCellMouseOut={onCellMouseOut}
            animateRows={true}
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={[10, 25, 50, 100]}
            suppressCellFocus={true}
            enableCellTextSelection={true}
            rowHeight={36}
            headerHeight={40}
          />
        </div>

        {/* Hover Detail Card */}
        {hoveredRow && (
          <div
            className="fixed z-[9999] bg-card border border-border rounded-lg shadow-xl p-4 max-w-md pointer-events-none"
            style={{
              left: Math.min(hoverPosition.x + 15, window.innerWidth - 420),
              top: Math.min(hoverPosition.y + 10, window.innerHeight - 300),
            }}
          >
            <h3 className="font-semibold text-foreground mb-3">{hoveredRow.name}</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Algorithm: </span>
                <span className="text-foreground">{hoveredRow.algorithm}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Computational: </span>
                <span className="text-foreground">{hoveredRow.computational}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Species: </span>
                <span className="text-foreground">{hoveredRow.species}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
