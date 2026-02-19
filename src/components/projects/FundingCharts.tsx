import { useMemo, useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectRow {
  grantNumber: string;
  title: string;
  institution: string;
  awardAmount: number;
  publicationCount: number;
  contactPi: string;
}

interface FundingChartsProps {
  data: ProjectRow[];
}

const COLORS = [
  "hsl(229, 60%, 50%)",
  "hsl(262, 50%, 55%)",
  "hsl(38, 90%, 50%)",
  "hsl(160, 60%, 40%)",
  "hsl(350, 60%, 50%)",
  "hsl(200, 70%, 50%)",
  "hsl(280, 50%, 55%)",
  "hsl(20, 80%, 50%)",
  "hsl(170, 50%, 45%)",
  "hsl(310, 45%, 50%)",
  "hsl(45, 80%, 50%)",
  "hsl(190, 60%, 45%)",
  "hsl(0, 65%, 50%)",
  "hsl(120, 45%, 45%)",
  "hsl(60, 70%, 45%)",
];

const shortenInstitution = (name: string): string => {
  const map: Record<string, string> = {
    "GEORGIA INSTITUTE OF TECHNOLOGY": "Georgia Tech",
    "CARNEGIE-MELLON UNIVERSITY": "Carnegie Mellon",
    "NEW YORK UNIVERSITY": "NYU",
    "NEW YORK UNIVERSITY SCHOOL OF MEDICINE": "NYU Medicine",
    "UNIVERSITY OF PENNSYLVANIA": "UPenn",
    "UNIVERSITY OF FLORIDA": "U Florida",
    "DUKE UNIVERSITY": "Duke",
    "ICAHN SCHOOL OF MEDICINE AT MOUNT SINAI": "Mt Sinai",
    "NORTHWESTERN UNIVERSITY AT CHICAGO": "Northwestern",
    "RICE UNIVERSITY": "Rice",
    "HARVARD UNIVERSITY": "Harvard",
    "MICHIGAN STATE UNIVERSITY": "Michigan State",
    "UNIVERSITY OF MICHIGAN AT ANN ARBOR": "U Michigan",
    "UNIVERSITY OF CALIFORNIA BERKELEY": "UC Berkeley",
    "UNIVERSITY OF CALIFORNIA LOS ANGELES": "UCLA",
    "COLUMBIA UNIVERSITY HEALTH SCIENCES": "Columbia",
    "UNIVERSITY OF SOUTHERN CALIFORNIA": "USC",
    "YALE UNIVERSITY": "Yale",
    "MASSACHUSETTS INSTITUTE OF TECHNOLOGY": "MIT",
    "JOHNS HOPKINS UNIVERSITY": "Johns Hopkins",
    "EMORY UNIVERSITY": "Emory",
  };
  return map[name] || name.split(" ").slice(0, 2).join(" ");
};

const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 14} textAnchor="middle" fill="hsl(var(--foreground))" className="text-sm font-semibold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">
        ${(value / 1_000_000).toFixed(2)}M
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">
        {payload.grants} grant{payload.grants !== 1 ? "s" : ""} · {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg shadow-xl px-4 py-3 text-xs max-w-xs">
      <p className="font-semibold text-foreground mb-1">{d.fullName}</p>
      <p className="text-muted-foreground">
        Funding: <span className="font-mono text-foreground font-medium">${(d.value / 1_000_000).toFixed(2)}M</span>
      </p>
      <p className="text-muted-foreground">
        Grants: <span className="text-foreground font-medium">{d.grants}</span>
      </p>
      {d.grantList && (
        <div className="mt-2 pt-2 border-t border-border space-y-0.5">
          {d.grantList.map((g: string, i: number) => (
            <p key={i} className="text-muted-foreground">• {g}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export const FundingCharts = ({ data }: FundingChartsProps) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const pieData = useMemo(() => {
    const map = new Map<string, { amount: number; grants: string[]; fullName: string }>();
    data.forEach((d) => {
      const short = shortenInstitution(d.institution);
      const existing = map.get(short) || { amount: 0, grants: [], fullName: d.institution };
      const grantType = d.grantNumber.match(/[A-Z]\d+/)?.[0] || d.grantNumber.substring(0, 3);
      existing.amount += d.awardAmount;
      existing.grants.push(`${grantType} — ${d.contactPi}`);
      map.set(short, existing);
    });
    return Array.from(map.entries())
      .map(([name, { amount, grants, fullName }]) => ({
        name,
        value: amount,
        grants: grants.length,
        grantList: grants,
        fullName,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  if (data.length === 0) return null;

  return (
    <div className="mb-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-foreground">
            Funding by Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <div style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
