import { SYNERGY_TYPE_COLORS } from "@/data/marr-synergies";

const GRANT_TYPES = [
  { label: "R34", desc: "Planning", sizeClass: "w-3 h-3", shape: "rounded-full" },
  { label: "R61", desc: "Translational", sizeClass: "w-3 h-3", shape: "rounded-full border-dashed" },
  { label: "U01", desc: "Cooperative", sizeClass: "w-4 h-4", shape: "rounded-full" },
  { label: "U24/R24", desc: "Infrastructure", sizeClass: "w-3.5 h-3.5", shape: "rounded" },
];

const EDGE_TYPES = Object.entries(SYNERGY_TYPE_COLORS).map(([key, color]) => ({
  label: key.charAt(0).toUpperCase() + key.slice(1),
  color,
}));

export function SynergyLegend() {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Node types */}
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Grant Types (Node Size)
          </h4>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {GRANT_TYPES.map((g) => (
              <div key={g.label} className="flex items-center gap-1.5">
                <div className={`${g.sizeClass} ${g.shape} bg-muted border border-border`} />
                <span>
                  <strong className="text-foreground">{g.label}</strong> {g.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Edge types */}
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Synergy Types (Edge Color)
          </h4>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {EDGE_TYPES.map((e) => (
              <div key={e.label} className="flex items-center gap-1.5">
                <div
                  className="w-5 h-0.5 rounded-full"
                  style={{ background: e.color }}
                />
                <span>{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
