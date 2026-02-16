import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectRow {
  grantNumber: string;
  title: string;
  institution: string;
  awardAmount: number;
  publicationCount: number;
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-xl px-3 py-2 text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-muted-foreground">
          {entry.name}: <span className="font-mono text-foreground font-medium">
            ${(entry.value / 1000000).toFixed(2)}M
          </span>
        </p>
      ))}
    </div>
  );
};

const PubTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-xl px-3 py-2 text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-muted-foreground">
          {entry.name}: <span className="font-mono text-foreground font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export const FundingCharts = ({ data }: FundingChartsProps) => {
  const fundingByInstitution = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      const short = shortenInstitution(d.institution);
      map.set(short, (map.get(short) || 0) + d.awardAmount);
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [data]);

  const fundingByType = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    data.forEach((d) => {
      const type = d.grantNumber.match(/[A-Z]\d+/)?.[0] || "Other";
      const existing = map.get(type) || { amount: 0, count: 0 };
      map.set(type, { amount: existing.amount + d.awardAmount, count: existing.count + 1 });
    });
    return Array.from(map.entries())
      .map(([name, { amount, count }]) => ({ name: `${name} (${count})`, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [data]);

  const pubsByInstitution = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      const short = shortenInstitution(d.institution);
      map.set(short, (map.get(short) || 0) + d.publicationCount);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-foreground">
            Funding by Institution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fundingByInstitution}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Funding" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {fundingByInstitution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-foreground">
            Funding by Grant Mechanism
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fundingByType}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Funding" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {fundingByType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-foreground">
            Publications by Institution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pubsByInstitution}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<PubTooltip />} />
                <Bar dataKey="count" name="Publications" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {pubsByInstitution.map((_, i) => (
                    <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
