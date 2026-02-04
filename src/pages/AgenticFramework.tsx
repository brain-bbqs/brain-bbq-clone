import { Bot, Wrench, RefreshCw, Brain, Sparkles, GitBranch, ArrowRight, Zap, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import AgenticFrameworkFlow from "@/components/diagrams/AgenticFrameworkFlow";

export default function AgenticFramework() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            Development
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Agentic Framework</h1>
        <p className="text-muted-foreground">
          How we leverage AI-powered development tools to build self-healing, continuously improving software
        </p>
      </div>

      {/* Interactive Diagram */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Agentic Development Pipeline
        </h2>
        <AgenticFrameworkFlow />
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Interactive diagram — drag to pan, scroll to zoom
        </p>
      </section>

      {/* Overview */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Overview
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              The BBQS platform is built using an agentic development paradigm—AI-assisted tooling 
              that accelerates development, automates bug detection, and enables self-healing software patterns. 
              This approach combines multiple AI systems working in concert to maintain and improve the codebase.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg p-4">
              <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">Lovable AI</span>
              <ArrowRight className="h-4 w-4" />
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">GitHub Copilot</span>
              <ArrowRight className="h-4 w-4" />
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Self-Healing Loop</span>
              <ArrowRight className="h-4 w-4" />
              <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full">NeuroMCP</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Lovable AI Development */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Lovable AI — Full-Stack Generation
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              Lovable serves as our primary development environment, enabling rapid prototyping and 
              full-stack implementation through natural language prompts.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-secondary/30 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">Frontend Generation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• React components from descriptions</li>
                  <li>• Tailwind styling with design systems</li>
                  <li>• Responsive layouts and animations</li>
                  <li>• AG Grid data tables</li>
                </ul>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">Backend Generation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Supabase Edge Functions (Deno)</li>
                  <li>• Database schemas and migrations</li>
                  <li>• RLS policies for security</li>
                  <li>• API integrations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* GitHub Copilot */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          GitHub Copilot — Bug Fixes & Refinement
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              For fine-grained code editing and bug fixes, GitHub Copilot provides inline suggestions 
              and code completions directly in the development workflow.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">Bug Detection & Fixes</h3>
                  <p className="text-sm text-muted-foreground">
                    Copilot analyzes error patterns and suggests targeted fixes for runtime errors, 
                    type mismatches, and edge cases.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">Code Refactoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Suggests improvements for code quality, performance optimizations, 
                    and adherence to best practices.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Self-Healing Software */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Self-Healing Software Architecture
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Our development workflow incorporates self-healing patterns where AI agents can 
              detect, diagnose, and propose fixes for issues automatically.
            </p>
            <div className="bg-secondary/30 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-foreground mb-3">The Self-Healing Loop</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">1</span>
                  <span><strong className="text-foreground">Monitor</strong> — Console logs, network requests, and user interactions are captured</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">2</span>
                  <span><strong className="text-foreground">Detect</strong> — AI analyzes patterns to identify errors, regressions, or anomalies</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">3</span>
                  <span><strong className="text-foreground">Diagnose</strong> — Root cause analysis through code inspection and stack traces</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">4</span>
                  <span><strong className="text-foreground">Fix</strong> — Automated code changes proposed and applied with human approval</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium">5</span>
                  <span><strong className="text-foreground">Verify</strong> — Changes tested in preview before deployment</span>
                </li>
              </ol>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-3 bg-secondary/20 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">~70%</div>
                <div className="text-xs text-muted-foreground">Faster bug resolution</div>
              </div>
              <div className="text-center p-3 bg-secondary/20 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">Real-time</div>
                <div className="text-xs text-muted-foreground">Error detection</div>
              </div>
              <div className="text-center p-3 bg-secondary/20 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">Human-in-loop</div>
                <div className="text-xs text-muted-foreground">Approval workflow</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* NeuroMCP Agent */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          NeuroMCP — Domain-Specific AI Agent
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              NeuroMCP is our specialized AI research assistant, designed to understand and reason about 
              neuroscience concepts, tools, and literature. It connects to the BrainKB knowledge graph 
              to provide contextually aware responses.
            </p>
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Database className="h-5 w-5 text-purple-400" />
                <h3 className="font-medium text-foreground">BrainKB Knowledge Graph Integration</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                NeuroMCP queries the BrainKB knowledge graph—a comprehensive database of neuroscience 
                entities, relationships, and concepts extracted from the BBQS publication corpus.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong className="text-foreground">Entity Recognition</strong> — Brain regions, cell types, techniques, behaviors</li>
                <li>• <strong className="text-foreground">Semantic Search</strong> — Vector embeddings for concept similarity</li>
                <li>• <strong className="text-foreground">Literature Grounding</strong> — Responses cite source publications</li>
                <li>• <strong className="text-foreground">Tool Recommendations</strong> — Suggests relevant BBQS tools based on research needs</li>
              </ul>
            </div>
            <div className="flex justify-center pt-2">
              <Link 
                to="/neuromcp" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <Bot className="h-4 w-4" />
                Try NeuroMCP
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Future Roadmap */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Future Directions
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shrink-0">
                  Planned
                </Badge>
                <span>Automated test generation from user flows</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shrink-0">
                  Planned
                </Badge>
                <span>NeuroMCP tool training on all BBQS resources</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shrink-0">
                  Planned
                </Badge>
                <span>Multi-agent collaboration for complex research queries</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shrink-0">
                  Planned
                </Badge>
                <span>Continuous learning from user interactions</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
