import { FileText, Users, Bug, Database, Wrench, Globe } from "lucide-react";
import { MetadataSection } from "./MetadataSection";
import { EditableField } from "./EditableField";
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

interface MetadataPanelProps {
  grant: GrantData;
  investigators: { name: string; role: string }[];
  getValue: (key: string) => any;
  setFieldValue: (key: string, value: any) => void;
  changedFields: Set<string>;
  completeness: number;
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

export function MetadataPanel({ grant, investigators, getValue, setFieldValue, changedFields, completeness }: MetadataPanelProps) {
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
          <CompletenessBar value={completeness} />
        </div>
      </div>

      {/* Sections */}
      <MetadataSection title="Basic Information" icon={FileText}>
        <EditableField label="Abstract" value={grant.abstract} type="textarea" fieldKey="abstract" isChanged={false} onSave={() => {}} />
        <EditableField label="Website" value={getValue("website")} type="link" fieldKey="website" isChanged={changedFields.has("website")} onSave={setFieldValue} />
        <EditableField label="Keywords" value={getValue("keywords")} type="tags" fieldKey="keywords" isChanged={changedFields.has("keywords")} onSave={setFieldValue} />
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
      </MetadataSection>

      <MetadataSection title="Species & Approaches" icon={Bug}>
        <EditableField label="Species" value={getValue("study_species")} type="tags" fieldKey="study_species" isChanged={changedFields.has("study_species")} onSave={setFieldValue} />
        <EditableField label="Studies Humans" value={getValue("study_human")} type="boolean" fieldKey="study_human" isChanged={changedFields.has("study_human")} onSave={setFieldValue} />
        <EditableField label="Approaches" value={getValue("use_approaches")} type="tags" fieldKey="use_approaches" isChanged={changedFields.has("use_approaches")} onSave={setFieldValue} />
        <EditableField label="Sensors" value={getValue("use_sensors")} type="tags" fieldKey="use_sensors" isChanged={changedFields.has("use_sensors")} onSave={setFieldValue} />
      </MetadataSection>

      <MetadataSection title="Data" icon={Database}>
        <EditableField label="Data Modalities" value={getValue("produce_data_modality")} type="tags" fieldKey="produce_data_modality" isChanged={changedFields.has("produce_data_modality")} onSave={setFieldValue} />
        <EditableField label="Data Types" value={getValue("produce_data_type")} type="tags" fieldKey="produce_data_type" isChanged={changedFields.has("produce_data_type")} onSave={setFieldValue} />
        <EditableField label="Analysis Types" value={getValue("use_analysis_types")} type="tags" fieldKey="use_analysis_types" isChanged={changedFields.has("use_analysis_types")} onSave={setFieldValue} />
        <EditableField label="Analysis Methods" value={getValue("use_analysis_method")} type="tags" fieldKey="use_analysis_method" isChanged={changedFields.has("use_analysis_method")} onSave={setFieldValue} />
      </MetadataSection>

      <MetadataSection title="Software & Hardware" icon={Wrench}>
        <EditableField label="Software Types" value={getValue("develope_software_type")} type="tags" fieldKey="develope_software_type" isChanged={changedFields.has("develope_software_type")} onSave={setFieldValue} />
        <EditableField label="Hardware Types" value={getValue("develope_hardware_type")} type="tags" fieldKey="develope_hardware_type" isChanged={changedFields.has("develope_hardware_type")} onSave={setFieldValue} />
      </MetadataSection>
    </div>
  );
}
