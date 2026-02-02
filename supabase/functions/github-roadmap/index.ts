import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
  created_at: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  labels: Array<{ name: string; color: string }>;
  milestone: { number: number; title: string } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

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

async function fetchAllIssues(token?: string): Promise<GitHubIssue[]> {
  const allIssues: GitHubIssue[] = [];
  
  // Fetch open and closed issues
  const [openIssues, closedIssues] = await Promise.all([
    fetchFromGitHub(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&per_page=100`, token),
    fetchFromGitHub(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=closed&per_page=100`, token),
  ]);
  
  // Filter out PRs
  allIssues.push(...openIssues.filter((i: any) => !i.pull_request));
  allIssues.push(...closedIssues.filter((i: any) => !i.pull_request));
  
  return allIssues;
}

async function fetchMilestones(token?: string): Promise<GitHubMilestone[]> {
  const [open, closed] = await Promise.all([
    fetchFromGitHub(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/milestones?state=open&per_page=100`, token),
    fetchFromGitHub(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/milestones?state=closed&per_page=100`, token),
  ]);
  
  return [...open, ...closed];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    
    console.log('Fetching milestones and issues from GitHub...');
    
    const [allMilestones, allIssues] = await Promise.all([
      fetchMilestones(githubToken),
      fetchAllIssues(githubToken),
    ]);
    
    console.log(`Found ${allMilestones.length} milestones, ${allIssues.length} issues`);
    
    // Transform milestones
    const milestones: RoadmapMilestone[] = allMilestones.map(m => {
      const total = m.open_issues + m.closed_issues;
      return {
        id: m.id,
        number: m.number,
        title: m.title,
        description: m.description,
        state: m.state,
        dueOn: m.due_on,
        createdAt: m.created_at,
        url: m.html_url,
        openIssues: m.open_issues,
        closedIssues: m.closed_issues,
        progress: total > 0 ? Math.round((m.closed_issues / total) * 100) : 0,
      };
    });
    
    // Sort milestones by due date or creation
    milestones.sort((a, b) => {
      if (a.dueOn && b.dueOn) return new Date(a.dueOn).getTime() - new Date(b.dueOn).getTime();
      if (a.dueOn) return -1;
      if (b.dueOn) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    // Transform issues
    const issues: RoadmapIssue[] = allIssues.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.html_url,
      labels: (issue.labels || []).map(l => ({ name: l.name, color: l.color })),
      milestoneNumber: issue.milestone?.number || null,
      milestoneTitle: issue.milestone?.title || null,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
    }));
    
    // Sort by number descending
    issues.sort((a, b) => b.number - a.number);
    
    console.log('Roadmap data built successfully');
    
    return new Response(JSON.stringify({ milestones, issues }), {
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
