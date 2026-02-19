import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridReadyEvent, CellMouseOverEvent, GridApi } from "ag-grid-community";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { piProfileUrl } from "@/lib/pi-utils";

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

const getRowStyle = (params: { data: Publication }) => {
  if (!params.data) return {};
  const rcr = params.data.rcr;
  if (rcr >= 2) return { backgroundColor: "hsl(142 70% 95%)" };
  if (rcr >= 1) return { backgroundColor: "hsl(38 90% 95%)" };
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
            authors: typeof pub.authors === "string" ? pub.authors : authorList || "",
            citations: pub.citations || 0,
            rcr: pub.rcr || 0,
            grantNumber: grant.grantNumber,
            pubmedLink: pub.pubmedLink,
          });
        }
      }
    }
  }

  return Array.from(new Map(allPubs.map((p) => [p.pmid, p])).values());
};

export default function Publications() {
  const gridRef = useRef<AgGridReact>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const grantFilter = searchParams.get("grant");
  const [hoveredRow, setHoveredRow] = useState<Publication | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const { data: publications = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["publications"],
    queryFn: fetchPublications,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Filter publications if grant param is present
  const displayedPubs = useMemo(() => {
    if (!grantFilter) return publications;
    return publications.filter((p) => p.grantNumber === grantFilter);
  }, [publications, grantFilter]);

  const AuthorsCell = useCallback(({ value }: { value: string }) => {
    if (!value) return <span className="text-muted-foreground">—</span>;
    const authors = value.split(",").map((a) => a.trim()).filter(Boolean);
    if (authors.length === 0) return <span className="text-muted-foreground">—</span>;
    return (
      <span className="truncate block">
        {authors.map((author, i) => (
          <span key={i}>
            <a
              href={piProfileUrl(author)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              title={`Search ${author} on Google Scholar`}
            >
              {author}
            </a>
            {i < authors.length - 1 ? ", " : ""}
          </span>
        ))}
      </span>
    );
  }, []);

  const columnDefs: ColDef<Publication>[] = useMemo(
    () => [
      {
        field: "title",
        headerName: "Title",
        flex: 2,
        minWidth: 300,
      },
      {
        field: "authors",
        headerName: "Authors",
        flex: 1,
        minWidth: 200,
        cellRenderer: AuthorsCell,
      },
    ],
    [AuthorsCell]
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

  const exportToCSV = () => {
    gridRef.current?.api.exportDataAsCsv({ fileName: "publications.csv" });
  };

  const getRcrLabel = (rcr: number) => {
    if (rcr >= 2) return { text: "High Impact", className: "text-green-600 font-semibold" };
    if (rcr >= 1) return { text: "Above Avg", className: "text-amber-600 font-medium" };
    return { text: "Below Avg", className: "text-muted-foreground" };
  };

  const clearFilter = () => {
    setSearchParams({});
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
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
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
          <span>{displayedPubs.length} publications</span>
          {grantFilter && (
            <span className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary border border-primary/30 rounded-full px-3 py-0.5 text-xs font-medium">
                Grant: {grantFilter}
              </span>
              <button
                onClick={clearFilter}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Show all
              </button>
            </span>
          )}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(142 70% 85%)" }}></span> High Impact (RCR ≥ 2)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(38 90% 85%)" }}></span> Above Avg (RCR ≥ 1)
            </span>
          </div>
          <span className="text-xs italic">
            RCR = Relative Citation Ratio, an NIH metric comparing citation impact to field average
          </span>
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
            className="ag-theme-alpine relative"
            style={{ height: "calc(100vh - 240px)", width: "100%" }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={displayedPubs}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              getRowStyle={getRowStyle}
              rowHeight={36}
              headerHeight={40}
              animateRows
              pagination
              paginationPageSize={50}
              domLayout="normal"
              onCellMouseOver={onCellMouseOver}
              onCellMouseOut={onCellMouseOut}
              noRowsOverlayComponent={() => (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <span>Fetching publications...</span>
                </div>
              )}
            />

            {hoveredRow && (
              <div
                className="fixed z-[9999] bg-popover border border-border rounded-lg shadow-lg p-4 max-w-md pointer-events-none"
                style={{
                  left: Math.min(hoverPosition.x + 16, window.innerWidth - 420),
                  top: Math.min(hoverPosition.y + 16, window.innerHeight - 300),
                }}
              >
                <h4 className="font-semibold text-sm mb-2 line-clamp-2">{hoveredRow.title}</h4>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{hoveredRow.authors}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Year:</span>{" "}
                    <span className="font-medium">{hoveredRow.year}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Journal:</span>{" "}
                    <span className="font-medium">{hoveredRow.journal}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Citations:</span>{" "}
                    <span className="font-medium">{hoveredRow.citations}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RCR:</span>{" "}
                    <span className={getRcrLabel(hoveredRow.rcr).className}>
                      {hoveredRow.rcr.toFixed(2)} ({getRcrLabel(hoveredRow.rcr).text})
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grant:</span>{" "}
                    <span className="font-medium">{hoveredRow.grantNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PMID:</span>{" "}
                    <a
                      href={hoveredRow.pubmedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 pointer-events-auto"
                    >
                      {hoveredRow.pmid}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
