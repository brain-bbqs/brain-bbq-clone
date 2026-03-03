import { PageMeta } from "@/components/PageMeta";
import { ComputationalBubbleChart } from "@/components/diagrams/ComputationalBubbleChart";

const ComputationalModels = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Computational Models"
        description="Interactive bubble chart of computational models across the BBQS consortium, organized by methodological category."
      />
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          The BBQS Computational Landscape
        </h1>
        <p className="text-muted-foreground mb-8 max-w-3xl">
          Six primary methodological categories mapped to Marr's Levels of Analysis —
          hover over any bubble to see the full model details.
        </p>

        <ComputationalBubbleChart />
      </div>
    </div>
  );
};

export default ComputationalModels;
