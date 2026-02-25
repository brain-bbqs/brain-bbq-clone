import { useState, useMemo } from "react";
import { Search, ChevronRight, Filter, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GraphNode } from "@/hooks/useKnowledgeGraphData";

const TYPE_LABELS: Record<string, string> = {
  project: "Project",
  species: "Species",
  investigator: "Investigator",
  meta_tag: "Meta Tag",
  publication: "Publication",
  resource: "Resource",
};

const TYPE_COLORS: Record<string, string> = {
  project: "hsl(210, 85%, 60%)",
  species: "hsl(140, 70%, 55%)",
  investigator: "hsl(35, 90%, 60%)",
  meta_tag: "hsl(280, 65%, 65%)",
  publication: "hsl(350, 75%, 60%)",
  resource: "hsl(180, 65%, 55%)",
};

interface GraphSearchPanelProps {
  nodes: GraphNode[];
  focusNodeId: string | null;
  onFocusNode: (nodeId: string) => void;
  breadcrumbs: GraphNode[];
  onBreadcrumbClick: (index: number) => void;
  hiddenTypes: Set<string>;
  onToggleType: (type: string) => void;
  depth: 1 | 2;
  onDepthChange: (d: 1 | 2) => void;
}

export function GraphSearchPanel({
  nodes,
  focusNodeId,
  onFocusNode,
  breadcrumbs,
  onBreadcrumbClick,
  hiddenTypes,
  onToggleType,
  depth,
  onDepthChange,
}: GraphSearchPanelProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return nodes
      .filter(n => n.label.toLowerCase().includes(q))
      .slice(0, 20);
  }, [query, nodes]);

  const typeGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const n of nodes) {
      groups[n.type] = (groups[n.type] || 0) + 1;
    }
    return groups;
  }, [nodes]);

  return (
    <div className="h-full flex flex-col bg-[hsl(220,35%,10%)] border-r border-[hsl(210,30%,18%)]">
      {/* Search */}
      <div className="p-3 border-b border-[hsl(210,30%,18%)]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(210,20%,45%)]" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search nodes..."
            className="pl-8 h-8 text-xs bg-[hsl(220,30%,14%)] border-[hsl(210,30%,22%)] text-[hsl(210,20%,85%)] placeholder:text-[hsl(210,20%,40%)] focus-visible:ring-[hsl(210,85%,60%)]/30"
          />
        </div>
      </div>

      {/* Search results */}
      {query.trim() && (
        <ScrollArea className="max-h-48 border-b border-[hsl(210,30%,18%)]">
          <div className="p-2 space-y-0.5">
            {results.length === 0 && (
              <p className="text-[10px] text-[hsl(210,20%,45%)] px-2 py-3 text-center">No results</p>
            )}
            {results.map(node => (
              <button
                key={node.id}
                onClick={() => { onFocusNode(node.id); setQuery(""); }}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2 hover:bg-[hsl(220,30%,18%)] transition-colors group"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[node.type], boxShadow: `0 0 4px ${TYPE_COLORS[node.type]}` }}
                />
                <span className="text-[hsl(210,20%,80%)] group-hover:text-white truncate flex-1">
                  {node.label}
                </span>
                <span className="text-[9px] text-[hsl(210,20%,40%)] shrink-0">
                  {TYPE_LABELS[node.type]}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="p-3 border-b border-[hsl(210,30%,18%)]">
          <p className="text-[9px] uppercase tracking-wider text-[hsl(210,20%,40%)] mb-1.5 font-semibold">Navigation</p>
          <div className="flex flex-wrap items-center gap-1">
            {breadcrumbs.map((node, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-[hsl(210,20%,30%)]" />}
                <button
                  onClick={() => onBreadcrumbClick(i)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    node.id === focusNodeId
                      ? "bg-[hsl(210,85%,60%)]/20 text-[hsl(210,85%,70%)]"
                      : "text-[hsl(210,20%,60%)] hover:text-[hsl(210,20%,85%)]"
                  }`}
                >
                  {node.label.length > 18 ? node.label.slice(0, 16) + "…" : node.label}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Depth control */}
      <div className="p-3 border-b border-[hsl(210,30%,18%)]">
        <p className="text-[9px] uppercase tracking-wider text-[hsl(210,20%,40%)] mb-2 font-semibold">Neighborhood Depth</p>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDepthChange(1)}
            className={`h-6 text-[10px] px-3 ${depth === 1 ? "bg-[hsl(210,85%,60%)]/20 text-[hsl(210,85%,70%)]" : "text-[hsl(210,20%,50%)]"}`}
          >
            1 Hop
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDepthChange(2)}
            className={`h-6 text-[10px] px-3 ${depth === 2 ? "bg-[hsl(210,85%,60%)]/20 text-[hsl(210,85%,70%)]" : "text-[hsl(210,20%,50%)]"}`}
          >
            2 Hops
          </Button>
        </div>
      </div>

      {/* Type filters */}
      <div className="p-3 flex-1">
        <p className="text-[9px] uppercase tracking-wider text-[hsl(210,20%,40%)] mb-2 font-semibold flex items-center gap-1">
          <Filter className="h-2.5 w-2.5" /> Node Types
        </p>
        <div className="space-y-1">
          {Object.entries(typeGroups).map(([type, count]) => {
            const hidden = hiddenTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => onToggleType(type)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                  hidden ? "opacity-40" : "hover:bg-[hsl(220,30%,16%)]"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: hidden ? "hsl(210,20%,30%)" : TYPE_COLORS[type],
                    boxShadow: hidden ? "none" : `0 0 4px ${TYPE_COLORS[type]}`,
                  }}
                />
                <span className={`flex-1 text-left ${hidden ? "text-[hsl(210,20%,35%)]" : "text-[hsl(210,20%,75%)]"}`}>
                  {TYPE_LABELS[type] || type}
                </span>
                <span className="text-[9px] text-[hsl(210,20%,40%)]">{count}</span>
                {hidden ? <EyeOff className="h-3 w-3 text-[hsl(210,20%,30%)]" /> : <Eye className="h-3 w-3 text-[hsl(210,20%,40%)]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-3 border-t border-[hsl(210,30%,18%)]">
        <p className="text-[9px] text-[hsl(210,20%,35%)] leading-relaxed">
          Click a node to focus. Search or click breadcrumbs to navigate. Toggle types to filter.
        </p>
      </div>
    </div>
  );
}
