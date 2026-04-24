import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { recordCurationAudit, showUndoableToast } from "@/lib/curation-audit";

export interface PendingChange {
  id: string;
  grant_number: string;
  project_id: string | null;
  field_name: string;
  proposed_value: any;
  current_value: any;
  source: string;
  proposed_by: string | null;
  proposed_by_email: string | null;
  rationale: string | null;
  status: "pending" | "accepted" | "rejected";
  conversation_id: string | null;
  created_at: string;
}

/**
 * Manages assistant-proposed changes for a single project.
 * Lists pending diffs, accepts (writes through DB function), or rejects them.
 */
export function usePendingChanges(grantNumber: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["pending-changes", grantNumber];

  const { data: pending = [], isLoading } = useQuery<PendingChange[]>({
    queryKey,
    enabled: !!grantNumber,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_changes" as any)
        .select("*")
        .eq("grant_number", grantNumber!)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as PendingChange[]) || [];
    },
    staleTime: 15_000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (changeId: string) => {
      // Capture the proposed/current values BEFORE applying so we can build a revert audit row
      const { data: change } = await supabase
        .from("pending_changes" as any)
        .select("grant_number, project_id, field_name, current_value, proposed_value")
        .eq("id", changeId)
        .maybeSingle();
      const { data, error } = await supabase.rpc("accept_pending_change" as any, {
        _change_id: changeId,
      });
      if (error) throw error;
      let auditId: string | null = null;
      if (change) {
        const c = change as any;
        auditId = await recordCurationAudit({
          entity_type: "pending_change_decision",
          action: "update",
          grant_number: c.grant_number ?? null,
          project_id: c.project_id ?? null,
          field_name: c.field_name ?? null,
          before_value: c.current_value ?? null,
          after_value: c.proposed_value ?? null,
          source: "pending_change_accept",
        });
      }
      return { data, auditId };
    },
    onSuccess: ({ auditId }) => {
      queryClient.invalidateQueries({ queryKey });
      // Project metadata changed; refresh anything keyed on it
      queryClient.invalidateQueries({ queryKey: ["project-profile", grantNumber] });
      showUndoableToast({
        title: "Change accepted",
        description: "The proposed update was applied.",
        auditId,
        onReverted: () => {
          queryClient.invalidateQueries({ queryKey });
          queryClient.invalidateQueries({ queryKey: ["project-profile", grantNumber] });
        },
      });
    },
    onError: (e: any) => {
      toast({ title: "Could not accept", description: e.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (changeId: string) => {
      const { error } = await supabase
        .from("pending_changes" as any)
        .update({ status: "rejected" })
        .eq("id", changeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Change rejected" });
    },
    onError: (e: any) => {
      toast({ title: "Could not reject", description: e.message, variant: "destructive" });
    },
  });

  return {
    pending,
    isLoading,
    accept: acceptMutation.mutate,
    reject: rejectMutation.mutate,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
