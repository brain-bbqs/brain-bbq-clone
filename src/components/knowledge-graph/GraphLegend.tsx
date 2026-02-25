interface LegendItem {
  label: string;
  color: string;
  type: string;
}

const items: LegendItem[] = [
  { label: "Projects", color: "hsl(210, 85%, 60%)", type: "project" },
  { label: "Species", color: "hsl(140, 70%, 55%)", type: "species" },
  { label: "Investigators", color: "hsl(35, 90%, 60%)", type: "investigator" },
  { label: "Meta Tags", color: "hsl(280, 65%, 65%)", type: "meta_tag" },
  { label: "Publications", color: "hsl(350, 75%, 60%)", type: "publication" },
  { label: "Resources", color: "hsl(180, 65%, 55%)", type: "resource" },
];

interface GraphLegendProps {
  activeFilter: string | null;
  onFilterChange: (type: string | null) => void;
  nodeCounts: Record<string, number>;
}

export function GraphLegend({ activeFilter, onFilterChange, nodeCounts }: GraphLegendProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-[hsl(220,35%,12%)]/90 backdrop-blur-md border border-[hsl(210,30%,25%)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl z-10">
      <button
        onClick={() => onFilterChange(null)}
        className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
          !activeFilter
            ? "bg-[hsl(210,85%,60%)] text-white"
            : "text-[hsl(210,20%,65%)] hover:text-[hsl(210,20%,85%)]"
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
              ? "bg-[hsl(220,30%,20%)] text-white"
              : "text-[hsl(210,20%,60%)] hover:text-[hsl(210,20%,85%)]"
          }`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: item.color,
              boxShadow: `0 0 6px ${item.color}`,
            }}
          />
          {item.label} ({nodeCounts[item.type] || 0})
        </button>
      ))}
    </div>
  );
}
