import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSelector } from "@/components/metadata/ProjectSelector";
import { MetadataPanel } from "@/components/metadata/MetadataPanel";
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

  // Fetch all grants
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

  // Fetch metadata for selected grant
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
      return data;
    },
    enabled: !!selectedGrant,
  });

  // Fetch investigators for selected grant
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Metadata Assistant</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Browse and review project metadata aligned with the{" "}
          <a href="https://sensein.group/bbqs_projects_models/index_bbqs_projects_metadata/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            BBQS Projects Metadata Schema
          </a>.
          Select a project to view its metadata fields.
        </p>
      </div>

      {/* Project selector */}
      <div className="mb-6">
        <ProjectSelector
          grants={grants}
          selectedGrantId={selectedGrant?.id || null}
          onSelect={setSelectedGrant}
          isLoading={grantsLoading}
        />
      </div>

      {/* Content area */}
      {selectedGrant ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: future AI assistant placeholder */}
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
          <div className="lg:col-span-3 order-1 lg:order-2">
            <MetadataPanel
              grant={selectedGrant}
              metadata={metadata ? { ...metadata, collaborators: Array.isArray(metadata.collaborators) ? metadata.collaborators : [] } as any : null}
              investigators={investigators}
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
            Choose a grant from the selector above to view and review its metadata fields.
          </p>
          {!grantsLoading && (
            <p className="text-xs text-muted-foreground mt-2">{grants.length} grants available</p>
          )}
        </div>
      )}
    </div>
  );
}
