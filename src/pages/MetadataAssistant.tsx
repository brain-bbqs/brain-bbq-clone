import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSelector } from "@/components/metadata/ProjectSelector";
import { MetadataPanel } from "@/components/metadata/MetadataPanel";
import { MetadataToolbar } from "@/components/metadata/MetadataToolbar";
import { useMetadataEditor } from "@/hooks/useMetadataEditor";
import { MessageCircle, ClipboardList } from "lucide-react";

interface Grant {
  id: string;
  grant_number: string;
  title: string;
  abstract: string | null;
  award_amount: number | null;
  fiscal_year: number | null;
  nih_link: string | null;
}

export default function MetadataAssistant() {
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const queryClient = useQueryClient();

  const { data: grants = [], isLoading: grantsLoading } = useQuery({
    queryKey: ["metadata-grants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grants")
        .select("id, grant_number, title, abstract, award_amount, fiscal_year, nih_link")
        .order("grant_number");
      if (error) throw error;
      return data as Grant[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: metadata } = useQuery({
    queryKey: ["project-metadata", selectedGrant?.grant_number],
    queryFn: async () => {
      if (!selectedGrant) return null;
      const { data, error } = await supabase
        .from("project_metadata")
        .select("*")
        .eq("grant_number", selectedGrant.grant_number)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, any> | null;
    },
    enabled: !!selectedGrant,
  });

  const { data: investigators = [] } = useQuery({
    queryKey: ["metadata-investigators", selectedGrant?.grant_number],
    queryFn: async () => {
      if (!selectedGrant) return [];
      const { data, error } = await supabase
        .from("grant_investigators")
        .select("role, investigator_id, investigators(name)")
        .eq("grant_number", selectedGrant.grant_number);
      if (error) throw error;
      return (data || []).map((row: any) => ({
        name: row.investigators?.name || "Unknown",
        role: row.role || "co_pi",
      }));
    },
    enabled: !!selectedGrant,
  });

  const editor = useMetadataEditor({
    grantNumber: selectedGrant?.grant_number || "",
    grantId: selectedGrant?.id || "",
    originalMetadata: metadata,
    onCommitSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-metadata", selectedGrant?.grant_number] });
    },
  });

  // Compute live completeness
  const completeness = useMemo(() => {
    const checkFields = [
      "study_species", "use_approaches", "use_sensors", "produce_data_modality",
      "produce_data_type", "use_analysis_types", "use_analysis_method",
      "develope_software_type", "develope_hardware_type", "keywords", "website",
    ];
    const filled = checkFields.filter(f => {
      const v = editor.getValue(f);
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "string") return v.trim().length > 0;
      return v !== null && v !== undefined;
    });
    return Math.round((filled.length / checkFields.length) * 100);
  }, [editor]);

  const handleSelectGrant = (grant: Grant) => {
    editor.discardAll();
    setSelectedGrant(grant);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Metadata Assistant</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Browse and edit project metadata aligned with the{" "}
          <a href="https://sensein.group/bbqs_projects_models/index_bbqs_projects_metadata/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            BBQS Projects Metadata Schema
          </a>.
          Click the pencil icon to edit fields. Modified fields are highlighted in yellow.
        </p>
      </div>

      <div className="mb-6">
        <ProjectSelector
          grants={grants}
          selectedGrantId={selectedGrant?.id || null}
          onSelect={handleSelectGrant}
          isLoading={grantsLoading}
        />
      </div>

      {selectedGrant ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: AI assistant placeholder */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">AI Assistant</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Coming in Phase 3 — an AI assistant that helps you review, improve, and connect project metadata.
              </p>
              <ul className="mt-4 text-xs text-muted-foreground space-y-1 text-left">
                <li>• Review and improve metadata fields</li>
                <li>• Suggest missing information</li>
                <li>• Find related projects</li>
                <li>• Check schema completeness</li>
              </ul>
            </div>
          </div>

          {/* Right: metadata panel */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-4">
            <MetadataToolbar
              hasChanges={editor.hasChanges}
              changeCount={Object.keys(editor.changes).length}
              onDiscard={editor.discardAll}
              onCommit={editor.commitChanges}
              isCommitting={editor.isCommitting}
            />
            <MetadataPanel
              grant={selectedGrant}
              investigators={investigators}
              getValue={editor.getValue}
              setFieldValue={editor.setFieldValue}
              changedFields={editor.changedFields}
              completeness={completeness}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-muted/50 rounded-full mb-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Select a Project</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Choose a grant from the selector above to view and edit its metadata fields.
          </p>
          {!grantsLoading && (
            <p className="text-xs text-muted-foreground mt-2">{grants.length} grants available</p>
          )}
        </div>
      )}
    </div>
  );
}
