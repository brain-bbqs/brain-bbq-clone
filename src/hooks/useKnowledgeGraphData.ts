import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface GraphNode {
  id: string;
  label: string;
  type: "project" | "species" | "investigator" | "meta_tag" | "publication" | "resource";
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
  publication: "hsl(350, 65%, 55%)",
  resource: "hsl(180, 55%, 50%)",
};

export function useKnowledgeGraphData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("kg-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        queryClient.invalidateQueries({ queryKey: ["knowledge-graph-data"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "project_publications" }, () => {
        queryClient.invalidateQueries({ queryKey: ["knowledge-graph-data"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "project_resources" }, () => {
        queryClient.invalidateQueries({ queryKey: ["knowledge-graph-data"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery<GraphData>({
    queryKey: ["knowledge-graph-data"],
    queryFn: async () => {
      const [grantsRes, investigatorsRes, grantInvRes, metadataRes, pubsRes, resourcesRes, projPubsRes, projResRes] = await Promise.all([
        supabase.from("grants").select("id, grant_number, title, abstract, award_amount, fiscal_year, nih_link").order("grant_number"),
        supabase.from("investigators").select("id, name, orcid, research_areas, skills"),
        supabase.from("grant_investigators").select("grant_number, investigator_id, role"),
        supabase.from("projects" as any).select("*"),
        supabase.from("publications").select("id, title, pmid, year, journal, citations, keywords"),
        supabase.from("resources").select("id, name, resource_type, description, external_url"),
        supabase.from("project_publications" as any).select("project_id, publication_id"),
        supabase.from("project_resources" as any).select("project_id, resource_id, relationship"),
      ]);

      const grants = grantsRes.data || [];
      const investigators = investigatorsRes.data || [];
      const grantInvestigators = grantInvRes.data || [];
      const projectMetadata = (metadataRes.data || []) as any[];
      const publications = pubsRes.data || [];
      const resources = resourcesRes.data || [];
      const projPubs = (projPubsRes.data || []) as any[];
      const projRes = (projResRes.data || []) as any[];

      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      const speciesSet = new Map<string, string>();
      const metaTagSet = new Map<string, string>();

      // Project nodes
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
        for (const sp of ((meta as any)?.study_species || [])) {
          if (!sp) continue;
          if (!speciesSet.has(sp)) {
            speciesSet.set(sp, `species-${sp.toLowerCase().replace(/\s+/g, "-")}`);
            nodes.push({ id: speciesSet.get(sp)!, label: sp, type: "species", color: TYPE_COLORS.species, radius: 10 });
          }
          links.push({ source: `project-${g.id}`, target: speciesSet.get(sp)!, type: "studies", label: "studies" });
        }

        // Structured meta tag edges
        for (const { field, label } of [
          { field: "use_approaches", label: "approach" },
          { field: "use_sensors", label: "sensor" },
          { field: "produce_data_modality", label: "modality" },
          { field: "use_analysis_method", label: "method" },
        ]) {
          for (const tag of ((meta as any)?.[field] || []) as string[]) {
            if (!tag) continue;
            const key = `${label}:${tag}`;
            if (!metaTagSet.has(key)) {
              metaTagSet.set(key, `meta-${key.toLowerCase().replace(/[^a-z0-9]/g, "-")}`);
              nodes.push({ id: metaTagSet.get(key)!, label: tag, type: "meta_tag", color: TYPE_COLORS.meta_tag, radius: 7 });
            }
            links.push({ source: `project-${g.id}`, target: metaTagSet.get(key)!, type: label });
          }
        }

        // Dynamic JSONB metadata
        const customMeta = (meta as any)?.metadata;
        if (customMeta && typeof customMeta === "object") {
          for (const [mKey, mValue] of Object.entries(customMeta)) {
            const valStr = typeof mValue === "string" ? mValue : JSON.stringify(mValue);
            const tagKey = `custom:${mKey}:${valStr}`;
            if (!metaTagSet.has(tagKey)) {
              metaTagSet.set(tagKey, `meta-${tagKey.toLowerCase().replace(/[^a-z0-9]/g, "-")}`);
              nodes.push({ id: metaTagSet.get(tagKey)!, label: `${mKey}: ${valStr.length > 30 ? valStr.slice(0, 27) + "..." : valStr}`, type: "meta_tag", color: TYPE_COLORS.meta_tag, radius: 6 });
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

      // Publication nodes (only those linked to projects)
      const linkedPubIds = new Set(projPubs.map((pp: any) => pp.publication_id));
      const pubMap = new Map(publications.map(p => [p.id, p]));
      for (const pubId of linkedPubIds) {
        const pub = pubMap.get(pubId);
        if (!pub) continue;
        const nodeId = `pub-${pub.id}`;
        nodes.push({
          id: nodeId,
          label: pub.title.length > 40 ? pub.title.slice(0, 37) + "..." : pub.title,
          type: "publication",
          color: TYPE_COLORS.publication,
          radius: 8,
          metadata: pub,
        });
      }
      for (const pp of projPubs) {
        if (!pubMap.has(pp.publication_id)) continue;
        // Find the project node id from the project_id
        const projectNode = nodes.find(n => n.type === "project" && n.metadata?.projectMeta?.id === pp.project_id);
        if (projectNode) {
          links.push({ source: projectNode.id, target: `pub-${pp.publication_id}`, type: "published", label: "published" });
        }
      }

      // Resource nodes (only those linked to projects)
      const linkedResIds = new Set(projRes.map((pr: any) => pr.resource_id));
      const resMap = new Map(resources.map(r => [r.id, r]));
      for (const resId of linkedResIds) {
        const res = resMap.get(resId);
        if (!res) continue;
        const nodeId = `res-${res.id}`;
        nodes.push({
          id: nodeId,
          label: res.name,
          type: "resource",
          color: TYPE_COLORS.resource,
          radius: 9,
          metadata: res,
        });
      }
      for (const pr of projRes) {
        if (!resMap.has(pr.resource_id)) continue;
        const projectNode = nodes.find(n => n.type === "project" && n.metadata?.projectMeta?.id === pr.project_id);
        if (projectNode) {
          links.push({ source: projectNode.id, target: `res-${pr.resource_id}`, type: pr.relationship || "uses", label: pr.relationship || "uses" });
        }
      }

      return { nodes, links };
    },
    staleTime: 2 * 60 * 1000,
  });
}
