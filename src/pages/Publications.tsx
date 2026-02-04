import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridReadyEvent } from "ag-grid-community";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function Publications() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const { toast } = useToast();

  const fetchPublications = useCallback(async () => {
    setLoading(true);
    try {
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
      const uniquePubs = Array.from(
        new Map(allPubs.map((p) => [p.pmid, p])).values()
      );

      setPublications(uniquePubs);
      toast({
        title: "Publications loaded",
        description: `Found ${uniquePubs.length} unique publications`,
      });
    } catch (err) {
      console.error("Error fetching publications:", err);
      toast({
        title: "Error",
        description: "Failed to fetch publications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  const LinkRenderer = (props: { value: string; data: Publication }) => {
    if (!props.data?.pubmedLink) return null;
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

  const columnDefs: ColDef<Publication>[] = useMemo(
    () => [
      {
        field: "pmid",
        headerName: "PMID",
        width: 100,
        cellRenderer: LinkRenderer,
      },
      {
        field: "title",
        headerName: "Title",
        flex: 2,
        minWidth: 300,
        wrapText: true,
        autoHeight: true,
      },
      { field: "year", headerName: "Year", width: 80 },
      { field: "journal", headerName: "Journal", flex: 1, minWidth: 150 },
      {
        field: "authors",
        headerName: "Authors",
        flex: 1,
        minWidth: 200,
        wrapText: true,
        autoHeight: true,
      },
      {
        field: "citations",
        headerName: "Citations",
        width: 100,
        type: "numericColumn",
      },
      {
        field: "rcr",
        headerName: "RCR",
        width: 80,
        type: "numericColumn",
        valueFormatter: (params) => params.value?.toFixed(2) || "0.00",
      },
      { field: "grantNumber", headerName: "Grant", width: 180 },
    ],
    []
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
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
            onClick={fetchPublications}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <span>{publications.length} publications</span>
        </div>

        <div
          className="ag-theme-alpine"
          style={{ height: "calc(100vh - 280px)", width: "100%" }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={publications}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            animateRows
            pagination
            paginationPageSize={50}
            domLayout="normal"
          />
        </div>
      </div>
    </div>
  );
}
