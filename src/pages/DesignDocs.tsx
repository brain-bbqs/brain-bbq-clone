import { Database, Server, Globe, Brain, FileText, Layers, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SoftwareArchitectureFlow from "@/components/diagrams/SoftwareArchitectureFlow";

export default function DesignDocs() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Software Architecture</h1>
        <p className="text-muted-foreground">
          High-level overview of the BBQS platform architecture and integrations
        </p>
      </div>

      {/* Interactive Architecture Diagram */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          System Architecture
        </h2>
        <SoftwareArchitectureFlow />
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Interactive diagram — drag to pan, scroll to zoom
        </p>
      </section>

      {/* Architecture Overview */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Architecture Overview
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              BBQS is a single-page application (SPA) built with modern web technologies. 
              The frontend communicates with a Supabase backend for data storage, authentication, 
              and serverless functions that integrate with external APIs.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg p-4">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full">React Frontend</span>
              <ArrowRight className="h-4 w-4" />
              <span className="bg-accent/20 text-accent px-3 py-1 rounded-full">Supabase Edge Functions</span>
              <ArrowRight className="h-4 w-4" />
              <span className="bg-secondary text-foreground px-3 py-1 rounded-full">External APIs</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Frontend Stack */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Frontend Stack
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">React + TypeScript</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The UI is built with React 18 and TypeScript for type safety. 
                We use React Router for client-side navigation.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tailwind CSS + shadcn/ui</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Styling uses Tailwind CSS with a custom dark theme. 
                UI components are from shadcn/ui (built on Radix primitives).
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vite</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build tooling powered by Vite for fast development 
                and optimized production builds.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">TanStack Query</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Server state management with automatic caching, 
                refetching, and synchronization.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Backend - Supabase */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Backend — Supabase
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="font-medium text-foreground mb-1">PostgreSQL Database</h3>
              <p className="text-sm text-muted-foreground">
                All persistent data is stored in a hosted PostgreSQL instance. 
                Key tables include <code className="bg-secondary px-1 rounded">ner_extractions</code> (paper metadata) 
                and <code className="bg-secondary px-1 rounded">ner_entities</code> (extracted neuroscience entities).
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">Edge Functions (Deno)</h3>
              <p className="text-sm text-muted-foreground">
                Serverless functions written in TypeScript/Deno handle API proxying, 
                data processing, and integrations with external services.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">Row Level Security (RLS)</h3>
              <p className="text-sm text-muted-foreground">
                Database access is controlled via RLS policies, ensuring users 
                can only access data they're authorized to view or modify.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Supabase Auth handles user signup, login, and session management 
                with JWT tokens.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* External Integrations */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          External Integrations
        </h2>
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                NIH Reporter API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                We query the NIH Reporter API to fetch grant information including 
                principal investigators, award amounts, project abstracts, and associated publications.
              </p>
              <code className="text-xs bg-secondary px-2 py-1 rounded block overflow-x-auto">
                POST https://api.reporter.nih.gov/v2/projects/search
              </code>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                iCite API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Publication metadata (titles, authors, journals, citation metrics) 
                is retrieved from the iCite API using PMIDs from NIH Reporter.
              </p>
              <code className="text-xs bg-secondary px-2 py-1 rounded block overflow-x-auto">
                GET https://icite.od.nih.gov/api/pubs?pmids=...
              </code>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-accent" />
                GitHub API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The Roadmap page fetches project milestones and issues from GitHub 
                to display development progress. Issue reporting also integrates with GitHub.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Flow */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Data Flow Example: Grant Extraction
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">1</span>
                <span>User enters a grant number on the Projects page</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">2</span>
                <span>Frontend calls the <code className="bg-secondary px-1 rounded">nih-grants</code> Edge Function</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">3</span>
                <span>Edge Function queries NIH Reporter API for grant details and PMIDs</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">4</span>
                <span>PMIDs are sent to iCite API to fetch full publication metadata</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">5</span>
                <span>Combined data is returned to the frontend and displayed in AG Grid</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* Key Edge Functions */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Edge Functions Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-foreground font-medium">Function</th>
                <th className="text-left py-2 text-foreground font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2"><code className="bg-secondary px-1 rounded">nih-grants</code></td>
                <td className="py-2">Fetches grant data from NIH Reporter + iCite</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2"><code className="bg-secondary px-1 rounded">ner-extract</code></td>
                <td className="py-2">Runs NER extraction on paper abstracts</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2"><code className="bg-secondary px-1 rounded">github-roadmap</code></td>
                <td className="py-2">Fetches GitHub milestones and issues</td>
              </tr>
              <tr>
                <td className="py-2"><code className="bg-secondary px-1 rounded">create-github-issue</code></td>
                <td className="py-2">Creates issues from the Report Issue dialog</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
