import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns whether the current user can edit a given project (by grant_number).
 * Uses the DB security-definer function `user_can_edit_project`.
 */
export function useCanEditProject(grantNumber: string | null) {
  const { user } = useAuth();

  const { data: canEdit = false, isLoading } = useQuery<boolean>({
    queryKey: ["can-edit-project", user?.id, grantNumber],
    enabled: !!user && !!grantNumber,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("user_can_edit_project", {
        _user_id: user!.id,
        _grant_number: grantNumber!,
      });
      if (error) {
        console.error("Permission check failed:", error);
        return false;
      }
      return !!data;
    },
    staleTime: 60_000,
  });

  return { canEdit, isLoading };
}
