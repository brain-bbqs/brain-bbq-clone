import { Brain } from "lucide-react";

export default function MLModels() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">ML Models</h1>
          <p className="text-muted-foreground mb-6">
            Machine learning models developed and used across BBQS projects for behavioral analysis.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Brain className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">Coming Soon</p>
          <p className="text-sm mt-1">Pre-trained and fine-tuned models for behavioral quantification will be listed here.</p>
        </div>
      </div>
    </div>
  );
}
