import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ExternalLink, CheckCircle2, Circle, Calendar, Target } from "lucide-react";
import { useState } from "react";

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

function MilestoneCard({ milestone }: { milestone: RoadmapMilestone }) {
  const [isOpen, setIsOpen] = useState(milestone.state === 'open');
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className={`transition-all ${milestone.state === 'closed' ? 'opacity-75' : ''}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{milestone.title}</CardTitle>
                  <Badge variant={milestone.state === 'open' ? 'default' : 'secondary'}>
                    {milestone.state}
                  </Badge>
                </div>
                {milestone.description && (
                  <CardDescription className="text-sm">
                    {milestone.description}
                  </CardDescription>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {milestone.dueOn && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(milestone.dueOn)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {milestone.closedIssues}/{milestone.openIssues + milestone.closedIssues} issues
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-2xl font-bold">{milestone.progress}%</span>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
            <Progress value={milestone.progress} className="mt-3" />
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {milestone.issues.length > 0 ? (
              <div className="space-y-2">
                {milestone.issues.map((issue) => (
                  <a
                    key={issue.id}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    {issue.state === 'closed' ? (
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${issue.state === 'closed' ? 'line-through text-muted-foreground' : ''}`}>
                          {issue.title}
                        </span>
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                      </div>
                      {issue.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {issue.labels.map((label) => (
                            <Badge
                              key={label.name}
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: `#${label.color}`,
                                color: `#${label.color}`,
                              }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">#{issue.number}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No issues in this milestone
              </p>
            )}
            <div className="mt-4 pt-4 border-t">
              <a
                href={milestone.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View milestone on GitHub
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function Roadmap() {
  const { data: milestones, isLoading, error } = useQuery({
    queryKey: ['roadmap'],
    queryFn: fetchRoadmap,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Development Roadmap</h1>
            <p className="text-lg text-muted-foreground">
              Track our progress and upcoming features. This roadmap is automatically synced with our GitHub milestones.
            </p>
          </div>

          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-2 bg-muted rounded mt-4" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Failed to load roadmap</CardTitle>
                <CardDescription>
                  {error instanceof Error ? error.message : 'An error occurred while fetching the roadmap.'}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {milestones && milestones.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No milestones yet</CardTitle>
                <CardDescription>
                  Check back later for updates on our development roadmap.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {milestones && milestones.length > 0 && (
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
