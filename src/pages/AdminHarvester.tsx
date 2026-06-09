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
import { Loader2, Play, Pause, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminHarvester() {
  const { isAdmin, isCurator, isLoading } = useUserTier();
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchPattern, setBatchPattern] = useState("(R61|R34)");

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

  const { data: queue, refetch: refetchQueue } = useQuery({
    queryKey: ["harvester-queue"],
    queryFn: async () =>
      (await supabase.from("harvester_queue").select("*").order("priority", { ascending: true }).order("last_run_at", { ascending: true, nullsFirst: true }).limit(200)).data ?? [],
    refetchInterval: 10_000,
  });

  const { data: activeRuns } = useQuery({
    queryKey: ["harvester-active-runs"],
    queryFn: async () =>
      (await supabase.from("harvester_runs").select("*").in("phase", ["queued", "scraping", "extracting", "hopping"]).order("started_at", { ascending: false })).data ?? [],
    refetchInterval: 5_000,
  });

  const [newSeed, setNewSeed] = useState("");

  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  if (isLoading) return <div className="container mx-auto px-4 py-8">Loading…</div>;
  if (!isCurator) return <div className="container mx-auto px-4 py-8">Admins only.</div>;

  const runBatch = async () => {
    setBatchRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("harvest-grants-batch", {
        body: { pattern: batchPattern, mode: "multihop" },
      });
      if (error) throw error;
      toast.success(`Queued ${data?.queued ?? 0} grants for multi-hop harvest. Running in background — check back in a few minutes.`);
    } catch (e: any) {
      toast.error(e.message ?? "Batch failed to start");
    } finally {
      setBatchRunning(false);
    }
  };

  const togglePause = async () => {
    const next = !settings?.batch_paused;
    const { error } = await supabase.from("harvester_settings").update({ batch_paused: next }).eq("id", 1);
    if (error) toast.error(error.message); else { toast.success(next ? "Background harvester paused" : "Background harvester resumed"); refetchSettings(); }
  };

  const addToQueue = async () => {
    const s = newSeed.trim();
    if (!s) return;
    const { error } = await supabase.from("harvester_queue").insert({ seed_grant: s });
    if (error) toast.error(error.message); else { setNewSeed(""); toast.success(`Queued ${s}`); refetchQueue(); }
  };

  const bumpSeed = async (id: string) => {
    await supabase.from("harvester_queue").update({ priority: 1, last_run_at: null }).eq("id", id);
    toast.success("Bumped to top of queue");
    refetchQueue();
  };

  const toggleSeed = async (id: string, enabled: boolean) => {
    await supabase.from("harvester_queue").update({ enabled }).eq("id", id);
    refetchQueue();
  };

  const removeSeed = async (id: string) => {
    await supabase.from("harvester_queue").delete().eq("id", id);
    refetchQueue();
  };

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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold">Harvester Admin</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/admin/kg-live">KG Live</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/admin/kg-heatmap">KG Heatmap</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/admin/kg-curate">KG Curate</Link></Button>
        </div>
      </div>

      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Always-on background harvester</h2>
            <p className="text-sm text-muted-foreground">
              Runs on a schedule (every 5 min). One seed per tick. Each seed re-runs after its cool-down so the graph refreshes continuously.
            </p>
          </div>
          <Button onClick={togglePause} variant={settings?.batch_paused ? "default" : "outline"}>
            {settings?.batch_paused ? <><Play className="w-4 h-4 mr-2" />Resume</> : <><Pause className="w-4 h-4 mr-2" />Pause</>}
          </Button>
        </div>

        <div className="flex gap-2 items-end max-w-md">
          <div className="flex-1">
            <Label>Add seed grant to queue</Label>
            <Input value={newSeed} onChange={(e) => setNewSeed(e.target.value)} placeholder="R61MH123456" className="font-mono" />
          </div>
          <Button onClick={addToQueue}><PlusCircle className="w-4 h-4 mr-2" />Add</Button>
        </div>

        {!!activeRuns?.length && (
          <div className="text-xs space-y-1">
            <div className="font-semibold">Active runs:</div>
            {activeRuns.map((r: any) => (
              <div key={r.id} className="flex gap-2 items-center">
                <Badge>{r.phase}</Badge>
                <span className="font-mono">{r.seed_grant}</span>
                <span className="text-muted-foreground">hop {r.current_hop} · pubs {r.pubs_found} · ev {r.evidence_rows}</span>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-1">Seed</th>
                <th>Priority</th>
                <th>Cool-down (h)</th>
                <th>Last run</th>
                <th>Enabled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(queue ?? []).map((q: any) => (
                <tr key={q.id} className="border-b hover:bg-muted/40">
                  <td className="py-1 font-mono">{q.seed_grant}</td>
                  <td>{q.priority}</td>
                  <td>{q.cool_down_hours}</td>
                  <td className="text-muted-foreground text-xs">{q.last_run_at ? new Date(q.last_run_at).toLocaleString() : "—"}</td>
                  <td><Switch checked={q.enabled} onCheckedChange={(v) => toggleSeed(q.id, v)} /></td>
                  <td className="text-right">
                    <Button size="sm" variant="outline" onClick={() => bumpSeed(q.id)}>Bump</Button>
                    <Button size="sm" variant="ghost" onClick={() => removeSeed(q.id)}>×</Button>
                  </td>
                </tr>
              ))}
              {!queue?.length && (
                <tr><td colSpan={6} className="text-center text-muted-foreground py-4 text-sm">No seeds queued yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="text-xl font-semibold">Batch run multi-hop harvest</h2>
        <p className="text-sm text-muted-foreground">
          Run the multi-hop reasoning harvester across every grant matching the regex below. Each seed takes ~60–90 s and writes to <code className="font-mono">grant_methods_evidence</code> + <code className="font-mono">grant_methods_traversal_paths</code>. Watch the Edge Function logs for progress.
        </p>
        <div className="flex gap-2 items-end max-w-md">
          <div className="flex-1">
            <Label>Grant-number regex</Label>
            <Input value={batchPattern} onChange={(e) => setBatchPattern(e.target.value)} className="font-mono" />
          </div>
          <Button onClick={runBatch} disabled={batchRunning}>
            {batchRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Start batch
          </Button>
        </div>
      </Card>

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