import { useState, useEffect } from "react";
import { PageMeta } from "@/components/PageMeta";
import { Plug, Plus, Globe, Package, Search, ChevronRight, Github, Loader2, Check, Clock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { CodeBlock } from "@/components/api-docs/CodeBlock";
import { useToast } from "@/hooks/use-toast";

interface McpServer {
  id: string;
  name: string;
  description: string;
  author: string;
  url: string;
  transport: string;
  tools: string[];
  species: string[];
  status: string;
  github_url: string | null;
  pip_package: string | null;
  submitted_at: string;
}

function SubmitForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    author: "",
    url: "",
    transport: "streamable-http",
    tools: "",
    species: "",
    github_url: "",
    pip_package: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to submit an MCP server.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("community_mcp_servers").insert({
        name: form.name,
        description: form.description,
        author: form.author,
        url: form.url,
        transport: form.transport,
        tools: form.tools.split(",").map(t => t.trim()).filter(Boolean),
        species: form.species.split(",").map(s => s.trim()).filter(Boolean),
        github_url: form.github_url || null,
        pip_package: form.pip_package || null,
        submitted_by: user.id,
      });
      if (error) throw error;
      toast({ title: "Submitted!", description: "Your MCP server has been submitted for review." });
      setForm({ name: "", description: "", author: "", url: "", transport: "streamable-http", tools: "", species: "", github_url: "", pip_package: "" });
      onSubmitted();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors";
  const labelClass = "block text-xs font-semibold text-foreground mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Server Name *</label>
          <input className={inputClass} placeholder="e.g. Pose Estimation MCP" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className={labelClass}>Author / Lab *</label>
          <input className={inputClass} placeholder="e.g. Datta Lab" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} required />
        </div>
      </div>
      <div>
        <label className={labelClass}>Description *</label>
        <textarea className={cn(inputClass, "min-h-[80px]")} placeholder="What does your MCP server do? What tools does it expose?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>MCP Server URL *</label>
          <input className={inputClass} placeholder="https://your-server.com/mcp" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required type="url" />
        </div>
        <div>
          <label className={labelClass}>Transport</label>
          <select className={inputClass} value={form.transport} onChange={e => setForm({ ...form, transport: e.target.value })}>
            <option value="streamable-http">Streamable HTTP</option>
            <option value="sse">SSE</option>
            <option value="stdio">stdio</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tool Names (comma-separated) *</label>
          <input className={inputClass} placeholder="e.g. estimate_pose, classify_behavior" value={form.tools} onChange={e => setForm({ ...form, tools: e.target.value })} required />
        </div>
        <div>
          <label className={labelClass}>Species (comma-separated)</label>
          <input className={inputClass} placeholder="e.g. Mouse, Zebrafish" value={form.species} onChange={e => setForm({ ...form, species: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>GitHub URL</label>
          <input className={inputClass} placeholder="https://github.com/..." value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })} type="url" />
        </div>
        <div>
          <label className={labelClass}>pip Package</label>
          <input className={inputClass} placeholder="e.g. my-neuro-tools" value={form.pip_package} onChange={e => setForm({ ...form, pip_package: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-muted-foreground">Submissions are reviewed before appearing in the registry.</p>
        <Button type="submit" disabled={submitting} size="sm">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          Submit
        </Button>
      </div>
    </form>
  );
}

function ServerCard({ server }: { server: McpServer }) {
  const configSnippet = `{
  "mcpServers": {
    "${server.name.toLowerCase().replace(/\s+/g, "-")}": {
      "url": "${server.url}"
    }
  }
}`;
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 bg-muted/40 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              {server.name}
              {server.status === "approved" && (
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                  <Check className="h-2.5 w-2.5 mr-0.5" /> Verified
                </Badge>
              )}
              {server.status === "pending" && (
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                  <Clock className="h-2.5 w-2.5 mr-0.5" /> Pending
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">by {server.author}</p>
          </div>
          <div className="flex gap-1.5">
            {server.github_url && (
              <a href={server.github_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-3.5 w-3.5" />
              </a>
            )}
            {server.pip_package && (
              <Badge variant="outline" className="text-[10px] font-mono h-7 flex items-center">
                <Package className="h-3 w-3 mr-1" /> {server.pip_package}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 bg-card">
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{server.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {server.tools.map(tool => (
            <Badge key={tool} variant="outline" className="text-[10px] font-mono border-border">{tool}</Badge>
          ))}
        </div>
        {server.species.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {server.species.map(s => (
              <Badge key={s} variant="outline" className="text-[10px] border-border">{s}</Badge>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 transition-colors"
        >
          <ChevronRight className={cn("h-3 w-3 transition-transform", showConfig && "rotate-90")} />
          {showConfig ? "Hide" : "Show"} connection config
        </button>
        {showConfig && (
          <div className="mt-2">
            <CodeBlock code={configSnippet} language="json" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function McpRegistry() {
  const { user } = useAuth();
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchServers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("community_mcp_servers")
      .select("*")
      .order("submitted_at", { ascending: false });
    setServers((data as McpServer[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchServers(); }, []);

  const officialServer: McpServer = {
    id: "bbqs-official",
    name: "BBQS Official",
    description: "The official BBQS MCP server — search projects, explore Marr-level ontology, list species, and ask AI-powered questions about the consortium.",
    author: "BBQS Consortium",
    url: `${import.meta.env.VITE_SUPABASE_URL || ""}/functions/v1/bbqs-mcp`,
    transport: "streamable-http",
    tools: ["search_projects", "get_ontology", "list_species", "ask_bbqs"],
    species: [],
    status: "approved",
    github_url: null,
    pip_package: null,
    submitted_at: "2025-01-01",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <PageMeta title="MCP Registry" description="Community directory of MCP servers for the BBQS neuroscience ecosystem." />
      {/* Header — formal, minimal */}
      <div className="mb-8 border-b-2 border-border pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Plug className="h-6 w-6 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">MCP Server Registry</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Community-maintained directory of MCP servers for the BBQS ecosystem. Connect them to Claude, Cursor, or any MCP-compatible AI agent to extend neuroscience workflows.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-muted-foreground">
          {servers.length + 1} server{servers.length !== 0 ? "s" : ""} registered
        </p>
        <div className="flex gap-3">
          <Link to="/mcp-tutorial">
            <Button variant="outline" size="sm" className="text-xs">
              <Package className="h-3.5 w-3.5 mr-1" /> Build Your Own
            </Button>
          </Link>
          <Button size="sm" className="text-xs" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Submit Server
          </Button>
        </div>
      </div>

      {/* Submit Form */}
      {showForm && (
        <div className="mb-8 border border-border rounded-lg p-6 bg-muted/20">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" /> Submit a New MCP Server
          </h3>
          {user ? (
            <SubmitForm onSubmitted={() => { fetchServers(); setShowForm(false); }} />
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">You need to sign in to submit an MCP server.</p>
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Server List */}
      <div className="space-y-4">
        <ServerCard server={officialServer} />
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : (
          servers.map(server => <ServerCard key={server.id} server={server} />)
        )}
      </div>

      {/* Empty state */}
      {!loading && servers.length === 0 && (
        <div className="text-center py-10 border border-dashed border-border rounded-lg mt-4">
          <Package className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No community servers yet. Be the first to submit one!</p>
          <Link to="/mcp-tutorial" className="text-xs text-muted-foreground hover:text-foreground hover:underline mt-2 inline-block">
            Learn how to build an MCP server →
          </Link>
        </div>
      )}

      {/* Cross-link */}
      <div className="mt-10">
        <Link
          to="/mcp-docs"
          className="block border border-border rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plug className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">BBQS MCP Server Documentation</h3>
                <p className="text-xs text-muted-foreground">Connect to the official BBQS MCP server</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
