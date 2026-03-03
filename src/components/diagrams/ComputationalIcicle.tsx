import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { computationalCategories } from "@/data/computational-models";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#6366f1", // indigo
];

interface HierarchyNode {
  name: string;
  catIdx?: number;
  meta?: {
    species?: string;
    goal?: string;
    algorithm?: string;
    grant?: string;
    pis?: string;
  };
  value?: number;
  children?: HierarchyNode[];
}

export function ComputationalIcicle() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [focusNode, setFocusNode] = useState<d3.HierarchyRectangularNode<HierarchyNode> | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(["BBQS Computational Landscape"]);
  const rootRef = useRef<d3.HierarchyRectangularNode<HierarchyNode> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDimensions({ width: Math.max(400, width), height: 560 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const buildHierarchy = useCallback((): HierarchyNode => ({
    name: "BBQS Computational Landscape",
    children: computationalCategories.map((cat, i) => ({
      name: cat.title.replace(/^\d+\.\s*/, ""),
      catIdx: i,
      children: (cat.tree.children ?? []).map((model) => ({
        name: model.name,
        catIdx: i,
        meta: model.meta,
        value: 1,
      })),
    })),
  }), []);

  const render = useCallback((focus: d3.HierarchyRectangularNode<HierarchyNode> | null) => {
    if (!svgRef.current || !rootRef.current) return;
    const { width, height } = dimensions;
    const root = rootRef.current;
    const target = focus || root;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Compute scales relative to the focused node
    const x = d3.scaleLinear()
      .domain([target.x0, target.x1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([target.y0, target.depth === 0 ? root.y1 : target.y1 + (target.y1 - target.y0) * (root.height - target.depth)])
      .range([0, height]);

    // Get visible descendants
    const descendants = target.depth === 0
      ? root.descendants()
      : [target, ...(target.children || [])];

    const cellHeight = (d: d3.HierarchyRectangularNode<HierarchyNode>) => {
      if (target.depth === 0) return Math.max(0, y(d.y1) - y(d.y0) - 1);
      // When zoomed in, distribute height evenly
      if (d === target) return 44;
      return (height - 44) / (target.children?.length || 1) - 1;
    };

    const cellY = (d: d3.HierarchyRectangularNode<HierarchyNode>, i: number) => {
      if (target.depth === 0) return y(d.y0);
      if (d === target) return 0;
      const childIdx = (target.children || []).indexOf(d);
      return 44 + childIdx * ((height - 44) / (target.children?.length || 1));
    };

    const g = svg.append("g");

    // Draw cells
    const cells = g.selectAll("g.cell")
      .data(descendants.filter(d => {
        if (target.depth === 0) return true;
        return d === target || (d.parent === target);
      }))
      .join("g")
      .attr("class", "cell");

    cells.each(function (d: any, i: number) {
      const group = d3.select(this);
      const catIdx = d.data.catIdx ?? d.data.children?.[0]?.catIdx ?? 0;
      const baseColor = CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length];
      const isRoot = d === root;
      const isLeaf = !d.children;
      const isCategory = d.depth === 1;

      let cx: number, cy: number, cw: number, ch: number;

      if (target.depth === 0) {
        cx = x(d.x0);
        cy = y(d.y0);
        cw = Math.max(0, x(d.x1) - x(d.x0) - 1);
        ch = Math.max(0, y(d.y1) - y(d.y0) - 1);
      } else {
        cx = d === target ? 0 : x(d.x0);
        cy = cellY(d, i);
        cw = d === target ? width : Math.max(0, x(d.x1) - x(d.x0) - 1);
        ch = cellHeight(d);
      }

      if (cw < 1 || ch < 1) return;

      // Background rect
      const color = d3.color(baseColor)!;
      const fillOpacity = isRoot ? 0.08 : isCategory ? 0.15 : 0.25;

      group
        .append("rect")
        .attr("x", cx)
        .attr("y", cy)
        .attr("width", cw)
        .attr("height", ch)
        .attr("rx", 3)
        .attr("fill", color.copy({ opacity: fillOpacity }).formatRgb())
        .attr("stroke", color.copy({ opacity: 0.3 }).formatRgb())
        .attr("stroke-width", 1)
        .attr("cursor", d.children ? "pointer" : "default")
        .on("click", () => {
          if (d.children && d !== root) {
            setFocusNode(d);
            const path = [];
            let node: any = d;
            while (node) {
              path.unshift(node.data.name);
              node = node.parent;
            }
            setBreadcrumbs(path);
          }
        })
        .on("mouseenter", function () {
          d3.select(this)
            .transition().duration(100)
            .attr("fill", color.copy({ opacity: fillOpacity + 0.15 }).formatRgb())
            .attr("stroke", color.copy({ opacity: 0.6 }).formatRgb());
        })
        .on("mouseleave", function () {
          d3.select(this)
            .transition().duration(100)
            .attr("fill", color.copy({ opacity: fillOpacity }).formatRgb())
            .attr("stroke", color.copy({ opacity: 0.3 }).formatRgb());
        });

      // Text label
      const padding = 10;
      const availableWidth = cw - padding * 2;
      const availableHeight = ch - 6;

      if (availableWidth > 30 && availableHeight > 14) {
        const fontSize = isRoot ? 13 : isCategory ? 12 : 11;
        const textEl = group.append("text")
          .attr("x", cx + padding)
          .attr("y", cy + (isLeaf ? 16 : 15))
          .attr("font-size", fontSize + "px")
          .attr("font-weight", isLeaf ? "500" : "600")
          .attr("fill", "hsl(var(--foreground))")
          .attr("pointer-events", "none");

        // Truncate if needed
        const name = d.data.name;
        const maxChars = Math.floor(availableWidth / (fontSize * 0.55));
        textEl.text(name.length > maxChars ? name.slice(0, maxChars - 1) + "…" : name);

        // Metadata for leaf nodes when zoomed in
        if (isLeaf && d.data.meta && ch > 50) {
          const meta = d.data.meta;
          let yOffset = cy + 32;
          const metaFontSize = 10;

          const addMeta = (label: string, val: string) => {
            if (yOffset + 14 > cy + ch) return;
            group.append("text")
              .attr("x", cx + padding)
              .attr("y", yOffset)
              .attr("font-size", metaFontSize + "px")
              .attr("fill", "hsl(var(--muted-foreground))")
              .attr("pointer-events", "none")
              .text(() => {
                const full = `${label}: ${val}`;
                const max = Math.floor(availableWidth / (metaFontSize * 0.55));
                return full.length > max ? full.slice(0, max - 1) + "…" : full;
              });
            yOffset += 15;
          };

          if (meta.goal) addMeta("Goal", meta.goal);
          if (meta.algorithm) addMeta("Method", meta.algorithm);
          if (meta.species) addMeta("Species", meta.species);
          if (meta.grant) addMeta("Grant", `${meta.grant}${meta.pis ? " · " + meta.pis : ""}`);
        }
      }
    });
  }, [dimensions]);

  // Initialize
  useEffect(() => {
    const data = buildHierarchy();
    const root = d3.hierarchy(data)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.partition<HierarchyNode>()
      .size([dimensions.width, dimensions.height])
      .padding(2)(root as any);

    rootRef.current = root as any;
    render(focusNode);
  }, [dimensions, buildHierarchy, render, focusNode]);

  const handleBack = () => {
    if (!focusNode) return;
    const parent = focusNode.parent;
    if (parent && parent.depth > 0) {
      setFocusNode(parent);
      setBreadcrumbs(prev => prev.slice(0, -1));
    } else {
      setFocusNode(null);
      setBreadcrumbs(["BBQS Computational Landscape"]);
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-2 mb-3 min-h-[36px]">
        {focusNode && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="h-7 px-2 text-xs gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-border">/</span>}
              <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>

      <svg ref={svgRef} className="w-full rounded-lg border border-border" style={{ height: dimensions.height }} />

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 justify-center px-4">
        {computationalCategories.map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
            />
            <span>{cat.title.replace(/^\d+\.\s*/, "")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
