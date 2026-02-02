import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, RefreshCw, Circle, CheckCircle2, Milestone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RoadmapMilestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: string;
  dueOn: string | null;
  createdAt: string;
  url: string;
  openIssues: number;
  closedIssues: number;
  progress: number;
}

interface RoadmapIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  labels: Array<{ name: string; color: string }>;
  milestoneNumber: number | null;
  milestoneTitle: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

interface RoadmapData {
  milestones: RoadmapMilestone[];
  issues: RoadmapIssue[];
}

// Major labels to filter for - add more as needed
const MAJOR_LABELS = ['epic', 'major', 'milestone', 'feature', 'enhancement'];

async function fetchRoadmap(): Promise<RoadmapData> {
  const { data, error } = await supabase.functions.invoke('github-roadmap');
  
  if (error) {
    throw new Error(error.message || 'Failed to fetch roadmap');
  }
  
  return {
    milestones: data.milestones || [],
    issues: data.issues || [],
  };
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatQuarter(dateString: string | null): string {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

// Category colors
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'SS': { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  'NN': { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  'SG': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  'default': { bg: 'bg-slate-500/20', text: 'text-slate-400' },
};

function getCategoryFromTitle(title: string): string {
  const match = title.match(/^([A-Z]{2})-\d+/);
  return match ? match[1] : 'default';
}

function getCategoryColors(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['default'];
}

// Issue row component
function IssueRow({ issue }: { issue: RoadmapIssue }) {
  const labels = issue.labels || [];
  const isClosed = issue.state === "closed";
  const category = getCategoryFromTitle(issue.title);
  const colors = getCategoryColors(category);
  
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 py-3 px-4 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-b-0"
    >
      {/* Status */}
      <div className={cn(
        "flex-shrink-0",
        isClosed ? "text-purple-500" : "text-green-500"
      )}>
        {isClosed ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </div>
      
      {/* Category badge */}
      {category !== 'default' && (
        <Badge variant="outline" className={cn("text-xs", colors.bg, colors.text, "border-0")}>
          {category}
        </Badge>
      )}
      
      {/* Title */}
      <span className={cn(
        "flex-1 text-sm truncate",
        isClosed && "text-muted-foreground line-through"
      )}>
        {issue.title}
      </span>
      
      {/* Labels */}
      <div className="hidden sm:flex gap-1.5">
        {labels.slice(0, 2).map((label) => (
          <Badge 
            key={label.name} 
            variant="outline" 
            className="text-xs py-0"
            style={{
              borderColor: `#${label.color}`,
              color: `#${label.color}`,
              backgroundColor: `#${label.color}15`,
            }}
          >
            {label.name}
          </Badge>
        ))}
      </div>
      
      {/* Issue number */}
      <span className="text-xs text-muted-foreground">#{issue.number}</span>
      
      {/* Link icon */}
      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

// Milestone card component
function MilestoneCard({ 
  milestone, 
  issues 
}: { 
  milestone: RoadmapMilestone; 
  issues: RoadmapIssue[];
}) {
  const isComplete = milestone.state === 'closed';
  
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Milestone className={cn(
                "w-4 h-4",
                isComplete ? "text-purple-500" : "text-primary"
              )} />
              <h3 className="font-semibold">{milestone.title}</h3>
              <Badge variant={isComplete ? "secondary" : "default"} className="text-xs">
                {milestone.progress}%
              </Badge>
            </div>
            {milestone.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {milestone.description}
              </p>
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground flex-shrink-0">
            {milestone.dueOn ? (
              <div>
                <div className="font-medium">{formatQuarter(milestone.dueOn)}</div>
                <div className="text-xs">{formatDate(milestone.dueOn)}</div>
              </div>
            ) : (
              <span>No due date</span>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <Progress value={milestone.progress} className="h-1.5" />
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{milestone.closedIssues} of {milestone.openIssues + milestone.closedIssues} tasks</span>
          <a 
            href={milestone.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary flex items-center gap-1"
          >
            View on GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
      
      {/* Issues */}
      {issues.length > 0 && (
        <div className="divide-y divide-border/50">
          {issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

// Issues without milestone
function UnassignedIssues({ issues }: { issues: RoadmapIssue[] }) {
  if (issues.length === 0) return null;
  
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold">Backlog</h3>
          <Badge variant="secondary" className="text-xs">{issues.length}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Issues not yet assigned to a milestone</p>
      </div>
      <div className="divide-y divide-border/50">
        {issues.map((issue) => (
          <IssueRow key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  );
}

export default function Roadmap() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['roadmap'],
    queryFn: fetchRoadmap,
    staleTime: 5 * 60 * 1000,
  });

  const milestones = data?.milestones || [];
  const issues = data?.issues || [];
  
  // Filter major issues (by label) - if no labels match, show all
  const hasMajorLabels = issues.some(i => 
    i.labels?.some(l => MAJOR_LABELS.includes(l.name.toLowerCase()))
  );
  
  const filteredIssues = hasMajorLabels
    ? issues.filter(i => i.labels?.some(l => MAJOR_LABELS.includes(l.name.toLowerCase())))
    : issues;
  
  // Group issues by milestone
  const issuesByMilestone = new Map<number | null, RoadmapIssue[]>();
  for (const issue of filteredIssues) {
    const key = issue.milestoneNumber;
    if (!issuesByMilestone.has(key)) {
      issuesByMilestone.set(key, []);
    }
    issuesByMilestone.get(key)!.push(issue);
  }
  
  const unassignedIssues = issuesByMilestone.get(null) || [];
  
  const openCount = issues.filter(i => i.state === "open").length;
  const closedCount = issues.filter(i => i.state === "closed").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Development Roadmap</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
                Refresh
              </Button>
              <a
                href="https://github.com/brain-bbqs/brain-bbq-clone/milestones"
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
          <p className="text-muted-foreground">
            Track our progress across major milestones
          </p>
          
          {/* Stats */}
          {data && (
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <Milestone className="w-4 h-4 text-primary" />
                <span>{milestones.length} Milestones</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-green-500" />
                <span>{openCount} Open</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>{closedCount} Closed</span>
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="h-6 bg-muted rounded w-1/3 mb-3" />
                <div className="h-2 bg-muted rounded w-full mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-10 bg-muted rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12 rounded-lg border">
            <p className="text-destructive mb-4">
              {error instanceof Error ? error.message : 'Failed to load roadmap'}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {/* Content */}
        {data && (
          <div className="space-y-6">
            {/* Milestones with their issues */}
            {milestones.map((milestone) => (
              <MilestoneCard 
                key={milestone.id} 
                milestone={milestone} 
                issues={issuesByMilestone.get(milestone.number) || []} 
              />
            ))}
            
            {/* Unassigned issues */}
            <UnassignedIssues issues={unassignedIssues} />
            
            {/* Empty state */}
            {milestones.length === 0 && unassignedIssues.length === 0 && (
              <div className="text-center py-12 rounded-lg border">
                <Milestone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No milestones yet</h2>
                <p className="text-muted-foreground">
                  Create milestones on GitHub to organize your roadmap
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
