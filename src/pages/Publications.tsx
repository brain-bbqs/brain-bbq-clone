import { useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridReadyEvent } from "ag-grid-community";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ExternalLink, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface Publication {
  pmid: string;
  title: string;
  year: number;
  journal: string;
  authors: string;
  citations: number;
  rcr: number;
  grantNumber: string;
  pubmedLink: string;
}

// Color-code rows based on RCR (Relative Citation Ratio)
const getRowStyle = (params: { data: Publication }) => {
  if (!params.data) return {};
  const rcr = params.data.rcr;
  if (rcr >= 2) {
    return { backgroundColor: "hsl(142 70% 95%)" }; // High impact - green
  } else if (rcr >= 1) {
    return { backgroundColor: "hsl(38 90% 95%)" }; // Above average - gold
  }
  return {};
};

const fetchPublications = async (): Promise<Publication[]> => {
  const { data, error } = await supabase.functions.invoke("nih-grants", {
    body: { grantNumbers: [] },
  });

  if (error) throw error;

  const allPubs: Publication[] = [];
  if (data?.data) {
    for (const grant of data.data) {
      if (grant.publications) {
        for (const pub of grant.publications) {
          const authorList = pub.authors
            ?.map((a: { fullName?: string }) => a.fullName || "")
            .filter(Boolean)
            .join(", ");

          allPubs.push({
            pmid: pub.pmid,
            title: pub.title,
            year: pub.year,
            journal: pub.journal,
            authors: authorList || "",
            citations: pub.citations || 0,
            rcr: pub.rcr || 0,
            grantNumber: grant.grantNumber,
            pubmedLink: pub.pubmedLink,
          });
        }
      }
    }
  }

  // Deduplicate by PMID
  return Array.from(new Map(allPubs.map((p) => [p.pmid, p])).values());
};

export default function Publications() {
  const gridRef = useRef<AgGridReact>(null);

  const { data: publications = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["publications"],
    queryFn: fetchPublications,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  const TitleRenderer = (props: { value: string; data: Publication }) => {
    if (!props.value) return <span className="text-muted-foreground">—</span>;
    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <span className="cursor-help truncate block">{props.value}</span>
        </HoverCardTrigger>
        <HoverCardContent className="w-96 z-[9999]" side="bottom" align="start">
          <div className="space-y-2">
            <p className="text-sm font-medium">{props.value}</p>
            <p className="text-xs text-muted-foreground">{props.data?.journal} • {props.data?.year}</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const AuthorsRenderer = (props: { value: string }) => {
    if (!props.value) return <span className="text-muted-foreground">—</span>;
    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <span className="cursor-help truncate block">{props.value}</span>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 z-[9999]" side="bottom" align="start">
          <p className="text-sm">{props.value}</p>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const LinkRenderer = (props: { value: string; data: Publication }) => {
    if (!props.data?.pubmedLink) return <span>{props.value}</span>;
    return (
      <a
        href={props.data.pubmedLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline inline-flex items-center gap-1"
      >
        {props.value}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  };

  const RcrRenderer = (props: { value: number }) => {
    const rcr = props.value || 0;
    let className = "text-muted-foreground";
    if (rcr >= 2) className = "text-green-600 font-semibold";
    else if (rcr >= 1) className = "text-amber-600 font-medium";
    return <span className={className}>{rcr.toFixed(2)}</span>;
  };

  const columnDefs: ColDef<Publication>[] = useMemo(
    () => [
      {
        field: "title",
        headerName: "Title",
        flex: 2,
        minWidth: 250,
        cellRenderer: TitleRenderer,
      },
      { field: "year", headerName: "Year", width: 90, sort: "desc" },
      { field: "journal", headerName: "Journal", width: 150 },
      {
        field: "authors",
        headerName: "Authors",
        flex: 1,
        minWidth: 180,
        cellRenderer: AuthorsRenderer,
      },
      {
        field: "citations",
        headerName: "Citations",
        width: 95,
        type: "numericColumn",
      },
      {
        field: "rcr",
        headerName: "RCR",
        width: 80,
        type: "numericColumn",
        cellRenderer: RcrRenderer,
      },
      { field: "grantNumber", headerName: "Grant", width: 170 },
      {
        field: "pmid",
        headerName: "PubMed",
        width: 110,
        cellRenderer: LinkRenderer,
      },
    ],
    []
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: true,
    }),
    []
  );

  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  };

  const exportToCSV = () => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: "publications.csv",
    });
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Publications</h1>
          <p className="text-muted-foreground">
            Papers from NIH-funded research grants
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
          <span>{publications.length} publications</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-200"></span> High Impact
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-200"></span> Above Avg
            </span>
          </div>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="flex items-center gap-1 text-primary hover:underline">
                <Info className="h-3.5 w-3.5" />
                What is RCR?
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 z-[9999]" side="bottom">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Relative Citation Ratio (RCR)</h4>
                <p className="text-xs text-muted-foreground">
                  RCR is an NIH metric measuring a paper's citation impact compared to others in the same field.
                </p>
                <ul className="text-xs space-y-1">
                  <li><strong>RCR = 1.0:</strong> Average citation impact for field</li>
                  <li><strong className="text-amber-600">RCR ≥ 1:</strong> Above average impact</li>
                  <li><strong className="text-green-600">RCR ≥ 2:</strong> High impact (2x average)</li>
                </ul>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div
            className="ag-theme-alpine"
            style={{ height: "calc(100vh - 300px)", width: "100%" }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={publications}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              getRowStyle={getRowStyle}
              rowHeight={48}
              animateRows
              pagination
              paginationPageSize={50}
              domLayout="normal"
            />
          </div>
        )}
      </div>
    </div>
  );
}
