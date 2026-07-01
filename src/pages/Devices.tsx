import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ExternalLink, Network } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DeviceRow {
  grant_number: string;
  device_class: string | null;
  model_name: string | null;
  manufacturer: string | null;
  device_label?: string | null;
  hardware_label?: string | null;
  evidence_count: number | null;
  confidence_max: number | null;
  sample_pmid: string | null;
  sample_title: string | null;
  manual_urls: string[] | null;
  species: string[] | null;
  environment_tags: string[] | null;
  sample_use_case: string | null;
  setting: string | null;
  source_url?: string | null;
  source_grant_title?: string | null;
  source_org?: string | null;
  min_depth?: number | null;
  match_score_max?: number | null;
  quote?: string | null;
  latest_evidence_at?: string | null;
}

type SortKey = "model_name" | "device_class" | "manufacturer" | "grant_number" | "evidence_count";

export default function Devices() {
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "evidence_count", dir: "desc" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_devices_v" as any)
      .select("*")
      .limit(1000);
    if (error) toast.error(error.message);
    const nextRows = ((data as any as DeviceRow[]) || []).filter((r) => {
      const hasDeviceSignal = Boolean(
        r.model_name ||
        r.hardware_label ||
        r.manufacturer ||
        (r.device_class && r.device_class !== "unspecified") ||
        r.sample_use_case
      );
      const computationalOnly = (r.environment_tags || []).some((tag) => tag === "computational_only");
      const hasPhysicalContext = Boolean(
        r.manufacturer ||
        r.model_name ||
        (r.environment_tags || []).some((tag) => tag !== "computational_only")
      );
      return hasDeviceSignal && (!computationalOnly || hasPhysicalContext);
    });
    setRows(nextRows);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("devices-page-evidence-refresh")
      .on("postgres_changes", { event: "*", schema: "public", table: "grant_methods_evidence" }, () => {
        load();
      })
      .subscribe();
    const timer = window.setInterval(load, 30000);
    return () => {
      window.clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows;
    if (needle) {
      out = out.filter((r) =>
        [r.device_label, r.hardware_label, r.model_name, r.device_class, r.manufacturer, r.grant_number, r.sample_use_case]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle))
      );
    }
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...out].sort((a, b) => {
      const av = a[sort.key] ?? "";
      const bv = b[sort.key] ?? "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, q, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const SortableTh = ({ k, children, className = "" }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <th
      className={`text-left px-3 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground cursor-pointer select-none hover:text-foreground ${className}`}
      onClick={() => toggleSort(k)}
    >
      {children}
      {sort.key === k ? <span className="ml-1">{sort.dir === "asc" ? "▲" : "▼"}</span> : null}
    </th>
  );

  const deviceName = (r: DeviceRow) =>
    r.device_label || r.model_name || r.hardware_label || (r.device_class ? r.device_class.replace(/_/g, " ") : "Device evidence");

  const isModelKnown = (r: DeviceRow) => Boolean(r.model_name || r.manufacturer);

  const physicalRows = rows.filter((r) => !(r.environment_tags || []).includes("computational_only"));
  const modelRows = rows.filter((r) => isModelKnown(r));
  const missingModels = rows.length - modelRows.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageMeta
        title="Devices — Instruments used across BBQS projects"
        description="Hardware, models, manufacturers, and manuals extracted from BBQS grants and their publications."
      />

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Devices</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Every piece of instrumentation identified across BBQS projects — probes, miniscopes, headstages,
              DBS leads, iEEG grids, behavior rigs — with the species, environment, and use context it was
              deployed in.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/resources/devices/graph">
              <Network className="h-4 w-4 mr-2" />
              View knowledge graph
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 items-center">
        <Input
          placeholder="Search device, use context, manufacturer, grant…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md"
        />
        <span className="text-xs text-muted-foreground">{filtered.length} rows</span>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-2xl font-semibold text-foreground">{rows.length}</div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">device signals</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-2xl font-semibold text-foreground">{physicalRows.length}</div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">physical contexts</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-2xl font-semibold text-foreground">{modelRows.length}</div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">named models</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-2xl font-semibold text-foreground">{missingModels}</div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">need manufacturer/model</div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <SortableTh k="model_name">Device</SortableTh>
                <SortableTh k="device_class">Class</SortableTh>
                <SortableTh k="manufacturer">Manufacturer</SortableTh>
                <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Species</th>
                <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Environment</th>
                <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">What it means</th>
                <SortableTh k="grant_number">Grant</SortableTh>
                <SortableTh k="evidence_count" className="text-right">Evidence</SortableTh>
                <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Source</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading devices…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                    No devices extracted yet. Check back soon.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium text-foreground">
                      <div className="max-w-[190px] leading-snug">{deviceName(r)}</div>
                      {!isModelKnown(r) ? (
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                          manufacturer/model not reported yet
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      {r.device_class ? (
                        <Badge variant="outline" className="text-xs">{r.device_class.replace(/_/g, " ")}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.manufacturer || "—"}</td>
                    <td className="px-3 py-2">
                      {r.species && r.species.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.species.slice(0, 3).map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px]">{s.replace(/_/g, " ")}</Badge>
                          ))}
                        </div>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {r.environment_tags && r.environment_tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.environment_tags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px] border-primary/30 text-primary">{t.replace(/_/g, " ")}</Badge>
                          ))}
                        </div>
                      ) : r.setting ? (
                        <Badge variant="outline" className="text-[10px]">{r.setting}</Badge>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2 max-w-[340px] text-xs text-muted-foreground">
                      {r.sample_use_case ? (
                        <span title={r.sample_use_case}>
                          {r.sample_use_case.length > 150 ? r.sample_use_case.slice(0, 148) + "…" : r.sample_use_case}
                        </span>
                      ) : "—"}
                      {r.quote ? (
                        <div className="mt-1 italic text-muted-foreground/80" title={r.quote}>
                          “{r.quote.length > 120 ? r.quote.slice(0, 118) + "…" : r.quote}”
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <Link to={`/projects/${r.grant_number}/profile`} className="text-primary hover:underline font-mono text-xs">
                        {r.grant_number}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.evidence_count ?? 0}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                      {r.source_url ? (
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {String(r.sample_pmid || "source").startsWith("PROJECT:") ? "NIH abstract" : "paper"}
                        </a>
                      ) : null}
                      {r.manual_urls && r.manual_urls.length > 0 ? (
                        <a
                          href={r.manual_urls[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Manual
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">manual pending</span>
                      )}
                      {typeof r.min_depth === "number" ? (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          hop {r.min_depth} · score {typeof r.match_score_max === "number" ? r.match_score_max.toFixed(2) : "—"}
                        </span>
                      ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}