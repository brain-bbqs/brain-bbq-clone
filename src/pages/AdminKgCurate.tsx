import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserTier } from "@/hooks/useUserTier";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageMeta } from "@/components/PageMeta";
import { toast } from "sonner";
import { Lock } from "lucide-react";

type KW = {
  id: string; term: string; kind: string; frequency: number;
  status: string; canonical_term: string | null;
};

export default function AdminKgCurate() {
  const { isCurator, isLoading } = useUserTier();
  const [filter, setFilter] = useState("");
  const [merge, setMerge] = useState<Record<string, string>>({});

  const { data: keywords = [], refetch } = useQuery({
    queryKey: ["kg-curate-keywords"],
    enabled: isCurator,
    queryFn: async () => {
      const { data } = await supabase
        .from("harvester_keywords")
        .select("*")
        .order("frequency", { ascending: false })
        .limit(500);
      return (data ?? []) as KW[];
    },
  });

  const { data: synonyms = [], refetch: refetchSyn } = useQuery({
    queryKey: ["kg-curate-synonyms"],
    enabled: isCurator,
    queryFn: async () => (await supabase.from("harvester_synonyms").select("*").order("kind").limit(500)).data ?? [],
  });

  const setStatus = async (k: KW, status: string) => {
    const { error } = await supabase.from("harvester_keywords")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", k.id);
    if (error) toast.error(error.message); else { toast.success(`${k.term} → ${status}`); refetch(); }
  };

  const mergeInto = async (k: KW) => {
    const canonical = merge[k.id]?.trim().toLowerCase();
    if (!canonical) { toast.error("Enter canonical term"); return; }
    const { error: e1 } = await supabase.from("harvester_synonyms")
      .insert({ alias: k.term, canonical, kind: k.kind });
    if (e1) { toast.error(e1.message); return; }
    await supabase.from("harvester_keywords")
      .update({ status: "merged", canonical_term: canonical, reviewed_at: new Date().toISOString() })
      .eq("id", k.id);
    toast.success(`${k.term} merged → ${canonical}`);
    refetch(); refetchSyn();
  };

  if (isLoading) return <div className="container mx-auto px-4 py-8">Loading…</div>;
  if (!isCurator) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-8 text-center space-y-3">
          <Lock className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold">Admin only</h1>
        </Card>
      </div>
    );
  }

  const filteredKws = keywords.filter((k) => !filter.trim() || k.term.includes(filter.toLowerCase()));
  const pending = filteredKws.filter((k) => k.status === "auto");
  const approved = filteredKws.filter((k) => k.status === "approved");
  const merged = filteredKws.filter((k) => k.status === "merged");

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <PageMeta title="KG Curate — Admin" description="Review novel terms and synonyms surfaced by the harvester" />
      <div>
        <h1 className="text-3xl font-bold">KG Curate</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review novel terms the extractor surfaces. Approve them to keep, merge into a canonical term, or reject.
        </p>
      </div>

      <Input placeholder="Filter terms…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm" />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending <Badge variant="secondary" className="ml-1">{pending.length}</Badge></TabsTrigger>
          <TabsTrigger value="approved">Approved <Badge variant="secondary" className="ml-1">{approved.length}</Badge></TabsTrigger>
          <TabsTrigger value="merged">Merged <Badge variant="secondary" className="ml-1">{merged.length}</Badge></TabsTrigger>
          <TabsTrigger value="synonyms">Synonyms <Badge variant="secondary" className="ml-1">{synonyms.length}</Badge></TabsTrigger>
        </TabsList>

        {[
          { v: "pending", rows: pending },
          { v: "approved", rows: approved },
          { v: "merged", rows: merged },
        ].map(({ v, rows }) => (
          <TabsContent key={v} value={v}>
            <Card className="divide-y">
              {rows.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No terms.</div>}
              {rows.map((k) => (
                <div key={k.id} className="p-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">{k.kind}</Badge>
                  <span className="font-semibold">{k.term}</span>
                  <span className="text-xs text-muted-foreground">×{k.frequency}</span>
                  {k.canonical_term && <Badge variant="secondary">→ {k.canonical_term}</Badge>}
                  <div className="ml-auto flex gap-2 items-center">
                    {v === "pending" && (
                      <>
                        <Input
                          placeholder="merge into…"
                          className="h-8 w-40"
                          value={merge[k.id] ?? ""}
                          onChange={(e) => setMerge({ ...merge, [k.id]: e.target.value })}
                        />
                        <Button size="sm" variant="outline" onClick={() => mergeInto(k)}>Merge</Button>
                        <Button size="sm" onClick={() => setStatus(k, "approved")}>Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatus(k, "rejected")}>Reject</Button>
                      </>
                    )}
                    {v !== "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(k, "auto")}>Re-open</Button>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="synonyms">
          <Card className="divide-y">
            {synonyms.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No synonyms yet.</div>}
            {(synonyms as any[]).map((s) => (
              <div key={s.id} className="p-3 flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono">{s.kind}</Badge>
                <span className="font-mono">{s.alias}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold">{s.canonical}</span>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}