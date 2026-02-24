import { FileText, Users, Bug, Database, Wrench, Tag, Globe, LinkIcon } from "lucide-react";
import { MetadataSection } from "./MetadataSection";
import { MetadataField } from "./MetadataField";
import { Badge } from "@/components/ui/badge";

interface GrantData {
  id: string;
  grant_number: string;
  title: string;
  abstract: string | null;
  award_amount: number | null;
  fiscal_year: number | null;
  nih_link: string | null;
}

interface ProjectMeta {
  study_species: string[];
  study_human: boolean;
  use_approaches: string[];
  use_sensors: string[];
  produce_data_modality: string[];
  produce_data_type: string[];
  use_analysis_types: string[];
  use_analysis_method: string[];
  develope_software_type: string[];
  develope_hardware_type: string[];
  keywords: string[];
  website: string | null;
  collaborators: any[];
  metadata_completeness: number;
}

interface MetadataPanelProps {
  grant: GrantData;
  metadata: ProjectMeta | null;
  investigators: { name: string; role: string }[];
}

function CompletenessBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{value}%</span>
    </div>
  );
}

export function MetadataPanel({ grant, metadata, investigators }: MetadataPanelProps) {
  const meta = metadata || {
    study_species: [], study_human: false, use_approaches: [], use_sensors: [],
    produce_data_modality: [], produce_data_type: [], use_analysis_types: [],
    use_analysis_method: [], develope_software_type: [], develope_hardware_type: [],
    keywords: [], website: null, collaborators: [], metadata_completeness: 0,
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">{grant.grant_number}</p>
            <h2 className="text-lg font-semibold text-foreground leading-snug">{grant.title}</h2>
          </div>
          {grant.nih_link && (
            <a href={grant.nih_link} target="_blank" rel="noopener noreferrer"
              className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1">
              <Globe className="h-3 w-3" /> NIH Reporter
            </a>
          )}
        </div>
        {grant.award_amount && (
          <p className="text-sm text-muted-foreground">
            Award: ${grant.award_amount.toLocaleString()} · FY{grant.fiscal_year}
          </p>
        )}
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-1">Metadata Completeness</p>
          <CompletenessBar value={meta.metadata_completeness} />
        </div>
      </div>

      {/* Sections */}
      <MetadataSection title="Basic Information" icon={FileText}>
        <MetadataField label="Abstract" value={grant.abstract} />
        <MetadataField label="Website" value={meta.website} type="link" />
        <MetadataField label="Keywords" value={meta.keywords} type="tags" />
      </MetadataSection>

      <MetadataSection title="Team" icon={Users}>
        {investigators.length > 0 ? (
          <div className="space-y-2">
            {investigators.map((inv, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-foreground">{inv.name}</span>
                <Badge variant="outline" className="text-[10px]">{inv.role}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">No investigators linked</p>
        )}
        {meta.collaborators.length > 0 && (
          <MetadataField label="Collaborators" value={meta.collaborators.map((c: any) => c.name || c)} type="tags" />
        )}
      </MetadataSection>

      <MetadataSection title="Species & Approaches" icon={Bug}>
        <MetadataField label="Species" value={meta.study_species} type="tags" />
        <MetadataField label="Studies Humans" value={meta.study_human} type="boolean" />
        <MetadataField label="Approaches" value={meta.use_approaches} type="tags" />
        <MetadataField label="Sensors" value={meta.use_sensors} type="tags" />
      </MetadataSection>

      <MetadataSection title="Data" icon={Database}>
        <MetadataField label="Data Modalities" value={meta.produce_data_modality} type="tags" />
        <MetadataField label="Data Types" value={meta.produce_data_type} type="tags" />
        <MetadataField label="Analysis Types" value={meta.use_analysis_types} type="tags" />
        <MetadataField label="Analysis Methods" value={meta.use_analysis_method} type="tags" />
      </MetadataSection>

      <MetadataSection title="Software & Hardware" icon={Wrench}>
        <MetadataField label="Software Types" value={meta.develope_software_type} type="tags" />
        <MetadataField label="Hardware Types" value={meta.develope_hardware_type} type="tags" />
      </MetadataSection>
    </div>
  );
}
