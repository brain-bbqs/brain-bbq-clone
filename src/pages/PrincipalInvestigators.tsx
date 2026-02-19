"use client";

import { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import { useQuery } from "@tanstack/react-query";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { normalizePiName, nihReporterPiUrl } from "@/lib/pi-utils";
import "@/styles/ag-grid-theme.css";

interface PIRow {
  name: string;
  displayName: string;
  projectsAsPi: number;
  projectsAsCoPi: number;
  totalProjects: number;
  institutions: string[];
  grantTypes: string[];
  grants: { grantNumber: string; title: string; nihLink: string; role: string }[];
}

/** Normalize a name to lowercase sorted parts for comparison */
const nameKey = (name: string): string =>
  name.replace(/[,.\-]/g, " ").split(/\s+/).map((s) => s.toLowerCase().trim()).filter(Boolean).sort().join(" ");

/** Extract grant activity code */
const extractGrantType = (grantNumber: string): string => {
  const match = grantNumber?.match(/([A-Z]\d{2})/);
  return match?.[1] || "";
};

const NameCell = ({ data }: { data: PIRow }) => {
  const url = nihReporterPiUrl(data.displayName);
  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
        title={`Search ${data.displayName} on NIH Reporter`}
      >
        {data.displayName}
      </a>
    </div>
  );
};

const ProjectsCell = ({ data }: { data: PIRow }) => (
  <span className="text-foreground">
    <span className="font-semibold">{data.totalProjects}</span>
    <span className="text-muted-foreground ml-1">
      ({data.projectsAsPi} PI / {data.projectsAsCoPi} Co-PI)
    </span>
  </span>
);

const BadgeListCell = ({ value }: { value: string[] }) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;
  const displayItems = value.slice(0, 3);
  const remaining = value.length - 3;
  return (
    <div className="flex flex-wrap gap-1">
      {displayItems.map((item, i) => (
        <Badge key={i} variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
          {item}
        </Badge>
      ))}
      {remaining > 0 && <span className="text-muted-foreground text-xs">+{remaining}</span>}
    </div>
  );
};

const GrantsCell = ({ data }: { data: PIRow }) => {
  if (!data.grants || data.grants.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {data.grants.map((g) => (
        <a key={g.grantNumber} href={g.nihLink} target="_blank" rel="noopener noreferrer" title={g.title}>
          <Badge
            variant="outline"
            className={`text-xs cursor-pointer hover:bg-primary/20 transition-colors ${
              g.role === "contact_pi"
                ? "bg-primary/15 text-primary border-primary/40 font-semibold"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            {extractGrantType(g.grantNumber) || g.grantNumber.slice(0, 6)}
            <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
          </Badge>
        </a>
      ))}
    </div>
  );
};

const fetchPIs = async (): Promise<PIRow[]> => {
  const { data, error } = await supabase.functions.invoke("nih-grants");
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  const grants = data?.data || [];
  const piMap = new Map<string, PIRow>();

  grants.forEach((grant: any) => {
    const allPis = grant.allPis?.split(/[,;]/).map((p: string) => p.trim()).filter(Boolean) || [];
    const contactPi = grant.contactPi?.trim() || "";
    const normalizedContactPi = nameKey(contactPi);
    const grantType = extractGrantType(grant.grantNumber || "");

    allPis.forEach((piName: string) => {
      if (!piName) return;
      const key = nameKey(piName);
      const existing = piMap.get(key) || {
        name: piName,
        displayName: normalizePiName(piName),
        projectsAsPi: 0,
        projectsAsCoPi: 0,
        totalProjects: 0,
        institutions: [],
        grantTypes: [],
        grants: [],
      };

      const isContact = key === normalizedContactPi;
      if (isContact) existing.projectsAsPi++;
      else existing.projectsAsCoPi++;
      existing.totalProjects++;

      if (grant.institution && !existing.institutions.includes(grant.institution)) {
        existing.institutions.push(grant.institution);
      }
      if (grantType && !existing.grantTypes.includes(grantType)) {
        existing.grantTypes.push(grantType);
      }
      existing.grants.push({
        grantNumber: grant.grantNumber || "",
        title: grant.title || "",
        nihLink: grant.nihLink || "",
        role: isContact ? "contact_pi" : "co_pi",
      });

      piMap.set(key, existing);
    });
  });

  return Array.from(piMap.values()).sort((a, b) => b.totalProjects - a.totalProjects);
};

export default function PrincipalInvestigators() {
  const [quickFilterText, setQuickFilterText] = useState("");
  const { data: rowData = [], isLoading } = useQuery({
    queryKey: ["principal-investigators"],
    queryFn: fetchPIs,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    suppressMovable: true,
  }), []);

  const columnDefs = useMemo<ColDef<PIRow>[]>(() => [
    {
      field: "displayName",
      headerName: "Name",
      flex: 1,
      minWidth: 200,
      cellRenderer: NameCell,
      sort: "asc",
    },
    {
      headerName: "Projects (PI / Co-PI)",
      width: 180,
      minWidth: 160,
      cellRenderer: ProjectsCell,
      comparator: (_vA, _vB, nodeA, nodeB) =>
        (nodeA.data?.totalProjects || 0) - (nodeB.data?.totalProjects || 0),
    },
    {
      headerName: "Grants",
      width: 200,
      minWidth: 160,
      cellRenderer: GrantsCell,
    },
    {
      field: "institutions",
      headerName: "Institutions",
      flex: 1,
      minWidth: 220,
      cellRenderer: BadgeListCell,
    },
  ], []);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Principal Investigators</h1>
          <p className="text-muted-foreground mb-6">
            Browse all Principal Investigators and Co-PIs across BBQS grants. Click a name to search NIH Reporter.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Input
              type="text"
              placeholder="Filter by name, institution..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="max-w-xs"
            />
            <span className="text-sm text-muted-foreground">{rowData.length} investigators</span>
          </div>
        </div>

        <div
          className="ag-theme-alpine rounded-lg border border-border overflow-hidden"
          style={{ height: "calc(100vh - 240px)" }}
        >
          <AgGridReact<PIRow>
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
            rowHeight={48}
            headerHeight={40}
            loading={isLoading}
            loadingOverlayComponent={() => (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span>Loading investigators...</span>
              </div>
            )}
            noRowsOverlayComponent={() => (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Users className="h-8 w-8 text-muted-foreground" />
                <span>No investigators found</span>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
