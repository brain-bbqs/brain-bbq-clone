import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Check if the current user owns a specific investigator record.
 * Also provides a claim function for manual "This is me" linking.
 */
export function useInvestigatorOwnership(investigatorId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["investigator-ownership", user?.id, investigatorId],
    enabled: !!user && !!investigatorId,
    queryFn: async () => {
      // Check if this investigator is linked to current user
      const { data: inv } = await supabase
        .from("investigators")
        .select("user_id")
        .eq("id", investigatorId!)
        .maybeSingle();

      return {
        isOwner: inv?.user_id === user!.id,
        isClaimed: !!inv?.user_id,
        claimedByCurrentUser: inv?.user_id === user!.id,
      };
    },
    staleTime: 60_000,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!user || !investigatorId) throw new Error("Not authenticated");

      // Only allow claiming unclaimed investigators
      const { data: inv } = await supabase
        .from("investigators")
        .select("user_id, email")
        .eq("id", investigatorId)
        .maybeSingle();

      if (inv?.user_id) throw new Error("Already claimed");

      const { error } = await supabase
        .from("investigators")
        .update({ user_id: user.id })
        .eq("id", investigatorId)
        .is("user_id", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investigator-ownership"] });
    },
  });

  return {
    isOwner: data?.isOwner ?? false,
    isClaimed: data?.isClaimed ?? false,
    isLoading,
    claim: claimMutation.mutateAsync,
    isClaiming: claimMutation.isPending,
  };
}
