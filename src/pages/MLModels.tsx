import { useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SyncVisualization } from "@/components/SyncVisualization";

interface MLModel {
  name: string;
  architecture: string;
  species: string;
  strain: string;
  task: string;
  behaviour: string;
  pi: string;
  status: "trained" | "pending" | "not-started";
  dois: { id: string; url: string }[];
  hfUrl?: string;
}

interface SyncPair {
  id: string;
  label: string;
  speciesA: string;
  speciesB: string;
  description: string;
  sharedBehaviors: string[];
  sharedTools: string[];
  projectsA: { pi: string; title: string }[];
  projectsB: { pi: string; title: string }[];
  models: MLModel[];
}

const syncPairs: SyncPair[] = [
  {
    id: "mouse-gerbil",
    label: "Mouse ↔ Gerbil",
    speciesA: "Mouse (Mus musculus)",
    speciesB: "Mongolian Gerbil (Meriones unguiculatus)",
    description: "Cross-species vocalization analysis leveraging shared USV detection architectures. Both species produce ultrasonic vocalizations during social interactions, enabling transfer learning and comparative behavioral studies.",
    sharedBehaviors: ["Ultrasonic Vocalizations", "Social Interaction", "Courtship", "Maternal Communication"],
    sharedTools: ["DeepSqueak", "A-SOID", "UMAP", "Pose Estimation"],
    projectsA: [
      { pi: "Pulkit Grover / Eric Yttri", title: "Multimodal Behavioral Segmentation" },
      { pi: "Nancy Padilla Coreano", title: "Social Motif Generator" },
    ],
    projectsB: [
      { pi: "Dan Sanes", title: "Vocalization & Social Behavior" },
    ],
    models: [
      {
        name: "Male Female Interaction",
        architecture: "DeepSqueak",
        species: "Mouse (Mus musculus)",
        strain: "ProSAP1/Shank2",
        task: "USV Detection",
        behaviour: "Oestrus interaction (Male–oestrus female, 10 min + 3 min)",
        pi: "Elodie Ey",
        status: "pending",
        hfUrl: "https://sensein-mouse-prosap1-shank2-male-female-oestrus-4021ab0.hf.space",
        dois: [
          { id: "10.5281/zenodo.5772630", url: "https://doi.org/10.5281/zenodo.5772630" },
          { id: "10.5281/zenodo.5772722", url: "https://doi.org/10.5281/zenodo.5772722" },
          { id: "10.5281/zenodo.5772748", url: "https://doi.org/10.5281/zenodo.5772748" },
          { id: "10.5281/zenodo.5776247", url: "https://doi.org/10.5281/zenodo.5776247" },
          { id: "10.5281/zenodo.5776276", url: "https://doi.org/10.5281/zenodo.5776276" },
          { id: "10.5281/zenodo.5776298", url: "https://doi.org/10.5281/zenodo.5776298" },
        ],
      },
      {
        name: "Family Vocal Usage",
        architecture: "DeepSqueak",
        species: "Mongolian Gerbil (Meriones unguiculatus)",
        strain: "Wild-type",
        task: "USV Detection",
        behaviour: "Family vocal usage discovery (unsupervised)",
        pi: "Dan Sanes",
        status: "not-started",
        dois: [
          { id: "10.5061/dryad.m905qfv68", url: "https://doi.org/10.5061/dryad.m905qfv68" },
        ],
      },
    ],
  },
];

const statusConfig = {
  trained: { label: "Trained", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "not-started": { label: "Not Started", className: "bg-muted text-muted-foreground border-border" },
};

function ModelTable({ models, search }: { models: MLModel[]; search: string }) {
  const filtered = models.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.architecture.toLowerCase().includes(q) ||
      m.species.toLowerCase().includes(q) ||
      m.task.toLowerCase().includes(q) ||
      m.behaviour.toLowerCase().includes(q) ||
      m.pi.toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Model Name</TableHead>
            <TableHead>Architecture</TableHead>
            <TableHead>Species / Strain</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Behaviour</TableHead>
            <TableHead>PI</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>AI Model</TableHead>
            <TableHead>Data Sources</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((model, idx) => {
            const status = statusConfig[model.status];
            return (
              <TableRow key={idx}>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell>{model.architecture}</TableCell>
                <TableCell>
                  <div>{model.species}</div>
                  <div className="text-xs text-muted-foreground">{model.strain}</div>
                </TableCell>
                <TableCell>{model.task}</TableCell>
                <TableCell className="max-w-[200px]">{model.behaviour}</TableCell>
                <TableCell>{model.pi}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={status.className}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  {model.hfUrl ? (
                    <a href={model.hfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Try Model
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {model.dois.map((doi) => (
                      <a key={doi.id} href={doi.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> {doi.id.replace("10.5281/zenodo.", "zenodo.")}
                      </a>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

const MLModels = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 border-b-2 border-border pb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Cross-Species Synchronization</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Shared ML models and behavioral pipelines across species, organized by cross-species synchronization pairs.
        </p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search models..." className="pl-9" />
      </div>

      <Tabs defaultValue={syncPairs[0].id} className="space-y-6">
        <TabsList>
          {syncPairs.map((pair) => (
            <TabsTrigger key={pair.id} value={pair.id}>{pair.label}</TabsTrigger>
          ))}
        </TabsList>

        {syncPairs.map((pair) => (
          <TabsContent key={pair.id} value={pair.id} className="space-y-6">
            {/* Sync Visualization */}
            <SyncVisualization
              speciesA={pair.speciesA}
              speciesB={pair.speciesB}
              sharedBehaviors={pair.sharedBehaviors}
              sharedTools={pair.sharedTools}
            />

            {/* Details card */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-3 bg-muted/40 border-b border-border">
                <h2 className="text-sm font-bold text-foreground">Synchronization Details</h2>
              </div>
              <div className="px-5 py-4 bg-card space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">{pair.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Shared Behaviors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pair.sharedBehaviors.map((b) => (
                        <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Shared Tools</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pair.sharedTools.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{pair.speciesA.split(" (")[0]} Projects</p>
                    {pair.projectsA.map((p, i) => (
                      <div key={i} className="text-sm flex items-start gap-1.5">
                        <ArrowRight className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                        <span>
                          <span className="font-medium text-foreground">{p.title}</span>
                          <span className="text-muted-foreground"> — {p.pi}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{pair.speciesB.split(" (")[0]} Projects</p>
                    {pair.projectsB.map((p, i) => (
                      <div key={i} className="text-sm flex items-start gap-1.5">
                        <ArrowRight className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                        <span>
                          <span className="font-medium text-foreground">{p.title}</span>
                          <span className="text-muted-foreground"> — {p.pi}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Models table */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Models</h3>
              <ModelTable models={pair.models} search={search} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MLModels;
