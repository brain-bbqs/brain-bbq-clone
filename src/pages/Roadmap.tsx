import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, RefreshCw, Circle, CheckCircle2, GitPullRequest } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoadmapIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  labels: Array<{ name: string; color: string }>;
  createdAt: string;
  updatedAt: string;
}

async function fetchRoadmap(): Promise<RoadmapIssue[]> {
  const { data, error } = await supabase.functions.invoke('github-roadmap');
  
  if (error) {
    throw new Error(error.message || 'Failed to fetch roadmap');
  }
  
  return data.issues || [];
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Group issues by date (month/year)
function groupByMonth(issues: RoadmapIssue[]): Map<string, RoadmapIssue[]> {
  const groups = new Map<string, RoadmapIssue[]>();
  
  for (const issue of issues) {
    const date = new Date(issue.updatedAt);
    const key = `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(issue);
  }
  
  return groups;
}

function IssueItem({ issue }: { issue: RoadmapIssue }) {
  const labels = issue.labels || [];
  const isClosed = issue.state === "closed";
  
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 py-4 px-4 -mx-4 rounded-lg hover:bg-muted/50 transition-colors"
    >
      {/* Status icon */}
      <div className={cn(
        "mt-0.5 flex-shrink-0",
        isClosed ? "text-purple-500" : "text-green-500"
      )}>
        {isClosed ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className={cn(
            "font-medium leading-snug",
            isClosed && "text-muted-foreground"
          )}>
            {issue.title}
          </p>
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
        </div>
        
        {/* Meta info */}
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          <span>#{issue.number}</span>
          <span>·</span>
          <span>{formatRelativeDate(issue.updatedAt)}</span>
          
          {labels.length > 0 && (
            <>
              <span>·</span>
              <div className="flex gap-1.5 flex-wrap">
                {labels.slice(0, 3).map((label) => (
                  <Badge 
                    key={label.name} 
                    variant="outline" 
                    className="text-xs py-0 h-5"
                    style={{
                      borderColor: `#${label.color}`,
                      color: `#${label.color}`,
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

export default function Roadmap() {
  const { data: issues, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['roadmap'],
    queryFn: fetchRoadmap,
    staleTime: 5 * 60 * 1000,
  });

  // Sort by updated date and group by month
  const sortedIssues = issues?.slice().sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const groupedIssues = sortedIssues ? groupByMonth(sortedIssues) : null;

  const openCount = issues?.filter(i => i.state === "open").length || 0;
  const closedCount = issues?.filter(i => i.state === "closed").length || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
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
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <a
                href="https://github.com/brain-bbqs/brain-bbq-clone/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <GitPullRequest className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              </a>
            </div>
          </div>
          <p className="text-muted-foreground">
            Recent activity from our GitHub repository
          </p>
          
          {/* Stats */}
          {issues && (
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Circle className="w-4 h-4 text-green-500" />
                <span>{openCount} Open</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>{closedCount} Closed</span>
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-32" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-5 h-5 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </div>
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

        {/* Timeline */}
        {groupedIssues && (
          <div className="space-y-8">
            {Array.from(groupedIssues.entries()).map(([month, monthIssues]) => (
              <div key={month}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 sticky top-0 bg-background py-2">
                  {month}
                </h2>
                <div className="divide-y divide-border">
                  {monthIssues.map((issue) => (
                    <IssueItem key={issue.id} issue={issue} />
                  ))}
                </div>
              </div>
            ))}
          </div>
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
