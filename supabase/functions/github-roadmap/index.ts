import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GITHUB_OWNER = 'brain-bbqs';
const GITHUB_REPO = 'brain-bbq-clone';

interface GitHubMilestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: string;
  due_on: string | null;
  html_url: string;
  open_issues: number;
  closed_issues: number;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  labels: Array<{ name: string; color: string }>;
  milestone: { number: number } | null;
  created_at: string;
  updated_at: string;
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

interface RoadmapIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  labels: Array<{ name: string; color: string }>;
}

async function fetchFromGitHub(endpoint: string, token?: string): Promise<any> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'BrainBBQS-Roadmap',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`https://api.github.com${endpoint}`, { headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`GitHub API error: ${response.status} - ${errorText}`);
    throw new Error(`GitHub API error: ${response.status}`);
  }
  
  return response.json();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    
    console.log('Fetching milestones from GitHub...');
    
    // Fetch all milestones (both open and closed)
    const [openMilestones, closedMilestones] = await Promise.all([
      fetchFromGitHub(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/milestones?state=open&per_page=100`, githubToken),
      fetchFromGitHub(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/milestones?state=closed&per_page=100`, githubToken),
    ]);
    
    const allMilestones: GitHubMilestone[] = [...openMilestones, ...closedMilestones];
    console.log(`Found ${allMilestones.length} milestones`);
    
    // Fetch all issues (both open and closed)
    const [openIssues, closedIssues] = await Promise.all([
      fetchFromGitHub(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&per_page=100`, githubToken),
      fetchFromGitHub(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=closed&per_page=100`, githubToken),
    ]);
    
    const allIssues: GitHubIssue[] = [...openIssues, ...closedIssues];
    console.log(`Found ${allIssues.length} issues`);
    
    // Group issues by milestone
    const issuesByMilestone = new Map<number, RoadmapIssue[]>();
    
    for (const issue of allIssues) {
      if (issue.milestone) {
        const milestoneNumber = issue.milestone.number;
        if (!issuesByMilestone.has(milestoneNumber)) {
          issuesByMilestone.set(milestoneNumber, []);
        }
        issuesByMilestone.get(milestoneNumber)!.push({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          state: issue.state,
          url: issue.html_url,
          labels: issue.labels.map(l => ({ name: l.name, color: l.color })),
        });
      }
    }
    
    // Build roadmap data
    const roadmap: RoadmapMilestone[] = allMilestones.map(milestone => {
      const total = milestone.open_issues + milestone.closed_issues;
      const progress = total > 0 ? Math.round((milestone.closed_issues / total) * 100) : 0;
      
      return {
        id: milestone.id,
        number: milestone.number,
        title: milestone.title,
        description: milestone.description,
        state: milestone.state,
        dueOn: milestone.due_on,
        url: milestone.html_url,
        openIssues: milestone.open_issues,
        closedIssues: milestone.closed_issues,
        progress,
        issues: issuesByMilestone.get(milestone.number) || [],
      };
    });
    
    // Sort: open milestones first (by due date), then closed
    roadmap.sort((a, b) => {
      if (a.state !== b.state) {
        return a.state === 'open' ? -1 : 1;
      }
      if (a.dueOn && b.dueOn) {
        return new Date(a.dueOn).getTime() - new Date(b.dueOn).getTime();
      }
      if (a.dueOn) return -1;
      if (b.dueOn) return 1;
      return a.title.localeCompare(b.title);
    });
    
    console.log('Roadmap data built successfully');
    
    return new Response(JSON.stringify({ roadmap }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch roadmap data';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
