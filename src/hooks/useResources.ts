import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Resource } from "@/data/resources";

type ResourceType = Database["public"]["Enums"]["resource_type"];

const RESOURCE_TYPE_TO_CATEGORY: Record<string, string> = {
  software: "Software",
  ml_model: "ML Models",
  dataset: "Datasets",
  benchmark: "Benchmarks",
  protocol: "Protocols",
  tool: "Software",
};

const mapDbToResource = (row: any): Resource => {
  const meta = row.metadata || {};
  return {
    id: row.id,
    category: meta.category || RESOURCE_TYPE_TO_CATEGORY[row.resource_type] || row.resource_type,
    name: row.name,
    url: row.external_url || "",
    repoUrl: meta.repoUrl || "",
    dockerUrl: meta.dockerUrl || "",
    algorithm: meta.algorithm || row.description || "",
    computational: meta.computational || "",
    neuralNetworkArchitecture: meta.neuralNetworkArchitecture || "",
    mlPipeline: meta.mlPipeline || "",
    implementation: meta.implementation || "",
    species: meta.species || "",
    mcpStatus: meta.mcpStatus || meta.neuroMcpStatus || "not-started",
    containerized: meta.containerized || false,
  };
};

export function useResources(category?: string) {
  return useQuery<Resource[]>({
    queryKey: ["resources", category],
    queryFn: async () => {
      let query = supabase
        .from("resources")
        .select("*")
        .in("resource_type", ["software", "ml_model", "dataset", "benchmark", "protocol", "tool"]);

      if (category) {
        // Map category name to resource_type
        const typeMap: Record<string, ResourceType[]> = {
          Software: ["software", "tool"],
          "ML Models": ["ml_model"],
          Datasets: ["dataset"],
          Benchmarks: ["benchmark"],
          Protocols: ["protocol"],
        };
        const types = typeMap[category] || [category.toLowerCase() as ResourceType];
        query = supabase
          .from("resources")
          .select("*")
          .in("resource_type", types);
      }

      const { data, error } = await query.order("name");
      if (error) throw error;
      return (data || []).map(mapDbToResource);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
