import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MetadataChanges {
  [fieldKey: string]: any;
}

interface UseMetadataEditorOptions {
  grantNumber: string;
  grantId: string;
  originalMetadata: Record<string, any> | null;
  onCommitSuccess?: () => void;
}

export function useMetadataEditor({ grantNumber, grantId, originalMetadata, onCommitSuccess }: UseMetadataEditorOptions) {
  const [changes, setChanges] = useState<MetadataChanges>({});
  const [isCommitting, setIsCommitting] = useState(false);

  const hasChanges = Object.keys(changes).length > 0;

  const changedFields = useMemo(() => new Set(Object.keys(changes)), [changes]);

  const getValue = useCallback((fieldKey: string) => {
    if (fieldKey in changes) return changes[fieldKey];
    if (originalMetadata && fieldKey in originalMetadata) return originalMetadata[fieldKey];
    // defaults
    const arrayFields = [
      "study_species", "use_approaches", "use_sensors", "produce_data_modality",
      "produce_data_type", "use_analysis_types", "use_analysis_method",
      "develope_software_type", "develope_hardware_type", "keywords",
    ];
    if (arrayFields.includes(fieldKey)) return [];
    if (fieldKey === "study_human") return false;
    if (fieldKey === "website") return "";
    return null;
  }, [changes, originalMetadata]);

  const setFieldValue = useCallback((fieldKey: string, value: any) => {
    // Check if value matches original — if so, remove the change
    const original = originalMetadata?.[fieldKey];
    const isEqual = JSON.stringify(value) === JSON.stringify(original);
    setChanges(prev => {
      if (isEqual) {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      }
      return { ...prev, [fieldKey]: value };
    });
  }, [originalMetadata]);

  const discardAll = useCallback(() => {
    setChanges({});
  }, []);

  const commitChanges = useCallback(async () => {
    if (!hasChanges) return;
    setIsCommitting(true);
    try {
      // Build the row to upsert
      const row: Record<string, any> = {
        grant_number: grantNumber,
        grant_id: grantId,
        last_edited_by: "anonymous",
        ...changes,
      };

      // Calculate completeness
      const merged = { ...(originalMetadata || {}), ...changes };
      const checkFields = [
        "study_species", "use_approaches", "use_sensors", "produce_data_modality",
        "produce_data_type", "use_analysis_types", "use_analysis_method",
        "develope_software_type", "develope_hardware_type", "keywords", "website",
      ];
      const filled = checkFields.filter(f => {
        const v = merged[f];
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "string") return v.trim().length > 0;
        return v !== null && v !== undefined;
      });
      row.metadata_completeness = Math.round((filled.length / checkFields.length) * 100);

      const { error } = await (supabase
        .from("projects" as any) as any)
        .upsert(row, { onConflict: "grant_number" });
      if (error) throw error;

      toast({ title: "Changes committed", description: `${Object.keys(changes).length} field(s) updated.` });
      setChanges({});
      onCommitSuccess?.();
    } catch (e: any) {
      console.error("Commit error:", e);
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    } finally {
      setIsCommitting(false);
    }
  }, [changes, hasChanges, grantNumber, grantId, originalMetadata, onCommitSuccess]);

  return {
    changes,
    hasChanges,
    changedFields,
    getValue,
    setFieldValue,
    discardAll,
    commitChanges,
    isCommitting,
  };
}
