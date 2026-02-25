import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, MessageSquare, Database, History, Users, ArrowRight,
  CheckCircle2, Sparkles, ChevronDown, ChevronUp, Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TutorialStep {
  title: string;
  description: string;
  details: string[];
  icon: any;
  tip?: string;
}

const BBQS_TUTORIAL: TutorialStep[] = [
  {
    title: "Select your project",
    description: "Start by clicking on your project in the Project Grid at the top of the BBQS Workbench. Each card shows a completeness score — find yours and click it.",
    details: [
      "Projects are identified by their NIH grant number",
      "The completeness bar shows how much metadata has been filled in",
      "A low score means the assistant needs more information from you",
      "You can click any project to switch context at any time",
    ],
    icon: Database,
    tip: "If you don't see your project, it may not have been imported yet. Contact the admin team.",
  },
  {
    title: "Describe your research in plain language",
    description: "Tell the BBQS Assistant about your experiments naturally — what species you study, what techniques you use, what data you produce. The assistant extracts structured metadata from your description.",
    details: [
      'Try: "We study mice using two-photon calcium imaging in barrel cortex"',
      'Try: "Our lab develops open-source Python tools for spike sorting"',
      'Try: "We record from zebrafish larvae using light-sheet microscopy during free swimming"',
      "The assistant will parse species, approaches, sensors, data modalities, and analysis methods",
    ],
    icon: MessageSquare,
    tip: "Be specific! Mentioning exact techniques, brain regions, and data types helps the assistant populate more fields automatically.",
  },
  {
    title: "Review extracted metadata",
    description: "After you describe your work, the assistant automatically updates metadata fields in the right panel. Review what was extracted and correct anything that's off.",
    details: [
      "Updated fields are highlighted so you can see what changed",
      "The completeness score updates in real-time as fields are filled",
      "You can ask the assistant to correct or refine any field",
      'Try: "Actually we use Neuropixels, not tetrodes"',
    ],
    icon: CheckCircle2,
  },
  {
    title: "Ask about missing fields",
    description: 'Not sure what\'s left? Ask the assistant "What metadata fields are still missing?" and it will tell you exactly what to fill in next.',
    details: [
      "The assistant knows the full BBQS metadata schema",
      "It will prioritize high-impact fields that connect your project to others",
      "Fields like species, approaches, and data modality are critical for cross-project discovery",
    ],
    icon: Sparkles,
    tip: "The more projects that fill in their metadata, the more powerful cross-project search and recommendations become for everyone.",
  },
  {
    title: "Track changes in Data Provenance",
    description: "Every metadata update is logged with full provenance — who changed it, when, what the old and new values were, and the chat conversation that led to the change.",
    details: [
      "Navigate to Data Provenance in the sidebar to see the full audit trail",
      "Hover over the Chat column to see the exact conversation that triggered each edit",
      "The editor column shows whether it was the AI assistant or a human user",
      "You can filter and sort by project, field, or date",
    ],
    icon: History,
  },
  {
    title: "Build project relationships",
    description: "As more teams describe their work, the system automatically discovers connections — shared species, overlapping techniques, complementary datasets. This is the real power of BBQS.",
    details: [
      "Two projects studying the same species with different techniques are automatically linked",
      "Shared analysis methods surface collaboration opportunities",
      "The more metadata you contribute, the richer the consortium-wide network becomes",
      "Future: the assistant will proactively suggest collaborators and related projects",
    ],
    icon: Users,
    tip: "Think of each conversation with the assistant as teaching the system about your corner of neuroscience. The collective knowledge grows with every interaction.",
  },
];

function StepCard({ step, index, isOpen, onToggle }: { step: TutorialStep; index: number; isOpen: boolean; onToggle: () => void }) {
  const Icon = step.icon;
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden transition-shadow hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-start gap-4 text-left"
      >
        <div className="flex items-center gap-3 shrink-0 mt-0.5">
          <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
            {index + 1}
          </span>
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
        </div>
        <div className="shrink-0 mt-1 text-muted-foreground">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-0 ml-[68px]">
          <ul className="space-y-2 mb-3">
            {step.details.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <ArrowRight className="h-3 w-3 mt-0.5 text-primary/60 shrink-0" />
                <span className="leading-relaxed">{d}</span>
              </li>
            ))}
          </ul>
          {step.tip && (
            <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-lg px-3 py-2.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-primary/80 leading-relaxed">{step.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Tutorials() {
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([0]));

  const toggleStep = (index: number) => {
    setOpenSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-[10px] font-medium">
              <BookOpen className="h-3 w-3 mr-1" />
              Tutorial
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Getting Started with the BBQS Assistant
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            Learn how to use the BBQS Workbench to describe your research, curate metadata,
            and build connections across the consortium. Every conversation makes the system smarter for everyone.
          </p>
        </div>

        {/* CTA */}
        <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Ready to start?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Open the BBQS Assistant and select your project to begin curating metadata.</p>
          </div>
          <Link to="/metadata-assistant">
            <Button size="sm" className="gap-1.5 shrink-0">
              Open BBQS Assistant
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {BBQS_TUTORIAL.map((step, i) => (
            <StepCard
              key={i}
              step={step}
              index={i}
              isOpen={openSteps.has(i)}
              onToggle={() => toggleStep(i)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-xs text-muted-foreground mb-3">
            Have questions? Use the Report Issue button in the sidebar to reach the engineering team.
          </p>
          <Link to="/metadata-assistant">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Launch BBQS Assistant
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
