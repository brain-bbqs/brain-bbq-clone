"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Brain, Zap, Cpu, Download, ExternalLink, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NerEntity {
  id: string;
  entity: string;
  label: string;
  marr_level: string;
  marr_level_name: string;
  ontology_id: string | null;
  ontology_label: string | null;
  marr_rationale: string | null;
  context_sentences: string[];
  paper_location: string[];
  judge_scores: number[];
  extraction_id: string;
  paper_title?: string;
  pmid?: string;
  grant_number?: string;
}

// Row structure for the pivoted grid (one row per grant)
interface GrantMarrRow {
  grant_number: string;
  paper_title: string;
  l1_entities: string[];
  l1_rationale: string;
  l2_entities: string[];
  l2_rationale: string;
  l3_entities: string[];
  l3_rationale: string;
}

interface ExtractionStats {
  total: number;
  completed: number;
  processing: number;
  failed: number;
}

const MarrLevelBadge = ({ value }: { value: string }) => {
  const config: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    L1: { 
      icon: <Brain className="h-3 w-3" />, 
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      label: "L1: Computational"
    },
    L2: { 
      icon: <Zap className="h-3 w-3" />, 
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      label: "L2: Algorithmic"
    },
    L3: { 
      icon: <Cpu className="h-3 w-3" />, 
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      label: "L3: Implementational"
    },
  };
  
  const { icon, color, label } = config[value] || config.L3;
  
  return (
    <Badge variant="outline" className={`${color} text-xs flex items-center gap-1 whitespace-nowrap`}>
      {icon}
      {label}
    </Badge>
  );
};

const LabelBadge = ({ value }: { value: string }) => {
  const colorMap: Record<string, string> = {
    ANATOMICAL_REGION: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    CELL_TYPE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    NEUROTRANSMITTER: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    CIRCUIT: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    COGNITIVE_FUNCTION: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    COMPUTATIONAL_PRINCIPLE: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    MEASUREMENT_TECHNIQUE: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    DISEASE_CONDITION: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  
  const color = colorMap[value] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  const displayLabel = value.replace(/_/g, " ").toLowerCase();
  
  return (
    <Badge variant="outline" className={`${color} text-xs capitalize`}>
      {displayLabel}
    </Badge>
  );
};

const OntologyLink = ({ value, data }: { value: string | null; data: NerEntity }) => {
  if (!value) return <span className="text-muted-foreground">—</span>;
  
  const getOntologyUrl = (id: string) => {
    if (id.startsWith("UBERON:")) return `http://purl.obolibrary.org/obo/${id.replace(":", "_")}`;
    if (id.startsWith("CL:")) return `http://purl.obolibrary.org/obo/${id.replace(":", "_")}`;
    if (id.startsWith("GO:")) return `http://purl.obolibrary.org/obo/${id.replace(":", "_")}`;
    return null;
  };
  
  const url = getOntologyUrl(value);
  
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-xs"
      >
        {value}
        <ExternalLink className="h-3 w-3 opacity-60" />
      </a>
    );
  }
  
  return <span className="font-mono text-xs">{value}</span>;
};

const Assertions = () => {
  const [entities, setEntities] = useState<NerEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState({ current: 0, total: 0, entities: 0 });
  const [quickFilterText, setQuickFilterText] = useState("");
  const [stats, setStats] = useState<ExtractionStats>({ total: 0, completed: 0, processing: 0, failed: 0 });
  const { toast } = useToast();
  const { user } = useAuth();

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    flex: 1,
    minWidth: 120,
    wrapText: true,
    autoHeight: true,
    cellStyle: { lineHeight: "1.5", padding: "8px" },
  }), []);

  // Pivot entities by grant into L1, L2, L3 columns
  const grantRows = useMemo<GrantMarrRow[]>(() => {
    const grantMap = new Map<string, GrantMarrRow>();
    
    for (const entity of entities) {
      const grantNum = entity.grant_number || "Unknown";
      
      if (!grantMap.has(grantNum)) {
        grantMap.set(grantNum, {
          grant_number: grantNum,
          paper_title: entity.paper_title || "",
          l1_entities: [],
          l1_rationale: "",
          l2_entities: [],
          l2_rationale: "",
          l3_entities: [],
          l3_rationale: "",
        });
      }
      
      const row = grantMap.get(grantNum)!;
      
      if (entity.marr_level === "L1") {
        row.l1_entities.push(entity.entity);
        if (entity.marr_rationale && !row.l1_rationale) {
          row.l1_rationale = entity.marr_rationale;
        }
      } else if (entity.marr_level === "L2") {
        row.l2_entities.push(entity.entity);
        if (entity.marr_rationale && !row.l2_rationale) {
          row.l2_rationale = entity.marr_rationale;
        }
      } else if (entity.marr_level === "L3") {
        row.l3_entities.push(entity.entity);
        if (entity.marr_rationale && !row.l3_rationale) {
          row.l3_rationale = entity.marr_rationale;
        }
      }
    }
    
    return Array.from(grantMap.values());
  }, [entities]);

  // Cell renderer for entity lists
  const EntityListCell = ({ value }: { value: string[] }) => {
    if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {value.slice(0, 5).map((e, i) => (
          <Badge key={i} variant="outline" className="text-xs bg-muted/50">
            {e}
          </Badge>
        ))}
        {value.length > 5 && (
          <Badge variant="outline" className="text-xs bg-muted/30">
            +{value.length - 5} more
          </Badge>
        )}
      </div>
    );
  };

  const columnDefs = useMemo<ColDef<GrantMarrRow>[]>(() => [
    {
      field: "grant_number",
      headerName: "Grant",
      width: 150,
      flex: 0,
      pinned: "left",
    },
    {
      field: "paper_title",
      headerName: "Title",
      minWidth: 200,
      flex: 1,
    },
    {
      headerName: "L1: Computational",
      children: [
        {
          field: "l1_entities",
          headerName: "Entities",
          minWidth: 180,
          cellRenderer: EntityListCell,
        },
        {
          field: "l1_rationale",
          headerName: "Rationale",
          minWidth: 200,
        },
      ],
    },
    {
      headerName: "L2: Algorithmic",
      children: [
        {
          field: "l2_entities",
          headerName: "Entities",
          minWidth: 180,
          cellRenderer: EntityListCell,
        },
        {
          field: "l2_rationale",
          headerName: "Rationale",
          minWidth: 200,
        },
      ],
    },
    {
      headerName: "L3: Implementational",
      children: [
        {
          field: "l3_entities",
          headerName: "Entities",
          minWidth: 180,
          cellRenderer: EntityListCell,
        },
        {
          field: "l3_rationale",
          headerName: "Rationale",
          minWidth: 200,
        },
      ],
    },
  ], []);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch entities with extraction metadata
      const { data: entitiesData, error: entitiesError } = await supabase
        .from("ner_entities")
        .select(`
          id,
          entity,
          label,
          marr_level,
          marr_level_name,
          ontology_id,
          ontology_label,
          marr_rationale,
          context_sentences,
          paper_location,
          judge_scores,
          extraction_id,
          ner_extractions (
            paper_title,
            pmid,
            grant_number
          )
        `)
        .order("created_at", { ascending: false });

      if (entitiesError) throw entitiesError;

      const formattedEntities: NerEntity[] = (entitiesData || []).map((e: any) => ({
        ...e,
        paper_title: e.ner_extractions?.paper_title,
        pmid: e.ner_extractions?.pmid,
        grant_number: e.ner_extractions?.grant_number,
      }));

      setEntities(formattedEntities);

      // Fetch extraction stats
      const { data: extractionsData } = await supabase
        .from("ner_extractions")
        .select("status");

      if (extractionsData) {
        setStats({
          total: extractionsData.length,
          completed: extractionsData.filter(e => e.status === "completed").length,
          processing: extractionsData.filter(e => e.status === "processing").length,
          failed: extractionsData.filter(e => e.status === "failed").length,
        });
      }

    } catch (err) {
      console.error("Error fetching entities:", err);
      toast({
        title: "Error loading entities",
        description: err instanceof Error ? err.message : "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const triggerExtraction = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to run NER extraction",
        variant: "destructive",
      });
      return;
    }

    setExtracting(true);
    setExtractionProgress({ current: 0, total: 0, entities: 0 });
    try {
      // First fetch grants from NIH (with abstracts)
      const { data: grantsData, error: grantsError } = await supabase.functions.invoke("nih-grants");

      if (grantsError) throw grantsError;

      const grants = grantsData?.data || [];
      
      // Extract NER from each grant's abstract (not publications)
      const grantsWithAbstracts = grants.filter((g: any) => g.abstract && g.abstract.trim().length > 0);

      if (grantsWithAbstracts.length === 0) {
        toast({
          title: "No abstracts found",
          description: "No grant abstracts available for extraction",
          variant: "destructive",
        });
        setExtracting(false);
        return;
      }

      // Format grants as papers for the NER extraction endpoint
      const grantAbstracts = grantsWithAbstracts.map((grant: any) => ({
        pmid: grant.grantNumber, // Using grant number as identifier
        title: grant.title,
        abstract: grant.abstract,
        grant_number: grant.grantNumber,
      }));

      toast({
        title: "Starting NER extraction",
        description: `Processing ${grantAbstracts.length} grant abstracts...`,
      });

      setExtractionProgress({ current: 0, total: grantAbstracts.length, entities: 0 });

      // Call NER extraction in batches
      const batchSize = 5;
      let totalExtracted = 0;

      for (let i = 0; i < grantAbstracts.length; i += batchSize) {
        const batch = grantAbstracts.slice(i, i + batchSize);
        
        const { data, error } = await supabase.functions.invoke("ner-extract", {
          body: { papers: batch },
        });

        if (error) {
          console.error("Batch extraction error:", error);
          continue;
        }

        totalExtracted += data?.summary?.total_entities || 0;
        const processed = Math.min(i + batchSize, grantAbstracts.length);

        // Update progress state
        setExtractionProgress({ 
          current: processed, 
          total: grantAbstracts.length, 
          entities: totalExtracted 
        });
      }

      toast({
        title: "Extraction complete",
        description: `Extracted ${totalExtracted} entities from ${grantAbstracts.length} grant abstracts`,
      });

      setExtractionProgress({ current: 0, total: 0, entities: 0 });

      // Refresh the grid
      await fetchEntities();

    } catch (err) {
      console.error("Extraction error:", err);
      toast({
        title: "Extraction failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
      setExtractionProgress({ current: 0, total: 0, entities: 0 });
    }
  }, [user, toast, fetchEntities]);

  const exportToCSV = useCallback(() => {
    if (grantRows.length === 0) return;

    const headers = ["Grant", "Title", "L1 Entities", "L1 Rationale", "L2 Entities", "L2 Rationale", "L3 Entities", "L3 Rationale"];
    const rows = grantRows.map(row => [
      row.grant_number,
      row.paper_title,
      row.l1_entities.join("; "),
      row.l1_rationale,
      row.l2_entities.join("; "),
      row.l2_rationale,
      row.l3_entities.join("; "),
      row.l3_rationale,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ner_by_grant.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${grantRows.length} grants with Marr level analysis`,
    });
  }, [grantRows, toast]);

  const clearExtractions = useCallback(async () => {
    if (!user) return;
    
    try {
      // Delete all entities first (due to foreign key constraint)
      const { error: entitiesError } = await supabase
        .from("ner_entities")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (entitiesError) throw entitiesError;

      // Delete all extractions for this user
      const { error: extractionsError } = await supabase
        .from("ner_extractions")
        .delete()
        .eq("extracted_by", user.id);

      if (extractionsError) throw extractionsError;

      toast({
        title: "Extractions cleared",
        description: "All NER extraction data has been removed",
      });

      // Refresh data
      await fetchEntities();
    } catch (err) {
      console.error("Error clearing extractions:", err);
      toast({
        title: "Error clearing data",
        description: err instanceof Error ? err.message : "Failed to clear extractions",
        variant: "destructive",
      });
    }
  }, [user, toast, fetchEntities]);

  useEffect(() => {
    fetchEntities();
  }, []);

  const levelCounts = useMemo(() => ({
    L1: entities.filter(e => e.marr_level === "L1").length,
    L2: entities.filter(e => e.marr_level === "L2").length,
    L3: entities.filter(e => e.marr_level === "L3").length,
  }), [entities]);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">NER Assertions</h1>
          <p className="text-muted-foreground mb-4">
            Named Entity Recognition extractions organized by Marr's levels of analysis.
          </p>
          
          {/* Stats Row */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
              <Brain className="h-4 w-4 text-blue-400" />
              <span className="text-sm">L1 Computational: <strong>{levelCounts.L1}</strong></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="text-sm">L2 Algorithmic: <strong>{levelCounts.L2}</strong></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
              <Cpu className="h-4 w-4 text-green-400" />
              <span className="text-sm">L3 Implementational: <strong>{levelCounts.L3}</strong></span>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              {grantRows.length} grants • {entities.length} entities
            </div>
          </div>

          {/* Controls */}
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
              onClick={fetchEntities}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>

            {user && (
              <Button
                onClick={triggerExtraction}
                disabled={extracting}
                className="bg-primary"
              >
                <Brain className="mr-2 h-4 w-4" />
                Run NER Extraction
              </Button>
            )}

            {/* Extraction Progress Bar */}
            {extracting && extractionProgress.total > 0 && (
              <div className="flex items-center gap-3 min-w-[300px]">
                <Progress 
                  value={(extractionProgress.current / extractionProgress.total) * 100} 
                  className="flex-1 h-2"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {extractionProgress.current}/{extractionProgress.total} • {extractionProgress.entities} entities
                </span>
              </div>
            )}

              <Button variant="outline" onClick={exportToCSV} disabled={grantRows.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>

            {user && entities.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all extractions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {entities.length} extracted entities and {stats.total} extractions. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearExtractions} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {!user && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border text-sm text-muted-foreground">
              Sign in to run NER extraction on papers.
            </div>
          )}
        </div>

        <div 
          className="ag-theme-quartz-dark rounded-lg border border-border overflow-hidden" 
          style={{ height: "calc(100vh - 320px)" }}
        >
          <AgGridReact<GrantMarrRow>
            rowData={grantRows}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
            animateRows={true}
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={[10, 25, 50]}
            suppressCellFocus={true}
            enableCellTextSelection={true}
            loadingOverlayComponent={() => (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading grants...
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default Assertions;
