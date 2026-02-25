"use client";

import { useState, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, CellMouseOverEvent, CellMouseOutEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import type { Resource } from "@/data/resources";
import { useResources } from "@/hooks/useResources";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, Circle, Box, Loader2, Github, Container } from "lucide-react";
import "@/styles/ag-grid-theme.css";

const CATEGORIES = ["All", "Software", "Datasets", "Benchmarks", "ML Models", "Protocols"] as const;
type Category = typeof CATEGORIES[number];

const CategoryBadge = ({ value }: { value: string }) => {
  const colorMap: Record<string, string> = {
    "Software": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "ML Models": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Datasets": "bg-green-500/20 text-green-400 border-green-500/30",
    "Benchmarks": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Protocols": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  };
  return (
    <Badge variant="outline" className={`${colorMap[value] || ""} text-xs`}>
      {value}
    </Badge>
  );
};

const NameLink = ({ value, data }: { value: string; data: Resource }) => (
  <a href={data.url} target="_blank" rel="noopener noreferrer"
    onClick={(e) => { e.stopPropagation(); window.open(data.url, '_blank'); }}
    className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer text-sm">
    {value}<ExternalLink className="h-3 w-3 opacity-60" />
  </a>
);

const RepoLink = ({ data }: { data: Resource }) => {
  const repoUrl = data.repoUrl || (data.url?.includes("github.com") ? data.url : "");
  if (!repoUrl) return <span className="text-muted-foreground">—</span>;
  return (
    <a href={repoUrl} target="_blank" rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 text-xs transition-colors">
      <Github className="h-3.5 w-3.5" />Repo
    </a>
  );
};

const DockerLink = ({ data }: { data: Resource }) => {
  if (!data.containerized) return <span className="text-muted-foreground text-xs">—</span>;
  const dockerUrl = data.dockerUrl;
  if (dockerUrl) {
    return (
      <a href={dockerUrl} target="_blank" rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 text-xs transition-colors">
        <Container className="h-3.5 w-3.5" />Registry
      </a>
    );
  }
  return (
    <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs gap-1">
      <Container className="h-3 w-3" />Available
    </Badge>
  );
};

const McpStatusBadge = ({ value }: { value: Resource["mcpStatus"] }) => {
  const statusConfig = {
    trained: { label: "Trained", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: Check },
    pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Circle },
    "not-started": { label: "Not Started", className: "bg-muted/50 text-muted-foreground border-border", icon: Circle },
  };
  const config = statusConfig[value] || statusConfig["not-started"];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.className} text-xs gap-1`}>
      <Icon className="h-3 w-3" />{config.label}
    </Badge>
  );
};

const Resources = () => {
  const [quickFilterText, setQuickFilterText] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const { data: allResources = [], isLoading } = useResources();
  const [hoveredRow, setHoveredRow] = useState<Resource | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const filteredResources = useMemo(() => {
    if (activeCategory === "All") return allResources;
    return allResources.filter(r => r.category === activeCategory);
  }, [allResources, activeCategory]);

  const defaultColDef = useMemo<ColDef>(() => ({ sortable: true, resizable: true, unSortIcon: true }), []);

  const columnDefs = useMemo<ColDef<Resource>[]>(() => [
    { field: "name", headerName: "Name", minWidth: 180, flex: 1.5, cellRenderer: NameLink },
    { field: "category", headerName: "Type", width: 120, minWidth: 100, flex: 0, cellRenderer: (params: any) => <CategoryBadge value={params.value} /> },
    {
      field: "algorithm", headerName: "Description", minWidth: 250, flex: 3,
      wrapText: true, autoHeight: true,
      cellStyle: { lineHeight: '1.4', paddingTop: '8px', paddingBottom: '8px', whiteSpace: 'normal', wordBreak: 'break-word' },
    },
    { field: "species", headerName: "Species", width: 150, minWidth: 120, flex: 0 },
    { field: "implementation", headerName: "Language", width: 100, minWidth: 90, flex: 0 },
    { headerName: "Repo", width: 80, minWidth: 80, flex: 0, cellRenderer: (params: any) => <RepoLink data={params.data} /> },
    { headerName: "Docker", width: 90, minWidth: 90, flex: 0, cellRenderer: (params: any) => <DockerLink data={params.data} /> },
    { field: "mcpStatus", headerName: "MCP", width: 120, minWidth: 120, flex: 0, cellRenderer: McpStatusBadge },
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

  const categoryColors: Record<string, string> = {
    "All": "bg-primary text-primary-foreground",
    "Software": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Datasets": "bg-green-500/20 text-green-400 border-green-500/30",
    "Benchmarks": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "ML Models": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Protocols": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Resources</h1>
          <p className="text-muted-foreground mb-4">
            Browse software, datasets, benchmarks, ML models, and protocols for behavioral neuroscience research.
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeCategory === cat
                    ? cat === "All"
                      ? "bg-primary text-primary-foreground border-primary"
                      : `${categoryColors[cat]} border`
                    : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 mb-4">
            <input type="text" placeholder="Quick filter..." value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="px-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full max-w-md" />
            <span className="text-sm text-muted-foreground">{filteredResources.length} resources</span>
          </div>
        </div>
        <div className="ag-theme-alpine rounded-lg border border-border overflow-hidden" style={{ height: "calc(100vh - 300px)" }}>
          <AgGridReact<Resource>
            rowData={filteredResources} columnDefs={columnDefs} defaultColDef={defaultColDef}
            quickFilterText={quickFilterText} onCellMouseOver={onCellMouseOver} onCellMouseOut={onCellMouseOut}
            animateRows={true} pagination={true} paginationPageSize={25} paginationPageSizeSelector={[10, 25, 50, 100]}
            suppressCellFocus={true} enableCellTextSelection={true} rowHeight={36} headerHeight={40}
            loading={isLoading}
            loadingOverlayComponent={() => (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading resources...
              </div>
            )}
          />
        </div>
        {hoveredRow && (
          <div className="fixed z-[9999] bg-card border border-border rounded-lg shadow-xl p-4 max-w-md pointer-events-none"
            style={{ left: Math.min(hoverPosition.x + 15, window.innerWidth - 420), top: Math.min(hoverPosition.y + 10, window.innerHeight - 300) }}>
            <h3 className="font-semibold text-foreground mb-3">{hoveredRow.name}</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Type: </span><span className="text-foreground">{hoveredRow.category}</span></div>
              <div><span className="text-muted-foreground">Approach: </span><span className="text-foreground">{hoveredRow.computational}</span></div>
              {hoveredRow.neuralNetworkArchitecture && hoveredRow.neuralNetworkArchitecture !== "N/A" && (
                <div><span className="text-muted-foreground">Architecture: </span><span className="text-foreground">{hoveredRow.neuralNetworkArchitecture}</span></div>
              )}
              {hoveredRow.mlPipeline && hoveredRow.mlPipeline !== "N/A" && (
                <div><span className="text-muted-foreground">Pipeline: </span><span className="text-foreground">{hoveredRow.mlPipeline}</span></div>
              )}
              <div><span className="text-muted-foreground">Species: </span><span className="text-foreground">{hoveredRow.species}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
