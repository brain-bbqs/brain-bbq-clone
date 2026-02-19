import { useMemo, useState, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "@/styles/ag-grid-theme.css";
import { MARR_PROJECTS, type MarrProject } from "@/data/marr-projects";
import { Badge } from "@/components/ui/badge";
import { Code, List, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function ProjectDetailModal({ project, open, onClose }: { project: MarrProject; open: boolean; onClose: () => void }) {
  const [view, setView] = useState<"list" | "json">("list");
  const [copied, setCopied] = useState(false);

  const jsonData = useMemo(() => JSON.stringify({
    id: project.id,
    shortName: project.shortName,
    pi: project.pi,
    species: project.species,
    computational: project.computational,
    algorithmic: project.algorithmic,
    implementation: project.implementation,
  }, null, 2), [project]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>{project.shortName}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView("list")}
                className={cn(
                  "p-1.5 rounded text-xs transition-colors",
                  view === "list" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setView("json")}
                className={cn(
                  "p-1.5 rounded text-xs transition-colors",
                  view === "json" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                title="JSON view"
              >
                <Code className="h-3.5 w-3.5" />
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-muted-foreground mb-3">
          Grant: <span className="font-mono text-foreground/70">{project.id}</span> · PI: {project.pi} · Species: {project.species}
        </div>

        {view === "list" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider font-medium mb-1.5" style={{ color: "#64b5f6" }}>Goals</div>
              <ul className="space-y-1">
                {project.computational.map((f) => (
                  <li key={f} className="text-foreground/80 text-sm">• {f}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-medium mb-1.5" style={{ color: "#81c784" }}>Methods</div>
              <ul className="space-y-1">
                {project.algorithmic.map((f) => (
                  <li key={f} className="text-foreground/80 text-sm">• {f}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-medium mb-1.5" style={{ color: "#a78bfa" }}>Resources</div>
              <ul className="space-y-1">
                {project.implementation.map((f) => (
                  <li key={f} className="text-foreground/80 text-sm">• {f}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
              title="Copy JSON"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <pre className="bg-muted border border-border rounded-lg p-4 text-xs font-mono text-foreground overflow-x-auto whitespace-pre">
              {jsonData}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ProjectIndexGrid() {
  const [selectedProject, setSelectedProject] = useState<MarrProject | null>(null);

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
      cellRenderer: (params: ICellRendererParams<MarrProject>) => (
        <button
          className="text-primary hover:text-primary/80 font-medium transition-colors text-left"
          onClick={() => setSelectedProject(params.data ?? null)}
        >
          {params.value}
        </button>
      ),
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
      headerName: "Goals",
      minWidth: 180,
      flex: 1,
      cellRenderer: FeatureBadges,
    },
    {
      field: "algorithmic",
      headerName: "Methods",
      minWidth: 180,
      flex: 1,
      cellRenderer: FeatureBadges,
    },
    {
      field: "implementation",
      headerName: "Resources",
      minWidth: 180,
      flex: 1,
      cellRenderer: FeatureBadges,
    },
  ], []);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Project Index</h2>
        <span className="text-xs text-muted-foreground">Click a project name to view full data structure</span>
      </div>
      <div
        className="ag-theme-alpine"
        style={{ height: Math.min(700, MARR_PROJECTS.length * 48 + 56) }}
      >
        <AgGridReact
          rowData={MARR_PROJECTS}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          suppressCellFocus={true}
          enableCellTextSelection={true}
          getRowId={(params) => params.data.id}
        />
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
