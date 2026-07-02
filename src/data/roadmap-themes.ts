// Curated developer roadmap themes. Each theme corresponds to a Spec-Kit-style
// folder under `.specify/specs/` (spec.md + plan.md + tasks.md). Contributors
// extend those markdown files via PR; this index just wires them into the UI.
import constitutionRaw from "../../.specify/memory/constitution.md?raw";

import spec001 from "../../.specify/specs/001-consortium-agent/spec.md?raw";
import plan001 from "../../.specify/specs/001-consortium-agent/plan.md?raw";
import tasks001 from "../../.specify/specs/001-consortium-agent/tasks.md?raw";

import spec002 from "../../.specify/specs/002-knowledge-graph-enrichment/spec.md?raw";
import plan002 from "../../.specify/specs/002-knowledge-graph-enrichment/plan.md?raw";
import tasks002 from "../../.specify/specs/002-knowledge-graph-enrichment/tasks.md?raw";

import spec003 from "../../.specify/specs/003-communication-cadence-forum/spec.md?raw";
import plan003 from "../../.specify/specs/003-communication-cadence-forum/plan.md?raw";
import tasks003 from "../../.specify/specs/003-communication-cadence-forum/tasks.md?raw";

import spec004 from "../../.specify/specs/004-brainkb-federation/spec.md?raw";
import plan004 from "../../.specify/specs/004-brainkb-federation/plan.md?raw";
import tasks004 from "../../.specify/specs/004-brainkb-federation/tasks.md?raw";

import spec005 from "../../.specify/specs/005-ai-playwright-qa/spec.md?raw";
import plan005 from "../../.specify/specs/005-ai-playwright-qa/plan.md?raw";
import tasks005 from "../../.specify/specs/005-ai-playwright-qa/tasks.md?raw";

import spec006 from "../../.specify/specs/006-species-enrichment/spec.md?raw";
import plan006 from "../../.specify/specs/006-species-enrichment/plan.md?raw";
import tasks006 from "../../.specify/specs/006-species-enrichment/tasks.md?raw";

export type ThemeStatus = "now" | "next" | "later";
export type ThemePillar = "agent" | "knowledge-graph" | "comms" | "engineering";

export interface RoadmapTheme {
  id: string;
  number: string;
  title: string;
  summary: string;
  pillar: ThemePillar;
  status: ThemeStatus;
  githubLabel: string;
  githubPath: string;
  spec: string;
  plan: string;
  tasks: string;
}

export const constitution = constitutionRaw;

export const PILLAR_LABEL: Record<ThemePillar, string> = {
  agent: "Agent",
  "knowledge-graph": "Knowledge Graph",
  comms: "Communication",
  engineering: "Engineering",
};

export const STATUS_LABEL: Record<ThemeStatus, string> = {
  now: "Now",
  next: "Next",
  later: "Later",
};

export const ROADMAP_THEMES: RoadmapTheme[] = [
  {
    id: "consortium-agent",
    number: "001",
    title: "Consortium Agent",
    summary:
      "Onboarding, monthly newsletter, cross-member connections, meeting graph, and first-pass email triage — supervised by admins.",
    pillar: "agent",
    status: "now",
    githubLabel: "roadmap:agent",
    githubPath: ".specify/specs/001-consortium-agent",
    spec: spec001,
    plan: plan001,
    tasks: tasks001,
  },
  {
    id: "knowledge-graph-enrichment",
    number: "002",
    title: "Knowledge Graph Enrichment",
    summary:
      "Device troubleshooting, manuals, and 'how to build the rig' recipes so R61/R34 teams find the right stack fast.",
    pillar: "knowledge-graph",
    status: "now",
    githubLabel: "roadmap:kg",
    githubPath: ".specify/specs/002-knowledge-graph-enrichment",
    spec: spec002,
    plan: plan002,
    tasks: tasks002,
  },
  {
    id: "ai-playwright-qa",
    number: "005",
    title: "AI Playwright QA Runner",
    summary:
      "Interoperable end-to-end test format that anyone can add. Every PR gets an AI-driven consistency report.",
    pillar: "engineering",
    status: "now",
    githubLabel: "roadmap:qa",
    githubPath: ".specify/specs/005-ai-playwright-qa",
    spec: spec005,
    plan: plan005,
    tasks: tasks005,
  },
  {
    id: "forum",
    number: "003",
    title: "In-site Forum (with AI co-responder)",
    summary:
      "Members-only forum for questions, frustrations, and cross-team help. AI drafts suggested replies citing consortium resources — humans ratify.",
    pillar: "comms",
    status: "next",
    githubLabel: "roadmap:forum",
    githubPath: ".specify/specs/003-communication-cadence-forum",
    spec: spec003,
    plan: plan003,
    tasks: tasks003,
  },
  {
    id: "brainkb-federation",
    number: "004",
    title: "Merge into BrainKB",
    summary:
      "Federate the BBQS graph upstream into BrainKB — bidirectional sync, public export, provenance-preserving.",
    pillar: "knowledge-graph",
    status: "next",
    githubLabel: "roadmap:brainkb",
    githubPath: ".specify/specs/004-brainkb-federation",
    spec: spec004,
    plan: plan004,
    tasks: tasks004,
  },
  {
    id: "species-enrichment",
    number: "006",
    title: "Species Enrichment",
    summary:
      "Behavior repertoires, vocalization samples, ethograms, and cross-species analogues for every BBQS species.",
    pillar: "knowledge-graph",
    status: "later",
    githubLabel: "roadmap:species",
    githubPath: ".specify/specs/006-species-enrichment",
    spec: spec006,
    plan: plan006,
    tasks: tasks006,
  },
];

export function countOpenTasks(tasksMd: string): { done: number; total: number } {
  const lines = tasksMd.split("\n");
  let done = 0;
  let total = 0;
  for (const line of lines) {
    if (/^\s*-\s+\[[ xX]\]/.test(line)) {
      total += 1;
      if (/^\s*-\s+\[[xX]\]/.test(line)) done += 1;
    }
  }
  return { done, total };
}