import { Sigma } from "lucide-react";

export default function ComputationalModels() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Computational Models</h1>
          <p className="text-muted-foreground mb-6">
            Computational and theoretical models of neural and behavioral processes across species.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Sigma className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">Coming Soon</p>
          <p className="text-sm mt-1">Models spanning Marr's levels of analysis will be organized here.</p>
        </div>
      </div>
    </div>
  );
}
