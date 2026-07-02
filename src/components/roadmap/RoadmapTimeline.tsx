import { useState } from "react";
import { cn } from "@/lib/utils";
import { PillarBadge } from "./PillarBadge";
import {
  ROADMAP_THEMES,
  STATUS_LABEL,
  countOpenTasks,
  type RoadmapTheme,
  type ThemeStatus,
} from "@/data/roadmap-themes";
import { CheckCircle2, Circle, Sparkles, ArrowRight } from "lucide-react";

interface Props {
  openIssuesByLabel: Map<string, number>;
  onOpenTheme: (theme: RoadmapTheme) => void;
}

const STATUS_ACCENT: Record<ThemeStatus, { dot: string; ring: string; glow: string; text: string; label: string }> = {
  now: {
    dot: "bg-primary",
    ring: "ring-primary/40",
    glow: "shadow-[0_0_40px_-8px_hsl(var(--primary)/0.55)]",
    text: "text-primary",
    label: "Shipping now",
  },
  next: {
    dot: "bg-amber-500",
    ring: "ring-amber-500/40",
    glow: "shadow-[0_0_40px_-10px_hsl(38_90%_50%/0.55)]",
    text: "text-amber-500 dark:text-amber-400",
    label: "Up next",
  },
  later: {
    dot: "bg-sky-500",
    ring: "ring-sky-500/40",
    glow: "shadow-[0_0_40px_-10px_hsl(200_90%_50%/0.45)]",
    text: "text-sky-500 dark:text-sky-400",
    label: "On the horizon",
  },
};

function progressPct(theme: RoadmapTheme) {
  const { done, total } = countOpenTasks(theme.tasks);
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export function RoadmapTimeline({ openIssuesByLabel, onOpenTheme }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const grouped: Record<ThemeStatus, RoadmapTheme[]> = {
    now: ROADMAP_THEMES.filter((t) => t.status === "now"),
    next: ROADMAP_THEMES.filter((t) => t.status === "next"),
    later: ROADMAP_THEMES.filter((t) => t.status === "later"),
  };

  return (
    <div className="relative rounded-2xl border bg-gradient-to-br from-card via-card to-muted/20 p-6 sm:p-8 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              The build journey
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Now → Next → Later</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            A living timeline of every theme we're building. Click any node to open its spec, plan, and tasks.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {(["now", "next", "later"] as ThemeStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", STATUS_ACCENT[s].dot)} />
              <span className="text-muted-foreground">{STATUS_ACCENT[s].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop timeline */}
      <div className="relative hidden md:block">
        {/* Rail */}
        <div className="absolute left-0 right-0 top-[52px] h-[3px] rounded-full bg-gradient-to-r from-primary/60 via-amber-500/60 to-sky-500/60" />
        <div className="absolute left-0 right-0 top-[52px] h-[3px] rounded-full bg-gradient-to-r from-primary/60 via-amber-500/60 to-sky-500/60 blur-md opacity-70" />

        <div className="relative grid grid-cols-3 gap-6">
          {(["now", "next", "later"] as ThemeStatus[]).map((status) => {
            const accent = STATUS_ACCENT[status];
            return (
              <div key={status} className="flex flex-col items-center">
                {/* Stage label */}
                <div className="mb-3">
                  <span className={cn("text-[11px] font-bold uppercase tracking-widest", accent.text)}>
                    {STATUS_LABEL[status]}
                  </span>
                </div>

                {/* Anchor node on the rail */}
                <div className="relative flex items-center justify-center h-8 mb-6">
                  <span className={cn("absolute w-6 h-6 rounded-full opacity-30 animate-ping", accent.dot)} />
                  <span className={cn("relative w-5 h-5 rounded-full ring-4 ring-background", accent.dot, accent.glow)} />
                </div>

                {/* Theme cards for this stage */}
                <div className="w-full space-y-3">
                  {grouped[status].map((theme) => {
                    const pct = progressPct(theme);
                    const openIssues = openIssuesByLabel.get(theme.githubLabel.toLowerCase()) ?? 0;
                    const active = hoverId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onMouseEnter={() => setHoverId(theme.id)}
                        onMouseLeave={() => setHoverId(null)}
                        onClick={() => onOpenTheme(theme)}
                        className={cn(
                          "group relative w-full text-left rounded-xl border bg-card/80 backdrop-blur-sm p-4 transition-all duration-300",
                          "hover:-translate-y-0.5 hover:border-primary/40",
                          active ? accent.glow : "shadow-sm hover:shadow-lg"
                        )}
                      >
                        {/* Glossy top sheen */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                        <div className="flex items-center justify-between gap-2 mb-2">
                          <PillarBadge pillar={theme.pillar} />
                          <span className="text-[10px] font-mono text-muted-foreground">#{theme.number}</span>
                        </div>
                        <h3 className="font-semibold text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                          {theme.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mb-3">
                          {theme.summary}
                        </p>

                        {/* Progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              {pct === 100 ? (
                                <CheckCircle2 className="w-3 h-3 text-primary" />
                              ) : (
                                <Circle className="w-3 h-3" />
                              )}
                              {pct}% complete
                            </span>
                            {openIssues > 0 && (
                              <span>{openIssues} issue{openIssues === 1 ? "" : "s"}</span>
                            )}
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                status === "now" && "bg-gradient-to-r from-primary to-primary/70",
                                status === "next" && "bg-gradient-to-r from-amber-500 to-amber-400",
                                status === "later" && "bg-gradient-to-r from-sky-500 to-sky-400"
                              )}
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            />
                          </div>
                        </div>

                        <ArrowRight className="absolute top-3 right-3 w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile stacked timeline */}
      <div className="md:hidden relative space-y-6">
        <div className="absolute left-[11px] top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-primary/60 via-amber-500/60 to-sky-500/60" />
        {(["now", "next", "later"] as ThemeStatus[]).map((status) => {
          const accent = STATUS_ACCENT[status];
          return (
            <div key={status} className="relative pl-8">
              <span className={cn("absolute left-0 top-1 w-6 h-6 rounded-full ring-4 ring-background flex items-center justify-center", accent.dot)}>
                <span className="w-2 h-2 rounded-full bg-background/80" />
              </span>
              <div className="mb-3">
                <span className={cn("text-[11px] font-bold uppercase tracking-widest", accent.text)}>
                  {STATUS_LABEL[status]} · {accent.label}
                </span>
              </div>
              <div className="space-y-3">
                {grouped[status].map((theme) => {
                  const pct = progressPct(theme);
                  return (
                    <button
                      key={theme.id}
                      onClick={() => onOpenTheme(theme)}
                      className="w-full text-left rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <PillarBadge pillar={theme.pillar} />
                        <span className="text-[10px] font-mono text-muted-foreground">#{theme.number}</span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{theme.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{theme.summary}</p>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            status === "now" && "bg-primary",
                            status === "next" && "bg-amber-500",
                            status === "later" && "bg-sky-500"
                          )}
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}