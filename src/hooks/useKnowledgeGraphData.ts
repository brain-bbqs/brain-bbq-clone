import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  return useQuery<GraphData>({
    queryKey: ["knowledge-graph-data"],
    queryFn: async () => {
      // Fetch grants, investigators, grant_investigators, project_metadata in parallel
      const [grantsRes, investigatorsRes, grantInvRes, metadataRes] = await Promise.all([
        supabase.from("grants").select("id, grant_number, title, abstract, award_amount, fiscal_year, nih_link").order("grant_number"),
        supabase.from("investigators").select("id, name, orcid, research_areas, skills"),
        supabase.from("grant_investigators").select("grant_number, investigator_id, role"),
        supabase.from("project_metadata").select("*"),
      ]);

      if (grantsRes.error) throw grantsRes.error;
      if (investigatorsRes.error) throw investigatorsRes.error;
      if (grantInvRes.error) throw grantInvRes.error;
      if (metadataRes.error) throw metadataRes.error;

      const grants = grantsRes.data || [];
      const investigators = investigatorsRes.data || [];
      const grantInvestigators = grantInvRes.data || [];
      const projectMetadata = metadataRes.data || [];

      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      const speciesSet = new Map<string, string>(); // species name -> node id
      const metaTagSet = new Map<string, string>(); // tag -> node id

      // Create project nodes
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

        // Species edges from project_metadata
        const species = (meta as any)?.study_species || [];
        for (const sp of species) {
          if (!sp) continue;
          if (!speciesSet.has(sp)) {
            const sid = `species-${sp.toLowerCase().replace(/\s+/g, "-")}`;
            speciesSet.set(sp, sid);
            nodes.push({
              id: sid,
              label: sp,
              type: "species",
              color: TYPE_COLORS.species,
              radius: 10,
            });
          }
          links.push({
            source: `project-${g.id}`,
            target: speciesSet.get(sp)!,
            type: "studies",
            label: "studies",
          });
        }

        // Meta tag edges — approaches, sensors, data modalities, analysis methods
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
              nodes.push({
                id: tid,
                label: tag,
                type: "meta_tag",
                color: TYPE_COLORS.meta_tag,
                radius: 7,
              });
            }
            links.push({
              source: `project-${g.id}`,
              target: metaTagSet.get(key)!,
              type: label,
            });
          }
        }
      }

      // Create investigator nodes and link to projects
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
          nodes.push({
            id: invNodeId,
            label: inv.name,
            type: "investigator",
            color: TYPE_COLORS.investigator,
            radius: 11,
            metadata: inv,
          });
        }

        links.push({
          source: `project-${grant.id}`,
          target: invNodeId,
          type: gi.role || "investigator",
          label: gi.role === "pi" ? "PI" : "Co-PI",
        });
      }

      return { nodes, links };
    },
    staleTime: 2 * 60 * 1000,
  });
}
