import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SearchablePage {
  title: string;
  path: string;
  keywords: string[];
  section: string;
}

const PAGES: SearchablePage[] = [
  { title: "Home", path: "/", keywords: ["home", "dashboard", "overview", "bbqs", "brain", "behavior"], section: "General" },
  { title: "About", path: "/about", keywords: ["about", "mission", "consortium", "overview"], section: "General" },
  { title: "Projects", path: "/projects", keywords: ["projects", "grants", "research", "labs", "marr"], section: "Knowledge Base" },
  { title: "Publications", path: "/publications", keywords: ["publications", "papers", "journals", "articles", "doi", "pubmed"], section: "Knowledge Base" },
  { title: "Resources & Tools", path: "/resources", keywords: ["resources", "tools", "software", "deeplabcut", "sleap", "suite2p"], section: "Knowledge Base" },
  { title: "Knowledge Graph", path: "/knowledge-graph", keywords: ["knowledge", "graph", "ontology", "entities", "ner", "extraction"], section: "Knowledge Base" },
  { title: "NeuroMCP (Hannah)", path: "/neuromcp", keywords: ["neuromcp", "hannah", "chat", "ai", "assistant", "ask"], section: "AI" },
  { title: "Cross-Species Synchronization", path: "/consortia-history", keywords: ["cross", "species", "synchronization", "history", "consortia"], section: "AI" },
  { title: "Principal Investigators", path: "/investigators", keywords: ["investigators", "pi", "principal", "researchers", "faculty"], section: "Directory" },
  { title: "Working Groups", path: "/working-groups", keywords: ["working", "groups", "committees", "teams"], section: "Directory" },
  { title: "Announcements", path: "/announcements", keywords: ["announcements", "news", "updates"], section: "Community" },
  { title: "SFN 2025", path: "/sfn-2025", keywords: ["sfn", "2025", "conference", "neuroscience", "poster"], section: "Conferences" },
  { title: "Data Sharing Policy", path: "/data-sharing-policy", keywords: ["data", "sharing", "policy", "legal", "compliance"], section: "Documentation" },
  { title: "API Reference", path: "/api-docs", keywords: ["api", "rest", "endpoints", "curl", "fetch", "documentation"], section: "Documentation" },
  { title: "MCP Server Docs", path: "/mcp-docs", keywords: ["mcp", "server", "claude", "cursor", "model", "context", "protocol"], section: "Documentation" },
  { title: "Build MCP Server", path: "/mcp-tutorial", keywords: ["build", "mcp", "tutorial", "python", "fastmcp", "deploy"], section: "Documentation" },
  { title: "MCP Registry", path: "/mcp-registry", keywords: ["registry", "community", "mcp", "servers", "submit"], section: "Documentation" },
  { title: "Roadmap", path: "/roadmap", keywords: ["roadmap", "timeline", "milestones", "planning", "github"], section: "Development" },
  { title: "Software Architecture", path: "/design-docs", keywords: ["software", "architecture", "design", "system", "technical"], section: "Development" },
  { title: "Agentic Framework", path: "/agentic-framework", keywords: ["agentic", "framework", "workflow", "agents", "ai"], section: "Development" },
  { title: "ML Models", path: "/ml-models", keywords: ["ml", "models", "machine", "learning", "deep", "neural"], section: "Knowledge Base" },
  { title: "Assertions", path: "/assertions", keywords: ["assertions", "claims", "statements"], section: "Knowledge Base" },
  { title: "Evidence", path: "/evidence", keywords: ["evidence", "data", "support", "proof"], section: "Knowledge Base" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return PAGES.filter(page =>
      page.title.toLowerCase().includes(q) ||
      page.keywords.some(k => k.includes(q)) ||
      page.section.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex].path);
    }
  };

  return (
    <>
      {/* Search trigger */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg hover:bg-muted transition-colors w-full max-w-xs"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search pages...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-background border border-border rounded">
          ⌘K
        </kbd>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => { setOpen(false); setQuery(""); }}>
          <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, topics, tools..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Results */}
            <div ref={resultsRef} className="max-h-[320px] overflow-y-auto">
              {query.trim() && results.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No pages found for "{query}"</p>
                </div>
              )}
              {results.length > 0 && (
                <div className="py-2">
                  {results.map((page, i) => (
                    <button
                      key={page.path}
                      onClick={() => handleSelect(page.path)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                        i === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{page.title}</p>
                        <p className="text-[11px] text-muted-foreground">{page.section}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {!query.trim() && (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">Type to search across all pages</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
