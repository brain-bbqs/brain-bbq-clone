import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { CohesionMatrix } from "./CohesionMatrix";

type Data = {
  labels: { grant_number: string; title: string }[];
  matrix: number[][];
  speciesShared: { species: string; count: number }[];
  themeAlignment: number;
  projects: number;
};

export function RelationalLayer() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: resp, error } = await supabase.functions.invoke("relational-cohesion", { body: {} });
      if (cancel) return;
      if (error) { setErr(error.message); return; }
      if (resp?.error) { setErr(resp.error); return; }
      setData(resp as Data);
    })();
    return () => { cancel = true; };
  }, []);

  if (err) return <div className="p-6 text-sm text-rose-600">Failed to load: {err}</div>;
  if (!data) return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Computing project cohesion…
    </div>
  );

  const maxSpecies = Math.max(1, ...data.speciesShared.map((s) => s.count));

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground max-w-3xl">
        <strong className="text-foreground">Macro layer:</strong> group identity and social cohesion.
        This workshop's identity is <em>cross-species synchronization</em> — the matrix and gauge below show how much the consortium is actually living that theme.
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Theme alignment</CardTitle>
            <CardDescription>Projects sharing ≥1 species with another project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-semibold tabular-nums" style={{ color: "hsl(38 90% 50%)" }}>
              {data.themeAlignment}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              of {data.projects} projects are cross-species connected
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Species covered by ≥2 projects</CardTitle>
            <CardDescription>Shared organisms across the consortium</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.speciesShared.length === 0 && (
              <div className="text-xs text-muted-foreground">No species overlap yet.</div>
            )}
            {data.speciesShared.slice(0, 10).map((s) => (
              <div key={s.species} className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="capitalize w-32 truncate">{s.species}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full" style={{ width: `${(s.count / maxSpecies) * 100}%`, backgroundColor: "hsl(38 90% 50%)" }} />
                  </div>
                </div>
                <span className="tabular-nums text-muted-foreground w-20 text-right">{s.count} projects</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Project-to-project overlap</CardTitle>
          <CardDescription>
            How much any two projects share across species, approaches, sensors, data modalities, analysis methods, and keywords.
            Brighter cells = more overlap. Hover any cell to see the two project titles and their percent overlap. The diagonal
            (a project with itself) is muted so the real signal stands out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CohesionMatrix labels={data.labels} matrix={data.matrix} />
        </CardContent>
      </Card>
    </div>
  );
}