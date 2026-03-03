import { PageMeta } from "@/components/PageMeta";
import { ComputationalIcicle } from "@/components/diagrams/ComputationalIcicle";

const ComputationalModels = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Computational Models"
        description="Interactive icicle chart of computational models across the BBQS consortium, organized by methodological category."
      />
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          The BBQS Computational Landscape
        </h1>
        <p className="text-muted-foreground mb-6 max-w-3xl">
          Click any category to drill in and see model details. Use the back button or breadcrumbs to navigate up.
        </p>

        <ComputationalIcicle />
      </div>
    </div>
  );
};

export default ComputationalModels;
