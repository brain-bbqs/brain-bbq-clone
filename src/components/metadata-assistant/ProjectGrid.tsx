import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useCallback } from "react";
import type { ColDef, RowClickedEvent, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface ProjectGridProps {
  selectedGrant: string | null;
  onSelectGrant: (grantNumber: string) => void;
}

function CompletenessRenderer(params: ICellRendererParams) {
  const val = params.value || 0;
  const color = val >= 70 ? "hsl(140, 60%, 50%)" : val >= 40 ? "hsl(38, 90%, 50%)" : "hsl(220, 15%, 75%)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 48, height: 6, background: "hsl(220,15%,88%)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${val}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11 }}>{val}%</span>
    </div>
  );
}

export function ProjectGrid({ selectedGrant, onSelectGrant }: ProjectGridProps) {
  const { data: rows } = useQuery({
    queryKey: ["projects-completeness-grid"],
    queryFn: async () => {
      const [grantsRes, projectsRes] = await Promise.all([
        supabase.from("grants").select("grant_number, title").order("grant_number"),
        supabase.from("projects").select("grant_number, last_edited_by, study_species, use_approaches, use_sensors, produce_data_modality, produce_data_type, use_analysis_types, use_analysis_method, develope_software_type, develope_hardware_type, keywords, website, study_human"),
      ]);
      const grants = grantsRes.data || [];
      const projects = projectsRes.data || [];
      const projMap = new Map(projects.map(p => [p.grant_number, p]));

      const metaFields = ["study_species","use_approaches","use_sensors","produce_data_modality","produce_data_type","use_analysis_types","use_analysis_method","develope_software_type","develope_hardware_type","keywords","website","study_human"] as const;

      return grants.map(g => {
        const p = projMap.get(g.grant_number) as any;
        let filled = 0;
        if (p) {
          for (const f of metaFields) {
            const v = p[f];
            if (v === null || v === undefined) continue;
            if (Array.isArray(v) && v.length === 0) continue;
            if (typeof v === "string" && v.trim() === "") continue;
            // boolean false is a valid value (e.g. study_human = false), counts as filled
            filled++;
          }
        }
        return {
          grant_number: g.grant_number,
          title: g.title,
          completeness: p ? Math.round((filled / metaFields.length) * 100) : 0,
          last_edited_by: p?.last_edited_by || "—",
        };
      });
    },
    refetchInterval: 5000,
  });

  const colDefs = useMemo<ColDef[]>(() => [
    {
      field: "title",
      headerName: "Project",
      flex: 1,
      minWidth: 250,
      cellClass: "text-xs",
    },
    {
      field: "completeness",
      headerName: "Completeness",
      width: 130,
      cellRenderer: CompletenessRenderer,
      sort: "asc" as const,
    },
    {
      field: "last_edited_by",
      headerName: "Last Editor",
      width: 120,
      cellClass: "text-xs text-muted-foreground",
    },
  ], []);

  const onRowClicked = useCallback((event: RowClickedEvent) => {
    onSelectGrant(event.data.grant_number);
  }, [onSelectGrant]);

  const getRowClass = useCallback((params: any) => {
    return params.data?.grant_number === selectedGrant ? "ag-row-selected" : "";
  }, [selectedGrant]);

  return (
    <div className="ag-theme-alpine w-full">
      <AgGridReact
        rowData={rows || []}
        columnDefs={colDefs}
        onRowClicked={onRowClicked}
        getRowClass={getRowClass}
        suppressCellFocus
        headerHeight={32}
        rowHeight={30}
        animateRows
        domLayout="autoHeight"
        pagination
        paginationPageSize={20}
      />
    </div>
  );
}
