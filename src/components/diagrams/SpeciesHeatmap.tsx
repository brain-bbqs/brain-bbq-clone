import { useMemo, useState } from "react";
import { MARR_PROJECTS, type MarrProject } from "@/data/marr-projects";
import { cn } from "@/lib/utils";

interface SharedDetail {
  level: string;
  features: string[];
}

interface CellData {
  speciesA: string;
  speciesB: string;
  total: number;
  details: SharedDetail[];
  projectsA: string[];
  projectsB: string[];
}

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function getSpeciesFeatures(species: string) {
  const projects = MARR_PROJECTS.filter((p) => p.species === species);
  const computational = new Set<string>();
  const algorithmic = new Set<string>();
  const implementation = new Set<string>();

  projects.forEach((p) => {
    p.computational.forEach((f) => computational.add(normalize(f)));
    p.algorithmic.forEach((f) => algorithmic.add(normalize(f)));
    p.implementation.forEach((f) => implementation.add(normalize(f)));
  });

  return { computational, algorithmic, implementation, projects };
}

type MarrFilter = "all" | "computational" | "algorithmic" | "implementation";

function buildHeatmapData(filter: MarrFilter) {
  const speciesList = [...new Set(MARR_PROJECTS.map((p) => p.species))].sort();
  const matrix: CellData[][] = [];

  for (let i = 0; i < speciesList.length; i++) {
    const row: CellData[] = [];
    const a = getSpeciesFeatures(speciesList[i]);

    for (let j = 0; j < speciesList.length; j++) {
      const b = getSpeciesFeatures(speciesList[j]);
      const details: SharedDetail[] = [];
      let total = 0;

      if (filter === "all" || filter === "computational") {
        const compShared = [...a.computational].filter((f) => b.computational.has(f));
        if (compShared.length > 0) details.push({ level: "Goals", features: compShared });
        total += compShared.length;
      }

      if (filter === "all" || filter === "algorithmic") {
        const algoShared = [...a.algorithmic].filter((f) => b.algorithmic.has(f));
        if (algoShared.length > 0) details.push({ level: "Methods", features: algoShared });
        total += algoShared.length;
      }

      if (filter === "all" || filter === "implementation") {
        const implShared = [...a.implementation].filter((f) => b.implementation.has(f));
        if (implShared.length > 0) details.push({ level: "Resources", features: implShared });
        total += implShared.length;
      }

      row.push({
        speciesA: speciesList[i],
        speciesB: speciesList[j],
        total: i === j ? 0 : total,
        details: i === j ? [] : details,
        projectsA: a.projects.map((p) => p.shortName),
        projectsB: b.projects.map((p) => p.shortName),
      });
    }
    matrix.push(row);
  }

  return { speciesList, matrix };
}

export function SpeciesHeatmap() {
  const [filter, setFilter] = useState<MarrFilter>("all");
  const { speciesList, matrix } = useMemo(() => buildHeatmapData(filter), [filter]);
  const [hovered, setHovered] = useState<CellData | null>(null);
  const [hoveredPos, setHoveredPos] = useState({ x: 0, y: 0 });

  const FILTER_OPTIONS: { value: MarrFilter; label: string; color: string }[] = [
    { value: "all", label: "All Levels", color: "" },
    { value: "computational", label: "Goals", color: "#64b5f6" },
    { value: "algorithmic", label: "Methods", color: "#81c784" },
    { value: "implementation", label: "Resources", color: "#a78bfa" },
  ];

  // HSL base per filter: blue for computational, green for algorithmic, purple for implementation, gold for all
  const filterHsl: Record<MarrFilter, { h: number; s: number; l: number }> = {
    all: { h: 38, s: 90, l: 50 },
    computational: { h: 210, s: 80, l: 60 },
    algorithmic: { h: 142, s: 60, l: 50 },
    implementation: { h: 263, s: 70, l: 65 },
  };

  // Find max for color scale
  const maxVal = useMemo(() => {
    let max = 0;
    matrix.forEach((row) => row.forEach((cell) => { if (cell.total > max) max = cell.total; }));
    return max;
  }, [matrix]);

  const getColor = (val: number) => {
    if (val === 0) return "hsl(var(--muted))";
    const intensity = Math.max(0.15, val / maxVal);
    const { h, s, l } = filterHsl[filter];
    return `hsla(${h}, ${s}%, ${l}%, ${intensity})`;
  };

  const getTextColor = (val: number) => {
    if (val === 0) return "hsl(var(--muted-foreground))";
    const intensity = val / maxVal;
    return intensity > 0.6 ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))";
  };

  return (
    <div className="relative">
      {/* Level filter toggles */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              filter === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {opt.color && (
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: opt.color }}
              />
            )}
            {opt.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse mx-auto">
          <thead>
            <tr>
              <th className="p-3 text-sm font-medium text-muted-foreground" />
              {speciesList.map((s) => (
                <th
                  key={s}
                  className="p-2 text-sm font-semibold text-foreground"
                  style={{ writingMode: "vertical-lr", textOrientation: "mixed", minWidth: 56, height: 130 }}
                >
                  <span className="transform rotate-180" style={{ writingMode: "vertical-rl" }}>{s}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {speciesList.map((rowSpecies, i) => (
              <tr key={rowSpecies}>
                <td className="p-3 text-sm font-semibold text-foreground text-right whitespace-nowrap pr-4">
                  {rowSpecies}
                </td>
                {matrix[i].map((cell, j) => (
                  <td
                    key={`${i}-${j}`}
                    className={cn(
                      "text-center text-sm font-mono border border-border/30 transition-all duration-150 cursor-pointer rounded-sm",
                      i === j && "bg-transparent"
                    )}
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: i === j ? "transparent" : getColor(cell.total),
                      color: getTextColor(cell.total),
                    }}
                    onMouseEnter={(e) => {
                      if (i !== j) {
                        setHovered(cell);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const container = e.currentTarget.closest('.relative')?.getBoundingClientRect();
                        if (container) {
                          setHoveredPos({
                            x: rect.left - container.left + rect.width / 2,
                            y: rect.top - container.top,
                          });
                        }
                      }
                    }}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {i === j ? (
                      <span className="text-muted-foreground/30 text-lg">•</span>
                    ) : (
                      cell.total || ""
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color scale legend */}
      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
        <span>Fewer shared</span>
        <div className="flex h-3 rounded overflow-hidden">
          {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((i) => {
            const { h, s, l } = filterHsl[filter];
            return <div key={i} className="w-6" style={{ backgroundColor: `hsla(${h}, ${s}%, ${l}%, ${i})` }} />;
          })}
        </div>
        <span>More shared</span>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <span>Shared features include: <strong className="text-foreground">Goals</strong> (problems), <strong className="text-foreground">Methods</strong> (approaches), and <strong className="text-foreground">Resources</strong> (tools)</span>
      </div>

      {/* Hover tooltip */}
      {hovered && hovered.total > 0 && (
        <div
          className="absolute z-50 pointer-events-none bg-popover border border-border rounded-lg shadow-xl p-4 max-w-sm text-xs"
          style={{
            left: Math.min(hoveredPos.x + 10, 600),
            top: hoveredPos.y - 10,
            transform: "translateY(-100%)",
          }}
        >
          <div className="font-semibold text-foreground mb-2 text-sm">
            {hovered.speciesA} ↔ {hovered.speciesB}
          </div>
          <div className="text-muted-foreground mb-2">
            {hovered.total} shared feature{hovered.total !== 1 ? "s" : ""} across Marr levels
          </div>

          {hovered.details.map((d) => (
            <div key={d.level} className="mt-2">
              <span
                className="font-medium uppercase tracking-wider"
                style={{
                  fontSize: 10,
                  color:
                    d.level === "Goals"
                      ? "#64b5f6"
                      : d.level === "Methods"
                      ? "#81c784"
                      : "#ffb74d",
                }}
              >
                {d.level}
              </span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {d.features.map((f) => (
                  <span key={f} className="bg-secondary px-1.5 py-0.5 rounded text-foreground capitalize" style={{ fontSize: 10 }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-3 pt-2 border-t border-border grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground block mb-1">{hovered.speciesA} projects:</span>
              {hovered.projectsA.map((p) => (
                <div key={p} className="text-foreground">{p}</div>
              ))}
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">{hovered.speciesB} projects:</span>
              {hovered.projectsB.map((p) => (
                <div key={p} className="text-foreground">{p}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
