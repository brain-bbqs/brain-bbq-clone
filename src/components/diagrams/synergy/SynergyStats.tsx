import { Network, GitBranch, CircleDot, Zap } from "lucide-react";
import type { FilterType } from "./SynergyFilters";

interface SynergyStatsProps {
  totalNodes: number;
  totalEdges: number;
  filteredEdges: number;
  connectedNodes: number;
  filter: FilterType;
}

export function SynergyStats({ totalNodes, totalEdges, filteredEdges, connectedNodes, filter }: SynergyStatsProps) {
  const stats = [
    { icon: CircleDot, label: "Projects", value: filter === "all" ? totalNodes : connectedNodes },
    { icon: GitBranch, label: "Synergies", value: filteredEdges },
    { icon: Zap, label: "Density", value: `${((filteredEdges / (connectedNodes * (connectedNodes - 1) / 2 || 1)) * 100).toFixed(1)}%` },
  ];

  return (
    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-1.5">
          <s.icon className="w-3.5 h-3.5" />
          <span className="font-medium text-foreground">{s.value}</span>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
