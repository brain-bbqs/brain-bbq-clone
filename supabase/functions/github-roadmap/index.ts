import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GITHUB_OWNER = 'brain-bbqs';
const GITHUB_REPO = 'brain-bbq-clone';

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  labels: Array<{ name: string; color: string }>;
  created_at: string;
  updated_at: string;
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

async function fetchAllIssues(token?: string): Promise<GitHubIssue[]> {
  const allIssues: GitHubIssue[] = [];
  let page = 1;
  const perPage = 100;
  
  // Fetch open issues with pagination
  while (true) {
    const openIssues = await fetchFromGitHub(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&per_page=${perPage}&page=${page}`,
      token
    );
    
    // Filter out pull requests (they also appear in the issues endpoint)
    const issuesOnly = openIssues.filter((issue: any) => !issue.pull_request);
    allIssues.push(...issuesOnly);
    
    if (openIssues.length < perPage) break;
    page++;
  }
  
  // Fetch closed issues with pagination
  page = 1;
  while (true) {
    const closedIssues = await fetchFromGitHub(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=closed&per_page=${perPage}&page=${page}`,
      token
    );
    
    const issuesOnly = closedIssues.filter((issue: any) => !issue.pull_request);
    allIssues.push(...issuesOnly);
    
    if (closedIssues.length < perPage) break;
    page++;
  }
  
  return allIssues;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    
    console.log('Fetching all issues from GitHub...');
    
    const allIssues = await fetchAllIssues(githubToken);
    console.log(`Found ${allIssues.length} issues (excluding PRs)`);
    
    // Transform to roadmap format
    const issues: RoadmapIssue[] = allIssues.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.html_url,
      labels: issue.labels.map(l => ({ name: l.name, color: l.color })),
    }));
    
    // Sort: open issues first, then by number descending
    issues.sort((a, b) => {
      if (a.state !== b.state) {
        return a.state === 'open' ? -1 : 1;
      }
      return b.number - a.number;
    });
    
    console.log('Roadmap data built successfully');
    
    return new Response(JSON.stringify({ issues }), {
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
