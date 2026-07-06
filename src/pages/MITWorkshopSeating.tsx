import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Printer, Utensils, Loader2 } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { SEATING_PLAN, SEATS_PER_TABLE, TABLE_COUNT, TOTAL_SEATS, type Seat, type SeatingTable } from "@/data/mit-workshop-seating";
import { supabase } from "@/integrations/supabase/client";

type Participant = { name: string; institution?: string; role?: string };

const normName = (s: string) => (s || "").toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();

export default function MITWorkshopSeating() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      try {
        const { data } = await supabase.functions.invoke("mit-workshop-participants");
        if (data?.participants) setParticipants(data.participants);
      } catch (e) {
        console.error("Failed to fetch participants:", e);
      } finally {
        setFetching(false);
      }
    })();
  }, [user]);

  // Merge the seeded plan with live registrations, auto-filling open seats.
  const { plan, filled, overflow } = useMemo(() => {
    const seededNames = new Set<string>();
    SEATING_PLAN.forEach((t) => t.seats.forEach((s) => { if (s.name !== "Open seat") seededNames.add(normName(s.name)); }));

    const unseated: Seat[] = participants
      .filter((p) => p.name && !seededNames.has(normName(p.name)))
      .map((p) => ({ name: p.name, institution: p.institution, role: p.role }));

    // Deep clone plan
    const cloned: SeatingTable[] = SEATING_PLAN.map((t) => ({ ...t, seats: t.seats.map((s) => ({ ...s })) }));

    // Fill open seats round-robin across tables to keep them balanced.
    let guard = 0;
    while (unseated.length && guard++ < 1000) {
      let placed = false;
      for (const t of cloned) {
        const idx = t.seats.findIndex((s) => s.name === "Open seat");
        if (idx >= 0 && unseated.length) {
          t.seats[idx] = unseated.shift()!;
          placed = true;
        }
      }
      if (!placed) break;
    }

    const filledCount = cloned.reduce((n, t) => n + t.seats.filter((s) => s.name !== "Open seat").length, 0);
    return { plan: cloned, filled: filledCount, overflow: unseated };
  }, [participants]);

  if (loading || !user) return null;

  return (
    <>
      <PageMeta
        title="MIT Workshop 2026 – Seating Chart | BBQS"
        description="Themed table assignments for the BBQS MIT Workshop, July 15-17, 2026."
      />
      <div className="container max-w-6xl mx-auto py-6 sm:py-10 px-3 sm:px-4 space-y-6 print:py-2 print:px-0">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 print:gap-1">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <LayoutGrid className="h-7 w-7 text-primary" /> Seating Chart
            </h1>
            <p className="text-muted-foreground">
              2<sup>nd</sup> Annual BBQS Workshop · MIT · July 15–17, 2026 ·{" "}
              <span className="font-medium text-foreground">
                {TABLE_COUNT} tables · {SEATS_PER_TABLE} seats each · {filled}/{TOTAL_SEATS} assigned
                {fetching && <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin" />}
              </span>
            </p>
          </div>
          <Button onClick={() => window.print()} variant="outline" size="sm" className="print:hidden gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>

        <p className="text-xs text-muted-foreground print:hidden">
          Tables are grouped by scientific theme to promote cross-project discussion. Registered attendees not in the seed roster are auto-assigned round-robin to keep tables balanced at {SEATS_PER_TABLE} seats. Open seats will fill as more people register (target: {TOTAL_SEATS}).
          {overflow.length > 0 && (
            <span className="block mt-1 text-orange-600 dark:text-orange-400">
              {overflow.length} registered attendee{overflow.length === 1 ? "" : "s"} beyond {TOTAL_SEATS} seats — add another table or reassign.
            </span>
          )}
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-2 print:gap-2">
          {plan.map((table) => {
            const assigned = table.seats.filter((s) => s.name !== "Open seat").length;
            return (
              <Card key={table.number} className="border-primary/20 break-inside-avoid print:shadow-none print:border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {table.number}
                      </span>
                      <span className="truncate">{table.theme}</span>
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {assigned}/{SEATS_PER_TABLE}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Domains: {table.domains}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ol className="space-y-1.5">
                    {table.seats.map((seat, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2 text-xs border-b border-border/40 pb-1.5 last:border-0 ${
                          seat.name === "Open seat" ? "text-muted-foreground/60 italic" : ""
                        }`}
                      >
                        <span className="w-5 shrink-0 tabular-nums text-muted-foreground">{i + 1}.</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground truncate">
                            {seat.name}
                            {seat.role && (
                              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">· {seat.role}</span>
                            )}
                          </div>
                          {seat.institution && (
                            <div className="text-[11px] text-muted-foreground truncate">{seat.institution}</div>
                          )}
                          {seat.dietary && (
                            <div className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-0.5">
                              <Utensils className="h-2.5 w-2.5" /> {seat.dietary}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}