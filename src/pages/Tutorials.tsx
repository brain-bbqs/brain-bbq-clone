import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, MessageSquare, History, Users, ArrowRight,
  CheckCircle2, Sparkles, Lightbulb, Play, ChevronRight, ChevronLeft,
  MousePointerClick, Target, Zap, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  actions: { label: string; detail: string }[];
  icon: any;
  color: string;
  linkedRoute?: string;
  linkedLabel?: string;
  tip?: string;
  visual?: "project-grid" | "chat" | "metadata" | "provenance" | "network";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "select-project",
    title: "Select Your Project",
    subtitle: "Find your grant in the Project Grid",
    description:
      "Open the BBQS Assistant and you'll see a grid of consortium projects. Each card shows the grant number and a completeness score. Click your project to start curating.",
    actions: [
      { label: "Locate your grant", detail: "Find your NIH grant number in the project grid" },
      { label: "Check the progress bar", detail: "It shows how much metadata has been filled in" },
      { label: "Click to select", detail: "This sets the active context for the chat below" },
    ],
    icon: MousePointerClick,
    color: "from-[hsl(210,85%,55%)] to-[hsl(210,70%,45%)]",
    linkedRoute: "/metadata-assistant",
    linkedLabel: "Open BBQS Assistant",
    tip: "Projects with low completeness scores are the ones that need your input most!",
    visual: "project-grid",
  },
  {
    id: "describe-research",
    title: "Describe Your Research",
    subtitle: "Talk naturally — the AI structures it for you",
    description:
      "Type a plain-language description of your experiments into the chat. Mention species, techniques, brain regions, data types, and analysis methods. The AI will extract structured metadata automatically.",
    actions: [
      { label: "Species & model", detail: '"We study mice using head-fixed two-photon imaging"' },
      { label: "Techniques", detail: '"Our lab records with Neuropixels probes in barrel cortex"' },
      { label: "Data & analysis", detail: '"We produce calcium imaging movies and use Suite2p"' },
      { label: "Software", detail: '"We develop open-source Python tools for spike sorting"' },
    ],
    icon: MessageSquare,
    color: "from-[hsl(140,65%,45%)] to-[hsl(140,55%,35%)]",
    linkedRoute: "/metadata-assistant",
    linkedLabel: "Try it now",
    tip: "Be specific! Exact technique names and brain regions help the AI populate more fields automatically.",
    visual: "chat",
  },
  {
    id: "review-metadata",
    title: "Review & Refine",
    subtitle: "Check and correct the extracted metadata",
    description:
      "After you describe your work, the metadata panel on the right updates with extracted fields. Highlighted fields were just changed. Review what was extracted and ask the assistant to fix anything.",
    actions: [
      { label: "Spot highlighted fields", detail: "Yellow highlights mark fields the AI just updated" },
      { label: "Correct mistakes", detail: '"Actually we use Neuropixels, not tetrodes"' },
      { label: "Ask about gaps", detail: '"What metadata fields are still missing for my project?"' },
    ],
    icon: CheckCircle2,
    color: "from-[hsl(35,85%,50%)] to-[hsl(35,75%,40%)]",
    linkedRoute: "/metadata-assistant",
    linkedLabel: "Open Assistant",
    visual: "metadata",
  },
  {
    id: "data-provenance",
    title: "Track Your Changes",
    subtitle: "Full audit trail with chat context",
    description:
      "Every metadata update is logged in Data Provenance — who changed it, when, old vs new values, and the exact chat that triggered the change. Hover over the Chat column to see context.",
    actions: [
      { label: "View history", detail: "See every edit across all projects, in order" },
      { label: "Hover for context", detail: "The Chat column shows the conversation behind each change" },
      { label: "Filter by project", detail: "Use the search bar to focus on a specific grant" },
    ],
    icon: History,
    color: "from-[hsl(280,60%,55%)] to-[hsl(280,50%,45%)]",
    linkedRoute: "/data-provenance",
    linkedLabel: "View Data Provenance",
    visual: "provenance",
  },
  {
    id: "relationships",
    title: "Discover Connections",
    subtitle: "The network grows with every conversation",
    description:
      "As more teams curate their metadata, the system discovers connections — shared species, overlapping techniques, complementary datasets. Every conversation you have makes the whole consortium smarter.",
    actions: [
      { label: "Shared species", detail: "Labs studying the same organism are automatically linked" },
      { label: "Common methods", detail: "Overlapping techniques surface collaboration opportunities" },
      { label: "Growing intelligence", detail: "Every chat teaches the system about your research" },
    ],
    icon: Users,
    color: "from-[hsl(350,70%,55%)] to-[hsl(350,60%,45%)]",
    tip: "Think of each conversation as teaching the system about your corner of neuroscience.",
    visual: "network",
  },
];

/* ── Inline visuals for each step ── */
function StepVisual({ type }: { type: TourStep["visual"] }) {
  const baseCard = "rounded-lg border border-border bg-secondary/30 p-3";

  if (type === "project-grid") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {["U01-NS-12345", "R01-MH-67890", "U19-NS-11223"].map((g, i) => (
          <div key={g} className={cn(baseCard, i === 0 && "ring-2 ring-primary")}>
            <p className="text-[10px] font-mono text-muted-foreground">{g}</p>
            <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${[35, 72, 58][i]}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">{[35, 72, 58][i]}%</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === "chat") {
    return (
      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 max-w-[80%]">
            <p className="text-[10px] text-foreground">
              "We study mice using two-photon calcium imaging in visual cortex…"
            </p>
          </div>
        </div>
        <div className="flex justify-start">
          <div className={cn(baseCard, "max-w-[80%]")}>
            <p className="text-[10px] text-foreground">
              ✅ Updated <strong>species</strong> → Mus musculus<br />
              ✅ Updated <strong>data modality</strong> → Calcium imaging<br />
              ✅ Updated <strong>approaches</strong> → Two-photon microscopy
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "metadata") {
    return (
      <div className="space-y-1.5">
        {[
          { field: "Species", value: "Mus musculus", highlighted: true },
          { field: "Data Modality", value: "Calcium imaging", highlighted: true },
          { field: "Analysis Methods", value: "—", highlighted: false },
          { field: "Brain Region", value: "Visual cortex", highlighted: true },
        ].map((f) => (
          <div
            key={f.field}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-1.5 text-[10px]",
              f.highlighted ? "bg-[hsl(45,90%,90%)]/50 border border-[hsl(45,80%,60%)]/30" : "bg-secondary/30 border border-border"
            )}
          >
            <span className="text-muted-foreground">{f.field}</span>
            <span className={cn("font-medium", f.value === "—" ? "text-muted-foreground/50" : "text-foreground")}>
              {f.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "provenance") {
    return (
      <div className="space-y-1">
        <div className="grid grid-cols-4 gap-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
          <span>Field</span><span>Old</span><span>New</span><span>By</span>
        </div>
        {[
          { field: "species", old: "—", new_: "Mus musculus", by: "jsmith" },
          { field: "modality", old: "—", new_: "Ca imaging", by: "jsmith" },
        ].map((r) => (
          <div key={r.field} className={cn(baseCard, "grid grid-cols-4 gap-1 text-[10px] py-1.5")}>
            <span className="font-medium text-foreground">{r.field}</span>
            <span className="text-muted-foreground line-through">{r.old}</span>
            <span className="text-primary font-medium">{r.new_}</span>
            <span className="text-muted-foreground">{r.by}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "network") {
    return (
      <div className="flex items-center justify-center py-3">
        <div className="relative">
          {/* Center node */}
          <div className="h-10 w-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
            <Target className="h-4 w-4 text-primary" />
          </div>
          {/* Orbiting nodes */}
          {[
            { x: -50, y: -20, label: "Lab A", color: "bg-[hsl(210,70%,55%)]" },
            { x: 50, y: -20, label: "Lab B", color: "bg-[hsl(140,60%,45%)]" },
            { x: -40, y: 30, label: "Lab C", color: "bg-[hsl(35,80%,50%)]" },
            { x: 40, y: 30, label: "Lab D", color: "bg-[hsl(350,65%,55%)]" },
          ].map((n) => (
            <div
              key={n.label}
              className="absolute flex flex-col items-center"
              style={{ left: `calc(50% + ${n.x}px - 14px)`, top: `calc(50% + ${n.y}px - 14px)` }}
            >
              <div className={cn("h-7 w-7 rounded-full border-2 border-background shadow-sm flex items-center justify-center", n.color)}>
                <span className="text-[8px] text-white font-bold">{n.label.slice(-1)}</span>
              </div>
            </div>
          ))}
          {/* Connection lines (SVG) */}
          <svg className="absolute inset-0 -z-10" width="120" height="80" viewBox="-60 -40 120 80" style={{ left: "calc(50% - 60px)", top: "calc(50% - 40px)" }}>
            {[[-50, -20], [50, -20], [-40, 30], [40, 30]].map(([x, y], i) => (
              <line key={i} x1={0} y1={0} x2={x} y2={y} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="3 3" />
            ))}
          </svg>
        </div>
      </div>
    );
  }

  return null;
}

export default function Tutorials() {
  const [currentStep, setCurrentStep] = useState(-1);
  const step = currentStep >= 0 ? TOUR_STEPS[currentStep] : null;

  /* ── Welcome screen ── */
  if (!step) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Getting Started with BBQS
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
            Learn how to use the BBQS Assistant to describe your research, curate metadata, and discover connections across the consortium.
          </p>

          <Button onClick={() => setCurrentStep(0)} size="lg" className="gap-2 px-8">
            <Play className="h-4 w-4" />
            Start Tutorial
          </Button>

          <div className="mt-10 grid grid-cols-5 gap-3">
            {TOUR_STEPS.map((s, i) => {
              const SIcon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(i)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors group"
                >
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                    <SIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[10px] text-muted-foreground group-hover:text-foreground text-center leading-tight">
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── Step view ── */
  const Icon = step.icon;
  const stepNum = currentStep + 1;
  const total = TOUR_STEPS.length;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 flex-1",
                i === currentStep
                  ? "bg-primary"
                  : i < currentStep
                  ? "bg-primary/30"
                  : "bg-border"
              )}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${step.color} px-6 py-5`}>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <Badge className="bg-white/20 text-white border-0 text-[10px] mb-1">
                  Step {stepNum} of {total}
                </Badge>
                <h2 className="text-lg font-bold text-white">{step.title}</h2>
                <p className="text-xs text-white/80">{step.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

            {/* Visual */}
            {step.visual && (
              <div className="border border-border rounded-xl p-4 bg-secondary/10">
                <StepVisual type={step.visual} />
              </div>
            )}

            {/* Actions */}
            {step.actions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-primary" /> What to do
                </h4>
                {step.actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-secondary/30 rounded-lg px-4 py-2.5">
                    <ArrowRight className="h-3 w-3 mt-1 text-primary shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-foreground">{a.label}</span>
                      <span className="text-xs text-muted-foreground ml-1">— {a.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tip */}
            {step.tip && (
              <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-lg px-4 py-3">
                <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-primary/80 leading-relaxed">{step.tip}</p>
              </div>
            )}

            {/* Link to actual page */}
            {step.linkedRoute && (
              <Link
                to={step.linkedRoute}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {step.linkedLabel || "Go to page"}
              </Link>
            )}
          </div>

          {/* Navigation */}
          <div className="border-t border-border px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(-1)}
              className="text-xs text-muted-foreground"
            >
              Back to overview
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep - 1)} className="gap-1">
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
              )}
              {currentStep < total - 1 ? (
                <Button size="sm" onClick={() => setCurrentStep(currentStep + 1)} className="gap-1">
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => setCurrentStep(-1)} className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Finish
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
