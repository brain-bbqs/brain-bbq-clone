import { Container } from "lucide-react";

const NeuroDocker = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <Container className="h-8 w-8 text-primary" />
      <h1 className="text-3xl font-bold text-foreground">NeuroDocker</h1>
    </div>
    <p className="text-muted-foreground text-lg max-w-2xl">
      AI-powered Dockerfile generator for neuroscience repositories. Automatically detects dependencies and applies NeuroDocker CLI templates.
    </p>
    <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
      <p className="text-muted-foreground">🚧 This page is under construction. Check back soon!</p>
    </div>
  </div>
);

export default NeuroDocker;
