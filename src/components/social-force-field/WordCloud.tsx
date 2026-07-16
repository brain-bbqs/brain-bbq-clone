import { useMemo } from "react";

type Term = { term: string; count: number; projects: number };

export function WordCloud({ terms, maxProjects }: { terms: Term[]; maxProjects: number }) {
  const layout = useMemo(() => {
    const maxCount = Math.max(1, ...terms.map((t) => t.count));
    return terms.map((t) => {
      const size = 12 + Math.round((Math.log1p(t.count) / Math.log1p(maxCount)) * 28); // 12–40px
      const hue = 200 + Math.round((t.projects / Math.max(1, maxProjects)) * 40); // 200 (blue) → 240 (violet)
      const light = 60 - Math.round((t.projects / Math.max(1, maxProjects)) * 25);
      return { ...t, size, color: `hsl(${hue} 65% ${light}%)` };
    });
  }, [terms, maxProjects]);

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 leading-tight">
      {layout.map((t) => (
        <span
          key={t.term}
          style={{ fontSize: `${t.size}px`, color: t.color }}
          className="font-semibold tracking-tight cursor-default"
          title={`${t.term} — ${t.count} occurrences across ${t.projects} projects`}
        >
          {t.term}
        </span>
      ))}
    </div>
  );
}