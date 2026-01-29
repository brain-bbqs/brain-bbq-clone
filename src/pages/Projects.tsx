"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, RowClickedEvent, GridReadyEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Download, Loader2, RefreshCw, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PublicationsGrid, { Publication } from "@/components/projects/PublicationsGrid";

interface ProjectRow {
  grantNumber: string;
  title: string;
  contactPi: string;
  allPis: string;
  institution: string;
  fiscalYear: number;
  awardAmount: number;
  nihLink: string;
  publications: Publication[];
  publicationCount: number;
}

const GrantTypeBadge = ({ value }: { value: string }) => {
  const grantType = value.match(/^[A-Z]\d+/)?.[0] || value.substring(0, 3);
  const colorMap: Record<string, string> = {
    "R34": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "R61": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "U01": "bg-green-500/20 text-green-400 border-green-500/30",
    "U24": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "R24": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  };
  const colorClass = colorMap[grantType] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`${colorClass} text-xs`}>
        {grantType}
      </Badge>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
};

const TitleLink = ({ value, data }: { value: string; data: ProjectRow }) => {
  return (
    <a
      href={data.nihLink}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1.5 font-medium transition-colors"
    >
      {value}
      <ExternalLink className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
    </a>
  );
};

const CurrencyCell = ({ value }: { value: number }) => {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return <span className="font-mono">${value.toLocaleString()}</span>;
};

const PublicationCountCell = ({ value }: { value: number }) => {
  return (
    <div className="flex items-center gap-1.5">
      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
      <span className={value > 0 ? "text-primary font-medium" : "text-muted-foreground"}>
        {value}
      </span>
    </div>
  );
};

const Projects = () => {
  const [rowData, setRowData] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [expandedGrant, setExpandedGrant] = useState<string | null>(null);
  const { toast } = useToast();

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

  const columnDefs = useMemo<ColDef<ProjectRow>[]>(() => [
    {
      field: "grantNumber",
      headerName: "Grant",
      width: 180,
      flex: 0,
      cellRenderer: GrantTypeBadge,
    },
    {
      field: "title",
      headerName: "Project Title",
      minWidth: 300,
      flex: 2,
      cellRenderer: TitleLink,
    },
    {
      field: "contactPi",
      headerName: "Contact PI",
      minWidth: 150,
    },
    {
      field: "allPis",
      headerName: "All PIs",
      minWidth: 200,
    },
    {
      field: "institution",
      headerName: "Institution",
      minWidth: 200,
    },
    {
      field: "fiscalYear",
      headerName: "FY",
      width: 100,
      flex: 0,
    },
    {
      field: "awardAmount",
      headerName: "Award",
      width: 140,
      flex: 0,
      cellRenderer: CurrencyCell,
    },
    {
      field: "publicationCount",
      headerName: "Pubs",
      width: 80,
      flex: 0,
      cellRenderer: PublicationCountCell,
    },
  ], []);

  const fetchAllGrants = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("nih-grants");

      if (error) {
        throw new Error(error.message || "Failed to fetch grants");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.data) {
        setRowData(data.data);
        const totalPubs = data.data.reduce((sum: number, g: ProjectRow) => sum + (g.publicationCount || 0), 0);
        toast({
          title: "Data loaded",
          description: `Loaded ${data.data.length} grants with ${totalPubs} publications.`,
        });
      }
    } catch (err) {
      console.error("Error fetching grants:", err);
      toast({
        title: "Error loading data",
        description: err instanceof Error ? err.message : "Failed to fetch grant data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const exportToCSV = useCallback(() => {
    if (rowData.length === 0) return;

    // Export grants
    const grantHeaders = ["Grant Number", "Title", "Contact PI", "All PIs", "Institution", "Fiscal Year", "Award Amount", "Publications", "NIH Link"];
    const grantRows = rowData.map(row => [
      row.grantNumber,
      row.title,
      row.contactPi,
      row.allPis,
      row.institution,
      row.fiscalYear.toString(),
      row.awardAmount.toString(),
      row.publicationCount.toString(),
      row.nihLink
    ]);

    const grantCSV = [
      grantHeaders.join(","),
      ...grantRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Export publications
    const pubHeaders = ["Grant Number", "PMID", "Title", "Authors", "Year", "Journal", "Citations", "RCR", "PubMed Link"];
    const pubRows = rowData.flatMap(grant => 
      grant.publications.map(pub => [
        grant.grantNumber,
        pub.pmid,
        pub.title,
        pub.authors,
        pub.year.toString(),
        pub.journal,
        pub.citations.toString(),
        pub.rcr.toString(),
        pub.pubmedLink
      ])
    );

    const pubCSV = [
      pubHeaders.join(","),
      ...pubRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const downloadCSV = (content: string, filename: string) => {
      const blob = new Blob([content], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    };

    downloadCSV(grantCSV, "bbqs_grants.csv");
    downloadCSV(pubCSV, "bbqs_publications.csv");

    toast({
      title: "Export complete",
      description: `Exported ${rowData.length} grants and ${pubRows.length} publications.`,
    });
  }, [rowData, toast]);

  const handleRowClick = useCallback((event: RowClickedEvent<ProjectRow>) => {
    const grantNumber = event.data?.grantNumber;
    if (grantNumber) {
      setExpandedGrant(prev => prev === grantNumber ? null : grantNumber);
    }
  }, []);

  const selectedProject = useMemo(() => 
    rowData.find(r => r.grantNumber === expandedGrant),
    [rowData, expandedGrant]
  );

  useEffect(() => {
    fetchAllGrants();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">BBQS Projects</h1>
          <p className="text-muted-foreground mb-4">
            NIH-funded Brain Behavior Quantification and Synchronization grants with publications. Click a row to view publications.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Input
              type="text"
              placeholder="Quick filter..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="max-w-md"
            />
            
            <Button
              variant="outline"
              onClick={fetchAllGrants}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={rowData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>

            <span className="text-sm text-muted-foreground ml-auto">
              {rowData.length} projects • {rowData.reduce((sum, g) => sum + (g.publicationCount || 0), 0)} publications
            </span>
          </div>
        </div>

        <div 
          className="ag-theme-quartz-dark rounded-lg border border-border overflow-hidden" 
          style={{ height: expandedGrant ? "calc(50vh - 130px)" : "calc(100vh - 260px)" }}
        >
          <AgGridReact<ProjectRow>
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
            animateRows={true}
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={[10, 25, 50, 100]}
            suppressCellFocus={true}
            enableCellTextSelection={true}
            onRowClicked={handleRowClick}
            rowSelection="single"
            rowStyle={{ cursor: "pointer" }}
            getRowStyle={(params) => {
              if (params.data?.grantNumber === expandedGrant) {
                return { backgroundColor: "hsl(var(--primary) / 0.1)" };
              }
              return undefined;
            }}
            loadingOverlayComponent={() => (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading grant data from NIH Reporter...
              </div>
            )}
          />
        </div>

        {expandedGrant && selectedProject && (
          <div className="mt-4 bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ChevronDown className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Publications for {expandedGrant}
                </h3>
                <Badge variant="secondary">
                  {selectedProject.publicationCount} papers
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setExpandedGrant(null)}
              >
                Close
              </Button>
            </div>
            <PublicationsGrid 
              publications={selectedProject.publications} 
              grantNumber={expandedGrant}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
