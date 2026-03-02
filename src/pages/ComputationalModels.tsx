import { PageMeta } from "@/components/PageMeta";
import { computationalCategories } from "@/data/computational-models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, FlaskConical, Users, FileText } from "lucide-react";

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
          Six primary methodological categories mapped to Marr's Levels of Analysis —
          bridging raw data to ethological understanding across the BBQS consortium.
        </p>

        <div className="space-y-10">
          {computationalCategories.map((cat) => {
            const models = cat.tree.children ?? [];
            return (
              <section key={cat.id}>
                <div className="mb-4">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h2 className="text-xl font-bold text-foreground">{cat.title}</h2>
                    <Badge variant="outline" className="text-xs">
                      {models.length} model{models.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {models.map((model, idx) => (
                    <Card key={idx} className="bg-card border-border hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-semibold text-foreground leading-tight">
                          {model.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0 space-y-2 text-xs">
                        {model.meta?.goal && (
                          <div className="flex items-start gap-1.5">
                            <Brain className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">Goal: </span>
                              {model.meta.goal}
                            </span>
                          </div>
                        )}
                        {model.meta?.algorithm && (
                          <div className="flex items-start gap-1.5">
                            <FlaskConical className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">Method: </span>
                              {model.meta.algorithm}
                            </span>
                          </div>
                        )}
                        {model.meta?.species && (
                          <div className="flex items-start gap-1.5">
                            <span className="text-muted-foreground text-[11px]">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {model.meta.species}
                              </Badge>
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {model.meta?.grant && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                              <FileText className="h-3 w-3" />
                              {model.meta.grant}
                            </span>
                          )}
                          {model.meta?.pis && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {model.meta.pis}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComputationalModels;
