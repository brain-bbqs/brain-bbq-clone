import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useCallback } from "react";

export interface EditHistoryEntry {
  id: string;
  project_id: string | null;
  grant_number: string;
  edited_by: string;
  field_name: string;
  old_value: any;
  new_value: any;
  created_at: string;
}

/**
 * Records field-level diffs to edit_history and provides
 * a query for the recent history of a given grant_number.
 */
export function useEditHistory(grantNumber: string | null) {
  const queryClient = useQueryClient();

  // Realtime subscription for live conflict awareness
  useEffect(() => {
    if (!grantNumber) return;
    const channel = supabase
      .channel(`edit-history-${grantNumber}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "edit_history", filter: `grant_number=eq.${grantNumber}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["edit-history", grantNumber] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [grantNumber, queryClient]);

  const history = useQuery<EditHistoryEntry[]>({
    queryKey: ["edit-history", grantNumber],
    enabled: !!grantNumber,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edit_history")
        .select("*")
        .eq("grant_number", grantNumber!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as EditHistoryEntry[];
    },
    staleTime: 30_000,
  });

  /**
   * Log a batch of field changes to edit_history.
   * Call this right after a successful commit.
   */
  const logChanges = useCallback(
    async (
      projectId: string | null,
      changes: Record<string, any>,
      originalMetadata: Record<string, any> | null,
      editedBy = "anonymous"
    ) => {
      if (!grantNumber) return;
      const rows = Object.entries(changes).map(([field, newVal]) => ({
        project_id: projectId,
        grant_number: grantNumber,
        edited_by: editedBy,
        field_name: field,
        old_value: originalMetadata?.[field] ?? null,
        new_value: newVal,
      }));
      if (rows.length === 0) return;
      const { error } = await supabase.from("edit_history").insert(rows);
      if (error) console.error("Failed to log edit history:", error);
    },
    [grantNumber]
  );

  return { history: history.data || [], isLoading: history.isLoading, logChanges };
}
