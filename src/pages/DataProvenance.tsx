import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Search, Loader2, User, Bot } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";

export default function DataProvenance() {
  const [search, setSearch] = useState("");

  const { data: history, isLoading } = useQuery({
    queryKey: ["edit-history-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("edit_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
  });

  // Fetch grant titles for display
  const { data: grants } = useQuery({
    queryKey: ["grants-titles-provenance"],
    queryFn: async () => {
      const { data } = await supabase
        .from("grants")
        .select("grant_number, title");
      return data || [];
    },
  });

  const grantMap = useMemo(() => {
    return new Map((grants || []).map(g => [g.grant_number, g.title]));
  }, [grants]);

  const filtered = useMemo(() => {
    if (!history) return [];
    if (!search.trim()) return history;
    const q = search.toLowerCase();
    return history.filter(h =>
      h.grant_number.toLowerCase().includes(q) ||
      h.field_name.toLowerCase().includes(q) ||
      h.edited_by.toLowerCase().includes(q) ||
      (grantMap.get(h.grant_number) || "").toLowerCase().includes(q)
    );
  }, [history, search, grantMap]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <History className="h-5 w-5 text-accent" />
          <h1 className="text-lg font-semibold text-foreground">Data Provenance</h1>
          <Badge variant="secondary" className="text-xs">
            {filtered.length} edits
          </Badge>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by project, field, or editor..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Timestamp</TableHead>
                <TableHead className="w-48">Project</TableHead>
                <TableHead className="w-36">Field</TableHead>
                <TableHead className="w-28">Editor</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No edit history found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {format(new Date(row.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <span className="font-medium text-foreground truncate block max-w-[180px]">
                          {grantMap.get(row.grant_number) || row.grant_number}
                        </span>
                        <span className="text-muted-foreground text-[10px]">{row.grant_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {row.field_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        {row.edited_by === "ai-assistant" ? (
                          <Bot className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-muted-foreground">{row.edited_by}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ValueDisplay value={row.old_value} variant="old" />
                    </TableCell>
                    <TableCell>
                      <ValueDisplay value={row.new_value} variant="new" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function ValueDisplay({ value, variant }: { value: any; variant: "old" | "new" }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/40 text-xs italic">—</span>;
  }

  const items = Array.isArray(value) ? value : [value];
  
  return (
    <div className="flex flex-wrap gap-1 max-w-[200px]">
      {items.map((v, i) => (
        <Badge
          key={i}
          variant={variant === "new" ? "default" : "secondary"}
          className={`text-[10px] ${variant === "old" ? "line-through opacity-60" : ""}`}
        >
          {typeof v === "object" ? JSON.stringify(v) : String(v)}
        </Badge>
      ))}
    </div>
  );
}
