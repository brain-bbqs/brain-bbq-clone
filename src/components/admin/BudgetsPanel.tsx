import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { LovableCreditsPanel } from "./LovableCreditsPanel";
import { LovableInvoicesPanel } from "./LovableInvoicesPanel";

type Provider = "github" | "supabase" | "lovable";

interface BudgetConfig {
  id: string;
  provider: Provider;
  monthly_limit_usd: number;
  alert_threshold_pct: number;
  config: Record<string, any>;
  manual_usage_usd: number | null;
  manual_notes: string | null;
  last_synced_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
}

interface Snapshot {
  id: string;
  provider: Provider;
  metric_key: string;
  metric_label: string | null;
  value_numeric: number | null;
  unit: string | null;
  period_start: string | null;
  period_end: string | null;
  captured_at: string;
}

const PROVIDER_META: Record<Provider, { label: string; href: string; hint: string }> = {
  github:   { label: "GitHub",   href: "https://github.com/settings/billing", hint: "Actions minutes, packages, shared storage" },
  supabase: { label: "Supabase", href: "https://supabase.com/dashboard/project/vpexxhfpvghlejljwpvt/settings/billing", hint: "DB, egress, edge invocations" },
  lovable:  { label: "Lovable",  href: "https://lovable.dev/settings/plans-and-credits", hint: "Credits + Cloud + AI balance" },
};

export function BudgetsPanel() {
  const [configs, setConfigs] = useState<BudgetConfig[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [syncing, setSyncing] = useState<Provider | "all" | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from("budget_config").select("*").order("provider"),
      supabase.from("budget_snapshots").select("*").order("captured_at", { ascending: false }).limit(200),
    ]);
    setConfigs((c ?? []) as BudgetConfig[]);
    setSnapshots((s ?? []) as Snapshot[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Kick off an initial sync so values appear without manual click.
    sync();
    // Refresh every 5 min as a fallback to realtime push.
    const t = setInterval(() => sync(), 5 * 60 * 1000);
    const channel = supabase
      .channel("budget-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "budget_snapshots" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "budget_config" }, () => load())
      .subscribe();
    return () => { clearInterval(t); supabase.removeChannel(channel); };
  }, []);

  const sync = async (provider?: Provider) => {
    setSyncing(provider ?? "all");
    try {
      const { error } = await supabase.functions.invoke("budget-sync", {
        body: { providers: provider ? [provider] : ["github", "supabase", "lovable"] },
      });
      if (error) throw error;
      toast({ title: "Sync triggered", description: provider ?? "all providers" });
    } catch (e: any) {
      toast({ title: "Sync failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally { setSyncing(null); }
  };

  const saveConfig = async (provider: Provider, patch: Partial<BudgetConfig>) => {
    const { error } = await supabase.from("budget_config").update(patch).eq("provider", provider);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Saved" });
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading budgets…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Live spend across GitHub, Supabase, and Lovable. Set monthly caps to fire alerts.
        </p>
        <Button size="sm" onClick={() => sync()} disabled={syncing !== null}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing === "all" ? "animate-spin" : ""}`} />
          Sync all
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(["github", "supabase", "lovable"] as Provider[]).map((p) => {
          const cfg = configs.find((c) => c.provider === p);
          const recent = snapshots.filter((s) => s.provider === p);
          return (
            <ProviderCard
              key={p}
              provider={p}
              cfg={cfg}
              recent={recent}
              syncing={syncing === p}
              onSync={() => sync(p)}
              onSave={(patch) => saveConfig(p, patch)}
            />
          );
        })}
      </div>

      <div className="pt-2 border-t border-border">
        <LovableCreditsPanel />
      </div>

      <div className="pt-2 border-t border-border">
        <LovableInvoicesPanel />
      </div>
    </div>
  );
}

function ProviderCard({
  provider, cfg, recent, syncing, onSync, onSave,
}: {
  provider: Provider;
  cfg: BudgetConfig | undefined;
  recent: Snapshot[];
  syncing: boolean;
  onSync: () => void;
  onSave: (patch: Partial<BudgetConfig>) => void;
}) {
  const meta = PROVIDER_META[provider];
  const [limit, setLimit] = useState(cfg?.monthly_limit_usd?.toString() ?? "0");
  const [threshold, setThreshold] = useState(cfg?.alert_threshold_pct?.toString() ?? "80");
  const [ghOrg, setGhOrg] = useState(cfg?.config?.org ?? "");
  const [manual, setManual] = useState(cfg?.manual_usage_usd?.toString() ?? "");

  useEffect(() => {
    setLimit(cfg?.monthly_limit_usd?.toString() ?? "0");
    setThreshold(cfg?.alert_threshold_pct?.toString() ?? "80");
    setGhOrg(cfg?.config?.org ?? "");
    setManual(cfg?.manual_usage_usd?.toString() ?? "");
  }, [cfg?.id]);

  // Use only the latest snapshot per metric_key for the current month,
  // then sum USD (preferring enhanced_total if present to avoid double-counting).
  const { totalUsd, latestByKey } = useMemo(() => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const latest = new Map<string, Snapshot>();
    for (const s of recent) {
      if (s.captured_at < monthStart) continue;
      const prev = latest.get(s.metric_key);
      if (!prev || s.captured_at > prev.captured_at) latest.set(s.metric_key, s);
    }
    const usd = Array.from(latest.values()).filter(
      (s) => s.unit === "USD" && typeof s.value_numeric === "number",
    );
    const enhanced = usd.find((s) => s.metric_key === "enhanced_total");
    const total = enhanced
      ? Number(enhanced.value_numeric)
      : usd
          .filter((s) => !s.metric_key.startsWith("enhanced_"))
          .reduce((sum, s) => sum + (s.value_numeric ?? 0), 0);
    return { totalUsd: total, latestByKey: latest };
  }, [recent]);

  const cap = Number(cfg?.monthly_limit_usd ?? 0);
  const pct = cap > 0 ? Math.min(200, (totalUsd / cap) * 100) : 0;
  const over = pct >= (cfg?.alert_threshold_pct ?? 80);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{meta.label}</CardTitle>
          <a href={meta.href} target="_blank" rel="noopener noreferrer"
             className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Console <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">{meta.hint}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-2xl font-semibold text-foreground">
              ${totalUsd.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              of ${cap.toFixed(2)} cap
            </div>
          </div>
          <Progress value={Math.min(100, pct)} className={over ? "bg-destructive/20" : ""} />
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className={over ? "text-destructive font-medium" : "text-muted-foreground"}>
              {pct.toFixed(1)}%
            </span>
            {cfg?.last_sync_status === "ok" ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {cfg.last_synced_at ? new Date(cfg.last_synced_at).toLocaleString() : "never"}
              </span>
            ) : cfg?.last_sync_status === "error" ? (
              <span className="inline-flex items-center gap-1 text-destructive" title={cfg.last_sync_error ?? ""}>
                <AlertTriangle className="h-3 w-3" /> sync error
              </span>
            ) : (
              <span className="text-muted-foreground">not synced</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Monthly cap (USD)</Label>
            <Input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Alert at %</Label>
            <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </div>
        </div>

        {provider === "github" && (
          <div>
            <Label className="text-xs">GitHub org (or user)</Label>
            <Input value={ghOrg} onChange={(e) => setGhOrg(e.target.value)} placeholder="e.g. brain-bbqs" />
          </div>
        )}

        {(provider === "lovable" || provider === "supabase") && (
          <div>
            <Label className="text-xs">Manual current spend (USD)</Label>
            <Input type="number" value={manual} onChange={(e) => setManual(e.target.value)}
                   placeholder="Read from console, paste here" />
            <p className="text-[11px] text-muted-foreground mt-1">
              {provider === "lovable"
                ? "Lovable has no public billing API — update from Plans & Credits."
                : "Auto-sync activates when SUPABASE_MANAGEMENT_TOKEN is added."}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onSave({
            monthly_limit_usd: Number(limit) || 0,
            alert_threshold_pct: Math.max(1, Math.min(200, Number(threshold) || 80)),
            ...(provider === "github" ? { config: { ...(cfg?.config ?? {}), org: ghOrg.trim() } } : {}),
            ...(provider !== "github" ? { manual_usage_usd: manual === "" ? null : Number(manual) } : {}),
          })}>Save</Button>
          <Button size="sm" onClick={onSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </Button>
          {over && cap > 0 && <Badge variant="destructive">Over threshold</Badge>}
        </div>

        {recent.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Current metrics</p>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {Array.from(latestByKey.values())
                .filter((s) => !s.metric_key.startsWith("_"))
                .sort((a, b) => (a.metric_label ?? a.metric_key).localeCompare(b.metric_label ?? b.metric_key))
                .map((s) => (
                  <div key={s.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate mr-2">{s.metric_label ?? s.metric_key}</span>
                    <span className="font-mono text-foreground">
                      {s.value_numeric != null ? `${s.value_numeric.toFixed(2)} ${s.unit ?? ""}` : "—"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}