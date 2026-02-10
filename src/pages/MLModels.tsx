import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

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

const models: MLModel[] = [
  {
    name: "Male Female Interaction",
    architecture: "DeepSqueak",
    species: "Mouse (Mus musculus)",
    strain: "ProSAP1/Shank2",
    task: "USV Detection",
    behaviour: "Oestrus interaction (Male–oestrus female, 10 min + 3 min)",
    pi: "Elodie Ey",
    status: "pending",
    dois: [
      { id: "10.5281/zenodo.5772630", url: "https://doi.org/10.5281/zenodo.5772630" },
      { id: "10.5281/zenodo.5772722", url: "https://doi.org/10.5281/zenodo.5772722" },
      { id: "10.5281/zenodo.5772748", url: "https://doi.org/10.5281/zenodo.5772748" },
      { id: "10.5281/zenodo.5776247", url: "https://doi.org/10.5281/zenodo.5776247" },
      { id: "10.5281/zenodo.5776276", url: "https://doi.org/10.5281/zenodo.5776276" },
      { id: "10.5281/zenodo.5776298", url: "https://doi.org/10.5281/zenodo.5776298" },
    ],
  },
];

const statusConfig = {
  trained: { label: "Trained", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "not-started": { label: "Not Started", className: "bg-muted text-muted-foreground border-border" },
};

const MLModels = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Machine Learning Models</h1>
        <p className="text-muted-foreground">
          A catalog of ML models used across BBQS projects.
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Model Name</TableHead>
              <TableHead>Architecture</TableHead>
              <TableHead>Species / Strain</TableHead>
              <TableHead>Behaviour</TableHead>
              <TableHead>PI</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Sources</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model, idx) => {
              const status = statusConfig[model.status];
              return (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>{model.architecture}</TableCell>
                  <TableCell>
                    <div>{model.species}</div>
                    <div className="text-xs text-muted-foreground">{model.strain}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">{model.behaviour}</TableCell>
                  <TableCell>{model.pi}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={status.className}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {model.dois.map((doi) => (
                        <a
                          key={doi.id}
                          href={doi.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {doi.id.replace("10.5281/zenodo.", "zenodo.")}
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
    </div>
  );
};

export default MLModels;
