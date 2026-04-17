import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isPreviewMode } from "@/lib/preview-mode";

/**
 * 4-tier access model:
 *   1. admin   — full edit + role management + admin pages
 *   2. curator — edit any project, review pending changes (no role mgmt)
 *   3. member  — signed in AND linked to ≥1 investigator record
 *   4. public  — anonymous or unlinked Globus user (read-only)
 */
export type UserTier = "admin" | "curator" | "member" | "public";

export interface TierInfo {
  tier: UserTier;
  isAdmin: boolean;
  isCurator: boolean;     // true for curator OR admin
  isMember: boolean;      // true for member, curator, OR admin
  isLoading: boolean;
}

export function useUserTier(): TierInfo {
  const { user, loading: authLoading } = useAuth();
  const preview = isPreviewMode();

  const { data, isLoading } = useQuery<{ tier: UserTier }>({
    queryKey: ["user-tier", user?.id],
    enabled: !!user && !preview,
    staleTime: 60_000,
    queryFn: async () => {
      // Roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);

      const roleSet = new Set((roles ?? []).map((r) => r.role));
      if (roleSet.has("admin")) return { tier: "admin" };
      if (roleSet.has("curator")) return { tier: "curator" };

      // Tier 3 — must be linked to at least one investigator record
      const { data: linked } = await supabase
        .from("investigators")
        .select("id")
        .eq("user_id", user!.id)
        .limit(1);

      if (linked && linked.length > 0) return { tier: "member" };
      return { tier: "public" };
    },
  });

  // Preview = treat developer as admin so all gated UI renders
  if (preview) {
    return { tier: "admin", isAdmin: true, isCurator: true, isMember: true, isLoading: false };
  }

  if (authLoading || (!!user && isLoading)) {
    return { tier: "public", isAdmin: false, isCurator: false, isMember: false, isLoading: true };
  }

  const tier: UserTier = data?.tier ?? "public";
  return {
    tier,
    isAdmin: tier === "admin",
    isCurator: tier === "admin" || tier === "curator",
    isMember: tier === "admin" || tier === "curator" || tier === "member",
    isLoading: false,
  };
}
