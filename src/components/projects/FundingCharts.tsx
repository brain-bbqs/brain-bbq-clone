import { useMemo, useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
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
  "hsl(250, 55%, 60%)",
  "hsl(330, 55%, 55%)",
  "hsl(100, 50%, 40%)",
  "hsl(15, 75%, 55%)",
  "hsl(210, 55%, 55%)",
  "hsl(290, 45%, 50%)",
  "hsl(75, 60%, 42%)",
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
    "SEATTLE CHILDREN'S HOSPITAL": "Seattle Children's",
    "UTAH STATE UNIVERSITY": "Utah State",
  };
  return map[name] || name.split(" ").slice(0, 2).join(" ");
};

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, name, index,
}: any) => {
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--foreground))"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={percent < 0.03 ? 9 : 11}
      fontWeight={500}
    >
      {name}
    </text>
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
          <div style={{ height: 550 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={160}
                  dataKey="value"
                  paddingAngle={1.5}
                  label={renderCustomLabel}
                  labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                  isAnimationActive={true}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
