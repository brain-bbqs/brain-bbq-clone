import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserTier } from "@/hooks/useUserTier";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { PageMeta } from "@/components/PageMeta";

export default function AdminHarvester() {
  const { isAdmin, isCurator, isLoading } = useUserTier();

  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ["harvester-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("harvester_settings").select("*").eq("id", 1).single();
      return data;
    },
  });

  const { data: relations, refetch: refetchRelations } = useQuery({
    queryKey: ["harvester-relations"],
    queryFn: async () => (await supabase.from("harvester_relations").select("*").order("name")).data ?? [],
  });

  const { data: proposed, refetch: refetchProposed } = useQuery({
    queryKey: ["proposed-relations"],
    queryFn: async () => (await supabase.from("proposed_relations").select("*").eq("status", "pending").order("created_at", { ascending: false })).data ?? [],
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  if (isLoading) return <div className="container mx-auto px-4 py-8">Loading…</div>;
  if (!isCurator) return <div className="container mx-auto px-4 py-8">Admins only.</div>;

  const saveSettings = async () => {
    const { error } = await supabase.from("harvester_settings").update({
      beam_width: Number(form.beam_width),
      targets_per_relation: Number(form.targets_per_relation),
      max_hops: Number(form.max_hops),
      chain_score_threshold: Number(form.chain_score_threshold),
      max_replans: Number(form.max_replans),
      max_publications_per_seed: Number(form.max_publications_per_seed),
    }).eq("id", 1);
    if (error) toast.error(error.message); else { toast.success("Saved"); refetchSettings(); }
  };

  const toggleRelation = async (id: string, enabled: boolean) => {
    await supabase.from("harvester_relations").update({ enabled }).eq("id", id);
    refetchRelations();
  };

  const reviewProposed = async (id: string, approve: boolean, p: any) => {
    if (approve) {
      await supabase.from("harvester_relations").insert({
        name: p.relation_name,
        src_node_type: p.src_node_type ?? "unknown",
        dst_node_type: p.dst_node_type ?? "unknown",
        fetcher_key: p.relation_name,
        description: p.planner_rationale,
      });
    }
    await supabase.from("proposed_relations").update({
      status: approve ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    refetchProposed(); refetchRelations();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <PageMeta title="Harvester Admin" description="Configure the multi-hop methods harvester" />
      <h1 className="text-3xl font-bold">Harvester Admin</h1>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Settings</h2>
        {form && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              ["beam_width", "Beam width (B)"],
              ["targets_per_relation", "Targets per relation (M)"],
              ["max_hops", "Max hops"],
              ["chain_score_threshold", "Chain score threshold"],
              ["max_replans", "Max replans"],
              ["max_publications_per_seed", "Max pubs per seed"],
            ].map(([k, label]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input type="number" step="0.01" value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
          </div>
        )}
        <Button onClick={saveSettings}>Save settings</Button>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="text-xl font-semibold">Relation vocabulary</h2>
        <div className="space-y-2">
          {(relations ?? []).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between border rounded p-2">
              <div>
                <div className="font-mono text-sm">{r.name} <span className="text-muted-foreground">({r.src_node_type} → {r.dst_node_type})</span></div>
                <div className="text-xs text-muted-foreground">{r.description}</div>
              </div>
              <Switch checked={r.enabled} onCheckedChange={(v) => toggleRelation(r.id, v)} disabled={!isAdmin} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="text-xl font-semibold">Proposed relations <Badge variant="secondary">{proposed?.length ?? 0}</Badge></h2>
        {(proposed ?? []).length === 0 && <p className="text-sm text-muted-foreground">No pending proposals.</p>}
        {(proposed ?? []).map((p: any) => (
          <div key={p.id} className="border rounded p-3 space-y-2">
            <div className="font-mono">{p.relation_name}</div>
            <div className="text-xs text-muted-foreground">Seed: {p.seed_grant_number}</div>
            <div className="text-sm">{p.planner_rationale}</div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => reviewProposed(p.id, true, p)}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => reviewProposed(p.id, false, p)}>Reject</Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}