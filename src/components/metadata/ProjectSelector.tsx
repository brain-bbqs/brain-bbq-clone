import { useState, useMemo } from "react";
import { Search, ChevronDown, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Grant {
  id: string;
  grant_number: string;
  title: string;
  [key: string]: any;
}

interface ProjectSelectorProps {
  grants: Grant[];
  selectedGrantId: string | null;
  onSelect: (grant: any) => void;
  isLoading: boolean;
}

export function ProjectSelector({ grants, selectedGrantId, onSelect, isLoading }: ProjectSelectorProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selected = grants.find(g => g.id === selectedGrantId);

  const filtered = useMemo(() => {
    if (!search.trim()) return grants;
    const q = search.toLowerCase();
    return grants.filter(g =>
      g.title.toLowerCase().includes(q) || g.grant_number.toLowerCase().includes(q)
    );
  }, [grants, search]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl text-left transition-all hover:border-primary/40",
          open && "border-primary/50 shadow-sm"
        )}
      >
        <FolderOpen className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <p className="text-sm font-medium text-foreground truncate">{selected.title}</p>
              <p className="text-xs text-muted-foreground">{selected.grant_number}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading grants..." : "Select a project to view metadata"}
            </p>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search grants..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[320px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground text-center">No grants found</p>
            ) : (
              filtered.map(grant => (
                <button
                  key={grant.id}
                  onClick={() => { onSelect(grant); setOpen(false); setSearch(""); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                    grant.id === selectedGrantId && "bg-primary/5"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{grant.title}</p>
                    <p className="text-xs text-muted-foreground">{grant.grant_number}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
