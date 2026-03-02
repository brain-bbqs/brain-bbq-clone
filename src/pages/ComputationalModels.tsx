import { PageMeta } from "@/components/PageMeta";
import { computationalCategories } from "@/data/computational-models";
import { CollapsibleTree } from "@/components/diagrams/CollapsibleTree";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ComputationalModels = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Computational Models"
        description="Interactive collapsible trees of computational models across the BBQS consortium, organized by methodological category and mapped to Marr's Levels of Analysis."
      />
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          The BBQS Computational Landscape
        </h1>
        <p className="text-muted-foreground mb-8 max-w-3xl">
          This landscape maps six primary methodological categories to their respective
          roles within Marr's Levels of Analysis — bridging raw data to ethological
          understanding across all 26 projects in the BBQS consortium. Click any node to
          expand or collapse the tree.
        </p>

        <div className="grid gap-6">
          {computationalCategories.map((cat) => {
            const leafCount = cat.tree.children?.length ?? 0;
            return (
              <Card key={cat.id} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-lg text-foreground">
                      {cat.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {leafCount} model{leafCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {cat.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <CollapsibleTree data={cat.tree} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComputationalModels;
