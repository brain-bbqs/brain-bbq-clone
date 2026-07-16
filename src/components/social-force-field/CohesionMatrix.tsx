import { useMemo, useState } from "react";

type Label = { grant_number: string; title: string };

export function CohesionMatrix({ labels, matrix }: { labels: Label[]; matrix: number[][] }) {
  const [hover, setHover] = useState<{ i: number; j: number } | null>(null);
  const n = labels.length;
  const size = 18;
  const width = Math.max(400, n * size + 220);
  const height = n * size + 60;

  const cells = useMemo(() => {
    const out: { i: number; j: number; v: number }[] = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push({ i, j, v: matrix[i]?.[j] ?? 0 });
    return out;
  }, [matrix, n]);

  return (
    <div className="relative overflow-auto">
      <svg width={width} height={height} className="text-xs">
        {labels.map((l, j) => (
          <text key={`c${j}`} x={210 + j * size + size / 2} y={16}
                textAnchor="start" transform={`rotate(-55 ${210 + j * size + size / 2} 16)`}
                className="fill-muted-foreground font-mono" style={{ fontSize: 9 }}>
            {l.grant_number}
          </text>
        ))}
        {labels.map((l, i) => (
          <text key={`r${i}`} x={200} y={60 + i * size + size / 2 - 2} textAnchor="end"
                className="fill-foreground font-mono" style={{ fontSize: 9 }}>
            {l.grant_number}
          </text>
        ))}
        {cells.map(({ i, j, v }) => {
          const alpha = Math.min(1, v * 1.4);
          const hue = i === j ? 210 : 25 + (1 - v) * 20;
          const isHover = hover && hover.i === i && hover.j === j;
          return (
            <rect
              key={`${i}-${j}`}
              x={210 + j * size} y={60 + i * size - size}
              width={size - 1} height={size - 1}
              fill={`hsl(${hue} 80% ${75 - alpha * 45}%)`}
              stroke={isHover ? "hsl(38 90% 45%)" : "transparent"}
              strokeWidth={isHover ? 2 : 0}
              onMouseEnter={() => setHover({ i, j })}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>
      {hover && (
        <div className="absolute top-2 right-2 bg-background border border-border rounded px-2 py-1 text-xs shadow max-w-xs">
          <div className="font-mono text-muted-foreground">{labels[hover.i].grant_number} × {labels[hover.j].grant_number}</div>
          <div className="tabular-nums">cohesion = {(matrix[hover.i][hover.j] * 100).toFixed(1)}%</div>
          <div className="mt-1 text-muted-foreground truncate">{labels[hover.i].title}</div>
          <div className="text-muted-foreground truncate">{labels[hover.j].title}</div>
        </div>
      )}
    </div>
  );
}