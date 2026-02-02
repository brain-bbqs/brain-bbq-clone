import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, RefreshCw, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface RoadmapIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  labels: Array<{ name: string; color: string }>;
}

// Define Kanban stages with colors
const STAGES = [
  { id: "backlog", label: "Backlog", description: "This item hasn't been started", color: "text-muted-foreground" },
  { id: "ready", label: "Ready", description: "Ready to be picked up", color: "text-yellow-500" },
  { id: "in-progress", label: "In progress", description: "Actively being worked on", color: "text-blue-500" },
  { id: "in-review", label: "In review", description: "This item is in review", color: "text-purple-500" },
  { id: "done", label: "Done", description: "This has been completed", color: "text-green-500" },
] as const;

type StageId = typeof STAGES[number]["id"];

async function fetchRoadmap(): Promise<RoadmapIssue[]> {
  const { data, error } = await supabase.functions.invoke('github-roadmap');
  
  if (error) {
    throw new Error(error.message || 'Failed to fetch roadmap');
  }
  
  return data.issues || [];
}

// Determine stage from issue labels or state
function getIssueStage(issue: RoadmapIssue): StageId {
  const labels = issue.labels || [];
  const labelNames = labels.map(l => l.name?.toLowerCase() || "");
  
  if (issue.state === "closed") return "done";
  if (labelNames.some(l => l.includes("in review") || l.includes("review"))) return "in-review";
  if (labelNames.some(l => l.includes("in progress") || l.includes("wip") || l.includes("doing"))) return "in-progress";
  if (labelNames.some(l => l.includes("ready") || l.includes("todo"))) return "ready";
  return "backlog";
}

// Group all issues by stage
function groupIssuesByStage(issues: RoadmapIssue[]): Record<StageId, RoadmapIssue[]> {
  const grouped: Record<StageId, RoadmapIssue[]> = {
    backlog: [],
    ready: [],
    "in-progress": [],
    "in-review": [],
    done: [],
  };

  for (const issue of issues) {
    const stage = getIssueStage(issue);
    grouped[stage].push(issue);
  }

  return grouped;
}

// Issue card component
function IssueCard({ issue }: { issue: RoadmapIssue }) {
  const labels = issue.labels || [];
  // Extract a short prefix from the title if it has one (e.g., "SS-1:", "NN-2:")
  const prefixMatch = issue.title.match(/^([A-Z]{1,3}-\d+):\s*/);
  const prefix = prefixMatch ? prefixMatch[1] : null;
  const title = prefixMatch ? issue.title.slice(prefixMatch[0].length) : issue.title;

  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors"
    >
      {/* Repo label */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Circle className="w-3 h-3 text-green-500 fill-green-500/20" />
        <span>brain-bbq-clone #{issue.number}</span>
      </div>
      
      {/* Title */}
      <p className="text-sm font-medium text-foreground mb-2 line-clamp-3">
        {prefix && <span className="text-muted-foreground">{prefix}: </span>}
        {title}
      </p>

      {/* Labels */}
      {/* Labels */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {labels.slice(0, 3).map((label) => (
            <span
              key={label.name}
              className="text-[10px] px-1.5 py-0.5 rounded-full truncate max-w-[100px]"
              style={{
                backgroundColor: `#${label.color}20`,
                color: `#${label.color}`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

// Stage column component
function StageColumn({ 
  stage, 
  issues 
}: { 
  stage: typeof STAGES[number]; 
  issues: RoadmapIssue[]; 
}) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <Circle className={cn("w-3 h-3", stage.color)} />
        <span className="font-semibold text-sm">{stage.label}</span>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {issues.length}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3 px-1">{stage.description}</p>

      {/* Issues list */}
      <div className="flex flex-col gap-2 flex-1">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
        
        {issues.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-xs border border-dashed rounded-lg">
            No items
          </div>
        )}
      </div>
    </div>
  );
}

export default function Roadmap() {
  const { data: issues, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['roadmap'],
    queryFn: fetchRoadmap,
    staleTime: 5 * 60 * 1000,
  });

  const groupedIssues = issues ? groupIssuesByStage(issues) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Development Roadmap</h1>
            <p className="text-sm text-muted-foreground">
              Track progress across all stages. Synced from GitHub.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <a
              href="https://github.com/orgs/brain-bbqs/projects/1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </a>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex gap-4 animate-pulse">
            {STAGES.map((stage) => (
              <div key={stage.id} className="min-w-[280px] space-y-3">
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-24 bg-muted rounded" />
                <div className="h-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">
              {error instanceof Error ? error.message : 'Failed to load roadmap'}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {/* Kanban Board */}
        {groupedIssues && (
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {STAGES.map((stage) => (
                <StageColumn 
                  key={stage.id} 
                  stage={stage} 
                  issues={groupedIssues[stage.id]} 
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Empty state */}
        {issues && issues.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Circle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No issues yet</h2>
            <p className="text-muted-foreground">
              Check back soon for updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
