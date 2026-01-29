import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink, Calendar, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface RoadmapIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  labels: Array<{ name: string; color: string }>;
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

async function fetchRoadmap(): Promise<RoadmapMilestone[]> {
  const { data, error } = await supabase.functions.invoke('github-roadmap');
  
  if (error) {
    throw new Error(error.message || 'Failed to fetch roadmap');
  }
  
  return data.roadmap;
}

function TimelineMilestone({ milestone, isLast }: { milestone: RoadmapMilestone; isLast: boolean }) {
  const [expanded, setExpanded] = useState(milestone.state === 'open');
  const isComplete = milestone.state === 'closed';
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="relative flex gap-6 pb-12 last:pb-0">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border" />
      )}
      
      {/* Timeline node */}
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
          isComplete 
            ? 'bg-primary border-primary text-primary-foreground' 
            : 'bg-background border-muted-foreground/30 text-muted-foreground'
        }`}>
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left group"
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className={`text-xl font-semibold group-hover:text-primary transition-colors ${
                isComplete ? 'text-muted-foreground' : 'text-foreground'
              }`}>
                {milestone.title}
              </h3>
              {milestone.dueOn && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(milestone.dueOn)}</span>
                </div>
              )}
            </div>
            <Badge 
              variant={isComplete ? "secondary" : "default"}
              className="flex-shrink-0"
            >
              {milestone.progress}%
            </Badge>
          </div>
          
          {milestone.description && (
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {milestone.description}
            </p>
          )}
          
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${milestone.progress}%` }}
            />
          </div>
          
          <div className="text-xs text-muted-foreground">
            {milestone.closedIssues} of {milestone.openIssues + milestone.closedIssues} tasks completed
            {milestone.issues.length > 0 && (
              <span className="ml-2">• Click to {expanded ? 'collapse' : 'expand'}</span>
            )}
          </div>
        </button>
        
        {/* Issues list */}
        {expanded && milestone.issues.length > 0 && (
          <div className="mt-4 space-y-2 animate-fade-in">
            {milestone.issues.map((issue) => (
              <a
                key={issue.id}
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                {issue.state === 'closed' ? (
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${issue.state === 'closed' ? 'line-through text-muted-foreground' : ''}`}>
                    {issue.title}
                  </span>
                  {issue.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {issue.labels.map((label) => (
                        <span
                          key={label.name}
                          className="text-xs px-1.5 py-0.5 rounded-full"
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
                </div>
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground flex-shrink-0" />
              </a>
            ))}
            
            <a
              href={milestone.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            >
              View on GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Roadmap() {
  const { data: milestones, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['roadmap'],
    queryFn: fetchRoadmap,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Roadmap</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Follow our development journey. Synced live from GitHub.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-6 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-1.5 bg-muted rounded" />
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

          {/* Empty state */}
          {milestones && milestones.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Circle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No milestones yet</h2>
              <p className="text-muted-foreground">
                Check back soon for updates on our development roadmap.
              </p>
            </div>
          )}

          {/* Timeline */}
          {milestones && milestones.length > 0 && (
            <div className="relative">
              {milestones.map((milestone, index) => (
                <TimelineMilestone 
                  key={milestone.id} 
                  milestone={milestone}
                  isLast={index === milestones.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
