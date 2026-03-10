import { SYNERGY_TYPE_COLORS, type SynergyLink } from "@/data/marr-synergies";
import { cn } from "@/lib/utils";

export type FilterType = "all" | SynergyLink["synergyType"];

interface SynergyFiltersProps {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
}

const FILTERS: { key: FilterType; label: string; color?: string }[] = [
  { key: "all", label: "All Synergies" },
  { key: "algorithmic", label: "Algorithmic", color: SYNERGY_TYPE_COLORS.algorithmic },
  { key: "hardware", label: "Hardware", color: SYNERGY_TYPE_COLORS.hardware },
  { key: "data", label: "Data", color: SYNERGY_TYPE_COLORS.data },
  { key: "theoretical", label: "Theoretical", color: SYNERGY_TYPE_COLORS.theoretical },
  { key: "infrastructure", label: "Infrastructure", color: SYNERGY_TYPE_COLORS.infrastructure },
];

export function SynergyFilters({ filter, onFilterChange }: SynergyFiltersProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onFilterChange(f.key)}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 border",
            filter === f.key
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-muted-foreground hover:text-foreground border-border hover:border-foreground/20 hover:shadow-sm"
          )}
        >
          {f.color && (
            <span
              className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
              style={{ background: f.color }}
            />
          )}
          {f.label}
        </button>
      ))}
    </div>
  );
}
