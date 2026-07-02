import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PILLAR_LABEL, type ThemePillar } from "@/data/roadmap-themes";

const CLASSES: Record<ThemePillar, string> = {
  agent: "bg-primary/10 text-primary border-primary/30",
  "knowledge-graph": "bg-accent/10 text-accent-foreground border-accent/30",
  comms: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
  engineering: "bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400",
};

export function PillarBadge({ pillar }: { pillar: ThemePillar }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide", CLASSES[pillar])}>
      {PILLAR_LABEL[pillar]}
    </Badge>
  );
}