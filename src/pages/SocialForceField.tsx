import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUserTier } from "@/hooks/useUserTier";
import { Users, Brain, MessageSquare, Lock, Layers } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";

type Layer = {
  key: "relational" | "cognitive" | "interactional";
  scale: "Macro" | "Meso" | "Micro";
  title: string;
  subtitle: string;
  metrics: string[];
  icon: typeof Users;
  accent: string;
};

const LAYERS: Layer[] = [
  {
    key: "relational",
    scale: "Macro",
    title: "Relational",
    subtitle: "Group identity & social cohesion",
    metrics: [
      "Consortium-wide identity signals (self/other referencing)",
      "Cross-lab collaboration density",
      "Longitudinal cohesion trends",
    ],
    icon: Users,
    accent: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  },
  {
    key: "cognitive",
    scale: "Meso",
    title: "Cognitive",
    subtitle: "Shared attention & shared mental models",
    metrics: [
      "Topical overlap between working groups",
      "Concept alignment across projects",
      "Joint attention on shared artifacts",
    ],
    icon: Brain,
    accent: "from-sky-500/20 to-sky-500/5 border-sky-500/30",
  },
  {
    key: "interactional",
    scale: "Micro",
    title: "Interactional",
    subtitle: "Word reuse & linguistic entrainment",
    metrics: [
      "Lexical alignment in messages & PRs",
      "Syntactic entrainment over time",
      "Turn-level convergence in threads",
    ],
    icon: MessageSquare,
    accent: "from-violet-500/20 to-violet-500/5 border-violet-500/30",
  },
];

export default function SocialForceField() {
  const { isAdmin, isCurator, isLoading } = useUserTier();
  const navigate = useNavigate();
  const allowed = isAdmin || isCurator;

  useEffect(() => {
    if (!isLoading && !allowed) {
      const t = setTimeout(() => navigate("/", { replace: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [isLoading, allowed, navigate]);

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  if (!allowed) {
    return (
      <div className="p-8 max-w-xl">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Administrators only</AlertTitle>
          <AlertDescription>
            The Social Force Field is restricted to consortium administrators. Redirecting…
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl">
      <PageMeta
        title="Social Force Field — BBQS"
        description="Multi-level architecture measuring consortium social dynamics: relational, cognitive, and interactional layers."
      />

      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4" />
          <span>Engineering · Admin</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Social Force Field
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          A three-layer architecture for measuring the social dynamics of the BBQS consortium as it
          forms. Each layer contributes its own set of performance metrics.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Macro · Relational</Badge>
          <Badge variant="secondary">Meso · Cognitive</Badge>
          <Badge variant="secondary">Micro · Interactional</Badge>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {LAYERS.map((layer) => {
          const Icon = layer.icon;
          return (
            <Card
              key={layer.key}
              className={`bg-gradient-to-b ${layer.accent} border`}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-foreground" />
                  <Badge variant="outline">{layer.scale} layer</Badge>
                </div>
                <CardTitle>{layer.title}</CardTitle>
                <CardDescription>{layer.subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Performance metrics
                </div>
                <ul className="space-y-1.5 text-sm">
                  {layer.metrics.map((m) => (
                    <li key={m} className="flex gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>How the layers compose</CardTitle>
          <CardDescription>
            As the consortium grows, each layer's metrics roll up to describe the emergent social
            force field.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <span className="font-medium text-foreground">Interactional (micro)</span> signals from
            individual exchanges — messages, PRs, meeting transcripts — feed{" "}
            <span className="font-medium text-foreground">cognitive (meso)</span> measures of shared
            attention across groups, which in turn feed{" "}
            <span className="font-medium text-foreground">relational (macro)</span> measures of
            identity and cohesion for the consortium as a whole.
          </p>
          <p>Instrumentation and dashboards land here as each metric comes online.</p>
        </CardContent>
      </Card>
    </div>
  );
}
