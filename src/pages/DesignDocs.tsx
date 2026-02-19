import { Database, Server, Globe, Brain, FileText, Layers, ArrowRight, Link2, Table2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SoftwareArchitectureFlow from "@/components/diagrams/SoftwareArchitectureFlow";

const dbTables = [
  { name: "grants", desc: "NIH grant records with award amounts, abstracts, fiscal years" },
  { name: "investigators", desc: "PI/Co-PI profiles with ORCID, Scholar ID, and profile URLs" },
  { name: "organizations", desc: "Research institutions linked to investigators" },
  { name: "publications", desc: "Papers with DOI, PMID, citation counts, and RCR metrics" },
  { name: "grant_investigators", desc: "Junction table linking grants ↔ investigators with roles" },
  { name: "investigator_organizations", desc: "Junction table linking investigators ↔ organizations" },
  { name: "resources", desc: "Unified resource registry (grants, publications, software, datasets)" },
  { name: "resource_links", desc: "Typed relationships between resources (e.g. grant → publication)" },
  { name: "software_tools", desc: "Software tools with repo URLs, languages, and licenses" },
  { name: "knowledge_embeddings", desc: "RAG vector store (1536-dim) for NeuroMCP chat context" },
  { name: "chat_conversations", desc: "NeuroMCP conversation sessions per user" },
  { name: "chat_messages", desc: "Individual chat messages with latency and token tracking" },
  { name: "nih_grants_cache", desc: "Cached NIH Reporter API responses to reduce external calls" },
  { name: "nih_grants_sync_log", desc: "Audit log for grant data synchronization runs" },
  { name: "analytics_pageviews", desc: "Page view tracking with referrer and user agent" },
  { name: "analytics_clicks", desc: "Click event tracking with element metadata" },
];

const edgeFunctions = [
  { name: "nih-grants", desc: "Fetches BBQS grant data from NIH Reporter + iCite APIs" },
  { name: "nih-pi-grants", desc: "Batch-fetches all grants for a set of PI profile IDs" },
  { name: "nih-reporter-search", desc: "Generates NIH Reporter search URLs for PI lookups" },
  { name: "resolve-scholar-ids", desc: "Resolves Google Scholar IDs for investigators" },
  { name: "bbqs-api", desc: "Public REST API serving BBQS consortium data" },
  { name: "bbqs-mcp", desc: "MCP (Model Context Protocol) server for AI tool access" },
  { name: "neuromcp-chat", desc: "RAG-powered chat with OpenRouter LLM backend" },
  { name: "neuromcp-ingest", desc: "Ingests documents into the knowledge embedding store" },
  { name: "neuromcp-ingest-workflows", desc: "Ingests workflow data for the recommender" },
  { name: "neuromcp-audio", desc: "Audio processing for research recordings" },
  { name: "neuromcp-history", desc: "Retrieves conversation history for NeuroMCP" },
  { name: "github-roadmap", desc: "Fetches GitHub milestones and issues for the roadmap" },
  { name: "create-github-issue", desc: "Creates GitHub issues from the Report Issue dialog" },
];

const nihLinkages = [
  { source: "NIH Reporter v2", endpoint: "POST /v2/projects/search", data: "Grant numbers, titles, PIs, award amounts, abstracts, fiscal years", flow: "Edge Function queries by BBQS grant numbers → caches in nih_grants_cache → populates grants + investigators tables" },
  { source: "NIH Reporter v2", endpoint: "POST /v2/projects/search (by PI)", data: "All grants for a PI profile ID (beyond BBQS)", flow: "nih-pi-grants fetches full portfolio per PI → displayed on People page with BBQS grants highlighted" },
  { source: "iCite API", endpoint: "GET /api/pubs?pmids=...", data: "Publication titles, authors, journals, citation counts, RCR", flow: "PMIDs from NIH Reporter → iCite lookup → publications table" },
  { source: "NIH Reporter", endpoint: "Search URL generation", data: "PI profile search links", flow: "nih-reporter-search generates deep links to NIH Reporter for PI profiles" },
];

export default function DesignDocs() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Software Architecture</h1>
        <p className="text-muted-foreground">
          High-level overview of the BBQS platform architecture, database schema, and NIH data linkages
        </p>
      </div>

      {/* Interactive Architecture Diagram */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          System Architecture
        </h2>
        <SoftwareArchitectureFlow />
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Interactive diagram — drag to pan, scroll to zoom
        </p>
      </section>

      {/* Architecture Overview */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Architecture Overview
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              BBQS is a single-page application (SPA) built with modern web technologies. 
              The frontend communicates with a Supabase backend for data storage, authentication, 
              and serverless functions that integrate with external APIs.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg p-4">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full">React Frontend</span>
              <ArrowRight className="h-4 w-4" />
              <span className="bg-accent/20 text-accent px-3 py-1 rounded-full">Supabase Edge Functions</span>
              <ArrowRight className="h-4 w-4" />
              <span className="bg-secondary text-foreground px-3 py-1 rounded-full">External APIs</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Frontend Stack */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Frontend Stack
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">React 18 + TypeScript</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Type-safe UI with React Router for client-side navigation.
                Components use shadcn/ui (Radix primitives) for accessible, composable UI.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tailwind CSS + Custom Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Utility-first styling with a custom Bluevine-inspired design system.
                HSL-based semantic tokens for consistent theming.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vite + Bun</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fast HMR development builds with Vite. Production builds optimized
                with tree-shaking and code splitting.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">TanStack Query</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Server state management with automatic caching, background refetching,
                and stale-while-revalidate patterns.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">AG Grid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                High-performance data grids for the People and Projects directories.
                Custom Bluevine theme with dark headers and gold accents.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">D3 + Recharts + React Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Data visualization suite: D3 for heatmaps and Sankey diagrams,
                Recharts for charts, React Flow for interactive architecture diagrams.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Supabase Database Schema */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Table2 className="h-5 w-5 text-primary" />
          Supabase Database Schema
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          PostgreSQL database with {dbTables.length} tables organized into domain areas: 
          research entities, NIH data, AI/chat, and analytics.
        </p>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-2.5 px-4 text-foreground font-semibold">Table</th>
                <th className="text-left py-2.5 px-4 text-foreground font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {dbTables.map((t, i) => (
                <tr key={t.name} className={i < dbTables.length - 1 ? "border-b border-border/50" : ""}>
                  <td className="py-2 px-4">
                    <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">{t.name}</code>
                  </td>
                  <td className="py-2 px-4 text-xs">{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Backend Services */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Backend Services
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Edge Functions (Deno)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {edgeFunctions.length} serverless functions written in TypeScript/Deno handle
                API proxying, data processing, and AI chat.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Row Level Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Database access controlled via RLS policies. Chat data is user-isolated;
                research data is publicly readable.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Supabase Auth</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                User signup, login, and session management with JWT tokens.
                Used for NeuroMCP chat and admin features.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vector Embeddings (pgvector)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                1536-dimensional vectors in knowledge_embeddings table power
                RAG-based semantic search for the NeuroMCP assistant.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* NIH Data Linkages */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          NIH Data Linkages
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          The platform maintains live connections to NIH data systems, pulling grant and publication 
          data through Edge Functions and caching results in PostgreSQL.
        </p>
        <div className="space-y-4">
          {nihLinkages.map((link, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3 mb-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs shrink-0">
                    {link.source}
                  </Badge>
                  <code className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">{link.endpoint}</code>
                </div>
                <p className="text-sm text-muted-foreground mb-1.5">
                  <span className="font-medium text-foreground">Data:</span> {link.data}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Flow:</span> {link.flow}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Edge Functions Reference */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Edge Functions Reference
        </h2>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-2.5 px-4 text-foreground font-semibold">Function</th>
                <th className="text-left py-2.5 px-4 text-foreground font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {edgeFunctions.map((fn, i) => (
                <tr key={fn.name} className={i < edgeFunctions.length - 1 ? "border-b border-border/50" : ""}>
                  <td className="py-2 px-4">
                    <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">{fn.name}</code>
                  </td>
                  <td className="py-2 px-4 text-xs">{fn.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Data Flow */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Data Flow: Grant → Publication Pipeline
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">1</span>
                <span>BBQS grant numbers are configured in the platform</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">2</span>
                <span><code className="bg-secondary px-1 rounded">nih-grants</code> Edge Function queries NIH Reporter API for grant details, PI profiles, and PMIDs</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">3</span>
                <span>PI profile IDs are extracted → <code className="bg-secondary px-1 rounded">nih-pi-grants</code> fetches their full grant portfolio</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">4</span>
                <span>PMIDs are sent to iCite API to fetch publication metadata, citation counts, and RCR</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">5</span>
                <span>Combined data is cached in <code className="bg-secondary px-1 rounded">nih_grants_cache</code> and displayed in AG Grid tables</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">6</span>
                <span>Investigator names are normalized (Title Case, First Last) and deduplicated across grants</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}