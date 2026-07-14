import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";

type PersonRow = {
  investigator_id: string;
  full_name: string;
  big_five: Record<string, number>;
  hexaco: Record<string, number>;
  token_count: number;
  matched_count: number;
};

const BF_LABELS: Record<string, { label: string; hue: number }> = {
  e: { label: "Extraversion", hue: 200 },
  a: { label: "Agreeableness", hue: 140 },
  c: { label: "Conscientiousness", hue: 40 },
  s: { label: "Stability", hue: 280 },
  o: { label: "Openness", hue: 340 },
};

const HX_LABELS: Record<string, { label: string; hue: number }> = {
  h: { label: "Honesty–Humility", hue: 20 },
  e: { label: "Emotionality", hue: 260 },
  x: { label: "Extraversion", hue: 200 },
  a: { label: "Agreeableness", hue: 140 },
  c: { label: "Conscientiousness", hue: 40 },
  o: { label: "Openness", hue: 340 },
};

export function PersonalityBoard() {
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<"bigfive" | "hexaco">("hexaco");
  const autoRan = useRef(false);

  useEffect(() => { void reload(); }, []);

  async function reload() {
    setLoading(true);
    const { data: scores } = await supabase
      .from("personality_scores")
      .select("investigator_id, big_five, hexaco, token_count, matched_count")
      .order("matched_count", { ascending: false });
    const ids = (scores ?? []).map((s: any) => s.investigator_id);
    let nameMap = new Map<string, string>();
    if (ids.length) {
      const { data: invs } = await supabase
        .from("investigators").select("id, name").in("id", ids);
      nameMap = new Map((invs ?? []).map((i: any) => [i.id, i.name]));
    }
    setRows((scores ?? []).map((s: any) => ({
      ...s,
      full_name: nameMap.get(s.investigator_id) ?? "—",
    })));
    setLoading(false);

    // Auto-run scoring in the background if the table is empty. Silent.
    if ((scores ?? []).length === 0 && !autoRan.current) {
      autoRan.current = true;
      void supabase.functions.invoke("personality-score-worker", { body: {} })
        .then(({ error }) => { if (!error) void reload(); });
    }
  }

  const labels = model === "bigfive" ? BF_LABELS : HX_LABELS;
  const keys = Object.keys(labels);

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Personality signals · admin-only
          </CardTitle>
          <CardDescription>
            Big Five &amp; HEXACO trait scores per investigator, derived from their grant &amp;
            publication text using the Roivainen (2022) age-of-acquisition adjective lexicon.
            Purpose is coordination, never evaluation. Do not share out.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
            <button
              onClick={() => setModel("hexaco")}
              className={`px-2 py-1 ${model === "hexaco" ? "bg-primary text-primary-foreground" : "bg-background"}`}
            >HEXACO</button>
            <button
              onClick={() => setModel("bigfive")}
              className={`px-2 py-1 ${model === "bigfive" ? "bg-primary text-primary-foreground" : "bg-background"}`}
            >Big Five</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          {keys.map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: `hsl(${labels[k].hue} 70% 55%)` }}
              />
              <span className="text-muted-foreground">{labels[k].label}</span>
            </span>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
            First-time scoring in progress — reading grant &amp; publication text for all investigators…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {rows.map((r) => {
              const scores = (model === "bigfive" ? r.big_five : r.hexaco) ?? {};
              const max = Math.max(0.01, ...keys.map((k) => Number(scores[k]) || 0));
              return (
                <div key={r.investigator_id} className="rounded border border-border bg-card p-2.5">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="text-sm font-medium truncate" title={r.full_name}>{r.full_name}</div>
                    <div className="text-[10px] text-muted-foreground tabular-nums shrink-0 ml-2">
                      {r.matched_count} hits
                    </div>
                  </div>
                  <div className="space-y-1">
                    {keys.map((k) => {
                      const v = Number(scores[k]) || 0;
                      const pct = (v / max) * 100;
                      return (
                        <div key={k} className="flex items-center gap-1.5">
                          <div className="w-3 text-[10px] uppercase text-muted-foreground tabular-nums">{k}</div>
                          <div className="flex-1 h-2 rounded-sm bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-sm transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: `hsl(${labels[k].hue} 70% 55%)`,
                              }}
                            />
                          </div>
                          <div className="w-8 text-[10px] tabular-nums text-right text-muted-foreground">
                            {v.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}