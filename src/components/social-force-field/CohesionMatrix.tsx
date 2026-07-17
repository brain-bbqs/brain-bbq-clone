import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-cartesian-dist-min";

const Plot = createPlotlyComponent(Plotly as any);

type Label = { grant_number: string; title: string };

export function CohesionMatrix({ labels, matrix }: { labels: Label[]; matrix: number[][] }) {
  const n = labels.length;
  // Mask the diagonal (self-similarity is always 1 and drowns out real signal).
  const z = matrix.map((row, i) => row.map((v, j) => (i === j ? null : v)));
  // Auto-scale to the actual signal range so faint overlaps remain readable.
  let maxV = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (i !== j && matrix[i][j] > maxV) maxV = matrix[i][j];
  const zmax = Math.max(0.15, Math.ceil(maxV * 20) / 20);
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
            [0, "#0b1220"],
            [0.15, "#3b1d0a"],
            [0.35, "#a3410b"],
            [0.6, "#f59e0b"],
            [0.85, "#fde68a"],
            [1, "#fff7cc"],
          ],
          zmin: 0,
          zmax,
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