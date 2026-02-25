"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { History, Search, Loader2, User, Bot, MessageSquare } from "lucide-react";
import { useState, useMemo, useCallback, useRef } from "react";
import { format } from "date-fns";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "@/styles/ag-grid-theme.css";

interface EditRow {
  id: string;
  created_at: string;
  grant_number: string;
  field_name: string;
  edited_by: string;
  old_value: any;
  new_value: any;
  chat_context: any;
  project_title?: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

const TimestampCell = ({ value }: ICellRendererParams) => {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-xs font-mono text-muted-foreground">
      {format(new Date(value), "MMM d, yyyy HH:mm")}
    </span>
  );
};

const ProjectCell = ({ value, data }: ICellRendererParams) => {
  return (
    <div className="text-xs leading-tight py-1">
      <span className="font-medium text-foreground truncate block max-w-[200px]">
        {data.project_title || data.grant_number}
      </span>
      {data.project_title && (
        <span className="text-muted-foreground text-[10px]">{data.grant_number}</span>
      )}
    </div>
  );
};

const FieldCell = ({ value }: ICellRendererParams) => {
  const fieldColors: Record<string, string> = {
    study_species: "bg-emerald-100 text-emerald-800 border-emerald-200",
    use_approaches: "bg-blue-100 text-blue-800 border-blue-200",
    use_sensors: "bg-violet-100 text-violet-800 border-violet-200",
    produce_data_modality: "bg-amber-100 text-amber-800 border-amber-200",
    produce_data_type: "bg-orange-100 text-orange-800 border-orange-200",
    use_analysis_types: "bg-cyan-100 text-cyan-800 border-cyan-200",
    use_analysis_method: "bg-teal-100 text-teal-800 border-teal-200",
    keywords: "bg-pink-100 text-pink-800 border-pink-200",
    develope_software_type: "bg-indigo-100 text-indigo-800 border-indigo-200",
    develope_hardware_type: "bg-rose-100 text-rose-800 border-rose-200",
  };
  const color = fieldColors[value] || "bg-secondary text-secondary-foreground border-border";
  return (
    <Badge variant="outline" className={`text-[10px] font-mono ${color}`}>
      {value}
    </Badge>
  );
};

const EditorCell = ({ value }: ICellRendererParams) => {
  const isAI = value === "ai-assistant";
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {isAI ? (
        <Bot className="h-3.5 w-3.5 text-primary" />
      ) : (
        <User className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className={isAI ? "text-primary font-medium" : "text-muted-foreground"}>{value}</span>
    </div>
  );
};

const ValueCell = ({ value, data, colDef }: ICellRendererParams) => {
  const isOld = colDef?.field === "old_value";
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/40 text-xs italic">—</span>;
  }
  const items = Array.isArray(value) ? value : [value];
  return (
    <div className="flex flex-wrap gap-1 py-1 max-w-[180px]">
      {items.slice(0, 4).map((v: any, i: number) => (
        <Badge
          key={i}
          variant={isOld ? "secondary" : "default"}
          className={`text-[10px] ${isOld ? "line-through opacity-60" : ""}`}
        >
          {typeof v === "object" ? JSON.stringify(v) : String(v)}
        </Badge>
      ))}
      {items.length > 4 && (
        <Badge variant="outline" className="text-[10px] text-muted-foreground">+{items.length - 4}</Badge>
      )}
    </div>
  );
};

const ChatContextCell = ({ data }: ICellRendererParams) => {
  const chatContext: ChatMessage[] = data.chat_context;
  if (!chatContext || !Array.isArray(chatContext) || chatContext.length === 0) {
    return <span className="text-muted-foreground/40 text-xs italic">—</span>;
  }

  const userMessage = chatContext.find((m: ChatMessage) => m.role === "user");
  const preview = userMessage?.content?.slice(0, 40) || "Chat context";

  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer max-w-full">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{preview}{(userMessage?.content?.length || 0) > 40 ? "…" : ""}</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="left" align="start" className="w-80 p-0 z-[9999]">
        <div className="px-3 py-2 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3" /> Chat That Triggered This Edit
          </p>
        </div>
        <div className="px-3 py-2 space-y-2 max-h-60 overflow-y-auto">
          {chatContext.map((msg: ChatMessage, i: number) => (
            <div key={i} className={`text-xs ${msg.role === "user" ? "text-foreground" : "text-muted-foreground"}`}>
              <span className={`inline-block text-[10px] uppercase tracking-wide font-semibold mb-0.5 ${
                msg.role === "user" ? "text-primary" : "text-muted-foreground"
              }`}>
                {msg.role === "user" ? "You" : "Assistant"}
              </span>
              <p className="leading-relaxed">{msg.content}</p>
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default function DataProvenance() {
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilter, setQuickFilter] = useState("");

  const { data: history, isLoading } = useQuery({
    queryKey: ["edit-history-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("edit_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
  });

  const { data: grants } = useQuery({
    queryKey: ["grants-titles-provenance"],
    queryFn: async () => {
      const { data } = await supabase.from("grants").select("grant_number, title");
      return data || [];
    },
  });

  const grantMap = useMemo(() => {
    return new Map((grants || []).map(g => [g.grant_number, g.title]));
  }, [grants]);

  const rowData = useMemo<EditRow[]>(() => {
    if (!history) return [];
    return history.map((h: any) => ({
      ...h,
      project_title: grantMap.get(h.grant_number) || "",
    }));
  }, [history, grantMap]);

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: "created_at",
      headerName: "Timestamp",
      width: 160,
      cellRenderer: TimestampCell,
      sort: "desc" as const,
    },
    {
      field: "grant_number",
      headerName: "Project",
      flex: 1,
      minWidth: 200,
      cellRenderer: ProjectCell,
    },
    {
      field: "field_name",
      headerName: "Field",
      width: 180,
      cellRenderer: FieldCell,
    },
    {
      field: "edited_by",
      headerName: "Editor",
      width: 130,
      cellRenderer: EditorCell,
    },
    {
      field: "old_value",
      headerName: "Old Value",
      width: 180,
      cellRenderer: ValueCell,
    },
    {
      field: "new_value",
      headerName: "New Value",
      width: 180,
      cellRenderer: ValueCell,
    },
    {
      field: "chat_context",
      headerName: "Chat",
      width: 200,
      cellRenderer: ChatContextCell,
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    suppressMovable: true,
    unSortIcon: true,
  }), []);

  const onFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuickFilter(e.target.value);
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 shrink-0 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <History className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-tight">Data Provenance</h1>
              <p className="text-[11px] text-muted-foreground">
                Track all metadata changes across the consortium
              </p>
            </div>
            <Badge variant="secondary" className="text-xs ml-2">
              {rowData.length} edits
            </Badge>
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={quickFilter}
              onChange={onFilterChange}
              placeholder="Filter edits..."
              className="pl-9 h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* AG Grid */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="ag-theme-alpine h-full w-full">
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              quickFilterText={quickFilter}
              animateRows
              pagination
              paginationPageSize={25}
              paginationPageSizeSelector={[10, 25, 50, 100]}
              suppressCellFocus
              enableCellTextSelection
              rowHeight={40}
              headerHeight={36}
            />
          </div>
        )}
      </div>
    </div>
  );
}
