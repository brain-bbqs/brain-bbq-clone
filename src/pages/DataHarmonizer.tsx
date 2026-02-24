import { Database } from "lucide-react";

const DataHarmonizer = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <Database className="h-8 w-8 text-primary" />
      <h1 className="text-3xl font-bold text-foreground">Data Harmonizer</h1>
    </div>
    <p className="text-muted-foreground text-lg max-w-2xl">
      Standardize and harmonize neuroscience datasets across formats, schemas, and species.
    </p>
    <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
      <p className="text-muted-foreground">🚧 This page is under construction. Check back soon!</p>
    </div>
  </div>
);

export default DataHarmonizer;
