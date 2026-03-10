import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Shield, MapPin, AlertTriangle, CheckCircle, Loader2, Sparkles, ExternalLink } from "lucide-react";

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

interface DetailProps {
  row: StateRiskRow;
  flags: BBQSFlags;
  sources?: { url: string; title: string }[];
  isScanning: boolean;
  onScan: () => void;
  scanStatus?: string;
}

function StateDetailPanel({ row, flags, sources, isScanning, onScan, scanStatus }: DetailProps) {
  const activeCategories = (Object.entries(flags) as [BBQSCategory, boolean][]).filter(([, v]) => v);
  const labels = activeCategories.map(([k]) => row.categories[k].label);
  const effective = mostRestrictive(labels);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{row.stateName}</h2>
          <span className="text-xs text-muted-foreground">({row.state})</span>
        </div>
        <p className="text-xs text-muted-foreground">Last reviewed: {row.last_reviewed}</p>
      </div>

      {/* Analyze button */}
      <Button
        onClick={onScan}
        disabled={isScanning}
        variant="outline"
        size="sm"
        className="w-full gap-2"
      >
        {isScanning ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Scanning law trackers…
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {scanStatus === "completed" ? "Re-analyze" : "Analyze"} {row.stateName} Laws
          </>
        )}
      </Button>

      <div className="p-3 rounded-lg bg-secondary/50 border border-border">
        <div className="text-xs text-muted-foreground mb-1 font-medium">Effective sharing rule for your dataset</div>
        <div className="flex items-center gap-2">
          {effective === "NO_EXTRA" ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4" style={{ color: RISK_LABEL_META[effective].color }} />
          )}
          <RuleBadge label={effective} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Category Details</h3>
        <div className="space-y-3">
          {activeCategories.map(([key]) => {
            const cat = row.categories[key];
            return (
              <div key={key} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{CATEGORY_LABELS[key]}</span>
                  <RuleBadge label={cat.label} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{cat.note}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Sources</h3>
          <div className="space-y-1">
            {sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{s.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
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

  // Fetch DB rows
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
        categories: Record<string, { label: RiskLabel; note: string }>;
        sources: { url: string; title: string }[];
        scan_status: string;
      }[];
    },
  });

  // Merge DB rows over fallback
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

  const selectedRow = selectedState ? matrix.find((r) => r.state === selectedState) : null;
  const selectedDbRow = selectedState ? dbRows?.find((r) => r.state === selectedState) : null;

  const toggleFlag = (key: BBQSCategory) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleScan = useCallback(async () => {
    if (!selectedRow) return;
    setIsScanning(true);

    try {
      const { data, error } = await supabase.functions.invoke("state-privacy-scan", {
        body: { state: selectedRow.state, stateName: selectedRow.stateName },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Scan failed",
          description: data.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Scan complete",
          description: `${selectedRow.stateName} privacy rules updated from IAPP/NCSL trackers.`,
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
  }, [selectedRow, toast, queryClient]);

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
          <p className="text-muted-foreground max-w-2xl">
            Jurisdictional risk matrix showing how state-level privacy laws affect BBQS neurodata sharing.
            Toggle your dataset's data types below, then click a state and hit <strong>Analyze</strong> to scan IAPP & NCSL law trackers.
          </p>
        </div>

        {/* Data type flag toggles */}
        <Card className="mb-6 border-border">
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-foreground mb-3">Dataset Data Types</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
          </CardContent>
        </Card>

        {/* Map + Detail layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-border">
              <CardContent className="p-4">
                <USStateMap
                  matrix={matrix}
                  flags={flags}
                  selectedState={selectedState}
                  onSelectState={setSelectedState}
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-border sticky top-20">
              <CardContent className="p-5">
                {selectedRow ? (
                  <StateDetailPanel
                    row={selectedRow}
                    flags={flags}
                    sources={selectedDbRow?.sources}
                    isScanning={isScanning}
                    onScan={handleScan}
                    scanStatus={selectedDbRow?.scan_status}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Click a state on the map to see BBQS sharing rules.</p>
                    <p className="text-xs mt-2 opacity-60">Then hit Analyze to scan live law trackers.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
