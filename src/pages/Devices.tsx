import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface DeviceRow {
  grant_number: string;
  device_class: string | null;
  model_name: string | null;
  manufacturer: string | null;
  evidence_count: number | null;
  confidence_max: number | null;
  sample_pmid: string | null;
  manual_urls: string[] | null;
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
    setRows((data as any as DeviceRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows;
    if (needle) {
      out = out.filter((r) =>
        [r.model_name, r.device_class, r.manufacturer, r.grant_number]
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageMeta
        title="Devices — Instruments used across BBQS projects"
        description="Hardware, models, manufacturers, and manuals extracted from BBQS grants and their publications."
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Devices</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Every piece of instrumentation identified across BBQS projects — probes, miniscopes, headstages,
          DBS leads, iEEG grids, behavior rigs — with manufacturer and manual links when available.
        </p>
      </div>

      <div className="mb-4 flex gap-2 items-center">
        <Input
          placeholder="Search model, class, manufacturer, grant…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md"
        />
        <span className="text-xs text-muted-foreground">{filtered.length} rows</span>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <SortableTh k="model_name">Device</SortableTh>
                <SortableTh k="device_class">Class</SortableTh>
                <SortableTh k="manufacturer">Manufacturer</SortableTh>
                <SortableTh k="grant_number">Grant</SortableTh>
                <SortableTh k="evidence_count" className="text-right">Evidence</SortableTh>
                <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Manual</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading devices…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    No devices extracted yet. Check back soon.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium text-foreground">{r.model_name || <span className="text-muted-foreground italic">unnamed</span>}</td>
                    <td className="px-3 py-2">
                      {r.device_class ? (
                        <Badge variant="outline" className="text-xs">{r.device_class}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.manufacturer || "—"}</td>
                    <td className="px-3 py-2">
                      <Link to={`/projects/${r.grant_number}/profile`} className="text-primary hover:underline font-mono text-xs">
                        {r.grant_number}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.evidence_count ?? 0}</td>
                    <td className="px-3 py-2">
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
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
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