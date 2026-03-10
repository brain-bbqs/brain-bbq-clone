import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import {
  type StateRiskRow,
  type BBQSFlags,
  getStateRiskScore,
  RISK_LABEL_META,
} from "@/data/state-privacy-matrix";

// FIPS code → state abbreviation
const FIPS_TO_STATE: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE",
  "11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA",
  "20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN",
  "28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM",
  "36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
  "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA",
  "54":"WV","55":"WI","56":"WY",
};

const RISK_COLORS = [
  "hsl(152, 45%, 42%)", // 0 - compliant
  "hsl(43, 75%, 48%)",  // 1 - consent required
  "hsl(22, 70%, 52%)",  // 2 - restricted sharing
  "hsl(0, 55%, 48%)",   // 3 - requires legal review
];

interface Props {
  matrix: StateRiskRow[];
  flags: BBQSFlags;
  selectedState: string | null;
  onSelectState: (abbr: string) => void;
}

export function USStateMap({ matrix, flags, selectedState, onSelectState }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [topoData, setTopoData] = useState<Topology | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch("/us-states-10m.json")
      .then((r) => r.json())
      .then((data) => setTopoData(data as Topology));
  }, []);

  const scoreMap = useCallback(() => {
    const m = new Map<string, number>();
    for (const row of matrix) {
      m.set(row.state, getStateRiskScore(row, flags));
    }
    return m;
  }, [matrix, flags]);

  useEffect(() => {
    if (!topoData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 960;
    const height = 600;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const states = topojson.feature(
      topoData,
      topoData.objects.states as GeometryCollection
    );

    const projection = d3.geoAlbersUsa().fitSize([width, height], states);
    const path = d3.geoPath().projection(projection);
    const scores = scoreMap();

    const g = svg.append("g");

    g.selectAll("path")
      .data(states.features)
      .join("path")
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        const abbr = FIPS_TO_STATE[d.id];
        const score = abbr ? scores.get(abbr) ?? 0 : 0;
        return RISK_COLORS[score];
      })
      .attr("stroke", (d: any) => {
        const abbr = FIPS_TO_STATE[d.id];
        return abbr === selectedState ? "hsl(var(--foreground))" : "hsl(var(--border))";
      })
      .attr("stroke-width", (d: any) => {
        const abbr = FIPS_TO_STATE[d.id];
        return abbr === selectedState ? 2.5 : 0.5;
      })
      .attr("cursor", "pointer")
      .attr("opacity", (d: any) => {
        const abbr = FIPS_TO_STATE[d.id];
        if (!selectedState) return 1;
        return abbr === selectedState ? 1 : 0.5;
      })
      .on("click", (_, d: any) => {
        const abbr = FIPS_TO_STATE[d.id];
        if (abbr) onSelectState(abbr);
      })
      .on("mouseenter", (event: MouseEvent, d: any) => {
        const abbr = FIPS_TO_STATE[(d as any).id];
        if (abbr) {
          setHoveredState(abbr);
          const svgRect = svgRef.current!.getBoundingClientRect();
          setTooltipPos({
            x: event.clientX - svgRect.left,
            y: event.clientY - svgRect.top - 10,
          });
        }
      })
      .on("mouseleave", () => setHoveredState(null));
  }, [topoData, scoreMap, selectedState, onSelectState]);

  const hoveredRow = hoveredState ? matrix.find((r) => r.state === hoveredState) : null;
  const hoveredScore = hoveredRow ? getStateRiskScore(hoveredRow, flags) : 0;

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full h-auto" />

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
        {(["NO_EXTRA", "LIMITED_EXPORT", "FEDERATED_ONLY", "BLOCKED"] as const).map((label) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: RISK_LABEL_META[label].color }}
            />
            <span>{RISK_LABEL_META[label].text}</span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredState && hoveredRow && (
        <div
          className="absolute z-50 pointer-events-none bg-popover border border-border rounded-lg shadow-xl px-3 py-2 text-xs"
          style={{
            left: Math.min(tooltipPos.x, 600),
            top: tooltipPos.y,
            transform: "translateY(-100%) translateX(-50%)",
          }}
        >
          <div className="font-semibold text-foreground">{hoveredRow.stateName}</div>
          <div className="text-muted-foreground">
            Risk: <span style={{ color: RISK_COLORS[hoveredScore] }} className="font-medium">
              {RISK_LABEL_META[Object.keys(RISK_LABEL_META).find(
                (k) => RISK_LABEL_META[k as keyof typeof RISK_LABEL_META].score === hoveredScore
              ) as keyof typeof RISK_LABEL_META]?.text}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
