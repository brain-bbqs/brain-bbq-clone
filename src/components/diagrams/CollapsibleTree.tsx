import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { TreeNode } from "@/data/computational-models";

interface CollapsibleTreeProps {
  data: TreeNode;
  width?: number;
}

interface HierarchyNodeExtra extends d3.HierarchyNode<TreeNode> {
  _children?: HierarchyNodeExtra[] | null;
  x0?: number;
  y0?: number;
  _id?: number;
}

export function CollapsibleTree({ data, width = 928 }: CollapsibleTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: TreeNode } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const marginTop = 10;
    const marginRight = 10;
    const marginBottom = 10;
    const marginLeft = 60;

    const root = d3.hierarchy<TreeNode>(data) as HierarchyNodeExtra;
    const dx = 28;
    const dy = (width - marginRight - marginLeft) / (1 + root.height);

    const treeLayout = d3.tree<TreeNode>().nodeSize([dx, dy]);
    const diagonal = d3.linkHorizontal<any, any>().x((d: any) => d.y).y((d: any) => d.x);

    const gLink = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--muted-foreground))")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 1.5);

    const gNode = svg.append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

    function update(source: HierarchyNodeExtra) {
      const duration = 250;
      const nodes = root.descendants().reverse() as HierarchyNodeExtra[];
      const links = root.links();

      treeLayout(root as any);

      let left = root;
      let right = root;
      root.eachBefore((node: any) => {
        if (node.x < (left as any).x) left = node;
        if (node.x > (right as any).x) right = node;
      });

      const height = (right as any).x - (left as any).x + marginTop + marginBottom;

      const transition = svg.transition()
        .duration(duration)
        .attr("height", height)
        .attr("viewBox", `${-marginLeft} ${(left as any).x - marginTop} ${width} ${height}` as any);

      // Nodes
      const node = gNode.selectAll<SVGGElement, HierarchyNodeExtra>("g")
        .data(nodes, (d: any) => d.id);

      const nodeEnter = node.enter().append("g")
        .attr("transform", () => `translate(${source.y0},${source.x0})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", (_event: any, d: HierarchyNodeExtra) => {
          d.children = d.children ? null : (d._children as any);
          update(d);
        })
        .on("mouseenter", (event: MouseEvent, d: HierarchyNodeExtra) => {
          if (d.data.meta) {
            const rect = containerRef.current?.getBoundingClientRect();
            setTooltip({
              x: event.clientX - (rect?.left || 0),
              y: event.clientY - (rect?.top || 0),
              node: d.data,
            });
          }
        })
        .on("mouseleave", () => setTooltip(null));

      nodeEnter.append("circle")
        .attr("r", 4)
        .attr("fill", (d: any) => d._children ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))")
        .attr("stroke", "hsl(var(--primary))")
        .attr("stroke-width", 1.5);

      nodeEnter.append("text")
        .attr("dy", "0.31em")
        .attr("x", (d: any) => d._children ? -8 : 8)
        .attr("text-anchor", (d: any) => d._children ? "end" : "start")
        .text((d: any) => d.data.name)
        .attr("fill", "hsl(var(--foreground))")
        .attr("font-size", "12px")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .attr("stroke", "hsl(var(--background))")
        .attr("paint-order", "stroke");

      node.merge(nodeEnter as any).transition(transition as any)
        .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

      node.exit().transition(transition as any).remove()
        .attr("transform", () => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

      // Links
      const link = gLink.selectAll<SVGPathElement, any>("path")
        .data(links, (d: any) => d.target.id);

      const linkEnter = link.enter().append("path")
        .attr("d", () => {
          const o = { x: source.x0!, y: source.y0! };
          return diagonal({ source: o, target: o } as any);
        });

      link.merge(linkEnter as any).transition(transition as any)
        .attr("d", diagonal as any);

      link.exit().transition(transition as any).remove()
        .attr("d", () => {
          const o = { x: (source as any).x, y: (source as any).y };
          return diagonal({ source: o, target: o } as any);
        });

      root.eachBefore((d: any) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Initial state
    root.x0 = dx / 2;
    root.y0 = 0;
    let i = 0;
    root.eachBefore((d: any) => {
      d.id = i++;
      d._children = d.children;
      // Start collapsed — only root expanded
      if (d.depth > 0) d.children = null;
    });

    update(root);
  }, [data, width]);

  return (
    <div ref={containerRef} className="relative overflow-x-auto">
      <svg ref={svgRef} width={width} style={{ maxWidth: "100%", height: "auto", minHeight: 80 }} />
      {tooltip && (
        <div
          className="absolute z-50 bg-card border border-border rounded-lg shadow-xl p-3 max-w-xs pointer-events-none text-sm"
          style={{ left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth || 600) - 280), top: tooltip.y - 10 }}
        >
          <p className="font-semibold text-foreground mb-1">{tooltip.node.name}</p>
          {tooltip.node.meta?.species && (
            <p><span className="text-muted-foreground">Species: </span>{tooltip.node.meta.species}</p>
          )}
          {tooltip.node.meta?.goal && (
            <p><span className="text-muted-foreground">Goal: </span>{tooltip.node.meta.goal}</p>
          )}
          {tooltip.node.meta?.algorithm && (
            <p><span className="text-muted-foreground">Algorithm: </span>{tooltip.node.meta.algorithm}</p>
          )}
          {tooltip.node.meta?.grant && (
            <p><span className="text-muted-foreground">Grant: </span>{tooltip.node.meta.grant}</p>
          )}
          {tooltip.node.meta?.pis && (
            <p><span className="text-muted-foreground">PIs: </span>{tooltip.node.meta.pis}</p>
          )}
        </div>
      )}
    </div>
  );
}
