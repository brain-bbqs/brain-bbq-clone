import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { computationalCategories } from "@/data/computational-models";

interface TooltipData {
  name: string;
  category: string;
  goal?: string;
  algorithm?: string;
  species?: string;
  grant?: string;
  pis?: string;
  x: number;
  y: number;
}

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(168, 55%, 42%)",
  "hsl(280, 45%, 55%)",
  "hsl(35, 80%, 55%)",
  "hsl(200, 60%, 50%)",
  "hsl(340, 55%, 55%)",
];

export function ComputationalBubbleChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 700 });

  // Responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: Math.max(500, Math.min(width * 0.85, 800)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const { width, height } = dimensions;

    // Build hierarchy data
    const hierarchyData = {
      name: "BBQS Computational Landscape",
      children: computationalCategories.map((cat, i) => ({
        name: cat.title.replace(/^\d+\.\s*/, ""),
        categoryIndex: i,
        children: (cat.tree.children ?? []).map((model) => ({
          name: model.name,
          categoryIndex: i,
          meta: model.meta,
          value: 1,
        })),
      })),
    };

    const root = d3
      .hierarchy(hierarchyData)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.pack<any>().size([width, height]).padding(12)(root);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");

    // Category group circles
    const categoryNodes = root.children || [];
    g.selectAll("circle.category")
      .data(categoryNodes)
      .join("circle")
      .attr("class", "category")
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y)
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => {
        const color = d3.color(CATEGORY_COLORS[d.data.categoryIndex % CATEGORY_COLORS.length]);
        return color ? color.copy({ opacity: 0.08 }).formatRgb() : "transparent";
      })
      .attr("stroke", (d: any) => CATEGORY_COLORS[d.data.categoryIndex % CATEGORY_COLORS.length])
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.3);

    // Category labels
    g.selectAll("text.cat-label")
      .data(categoryNodes)
      .join("text")
      .attr("class", "cat-label")
      .attr("x", (d: any) => d.x)
      .attr("y", (d: any) => d.y - d.r + 16)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("letter-spacing", "0.03em")
      .text((d: any) => d.data.name.length > 30 ? d.data.name.slice(0, 28) + "…" : d.data.name);

    // Leaf circles
    const leaves = root.leaves();
    g.selectAll("circle.leaf")
      .data(leaves)
      .join("circle")
      .attr("class", "leaf")
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y)
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => {
        const color = d3.color(CATEGORY_COLORS[d.data.categoryIndex % CATEGORY_COLORS.length]);
        return color ? color.copy({ opacity: 0.55 }).formatRgb() : "hsl(var(--primary))";
      })
      .attr("stroke", (d: any) => CATEGORY_COLORS[d.data.categoryIndex % CATEGORY_COLORS.length])
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .on("mouseenter", function (event: MouseEvent, d: any) {
        d3.select(this)
          .transition().duration(150)
          .attr("fill", CATEGORY_COLORS[d.data.categoryIndex % CATEGORY_COLORS.length])
          .attr("stroke-width", 2);

        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip({
          name: d.data.name,
          category: (d.parent as any)?.data?.name || "",
          goal: d.data.meta?.goal,
          algorithm: d.data.meta?.algorithm,
          species: d.data.meta?.species,
          grant: d.data.meta?.grant,
          pis: d.data.meta?.pis,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      })
      .on("mousemove", function (event: MouseEvent) {
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip((prev) =>
          prev ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top } : null
        );
      })
      .on("mouseleave", function (_event: MouseEvent, d: any) {
        d3.select(this)
          .transition().duration(150)
          .attr("fill", () => {
            const color = d3.color(CATEGORY_COLORS[d.data.categoryIndex % CATEGORY_COLORS.length]);
            return color ? color.copy({ opacity: 0.55 }).formatRgb() : "hsl(var(--primary))";
          })
          .attr("stroke-width", 1);
        setTooltip(null);
      });

    // Leaf labels — only render if bubble is large enough
    g.selectAll("text.leaf-label")
      .data(leaves)
      .join("text")
      .attr("class", "leaf-label")
      .attr("x", (d: any) => d.x)
      .attr("y", (d: any) => d.y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("pointer-events", "none")
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-size", (d: any) => Math.min(d.r * 0.38, 11) + "px")
      .attr("font-weight", "500")
      .each(function (d: any) {
        const el = d3.select(this);
        const maxWidth = d.r * 1.6;
        const words = d.data.name.split(/\s+/);
        const fontSize = Math.min(d.r * 0.38, 11);

        if (d.r < 18) {
          el.text("");
          return;
        }

        // Simple word-wrap
        el.text("");
        let line: string[] = [];
        let lineNum = 0;
        const maxLines = Math.floor(d.r / (fontSize * 1.2));

        words.forEach((word: string) => {
          line.push(word);
          const test = line.join(" ");
          if (test.length * fontSize * 0.55 > maxWidth && line.length > 1) {
            line.pop();
            if (lineNum < maxLines) {
              el.append("tspan")
                .attr("x", d.x)
                .attr("dy", lineNum === 0 ? `-${(Math.min(maxLines, Math.ceil(words.length / 3)) - 1) * 0.5}em` : "1.1em")
                .text(line.join(" "));
              lineNum++;
            }
            line = [word];
          }
        });
        if (line.length && lineNum < maxLines) {
          el.append("tspan")
            .attr("x", d.x)
            .attr("dy", lineNum === 0 ? "0" : "1.1em")
            .text(line.join(" "));
        }
      });
  }, [dimensions]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} className="w-full" style={{ height: dimensions.height }} />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {computationalCategories.map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
            />
            <span>{cat.title.replace(/^\d+\.\s*/, "").slice(0, 35)}{cat.title.replace(/^\d+\.\s*/, "").length > 35 ? "…" : ""}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-popover border border-border rounded-lg shadow-lg px-4 py-3 max-w-xs"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            transform: "translateY(-100%)",
          }}
        >
          <p className="text-sm font-semibold text-foreground leading-tight mb-1">{tooltip.name}</p>
          <p className="text-[10px] text-primary font-medium mb-2">{tooltip.category}</p>
          {tooltip.goal && (
            <p className="text-xs text-muted-foreground mb-1">
              <span className="font-medium text-foreground">Goal:</span> {tooltip.goal}
            </p>
          )}
          {tooltip.algorithm && (
            <p className="text-xs text-muted-foreground mb-1">
              <span className="font-medium text-foreground">Method:</span> {tooltip.algorithm}
            </p>
          )}
          {tooltip.species && (
            <p className="text-xs text-muted-foreground mb-1">
              <span className="font-medium text-foreground">Species:</span> {tooltip.species}
            </p>
          )}
          {tooltip.grant && (
            <p className="text-xs text-muted-foreground font-mono">
              {tooltip.grant}{tooltip.pis ? ` · ${tooltip.pis}` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
