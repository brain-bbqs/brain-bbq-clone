"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Download, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NIHProject {
  project_num: string;
  project_title: string;
  contact_pi_name: string;
  principal_investigators: Array<{ full_name: string; email?: string }>;
  organization: { org_name: string } | null;
  fiscal_year: number;
  award_amount: number;
  abstract_text: string;
  core_project_num: string;
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
}

const GRANT_NUMBERS = [
  "R34DA059510", "R34DA059509", "R34DA059513", "R34DA059507",
  "R34DA059718", "R34DA059506", "R34DA059512", "R34DA059716",
  "R34DA059723", "R34DA059514", "R34DA059500", "R34DA061984",
  "R34DA061924", "R34DA061925", "R34DA062119", "R61MH135106",
  "R61MH135109", "R61MH135114", "R61MH135405", "R61MH135407",
  "R61MH138966", "R61MH138713", "R61MH138705", "1U01DA063534",
  "U24MH136628", "R24MH136632"
];

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

const Projects = () => {
  const [rowData, setRowData] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
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
  ], []);

  const fetchGrantData = useCallback(async (grantNumber: string): Promise<ProjectRow | null> => {
    try {
      const response = await fetch("https://api.reporter.nih.gov/v2/projects/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria: {
            project_nums: [grantNumber]
          },
          include_fields: [
            "ProjectNum", "ProjectTitle", "ContactPiName", "PrincipalInvestigators",
            "Organization", "FiscalYear", "AwardAmount", "AbstractText", "CoreProjectNum"
          ],
          offset: 0,
          limit: 1
        })
      });

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return null;
      }

      const project: NIHProject = data.results[0];
      const pis = project.principal_investigators || [];
      
      return {
        grantNumber: project.project_num || grantNumber,
        title: project.project_title || "Unknown",
        contactPi: project.contact_pi_name || "Unknown",
        allPis: pis.map(pi => pi.full_name).join(", ") || project.contact_pi_name || "Unknown",
        institution: project.organization?.org_name || "Unknown",
        fiscalYear: project.fiscal_year || 0,
        awardAmount: project.award_amount || 0,
        nihLink: `https://reporter.nih.gov/search/lVXfsunpaUqfmTQW0jRXmA/project-details/${project.project_num?.replace(/[^a-zA-Z0-9]/g, "") || grantNumber}`,
      };
    } catch (err) {
      console.error(`Error fetching ${grantNumber}:`, err);
      return null;
    }
  }, []);

  const fetchAllGrants = useCallback(async () => {
    setLoading(true);
    setProgress({ current: 0, total: GRANT_NUMBERS.length });
    const results: ProjectRow[] = [];

    for (let i = 0; i < GRANT_NUMBERS.length; i++) {
      const grant = GRANT_NUMBERS[i];
      setProgress({ current: i + 1, total: GRANT_NUMBERS.length });
      
      const projectRow = await fetchGrantData(grant);
      if (projectRow) {
        results.push(projectRow);
        // Update the grid incrementally
        setRowData([...results]);
      }

      // Small delay to avoid rate limiting
      if (i < GRANT_NUMBERS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setLoading(false);
    toast({
      title: "Data loaded",
      description: `Successfully loaded ${results.length} of ${GRANT_NUMBERS.length} grants from NIH Reporter.`,
    });
  }, [fetchGrantData, toast]);

  const exportToCSV = useCallback(() => {
    if (rowData.length === 0) return;

    const headers = ["Grant Number", "Title", "Contact PI", "All PIs", "Institution", "Fiscal Year", "Award Amount", "NIH Link"];
    const rows = rowData.map(row => [
      row.grantNumber,
      row.title,
      row.contactPi,
      row.allPis,
      row.institution,
      row.fiscalYear.toString(),
      row.awardAmount.toString(),
      row.nihLink
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bbqs_grants.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${rowData.length} grants to CSV.`,
    });
  }, [rowData, toast]);

  useEffect(() => {
    fetchAllGrants();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">BBQS Projects</h1>
          <p className="text-muted-foreground mb-4">
            NIH-funded Brain Behavior Quantification and Synchronization grants. Data fetched live from NIH Reporter.
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
                  Loading {progress.current}/{progress.total}
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
              {rowData.length} projects loaded
            </span>
          </div>
        </div>

        <div 
          className="ag-theme-quartz-dark rounded-lg border border-border overflow-hidden" 
          style={{ height: "calc(100vh - 260px)" }}
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
            loadingOverlayComponent={() => (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading grant data from NIH Reporter...
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default Projects;
