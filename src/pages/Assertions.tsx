"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Brain, Zap, Cpu, Download, ExternalLink } from "lucide-react";
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
      label: "Computational"
    },
    L2: { 
      icon: <Zap className="h-3 w-3" />, 
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      label: "Algorithmic"
    },
    L3: { 
      icon: <Cpu className="h-3 w-3" />, 
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      label: "Implementational"
    },
  };
  
  const { icon, color, label } = config[value] || config.L3;
  
  return (
    <Badge variant="outline" className={`${color} text-xs flex items-center gap-1`}>
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

const ConfidenceCell = ({ data }: { data: NerEntity }) => {
  const score = data.judge_scores?.[0] ?? 0;
  const color = score >= 0.8 ? "text-green-400" : score >= 0.5 ? "text-yellow-400" : "text-red-400";
  return <span className={`font-mono ${color}`}>{(score * 100).toFixed(0)}%</span>;
};

const Assertions = () => {
  const [entities, setEntities] = useState<NerEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
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
    minWidth: 100,
    wrapText: true,
    autoHeight: true,
    cellStyle: { lineHeight: "1.5", padding: "8px" },
  }), []);

  const columnDefs = useMemo<ColDef<NerEntity>[]>(() => [
    {
      field: "entity",
      headerName: "Entity",
      minWidth: 150,
      cellStyle: { fontWeight: 500 },
    },
    {
      field: "label",
      headerName: "Type",
      width: 180,
      flex: 0,
      cellRenderer: LabelBadge,
    },
    {
      field: "marr_level",
      headerName: "Marr Level",
      width: 150,
      flex: 0,
      cellRenderer: MarrLevelBadge,
    },
    {
      field: "ontology_id",
      headerName: "Ontology ID",
      width: 140,
      flex: 0,
      cellRenderer: OntologyLink,
    },
    {
      field: "marr_rationale",
      headerName: "Rationale",
      minWidth: 200,
      flex: 2,
    },
    {
      field: "pmid",
      headerName: "PMID",
      width: 100,
      flex: 0,
      cellRenderer: ({ value }: { value: string }) => value ? (
        <a
          href={`https://pubmed.ncbi.nlm.nih.gov/${value}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {value}
        </a>
      ) : "—",
    },
    {
      field: "grant_number",
      headerName: "Grant",
      width: 130,
      flex: 0,
    },
    {
      headerName: "Confidence",
      width: 100,
      flex: 0,
      cellRenderer: ConfidenceCell,
      valueGetter: (params) => params.data?.judge_scores?.[0] ?? 0,
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
    try {
      // First fetch papers from NIH grants
      const { data: grantsData, error: grantsError } = await supabase.functions.invoke("nih-grants");

      if (grantsError) throw grantsError;

      const grants = grantsData?.data || [];
      
      // Collect all grant publications with metadata
      const publications: { pmid: string; title: string; abstract: string; grant_number: string }[] = [];
      
      for (const grant of grants) {
        for (const pub of grant.publications || []) {
          // Using publication metadata as context since full abstracts require PubMed fetch
          if (pub.pmid && pub.title) {
            publications.push({
              pmid: pub.pmid,
              title: pub.title,
              abstract: `This paper titled "${pub.title}" was published in ${pub.journal || "unknown journal"} in ${pub.year || "unknown year"}. Authors: ${pub.authors || "unknown"}.`,
              grant_number: grant.grantNumber,
            });
          }
        }
      }

      if (publications.length === 0) {
        toast({
          title: "No publications found",
          description: "No grant publications available for extraction",
          variant: "destructive",
        });
        setExtracting(false);
        return;
      }

      toast({
        title: "Starting NER extraction",
        description: `Processing ${publications.length} grant publications...`,
      });

      // Call NER extraction in batches
      const batchSize = 5;
      let totalExtracted = 0;

      for (let i = 0; i < publications.length; i += batchSize) {
        const batch = publications.slice(i, i + batchSize);
        
        const { data, error } = await supabase.functions.invoke("ner-extract", {
          body: { papers: batch },
        });

        if (error) {
          console.error("Batch extraction error:", error);
          continue;
        }

        totalExtracted += data?.summary?.total_entities || 0;

        // Update progress
        toast({
          title: "Extraction progress",
          description: `Processed ${Math.min(i + batchSize, publications.length)}/${publications.length} grant publications (${totalExtracted} entities)`,
        });
      }

      toast({
        title: "Extraction complete",
        description: `Extracted ${totalExtracted} entities from ${publications.length} grant publications`,
      });

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
    }
  }, [user, toast, fetchEntities]);

  const exportToCSV = useCallback(() => {
    if (entities.length === 0) return;

    const headers = ["Entity", "Type", "Marr Level", "Ontology ID", "Rationale", "PMID", "Grant", "Confidence"];
    const rows = entities.map(e => [
      e.entity,
      e.label,
      `${e.marr_level} - ${e.marr_level_name}`,
      e.ontology_id || "",
      e.marr_rationale || "",
      e.pmid || "",
      e.grant_number || "",
      ((e.judge_scores?.[0] || 0) * 100).toFixed(0) + "%"
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ner_entities.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${entities.length} entities`,
    });
  }, [entities, toast]);

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
              {stats.completed} extractions • {entities.length} entities
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
                {extracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Run NER Extraction
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={entities.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
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
          <AgGridReact<NerEntity>
            rowData={entities}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
            animateRows={true}
            pagination={true}
            paginationPageSize={50}
            paginationPageSizeSelector={[25, 50, 100, 200]}
            suppressCellFocus={true}
            enableCellTextSelection={true}
            loadingOverlayComponent={() => (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading entities...
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default Assertions;
