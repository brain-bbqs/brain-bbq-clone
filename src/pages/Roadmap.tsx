import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink, Calendar, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

function formatDate(dateString: string | null) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export default function Roadmap() {
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const { data: milestones, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['roadmap'],
    queryFn: fetchRoadmap,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select first milestone if none selected
  const activeMilestone = milestones?.find(m => m.id === selectedMilestone) 
    || (milestones && milestones.length > 0 ? milestones[0] : null);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
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
          <div className="space-y-8 animate-pulse">
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
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

        {/* Roadmap content */}
        {milestones && milestones.length > 0 && (
          <div className="space-y-8">
            {/* Horizontal Timeline */}
            <div className="relative">
              {/* Timeline bar */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full" />
              <div 
                className="absolute top-5 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                style={{ 
                  width: `${(milestones.filter(m => m.state === 'closed').length / milestones.length) * 100}%` 
                }}
              />
              
              {/* Milestone nodes */}
              <div className="relative flex justify-between">
                {milestones.map((milestone) => {
                  const isSelected = activeMilestone?.id === milestone.id;
                  const isComplete = milestone.state === 'closed';
                  
                  return (
                    <button
                      key={milestone.id}
                      onClick={() => setSelectedMilestone(milestone.id)}
                      className="flex flex-col items-center group"
                    >
                      {/* Node */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 ${
                        isComplete 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : isSelected
                            ? 'bg-background border-primary text-primary'
                            : 'bg-background border-muted-foreground/30 text-muted-foreground'
                      } ${isSelected ? 'ring-4 ring-primary/20' : ''}`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </div>
                      
                      {/* Label */}
                      <div className={`mt-3 text-center transition-colors ${
                        isSelected ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        <p className="text-sm font-medium max-w-[120px] truncate">
                          {milestone.title}
                        </p>
                        {milestone.dueOn && (
                          <p className="text-xs mt-0.5">{formatDate(milestone.dueOn)}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Milestone Details */}
            {activeMilestone && (
              <div className="mt-12 animate-fade-in">
                {/* Milestone header card */}
                <div className="rounded-lg border bg-card p-6 mb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-semibold">{activeMilestone.title}</h2>
                        <Badge variant={activeMilestone.state === 'closed' ? "secondary" : "default"}>
                          {activeMilestone.progress}% complete
                        </Badge>
                      </div>
                      {activeMilestone.description && (
                        <p className="text-muted-foreground mb-4">{activeMilestone.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {activeMilestone.dueOn && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            Due {formatDate(activeMilestone.dueOn)}
                          </span>
                        )}
                        <span>
                          {activeMilestone.closedIssues} of {activeMilestone.openIssues + activeMilestone.closedIssues} tasks completed
                        </span>
                      </div>
                    </div>
                    <a
                      href={activeMilestone.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm flex-shrink-0"
                    >
                      View on GitHub
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${activeMilestone.progress}%` }}
                    />
                  </div>
                </div>

                {/* Issues table */}
                {activeMilestone.issues.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Status</TableHead>
                          <TableHead>Task</TableHead>
                          <TableHead className="w-48">Labels</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeMilestone.issues.map((issue) => (
                          <TableRow key={issue.id}>
                            <TableCell>
                              {issue.state === 'closed' ? (
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={issue.state === 'closed' ? 'text-muted-foreground line-through' : ''}>
                                {issue.title}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {issue.labels.map((label) => (
                                  <span
                                    key={label.name}
                                    className="text-xs px-2 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: `#${label.color}20`,
                                      color: `#${label.color}`,
                                    }}
                                  >
                                    {label.name}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <a
                                href={issue.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No tasks in this milestone yet.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
