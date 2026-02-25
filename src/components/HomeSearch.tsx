import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, Users, FolderOpen, FileText, ChevronRight, Globe, Loader2, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { normalizePiName } from "@/lib/pi-utils";

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
const logQuery = async (query: string, resultsCount: number) => {
  try {
    await supabase.from("search_queries").insert({ query, mode: "search", results_count: resultsCount });
  } catch { /* silent */ }
};

export function HomeSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
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
    if (!query.trim()) return [];
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
  }, [query, searchIndex]);

  // Log search queries (debounced)
  useEffect(() => {
    if (!query.trim() || query.trim().length < 3) return;
    const t = setTimeout(() => logQuery(query.trim(), results.length), 2000);
    return () => clearTimeout(t);
  }, [query, results.length]);

  const showDropdown = focused && query.trim().length > 0;

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
    // For non-page results, pass the search query to highlight the row
    if (result.category !== "page") {
      // Use the result title as the filter text for the destination grid
      const filterText = result.category === "people"
        ? result.title // person name
        : result.category === "software"
          ? result.title // tool name
          : result.title.replace(/…$/, ""); // truncated titles
      navigate(`${result.path}?q=${encodeURIComponent(filterText)}`);
    } else {
      navigate(result.path);
    }
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[selectedIndex]) handleSelect(results[selectedIndex]);
    else if (e.key === "Escape") { setFocused(false); inputRef.current?.blur(); }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      {/* Search input */}
      <div className={cn(
        "flex items-center gap-3 px-5 py-3.5 bg-background/90 backdrop-blur-sm border-2 rounded-2xl shadow-lg transition-all",
        focused ? "border-primary/50 shadow-primary/10 shadow-xl" : "border-border/60"
      )}>
        <Search className="h-5 w-5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search people, projects, publications..."
          className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
        />
        {isLoading && focused && (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
        )}
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-mono bg-muted border border-border rounded-md text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Search dropdown results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[9999]" style={{ position: 'absolute' }}>
          {results.length === 0 ? (
            <div className="px-5 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading search index..." : `No results for "${query}"`}
              </p>
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
    </div>
  );
}
