import { useMemo, useState, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "@/styles/ag-grid-theme.css";
import { MARR_PROJECTS, type MarrProject } from "@/data/marr-projects";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

const FeatureBadges = ({ value }: { value: string[] }) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1 py-1">
      {value.map((f) => (
        <Badge key={f} variant="outline" className="text-[10px] px-1.5 py-0 whitespace-nowrap">
          {f}
        </Badge>
      ))}
    </div>
  );
};

const SpeciesBadge = ({ value, data }: { value: string; data: MarrProject }) => (
  <div className="flex items-center gap-2">
    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
    <span>{value}</span>
  </div>
);

export function ProjectIndexGrid() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    wrapText: true,
    autoHeight: true,
    cellStyle: { lineHeight: "1.5", padding: "6px 10px" },
  }), []);

  const columnDefs = useMemo<ColDef<MarrProject>[]>(() => [
    {
      field: "shortName",
      headerName: "Project",
      minWidth: 200,
      flex: 1,
      cellRenderer: (params: ICellRendererParams<MarrProject>) => {
        const isExpanded = expandedId === params.data?.id;
        return (
          <button
            className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors text-left"
            onClick={() => setExpandedId(isExpanded ? null : params.data?.id ?? null)}
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            {params.value}
          </button>
        );
      },
    },
    {
      field: "pi",
      headerName: "PI",
      width: 160,
    },
    {
      field: "species",
      headerName: "Species",
      width: 130,
      cellRenderer: SpeciesBadge,
    },
    {
      field: "computational",
      headerName: "Computational",
      minWidth: 180,
      flex: 1,
      cellRenderer: FeatureBadges,
    },
    {
      field: "algorithmic",
      headerName: "Algorithmic",
      minWidth: 180,
      flex: 1,
      cellRenderer: FeatureBadges,
    },
    {
      field: "implementation",
      headerName: "Implementation",
      minWidth: 180,
      flex: 1,
      cellRenderer: FeatureBadges,
    },
  ], [expandedId]);

  const isFullWidthRow = useCallback((params: any) => {
    return params.rowNode.data?._isDetail === true;
  }, []);

  // Build row data with detail rows injected
  const rowData = useMemo(() => {
    const rows: any[] = [];
    MARR_PROJECTS.forEach((p) => {
      rows.push(p);
      if (expandedId === p.id) {
        rows.push({ ...p, _isDetail: true, id: `${p.id}_detail` });
      }
    });
    return rows;
  }, [expandedId]);

  const fullWidthCellRenderer = useCallback((params: any) => {
    const project = params.data as MarrProject;
    return (
      <div className="p-4 bg-muted/30 border-t border-border text-sm space-y-3">
        <h4 className="font-semibold text-foreground">
          {project.shortName} — Full Data Structure
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-blue-400 font-medium mb-1">Computational</div>
            <ul className="space-y-0.5">
              {project.computational.map((f) => (
                <li key={f} className="text-foreground/80 text-xs">• {f}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-green-400 font-medium mb-1">Algorithmic</div>
            <ul className="space-y-0.5">
              {project.algorithmic.map((f) => (
                <li key={f} className="text-foreground/80 text-xs">• {f}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-orange-400 font-medium mb-1">Implementation</div>
            <ul className="space-y-0.5">
              {project.implementation.map((f) => (
                <li key={f} className="text-foreground/80 text-xs">• {f}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Grant: <span className="font-mono text-foreground/70">{project.id}</span> · PI: {project.pi} · Species: {project.species}
        </div>
      </div>
    );
  }, []);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Project Index</h2>
        <span className="text-xs text-muted-foreground">Click a project name to view full data structure</span>
      </div>
      <div
        className="ag-theme-alpine"
        style={{ height: Math.min(700, rowData.length * 48 + 56) }}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          suppressCellFocus={true}
          enableCellTextSelection={true}
          getRowId={(params) => params.data._isDetail ? params.data.id : params.data.id}
          isFullWidthRow={isFullWidthRow}
          fullWidthCellRenderer={fullWidthCellRenderer}
        />
      </div>
    </div>
  );
}
