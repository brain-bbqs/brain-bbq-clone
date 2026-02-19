import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { PageMeta } from "@/components/PageMeta";
import { Terminal, BookOpen, Plug, ChevronRight, ArrowRight, Globe, Settings, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/api-docs/CodeBlock";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "@/styles/ag-grid-theme.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const BASE_URL = `${SUPABASE_URL}/functions/v1/bbqs-api`;

interface Endpoint {
  method: "GET" | "POST";
  path: string;
  description: string;
  params?: { name: string; type: string; description: string; required?: boolean }[];
  body?: { name: string; type: string; description: string; required?: boolean }[];
  example: string;
  exampleResponse: string;
}

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/projects",
    description: "List all BBQS projects with Marr-level features. Supports filtering by species, PI, or free-text search.",
    params: [
      { name: "species", type: "string", description: "Filter by species name (e.g. Mouse, Zebrafish)" },
      { name: "pi", type: "string", description: "Filter by principal investigator name" },
      { name: "q", type: "string", description: "Free-text search across all project fields" },
    ],
    example: `curl "${BASE_URL}/projects?species=Mouse"`,
    exampleResponse: `{
  "count": 3,
  "projects": [
    {
      "id": "R01MH129046",
      "shortName": "Datta – Mouse Behavior",
      "pi": "Sandeep Robert Datta",
      "species": "Mouse",
      "computational": ["Behavioral syllable discovery", ...],
      "algorithmic": ["Variational autoencoders", ...],
      "implementation": ["MoSeq", "keypoint-MoSeq", ...]
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/projects/:id",
    description: "Get a single project by its grant number.",
    example: `curl "${BASE_URL}/projects/R01MH129046"`,
    exampleResponse: `{
  "id": "R01MH129046",
  "shortName": "Datta – Mouse Behavior",
  "pi": "Sandeep Robert Datta",
  "species": "Mouse",
  "computational": [...],
  "algorithmic": [...],
  "implementation": [...]
}`,
  },
  {
    method: "GET",
    path: "/species",
    description: "List all species studied across BBQS, with project counts and names.",
    example: `curl "${BASE_URL}/species"`,
    exampleResponse: `{
  "species": [
    { "species": "Mouse", "projectCount": 3, "projects": ["Datta – Mouse Behavior", ...] },
    { "species": "Zebrafish", "projectCount": 3, "projects": [...] }
  ]
}`,
  },
  {
    method: "GET",
    path: "/ontology",
    description: "Get the full Marr-level feature ontology — all computational, algorithmic, and implementation features across BBQS.",
    example: `curl "${BASE_URL}/ontology"`,
    exampleResponse: `{
  "marrLevels": {
    "computational": ["Multi-animal social behavior quantification", ...],
    "algorithmic": ["Pose estimation", "Calcium imaging analysis", ...],
    "implementation": ["DeepLabCut", "SLEAP", "Suite2p", ...]
  }
}`,
  },
  {
    method: "GET",
    path: "/people",
    description: "Get all PIs and Co-PIs with pagination and advanced filtering by skill, research area, or organization.",
    params: [
      { name: "page", type: "int", description: "Page number (default 1, min 1)" },
      { name: "page_size", type: "int", description: "Results per page (default 50, min 1, max 200)" },
      { name: "search", type: "string", description: "Free-text search across PI names" },
      { name: "skill", type: "string", description: "Filter by skill (e.g. Pose estimation)" },
      { name: "research_area", type: "string", description: "Filter by research area (e.g. Social behavior)" },
      { name: "organization", type: "string", description: "Filter by institution name" },
    ],
    example: `curl "${BASE_URL}/people?skill=Pose%20estimation"`,
    exampleResponse: `{
  "count": 8,
  "page": 1,
  "page_size": 50,
  "people": [
    {
      "id": "eva-dyer",
      "name": "Eva Dyer",
      "organization": "Georgia Institute of Technology",
      "skills": ["Pose estimation", "Object detection", ...],
      "research_areas": ["Multi-animal social behavior quantification", ...]
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/person/:person_id",
    description: "Get detailed information about a specific PI or Co-PI.",
    example: `curl "${BASE_URL}/person/eva-dyer"`,
    exampleResponse: `{
  "id": "eva-dyer",
  "name": "Eva Dyer",
  "organization": "Georgia Institute of Technology",
  "skills": ["Pose estimation", "Object detection", ...],
  "research_areas": ["Multi-animal social behavior quantification", ...],
  "grants": [{ "grantNumber": "R34DA059510", "title": "..." }]
}`,
  },
  {
    method: "GET",
    path: "/person/:person_id/projects",
    description: "Get all projects for a person (as main PI or Co-PI) with pagination.",
    params: [
      { name: "page", type: "int", description: "Page number (default 1, min 1)" },
      { name: "page_size", type: "int", description: "Results per page (default 50, min 1, max 200)" },
    ],
    example: `curl "${BASE_URL}/person/eva-dyer/projects"`,
    exampleResponse: `{
  "count": 2,
  "projects": [
    { "id": "R34DA059510", "title": "Dyer – Cichlid Arena", "role": "contact_pi" }
  ]
}`,
  },
  {
    method: "GET",
    path: "/person/:person_id/evolution",
    description: "Temporal evolution of skills and research areas over time for a specific person.",
    params: [
      { name: "entity_type", type: "string", description: "Filter type: skills | research_areas | all (default: all)" },
    ],
    example: `curl "${BASE_URL}/person/eva-dyer/evolution?entity_type=skills"`,
    exampleResponse: `{
  "person_id": "eva-dyer",
  "evolution": {
    "2023": { "skills": ["Pose estimation"], "research_areas": [...] },
    "2024": { "skills": ["Pose estimation", "Graph modeling"], "research_areas": [...] }
  }
}`,
  },
  {
    method: "GET",
    path: "/skills",
    description: "Get all skills (algorithmic approaches) with pagination and optional year filter.",
    params: [
      { name: "page", type: "int", description: "Page number (default 1, min 1)" },
      { name: "page_size", type: "int", description: "Results per page (default 50, min 1, max 200)" },
      { name: "search", type: "string", description: "Free-text search across skill names" },
      { name: "year", type: "int", description: "Temporal filter by fiscal year" },
    ],
    example: `curl "${BASE_URL}/skills?search=pose"`,
    exampleResponse: `{
  "count": 1,
  "skills": [
    { "name": "Pose estimation", "project_count": 8, "people_count": 10 }
  ]
}`,
  },
  {
    method: "GET",
    path: "/skill/:skill_name",
    description: "Get skill detail, including associated projects and people.",
    example: `curl "${BASE_URL}/skill/Pose%20estimation"`,
    exampleResponse: `{
  "name": "Pose estimation",
  "projects": [{ "id": "R34DA059510", "shortName": "Dyer – Cichlid Arena" }],
  "people": [{ "name": "Eva Dyer" }, { "name": "Pulkit Grover" }]
}`,
  },
  {
    method: "GET",
    path: "/research-areas",
    description: "Get all research areas (computational problems) with pagination and optional year filter.",
    params: [
      { name: "page", type: "int", description: "Page number (default 1, min 1)" },
      { name: "page_size", type: "int", description: "Results per page (default 50, min 1, max 200)" },
      { name: "search", type: "string", description: "Free-text search across research area names" },
      { name: "year", type: "int", description: "Temporal filter by fiscal year" },
    ],
    example: `curl "${BASE_URL}/research-areas?search=social"`,
    exampleResponse: `{
  "count": 2,
  "research_areas": [
    { "name": "Multi-animal social behavior quantification", "project_count": 3, "people_count": 4 }
  ]
}`,
  },
  {
    method: "GET",
    path: "/research-area/:area_name",
    description: "Get research area detail, including associated projects and people.",
    example: `curl "${BASE_URL}/research-area/Multi-animal%20social%20behavior%20quantification"`,
    exampleResponse: `{
  "name": "Multi-animal social behavior quantification",
  "projects": [{ "id": "R34DA059510", "shortName": "Dyer – Cichlid Arena" }],
  "people": [{ "name": "Eva Dyer" }]
}`,
  },
  {
    method: "POST",
    path: "/ask",
    description: "Ask a natural-language question about the BBQS consortium. Uses RAG over the knowledge base to provide grounded answers.",
    body: [
      { name: "question", type: "string", description: "Your question about BBQS projects, tools, species, or workflows", required: true },
    ],
    example: `curl -X POST "${BASE_URL}/ask" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "What tools are used for pose estimation in BBQS?"}'`,
    exampleResponse: `{
  "answer": "Several BBQS projects use pose estimation tools including DeepLabCut (used by Dyer, Mathis), SLEAP (used by Murthy, Pereira), and DANNCE for 3D pose estimation (Ölveczky).",
  "sources": [
    { "type": "project", "title": "Dyer – Cichlid Arena" },
    { "type": "tool", "title": "DeepLabCut" }
  ],
  "model": "google/gemini-2.5-flash"
}`,
  },
];

// AG Grid row data from endpoints
const gridRowData = endpoints.map((ep) => ({
  method: ep.method,
  path: ep.path,
  description: ep.description,
  parameters: ep.params
    ? ep.params.map((p) => p.name).join(", ")
    : ep.body
      ? ep.body.map((p) => `${p.name}${p.required ? "*" : ""}`).join(", ")
      : "—",
  auth: "None",
}));

function MethodCellRenderer(params: ICellRendererParams) {
  const isPost = params.value === "POST";
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-bold px-2 py-0.5 rounded",
        isPost
          ? "bg-[hsl(229_50%_15%)] text-[hsl(38_90%_50%)]"
          : "bg-[hsl(229_50%_15%)] text-[hsl(0_0%_100%)]"
      )}
    >
      {params.value}
    </span>
  );
}

function PathCellRenderer(params: ICellRendererParams) {
  return <code className="font-mono text-xs text-foreground">{params.value}</code>;
}

function EndpointDetail({ endpoint }: { endpoint: Endpoint }) {
  const [showResponse, setShowResponse] = useState(false);

  return (
    <div id={endpoint.path.replace(/[/:]/g, "-")} className="border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center gap-3">
        <span
          className={cn(
            "font-mono text-[11px] font-bold px-2 py-0.5 rounded",
            endpoint.method === "POST"
              ? "bg-[hsl(229_50%_15%)] text-[hsl(38_90%_50%)]"
              : "bg-[hsl(229_50%_15%)] text-[hsl(0_0%_100%)]"
          )}
        >
          {endpoint.method}
        </span>
        <code className="text-sm font-mono font-semibold text-foreground">{endpoint.path}</code>
      </div>

      <div className="px-5 py-4 space-y-4 bg-card">
        <p className="text-sm text-muted-foreground">{endpoint.description}</p>

        {endpoint.params && endpoint.params.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Settings className="h-3 w-3" /> Query Parameters
            </h4>
            <table className="w-full text-xs border border-border rounded overflow-hidden">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">Name</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">Type</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.params.map((p) => (
                  <tr key={p.name} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-mono text-foreground">{p.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.type}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {endpoint.body && endpoint.body.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Code className="h-3 w-3" /> Request Body (JSON)
            </h4>
            <table className="w-full text-xs border border-border rounded overflow-hidden">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">Field</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">Type</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">Required</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.body.map((p) => (
                  <tr key={p.name} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-mono text-foreground">{p.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.type}</td>
                    <td className="px-3 py-2">{p.required ? "Yes" : "No"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Terminal className="h-3 w-3" /> Example Request
          </h4>
          <CodeBlock code={endpoint.example} />
        </div>

        <div>
          <button
            onClick={() => setShowResponse(!showResponse)}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors flex items-center gap-1"
          >
            <ChevronRight className={cn("h-3 w-3 transition-transform", showResponse && "rotate-90")} />
            {showResponse ? "Hide" : "Show"} example response
          </button>
          {showResponse && (
            <div className="mt-2">
              <CodeBlock code={endpoint.exampleResponse} language="json" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApiDocs() {
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: "Method",
      field: "method",
      width: 100,
      cellRenderer: MethodCellRenderer,
      sortable: true,
    },
    {
      headerName: "Endpoint",
      field: "path",
      flex: 1,
      minWidth: 160,
      cellRenderer: PathCellRenderer,
      sortable: true,
    },
    {
      headerName: "Description",
      field: "description",
      flex: 2,
      minWidth: 250,
      sortable: false,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Parameters",
      field: "parameters",
      width: 160,
      sortable: false,
      cellClass: "font-mono text-xs",
    },
    {
      headerName: "Auth",
      field: "auth",
      width: 80,
      sortable: false,
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
  }), []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <PageMeta title="API Reference" description="BBQS Public API documentation — REST endpoints for projects, species, Marr-level ontology, and AI-powered Q&A." />
      {/* Header — formal, minimal */}
      <div className="mb-8 border-b-2 border-border pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="h-6 w-6 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">BBQS Public API Reference</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Programmatic access to BBQS consortium data — projects, species, Marr-level ontology, and an AI-powered Q&A endpoint. All endpoints are publicly accessible. No authentication required.
        </p>
      </div>

      {/* Base URL */}
      <div className="mb-8 border border-border rounded-lg p-4 bg-muted/30">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" /> Base URL
        </h3>
        <CodeBlock code={BASE_URL} />
        <p className="text-xs text-muted-foreground mt-2">All REST endpoints are relative to this base URL.</p>
      </div>

      {/* Endpoints Summary — AG Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <BookOpen className="h-4.5 w-4.5 text-muted-foreground" />
          Endpoint Summary
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Overview of all available API endpoints.</p>
        <div className="ag-theme-alpine rounded-lg overflow-hidden border border-border" style={{ width: "100%", height: 500 }}>
          <AgGridReact
            rowData={gridRowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="normal"
            suppressCellFocus
            suppressRowHoverHighlight={false}
          />
        </div>
      </div>

      {/* Detailed Endpoint Reference */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-1">Endpoint Reference</h2>
        <p className="text-xs text-muted-foreground mb-4">Detailed documentation for each endpoint including parameters, examples, and responses.</p>
      </div>

      <div className="space-y-5 mb-10">
        {endpoints.map((ep) => (
          <EndpointDetail key={`${ep.method}-${ep.path}`} endpoint={ep} />
        ))}
      </div>

      {/* Usage Notes */}
      <div className="mb-10 border border-border rounded-lg p-5 bg-muted/20">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          Usage Notes
        </h3>
        <ul className="text-xs text-muted-foreground space-y-2">
          {[
            <>All responses return JSON with <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">Content-Type: application/json</code></>,
            <>The <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">/ask</code> endpoint uses RAG over the BBQS knowledge base</>,
            "Questions are limited to 2,000 characters",
            "Knowledge graph endpoints serve static metadata and respond instantly",
            "CORS is enabled — call endpoints directly from browser-based applications",
            "Endpoints are rate-limited to prevent abuse",
          ].map((note, i) => (
            <li key={i} className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Link to MCP */}
      <Link
        to="/mcp-docs"
        className="block border border-border rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plug className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">MCP Server Documentation</h3>
              <p className="text-xs text-muted-foreground">Connect BBQS to Claude, Cursor, Windsurf, and other AI agents</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
