import { PageMeta } from "@/components/PageMeta";
import { ComputationalKnowledgeGraph } from "@/components/diagrams/ComputationalKnowledgeGraph";

const ComputationalModels = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Knowledge Graph"
        description="Interactive knowledge graph of computational models across the BBQS consortium, organized by methodological category."
      />
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Knowledge Graph
        </h1>
        <p className="text-muted-foreground mb-6 max-w-3xl">
          An interactive knowledge graph of six methodological categories and their models.
          Click a category node to expand its models. Click any node to see details.
          Drag nodes to rearrange.
        </p>

        <ComputationalKnowledgeGraph />
      </div>
    </div>
  );
};

export default ComputationalModels;
