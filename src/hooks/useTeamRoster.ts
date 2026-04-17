import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
      const { data: invs, error: invErr } = await supabase
        .from("investigators")
        .select("id, name, email, resource_id")
        .in("id", ids);
      if (invErr) throw invErr;

      return links.map((l) => {
        const inv = invs?.find((i) => i.id === l.investigator_id);
        return {
          investigator_id: l.investigator_id,
          grant_id: l.grant_id || grantId!,
          role: l.role,
          name: inv?.name || "Unknown",
          email: inv?.email || null,
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Team member added" });
    },
    onError: (e: any) => {
      toast({ title: "Could not add member", description: e.message, variant: "destructive" });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ investigatorId, role }: { investigatorId: string; role: string }) => {
      const { error } = await supabase
        .from("grant_investigators")
        .update({ role })
        .eq("grant_id", grantId!)
        .eq("investigator_id", investigatorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Role updated" });
    },
    onError: (e: any) => {
      toast({ title: "Could not update role", description: e.message, variant: "destructive" });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (investigatorId: string) => {
      const { error } = await supabase
        .from("grant_investigators")
        .delete()
        .eq("grant_id", grantId!)
        .eq("investigator_id", investigatorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Team member removed" });
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
        .from("investigators")
        .select("id, name, email")
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });
}
