import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-basic-dist-min";

const Plot = createPlotlyComponent(Plotly as any);

type Summary = { summary: string; n_grants: number; generated_at: string };
type SummaryResp = Record<"R61" | "R34", Summary>;

type AttentionData = {
  projectClicks?: { grant_number: string; title: string | null; count: number }[];
};

const COHORTS = [
  { key: "R61" as const, title: "R61 · Translational Neural Devices", hue: 200 },
  { key: "R34" as const, title: "R34 · Animal Behavior & Collective Intelligence", hue: 30 },
];

export function CognitiveLayer() {
  const [summaries, setSummaries] = useState<SummaryResp | null>(null);
  const [attention, setAttention] = useState<AttentionData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const [s, a] = await Promise.all([
        supabase.functions.invoke("cohort-mental-model-summary", { body: {} }),
        supabase.functions.invoke("analytics-summary", { body: {} }),
      ]);
      if (cancel) return;
      if (s.error) setErr(s.error.message);
      else setSummaries(s.data as SummaryResp);
      if (!a.error) setAttention(a.data as AttentionData);
    })();
    return () => { cancel = true; };
  }, []);

  const maxClicks = Math.max(1, ...(attention?.projectClicks ?? []).map((p) => p.count));

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground max-w-3xl">
        <strong className="text-foreground">Meso layer:</strong> shared mental models (grant abstracts, synthesized by AI)
        and shared attention (where consortium members actually go on the platform).
      </div>

      {err && <div className="p-3 text-sm text-rose-600">Summary error: {err}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {COHORTS.map((c) => {
          const s = summaries?.[c.key];
          return (
            <Card key={c.key}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(${c.hue} 75% 55%)` }} />
                  {c.title}
                </CardTitle>
                <CardDescription>
                  Shared mental model{s?.n_grants ? ` — synthesized from ${s.n_grants} grant abstracts` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!s ? (
                  <div className="text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Reading abstracts…
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{s.summary || "No abstracts available yet."}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Shared attention — which projects people actually visit</CardTitle>
          <CardDescription>Aggregate clicks + page opens per project across all consortium users</CardDescription>
        </CardHeader>
        <CardContent>
          {!attention?.projectClicks?.length ? (
            <div className="text-xs text-muted-foreground">
              No project attention captured yet — this list populates once consortium members start opening project pages.
            </div>
          ) : (() => {
            const rows = [...(attention?.projectClicks ?? [])].slice(0, 20).reverse();
            const y = rows.map((p) => `${p.grant_number}`);
            const x = rows.map((p) => p.count);
            const labels = rows.map((p) => p.title || "—");
            return (
              <Plot
                data={[{
                  type: "bar",
                  orientation: "h",
                  x,
                  y,
                  text: x.map(String),
                  textposition: "outside",
                  customdata: labels,
                  hovertemplate: "<b>%{y}</b><br>%{customdata}<br>%{x} hits<extra></extra>",
                  marker: { color: "hsl(var(--primary))" },
                }]}
                layout={{
                  height: Math.max(320, rows.length * 26 + 60),
                  margin: { l: 110, r: 40, t: 10, b: 40 },
                  paper_bgcolor: "transparent",
                  plot_bgcolor: "transparent",
                  font: { color: "hsl(var(--foreground))", size: 11 },
                  xaxis: { title: { text: "Clicks + page opens" }, gridcolor: "hsl(var(--border))", zeroline: false },
                  yaxis: { automargin: true, tickfont: { family: "ui-monospace, SFMono-Regular, monospace" } },
                  bargap: 0.25,
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: "100%" }}
                useResizeHandler
              />
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}