import { BarChart3 } from "lucide-react";

export default function Benchmarks() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Benchmarks</h1>
          <p className="text-muted-foreground mb-6">
            Standardized benchmarks for evaluating behavioral analysis tools and models.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">Coming Soon</p>
          <p className="text-sm mt-1">Benchmarks for cross-species behavioral analysis will be available here.</p>
        </div>
      </div>
    </div>
  );
}
