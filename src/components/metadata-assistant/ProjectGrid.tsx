import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useCallback } from "react";
import type { ColDef, RowClickedEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface ProjectGridProps {
  selectedGrant: string | null;
  onSelectGrant: (grantNumber: string) => void;
}

export function ProjectGrid({ selectedGrant, onSelectGrant }: ProjectGridProps) {
  const { data: rows } = useQuery({
    queryKey: ["projects-completeness-grid"],
    queryFn: async () => {
      const [grantsRes, projectsRes] = await Promise.all([
        supabase.from("grants").select("grant_number, title").order("grant_number"),
        supabase.from("projects").select("grant_number, metadata_completeness, study_species, use_approaches, use_sensors, keywords, last_edited_by, updated_at"),
      ]);
      const grants = grantsRes.data || [];
      const projects = projectsRes.data || [];
      const projMap = new Map(projects.map(p => [p.grant_number, p]));

      return grants.map(g => {
        const p = projMap.get(g.grant_number);
        return {
          grant_number: g.grant_number,
          title: g.title,
          completeness: p?.metadata_completeness ?? 0,
          species: (p?.study_species || []).length,
          approaches: (p?.use_approaches || []).length,
          sensors: (p?.use_sensors || []).length,
          keywords: (p?.keywords || []).length,
          last_edited_by: p?.last_edited_by || "—",
          updated_at: p?.updated_at || null,
        };
      });
    },
    refetchInterval: 5000,
  });

  const colDefs = useMemo<ColDef[]>(() => [
    {
      field: "grant_number",
      headerName: "Grant #",
      width: 140,
      cellClass: "font-mono text-xs",
    },
    {
      field: "title",
      headerName: "Project Title",
      flex: 1,
      minWidth: 200,
      cellClass: "text-xs",
    },
    {
      field: "completeness",
      headerName: "Complete",
      width: 110,
      cellRenderer: (params: any) => {
        const val = params.value || 0;
        const color = val >= 70 ? "hsl(140, 60%, 50%)" : val >= 40 ? "hsl(38, 90%, 50%)" : "hsl(0, 0%, 75%)";
        return `<div style="display:flex;align-items:center;gap:6px">
          <div style="width:40px;height:6px;background:hsl(220,15%,88%);border-radius:3px;overflow:hidden">
            <div style="width:${val}%;height:100%;background:${color};border-radius:3px"></div>
          </div>
          <span style="font-size:11px">${val}%</span>
        </div>`;
      },
      sort: "asc" as const,
    },
    { field: "species", headerName: "Species", width: 80, cellClass: "text-center text-xs" },
    { field: "approaches", headerName: "Approaches", width: 100, cellClass: "text-center text-xs" },
    { field: "sensors", headerName: "Sensors", width: 80, cellClass: "text-center text-xs" },
    { field: "keywords", headerName: "Keywords", width: 90, cellClass: "text-center text-xs" },
    { field: "last_edited_by", headerName: "Last Editor", width: 110, cellClass: "text-xs" },
  ], []);

  const onRowClicked = useCallback((event: RowClickedEvent) => {
    onSelectGrant(event.data.grant_number);
  }, [onSelectGrant]);

  const getRowClass = useCallback((params: any) => {
    return params.data?.grant_number === selectedGrant ? "ag-row-selected" : "";
  }, [selectedGrant]);

  return (
    <div className="ag-theme-alpine w-full" style={{ height: "220px" }}>
      <AgGridReact
        rowData={rows || []}
        columnDefs={colDefs}
        onRowClicked={onRowClicked}
        getRowClass={getRowClass}
        suppressCellFocus
        headerHeight={32}
        rowHeight={30}
        animateRows
        pagination={false}
      />
    </div>
  );
}
