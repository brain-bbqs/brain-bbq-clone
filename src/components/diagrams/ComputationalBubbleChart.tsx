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

const CATEGORY_PALETTES = [
  { bg: "#dbeafe", fill: "#93c5fd", stroke: "#3b82f6", text: "#1e3a5f" },   // blue
  { bg: "#d1fae5", fill: "#6ee7b7", stroke: "#10b981", text: "#064e3b" },   // emerald
  { bg: "#ede9fe", fill: "#c4b5fd", stroke: "#8b5cf6", text: "#3b0764" },   // violet
  { bg: "#fef3c7", fill: "#fcd34d", stroke: "#f59e0b", text: "#78350f" },   // amber
  { bg: "#fce7f3", fill: "#f9a8d4", stroke: "#ec4899", text: "#831843" },   // pink
  { bg: "#e0e7ff", fill: "#a5b4fc", stroke: "#6366f1", text: "#312e81" },   // indigo
];

export function ComputationalBubbleChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 720 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const w = Math.max(400, width);
      setDimensions({ width: w, height: Math.max(480, Math.min(w * 0.8, 780)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const { width, height } = dimensions;

    const hierarchyData = {
      name: "root",
      children: computationalCategories.map((cat, i) => ({
        name: cat.title.replace(/^\d+\.\s*/, ""),
        catIdx: i,
        children: (cat.tree.children ?? []).map((model) => ({
          name: model.name,
          catIdx: i,
          meta: model.meta,
          // Give varied sizes based on metadata richness
          value: 1 + (model.meta?.algorithm ? model.meta.algorithm.length / 40 : 0),
        })),
      })),
    };

    const root = d3
      .hierarchy(hierarchyData)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.pack<any>().size([width, height]).padding(20)(root);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Category circles
    const cats = root.children || [];
    cats.forEach((cat: any) => {
      const palette = CATEGORY_PALETTES[cat.data.catIdx % CATEGORY_PALETTES.length];

      // Outer circle
      svg
        .append("circle")
        .attr("cx", cat.x)
        .attr("cy", cat.y)
        .attr("r", cat.r)
        .attr("fill", palette.bg)
        .attr("stroke", palette.stroke)
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.35)
        .attr("fill-opacity", 0.5);

      // Category label at top
      svg
        .append("text")
        .attr("x", cat.x)
        .attr("y", cat.y - cat.r + 14)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "600")
        .attr("fill", palette.text)
        .attr("opacity", 0.7)
        .text(cat.data.name.length > 40 ? cat.data.name.slice(0, 38) + "…" : cat.data.name);
    });

    // Leaf bubbles
    const leaves = root.leaves();
    leaves.forEach((leaf: any) => {
      const palette = CATEGORY_PALETTES[leaf.data.catIdx % CATEGORY_PALETTES.length];

      // Circle
      svg
        .append("circle")
        .attr("cx", leaf.x)
        .attr("cy", leaf.y)
        .attr("r", leaf.r)
        .attr("fill", palette.fill)
        .attr("fill-opacity", 0.5)
        .attr("stroke", palette.stroke)
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.5)
        .attr("cursor", "pointer")
        .on("mouseenter", function (event: MouseEvent) {
          d3.select(this)
            .transition()
            .duration(120)
            .attr("fill-opacity", 0.85)
            .attr("stroke-opacity", 1)
            .attr("stroke-width", 2);

          const rect = svgRef.current!.getBoundingClientRect();
          setTooltip({
            name: leaf.data.name,
            category: (leaf.parent as any)?.data?.name || "",
            goal: leaf.data.meta?.goal,
            algorithm: leaf.data.meta?.algorithm,
            species: leaf.data.meta?.species,
            grant: leaf.data.meta?.grant,
            pis: leaf.data.meta?.pis,
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
        .on("mouseleave", function () {
          d3.select(this)
            .transition()
            .duration(120)
            .attr("fill-opacity", 0.5)
            .attr("stroke-opacity", 0.5)
            .attr("stroke-width", 1);
          setTooltip(null);
        });

      // Label inside bubble
      if (leaf.r >= 20) {
        const fontSize = Math.min(leaf.r * 0.32, 11);
        const maxChars = Math.floor((leaf.r * 1.5) / (fontSize * 0.55));
        const words = leaf.data.name.split(/[\s-]+/);
        const lines: string[] = [];
        let current = "";

        words.forEach((w: string) => {
          const test = current ? `${current} ${w}` : w;
          if (test.length > maxChars && current) {
            lines.push(current);
            current = w;
          } else {
            current = test;
          }
        });
        if (current) lines.push(current);

        // Limit lines to what fits
        const maxLines = Math.floor((leaf.r * 1.4) / (fontSize * 1.25));
        const visibleLines = lines.slice(0, maxLines);

        const textEl = svg
          .append("text")
          .attr("text-anchor", "middle")
          .attr("pointer-events", "none")
          .attr("font-size", fontSize + "px")
          .attr("font-weight", "500")
          .attr("fill", palette.text);

        const startY = leaf.y - ((visibleLines.length - 1) * fontSize * 1.2) / 2;

        visibleLines.forEach((line, i) => {
          textEl
            .append("tspan")
            .attr("x", leaf.x)
            .attr("y", startY + i * fontSize * 1.2)
            .text(line);
        });
      }
    });
  }, [dimensions]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} className="w-full" style={{ height: dimensions.height }} />

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 justify-center px-4">
        {computationalCategories.map((cat, i) => {
          const palette = CATEGORY_PALETTES[i % CATEGORY_PALETTES.length];
          return (
            <div key={cat.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className="w-3 h-3 rounded-full shrink-0 border"
                style={{ backgroundColor: palette.fill, borderColor: palette.stroke }}
              />
              <span>{cat.title.replace(/^\d+\.\s*/, "")}</span>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-popover border border-border rounded-xl shadow-xl px-4 py-3 max-w-[280px]"
          style={{
            left: Math.min(tooltip.x + 14, dimensions.width - 290),
            top: tooltip.y - 8,
            transform: "translateY(-100%)",
          }}
        >
          <p className="text-sm font-semibold text-foreground leading-snug mb-0.5">{tooltip.name}</p>
          <p className="text-[10px] font-medium text-primary mb-2">{tooltip.category}</p>
          <div className="space-y-1.5 text-xs">
            {tooltip.goal && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Goal:</span> {tooltip.goal}
              </p>
            )}
            {tooltip.algorithm && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Method:</span> {tooltip.algorithm}
              </p>
            )}
            {tooltip.species && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Species:</span> {tooltip.species}
              </p>
            )}
            {tooltip.grant && (
              <p className="text-muted-foreground font-mono text-[10px]">
                {tooltip.grant}{tooltip.pis ? ` · ${tooltip.pis}` : ""}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
