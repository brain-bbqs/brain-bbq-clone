import { useState } from "react";
import { Code, Copy, Check, Terminal, BookOpen, Zap, Database, MessageSquare, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bbqs-api`;
const MCP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bbqs-mcp`;

const mcpTools = [
  { name: "search_projects", description: "Search projects by species, PI, or free-text query. Returns Marr-level features.", params: ["species", "pi", "query"] },
  { name: "get_ontology", description: "Get the complete Marr-level feature ontology across all BBQS projects.", params: [] },
  { name: "list_species", description: "List all species with project counts and associated project names.", params: [] },
  { name: "ask_bbqs", description: "Ask a natural-language question using RAG over the BBQS knowledge base.", params: ["question"] },
];

const claudeConfig = `{
  "mcpServers": {
    "bbqs": {
      "url": "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bbqs-mcp"
    }
  }
}`;

const cursorConfig = `{
  "name": "bbqs",
  "transport": "streamable-http",
  "url": "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bbqs-mcp"
}`;

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

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-secondary/80 hover:bg-secondary text-secondary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="bg-muted border border-border rounded-lg p-4 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [showResponse, setShowResponse] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-mono font-bold px-2 py-0.5",
              endpoint.method === "GET"
                ? "border-primary/40 text-primary bg-primary/10"
                : "border-accent/40 text-accent-foreground bg-accent/50"
            )}
          >
            {endpoint.method}
          </Badge>
          <code className="text-sm font-mono font-semibold text-foreground">{endpoint.path}</code>
        </div>
        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {endpoint.params && endpoint.params.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Query Parameters</h4>
            <div className="space-y-1.5">
              {endpoint.params.map((p) => (
                <div key={p.name} className="flex items-start gap-2 text-sm">
                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-primary shrink-0">{p.name}</code>
                  <span className="text-muted-foreground text-xs">{p.type}</span>
                  <span className="text-foreground/80 text-xs">— {p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {endpoint.body && endpoint.body.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Request Body (JSON)</h4>
            <div className="space-y-1.5">
              {endpoint.body.map((p) => (
                <div key={p.name} className="flex items-start gap-2 text-sm">
                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-primary shrink-0">{p.name}</code>
                  <span className="text-muted-foreground text-xs">{p.type}</span>
                  {p.required && <Badge variant="outline" className="text-[10px] px-1 py-0">required</Badge>}
                  <span className="text-foreground/80 text-xs">— {p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Example</h4>
          <CodeBlock code={endpoint.example} />
        </div>

        <div>
          <button
            onClick={() => setShowResponse(!showResponse)}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
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
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">BBQS Public API</h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
          Programmatic access to BBQS consortium data — projects, species, Marr-level ontology, and an AI-powered Q&A endpoint. No authentication required.
        </p>
      </div>

      {/* Base URL */}
      <div className="mb-8 border border-border rounded-lg p-4 bg-card">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Base URL</h3>
        <CodeBlock code={BASE_URL} />
      </div>

      {/* Quick overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="border border-border rounded-lg p-4 bg-card">
          <Database className="h-5 w-5 text-primary mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Cross-Species Explorer</h3>
          <p className="text-xs text-muted-foreground mt-1">Query projects, species, and Marr-level features across the consortium.</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <MessageSquare className="h-5 w-5 text-primary mb-2" />
          <h3 className="text-sm font-semibold text-foreground">AI Q&A</h3>
          <p className="text-xs text-muted-foreground mt-1">Ask natural-language questions grounded in the BBQS knowledge base.</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <Zap className="h-5 w-5 text-primary mb-2" />
          <h3 className="text-sm font-semibold text-foreground">No Auth Required</h3>
          <p className="text-xs text-muted-foreground mt-1">All endpoints are publicly accessible. No API keys needed.</p>
        </div>
      </div>

      {/* Endpoints */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          Endpoints
        </h2>
      </div>

      <div className="space-y-6">
        {endpoints.map((ep) => (
          <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
        ))}
      </div>

      {/* MCP Server Section */}
      <div className="mt-14 mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
          <Plug className="h-5 w-5 text-primary" />
          MCP Server (Model Context Protocol)
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Connect BBQS as a tool provider to Claude Desktop, Cursor, Windsurf, or any MCP-compatible AI agent.
          The MCP server exposes structured tools that agents can call natively.
        </p>
      </div>

      <div className="space-y-6">
        {/* MCP Endpoint */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-1">MCP Server URL</h3>
            <p className="text-xs text-muted-foreground">Use this URL when configuring your MCP client.</p>
          </div>
          <div className="px-5 py-4">
            <CodeBlock code={MCP_URL} />
          </div>
        </div>

        {/* Available Tools */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-1">Available Tools</h3>
            <p className="text-xs text-muted-foreground">These tools are automatically discovered by MCP clients.</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            {mcpTools.map((tool) => (
              <div key={tool.name} className="flex items-start gap-3">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-primary shrink-0 mt-0.5">{tool.name}</code>
                <div>
                  <p className="text-sm text-foreground">{tool.description}</p>
                  {tool.params.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Params: {tool.params.map(p => <code key={p} className="bg-muted px-1 rounded mx-0.5">{p}</code>)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Claude Desktop Config */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-1">Claude Desktop Configuration</h3>
            <p className="text-xs text-muted-foreground">Add this to your <code className="bg-muted px-1 rounded">claude_desktop_config.json</code></p>
          </div>
          <div className="px-5 py-4">
            <CodeBlock code={claudeConfig} language="json" />
          </div>
        </div>

        {/* Cursor / Generic Config */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-1">Cursor / Generic MCP Client</h3>
            <p className="text-xs text-muted-foreground">For clients that support Streamable HTTP transport, point to the MCP URL directly.</p>
          </div>
          <div className="px-5 py-4">
            <CodeBlock code={cursorConfig} language="json" />
          </div>
        </div>

        {/* Testing with Inspector */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-1">Test with MCP Inspector</h3>
            <p className="text-xs text-muted-foreground">Verify the server works using the official MCP Inspector tool.</p>
          </div>
          <div className="px-5 py-4">
            <CodeBlock code={`npx @modelcontextprotocol/inspector`} />
            <p className="text-xs text-muted-foreground mt-2">Then enter the MCP URL in the inspector UI to browse available tools and test them interactively.</p>
          </div>
        </div>
      </div>

      {/* Usage Notes */}
      <div className="mt-10 border border-border rounded-lg p-5 bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-2">Usage Notes</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>All REST responses are JSON with <code className="bg-muted px-1 rounded">Content-Type: application/json</code></li>
          <li>The <code className="bg-muted px-1 rounded">/ask</code> endpoint and <code className="bg-muted px-1 rounded">ask_bbqs</code> MCP tool use RAG over the BBQS knowledge base</li>
          <li>Questions are limited to 2000 characters</li>
          <li>The knowledge graph data endpoints serve static project metadata and respond instantly</li>
          <li>CORS is enabled — you can call REST endpoints directly from browser-based applications</li>
          <li>The MCP server uses Streamable HTTP transport — no SSE or WebSocket required</li>
        </ul>
      </div>
    </div>
  );
}
