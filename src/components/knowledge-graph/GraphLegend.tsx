interface LegendItem {
  label: string;
  color: string;
  type: string;
}

const items: LegendItem[] = [
  { label: "Projects", color: "hsl(210, 70%, 55%)", type: "project" },
  { label: "Species", color: "hsl(140, 60%, 50%)", type: "species" },
  { label: "Investigators", color: "hsl(30, 80%, 55%)", type: "investigator" },
  { label: "Meta Tags", color: "hsl(280, 50%, 60%)", type: "meta_tag" },
];

interface GraphLegendProps {
  activeFilter: string | null;
  onFilterChange: (type: string | null) => void;
  nodeCounts: Record<string, number>;
}

export function GraphLegend({ activeFilter, onFilterChange, nodeCounts }: GraphLegendProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-3 flex items-center gap-4 shadow-lg z-10">
      <button
        onClick={() => onFilterChange(null)}
        className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
          !activeFilter ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        All ({Object.values(nodeCounts).reduce((a, b) => a + b, 0)})
      </button>
      {items.map(item => (
        <button
          key={item.type}
          onClick={() => onFilterChange(activeFilter === item.type ? null : item.type)}
          className={`flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-md ${
            activeFilter === item.type
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          {item.label} ({nodeCounts[item.type] || 0})
        </button>
      ))}
    </div>
  );
}
