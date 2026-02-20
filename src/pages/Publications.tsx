import { useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridReadyEvent, CellMouseOverEvent } from "ag-grid-community";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ExternalLink } from "lucide-react";
import { piProfileUrl } from "@/lib/pi-utils";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";


import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface AuthorOrcid {
  name: string;
  orcid: string;
}

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
  keywords: string[];
  authorOrcids: AuthorOrcid[];
}

const fetchPublications = async (): Promise<Publication[]> => {
  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .order("citations", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((pub) => ({
    pmid: pub.pmid || "",
    title: pub.title,
    year: pub.year || 0,
    journal: pub.journal || "",
    authors: pub.authors || "",
    citations: pub.citations || 0,
    rcr: Number(pub.rcr) || 0,
    grantNumber: "",
    pubmedLink: pub.pubmed_link || (pub.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/` : ""),
    keywords: Array.isArray(pub.keywords) ? pub.keywords : [],
    authorOrcids: Array.isArray(pub.author_orcids) ? (pub.author_orcids as unknown as AuthorOrcid[]) : [],
  }));
};

const TitleCell = ({ value, data }: { value: string; data: Publication }) => {
  if (!data?.pubmedLink) return <span>{value}</span>;
  return (
    <a
      href={data.pubmedLink}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1.5 font-medium transition-colors"
    >
      {value}
      <ExternalLink className="h-3 w-3 opacity-60 flex-shrink-0" />
    </a>
  );
};

/** Parse "LastName, FirstName, LastName, FirstName, ..." into full name pairs */
const parseAuthorPairs = (raw: string): string[] => {
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const authors: string[] = [];
  // Heuristic: if the string looks like "Last, First, Last, First, ..."
  // pair them up. A "first name" part typically starts with an uppercase letter
  // and is shorter or contains initials.
  let i = 0;
  while (i < parts.length) {
    if (i + 1 < parts.length) {
      // Check if next part looks like a first name (not all-caps multi-word surname)
      const next = parts[i + 1];
      const looksLikeFirstName = /^[A-Z][a-z]/.test(next) || /^[A-Z]{1,3}$/.test(next);
      if (looksLikeFirstName) {
        authors.push(`${next} ${parts[i]}`); // "FirstName LastName"
        i += 2;
        continue;
      }
    }
    authors.push(parts[i]);
    i += 1;
  }
  return authors;
};

const AuthorsCell = ({ value, data }: { value: string; data: Publication }) => {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const authors = parseAuthorPairs(value);
  if (authors.length === 0) return <span className="text-muted-foreground">—</span>;

  // Build a lookup from author name fragments → ORCID
  const orcidMap = new Map<string, string>();
  if (data?.authorOrcids) {
    for (const ao of data.authorOrcids) {
      const parts = ao.name.split(",").map(s => s.trim());
      const lastName = parts[0]?.toLowerCase() || "";
      if (lastName) orcidMap.set(lastName, ao.orcid);
    }
  }

  const getAuthorUrl = (author: string): string => {
    const parts = author.trim().split(/\s+/);
    const lastName = parts[parts.length - 1]?.toLowerCase() || "";
    const orcid = orcidMap.get(lastName);
    if (orcid) return `https://orcid.org/${orcid}`;
    return piProfileUrl(author);
  };

  return (
    <span className="truncate block">
      {authors.map((author, i) => {
        const url = getAuthorUrl(author);
        const isOrcid = url.includes("orcid.org");
        return (
          <span key={i}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              title={isOrcid ? `View ${author} on ORCID` : `Search ${author} on Google Scholar`}
            >
              {author}
            </a>
            {i < authors.length - 1 ? ", " : ""}
          </span>
        );
      })}
    </span>
  );
};

const KeywordsCell = ({ value }: { value: string[] }) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;
  const displayed = value.slice(0, 4);
  const remaining = value.length - displayed.length;
  return (
    <span className="flex flex-wrap gap-1 py-1">
      {displayed.map((kw, i) => (
        <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
          {kw}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground">
          +{remaining}
        </Badge>
      )}
    </span>
  );
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

  const displayedPubs = useMemo(() => {
    if (!grantFilter) return publications;
    return publications.filter((p) => p.grantNumber === grantFilter);
  }, [publications, grantFilter]);

  const columnDefs: ColDef<Publication>[] = useMemo(
    () => [
      {
        field: "title",
        headerName: "Title",
        flex: 2,
        minWidth: 300,
        cellRenderer: TitleCell,
        cellStyle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      },
      {
        field: "authors",
        headerName: "Authors",
        flex: 1,
        minWidth: 200,
        cellRenderer: AuthorsCell,
        cellStyle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      },
      {
        field: "keywords",
        headerName: "Keywords",
        flex: 1,
        minWidth: 180,
        cellRenderer: KeywordsCell,
        cellStyle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
        filter: "agTextColumnFilter",
        filterValueGetter: (params) => {
          return params.data?.keywords?.join(", ") || "";
        },
      },
      {
        field: "citations",
        headerName: "Citations",
        width: 100,
        flex: 0,
        sort: "desc",
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
          <p className="text-muted-foreground">Papers from NIH-funded research grants</p>
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
              <button onClick={clearFilter} className="text-xs text-muted-foreground hover:text-foreground underline">
                Show all
              </button>
            </span>
          )}
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
          <div className="ag-theme-alpine relative" style={{ width: "100%" }}>
            <AgGridReact
              ref={gridRef}
              rowData={displayedPubs}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              
              rowHeight={44}
              headerHeight={40}
              animateRows
              pagination
              paginationPageSize={25}
              paginationPageSizeSelector={[10, 25, 50]}
              domLayout="autoHeight"
              suppressCellFocus={true}
              enableCellTextSelection={true}
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
                {hoveredRow.keywords?.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">Keywords: </span>
                    <span className="text-xs">{hoveredRow.keywords.join(", ")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
