import { useState, useEffect } from "react";
import yaml from "js-yaml";
import type { MarrProject } from "@/data/marr-projects";
import type { SynergyNode, SynergyLink } from "@/data/marr-synergies";

// Color palette for assigning stable colors to projects
const PROJECT_COLORS = [
  "#4fc3f7", "#81c784", "#ffb74d", "#ce93d8", "#f06292",
  "#a1887f", "#90a4ae", "#4db6ac", "#dce775", "#fff176",
  "#80deea", "#c5e1a5", "#b39ddb", "#ffcc80", "#e0e0e0",
  "#ef9a9a", "#ffab91", "#b0bec5", "#e57373", "#f48fb1",
  "#bcaaa4", "#80cbc4", "#ffab40", "#ffe082", "#42a5f5",
  "#66bb6a",
];

function getGrantType(grantNumber: string): "R34" | "R61" | "U01" | "U24" | "R24" {
  if (grantNumber.includes("R34")) return "R34";
  if (grantNumber.includes("R61")) return "R61";
  if (grantNumber.includes("U01")) return "U01";
  if (grantNumber.includes("U24")) return "U24";
  if (grantNumber.includes("R24")) return "R24";
  return "R34";
}

function parseShortName(p: any): string {
  const leads = p.project_leads || [];
  const firstLead = leads[0] || "";
  const lastName = firstLead.split(",")[0]?.trim() || "Unknown";
  // Use a short project descriptor
  const title = p.project_title || "";
  const species = p.target_species_domain || p.species || "";
  
  // Try to create a meaningful short name
  if (title.toLowerCase().includes("bard") || title.toLowerCase().includes("bbqs ai")) return "BARD.CC";
  if (title.toLowerCase().includes("ember") || title.toLowerCase().includes("ecosystem for multi-modal")) return "EMBER";
  
  // Otherwise use PI last name + species/key concept
  const keywords = [
    species,
    ...(p.keywords || []).slice(0, 1),
  ].filter(Boolean);
  
  const descriptor = keywords[0] || title.split(/\s+/).slice(0, 2).join(" ");
  return `${lastName} – ${descriptor}`;
}

function parseProject(p: any, index: number): MarrProject {
  const leads = p.project_leads || [];
  const firstLead = leads[0] || "";
  const piName = firstLead.includes(",")
    ? firstLead.split(",").map((s: string) => s.trim()).reverse().join(" ")
    : firstLead;

  // Parse common name from target_species_domain, e.g. "Mus musculus (house mouse)" → "house mouse"
  const tsd = p.target_species_domain || "";
  const commonMatch = tsd.match(/\(([^)]+)\)/);
  const commonName = commonMatch ? commonMatch[1] : "";

  return {
    id: p.grant_number,
    shortName: parseShortName(p),
    pi: piName,
    allPIs: leads,
    species: p.species || p.target_species_domain || "",
    speciesCommonName: commonName,
    institution: p.institution || "",
    color: PROJECT_COLORS[index % PROJECT_COLORS.length],
    computational: splitField(p.marr_l1_ethological_goal),
    algorithmic: splitField(p.marr_l2_algorithmic_function),
    implementation: splitField(p.marr_l3_implementational_hardware),
    dataModalities: p.data_modalities || [],
    experimentalApproaches: p.experimental_approaches || [],
    keywords: p.keywords || [],
  };
}

function splitField(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[;.]/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);
}

function parseSynergyFromProjects(projects: MarrProject[], rawProjects: any[]): {
  nodes: SynergyNode[];
  links: SynergyLink[];
} {
  const nodes: SynergyNode[] = projects.map((p) => ({
    id: p.id,
    shortName: p.shortName,
    pi: p.pi,
    species: p.species,
    color: p.color,
    grantType: getGrantType(p.id),
    l1Goal: p.computational.join(" & ") || "—",
  }));

  const links: SynergyLink[] = [];
  const projectIdSet = new Set(projects.map((p) => p.id));

  for (const raw of rawProjects) {
    const synText = raw.cross_project_synergy;
    if (!synText || typeof synText !== "string") continue;

    // Extract grant numbers mentioned in synergy text
    const grantPattern = /([A-Z0-9]+(?:DA|MH)\d+)/g;
    let match: RegExpExecArray | null;
    const targets: string[] = [];

    while ((match = grantPattern.exec(synText)) !== null) {
      const candidate = match[1];
      if (candidate !== raw.grant_number && projectIdSet.has(candidate)) {
        targets.push(candidate);
      }
    }

    // Also check for prefixed patterns like 1U01DA063534
    const prefixedPattern = /\d+([A-Z]\d+[A-Z]+\d+)/g;
    while ((match = prefixedPattern.exec(synText)) !== null) {
      const candidate = match[0];
      if (candidate !== raw.grant_number && projectIdSet.has(candidate)) {
        if (!targets.includes(candidate)) targets.push(candidate);
      }
    }

    // Determine synergy type from keywords
    const synergyType = inferSynergyType(synText);

    for (const target of targets) {
      links.push({
        source: raw.grant_number,
        target,
        description: synText,
        synergyType,
      });
    }
  }

  return { nodes, links };
}

function inferSynergyType(text: string): SynergyLink["synergyType"] {
  const lower = text.toLowerCase();
  if (lower.includes("hardware") || lower.includes("sensor") || lower.includes("lidar") || lower.includes("mmwave") || lower.includes("camera") || lower.includes("opm")) return "hardware";
  if (lower.includes("data") || lower.includes("dataset") || lower.includes("gps") || lower.includes("schema")) return "data";
  if (lower.includes("bard") || lower.includes("ember") || lower.includes("standardization") || lower.includes("infrastructure") || lower.includes("ontolog")) return "infrastructure";
  if (lower.includes("theor") || lower.includes("evolutionary") || lower.includes("cross-species") || lower.includes("autonomic") || lower.includes("foraging") || lower.includes("musculoskeletal") || lower.includes("embodied")) return "theoretical";
  return "algorithmic";
}

interface MarrYamlData {
  projects: MarrProject[];
  synergyNodes: SynergyNode[];
  synergyLinks: SynergyLink[];
  loading: boolean;
  error: string | null;
}

// Cache for parsed data
let cachedData: { projects: MarrProject[]; synergyNodes: SynergyNode[]; synergyLinks: SynergyLink[] } | null = null;
let fetchPromise: Promise<typeof cachedData> | null = null;

async function fetchAndParseYaml() {
  if (cachedData) return cachedData;
  
  if (!fetchPromise) {
    fetchPromise = (async () => {
      const response = await fetch("/bbqs_marr.yaml");
      const text = await response.text();
      const parsed = yaml.load(text) as { projects: any[] };
      
      const rawProjects = parsed.projects || [];
      const projects = rawProjects.map((p: any, i: number) => parseProject(p, i));
      const { nodes: synergyNodes, links: synergyLinks } = parseSynergyFromProjects(projects, rawProjects);
      
      cachedData = { projects, synergyNodes, synergyLinks };
      return cachedData;
    })();
  }
  
  return fetchPromise;
}

export function useMarrYaml(): MarrYamlData {
  const [data, setData] = useState<MarrYamlData>({
    projects: cachedData?.projects || [],
    synergyNodes: cachedData?.synergyNodes || [],
    synergyLinks: cachedData?.synergyLinks || [],
    loading: !cachedData,
    error: null,
  });

  useEffect(() => {
    if (cachedData) {
      setData({
        projects: cachedData.projects,
        synergyNodes: cachedData.synergyNodes,
        synergyLinks: cachedData.synergyLinks,
        loading: false,
        error: null,
      });
      return;
    }

    fetchAndParseYaml()
      .then((result) => {
        if (result) {
          setData({
            projects: result.projects,
            synergyNodes: result.synergyNodes,
            synergyLinks: result.synergyLinks,
            loading: false,
            error: null,
          });
        }
      })
      .catch((err) => {
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load YAML",
        }));
      });
  }, []);

  return data;
}

// Force cache invalidation (useful after YAML updates)
export function invalidateMarrCache() {
  cachedData = null;
  fetchPromise = null;
}
