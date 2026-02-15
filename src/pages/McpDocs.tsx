import { Link } from "react-router-dom";
import { Code, Terminal, Plug, ChevronRight, ArrowRight, Globe, Settings, Play, Search, Layers, Database, MessageSquare, Zap, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/api-docs/CodeBlock";
import { StepCard } from "@/components/api-docs/StepCard";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
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

export default function McpDocs() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero Header */}
      <div className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(150_60%_20%)] via-[hsl(160_50%_18%)] to-[hsl(170_45%_15%)] p-8 sm:p-10 text-[hsl(0_0%_100%)]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(150_60%_50%/0.15)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[hsl(38_90%_50%/0.1)] rounded-full blur-3xl translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[hsl(150_60%_45%)] flex items-center justify-center">
              <Plug className="h-6 w-6 text-[hsl(0_0%_100%)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">BBQS MCP Server</h1>
              <p className="text-[hsl(150_60%_75%)] text-sm">Model Context Protocol</p>
            </div>
          </div>
          <p className="text-[hsl(150_60%_85%)] text-sm sm:text-base max-w-2xl leading-relaxed">
            Connect BBQS as a native tool provider to AI agents. The MCP server exposes structured tools that Claude, Cursor, Windsurf, and other MCP-compatible clients can call directly — <span className="text-[hsl(38_90%_50%)] font-semibold">no custom code needed.</span>
          </p>
        </div>
      </div>

      {/* What is MCP? */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: Plug, title: "What is MCP?", desc: "Model Context Protocol is an open standard for connecting AI agents to external data sources and tools. Think of it as USB-C for AI.", gradient: "from-[hsl(150_60%_40%/0.1)] to-[hsl(150_60%_40%/0.03)]", iconBg: "bg-[hsl(150_60%_40%)]" },
          { icon: Zap, title: "Zero Configuration", desc: "MCP clients auto-discover available tools. Just point your client to the URL and start asking questions.", gradient: "from-[hsl(38_90%_50%/0.12)] to-[hsl(38_90%_50%/0.03)]", iconBg: "bg-[hsl(38_90%_50%)]" },
          { icon: Globe, title: "Streamable HTTP", desc: "Uses the modern Streamable HTTP transport — no WebSocket, SSE, or stdio required. Works everywhere.", gradient: "from-[hsl(222_47%_20%/0.1)] to-[hsl(222_47%_20%/0.03)]", iconBg: "bg-[hsl(222_47%_20%)]" },
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

      {/* MCP URL */}
      <div className="mb-10 border border-[hsl(150_60%_40%/0.3)] rounded-xl p-5 bg-gradient-to-r from-[hsl(150_60%_40%/0.06)] to-transparent">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(150_60%_40%)] mb-2 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" /> MCP Server URL
        </h3>
        <CodeBlock code={MCP_URL} />
        <p className="text-xs text-muted-foreground mt-2">Use this URL when configuring any MCP client. No API key required.</p>
      </div>

      {/* Available Tools */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[hsl(38_90%_50%)] flex items-center justify-center">
            <Zap className="h-4 w-4 text-[hsl(222_47%_15%)]" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Available Tools</h2>
        </div>
        <p className="text-sm text-muted-foreground ml-11 mb-5">These tools are automatically discovered by MCP clients when they connect to the server.</p>
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
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[hsl(222_47%_20%)] flex items-center justify-center">
            <Settings className="h-4 w-4 text-[hsl(0_0%_100%)]" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Setup Guides</h2>
        </div>
        <p className="text-sm text-muted-foreground ml-11">Step-by-step instructions for connecting BBQS to your AI tool of choice.</p>
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
      <div className="mb-10 border border-border rounded-xl p-6 bg-gradient-to-br from-card to-muted/30">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[hsl(38_90%_50%)]" />
          Technical Notes
        </h3>
        <ul className="text-xs text-muted-foreground space-y-2">
          {[
            "Uses Streamable HTTP transport — no SSE, WebSocket, or stdio required",
            "Tools are auto-discovered by MCP clients via the standard tools/list method",
            "The ask_bbqs tool uses RAG with vector embeddings for grounded answers",
            "All tool responses follow the MCP content format (text/content array)",
            "Server is rate-limited to prevent abuse",
            "No authentication required — the server is publicly accessible",
          ].map((note, i) => (
            <li key={i} className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 text-[hsl(150_60%_40%)] shrink-0 mt-0.5" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Link to REST API */}
      <Link
        to="/api-docs"
        className="block border border-[hsl(222_47%_20%/0.2)] rounded-xl p-5 bg-gradient-to-r from-[hsl(222_47%_20%/0.06)] to-transparent hover:shadow-md transition-shadow group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(222_47%_20%)] flex items-center justify-center">
              <Code className="h-5 w-5 text-[hsl(0_0%_100%)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Looking for the REST API?</h3>
              <p className="text-xs text-muted-foreground">Query BBQS data with standard HTTP endpoints — curl, fetch, Postman →</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </div>
      </Link>
    </div>
  );
}
