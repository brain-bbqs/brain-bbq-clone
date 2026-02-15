import { SpeciesHeatmap } from "@/components/diagrams/SpeciesHeatmap";
import { MARR_PROJECTS } from "@/data/marr-projects";

export default function KnowledgeGraph() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          BBQS Knowledge Graph
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          Cross-species collaboration opportunities mapped through shared methods.
          Each cell shows how many computational, algorithmic, and implementation features
          two species share across all BBQS projects. Hover for details.
        </p>
      </div>

      <SpeciesHeatmap />

      {/* Project index */}
      <div className="mt-10 border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Project Index</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MARR_PROJECTS.map((p) => (
            <div key={p.id} className="flex items-start gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: p.color }}
              />
              <div>
                <span className="font-medium text-foreground">{p.shortName}</span>
                <span className="text-muted-foreground"> — {p.species}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
