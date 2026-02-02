import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, RefreshCw, Circle, CheckCircle2, Bug, Sparkles, ListTodo, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  milestones: unknown[];
  issues: RoadmapIssue[];
}

type IssueType = 'all' | 'bug' | 'feature' | 'task';

const TYPE_CONFIG: Record<Exclude<IssueType, 'all'>, { 
  label: string; 
  icon: typeof Bug;
  color: string;
  bgColor: string;
}> = {
  bug: { 
    label: 'Bugs', 
    icon: Bug, 
    color: 'text-red-500',
    bgColor: 'bg-red-500/10'
  },
  feature: { 
    label: 'Features', 
    icon: Sparkles, 
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10'
  },
  task: { 
    label: 'Tasks', 
    icon: ListTodo, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
};

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

function getIssueType(issue: RoadmapIssue): Exclude<IssueType, 'all'> {
  const labels = issue.labels || [];
  const labelNames = labels.map(l => l.name.toLowerCase());
  
  if (labelNames.includes('bug')) return 'bug';
  if (labelNames.includes('feature') || labelNames.includes('enhancement')) return 'feature';
  return 'task';
}

function IssueRow({ issue }: { issue: RoadmapIssue }) {
  const isClosed = issue.state === "closed";
  const labels = (issue.labels || []).filter(l => 
    !['bug', 'feature', 'enhancement', 'task'].includes(l.name.toLowerCase())
  );
  
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 py-2.5 px-3 hover:bg-muted/50 transition-colors rounded-md"
    >
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
      
      <span className={cn(
        "flex-1 text-sm",
        isClosed && "text-muted-foreground line-through"
      )}>
        {issue.title}
      </span>
      
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
      
      <span className="text-xs text-muted-foreground">#{issue.number}</span>
      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

function TypeSection({ 
  type, 
  issues,
  defaultOpen = true
}: { 
  type: Exclude<IssueType, 'all'>; 
  issues: RoadmapIssue[];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  
  const openCount = issues.filter(i => i.state === 'open').length;
  const closedCount = issues.filter(i => i.state === 'closed').length;
  
  if (issues.length === 0) return null;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className={cn(
          "w-full flex items-center justify-between p-4 rounded-lg border transition-colors",
          "hover:bg-muted/30",
          isOpen && "rounded-b-none border-b-0"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-md", config.bgColor)}>
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">{config.label}</h3>
              <p className="text-xs text-muted-foreground">
                {openCount} open · {closedCount} closed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{issues.length}</Badge>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-lg p-2 space-y-0.5">
          {issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Roadmap() {
  const [filter, setFilter] = useState<IssueType>('all');
  
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['roadmap'],
    queryFn: fetchRoadmap,
    staleTime: 5 * 60 * 1000,
  });

  const issues = data?.issues || [];
  
  // Group issues by type
  const groupedIssues = {
    bug: issues.filter(i => getIssueType(i) === 'bug'),
    feature: issues.filter(i => getIssueType(i) === 'feature'),
    task: issues.filter(i => getIssueType(i) === 'task'),
  };
  
  const openCount = issues.filter(i => i.state === "open").length;
  const closedCount = issues.filter(i => i.state === "closed").length;

  const typesToShow = filter === 'all' 
    ? (['feature', 'bug', 'task'] as const)
    : [filter] as const;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
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
                href="https://github.com/brain-bbqs/brain-bbq-clone/issues"
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
          
          {/* Stats and Filter */}
          {data && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Circle className="w-3 h-3 text-green-500" />
                  {openCount} Open
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-purple-500" />
                  {closedCount} Closed
                </span>
              </div>
              
              <Select value={filter} onValueChange={(v) => setFilter(v as IssueType)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="feature">Features</SelectItem>
                  <SelectItem value="bug">Bugs</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-md" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-24 mb-1" />
                    <div className="h-3 bg-muted rounded w-16" />
                  </div>
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
          <div className="space-y-4">
            {typesToShow.map((type) => (
              <TypeSection 
                key={type} 
                type={type} 
                issues={groupedIssues[type]}
                defaultOpen={filter !== 'all' || type === 'feature'}
              />
            ))}
            
            {issues.length === 0 && (
              <div className="text-center py-12 rounded-lg border">
                <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No issues yet</h2>
                <p className="text-muted-foreground">
                  Create issues on GitHub to populate the roadmap
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}