import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface GraphNode {
  id: string;
  label: string;
  type: "project" | "species" | "investigator" | "meta_tag";
  color: string;
  radius: number;
  metadata?: Record<string, any>;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const TYPE_COLORS: Record<string, string> = {
  project: "hsl(210, 70%, 55%)",
  species: "hsl(140, 60%, 50%)",
  investigator: "hsl(30, 80%, 55%)",
  meta_tag: "hsl(280, 50%, 60%)",
};

export function useKnowledgeGraphData() {
  const queryClient = useQueryClient();

  // Realtime subscription — invalidate query on projects table changes
  useEffect(() => {
    const channel = supabase
      .channel("kg-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["knowledge-graph-data"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery<GraphData>({
    queryKey: ["knowledge-graph-data"],
    queryFn: async () => {
      const [grantsRes, investigatorsRes, grantInvRes, metadataRes] = await Promise.all([
        supabase.from("grants").select("id, grant_number, title, abstract, award_amount, fiscal_year, nih_link").order("grant_number"),
        supabase.from("investigators").select("id, name, orcid, research_areas, skills"),
        supabase.from("grant_investigators").select("grant_number, investigator_id, role"),
        supabase.from("projects" as any).select("*"),
      ]);

      if (grantsRes.error) throw grantsRes.error;
      if (investigatorsRes.error) throw investigatorsRes.error;
      if (grantInvRes.error) throw grantInvRes.error;
      if (metadataRes.error) throw metadataRes.error;

      const grants = grantsRes.data || [];
      const investigators = investigatorsRes.data || [];
      const grantInvestigators = grantInvRes.data || [];
      const projectMetadata = (metadataRes.data || []) as any[];

      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      const speciesSet = new Map<string, string>();
      const metaTagSet = new Map<string, string>();

      for (const g of grants) {
        const meta = projectMetadata.find(m => m.grant_number === g.grant_number);
        nodes.push({
          id: `project-${g.id}`,
          label: g.title.length > 50 ? g.title.slice(0, 47) + "..." : g.title,
          type: "project",
          color: TYPE_COLORS.project,
          radius: 14,
          metadata: { ...g, projectMeta: meta },
        });

        // Species edges
        const species = (meta as any)?.study_species || [];
        for (const sp of species) {
          if (!sp) continue;
          if (!speciesSet.has(sp)) {
            const sid = `species-${sp.toLowerCase().replace(/\s+/g, "-")}`;
            speciesSet.set(sp, sid);
            nodes.push({ id: sid, label: sp, type: "species", color: TYPE_COLORS.species, radius: 10 });
          }
          links.push({ source: `project-${g.id}`, target: speciesSet.get(sp)!, type: "studies", label: "studies" });
        }

        // Structured meta tag edges
        const tagFields = [
          { field: "use_approaches", label: "approach" },
          { field: "use_sensors", label: "sensor" },
          { field: "produce_data_modality", label: "modality" },
          { field: "use_analysis_method", label: "method" },
        ];
        for (const { field, label } of tagFields) {
          const tags = ((meta as any)?.[field] || []) as string[];
          for (const tag of tags) {
            if (!tag) continue;
            const key = `${label}:${tag}`;
            if (!metaTagSet.has(key)) {
              const tid = `meta-${key.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
              metaTagSet.set(key, tid);
              nodes.push({ id: tid, label: tag, type: "meta_tag", color: TYPE_COLORS.meta_tag, radius: 7 });
            }
            links.push({ source: `project-${g.id}`, target: metaTagSet.get(key)!, type: label });
          }
        }

        // Dynamic JSONB metadata → meta tag nodes (Phase 3: dynamic discovery)
        const customMeta = (meta as any)?.metadata;
        if (customMeta && typeof customMeta === "object") {
          for (const [mKey, mValue] of Object.entries(customMeta)) {
            const valStr = typeof mValue === "string" ? mValue : JSON.stringify(mValue);
            // Create a meta tag for each key-value pair
            const tagKey = `custom:${mKey}:${valStr}`;
            if (!metaTagSet.has(tagKey)) {
              const tid = `meta-${tagKey.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
              metaTagSet.set(tagKey, tid);
              nodes.push({
                id: tid,
                label: `${mKey}: ${valStr.length > 30 ? valStr.slice(0, 27) + "..." : valStr}`,
                type: "meta_tag",
                color: TYPE_COLORS.meta_tag,
                radius: 6,
              });
            }
            links.push({ source: `project-${g.id}`, target: metaTagSet.get(tagKey)!, type: "custom" });
          }
        }
      }

      // Investigator nodes
      const invMap = new Map(investigators.map(inv => [inv.id, inv]));
      const linkedInvIds = new Set<string>();

      for (const gi of grantInvestigators) {
        const inv = invMap.get(gi.investigator_id);
        if (!inv) continue;
        const grant = grants.find(g => g.grant_number === gi.grant_number);
        if (!grant) continue;

        const invNodeId = `inv-${inv.id}`;
        if (!linkedInvIds.has(inv.id)) {
          linkedInvIds.add(inv.id);
          nodes.push({ id: invNodeId, label: inv.name, type: "investigator", color: TYPE_COLORS.investigator, radius: 11, metadata: inv });
        }

        links.push({ source: `project-${grant.id}`, target: invNodeId, type: gi.role || "investigator", label: gi.role === "pi" ? "PI" : "Co-PI" });
      }

      return { nodes, links };
    },
    staleTime: 2 * 60 * 1000,
  });
}
