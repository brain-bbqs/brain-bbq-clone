import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useCallback, useRef, useState } from "react";
import type { ColDef, RowClickedEvent, ICellRendererParams } from "ag-grid-community";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface ProjectGridProps {
  selectedGrant: string | null;
  onSelectGrant: (grantNumber: string) => void;
}

function CompletenessRenderer(params: ICellRendererParams) {
  const val = params.value || 0;
  // Navy-to-teal gradient: low = muted slate, mid = primary navy, high = teal/emerald
  const color =
    val >= 70
      ? "hsl(168, 55%, 42%)"
      : val >= 40
        ? "hsl(222, 47%, 35%)"
        : "hsl(220, 15%, 75%)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 48, height: 6, background: "hsl(220,15%,88%)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${val}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: val >= 70 ? "hsl(168,55%,36%)" : undefined }}>{val}%</span>
    </div>
  );
}

export function ProjectGrid({ selectedGrant, onSelectGrant }: ProjectGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [searchText, setSearchText] = useState("");

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
      sort: "desc" as const,
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

  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchText(val);
    gridRef.current?.api?.setGridOption("quickFilterText", val);
  }, []);

  return (
    <div className="space-y-0">
      {/* Search bar */}
      <div className="px-3 py-2 border-b border-border bg-card">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={onSearchChange}
            placeholder="Filter projects…"
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="ag-theme-alpine w-full">
        <AgGridReact
          ref={gridRef}
          rowData={rows || []}
          columnDefs={colDefs}
          onRowClicked={onRowClicked}
          getRowClass={getRowClass}
          suppressCellFocus
          rowSelection="single"
          headerHeight={32}
          rowHeight={30}
          animateRows
          domLayout="autoHeight"
          pagination
          paginationPageSize={10}
        />
      </div>
    </div>
  );
}
