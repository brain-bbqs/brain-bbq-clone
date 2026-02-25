import { X, Globe, User, Bug, Tag, FolderOpen, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MetadataPanel } from "@/components/metadata/MetadataPanel";
import { MetadataToolbar } from "@/components/metadata/MetadataToolbar";
import { CustomMetadataEditor } from "./CustomMetadataEditor";
import { CrossProjectDiscovery } from "./CrossProjectDiscovery";
import { AiSuggestions } from "./AiSuggestions";
import { useMetadataEditor } from "@/hooks/useMetadataEditor";
import { useQueryClient } from "@tanstack/react-query";
import type { GraphNode, GraphData } from "@/hooks/useKnowledgeGraphData";

interface NodeDrawerProps {
  node: GraphNode | null;
  onClose: () => void;
  graphData?: GraphData | null;
}

const typeIcons = {
  project: FolderOpen,
  species: Bug,
  investigator: User,
  meta_tag: Tag,
};

const typeLabels = {
  project: "Project",
  species: "Species",
  investigator: "Investigator",
  meta_tag: "Meta Tag",
};

function ProjectDrawerContent({ node, graphData }: { node: GraphNode; graphData?: GraphData | null }) {
  const queryClient = useQueryClient();
  const meta = node.metadata;
  if (!meta) return null;

  const grant = {
    id: meta.id,
    grant_number: meta.grant_number,
    title: meta.title,
    abstract: meta.abstract,
    award_amount: meta.award_amount,
    fiscal_year: meta.fiscal_year,
    nih_link: meta.nih_link,
  };

  const projectMeta = meta.projectMeta || null;

  const editor = useMetadataEditor({
    grantNumber: grant.grant_number,
    grantId: grant.id,
    originalMetadata: projectMeta,
    onCommitSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-graph-data"] });
    },
  });

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
  const completeness = Math.round((filled.length / checkFields.length) * 100);

  const currentCustomMeta = editor.getValue("metadata") || projectMeta?.metadata || {};

  // Build existing fields map for AI suggestions
  const existingFields: Record<string, any> = {};
  for (const f of checkFields) {
    const v = editor.getValue(f);
    if (Array.isArray(v) && v.length > 0) existingFields[f] = v;
    else if (typeof v === "string" && v.trim()) existingFields[f] = v;
  }

  // Get similar projects from graph data for AI context
  const similarProjects = graphData?.nodes
    .filter(n => n.type === "project" && n.id !== node.id && n.metadata?.projectMeta)
    .slice(0, 3)
    .map(n => ({
      title: n.metadata?.title,
      species: n.metadata?.projectMeta?.study_species,
      approaches: n.metadata?.projectMeta?.use_approaches,
      methods: n.metadata?.projectMeta?.use_analysis_method,
    })) || [];

  return (
    <div className="space-y-4">
      <MetadataToolbar
        hasChanges={editor.hasChanges}
        changeCount={Object.keys(editor.changes).length}
        onDiscard={editor.discardAll}
        onCommit={editor.commitChanges}
        isCommitting={editor.isCommitting}
      />

      {/* AI Suggestions */}
      <AiSuggestions
        grantTitle={grant.title}
        grantAbstract={grant.abstract}
        existingFields={existingFields}
        similarProjects={similarProjects}
        onApplySuggestion={editor.setFieldValue}
      />

      {/* Cross-project discovery */}
      {graphData && (
        <CrossProjectDiscovery
          currentProjectId={node.id}
          graphData={graphData}
        />
      )}

      <MetadataPanel
        grant={grant}
        investigators={[]}
        getValue={editor.getValue}
        setFieldValue={editor.setFieldValue}
        changedFields={editor.changedFields}
        completeness={completeness}
      />
      <CustomMetadataEditor
        metadata={typeof currentCustomMeta === "object" && currentCustomMeta !== null ? currentCustomMeta : {}}
        onChange={(newMeta) => editor.setFieldValue("metadata", newMeta)}
        isChanged={editor.changedFields.has("metadata")}
      />
    </div>
  );
}

function InvestigatorDrawerContent({ node }: { node: GraphNode }) {
  const meta = node.metadata;
  if (!meta) return <p className="text-sm text-muted-foreground">No data available</p>;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-foreground">{meta.name}</h3>
        {meta.orcid && (
          <a href={`https://orcid.org/${meta.orcid}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1">
            <ExternalLink className="h-3 w-3" /> ORCID: {meta.orcid}
          </a>
        )}
        {meta.research_areas?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Research Areas</p>
            <div className="flex flex-wrap gap-1">
              {meta.research_areas.map((area: string) => (
                <Badge key={area} variant="secondary" className="text-[10px]">{area}</Badge>
              ))}
            </div>
          </div>
        )}
        {meta.skills?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Skills</p>
            <div className="flex flex-wrap gap-1">
              {meta.skills.map((skill: string) => (
                <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GenericDrawerContent({ node }: { node: GraphNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-sm text-foreground">{node.label}</p>
      <p className="text-xs text-muted-foreground mt-1 capitalize">{node.type.replace("_", " ")}</p>
    </div>
  );
}

export function NodeDrawer({ node, onClose, graphData }: NodeDrawerProps) {
  if (!node) return null;

  const Icon = typeIcons[node.type] || Tag;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 flex flex-col shadow-2xl">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${node.color}20` }}>
          <Icon className="h-4 w-4" style={{ color: node.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {typeLabels[node.type]}
          </p>
          <h2 className="text-sm font-semibold text-foreground truncate">{node.label}</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {node.type === "project" ? (
          <ProjectDrawerContent node={node} graphData={graphData} />
        ) : node.type === "investigator" ? (
          <InvestigatorDrawerContent node={node} />
        ) : (
          <GenericDrawerContent node={node} />
        )}
      </div>
    </div>
  );
}
