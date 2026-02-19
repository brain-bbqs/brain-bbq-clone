"use client";

import { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import { useQuery } from "@tanstack/react-query";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Users, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { normalizePiName, piProfileUrl, institutionUrl } from "@/lib/pi-utils";
import "@/styles/ag-grid-theme.css";

interface GrantInfo {
  grantNumber: string;
  title: string;
  nihLink: string;
  role: string;
  awardAmount: number;
  collaborators: string[];
  institution: string;
}

interface PIRow {
  name: string;
  displayName: string;
  firstName: string;
  lastName: string;
  projectsAsPi: number;
  projectsAsCoPi: number;
  totalProjects: number;
  institutions: string[];
  grantTypes: string[];
  grants: GrantInfo[];
}

const nameKey = (name: string): string =>
  name.replace(/[,.\-]/g, " ").split(/\s+/).map((s) => s.toLowerCase().trim()).filter(Boolean).sort().join(" ");

const extractGrantType = (grantNumber: string): string => {
  const match = grantNumber?.match(/([A-Z]\d{2})/);
  return match?.[1] || "";
};

/** Open NIH Reporter search for a PI, falling back to Google Scholar */
const openNihReporterProfile = async (firstName: string, lastName: string, displayName: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("nih-reporter-search", {
      body: { first_name: firstName, last_name: lastName },
    });
    if (!error && data?.url) {
      window.open(data.url, "_blank");
      return;
    }
  } catch {
    // fallback below
  }
  window.open(piProfileUrl(displayName), "_blank");
};

const NameCell = ({ data }: { data: PIRow }) => {
  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
      <button
        onClick={() => openNihReporterProfile(data.firstName, data.lastName, data.displayName)}
        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors text-left"
        title={`View ${data.displayName} on NIH Reporter`}
      >
        {data.displayName}
      </button>
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

const InstitutionBadgeCell = ({ value }: { value: string[] }) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;
  const displayItems = value.slice(0, 3);
  const remaining = value.length - 3;
  return (
    <div className="flex flex-wrap gap-1">
      {displayItems.map((item, i) => (
        <a
          key={i}
          href={institutionUrl(item)}
          target="_blank"
          rel="noopener noreferrer"
          title={`Visit ${normalizePiName(item)}`}
        >
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs cursor-pointer hover:bg-primary/20 transition-colors">
            {item}
          </Badge>
        </a>
      ))}
      {remaining > 0 && <span className="text-muted-foreground text-xs">+{remaining}</span>}
    </div>
  );
};

const GrantsCell = ({ data }: { data: PIRow }) => {
  if (!data?.grants || data.grants.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap gap-1">
        {data.grants.map((g, idx) => (
          <Tooltip key={`${g.grantNumber}-${idx}`}>
            <TooltipTrigger asChild>
              <a
                href={g.nihLink || `https://reporter.nih.gov/search/results?projectNum=${encodeURIComponent(g.grantNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
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
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm">
              <p className="font-medium text-sm mb-1">{g.title}</p>
              <p className="text-xs text-muted-foreground mb-1">
                {g.grantNumber} · {g.institution}
                {g.awardAmount > 0 && ` · $${g.awardAmount.toLocaleString()}`}
              </p>
              {g.collaborators && g.collaborators.length > 0 && (
                <div className="mt-1 pt-1 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Collaborators: {g.collaborators.join(", ")}
                  </p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
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
    const allPiNames = allPis.map((n: string) => normalizePiName(n));

    allPis.forEach((piName: string) => {
      if (!piName) return;
      const key = nameKey(piName);
      const displayName = normalizePiName(piName);

      // Extract first/last for NIH Reporter search
      const nameParts = displayName.split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || "";
      const lastName = nameParts[nameParts.length - 1] || "";

      const existing = piMap.get(key) || {
        name: piName,
        displayName,
        firstName,
        lastName,
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

      const collaborators = allPiNames.filter((n: string) => n !== displayName);

      existing.grants.push({
        grantNumber: grant.grantNumber || "",
        title: grant.title || "",
        nihLink: grant.nihLink || "",
        role: isContact ? "contact_pi" : "co_pi",
        awardAmount: grant.awardAmount || 0,
        institution: grant.institution || "",
        collaborators,
      });

      piMap.set(key, existing);
    });
  });

  return Array.from(piMap.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
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
    unSortIcon: true,
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
      flex: 1,
      minWidth: 200,
      cellRenderer: GrantsCell,
    },
    {
      field: "institutions",
      headerName: "Institutions",
      flex: 1,
      minWidth: 220,
      cellRenderer: InstitutionBadgeCell,
    },
  ], []);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Principal Investigators</h1>
          <p className="text-muted-foreground mb-6">
            Browse all Principal Investigators and Co-PIs across BBQS grants. Click a name to view their NIH Reporter profile. Hover over a grant badge to see project details and collaborators.
          </p>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Investigators</p>
                    <p className="text-xl font-bold text-foreground">{rowData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Unique Institutions</p>
                    <p className="text-xl font-bold text-foreground">
                      {new Set(rowData.flatMap(pi => pi.institutions)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
          style={{ height: "calc(100vh - 340px)" }}
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
