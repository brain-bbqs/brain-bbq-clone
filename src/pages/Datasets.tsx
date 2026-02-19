import { Database } from "lucide-react";

export default function Datasets() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Datasets</h1>
          <p className="text-muted-foreground mb-6">
            Curated datasets from BBQS consortium projects for behavioral and neural analysis.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Database className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">Coming Soon</p>
          <p className="text-sm mt-1">Datasets will be catalogued here as projects publish their data.</p>
        </div>
      </div>
    </div>
  );
}
