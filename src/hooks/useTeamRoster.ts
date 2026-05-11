import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { recordCurationAudit, showUndoableToast } from "@/lib/curation-audit";

export interface TeamMember {
  investigator_id: string;
  grant_id: string;
  role: string;
  name: string;
  email: string | null;
  resource_id: string | null;
}

/**
 * Manages the team roster (grant_investigators) for a single grant.
 * Add / update role / remove are gated by RLS using user_can_edit_grant_roster().
 */
export function useTeamRoster(grantId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["team-roster", grantId];

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey,
    enabled: !!grantId,
    queryFn: async () => {
      const { data: links, error: linkErr } = await supabase
        .from("grant_investigators")
        .select("investigator_id, grant_id, role")
        .eq("grant_id", grantId!);
      if (linkErr) throw linkErr;
      if (!links?.length) return [];

      const ids = links.map((l) => l.investigator_id);
      // Names/resource_id come from the PII-free public view (visible to any
      // authenticated user). Emails are pulled from the restricted base table
      // and will only return rows the viewer is allowed to see (curator/admin,
      // self, or grant-mate) — others simply won't have an email shown.
      const [{ data: invs, error: invErr }, { data: emails }] = await Promise.all([
        supabase
          .from("investigators_public" as any)
          .select("id, name, resource_id")
          .in("id", ids) as unknown as Promise<{ data: { id: string; name: string; resource_id: string | null }[] | null; error: any }>,
        supabase
          .from("investigators")
          .select("id, email")
          .in("id", ids) as unknown as Promise<{ data: { id: string; email: string | null }[] | null }>,
      ]);
      if (invErr) throw invErr;
      const emailById = new Map((emails || []).map((e) => [e.id, e.email]));

      return links.map((l) => {
        const inv = invs?.find((i) => i.id === l.investigator_id);
        return {
          investigator_id: l.investigator_id,
          grant_id: l.grant_id || grantId!,
          role: l.role,
          name: inv?.name || "Unknown",
          email: emailById.get(l.investigator_id) ?? null,
          resource_id: inv?.resource_id || null,
        };
      });
    },
  });

  const addMember = useMutation({
    mutationFn: async ({ investigatorId, role }: { investigatorId: string; role: string }) => {
      const { error } = await supabase
        .from("grant_investigators")
        .insert({ investigator_id: investigatorId, grant_id: grantId!, role });
      if (error) throw error;
      // Look up grant_number for permission scoping in audit row
      const { data: g } = await supabase
        .from("grants")
        .select("grant_number")
        .eq("id", grantId!)
        .maybeSingle();
      const auditId = await recordCurationAudit({
        entity_type: "team_roster",
        action: "create",
        grant_number: g?.grant_number ?? null,
        investigator_id: investigatorId,
        before_value: null,
        after_value: { grant_id: grantId, investigator_id: investigatorId, role },
        source: "team_roster_editor",
      });
      return auditId;
    },
    onSuccess: (auditId) => {
      queryClient.invalidateQueries({ queryKey });
      showUndoableToast({
        title: "Team member added",
        auditId,
        onReverted: () => queryClient.invalidateQueries({ queryKey }),
      });
    },
    onError: (e: any) => {
      toast({ title: "Could not add member", description: e.message, variant: "destructive" });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ investigatorId, role }: { investigatorId: string; role: string }) => {
      // Capture previous role before mutating
      const { data: prev } = await supabase
        .from("grant_investigators")
        .select("role")
        .eq("grant_id", grantId!)
        .eq("investigator_id", investigatorId)
        .maybeSingle();
      const { error } = await supabase
        .from("grant_investigators")
        .update({ role })
        .eq("grant_id", grantId!)
        .eq("investigator_id", investigatorId);
      if (error) throw error;
      const { data: g } = await supabase
        .from("grants")
        .select("grant_number")
        .eq("id", grantId!)
        .maybeSingle();
      const auditId = await recordCurationAudit({
        entity_type: "team_roster",
        action: "update",
        grant_number: g?.grant_number ?? null,
        investigator_id: investigatorId,
        before_value: { grant_id: grantId, investigator_id: investigatorId, role: prev?.role ?? "co_pi" },
        after_value: { grant_id: grantId, investigator_id: investigatorId, role },
        source: "team_roster_editor",
      });
      return auditId;
    },
    onSuccess: (auditId) => {
      queryClient.invalidateQueries({ queryKey });
      showUndoableToast({
        title: "Role updated",
        auditId,
        onReverted: () => queryClient.invalidateQueries({ queryKey }),
      });
    },
    onError: (e: any) => {
      toast({ title: "Could not update role", description: e.message, variant: "destructive" });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (investigatorId: string) => {
      // Snapshot the row before deleting so revert can recreate it
      const { data: prev } = await supabase
        .from("grant_investigators")
        .select("role")
        .eq("grant_id", grantId!)
        .eq("investigator_id", investigatorId)
        .maybeSingle();
      const { error } = await supabase
        .from("grant_investigators")
        .delete()
        .eq("grant_id", grantId!)
        .eq("investigator_id", investigatorId);
      if (error) throw error;
      const { data: g } = await supabase
        .from("grants")
        .select("grant_number")
        .eq("id", grantId!)
        .maybeSingle();
      const auditId = await recordCurationAudit({
        entity_type: "team_roster",
        action: "delete",
        grant_number: g?.grant_number ?? null,
        investigator_id: investigatorId,
        before_value: { grant_id: grantId, investigator_id: investigatorId, role: prev?.role ?? "co_pi" },
        after_value: null,
        source: "team_roster_editor",
      });
      return auditId;
    },
    onSuccess: (auditId) => {
      queryClient.invalidateQueries({ queryKey });
      showUndoableToast({
        title: "Team member removed",
        auditId,
        onReverted: () => queryClient.invalidateQueries({ queryKey }),
      });
    },
    onError: (e: any) => {
      toast({ title: "Could not remove member", description: e.message, variant: "destructive" });
    },
  });

  return {
    members,
    isLoading,
    addMember: addMember.mutate,
    updateRole: updateRole.mutate,
    removeMember: removeMember.mutate,
    isMutating: addMember.isPending || updateRole.isPending || removeMember.isPending,
  };
}

/**
 * Search investigators by name/email for adding to a roster.
 */
export function useInvestigatorSearch(query: string) {
  return useQuery({
    queryKey: ["investigator-search", query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investigators_public" as any)
        .select("id, name")
        .ilike("name", `%${query}%`)
        .limit(10) as unknown as { data: { id: string; name: string }[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
  });
}
