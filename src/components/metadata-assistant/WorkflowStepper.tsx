import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  MessageSquare,
  ShieldCheck,
  Users,
  CheckCircle2,
} from "lucide-react";

export type StepStatus = "pending" | "active" | "done";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  icon: React.ReactNode;
}

const DEFAULT_STEPS: Omit<WorkflowStep, "status">[] = [
  {
    id: "identify",
    label: "Identify gaps",
    description: "Find missing or incomplete metadata fields",
    icon: <Search className="h-3.5 w-3.5" />,
  },
  {
    id: "describe",
    label: "Describe work",
    description: "Tell us about your experiments in plain language",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
  },
  {
    id: "validate",
    label: "Validate standards",
    description: "Check against BIDS, NWB, and HED protocols",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  {
    id: "relate",
    label: "Find related work",
    description: "Discover similar projects and shared metadata",
    icon: <Users className="h-3.5 w-3.5" />,
  },
  {
    id: "finalize",
    label: "Finalize & save",
    description: "Review changes and commit updates",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
];

function deriveStatuses(messageCount: number, hasValidation: boolean): StepStatus[] {
  if (messageCount === 0) return ["active", "pending", "pending", "pending", "pending"];
  if (messageCount <= 2 && !hasValidation) return ["done", "active", "pending", "pending", "pending"];
  if (hasValidation) return ["done", "done", "done", "active", "pending"];
  if (messageCount > 2) return ["done", "done", "active", "pending", "pending"];
  return ["active", "pending", "pending", "pending", "pending"];
}

interface WorkflowStepperProps {
  messageCount: number;
  hasValidation: boolean;
  completeness: number;
}

export function WorkflowStepper({ messageCount, hasValidation, completeness }: WorkflowStepperProps) {
  const statuses = deriveStatuses(messageCount, hasValidation);
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    setRevealedCount(0);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setRevealedCount(i);
      if (i >= DEFAULT_STEPS.length) clearInterval(timer);
    }, 120);
    return () => clearInterval(timer);
  }, []);

  const doneCount = statuses.filter(s => s === "done").length;

  return (
    <div className="px-4 py-3 border-b border-border bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Curation workflow
        </span>
        <span className="text-[10px] text-muted-foreground">
          {doneCount}/{DEFAULT_STEPS.length} complete
        </span>
      </div>
      <div className="flex items-start gap-0">
        {DEFAULT_STEPS.map((step, idx) => {
          const status = statuses[idx];
          const revealed = idx < revealedCount;
          const isLast = idx === DEFAULT_STEPS.length - 1;

          return (
            <div
              key={step.id}
              className={cn(
                "flex-1 flex flex-col items-center relative transition-all duration-300",
                !revealed && "opacity-0 translate-y-2",
                revealed && "opacity-100 translate-y-0",
              )}
              style={{ transitionDelay: `${idx * 120}ms` }}
            >
              {/* Connector line */}
              {!isLast && (
                <div className="absolute top-3 left-[calc(50%+10px)] right-0 h-px">
                  <div
                    className={cn(
                      "h-full w-full transition-colors duration-500",
                      status === "done" ? "bg-primary" : "bg-border",
                    )}
                  />
                </div>
              )}

              {/* Circle */}
              <div
                className={cn(
                  "relative z-10 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  status === "done" && "bg-primary border-primary text-primary-foreground",
                  status === "active" && "bg-primary/10 border-primary text-primary animate-pulse",
                  status === "pending" && "bg-secondary border-border text-muted-foreground/40",
                )}
              >
                {status === "done" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[9px] font-medium mt-1.5 text-center leading-tight max-w-[72px]",
                  status === "done" && "text-primary",
                  status === "active" && "text-foreground font-semibold",
                  status === "pending" && "text-muted-foreground/50",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
