import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ZODIAC_SIGNS, ZODIAC_GLYPH, ZODIAC_ELEMENT, type ZodiacSign } from "@/lib/zodiac";

type Row = { id: string; name: string; zodiac_sign: ZodiacSign | null };
type Cohort = "R61" | "R34" | null;

const ELEMENT_COLOR: Record<string, string> = {
  Fire: "hsl(12 85% 55%)",
  Earth: "hsl(90 40% 45%)",
  Air: "hsl(200 70% 55%)",
  Water: "hsl(230 60% 55%)",
};

export function ZodiacDistribution() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cohorts, setCohorts] = useState<Record<string, Cohort>>({});
  const [filter, setFilter] = useState<"All" | "R61" | "R34">("All");

  useEffect(() => {
    (async () => {
      const [inv, coh] = await Promise.all([
        supabase.from("investigators").select("id, name, zodiac_sign").limit(500),
        supabase.from("investigator_cohorts").select("investigator_id, cohort").limit(500),
      ]);
      setRows((inv.data ?? []) as Row[]);
      const m: Record<string, Cohort> = {};
      for (const r of (coh.data ?? []) as any[]) m[r.investigator_id] = r.cohort;
      setCohorts(m);
    })();
  }, []);

  const visible = useMemo(
    () => rows.filter((r) => filter === "All" || cohorts[r.id] === filter),
    [rows, cohorts, filter],
  );

  const counts = useMemo(() => {
    const c = new Map<ZodiacSign, Row[]>();
    for (const s of ZODIAC_SIGNS) c.set(s, []);
    for (const r of visible) if (r.zodiac_sign) c.get(r.zodiac_sign as ZodiacSign)?.push(r);
    return c;
  }, [visible]);

  const max = Math.max(1, ...Array.from(counts.values()).map((v) => v.length));
  const totalKnown = visible.filter((r) => r.zodiac_sign).length;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Zodiac distribution</span>
          <div className="inline-flex rounded-md border border-border overflow-hidden text-xs font-normal">
            {(["All", "R61", "R34"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-2 py-1 ${filter === k ? "bg-primary text-primary-foreground" : "bg-background"}`}
              >{k}</button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground mb-3">
          {totalKnown} of {visible.length} investigators have a birthday on file.
        </div>
        <div className="grid grid-cols-12 gap-2 items-end h-40">
          {ZODIAC_SIGNS.map((sign) => {
            const list = counts.get(sign) ?? [];
            const h = (list.length / max) * 100;
            const color = ELEMENT_COLOR[ZODIAC_ELEMENT[sign]];
            return (
              <HoverCard key={sign} openDelay={80}>
                <HoverCardTrigger asChild>
                  <div className="flex flex-col items-center justify-end h-full cursor-default">
                    <div className="text-[10px] text-muted-foreground mb-0.5">{list.length}</div>
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{ height: `${h}%`, minHeight: list.length ? 2 : 0, background: color }}
                    />
                    <div className="text-[10px] mt-1 text-foreground">{ZODIAC_GLYPH[sign]}</div>
                    <div className="text-[9px] text-muted-foreground leading-tight">{sign.slice(0, 3)}</div>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-64 text-xs">
                  <div className="font-semibold mb-1">{ZODIAC_GLYPH[sign]} {sign} · {ZODIAC_ELEMENT[sign]}</div>
                  {list.length === 0 ? (
                    <div className="text-muted-foreground">No investigators</div>
                  ) : (
                    <ul className="space-y-0.5 max-h-56 overflow-y-auto">
                      {list.map((r) => <li key={r.id}>{r.name}</li>)}
                    </ul>
                  )}
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
        <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
          {Object.entries(ELEMENT_COLOR).map(([el, c]) => (
            <span key={el} className="inline-flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: c }} /> {el}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}