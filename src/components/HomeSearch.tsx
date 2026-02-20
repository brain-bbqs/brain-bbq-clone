import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, Users, FolderOpen, FileText, ChevronRight, Globe, Loader2, Wrench, MessageCircle, ArrowRight, X } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { normalizePiName } from "@/lib/pi-utils";
import ReactMarkdown from "react-markdown";

interface SearchResult {
  title: string;
  subtitle: string;
  path: string;
  category: "people" | "project" | "publication" | "page" | "software";
}

const PAGES = [
  { title: "Projects", path: "/projects", keywords: ["projects", "grants", "research"], category: "page" as const },
  { title: "Publications", path: "/publications", keywords: ["publications", "papers", "journals"], category: "page" as const },
  { title: "People", path: "/investigators", keywords: ["people", "investigators", "pi"], category: "page" as const },
  { title: "Software & Tools", path: "/resources", keywords: ["resources", "tools", "software"], category: "page" as const },
  { title: "Datasets", path: "/datasets", keywords: ["datasets", "data"], category: "page" as const },
  { title: "Knowledge Graph", path: "/knowledge-graph", keywords: ["knowledge", "graph", "explorer"], category: "page" as const },
  { title: "NeuroMCP", path: "/neuromcp", keywords: ["neuromcp", "hannah", "chat", "ai"], category: "page" as const },
  { title: "Species", path: "/species", keywords: ["species", "animal", "model"], category: "page" as const },
  { title: "Working Groups", path: "/working-groups", keywords: ["working", "groups"], category: "page" as const },
];

const CATEGORY_ICONS = {
  people: Users,
  project: FolderOpen,
  publication: FileText,
  page: Globe,
  software: Wrench,
};

const CATEGORY_LABELS = {
  people: "Person",
  project: "Grant",
  publication: "Publication",
  page: "Page",
  software: "Software",
};

/** Fetch searchable data from nih-grants edge function + resources (cached) */
const fetchSearchIndex = async () => {
  const [grantsRes, resourcesRes, pubsRes] = await Promise.all([
    supabase.functions.invoke("nih-grants"),
    supabase.from("resources").select("name, description, external_url, resource_type, metadata").in("resource_type", ["software", "tool"]).order("name"),
    supabase.from("publications").select("title, pmid, authors, journal, year").order("citations", { ascending: false }).limit(500),
  ]);

  const grants = grantsRes.data?.data || [];
  const softwareRows = resourcesRes.data || [];
  const pubRows = pubsRes.data || [];

  const people = new Map<string, { name: string; institution: string }>();
  const projects: { title: string; grantNumber: string; pi: string }[] = [];
  const publications: { title: string; pmid: string }[] = [];
  const software: { name: string; description: string; url: string }[] = [];

  for (const grant of grants) {
    projects.push({ title: grant.title || "", grantNumber: grant.grantNumber || "", pi: grant.contactPi || "" });
    const allPis = grant.allPis?.split(/[,;]/).map((p: string) => p.trim()).filter(Boolean) || [];
    for (const pi of allPis) {
      const key = pi.toLowerCase();
      if (!people.has(key)) people.set(key, { name: pi, institution: grant.institution || "" });
    }
    for (const pub of grant.publications || []) {
      publications.push({ title: pub.title || "", pmid: pub.pmid || "" });
    }
  }

  // Merge grant publications with direct DB publications (dedupe by pmid)
  const seenPmids = new Set(publications.map(p => p.pmid));
  for (const row of pubRows) {
    const pmid = row.pmid || "";
    if (!seenPmids.has(pmid)) {
      publications.push({ title: row.title || "", pmid });
      seenPmids.add(pmid);
    }
  }

  for (const row of softwareRows) {
    const meta = (row.metadata as Record<string, any>) || {};
    software.push({ name: row.name, description: meta.algorithm || row.description || "", url: row.external_url || "" });
  }

  return { people: Array.from(people.values()), projects, publications, software };
};

/** Log a query anonymously */
const logQuery = async (query: string, mode: "search" | "chat", resultsCount: number) => {
  try {
    await supabase.from("search_queries").insert({ query, mode, results_count: resultsCount });
  } catch { /* silent */ }
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discovery-chat`;

export function HomeSearch() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"search" | "chat">("search");
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: searchIndex, isLoading } = useQuery({
    queryKey: ["home-search-index"],
    queryFn: fetchSearchIndex,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const results = useMemo<SearchResult[]>(() => {
    if (mode === "chat" || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    const matches: SearchResult[] = [];

    for (const page of PAGES) {
      if (page.title.toLowerCase().includes(q) || page.keywords.some(k => k.includes(q))) {
        matches.push({ title: page.title, subtitle: "Navigate to page", path: page.path, category: "page" });
      }
    }

    if (!searchIndex) return matches.slice(0, 10);

    for (const person of searchIndex.people) {
      if (person.name.toLowerCase().includes(q)) {
        matches.push({ title: normalizePiName(person.name), subtitle: person.institution || "Investigator", path: "/investigators", category: "people" });
      }
      if (matches.length > 15) break;
    }

    for (const project of searchIndex.projects) {
      if (project.title.toLowerCase().includes(q) || project.grantNumber.toLowerCase().includes(q) || project.pi.toLowerCase().includes(q)) {
        matches.push({ title: project.title.length > 80 ? project.title.slice(0, 80) + "…" : project.title, subtitle: `${project.grantNumber} · ${normalizePiName(project.pi)}`, path: "/projects", category: "project" });
      }
      if (matches.length > 15) break;
    }

    for (const pub of searchIndex.publications) {
      if (pub.title.toLowerCase().includes(q)) {
        matches.push({ title: pub.title.length > 80 ? pub.title.slice(0, 80) + "…" : pub.title, subtitle: pub.pmid ? `PMID: ${pub.pmid}` : "Publication", path: "/publications", category: "publication" });
      }
      if (matches.length > 15) break;
    }

    for (const tool of searchIndex.software || []) {
      if (tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q)) {
        matches.push({ title: tool.name, subtitle: tool.description.length > 80 ? tool.description.slice(0, 80) + "…" : tool.description, path: "/resources", category: "software" });
      }
      if (matches.length > 15) break;
    }

    return matches.slice(0, 10);
  }, [query, searchIndex, mode]);

  // Log search queries (debounced)
  useEffect(() => {
    if (mode !== "search" || !query.trim() || query.trim().length < 3) return;
    const t = setTimeout(() => logQuery(query.trim(), "search", results.length), 2000);
    return () => clearTimeout(t);
  }, [query, results.length, mode]);

  const showDropdown = focused && query.trim().length > 0 && mode === "search";

  useEffect(() => { setSelectedIndex(0); }, [results]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.path);
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
  }, [navigate]);

  const handleChatSubmit = useCallback(async () => {
    if (!query.trim() || chatLoading) return;
    setChatLoading(true);
    setChatResponse("");

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        setChatResponse(`⚠️ ${err.error || "Something went wrong. Please try again."}`);
        setChatLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setChatResponse(fullText);
            }
          } catch { /* partial JSON, wait */ }
        }
      }
    } catch (e) {
      console.error("Discovery chat error:", e);
      setChatResponse("⚠️ Connection error. Please try again.");
    } finally {
      setChatLoading(false);
    }
  }, [query, chatLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode === "chat") {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[selectedIndex]) handleSelect(results[selectedIndex]);
    else if (e.key === "Escape") { setFocused(false); inputRef.current?.blur(); }
  };

  const toggleMode = () => {
    const newMode = mode === "search" ? "chat" : "search";
    setMode(newMode);
    setChatResponse("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      {/* Mode toggle pills */}
      <div className="flex justify-center gap-1 mb-3">
        <button
          onClick={() => { setMode("search"); setChatResponse(""); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all",
            mode === "search"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          )}
        >
          <Search className="h-3 w-3" /> Search
        </button>
        <button
          onClick={toggleMode}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all",
            mode === "chat"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          )}
        >
          <MessageCircle className="h-3 w-3" /> Ask AI
        </button>
      </div>

      {/* Search/Chat input */}
      <div className={cn(
        "flex items-center gap-3 px-5 py-3.5 bg-background/90 backdrop-blur-sm border-2 rounded-2xl shadow-lg transition-all",
        focused ? "border-primary/50 shadow-primary/10 shadow-xl" : "border-border/60"
      )}>
        {mode === "chat" ? (
          <MessageCircle className="h-5 w-5 text-primary shrink-0" />
        ) : (
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={mode === "chat" ? "Ask about people, tools, projects..." : "Search people, projects, publications..."}
          className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
        />
        {chatLoading && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
        {isLoading && focused && mode === "search" && (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
        )}
        {mode === "chat" && query.trim() && !chatLoading && (
          <button onClick={handleChatSubmit} className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        {mode === "search" && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-mono bg-muted border border-border rounded-md text-muted-foreground">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Search dropdown results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[9999]">
          {results.length === 0 ? (
            <div className="px-5 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading search index..." : `No results for "${query}"`}
              </p>
              <button
                onClick={toggleMode}
                className="mt-2 text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
              >
                <MessageCircle className="h-3 w-3" /> Try asking the AI assistant
              </button>
            </div>
          ) : (
            <div className="py-1.5 max-h-[400px] overflow-y-auto divide-y divide-border/30">
              {results.map((result, i) => {
                const Icon = CATEGORY_ICONS[result.category];
                const categoryColors: Record<string, string> = {
                  people: "bg-blue-500/15 text-blue-500",
                  project: "bg-amber-500/15 text-amber-500",
                  publication: "bg-emerald-500/15 text-emerald-500",
                  page: "bg-violet-500/15 text-violet-500",
                  software: "bg-orange-500/15 text-orange-500",
                };
                const labelColors: Record<string, string> = {
                  people: "text-blue-500",
                  project: "text-amber-500",
                  publication: "text-emerald-500",
                  page: "text-violet-500",
                  software: "text-orange-500",
                };
                return (
                  <button
                    key={`${result.category}-${result.title}-${i}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      i === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-md shrink-0", categoryColors[result.category] || "bg-primary/10 text-primary")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                    <span className={cn("text-[10px] uppercase tracking-wider font-semibold shrink-0", labelColors[result.category] || "text-muted-foreground")}>
                      {CATEGORY_LABELS[result.category]}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Right-side chat slide-out panel */}
      {mode === "chat" && (chatResponse || chatLoading) && (
        <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">AI Discovery</span>
            </div>
            <button
              onClick={() => setChatResponse("")}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Query echo */}
          <div className="px-5 py-3 border-b border-border/50 bg-muted/30 shrink-0">
            <p className="text-xs text-muted-foreground">You asked:</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{query}</p>
          </div>

          {/* Response body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {chatLoading && !chatResponse && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching the BBQS database…
              </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground leading-relaxed">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => {
                    // Internal links (paths like /projects) use router navigation
                    if (href && href.startsWith("/")) {
                      return (
                        <Link
                          to={href}
                          className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium"
                        >
                          {children}
                        </Link>
                      );
                    }
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:text-primary/80"
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {chatResponse}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
