import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-basic-dist-min";

const Plot = createPlotlyComponent(Plotly as any);

type Label = { grant_number: string; title: string };

export function CohesionMatrix({ labels, matrix }: { labels: Label[]; matrix: number[][] }) {
  const n = labels.length;
  // Mask the diagonal (self-similarity is always 1 and drowns out real signal).
  const z = matrix.map((row, i) => row.map((v, j) => (i === j ? null : v)));
  const tickvals = labels.map((_, i) => i);
  const ticktext = labels.map((l) => l.grant_number);
  const titles = labels.map((l) => l.title);
  const customdata = labels.map((_, i) => labels.map((_, j) => [titles[i], titles[j]]));

  return (
    <Plot
      data={[
        {
          type: "heatmap",
          z: z as any,
          x: tickvals,
          y: tickvals,
          customdata: customdata as any,
          hovertemplate:
            "<b>%{customdata[0]}</b><br>×<br><b>%{customdata[1]}</b><br>shared = %{z:.0%}<extra></extra>",
          colorscale: [
            [0, "#1e293b"],
            [0.25, "#7c2d12"],
            [0.5, "#c2410c"],
            [0.75, "#f59e0b"],
            [1, "#fde68a"],
          ],
          zmin: 0,
          zmax: 0.5,
          colorbar: {
            title: { text: "Shared", font: { color: "#e2e8f0", size: 12 } },
            tickformat: ".0%",
            tickfont: { color: "#e2e8f0", size: 11 },
            outlinewidth: 0,
            thickness: 12,
            len: 0.9,
          },
          xgap: 1,
          ygap: 1,
        } as any,
      ]}
      layout={{
        height: Math.max(600, n * 22 + 160),
        margin: { l: 130, r: 40, t: 100, b: 40 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { color: "#e2e8f0", size: 11 },
        xaxis: {
          side: "top",
          tickvals,
          ticktext,
          tickangle: -55,
          tickfont: { family: "ui-monospace, SFMono-Regular, monospace", size: 10, color: "#f1f5f9" },
          showgrid: false,
          zeroline: false,
        },
        yaxis: {
          autorange: "reversed",
          tickvals,
          ticktext,
          tickfont: { family: "ui-monospace, SFMono-Regular, monospace", size: 10, color: "#f1f5f9" },
          showgrid: false,
          zeroline: false,
          automargin: true,
        },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}