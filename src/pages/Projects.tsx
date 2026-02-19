"use client";

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageMeta } from "@/components/PageMeta";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, CellMouseOverEvent, CellMouseOutEvent } from "ag-grid-community";
import { useQuery } from "@tanstack/react-query";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Download, Loader2, RefreshCw, FileText, DollarSign, FolderOpen, Users } from "lucide-react";
import { normalizePiName, piProfileUrl, institutionUrl } from "@/lib/pi-utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatAuthors } from "@/components/projects/PublicationsGrid";
import { FundingCharts } from "@/components/projects/FundingCharts";
import "@/styles/ag-grid-theme.css";

interface Publication {
  pmid: string;
  title: string;
  authors: string | { name: string }[];
  year: number;
  journal: string;
  citations: number;
  rcr: number;
  pubmedLink: string;
}

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

const TitleCell = ({ value, data }: { value: string; data: ProjectRow }) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={data.nihLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:text-primary hover:underline truncate block max-w-full"
          >
            {value}
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-md">
          <p className="font-medium">{value}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const TruncatedCell = ({ value }: { value: string }) => {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="truncate block max-w-full">{value}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{value}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const PiCell = ({ value }: { value: string; data: ProjectRow }) => {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const piNames = value.split(/[,;]/).map((n) => n.trim()).filter(Boolean);
  const normalizedNames = piNames.map(normalizePiName);

  return (
    <span className="truncate block max-w-full">
      {normalizedNames.map((name, i) => (
        <span key={i}>
          <a
            href={piProfileUrl(name)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            title={`View ${name} on Google Scholar`}
          >
            {name}
          </a>
          {i < normalizedNames.length - 1 ? ", " : ""}
        </span>
      ))}
    </span>
  );
};

const InstitutionCell = ({ value }: { value: string }) => {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const searchUrl = institutionUrl(value);
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate block max-w-full text-foreground hover:text-primary hover:underline transition-colors"
          >
            {value}
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Visit {value}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const CurrencyCell = ({ value }: { value: number }) => {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return <span className="font-mono text-emerald-600">${value.toLocaleString()}</span>;
};

const GrantTypeBadge = ({ value }: { value: string }) => {
  const grantType = value.match(/^[A-Z]\d+/)?.[0] || value.substring(0, 3);
  const colorMap: Record<string, string> = {
    "R34": "bg-blue-500/20 text-blue-600 border-blue-500/30",
    "R61": "bg-purple-500/20 text-purple-600 border-purple-500/30",
    "U01": "bg-green-500/20 text-green-600 border-green-500/30",
    "U24": "bg-orange-500/20 text-orange-600 border-orange-500/30",
    "R24": "bg-pink-500/20 text-pink-600 border-pink-500/30",
    "5R3": "bg-blue-500/20 text-blue-600 border-blue-500/30",
    "1R3": "bg-cyan-500/20 text-cyan-600 border-cyan-500/30",
    "5R6": "bg-indigo-500/20 text-indigo-600 border-indigo-500/30",
  };
  const colorClass = colorMap[grantType] || "bg-muted/50 text-muted-foreground border-border";
  
  return (
    <Badge variant="outline" className={`${colorClass} text-xs`}>
      {grantType}
    </Badge>
  );
};

const fetchGrants = async (): Promise<ProjectRow[]> => {
  const { data, error } = await supabase.functions.invoke("nih-grants");
  
  if (error) {
    throw new Error(error.message || "Failed to fetch grants");
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data?.data || [];
};

const Projects = () => {
  const [quickFilterText, setQuickFilterText] = useState("");
  const [hoveredRow, setHoveredRow] = useState<ProjectRow | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const { toast } = useToast();

  // Fetch grants from server cache (data refreshed via cron/admin)
  const { data: rowData = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["nih-grants"],
    queryFn: fetchGrants,
    staleTime: 60 * 60 * 1000, // 1 hour (data is cached server-side)
    gcTime: 24 * 60 * 60 * 1000, // 24 hour client cache
  });

  // Calculate metrics
  const totalFunding = useMemo(() => 
    rowData.reduce((sum, g) => sum + (g.awardAmount || 0), 0), 
    [rowData]
  );
  const totalPublications = useMemo(() => 
    rowData.reduce((sum, g) => sum + (g.publicationCount || 0), 0), 
    [rowData]
  );
  const uniqueInstitutions = useMemo(() => 
    new Set(rowData.map(g => g.institution)).size, 
    [rowData]
  );

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    suppressMovable: true,
    unSortIcon: true,
  }), []);

  const columnDefs = useMemo<ColDef<ProjectRow>[]>(() => [
    {
      field: "grantNumber",
      headerName: "Type",
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      cellRenderer: GrantTypeBadge,
      suppressSizeToFit: true,
    },
    {
      field: "title",
      headerName: "Title",
      flex: 1,
      minWidth: 250,
      cellRenderer: TitleCell,
      cellStyle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    },
    {
      field: "allPis",
      headerName: "PIs",
      width: 200,
      minWidth: 150,
      cellRenderer: PiCell,
      cellStyle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      valueGetter: (params) => params.data?.allPis || params.data?.contactPi || '',
    },
    {
      field: "institution",
      headerName: "Organization",
      width: 200,
      minWidth: 200,
      maxWidth: 200,
      suppressSizeToFit: true,
      cellRenderer: InstitutionCell,
      cellStyle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    },
    {
      field: "publicationCount",
      headerName: "Pubs",
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      suppressSizeToFit: true,
      cellRenderer: ({ value, data }: { value: number; data: ProjectRow }) => {
        if (!value) return <span className="text-muted-foreground">0</span>;
        return (
          <span
            className="text-primary hover:underline font-medium cursor-pointer"
            title={`View ${value} publication${value !== 1 ? 's' : ''} for this grant`}
            onClick={() => {
              window.location.href = `/publications?grant=${encodeURIComponent(data.grantNumber)}`;
            }}
          >
            {value}
          </span>
        );
      },
    },
    {
      field: "awardAmount",
      headerName: "Funding",
      width: 110,
      minWidth: 110,
      maxWidth: 110,
      cellRenderer: CurrencyCell,
      suppressSizeToFit: true,
    },
  ], []);

  const onCellMouseOver = useCallback((event: CellMouseOverEvent) => {
    if (event.data && event.event) {
      const mouseEvent = event.event as MouseEvent;
      setHoveredRow(event.data);
      setHoverPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY });
    }
  }, []);

  const onCellMouseOut = useCallback(() => {
    setHoveredRow(null);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch().then(() => {
      toast({
        title: "Data refreshed",
        description: `Loaded ${rowData.length} grants.`,
      });
    });
  }, [refetch, rowData.length, toast]);

  const exportToCSV = useCallback(() => {
    if (rowData.length === 0) return;

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

    const pubHeaders = ["Grant Number", "PMID", "Title", "Authors", "Year", "Journal", "Citations", "RCR", "PubMed Link"];
    const pubRows = rowData.flatMap(grant => 
      grant.publications.map(pub => [
        grant.grantNumber,
        pub.pmid,
        pub.title,
        formatAuthors(pub.authors),
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

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Projects" description="Browse all BBQS consortium research projects — NIH grants, principal investigators, species, and Marr-level computational features." />
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Projects</h1>
          <p className="text-muted-foreground mb-6">
            NIH-funded Brain Behavior Quantification and Synchronization grants.
          </p>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Funding</p>
                    <p className="text-xl font-bold text-foreground">
                      ${(totalFunding / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Projects</p>
                    <p className="text-xl font-bold text-foreground">{rowData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Publications</p>
                    <p className="text-xl font-bold text-foreground">{totalPublications}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Institutions</p>
                    <p className="text-xl font-bold text-foreground">{uniqueInstitutions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Funding Visualizations */}
          <FundingCharts data={rowData} />
          
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
              size="sm"
              onClick={handleRefresh}
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
                  Refresh
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={rowData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div 
          className="ag-theme-alpine rounded-lg border border-border overflow-hidden" 
          style={{ height: 500 }}
        >
          <AgGridReact<ProjectRow>
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
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
            loading={loading}
            loadingOverlayComponent={() => (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span>Loading grant data from NIH Reporter...</span>
              </div>
            )}
            noRowsOverlayComponent={() => (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span>Fetching projects...</span>
              </div>
            )}
          />
        </div>

        {/* Hover Detail Card */}
        {hoveredRow && (
          <div
            className="fixed z-[9999] bg-card border border-border rounded-lg shadow-xl p-4 max-w-md pointer-events-none"
            style={{
              left: Math.min(hoverPosition.x + 15, window.innerWidth - 420),
              top: Math.min(hoverPosition.y + 10, window.innerHeight - 320),
            }}
          >
            <div className="flex items-start gap-2 mb-3">
              <a
                href={hoveredRow.nihLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline line-clamp-2 pointer-events-auto"
              >
                {hoveredRow.title}
                <ExternalLink className="inline h-3 w-3 ml-1 opacity-60" />
              </a>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Grant: </span>
                <span className="text-foreground font-mono">{hoveredRow.grantNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">All PIs: </span>
                <span className="text-foreground">
                  {(hoveredRow.allPis || hoveredRow.contactPi)
                    ?.split(/[,;]/)
                    .map((n: string) => normalizePiName(n.trim()))
                    .join(", ")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Fiscal Year: </span>
                <span className="text-foreground">{hoveredRow.fiscalYear}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Publications: </span>
                <span className={hoveredRow.publicationCount > 0 ? "text-primary font-medium" : "text-muted-foreground"}>
                  {hoveredRow.publicationCount}
                </span>
              </div>
              {hoveredRow.publications.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">Recent Papers:</span>
                  <ul className="mt-2 space-y-1">
                    {hoveredRow.publications.slice(0, 3).map((pub, i) => (
                      <li key={i} className="text-xs text-foreground/80 line-clamp-1">
                        • {pub.title}
                      </li>
                    ))}
                    {hoveredRow.publications.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        +{hoveredRow.publications.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
