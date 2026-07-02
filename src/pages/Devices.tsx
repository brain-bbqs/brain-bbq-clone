import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/PageMeta";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Network } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "@/styles/ag-grid-theme.css";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileCardList } from "@/components/MobileCardList";

// Curated "known gotchas" per device class — plain-English things that commonly
// trip up experimenters, based on shared lab experience. Keys match the
// `device_class` values produced by the harvester (snake_case).
const COMMON_ISSUES: Record<string, string[]> = {
  silicon_probe: [
    "Shank breakage on insertion — slow descent (<5 µm/s) and pre-thin dura",
    "Ground/reference loops causing 60 Hz noise",
    "Channel drift over long recordings; re-reference or Kilosort drift correction",
  ],
  neuropixels: [
    "Headstage overheating in freely-moving rigs — add airflow or duty-cycle",
    "Reference/ground mis-config produces flat channels",
    "Probe bending if not perfectly perpendicular to brain surface",
  ],
  miniscope: [
    "GRIN lens focal drift after implantation — re-focus at each session",
    "Photobleaching with high LED power; keep <0.3 mW/mm²",
    "Cable torque restricts natural behavior; use commutator",
  ],
  two_photon_microscope: [
    "Z-drift over long sessions — enable online motion correction",
    "Laser power creep damages tissue; monitor at objective",
    "PMT saturation in bright expressers",
  ],
  eeg: [
    "Impedance >10 kΩ → noisy channels; re-gel and re-abrade",
    "Line noise from nearby equipment; notch filter or shielding",
    "Sweat/movement artifacts in long recordings",
  ],
  ieeg: [
    "Grid migration between imaging and recording — re-localize",
    "CSF shunting under grid causing signal loss",
    "Stim artifact bleed into recording channels",
  ],
  dbs_lead: [
    "Lead migration in first 2 weeks post-op",
    "Impedance changes as scar tissue forms",
    "Stim-induced side effects need re-programming",
  ],
  camera: [
    "Rolling shutter distorts fast movement — use global shutter for pose tracking",
    "IR illumination flicker synced to line frequency",
    "Frame drops at high FPS if disk I/O can't keep up",
  ],
  depth_camera: [
    "IR interference between multiple depth cameras — stagger or time-mux",
    "Poor depth on dark/reflective fur",
    "Calibration drift with temperature",
  ],
  imu: [
    "Gyro drift over minutes; fuse with accelerometer/magnetometer",
    "Magnetometer useless indoors near ferrous metal",
    "Clock skew vs. other streams — use LSL for sync",
  ],
  emg: [
    "Cross-talk between adjacent muscles",
    "Electrode lift-off during long sessions",
    "Motion artifact swamping signal at high forces",
  ],
  headstage: [
    "Connector fatigue after ~50 mating cycles",
    "Static discharge kills channels — ground yourself",
    "SPI/serial timing issues at high channel counts",
  ],
  behavior_rig: [
    "Lick-spout capacitance drift over session",
    "Solenoid click cues the animal — mask with white noise",
    "Frame timing jitter breaks trial alignment",
  ],
  monitor: [
    "Refresh rate mismatch with stim software drops frames",
    "Gamma not calibrated → contrast unreliable across labs",
    "Backlight flicker aliases with camera FPS",
  ],
  injector: [
    "Air bubbles cause volume errors — bleed lines before use",
    "Backflow up the pipette track; use slow infusion + wait time",
    "Tip clogging with viscous vectors",
  ],
  optical_fiber: [
    "Coupling losses at rotary joint (~30%)",
    "Tissue damage from heating at >20 mW/mm²",
    "Fiber tip contamination reduces output over time",
  ],
  daq: [
    "Ground loops when chaining multiple DAQs",
    "Sample-clock drift between devices — use shared clock",
    "Buffer underruns at high channel × rate combinations",
  ],
};

function issuesFor(row: DeviceRow): string[] {
  const cls = (row.device_class || "").toLowerCase();
  if (COMMON_ISSUES[cls]) return COMMON_ISSUES[cls];
  // Fuzzy fallback: try to match on label keywords.
  const hay = `${row.model_name || ""} ${row.hardware_label || ""} ${row.device_label || ""}`.toLowerCase();
  for (const [key, issues] of Object.entries(COMMON_ISSUES)) {
    if (hay.includes(key.replace(/_/g, " ")) || hay.includes(key)) return issues;
  }
  return [];
}

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

export default function Devices() {
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickFilterText, setQuickFilterText] = useState("");
  const isMobile = useIsMobile();

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

  const deviceName = (r: DeviceRow) =>
    r.device_label || r.model_name || r.hardware_label || (r.device_class ? r.device_class.replace(/_/g, " ") : "Device evidence");

  const isModelKnown = (r: DeviceRow) => Boolean(r.model_name || r.manufacturer);

  const physicalRows = rows.filter((r) => !(r.environment_tags || []).includes("computational_only"));
  const modelRows = rows.filter((r) => isModelKnown(r));
  const missingModels = rows.length - modelRows.length;

  const defaultColDef = useMemo<ColDef>(
    () => ({ sortable: true, resizable: true, filter: true, unSortIcon: true, wrapText: true, autoHeight: true }),
    []
  );

  const columnDefs = useMemo<ColDef<DeviceRow>[]>(() => [
    {
      headerName: "Device",
      minWidth: 280,
      flex: 1.2,
      valueGetter: (p) => (p.data ? deviceName(p.data) : ""),
      cellRenderer: (p: any) => (
        <div className="py-1">
          <div className="text-sm font-semibold text-foreground leading-snug">{deviceName(p.data)}</div>
          {!isModelKnown(p.data) && (
            <div className="text-[11px] text-muted-foreground mt-0.5 italic">— model TBD</div>
          )}
        </div>
      ),
    },
    {
      field: "device_class", headerName: "Class", width: 140,
      cellRenderer: (p: any) => p.value
        ? <Badge variant="outline" className="text-xs">{String(p.value).replace(/_/g, " ")}</Badge>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      field: "manufacturer", headerName: "Manufacturer", width: 140,
      cellRenderer: (p: any) => p.value || <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      field: "species", headerName: "Species", width: 160,
      getQuickFilterText: (p) => (p.value || []).join(" "),
      cellRenderer: (p: any) => (p.value && p.value.length) ? (
        <div className="flex flex-wrap gap-1">
          {p.value.slice(0, 3).map((s: string) => (
            <Badge key={s} variant="secondary" className="text-[10px]">{s.replace(/_/g, " ")}</Badge>
          ))}
        </div>
      ) : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      field: "environment_tags", headerName: "Environment", width: 180,
      getQuickFilterText: (p) => (p.value || []).join(" "),
      cellRenderer: (p: any) => (p.value && p.value.length) ? (
        <div className="flex flex-wrap gap-1">
          {p.value.slice(0, 3).map((t: string) => (
            <Badge key={t} variant="outline" className="text-[10px] border-primary/30 text-primary">{t.replace(/_/g, " ")}</Badge>
          ))}
        </div>
      ) : p.data?.setting ? (
        <Badge variant="outline" className="text-[10px]">{p.data.setting}</Badge>
      ) : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      headerName: "How it's used in this project",
      headerTooltip: "Plain-English summary of how this device shows up in the grant/paper, plus the exact snippet we pulled it from.",
      flex: 1, minWidth: 300,
      valueGetter: (p) => `${p.data?.sample_use_case ?? ""} ${p.data?.quote ?? ""}`,
      cellRenderer: (p: any) => {
        const useCase: string = p.data?.sample_use_case || "";
        const raw: string = (p.data?.quote || "").replace(/\s+/g, " ").trim();
        // Trim to first sentence or ~200 chars so the row stays readable.
        let snippet = raw;
        if (snippet.length > 220) {
          const cut = snippet.slice(0, 220);
          const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
          snippet = (lastStop > 80 ? cut.slice(0, lastStop + 1) : cut) + "…";
        }
        if (!useCase && !snippet) {
          return <span className="text-muted-foreground text-xs">not yet summarized</span>;
        }
        return (
          <div className="text-xs py-1 space-y-1">
            {useCase && <div className="text-foreground/90 leading-snug">{useCase}</div>}
            {snippet && (
              <div className="italic text-muted-foreground/80 leading-snug">"{snippet}"</div>
            )}
          </div>
        );
      },
    },
    {
      headerName: "Common problems",
      headerTooltip: "Known gotchas for this class of device — collected from shared lab experience, not extracted per-paper.",
      width: 320,
      sortable: false,
      filter: false,
      valueGetter: (p) => (p.data ? issuesFor(p.data).join(" · ") : ""),
      cellRenderer: (p: any) => {
        const issues = issuesFor(p.data);
        if (!issues.length) {
          return <span className="text-muted-foreground text-xs">no common-issue notes yet</span>;
        }
        return (
          <ul className="text-xs py-1 space-y-1 list-disc pl-4 text-foreground/85 leading-snug">
            {issues.map((t) => <li key={t}>{t}</li>)}
          </ul>
        );
      },
    },
    {
      field: "grant_number", headerName: "Grant", width: 150,
      cellRenderer: (p: any) => (
        <Link to={`/projects/${p.value}/profile`} className="text-primary hover:underline font-mono text-xs">{p.value}</Link>
      ),
    },
    {
      field: "evidence_count", headerName: "Evidence", width: 110, type: "numericColumn",
      sort: "desc",
      cellClass: "text-right tabular-nums",
    },
    {
      headerName: "Source", width: 150, sortable: false, filter: false,
      cellRenderer: (p: any) => (
        <div className="flex flex-col gap-1 py-1">
          {p.data.source_url && (
            <a href={p.data.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
              <ExternalLink className="h-3 w-3" />
              {String(p.data.sample_pmid || "").startsWith("PROJECT:") ? "NIH abstract" : "paper"}
            </a>
          )}
          {p.data.manual_urls?.[0] ? (
            <a href={p.data.manual_urls[0]} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
              <ExternalLink className="h-3 w-3" /> Manual
            </a>
          ) : <span className="text-muted-foreground text-[10px]">manual pending</span>}
          {typeof p.data.min_depth === "number" && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              hop {p.data.min_depth} · score {typeof p.data.match_score_max === "number" ? p.data.match_score_max.toFixed(2) : "—"}
            </span>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="w-full px-4 sm:px-6 py-8">
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
        <input
          type="text"
          placeholder="Filter by device, manufacturer, species, environment, grant…"
          value={quickFilterText}
          onChange={(e) => setQuickFilterText(e.target.value)}
          className="px-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full max-w-md"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{rows.length} rows</span>
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

      {isMobile ? (
        <MobileCardList
          items={rows.map((r, i) => ({
            id: String(i),
            title: deviceName(r),
            fields: [
              { label: "Class", value: r.device_class?.replace(/_/g, " ") || "—" },
              { label: "Manufacturer", value: r.manufacturer || "—" },
              { label: "Species", value: (r.species || []).join(", ") || "—" },
              { label: "Environment", value: (r.environment_tags || []).join(", ") || r.setting || "—" },
              { label: "Grant", value: r.grant_number },
              { label: "Evidence", value: String(r.evidence_count ?? 0) },
            ],
          }))}
          emptyMessage={loading ? "Loading devices…" : "No devices extracted yet."}
        />
      ) : (
        <div className="ag-theme-alpine rounded-lg border border-border overflow-x-auto" style={{ width: "100%" }}>
          <AgGridReact<DeviceRow>
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
            animateRows={true}
            domLayout="autoHeight"
            suppressCellFocus={true}
            enableCellTextSelection={true}
            headerHeight={40}
            overlayNoRowsTemplate={loading ? "Loading devices…" : "No devices extracted yet. Check back soon."}
          />
        </div>
      )}
    </div>
  );
}