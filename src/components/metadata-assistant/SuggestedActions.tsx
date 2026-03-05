import { cn } from "@/lib/utils";
import {
  Search,
  PenLine,
  Users,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
  Layers,
  FileSearch,
} from "lucide-react";

interface SuggestedAction {
  label: string;
  prompt: string;
  icon: React.ReactNode;
  category: "explore" | "update" | "validate" | "discover";
}

const CATEGORY_STYLES: Record<string, string> = {
  explore: "border-primary/20 hover:bg-primary/5 hover:border-primary/30",
  update: "border-emerald-500/20 hover:bg-emerald-500/5 hover:border-emerald-500/30",
  validate: "border-amber-500/20 hover:bg-amber-500/5 hover:border-amber-500/30",
  discover: "border-violet-500/20 hover:bg-violet-500/5 hover:border-violet-500/30",
};

const ICON_STYLES: Record<string, string> = {
  explore: "text-primary",
  update: "text-emerald-600",
  validate: "text-amber-600",
  discover: "text-violet-600",
};

/** Workflows shown in the empty state — high-level starting points */
export const WORKFLOW_ACTIONS: SuggestedAction[] = [
  {
    label: "See what's missing",
    prompt: "What metadata fields are missing for this project?",
    icon: <Search className="h-3.5 w-3.5" />,
    category: "explore",
  },
  {
    label: "Update metadata from description",
    prompt: "I want to describe my experiments so you can fill in the metadata fields.",
    icon: <PenLine className="h-3.5 w-3.5" />,
    category: "update",
  },
  {
    label: "Validate against standards",
    prompt: "Validate my current metadata against BIDS, NWB, and HED standards.",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    category: "validate",
  },
  {
    label: "Find related projects",
    prompt: "Which other projects in the consortium use similar metadata or study similar topics?",
    icon: <Users className="h-3.5 w-3.5" />,
    category: "discover",
  },
  {
    label: "Compare my metadata",
    prompt: "How does my project's metadata compare to other projects? What are others using that I'm not?",
    icon: <Layers className="h-3.5 w-3.5" />,
    category: "discover",
  },
  {
    label: "Review edit history",
    prompt: "Show me the recent changes made to this project's metadata.",
    icon: <FileSearch className="h-3.5 w-3.5" />,
    category: "explore",
  },
];

/** Context-aware follow-ups based on what just happened */
function getFollowUps(
  lastAssistantMsg: string,
  hasValidation: boolean,
  fieldsUpdated: string[],
): SuggestedAction[] {
  const suggestions: SuggestedAction[] = [];

  if (fieldsUpdated.length > 0) {
    // Just did an update — suggest validation + more updates + related
    suggestions.push({
      label: "Validate these changes",
      prompt: "Validate the metadata changes I just made against BIDS, NWB, and HED standards.",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      category: "validate",
    });
    suggestions.push({
      label: "What else is missing?",
      prompt: "Now that we've updated some fields, what metadata is still missing?",
      icon: <Search className="h-3.5 w-3.5" />,
      category: "explore",
    });
    suggestions.push({
      label: "Find similar projects",
      prompt: "Which other consortium projects use similar metadata values to what we just added?",
      icon: <Users className="h-3.5 w-3.5" />,
      category: "discover",
    });
  } else if (hasValidation) {
    // Just got validation results
    suggestions.push({
      label: "Fix the warnings",
      prompt: "Help me fix the validation warnings. What changes should I make?",
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      category: "update",
    });
    suggestions.push({
      label: "Update more fields",
      prompt: "I want to describe more of my experiments to fill in additional metadata.",
      icon: <PenLine className="h-3.5 w-3.5" />,
      category: "update",
    });
  } else {
    // Generic informational response
    suggestions.push({
      label: "Update metadata now",
      prompt: "I want to update the missing fields. Let me describe my experiments.",
      icon: <PenLine className="h-3.5 w-3.5" />,
      category: "update",
    });
    suggestions.push({
      label: "Run validation",
      prompt: "Validate my current metadata against BIDS, NWB, and HED standards.",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      category: "validate",
    });
    suggestions.push({
      label: "Who uses similar metadata?",
      prompt: "Which other projects in the consortium share similar metadata or research focus?",
      icon: <Users className="h-3.5 w-3.5" />,
      category: "discover",
    });
  }

  return suggestions.slice(0, 3);
}

interface SuggestedActionsProps {
  onSend: (msg: string) => void;
  lastAssistantMsg?: string;
  hasValidation: boolean;
  fieldsUpdated: string[];
  isLoading: boolean;
}

export function SuggestedActions({
  onSend,
  lastAssistantMsg,
  hasValidation,
  fieldsUpdated,
  isLoading,
}: SuggestedActionsProps) {
  if (isLoading) return null;

  const actions = lastAssistantMsg
    ? getFollowUps(lastAssistantMsg, hasValidation, fieldsUpdated)
    : [];

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 ml-1 animate-fade-in">
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={() => onSend(action.prompt)}
          className={cn(
            "group inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border bg-background transition-all duration-200",
            CATEGORY_STYLES[action.category],
          )}
        >
          <span className={cn("transition-colors", ICON_STYLES[action.category])}>
            {action.icon}
          </span>
          <span className="text-foreground/80 group-hover:text-foreground">{action.label}</span>
          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40 group-hover:text-foreground/60 transition-transform group-hover:translate-x-0.5" />
        </button>
      ))}
    </div>
  );
}
