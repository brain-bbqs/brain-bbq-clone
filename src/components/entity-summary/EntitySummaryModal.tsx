import { useEntitySummary } from "@/contexts/EntitySummaryContext";
import { X, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { InvestigatorSummary } from "./summaries/InvestigatorSummary";
import { GrantSummary } from "./summaries/GrantSummary";
import { PublicationSummary } from "./summaries/PublicationSummary";
import { SpeciesSummary } from "./summaries/SpeciesSummary";
import { OrganizationSummary } from "./summaries/OrganizationSummary";
import { ResourceSummary } from "./summaries/ResourceSummary";
import { GenericSummary } from "./summaries/GenericSummary";

function SummaryContent() {
  const { current } = useEntitySummary();
  if (!current) return null;

  switch (current.type) {
    case "investigator":
      return <InvestigatorSummary id={current.id} />;
    case "grant":
      return <GrantSummary id={current.id} />;
    case "publication":
      return <PublicationSummary id={current.id} />;
    case "species":
      return <SpeciesSummary id={current.id} />;
    case "organization":
      return <OrganizationSummary id={current.id} />;
    case "software":
    case "dataset":
    case "benchmark":
    case "ml_model":
    case "protocol":
      return <ResourceSummary id={current.id} />;
    default:
      return <GenericSummary id={current.id} type={current.type} />;
  }
}

export function EntitySummaryModal() {
  const { isOpen, close, goBack, stack, current } = useEntitySummary();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !current) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={close}
      />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-4xl bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-muted/30">
          {stack.length > 1 && (
            <button
              onClick={goBack}
              className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          {/* Breadcrumb */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5 text-sm text-muted-foreground overflow-hidden">
            {stack.map((ref, i) => (
              <span key={i} className="flex items-center gap-1.5 shrink-0">
                {i > 0 && <span className="text-border">/</span>}
                <span className={i === stack.length - 1 ? "text-foreground font-medium truncate max-w-[200px]" : "truncate max-w-[120px]"}>
                  {ref.label || ref.type}
                </span>
              </span>
            ))}
          </div>

          <button
            onClick={close}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors text-muted-foreground"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <SummaryContent />
        </div>
      </div>
    </div>
  );
}
