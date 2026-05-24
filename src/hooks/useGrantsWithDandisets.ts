import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns a Set of grant_number strings that have at least one
 * linked EMBER dandiset (via grant_dandisets). Used to render an
 * "EMBER data" badge on the projects grid.
 */
export function useGrantsWithDandisets() {
  return useQuery({
    queryKey: ["grants-with-dandisets"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grant_dandisets")
        .select("grant:grants!inner(grant_number)");
      if (error) throw error;
      const set = new Set<string>();
      for (const row of (data as any[]) || []) {
        const gn = row?.grant?.grant_number;
        if (gn) set.add(gn);
      }
      return set;
    },
  });
}
