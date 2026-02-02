import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, RefreshCw, Circle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface RoadmapIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  labels: Array<{ name: string; color: string }>;
  assignee?: { login: string; avatar_url: string } | null;
}

interface RoadmapMilestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: string;
  dueOn: string | null;
  url: string;
  openIssues: number;
  closedIssues: number;
  progress: number;
  issues: RoadmapIssue[];
}

// Define Kanban stages with colors matching the reference
const STAGES = [
  { id: "backlog", label: "Backlog", description: "This item hasn't been started", color: "text-muted-foreground" },
  { id: "ready", label: "Ready", description: "This is ready to be picked up", color: "text-yellow-500" },
  { id: "in-progress", label: "In progress", description: "This is actively being worked on", color: "text-blue-500" },
  { id: "in-review", label: "In review", description: "This item is in review", color: "text-purple-500" },
  { id: "done", label: "Done", description: "This has been completed", color: "text-green-500" },
] as const;

type StageId = typeof STAGES[number]["id"];

async function fetchRoadmap(): Promise<RoadmapMilestone[]> {
  const { data, error } = await supabase.functions.invoke('github-roadmap');
  
  if (error) {
    throw new Error(error.message || 'Failed to fetch roadmap');
  }
  
  return data.roadmap;
}

// Determine stage from issue labels or state
function getIssueStage(issue: RoadmapIssue): StageId {
  const labelNames = issue.labels.map(l => l.name.toLowerCase());
  
  if (issue.state === "closed") return "done";
  if (labelNames.some(l => l.includes("in review") || l.includes("review"))) return "in-review";
  if (labelNames.some(l => l.includes("in progress") || l.includes("wip") || l.includes("doing"))) return "in-progress";
  if (labelNames.some(l => l.includes("ready") || l.includes("todo"))) return "ready";
  return "backlog";
}

// Group all issues by stage
function groupIssuesByStage(milestones: RoadmapMilestone[]): Record<StageId, (RoadmapIssue & { repo: string })[]> {
  const grouped: Record<StageId, (RoadmapIssue & { repo: string })[]> = {
    backlog: [],
    ready: [],
    "in-progress": [],
    "in-review": [],
    done: [],
  };

  for (const milestone of milestones) {
    for (const issue of milestone.issues) {
      const stage = getIssueStage(issue);
      grouped[stage].push({ ...issue, repo: "brain-bbq-clone" });
    }
  }

  return grouped;
}

// Issue card component
function IssueCard({ issue }: { issue: RoadmapIssue & { repo: string } }) {
  // Extract a short prefix from the title if it has one (e.g., "SS-1:", "NN-2:")
  const prefixMatch = issue.title.match(/^([A-Z]{1,3}-\d+):\s*/);
  const prefix = prefixMatch ? prefixMatch[1] : null;
  const title = prefixMatch ? issue.title.slice(prefixMatch[0].length) : issue.title;

  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors group"
    >
      {/* Repo label */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Circle className="w-3 h-3 text-green-500 fill-green-500/20" />
        <span>{issue.repo} #{issue.number}</span>
      </div>
      
      {/* Title */}
      <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
        {prefix && <span className="text-muted-foreground">{prefix}: </span>}
        {title}
      </p>

      {/* Footer with labels and assignee */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-wrap gap-1 flex-1">
          {issue.labels.slice(0, 2).map((label) => (
            <span
              key={label.name}
              className="text-[10px] px-1.5 py-0.5 rounded-full truncate max-w-[80px]"
              style={{
                backgroundColor: `#${label.color}20`,
                color: `#${label.color}`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
        {issue.assignee && (
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px] bg-muted">
              {issue.assignee.login.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </a>
  );
}

// Stage column component
function StageColumn({ 
  stage, 
  issues, 
  totalCount 
}: { 
  stage: typeof STAGES[number]; 
  issues: (RoadmapIssue & { repo: string })[]; 
  totalCount: number;
}) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Circle className={cn("w-3 h-3", stage.color)} />
          <span className="font-semibold text-sm">{stage.label}</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {issues.length} / {totalCount}
          </span>
          <span className="text-xs text-muted-foreground">Estimate: 0</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3 px-1">{stage.description}</p>

      {/* Issues list */}
      <div className="flex flex-col gap-2 flex-1">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
        
        {issues.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
            No items
          </div>
        )}
      </div>

      {/* Add item button */}
      <Button variant="ghost" className="mt-3 justify-start text-muted-foreground" size="sm">
        <span className="mr-2">+</span> Add item
      </Button>
    </div>
  );
}

export default function Roadmap() {
  const { data: milestones, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['roadmap'],
    queryFn: fetchRoadmap,
    staleTime: 5 * 60 * 1000,
  });

  const groupedIssues = milestones ? groupIssuesByStage(milestones) : null;
  const totalIssues = milestones?.reduce((acc, m) => acc + m.issues.length, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Development Roadmap</h1>
            <p className="text-sm text-muted-foreground">
              Track progress across all development stages. Synced live from GitHub.
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
                View on GitHub
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
                  totalCount={totalIssues}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Empty state */}
        {milestones && milestones.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Circle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No issues yet</h2>
            <p className="text-muted-foreground">
              Check back soon for updates on our development roadmap.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
