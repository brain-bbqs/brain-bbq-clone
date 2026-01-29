"use client";

import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import { ExternalLink } from "lucide-react";

export interface Publication {
  pmid: string;
  title: string;
  year: number;
  journal: string;
  authors: string;
  citations: number;
  rcr: number;
  pubmedLink: string;
}

interface PublicationsGridProps {
  publications: Publication[];
  grantNumber: string;
}

const TitleLink = ({ value, data }: { value: string; data: Publication }) => {
  if (!data.pubmedLink) return <span>{value}</span>;
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

const RCRCell = ({ value }: { value: number }) => {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const color = value >= 2 ? "text-green-400" : value >= 1 ? "text-yellow-400" : "text-muted-foreground";
  return <span className={`font-mono ${color}`}>{value.toFixed(2)}</span>;
};

export const PublicationsGrid = ({ publications, grantNumber }: PublicationsGridProps) => {
  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
    wrapText: true,
    autoHeight: true,
    cellStyle: { lineHeight: "1.5", padding: "6px" },
  }), []);

  const columnDefs = useMemo<ColDef<Publication>[]>(() => [
    {
      field: "pmid",
      headerName: "PMID",
      width: 100,
      flex: 0,
    },
    {
      field: "title",
      headerName: "Title",
      minWidth: 250,
      flex: 2,
      cellRenderer: TitleLink,
    },
    {
      field: "authors",
      headerName: "Authors",
      minWidth: 200,
      flex: 1,
    },
    {
      field: "year",
      headerName: "Year",
      width: 80,
      flex: 0,
    },
    {
      field: "journal",
      headerName: "Journal",
      minWidth: 150,
    },
    {
      field: "citations",
      headerName: "Citations",
      width: 100,
      flex: 0,
    },
    {
      field: "rcr",
      headerName: "RCR",
      width: 80,
      flex: 0,
      cellRenderer: RCRCell,
    },
  ], []);

  if (publications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No publications found for {grantNumber}
      </div>
    );
  }

  return (
    <div 
      className="ag-theme-quartz-dark rounded-lg border border-border overflow-hidden" 
      style={{ height: Math.min(400, publications.length * 60 + 56) }}
    >
      <AgGridReact<Publication>
        rowData={publications}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        suppressCellFocus={true}
        enableCellTextSelection={true}
        domLayout={publications.length <= 5 ? "autoHeight" : "normal"}
      />
    </div>
  );
};

export default PublicationsGrid;
