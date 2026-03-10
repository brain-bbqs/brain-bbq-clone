import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import { PageMeta } from "@/components/PageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { USStateMap } from "@/components/diagrams/USStateMap";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  getFullMatrix,
  mostRestrictive,
  CATEGORY_LABELS,
  RISK_LABEL_META,
  type BBQSFlags,
  type BBQSCategory,
  type RiskLabel,
  type StateRiskRow,
} from "@/data/state-privacy-matrix";
import { Shield, AlertTriangle, CheckCircle, Loader2, Sparkles, ExternalLink } from "lucide-react";

function RuleBadge({ label }: { label: RiskLabel }) {
  const meta = RISK_LABEL_META[label];
  return (
    <Badge
      className="text-[11px] font-medium border-0"
      style={{ backgroundColor: meta.color, color: meta.score >= 2 ? "#fff" : "#1a1a1a" }}
    >
      {meta.text}
    </Badge>
  );
}

// Flatten matrix rows into AG Grid rows
interface GridRow {
  state: string;
  stateName: string;
  last_reviewed: string;
  category: string;
  categoryKey: BBQSCategory;
  label: RiskLabel;
  note: string;
  statute: string;
  conflict: string;
  effectiveLabel: RiskLabel;
  sources: { url: string; title: string }[];
}

function RuleBadgeRenderer({ value }: { value: RiskLabel }) {
  if (!value) return null;
  const meta = RISK_LABEL_META[value];
  if (!meta) return <span>{value}</span>;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ backgroundColor: meta.color, color: meta.score >= 2 ? "#fff" : "#1a1a1a" }}
    >
      {meta.text}
    </span>
  );
}

function EffectiveBadgeRenderer({ value, data }: { value: RiskLabel; data: GridRow }) {
  if (!value) return null;
  const meta = RISK_LABEL_META[value];
  if (!meta) return <span>{value}</span>;
  const Icon = value === "NO_EXTRA" ? CheckCircle : AlertTriangle;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
        style={{ backgroundColor: meta.color, color: meta.score >= 2 ? "#fff" : "#1a1a1a" }}
      >
        {meta.text}
      </span>
    </span>
  );
}

export default function StatePrivacyMap() {
  const fallbackMatrix = useMemo(() => getFullMatrix(), []);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [flags, setFlags] = useState<BBQSFlags>({
    brain_behavior: true,
    consumer_health: true,
    reproductive: false,
    minors: false,
    biometric_neuro: true,
  });

  const { data: dbRows } = useQuery({
    queryKey: ["state-privacy-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("state_privacy_rules")
        .select("state, state_name, last_reviewed, categories, sources, scan_status");
      if (error) throw error;
      return data as {
        state: string;
        state_name: string;
        last_reviewed: string;
        categories: Record<string, { label: RiskLabel; note: string; statute?: string; conflict?: string }>;
        sources: { url: string; title: string }[];
        scan_status: string;
      }[];
    },
  });

  const matrix = useMemo(() => {
    if (!dbRows?.length) return fallbackMatrix;
    const dbMap = new Map(dbRows.map((r) => [r.state, r]));
    return fallbackMatrix.map((row) => {
      const dbRow = dbMap.get(row.state);
      if (dbRow) {
        return {
          ...row,
          last_reviewed: dbRow.last_reviewed,
          categories: dbRow.categories as StateRiskRow["categories"],
        };
      }
      return row;
    });
  }, [fallbackMatrix, dbRows]);

  // Build AG Grid rows from selected state or all states
  const gridRows = useMemo(() => {
    const stateRows = selectedState
      ? matrix.filter((r) => r.state === selectedState)
      : matrix;

    const rows: GridRow[] = [];
    const activeFlags = (Object.entries(flags) as [BBQSCategory, boolean][]).filter(([, v]) => v);

    for (const row of stateRows) {
      const dbRow = dbRows?.find((r) => r.state === row.state);
      const labels = activeFlags.map(([k]) => row.categories[k].label);
      const effective = mostRestrictive(labels);

      for (const [key] of activeFlags) {
        const cat = row.categories[key];
        rows.push({
          state: row.state,
          stateName: row.stateName,
          last_reviewed: row.last_reviewed,
          category: CATEGORY_LABELS[key],
          categoryKey: key,
          label: cat.label,
          note: cat.note,
          statute: cat.statute || "",
          conflict: cat.conflict || "",
          effectiveLabel: effective,
          sources: dbRow?.sources || [],
        });
      }
    }
    return rows;
  }, [matrix, selectedState, flags, dbRows]);

  const columnDefs = useMemo<ColDef<GridRow>[]>(() => [
    {
      field: "stateName",
      headerName: "State",
      width: 140,
      flex: 0,
      pinned: "left",
      sort: "asc",
    },
    {
      field: "category",
      headerName: "Data Category",
      width: 200,
      flex: 0,
    },
    {
      field: "label",
      headerName: "Risk Level",
      width: 160,
      flex: 0,
      cellRenderer: RuleBadgeRenderer,
      comparator: (a: RiskLabel, b: RiskLabel) =>
        (RISK_LABEL_META[a]?.score ?? 0) - (RISK_LABEL_META[b]?.score ?? 0),
    },
    {
      field: "statute",
      headerName: "Statute / Section",
      minWidth: 200,
      flex: 1,
      cellRenderer: ({ value }: { value: string }) => {
        if (!value) return <span className="text-muted-foreground">—</span>;
        return <span className="font-mono text-xs">{value}</span>;
      },
    },
    {
      field: "conflict",
      headerName: "BBQS Conflict",
      minWidth: 250,
      flex: 1.5,
      cellRenderer: ({ value }: { value: string }) => {
        if (!value) return <span className="text-muted-foreground">—</span>;
        return <span className="text-xs">{value}</span>;
      },
    },
    {
      field: "note",
      headerName: "Legal Note",
      minWidth: 300,
      flex: 2,
    },
    {
      field: "last_reviewed",
      headerName: "Reviewed",
      width: 110,
      flex: 0,
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    wrapText: true,
    autoHeight: true,
    cellStyle: { lineHeight: "1.5", padding: "6px" },
    unSortIcon: true,
  }), []);

  const toggleFlag = (key: BBQSCategory) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleScan = useCallback(async () => {
    const row = selectedState ? matrix.find((r) => r.state === selectedState) : null;
    if (!row) return;
    setIsScanning(true);

    try {
      const { data, error } = await supabase.functions.invoke("state-privacy-scan", {
        body: { state: row.state, stateName: row.stateName },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Scan failed", description: data.error, variant: "destructive" });
      } else {
        toast({
          title: "Scan complete",
          description: `${row.stateName} privacy rules updated from IAPP/NCSL trackers.`,
        });
        queryClient.invalidateQueries({ queryKey: ["state-privacy-rules"] });
      }
    } catch (e) {
      console.error("Scan error:", e);
      toast({
        title: "Scan failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  }, [selectedState, matrix, toast, queryClient]);

  const selectedRow = selectedState ? matrix.find((r) => r.state === selectedState) : null;
  const selectedDbRow = selectedState ? dbRows?.find((r) => r.state === selectedState) : null;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="State Privacy Map — BBQS"
        description="Interactive US state privacy risk matrix for BBQS neurodata sharing compliance."
      />
      <div className="px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">State Privacy Map</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Jurisdictional risk matrix showing how state-level privacy laws affect BBQS neurodata sharing.
            Toggle your dataset's data types below, then click a state and hit <strong>Analyze</strong> to scan IAPP & NCSL law trackers.
          </p>
        </div>

        {/* Data type flag toggles */}
        <Card className="mb-6 border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-foreground mb-3">Dataset Data Types</div>
                <div className="flex flex-wrap gap-4">
                  {(Object.entries(CATEGORY_LABELS) as [BBQSCategory, string][]).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        id={`flag-${key}`}
                        checked={flags[key]}
                        onCheckedChange={() => toggleFlag(key)}
                      />
                      <Label htmlFor={`flag-${key}`} className="text-xs cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {selectedState && selectedRow && (
                <Button
                  onClick={handleScan}
                  disabled={isScanning}
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Scanning…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      {selectedDbRow?.scan_status === "completed" ? "Re-analyze" : "Analyze"} {selectedRow.stateName}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Full-width map */}
        <Card className="mb-6 border-border">
          <CardContent className="p-4">
            <USStateMap
              matrix={matrix}
              flags={flags}
              selectedState={selectedState}
              onSelectState={setSelectedState}
            />
          </CardContent>
        </Card>

        {/* Sources bar for selected state */}
        {selectedDbRow?.sources && selectedDbRow.sources.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Sources:</span>
            {selectedDbRow.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[200px]">{s.title}</span>
              </a>
            ))}
          </div>
        )}

        {/* AG Grid table */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedState && selectedRow
                  ? `${selectedRow.stateName} — Legal Detail`
                  : "All States — Legal Detail"}
              </h2>
              {selectedState && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedState(null)} className="text-xs">
                  Show all states
                </Button>
              )}
            </div>
            <div
              className="ag-theme-quartz-dark rounded-lg border border-border overflow-hidden"
              style={{ height: Math.min(600, gridRows.length * 56 + 56) }}
            >
              <AgGridReact<GridRow>
                rowData={gridRows}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                animateRows
                suppressCellFocus
                enableCellTextSelection
                paginationPageSize={100}
                pagination={gridRows.length > 100}
                domLayout={gridRows.length <= 10 ? "autoHeight" : "normal"}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
