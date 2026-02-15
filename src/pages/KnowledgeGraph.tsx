import { SpeciesHeatmap } from "@/components/diagrams/SpeciesHeatmap";
import { ProjectIndexGrid } from "@/components/diagrams/ProjectIndexGrid";
import { downloadRdf } from "@/lib/rdf-export";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KnowledgeGraph() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          BBQS Knowledge Graph
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          Cross-species collaboration opportunities mapped through shared methods.
          Each cell shows how many computational, algorithmic, and implementation features
          two species share across all BBQS projects. Hover for details.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={downloadRdf}
        >
          <Download className="h-3.5 w-3.5" />
          Download RDF (Turtle)
        </Button>
      </div>

      <SpeciesHeatmap />

      <div className="mt-10">
        <ProjectIndexGrid />
      </div>
    </div>
  );
}
