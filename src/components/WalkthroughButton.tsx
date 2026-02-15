import { useState } from "react";
import { HelpCircle, X, ChevronRight, ChevronLeft, Compass, Database, MessageSquare, Plug, BookOpen, FlaskConical, Map } from "lucide-react";

const steps = [
  {
    icon: Compass,
    title: "Welcome to BBQS!",
    description: "The Brain Behavior Quantification and Synchronization consortium hub. This walkthrough will show you the key sections of the site.",
    color: "bg-[hsl(222_47%_20%)]",
  },
  {
    icon: Database,
    title: "Projects & Knowledge Graph",
    description: "Browse all BBQS projects on the Projects page. The Knowledge Graph page visualizes cross-project relationships using Marr-level features — computational, algorithmic, and implementation.",
    color: "bg-[hsl(38_90%_50%)]",
  },
  {
    icon: FlaskConical,
    title: "ML Models & Evidence",
    description: "Explore machine learning models used across the consortium and the NER-extracted evidence from publications.",
    color: "bg-[hsl(280_60%_50%)]",
  },
  {
    icon: MessageSquare,
    title: "NeuroMCP Chat",
    description: "Ask natural-language questions about BBQS using our AI assistant. It uses RAG over the knowledge base to provide grounded answers.",
    color: "bg-[hsl(150_60%_40%)]",
  },
  {
    icon: Plug,
    title: "API & MCP Server",
    description: "Developers can access BBQS data via the REST API or connect AI agents (Claude, Cursor) using the MCP server. Visit the API Docs page for details.",
    color: "bg-[hsl(0_70%_50%)]",
  },
  {
    icon: Map,
    title: "Roadmap & Resources",
    description: "Check the Roadmap for upcoming features and milestones. The Resources page has links to tools, datasets, and documentation across the consortium.",
    color: "bg-[hsl(220_80%_55%)]",
  },
  {
    icon: BookOpen,
    title: "Publications",
    description: "Browse publications from BBQS investigators, with extracted entities and Marr-level annotations.",
    color: "bg-[hsl(25_80%_50%)]",
  },
];

export function WalkthroughButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const current = steps[step];
  const Icon = current.icon;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); setStep(0); }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(222_47%_20%)] to-[hsl(229_50%_15%)] text-[hsl(0_0%_100%)] shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
        title="Site walkthrough"
      >
        <HelpCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[hsl(38_90%_50%)] border-2 border-background" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-[hsl(222_47%_15%/0.5)] backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header gradient */}
            <div className={`h-2 bg-gradient-to-r ${
              step === 0 ? "from-[hsl(222_47%_20%)] to-[hsl(38_90%_50%)]" :
              step === 1 ? "from-[hsl(38_90%_50%)] to-[hsl(280_60%_50%)]" :
              step === 2 ? "from-[hsl(280_60%_50%)] to-[hsl(150_60%_40%)]" :
              step === 3 ? "from-[hsl(150_60%_40%)] to-[hsl(0_70%_50%)]" :
              step === 4 ? "from-[hsl(0_70%_50%)] to-[hsl(220_80%_55%)]" :
              step === 5 ? "from-[hsl(220_80%_55%)] to-[hsl(25_80%_50%)]" :
              "from-[hsl(25_80%_50%)] to-[hsl(222_47%_20%)]"
            }`} />

            {/* Close */}
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="p-6 pt-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${current.color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-[hsl(0_0%_100%)]" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Step {step + 1} of {steps.length}</p>
                  <h3 className="text-base font-bold text-foreground">{current.title}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
            </div>

            {/* Progress dots + nav */}
            <div className="px-6 pb-5 flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "w-6 bg-[hsl(38_90%_50%)]" : "w-1.5 bg-border hover:bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="h-3 w-3" /> Back
                  </button>
                )}
                {step < steps.length - 1 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="h-8 px-3 rounded-lg bg-[hsl(222_47%_20%)] text-[hsl(0_0%_100%)] text-xs font-medium hover:bg-[hsl(222_47%_25%)] transition-colors flex items-center gap-1"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => setOpen(false)}
                    className="h-8 px-4 rounded-lg bg-[hsl(38_90%_50%)] text-[hsl(222_47%_15%)] text-xs font-bold hover:bg-[hsl(38_90%_55%)] transition-colors"
                  >
                    Get Started!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
