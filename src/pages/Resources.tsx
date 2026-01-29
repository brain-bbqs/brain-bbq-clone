"use client";

import { useState, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { resources, Resource } from "@/data/resources";
import { Badge } from "@/components/ui/badge";

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

const Resources = () => {
  const [quickFilterText, setQuickFilterText] = useState("");

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    flex: 1,
    minWidth: 120,
    wrapText: true,
    autoHeight: true,
    cellStyle: { lineHeight: "1.6", padding: "8px" },
  }), []);

  const columnDefs = useMemo<ColDef<Resource>[]>(() => [
    {
      field: "category",
      headerName: "Category",
      width: 150,
      flex: 0,
      cellRenderer: CategoryBadge,
    },
    {
      field: "name",
      headerName: "Name",
      width: 220,
      flex: 0,
      cellStyle: { fontWeight: 600 },
    },
    {
      field: "algorithm",
      headerName: "Algorithm",
      minWidth: 200,
    },
    {
      field: "computational",
      headerName: "Computational",
      minWidth: 200,
    },
    {
      field: "neuralNetworkArchitecture",
      headerName: "NN Architecture",
      minWidth: 180,
    },
    {
      field: "mlPipeline",
      headerName: "ML Pipeline",
      minWidth: 250,
    },
    {
      field: "implementation",
      headerName: "Implementation",
      minWidth: 180,
    },
    {
      field: "species",
      headerName: "Species/Taxa",
      minWidth: 180,
    },
  ], []);

  const onGridReady = useCallback(() => {
    // Grid is ready
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Resources</h1>
          <p className="text-muted-foreground mb-4">
            Browse tools, models, datasets, benchmarks, and papers for behavioral neuroscience research.
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
              {resources.length} resources
            </span>
          </div>
        </div>

        <div 
          className="ag-theme-quartz-dark rounded-lg border border-border overflow-hidden" 
          style={{ height: "calc(100vh - 220px)" }}
        >
          <AgGridReact<Resource>
            rowData={resources}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
            onGridReady={onGridReady}
            animateRows={true}
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={[10, 25, 50, 100]}
            suppressCellFocus={true}
            enableCellTextSelection={true}
          />
        </div>
      </div>
    </div>
  );
};

export default Resources;
