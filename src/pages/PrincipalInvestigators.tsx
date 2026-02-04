"use client";

import { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import { useQuery } from "@tanstack/react-query";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import "@/styles/ag-grid-theme.css";

interface PIRow {
  name: string;
  email: string;
  projectsAsPi: number;
  projectsAsCoPi: number;
  totalProjects: number;
  institutions: string[];
  grantTypes: string[];
}

const NameCell = ({ value }: { value: string }) => {
  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
};

const ProjectsCell = ({ data }: { data: PIRow }) => {
  return (
    <span className="text-foreground">
      <span className="font-semibold">{data.totalProjects}</span>
      <span className="text-muted-foreground ml-1">
        ({data.projectsAsPi} / {data.projectsAsCoPi})
      </span>
    </span>
  );
};

const BadgeListCell = ({ value }: { value: string[] }) => {
  if (!value || value.length === 0) {
    return <span className="text-muted-foreground">N/A</span>;
  }
  
  const displayItems = value.slice(0, 2);
  const remaining = value.length - 2;
  
  return (
    <div className="flex flex-wrap gap-1">
      {displayItems.map((item, i) => (
        <Badge 
          key={i} 
          variant="outline" 
          className="bg-primary/10 text-primary border-primary/30 text-xs"
        >
          {item}
        </Badge>
      ))}
      {remaining > 0 && (
        <span className="text-muted-foreground text-xs">+{remaining}</span>
      )}
    </div>
  );
};

const fetchPIs = async (): Promise<PIRow[]> => {
  const { data, error } = await supabase.functions.invoke("nih-grants");
  
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  
  const grants = data?.data || [];
  
  // Aggregate PIs from grants
  const piMap = new Map<string, PIRow>();
  
  grants.forEach((grant: any) => {
    const allPis = grant.allPis?.split(/[,;]/).map((p: string) => p.trim()).filter(Boolean) || [];
    const contactPi = grant.contactPi?.trim();
    const grantType = grant.grantNumber?.match(/^[A-Z]\d+/)?.[0] || "";
    
    allPis.forEach((piName: string) => {
      if (!piName) return;
      
      const existing = piMap.get(piName) || {
        name: piName,
        email: "N/A",
        projectsAsPi: 0,
        projectsAsCoPi: 0,
        totalProjects: 0,
        institutions: [],
        grantTypes: [],
      };
      
      if (piName === contactPi) {
        existing.projectsAsPi++;
      } else {
        existing.projectsAsCoPi++;
      }
      existing.totalProjects++;
      
      if (grant.institution && !existing.institutions.includes(grant.institution)) {
        existing.institutions.push(grant.institution);
      }
      if (grantType && !existing.grantTypes.includes(grantType)) {
        existing.grantTypes.push(grantType);
      }
      
      piMap.set(piName, existing);
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
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 180,
      cellRenderer: NameCell,
      sort: "asc",
    },
    {
      field: "email",
      headerName: "Email",
      width: 120,
      minWidth: 100,
      cellRenderer: ({ value }: { value: string }) => (
        <span className="text-muted-foreground">{value}</span>
      ),
    },
    {
      headerName: "Projects (PI / Co-PI)",
      width: 160,
      minWidth: 140,
      cellRenderer: ProjectsCell,
      comparator: (valueA, valueB, nodeA, nodeB) => {
        return (nodeA.data?.totalProjects || 0) - (nodeB.data?.totalProjects || 0);
      },
    },
    {
      field: "grantTypes",
      headerName: "Grant Types",
      width: 160,
      minWidth: 140,
      cellRenderer: BadgeListCell,
    },
    {
      field: "institutions",
      headerName: "Institutions",
      flex: 1,
      minWidth: 200,
      cellRenderer: BadgeListCell,
    },
  ], []);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Principal Investigators</h1>
          <p className="text-muted-foreground mb-6">
            Browse all Principal Investigators and Co-PIs with their project associations
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Input
              type="text"
              placeholder="Filter by name..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="max-w-xs"
            />
            <span className="text-sm text-muted-foreground">
              {rowData.length} investigators
            </span>
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
            loadingOverlayComponent={() => (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading investigators...
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
