// BBQS data model — hand-curated snapshot of the public Supabase schema.
// Kept in-code (not runtime-introspected) so the diagram works with anon access
// and stays stable when tables change. Update when the schema evolves.

export type DomainKey =
  | "core"
  | "projects"
  | "people"
  | "community"
  | "devices"
  | "knowledge"
  | "auth"
  | "ops";

export interface TableNode {
  name: string;
  domain: DomainKey;
  cols: number;
  hub?: boolean; // rendered larger
  note?: string;
}

export interface RelEdge {
  from: string;
  to: string;
  via: string; // column name on `from`
  kind?: "fk" | "join" | "self";
}

export const DOMAINS: Record<DomainKey, { label: string; color: string; description: string }> = {
  core: {
    label: "Core Graph",
    color: "hsl(38 90% 50%)",
    description: "Every real-world entity has a row in resources — the hub of the 3-layer graph.",
  },
  projects: {
    label: "Projects & Grants",
    color: "hsl(217 91% 60%)",
    description: "Consortium science: NIH grants, funded projects, publications, DANDI datasets.",
  },
  people: {
    label: "People",
    color: "hsl(280 65% 60%)",
    description: "Investigators, their organizations, and their Supabase auth profiles + roles.",
  },
  community: {
    label: "Community",
    color: "hsl(160 65% 45%)",
    description: "Announcements, jobs, feature requests, comments — member-facing surfaces.",
  },
  devices: {
    label: "Devices & Species",
    color: "hsl(340 75% 55%)",
    description: "Physical/biological entities cited by projects: instruments, models, species, software.",
  },
  knowledge: {
    label: "Knowledge & Harvest",
    color: "hsl(190 75% 45%)",
    description: "RAG embeddings, harvester pipeline, evidence traversal, proposed KG relations.",
  },
  auth: {
    label: "Auth & Curation",
    color: "hsl(0 75% 55%)",
    description: "Access requests, allowlists, audit + edit history — SOC2 accountability layer.",
  },
  ops: {
    label: "Analytics & Ops",
    color: "hsl(45 90% 45%)",
    description: "Pageviews, budgets, Lovable usage, funding opportunities, system alerts.",
  },
};

export const TABLES: TableNode[] = [
  // Core
  { name: "resources", domain: "core", cols: 10, hub: true, note: "Universal entity hub — every node in the graph." },
  { name: "organizations", domain: "core", cols: 5, note: "Institutions/labs. Tenant boundary." },

  // Projects & Grants
  { name: "grants", domain: "projects", cols: 10, hub: true, note: "NIH awards. Linked to resources." },
  { name: "projects", domain: "projects", cols: 15, hub: true, note: "Funded science projects, keyed by grant_number." },
  { name: "publications", domain: "projects", cols: 14 },
  { name: "project_publications", domain: "projects", cols: 3, note: "M2M: projects ↔ publications." },
  { name: "grant_investigators", domain: "projects", cols: 4, note: "M2M: grants ↔ investigators + role." },
  { name: "grant_dandisets", domain: "projects", cols: 5, note: "M2M: grants ↔ DANDI datasets." },
  { name: "dandisets", domain: "projects", cols: 20 },

  // People
  { name: "investigators", domain: "people", cols: 19, hub: true, note: "Consortium members. Linked to auth.users when identity is verified." },
  { name: "investigator_organizations", domain: "people", cols: 2, note: "M2M: investigators ↔ organizations." },
  { name: "profiles", domain: "people", cols: 7, note: "1:1 with auth.users — safe public fields." },
  { name: "user_roles", domain: "people", cols: 5, note: "Role assignments (admin/curator/member). Server-side auth only." },

  // Community
  { name: "announcements", domain: "community", cols: 11 },
  { name: "jobs", domain: "community", cols: 17 },
  { name: "feature_suggestions", domain: "community", cols: 12 },
  { name: "feature_votes", domain: "community", cols: 3 },
  { name: "entity_comments", domain: "community", cols: 7, note: "Threaded comments — parent_id is self-referential." },

  // Devices & Species
  { name: "device_manufacturers", domain: "devices", cols: 9 },
  { name: "device_models", domain: "devices", cols: 13 },
  { name: "species", domain: "devices", cols: 11 },
  { name: "software_tools", domain: "devices", cols: 11 },

  // Knowledge & Harvest
  { name: "knowledge_embeddings", domain: "knowledge", cols: 10, note: "Vector store for RAG across all entities." },
  { name: "grant_methods_evidence", domain: "knowledge", cols: 36 },
  { name: "grant_methods_traversal_paths", domain: "knowledge", cols: 8 },
  { name: "proposed_relations", domain: "knowledge", cols: 11 },
  { name: "harvester_queue", domain: "knowledge", cols: 10 },
  { name: "harvester_runs", domain: "knowledge", cols: 19 },
  { name: "harvester_keywords", domain: "knowledge", cols: 12 },
  { name: "harvester_relations", domain: "knowledge", cols: 10 },
  { name: "harvester_settings", domain: "knowledge", cols: 10 },
  { name: "harvester_synonyms", domain: "knowledge", cols: 6 },

  // Auth & Curation
  { name: "access_requests", domain: "auth", cols: 14 },
  { name: "allowed_domains", domain: "auth", cols: 4, note: "Institution email domains permitted through Globus OAuth." },
  { name: "auth_audit_log", domain: "auth", cols: 7 },
  { name: "curation_audit_log", domain: "auth", cols: 18, note: "Every metadata change — before/after JSON." },
  { name: "edit_history", domain: "auth", cols: 11 },
  { name: "security_audit_results", domain: "auth", cols: 9 },

  // Analytics & Ops
  { name: "analytics_pageviews", domain: "ops", cols: 8 },
  { name: "analytics_clicks", domain: "ops", cols: 10 },
  { name: "budget_config", domain: "ops", cols: 13 },
  { name: "budget_snapshots", domain: "ops", cols: 10 },
  { name: "lovable_credit_events", domain: "ops", cols: 8 },
  { name: "lovable_invoices", domain: "ops", cols: 9 },
  { name: "lovable_user_usage", domain: "ops", cols: 10 },
  { name: "funding_opportunities", domain: "ops", cols: 20 },
  { name: "search_queries", domain: "ops", cols: 5 },
  { name: "state_privacy_rules", domain: "ops", cols: 9 },
  { name: "system_alerts", domain: "ops", cols: 19 },
];

// Inferred from *_id column naming (no FK constraints in DB — convention only).
export const RELATIONS: RelEdge[] = [
  // Resource hub
  { from: "grants", to: "resources", via: "resource_id" },
  { from: "projects", to: "resources", via: "resource_id" },
  { from: "publications", to: "resources", via: "resource_id" },
  { from: "investigators", to: "resources", via: "resource_id" },
  { from: "organizations", to: "resources", via: "resource_id" },
  { from: "dandisets", to: "resources", via: "resource_id" },
  { from: "species", to: "resources", via: "resource_id" },
  { from: "software_tools", to: "resources", via: "resource_id" },
  { from: "jobs", to: "resources", via: "resource_id" },
  { from: "announcements", to: "resources", via: "resource_id" },
  { from: "knowledge_embeddings", to: "resources", via: "resource_id" },

  // Organization tenant
  { from: "allowed_domains", to: "organizations", via: "organization_id" },
  { from: "profiles", to: "organizations", via: "organization_id" },
  { from: "projects", to: "organizations", via: "organization_id" },
  { from: "jobs", to: "organizations", via: "organization_id" },
  { from: "announcements", to: "organizations", via: "organization_id" },
  { from: "feature_suggestions", to: "organizations", via: "organization_id" },

  // Projects & Grants graph
  { from: "projects", to: "grants", via: "grant_id" },
  { from: "grant_investigators", to: "grants", via: "grant_id", kind: "join" },
  { from: "grant_investigators", to: "investigators", via: "investigator_id", kind: "join" },
  { from: "grant_dandisets", to: "grants", via: "grant_id", kind: "join" },
  { from: "grant_dandisets", to: "dandisets", via: "dandiset_id", kind: "join" },
  { from: "project_publications", to: "projects", via: "project_id", kind: "join" },
  { from: "project_publications", to: "publications", via: "publication_id", kind: "join" },
  { from: "grant_methods_evidence", to: "grant_methods_traversal_paths", via: "discovery_path_id" },
  { from: "grant_methods_traversal_paths", to: "grant_methods_evidence", via: "terminal_evidence_id" },
  { from: "edit_history", to: "projects", via: "project_id" },

  // People
  { from: "investigator_organizations", to: "investigators", via: "investigator_id", kind: "join" },
  { from: "investigator_organizations", to: "organizations", via: "organization_id", kind: "join" },

  // Community
  { from: "entity_comments", to: "resources", via: "resource_id" },
  { from: "entity_comments", to: "entity_comments", via: "parent_id", kind: "self" },
  { from: "feature_votes", to: "feature_suggestions", via: "suggestion_id", kind: "join" },

  // Devices
  { from: "device_models", to: "device_manufacturers", via: "manufacturer_id" },

  // Curation audit
  { from: "curation_audit_log", to: "projects", via: "project_id" },
  { from: "curation_audit_log", to: "resources", via: "resource_id" },
  { from: "curation_audit_log", to: "investigators", via: "investigator_id" },
  { from: "curation_audit_log", to: "curation_audit_log", via: "reverted_from_audit_id", kind: "self" },

  // Harvester
  { from: "harvester_queue", to: "harvester_runs", via: "last_run_id" },
];