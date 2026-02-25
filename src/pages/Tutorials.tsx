import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, MessageSquare, Database, History, Users, ArrowRight,
  CheckCircle2, Sparkles, Lightbulb, Play, ChevronRight, ChevronLeft,
  MousePointerClick, Search, Eye, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  actions: { label: string; description: string }[];
  icon: any;
  color: string;
  route: string;
  tip?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to the BBQS Workbench",
    subtitle: "Your hub for consortium metadata",
    description: "The BBQS Assistant helps you describe your research in plain language and automatically organizes it into structured metadata. This makes your work discoverable and connected to the rest of the consortium.",
    actions: [],
    icon: Sparkles,
    color: "from-primary to-primary/70",
    route: "/tutorials",
  },
  {
    id: "select-project",
    title: "Step 1: Select Your Project",
    subtitle: "Find your grant in the Project Grid",
    description: "When you open the BBQS Assistant, you'll see a grid of all consortium projects at the top. Each card shows the project's completeness score. Click your project to start curating its metadata.",
    actions: [
      { label: "Find your project", description: "Look for your NIH grant number in the grid" },
      { label: "Check completeness", description: "The progress bar shows how much metadata is filled" },
      { label: "Click to select", description: "Your project becomes the active context for the chat" },
    ],
    icon: MousePointerClick,
    color: "from-[hsl(210,85%,55%)] to-[hsl(210,70%,45%)]",
    route: "/metadata-assistant",
    tip: "Projects with low completeness scores need your input the most!",
  },
  {
    id: "describe-research",
    title: "Step 2: Describe Your Research",
    subtitle: "Talk naturally — the AI does the rest",
    description: "Tell the assistant about your experiments in plain language. Mention species, techniques, brain regions, data types, and analysis methods. The AI extracts structured metadata from your description.",
    actions: [
      { label: "Species & model", description: '"We study mice using head-fixed two-photon imaging"' },
      { label: "Techniques", description: '"Our lab records with Neuropixels probes in barrel cortex"' },
      { label: "Data & tools", description: '"We produce calcium imaging movies and use Suite2p for analysis"' },
      { label: "Software", description: '"We develop open-source Python tools for spike sorting"' },
    ],
    icon: MessageSquare,
    color: "from-[hsl(140,65%,45%)] to-[hsl(140,55%,35%)]",
    route: "/metadata-assistant",
    tip: "Be specific! Mentioning exact techniques and brain regions helps the AI populate more fields automatically.",
  },
  {
    id: "review-metadata",
    title: "Step 3: Review & Refine",
    subtitle: "Check the extracted metadata",
    description: "After you describe your work, the right panel updates with extracted metadata fields. Updated fields are highlighted. Review what was extracted and ask the assistant to correct anything.",
    actions: [
      { label: "Check highlights", description: "Yellow-highlighted fields were just updated by the AI" },
      { label: "Correct errors", description: '"Actually we use Neuropixels, not tetrodes"' },
      { label: "Ask for gaps", description: '"What metadata fields are still missing?"' },
    ],
    icon: CheckCircle2,
    color: "from-[hsl(35,85%,50%)] to-[hsl(35,75%,40%)]",
    route: "/metadata-assistant",
  },
  {
    id: "data-provenance",
    title: "Step 4: Track Your Changes",
    subtitle: "Full audit trail with chat context",
    description: "Every metadata update is logged in Data Provenance — who changed it, when, old vs new values, and the exact chat conversation that triggered the change. Hover over the Chat column to see the context.",
    actions: [
      { label: "View history", description: "See every edit across all projects in chronological order" },
      { label: "Hover for context", description: "The Chat column shows the conversation that led to each change" },
      { label: "Filter by project", description: "Use the search bar to focus on a specific grant" },
    ],
    icon: History,
    color: "from-[hsl(280,60%,55%)] to-[hsl(280,50%,45%)]",
    route: "/data-provenance",
  },
  {
    id: "relationships",
    title: "Step 5: Discover Connections",
    subtitle: "The network grows with every conversation",
    description: "As more teams describe their work, the system discovers connections — shared species, overlapping techniques, complementary datasets. The more metadata you contribute, the richer the consortium-wide network becomes.",
    actions: [
      { label: "Shared species", description: "Two labs studying the same organism are automatically linked" },
      { label: "Common methods", description: "Overlapping analysis techniques surface collaboration opportunities" },
      { label: "Growing intelligence", description: "Every chat conversation teaches the system about your research" },
    ],
    icon: Users,
    color: "from-[hsl(350,70%,55%)] to-[hsl(350,60%,45%)]",
    route: "/metadata-assistant",
    tip: "Think of each conversation as teaching the system about your corner of neuroscience. The collective knowledge grows with every interaction.",
  },
];

export default function Tutorials() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  const handleStartTour = () => {
    setCurrentStep(1);
    navigate(TOUR_STEPS[1].route);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      navigate(TOUR_STEPS[next].route);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      navigate(TOUR_STEPS[prev].route);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    navigate(TOUR_STEPS[index].route);
  };

  // Welcome screen
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Getting Started with BBQS
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
            This interactive tutorial will walk you through the BBQS Workbench step by step.
            You'll navigate to each section of the app and learn how to curate your project's metadata.
          </p>

          <Button onClick={handleStartTour} size="lg" className="gap-2 px-8">
            <Play className="h-4 w-4" />
            Start Interactive Tour
          </Button>

          <div className="mt-10 grid grid-cols-5 gap-3">
            {TOUR_STEPS.slice(1).map((s, i) => {
              const SIcon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => handleStepClick(i + 1)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors group"
                >
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                    <SIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[10px] text-muted-foreground group-hover:text-foreground text-center leading-tight">
                    {s.title.replace(/Step \d: /, "")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Tour overlay card (fixed, bottom-center, so user sees the actual page)
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[520px] max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className={`h-full bg-gradient-to-r ${step.color} transition-all duration-500`}
            style={{ width: `${(currentStep / (TOUR_STEPS.length - 1)) * 100}%` }}
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant="secondary" className="text-[9px] font-semibold">
                  {currentStep} of {TOUR_STEPS.length - 1}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-foreground leading-tight">{step.title}</h3>
              <p className="text-[11px] text-muted-foreground">{step.subtitle}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{step.description}</p>

          {/* Action items */}
          {step.actions.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {step.actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 bg-secondary/30 rounded-lg px-3 py-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                  <div>
                    <span className="text-[11px] font-medium text-foreground">{action.label}</span>
                    <span className="text-[11px] text-muted-foreground ml-1">— {action.description}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tip */}
          {step.tip && (
            <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 mb-3">
              <Lightbulb className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <p className="text-[10px] text-primary/80 leading-relaxed">{step.tip}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-1">
            {/* Step dots */}
            <div className="flex gap-1.5">
              {TOUR_STEPS.slice(1).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleStepClick(i + 1)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i + 1 === currentStep ? "w-6 bg-primary" :
                    i + 1 < currentStep ? "w-2 bg-primary/30" :
                    "w-1.5 bg-border"
                  )}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setCurrentStep(0); navigate("/tutorials"); }}
                className="h-7 text-[11px] text-muted-foreground"
              >
                End Tour
              </Button>
              {currentStep > 1 && (
                <Button variant="outline" size="sm" onClick={handlePrev} className="h-7 w-7 p-0">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              )}
              {currentStep < TOUR_STEPS.length - 1 ? (
                <Button size="sm" onClick={handleNext} className="h-7 text-[11px] gap-1">
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => { setCurrentStep(0); navigate("/tutorials"); }} className="h-7 text-[11px]">
                  Finish
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
