import { Badge } from "@/components/ui/badge";
import { PillarBadge } from "./PillarBadge";
import { countOpenTasks, type RoadmapTheme } from "@/data/roadmap-themes";
import { ArrowRight, ListTodo } from "lucide-react";

interface Props {
  theme: RoadmapTheme;
  openIssuesCount: number;
  onOpen: () => void;
}

export function ThemeCard({ theme, openIssuesCount, onOpen }: Props) {
  const { done, total } = countOpenTasks(theme.tasks);
  return (
    <button
      onClick={onOpen}
      className="group text-left w-full rounded-xl border bg-card hover:bg-muted/30 hover:border-primary/40 transition-colors p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <PillarBadge pillar={theme.pillar} />
          <span className="text-[10px] text-muted-foreground font-mono">#{theme.number}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground leading-tight">{theme.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-snug">{theme.summary}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
        <span className="inline-flex items-center gap-1">
          <ListTodo className="w-3 h-3" />
          {total > 0 ? `${done} / ${total} tasks` : "tasks TBD"}
        </span>
        {openIssuesCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <Badge variant="outline" className="text-[10px]">
              {openIssuesCount} open issue{openIssuesCount === 1 ? "" : "s"}
            </Badge>
          </>
        )}
      </div>
    </button>
  );
}