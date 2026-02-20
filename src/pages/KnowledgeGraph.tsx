import { SpeciesHeatmap } from "@/components/diagrams/SpeciesHeatmap";

export default function KnowledgeGraph() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Project Explorer
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          Cross-species collaboration opportunities mapped through shared goals, methods, and resources.
          Each cell shows how many features two species share across all BBQS projects. Hover for details.
        </p>
      </div>

      <SpeciesHeatmap />
    </div>
  );
}
