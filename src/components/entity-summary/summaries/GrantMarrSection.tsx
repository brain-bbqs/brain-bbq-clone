import { Badge } from "@/components/ui/badge";
import { SummaryField } from "../SummaryField";

interface MarrSectionProps {
  metadata: Record<string, any>;
  project: Record<string, any>;
}

const MARR_FIELDS = [
  { key: "marr_l1_ethological_goal", label: "L1 · Ethological Goal", icon: "🎯" },
  { key: "marr_l2_algorithmic_function", label: "L2 · Algorithmic Function", icon: "⚙️" },
  { key: "marr_l3_implementational_hardware", label: "L3 · Hardware / Implementation", icon: "🔧" },
  { key: "cross_project_synergy", label: "Cross-Project Synergy", icon: "🔗" },
  { key: "data_analysis_approach", label: "Data Analysis Approach", icon: "📊" },
  { key: "target_species_domain", label: "Target Species Domain", icon: "🧬" },
  { key: "agentic_action_required", label: "Agentic Action Required", icon: "🤖" },
];

const ARRAY_FIELDS = [
  { key: "experimental_approaches", label: "Experimental Approaches", projectKey: "use_approaches" },
  { key: "data_modalities", label: "Data Modalities", projectKey: "produce_data_modality" },
  { key: "data_type", label: "Data Types", projectKey: "produce_data_type" },
  { key: "analysis_types", label: "Analysis Types", projectKey: "use_analysis_types" },
  { key: "analysis_methods", label: "Analysis Methods", projectKey: "use_analysis_method" },
  { key: "software_tools_used", label: "Software Tools", projectKey: "develope_software_type" },
];

const DEVICE_FIELDS = [
  { key: "sensor", label: "Sensors" },
  { key: "data_acquisition_modalities", label: "Data Acquisition" },
  { key: "behavioral_rigs", label: "Behavioral Rigs" },
  { key: "electrophysiology_setup", label: "Electrophysiology" },
];

function isRequiresVerification(val: any): boolean {
  if (typeof val === "string") return val.includes("Requires Verification");
  if (Array.isArray(val)) return val.length === 1 && typeof val[0] === "string" && val[0].includes("Requires Verification");
  return false;
}

export function GrantMarrSection({ metadata, project }: MarrSectionProps) {
  const hasMarr = MARR_FIELDS.some((f) => metadata[f.key] && !isRequiresVerification(metadata[f.key]));
  const devices = metadata.devices || {};
  const hasDevices = DEVICE_FIELDS.some((f) => devices[f.key] && !isRequiresVerification(devices[f.key]));

  // Merge array fields: prefer project metadata JSONB, fall back to marr metadata
  const projMeta = project?.metadata || {};
  const arrayData = ARRAY_FIELDS.map((f) => {
    const projectVal = projMeta[f.projectKey] || project?.[f.projectKey];
    const metaVal = metadata[f.key];
    const val = (Array.isArray(projectVal) && projectVal.length > 0) ? projectVal : metaVal;
    if (!val || isRequiresVerification(val)) return null;
    const arr = Array.isArray(val) ? val : [val];
    if (arr.length === 0) return null;
    return { ...f, values: arr as string[] };
  }).filter(Boolean) as { key: string; label: string; values: string[] }[];

  if (!hasMarr && !hasDevices && arrayData.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* MARR Levels */}
      {hasMarr && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            Marr Framework
          </h3>
          <div className="space-y-3">
            {MARR_FIELDS.map(({ key, label, icon }) => {
              const val = metadata[key];
              if (!val || isRequiresVerification(val)) return null;
              return (
                <div key={key}>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    <span className="mr-1">{icon}</span>{label}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{String(val)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Experimental / Data fields */}
      {arrayData.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            Research Details
          </h3>
          <div className="space-y-2">
            {arrayData.map(({ key, label, values }) => (
              <SummaryField key={key} label={label}>
                <div className="flex flex-wrap gap-1.5">
                  {values.map((v, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">{v}</Badge>
                  ))}
                </div>
              </SummaryField>
            ))}
          </div>
        </div>
      )}

      {/* Devices */}
      {hasDevices && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            Devices & Hardware
          </h3>
          <div className="space-y-2">
            {DEVICE_FIELDS.map(({ key, label }) => {
              const val = devices[key];
              if (!val || isRequiresVerification(val)) return null;
              const arr = Array.isArray(val) ? val : [val];
              return (
                <SummaryField key={key} label={label}>
                  <div className="flex flex-wrap gap-1.5">
                    {arr.map((v: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs font-normal">{v}</Badge>
                    ))}
                  </div>
                </SummaryField>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
