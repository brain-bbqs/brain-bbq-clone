import { useState } from "react";
import { Code, Copy, Check, Terminal, BookOpen, Zap, Database, MessageSquare, Plug, ChevronRight, ArrowRight, Globe, Settings, Play, Search, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const BASE_URL = `${SUPABASE_URL}/functions/v1/bbqs-api`;
const MCP_URL = `${SUPABASE_URL}/functions/v1/bbqs-mcp`;

const mcpTools = [
  { name: "search_projects", description: "Search projects by species, PI, or free-text query. Returns Marr-level features.", params: ["species", "pi", "query"], icon: Search },
  { name: "get_ontology", description: "Get the complete Marr-level feature ontology across all BBQS projects.", params: [], icon: Layers },
  { name: "list_species", description: "List all species with project counts and associated project names.", params: [], icon: Database },
  { name: "ask_bbqs", description: "Ask a natural-language question using RAG over the BBQS knowledge base.", params: ["question"], icon: MessageSquare },
];

const claudeConfig = `{
  "mcpServers": {
    "bbqs": {
      "url": "${SUPABASE_URL}/functions/v1/bbqs-mcp"
    }
  }
}`;

const cursorConfig = `{
  "name": "bbqs",
  "transport": "streamable-http",
  "url": "${SUPABASE_URL}/functions/v1/bbqs-mcp"
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
        className="absolute top-2 right-2 p-1.5 rounded bg-secondary/80 hover:bg-secondary text-secondary-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="bg-[hsl(229_50%_12%)] border border-[hsl(229_45%_20%)] rounded-lg p-4 text-xs font-mono text-[hsl(220_20%_85%)] overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [showResponse, setShowResponse] = useState(false);
  const isPost = endpoint.method === "POST";
  return (
    <div className="border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className={cn(
        "px-5 py-4 border-b border-border",
        isPost
          ? "bg-gradient-to-r from-[hsl(38_90%_50%/0.08)] to-[hsl(38_90%_50%/0.02)]"
          : "bg-gradient-to-r from-[hsl(222_47%_20%/0.06)] to-transparent"
      )}>
        <div className="flex items-center gap-3 mb-2">
          <Badge
            className={cn(
              "text-[11px] font-mono font-bold px-2.5 py-0.5 border-0",
              isPost
                ? "bg-[hsl(38_90%_50%)] text-[hsl(222_47%_15%)]"
                : "bg-[hsl(222_47%_20%)] text-[hsl(0_0%_100%)]"
            )}
          >
            {endpoint.method}
          </Badge>
          <code className="text-sm font-mono font-semibold text-foreground">{endpoint.path}</code>
        </div>
        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
      </div>

      <div className="px-5 py-4 space-y-4 bg-card">
        {endpoint.params && endpoint.params.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Settings className="h-3 w-3" /> Query Parameters
            </h4>
            <div className="space-y-2 bg-muted/50 rounded-lg p-3">
              {endpoint.params.map((p) => (
                <div key={p.name} className="flex items-start gap-2 text-sm">
                  <code className="text-xs font-mono bg-[hsl(222_47%_20%)] text-[hsl(0_0%_100%)] px-1.5 py-0.5 rounded shrink-0">{p.name}</code>
                  <span className="text-[hsl(38_90%_50%)] text-xs font-medium">{p.type}</span>
                  <span className="text-foreground/80 text-xs">— {p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {endpoint.body && endpoint.body.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Code className="h-3 w-3" /> Request Body (JSON)
            </h4>
            <div className="space-y-2 bg-muted/50 rounded-lg p-3">
              {endpoint.body.map((p) => (
                <div key={p.name} className="flex items-start gap-2 text-sm">
                  <code className="text-xs font-mono bg-[hsl(222_47%_20%)] text-[hsl(0_0%_100%)] px-1.5 py-0.5 rounded shrink-0">{p.name}</code>
                  <span className="text-[hsl(38_90%_50%)] text-xs font-medium">{p.type}</span>
                  {p.required && <Badge className="text-[10px] px-1.5 py-0 bg-[hsl(0_70%_50%)] text-[hsl(0_0%_100%)] border-0">required</Badge>}
                  <span className="text-foreground/80 text-xs">— {p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Terminal className="h-3 w-3" /> Example
          </h4>
          <CodeBlock code={endpoint.example} />
        </div>

        <div>
          <button
            onClick={() => setShowResponse(!showResponse)}
            className="text-xs text-[hsl(38_90%_50%)] hover:text-[hsl(38_90%_60%)] font-semibold transition-colors flex items-center gap-1"
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

function StepCard({ step, number, color }: { step: { title: string; description: string; detail?: string }; number: number; color: string }) {
  return (
    <div className="flex gap-4">
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-[hsl(0_0%_100%)]", color)}>
        {number}
      </div>
      <div className="flex-1 pb-6">
        <h4 className="text-sm font-semibold text-foreground mb-1">{step.title}</h4>
        <p className="text-xs text-muted-foreground">{step.description}</p>
        {step.detail && (
          <p className="text-xs text-muted-foreground mt-1 italic">{step.detail}</p>
        )}
      </div>
    </div>
  );
}

export default function ApiDocs() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero Header */}
      <div className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(222_47%_18%)] via-[hsl(229_50%_15%)] to-[hsl(222_47%_12%)] p-8 sm:p-10 text-[hsl(0_0%_100%)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(38_90%_50%/0.15)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[hsl(222_47%_40%/0.2)] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[hsl(38_90%_50%)] flex items-center justify-center">
              <Terminal className="h-6 w-6 text-[hsl(222_47%_15%)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">BBQS Public API</h1>
              <p className="text-[hsl(220_20%_75%)] text-sm">& MCP Server</p>
            </div>
          </div>
          <p className="text-[hsl(220_20%_80%)] text-sm sm:text-base max-w-2xl leading-relaxed">
            Programmatic access to BBQS consortium data — projects, species, Marr-level ontology, and an AI-powered Q&A endpoint. <span className="text-[hsl(38_90%_50%)] font-semibold">No authentication required.</span>
          </p>
        </div>
      </div>

      {/* Quick overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: Database, title: "Cross-Species Explorer", desc: "Query projects, species, and Marr-level features across the consortium.", gradient: "from-[hsl(222_47%_20%/0.1)] to-[hsl(222_47%_20%/0.03)]", iconBg: "bg-[hsl(222_47%_20%)]" },
          { icon: MessageSquare, title: "AI-Powered Q&A", desc: "Ask natural-language questions grounded in the BBQS knowledge base.", gradient: "from-[hsl(38_90%_50%/0.12)] to-[hsl(38_90%_50%/0.03)]", iconBg: "bg-[hsl(38_90%_50%)]" },
          { icon: Plug, title: "MCP Integration", desc: "Connect directly to Claude, Cursor, or any MCP-compatible AI agent.", gradient: "from-[hsl(150_60%_40%/0.1)] to-[hsl(150_60%_40%/0.03)]", iconBg: "bg-[hsl(150_60%_40%)]" },
        ].map((card) => (
          <div key={card.title} className={cn("border border-border rounded-xl p-5 bg-gradient-to-br", card.gradient)}>
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", card.iconBg)}>
              <card.icon className="h-4.5 w-4.5 text-[hsl(0_0%_100%)]" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Base URL */}
      <div className="mb-10 border border-[hsl(38_90%_50%/0.3)] rounded-xl p-5 bg-gradient-to-r from-[hsl(38_90%_50%/0.06)] to-transparent">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(38_90%_50%)] mb-2 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" /> Base URL
        </h3>
        <CodeBlock code={BASE_URL} />
        <p className="text-xs text-muted-foreground mt-2">All REST endpoints are relative to this base URL. No API key or authentication header is needed.</p>
      </div>

      {/* REST API Section */}
      <div id="rest" className="mb-6 scroll-mt-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[hsl(222_47%_20%)] flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-[hsl(0_0%_100%)]" />
          </div>
          <h2 className="text-xl font-bold text-foreground">REST API Endpoints</h2>
        </div>
        <p className="text-sm text-muted-foreground ml-11 mb-6">Standard HTTP endpoints for querying BBQS data. Works with any HTTP client — curl, fetch, Postman, etc.</p>
      </div>

      <div className="space-y-6 mb-14">
        {endpoints.map((ep) => (
          <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
        ))}
      </div>

      {/* ─── MCP SERVER SECTION ─── */}
      <div id="mcp" className="scroll-mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(150_60%_20%)] via-[hsl(160_50%_18%)] to-[hsl(170_45%_15%)] p-8 sm:p-10 text-[hsl(0_0%_100%)] mb-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(150_60%_50%/0.15)] rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[hsl(150_60%_45%)] flex items-center justify-center">
              <Plug className="h-6 w-6 text-[hsl(0_0%_100%)]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">MCP Server</h2>
              <p className="text-[hsl(150_60%_75%)] text-sm">Model Context Protocol</p>
            </div>
          </div>
          <p className="text-[hsl(150_60%_85%)] text-sm max-w-2xl leading-relaxed">
            Connect BBQS as a native tool provider to AI agents. The MCP server exposes structured tools that Claude, Cursor, Windsurf, and other MCP-compatible clients can call directly — no custom code needed.
          </p>
        </div>
      </div>

      {/* MCP URL */}
      <div className="mb-8 border border-[hsl(150_60%_40%/0.3)] rounded-xl p-5 bg-gradient-to-r from-[hsl(150_60%_40%/0.06)] to-transparent">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(150_60%_40%)] mb-2 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" /> MCP Server URL
        </h3>
        <CodeBlock code={MCP_URL} />
        <p className="text-xs text-muted-foreground mt-2">Uses Streamable HTTP transport — no SSE or WebSocket required.</p>
      </div>

      {/* Available Tools */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-[hsl(38_90%_50%)]" /> Available Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mcpTools.map((tool) => (
            <div key={tool.name} className="border border-border rounded-xl p-4 bg-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[hsl(222_47%_20%)] flex items-center justify-center">
                  <tool.icon className="h-3.5 w-3.5 text-[hsl(0_0%_100%)]" />
                </div>
                <code className="text-xs font-mono font-bold text-[hsl(38_90%_50%)]">{tool.name}</code>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
              {tool.params.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {tool.params.map(p => (
                    <Badge key={p} variant="outline" className="text-[10px] font-mono border-border">{p}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── SETUP GUIDES ─── */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <Settings className="h-5 w-5 text-[hsl(38_90%_50%)]" /> Setup Guides
        </h3>
        <p className="text-sm text-muted-foreground">Step-by-step instructions for connecting BBQS to your AI tool of choice.</p>
      </div>

      {/* Claude Desktop */}
      <div className="mb-6 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-[hsl(25_80%_50%/0.1)] to-transparent border-b border-border">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-[hsl(25_80%_50%)] text-[hsl(0_0%_100%)] flex items-center justify-center text-xs font-bold">C</span>
            Claude Desktop
          </h4>
        </div>
        <div className="px-5 py-5 bg-card space-y-0">
          <StepCard number={1} color="bg-[hsl(222_47%_20%)]" step={{
            title: "Open Claude Desktop settings",
            description: "Click the Claude menu in your menu bar → Settings → Developer → Edit Config.",
            detail: "On macOS, the config file is at ~/Library/Application Support/Claude/claude_desktop_config.json"
          }} />
          <StepCard number={2} color="bg-[hsl(38_90%_50%)]" step={{
            title: "Add the BBQS MCP server config",
            description: "Paste the JSON below into your claude_desktop_config.json file. If you already have other MCP servers, add the \"bbqs\" key inside the existing \"mcpServers\" object.",
          }} />
          <div className="ml-12 mb-4">
            <CodeBlock code={claudeConfig} language="json" />
          </div>
          <StepCard number={3} color="bg-[hsl(150_60%_40%)]" step={{
            title: "Restart Claude Desktop",
            description: "Fully quit and reopen Claude Desktop. You should see a hammer 🔨 icon in the chat input — click it to verify the BBQS tools are listed.",
            detail: "You'll see search_projects, get_ontology, list_species, and ask_bbqs in the tools list."
          }} />
          <StepCard number={4} color="bg-[hsl(280_60%_50%)]" step={{
            title: "Start asking questions!",
            description: "Try: \"Use BBQS to find all projects studying zebrafish\" or \"What pose estimation tools do BBQS projects use?\"",
          }} />
        </div>
      </div>

      {/* Cursor */}
      <div className="mb-6 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-[hsl(220_80%_55%/0.1)] to-transparent border-b border-border">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-[hsl(220_80%_55%)] text-[hsl(0_0%_100%)] flex items-center justify-center text-xs font-bold">⌘</span>
            Cursor
          </h4>
        </div>
        <div className="px-5 py-5 bg-card space-y-0">
          <StepCard number={1} color="bg-[hsl(222_47%_20%)]" step={{
            title: "Open Cursor Settings",
            description: "Go to Cursor → Settings → MCP Servers (or press Cmd+Shift+P → \"MCP: Add Server\").",
          }} />
          <StepCard number={2} color="bg-[hsl(38_90%_50%)]" step={{
            title: "Add a new MCP server",
            description: "Click \"+ Add Server\" and paste the config below. Select \"Streamable HTTP\" as the transport type.",
          }} />
          <div className="ml-12 mb-4">
            <CodeBlock code={cursorConfig} language="json" />
          </div>
          <StepCard number={3} color="bg-[hsl(150_60%_40%)]" step={{
            title: "Verify the connection",
            description: "The BBQS tools should appear in the MCP panel. You can now reference them in your Cursor chat with @bbqs.",
          }} />
        </div>
      </div>

      {/* Windsurf & Generic */}
      <div className="mb-6 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-[hsl(280_60%_50%/0.1)] to-transparent border-b border-border">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-[hsl(280_60%_50%)] text-[hsl(0_0%_100%)] flex items-center justify-center text-xs font-bold">◆</span>
            Windsurf & Other MCP Clients
          </h4>
        </div>
        <div className="px-5 py-5 bg-card space-y-0">
          <StepCard number={1} color="bg-[hsl(222_47%_20%)]" step={{
            title: "Find the MCP settings in your client",
            description: "Most MCP-compatible tools have a configuration file or UI for adding MCP servers. Check your tool's documentation for the exact location.",
          }} />
          <StepCard number={2} color="bg-[hsl(38_90%_50%)]" step={{
            title: "Configure the server URL",
            description: `Point your MCP client to the BBQS MCP URL. Use "streamable-http" as the transport type if your client asks.`,
          }} />
          <div className="ml-12 mb-4">
            <CodeBlock code={MCP_URL} />
          </div>
          <StepCard number={3} color="bg-[hsl(150_60%_40%)]" step={{
            title: "That's it!",
            description: "The MCP server auto-advertises its tools. Your client will discover search_projects, get_ontology, list_species, and ask_bbqs automatically.",
          }} />
        </div>
      </div>

      {/* Testing with Inspector */}
      <div className="mb-10 border border-[hsl(38_90%_50%/0.3)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-[hsl(38_90%_50%/0.1)] to-transparent border-b border-border">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Play className="h-4 w-4 text-[hsl(38_90%_50%)]" />
            Test with MCP Inspector
          </h4>
          <p className="text-xs text-muted-foreground mt-1">Verify the server works before connecting to your AI tool.</p>
        </div>
        <div className="px-5 py-5 bg-card space-y-0">
          <StepCard number={1} color="bg-[hsl(222_47%_20%)]" step={{
            title: "Run the MCP Inspector",
            description: "Open a terminal and run the command below. This launches a local web UI for testing MCP servers.",
          }} />
          <div className="ml-12 mb-4">
            <CodeBlock code="npx @modelcontextprotocol/inspector" />
          </div>
          <StepCard number={2} color="bg-[hsl(38_90%_50%)]" step={{
            title: "Enter the BBQS MCP URL",
            description: "In the Inspector UI, select \"Streamable HTTP\" transport and paste the MCP URL. Click Connect.",
          }} />
          <div className="ml-12 mb-4">
            <CodeBlock code={MCP_URL} />
          </div>
          <StepCard number={3} color="bg-[hsl(150_60%_40%)]" step={{
            title: "Browse and test tools",
            description: "Click \"List Tools\" to see all available BBQS tools. Select any tool, fill in test parameters, and click \"Call Tool\" to see the response.",
            detail: "Try calling search_projects with species=\"Mouse\" to verify everything works end-to-end."
          }} />
        </div>
      </div>

      {/* Usage Notes */}
      <div className="border border-border rounded-xl p-6 bg-gradient-to-br from-card to-muted/30">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[hsl(38_90%_50%)]" />
          Usage Notes
        </h3>
        <ul className="text-xs text-muted-foreground space-y-2">
          {[
            <>All REST responses return JSON with <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">Content-Type: application/json</code></>,
            <>The <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">/ask</code> endpoint and <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">ask_bbqs</code> MCP tool use RAG over the BBQS knowledge base</>,
            "Questions are limited to 2,000 characters",
            "Knowledge graph endpoints serve static metadata and respond instantly",
            "CORS is enabled — call REST endpoints directly from browser-based applications",
            "The MCP server uses Streamable HTTP transport — no SSE or WebSocket required",
            "Both the REST API and MCP server are rate-limited to prevent abuse",
          ].map((note, i) => (
            <li key={i} className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 text-[hsl(38_90%_50%)] shrink-0 mt-0.5" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
