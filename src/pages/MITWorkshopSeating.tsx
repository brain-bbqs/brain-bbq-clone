import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { LayoutGrid, Printer, Utensils, DoorOpen, Presentation, Info } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { SEATING_PLAN, SEATS_PER_TABLE, TABLE_COUNT, TOTAL_SEATS, type Seat, type SeatingTable } from "@/data/mit-workshop-seating";
import { supabase } from "@/integrations/supabase/client";
import { ZODIAC_GLYPH, ZODIAC_ELEMENT, zodiacCompatibility, type ZodiacSign } from "@/lib/zodiac";

/**
 * Layout mirrors the hand-drawn atrium diagram:
 *  - Kitchen + 3189 doorway along the top wall
 *  - Black square tables stacked along the left wall
 *  - 2×8ft tables + presentation chair rows in the mid-left
 *  - Small white cocktail tables in the top-right corner
 *  - 3310 door on the right wall
 *  - Singleton door + 6ft table + stairs along the bottom
 *  - 10 rented Peak round tables (4-4-2) fill the center-right dining area
 */
const SVG_W = 1640;
const SVG_H = 1120;
const TABLE_R = 58;
const SEAT_R = 20;
const SEAT_ORBIT = TABLE_R + 28;

// Explicit centers for each of the 10 Peak round tables (index = table order).
const PEAK_TABLE_CENTERS: { cx: number; cy: number }[] = [
  // Row 1 — 4 tables
  { cx: 720, cy: 280 },
  { cx: 940, cy: 280 },
  { cx: 1160, cy: 280 },
  { cx: 1380, cy: 280 },
  // Row 2 — 4 tables
  { cx: 720, cy: 580 },
  { cx: 940, cy: 580 },
  { cx: 1160, cy: 580 },
  { cx: 1380, cy: 580 },
  // Row 3 — 2 tables (offset toward center-right, matching the diagram)
  { cx: 830, cy: 880 },
  { cx: 1270, cy: 880 },
];

function seatPosition(index: number, total: number, cx: number, cy: number) {
  // Distribute seats evenly around the table, starting at the top.
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return { x: cx + SEAT_ORBIT * Math.cos(angle), y: cy + SEAT_ORBIT * Math.sin(angle), angle };
}

function tableCenter(idx: number) {
  return PEAK_TABLE_CENTERS[idx] ?? { cx: SVG_W / 2, cy: SVG_H / 2 };
}

/** Wrap a theme into up to two lines that fit under a table. */
function wrapTheme(theme: string, maxCharsPerLine = 26): string[] {
  const words = theme.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxCharsPerLine) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
    if (lines.length === 1 && (current + " ").length > maxCharsPerLine) {
      // second line — keep and stop
      lines.push(current);
      return lines;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

export default function MITWorkshopSeating() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<{ table: SeatingTable; seat: Seat; index: number } | null>(null);
  const [zodiacByName, setZodiacByName] = useState<Record<string, ZodiacSign>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("investigators")
        .select("name, zodiac_sign")
        .not("zodiac_sign", "is", null)
        .limit(500);
      const m: Record<string, ZodiacSign> = {};
      for (const r of (data ?? []) as any[]) {
        if (r.name && r.zodiac_sign) m[r.name.toLowerCase()] = r.zodiac_sign;
      }
      setZodiacByName(m);
    })();
  }, [user]);

  const signOf = (name: string): ZodiacSign | null => zodiacByName[name?.toLowerCase()] ?? null;

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const filled = SEATING_PLAN.reduce(
    (n, t) => n + t.seats.filter((s) => s.name !== "Open seat").length,
    0,
  );

  return (
    <>
      <PageMeta
        title="MIT Workshop 2026 – Seating Floor Plan | BBQS"
        description="Interactive floor plan of themed tables for the BBQS MIT Workshop, July 15-17, 2026."
      />
      <div className="container max-w-7xl mx-auto py-6 sm:py-10 px-3 sm:px-4 space-y-6 print:py-2 print:px-0">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 print:gap-1">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <LayoutGrid className="h-7 w-7 text-primary" /> Seating Floor Plan
              <HoverCard openDelay={100} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    aria-label="About the seating floor plan"
                    className="inline-flex items-center justify-center h-6 w-6 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors print:hidden"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 text-sm" side="bottom" align="start">
                  <div className="space-y-2">
                    <div className="font-semibold text-foreground">About this floor plan</div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Each circle is a themed table seating up to {SEATS_PER_TABLE} people, grouped by
                      scientific focus — Brainhack topics, cross-consortium bridges, and young-investigator
                      tracks. The stage sits at the top of the room and the entrance at the bottom.
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Click any seat to see who is assigned. Dimmed seats are still open — assignments are
                      curated manually so PIs, trainees, infra leads, and NIH program officers are mixed
                      intentionally across each table.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </h1>
            <p className="text-muted-foreground">
              2<sup>nd</sup> Annual BBQS Workshop · MIT McGovern Institute · July 15–17, 2026 ·{" "}
              <span className="font-medium text-foreground">
                {TABLE_COUNT} tables · {SEATS_PER_TABLE} seats each · {filled}/{TOTAL_SEATS} assigned
              </span>
            </p>
          </div>
          <Button onClick={() => window.print()} variant="outline" size="sm" className="print:hidden gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>

        <p className="text-xs text-muted-foreground print:hidden">
          Click any seat to view the attendee's details. Assignments are managed manually — open seats fill as you place people. Tables are grouped by scientific theme.
        </p>

        {/* Floor plan */}
        <Card className="border-primary/20 overflow-hidden print:shadow-none">
          <CardContent className="p-3 sm:p-4 bg-[hsl(var(--muted))]/40">
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full h-auto min-w-[720px] max-w-full"
                role="img"
                aria-label="Workshop seating floor plan"
              >
                {/* Room outline */}
                <rect
                  x={20}
                  y={20}
                  width={SVG_W - 40}
                  height={SVG_H - 40}
                  rx={18}
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--border))"
                  strokeWidth={2}
                />

                {/* --- Atrium fixtures (mirrors the hand-drawn set-up diagram) --- */}
                {/* Kitchen (top-left) */}
                <g>
                  <rect x={90} y={30} width={200} height={44} rx={4}
                    fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth={1.5} />
                  <text x={190} y={58} textAnchor="middle"
                    className="fill-muted-foreground" style={{ fontSize: 14, letterSpacing: 1 }}>
                    KITCHEN
                  </text>
                </g>

                {/* Doorway 3189 (top-center) */}
                <g>
                  <rect x={430} y={30} width={220} height={20} rx={2}
                    fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <text x={540} y={72} textAnchor="middle"
                    className="fill-muted-foreground" style={{ fontSize: 12 }}>
                    3189
                  </text>
                </g>

                {/* Small white cocktail tables (top-right corner) */}
                <g>
                  {[
                    { cx: 1470, cy: 130 }, { cx: 1560, cy: 130 },
                    { cx: 1470, cy: 220 }, { cx: 1560, cy: 220 },
                  ].map((p, i) => (
                    <circle key={i} cx={p.cx} cy={p.cy} r={22}
                      fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth={1.5} />
                  ))}
                  <text x={1515} y={80} textAnchor="middle"
                    className="fill-muted-foreground" style={{ fontSize: 11 }}>
                    small white tables
                  </text>
                </g>

                {/* Black square tables (left wall) */}
                <g>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <rect key={i} x={30} y={130 + i * 44} width={44} height={40} rx={2}
                      fill="hsl(var(--foreground))" opacity={0.75} />
                  ))}
                  <text x={100} y={230} className="fill-muted-foreground" style={{ fontSize: 11 }}>
                    black square tables
                  </text>
                </g>

                {/* 2 × 8ft tables (mid-left, presentation front) */}
                <g>
                  <rect x={280} y={440} width={70} height={110} rx={3}
                    fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth={1.5} />
                  <rect x={280} y={560} width={70} height={110} rx={3}
                    fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth={1.5} />
                  <text x={315} y={430} textAnchor="middle"
                    className="fill-muted-foreground" style={{ fontSize: 11 }}>
                    2 × 8ft tables
                  </text>
                </g>

                {/* Presentation chair rows (the row of C's — chairs facing the 8ft tables) */}
                <g>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const y = 380 + i * 60;
                    return (
                      <g key={i}>
                        {/* two chairs per row facing left */}
                        <path d={`M 470 ${y} a 12 12 0 1 0 0 24`}
                          fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
                        <path d={`M 510 ${y} a 12 12 0 1 0 0 24`}
                          fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
                      </g>
                    );
                  })}
                </g>

                {/* 3310 door (right wall) */}
                <g>
                  <rect x={SVG_W - 60} y={500} width={20} height={110} rx={2}
                    fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <text x={SVG_W - 30} y={560} textAnchor="middle"
                    className="fill-muted-foreground" style={{ fontSize: 12 }}
                    transform={`rotate(90 ${SVG_W - 30} 560)`}>
                    3310
                  </text>
                </g>

                {/* Singleton door (bottom-left) */}
                <g>
                  <rect x={40} y={SVG_H - 90} width={90} height={22} rx={2}
                    fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
                  <text x={85} y={SVG_H - 45} textAnchor="middle"
                    className="fill-muted-foreground" style={{ fontSize: 11 }}>
                    singleton
                  </text>
                </g>

                {/* 6ft table (bottom center-left, near stairs entry) */}
                <g>
                  <rect x={330} y={SVG_H - 110} width={110} height={40} rx={3}
                    fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth={1.5} />
                  <text x={385} y={SVG_H - 40} textAnchor="middle"
                    className="fill-muted-foreground" style={{ fontSize: 11 }}>
                    6 ft
                  </text>
                </g>

                {/* Stairs to downstairs (bottom-right, arc) */}
                <g>
                  <path d={`M 500 ${SVG_H - 80} Q ${SVG_W / 2 + 100} ${SVG_H - 20} ${SVG_W - 40} ${SVG_H - 120}`}
                    fill="none" stroke="hsl(var(--border))" strokeWidth={2} />
                  <text x={SVG_W / 2 + 180} y={SVG_H - 40} textAnchor="middle"
                    className="fill-muted-foreground" style={{ fontSize: 12, letterSpacing: 1 }}>
                    stairs to downstairs
                  </text>
                </g>
                {/* --- end atrium fixtures --- */}

                {/* Tables */}
                {SEATING_PLAN.map((table, tIdx) => {
                  const { cx, cy } = tableCenter(tIdx);
                  return (
                    <g key={table.number}>
                      {/* Table circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={TABLE_R}
                        fill="hsl(var(--card))"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                      />
                      <text
                        x={cx}
                        y={cy - 4}
                        textAnchor="middle"
                        className="fill-foreground font-bold"
                        style={{ fontSize: 22 }}
                      >
                        T{table.number}
                      </text>
                      <text
                        x={cx}
                        y={cy + 16}
                        textAnchor="middle"
                        className="fill-muted-foreground"
                        style={{ fontSize: 10, letterSpacing: 0.5 }}
                      >
                        {table.domains}
                      </text>
                      {/* Theme label under table — larger, wrapped, on a subtle pill */}
                      {(() => {
                        const lines = wrapTheme(table.theme);
                        const labelY = cy + SEAT_ORBIT + SEAT_R + 22;
                        const pillH = lines.length === 2 ? 42 : 26;
                        const pillW = 210;
                        return (
                          <g>
                            <rect
                              x={cx - pillW / 2}
                              y={labelY - 16}
                              width={pillW}
                              height={pillH}
                              rx={pillH / 2}
                              fill="hsl(var(--primary))"
                              fillOpacity={0.1}
                              stroke="hsl(var(--primary))"
                              strokeOpacity={0.35}
                              strokeWidth={1}
                            />
                            {lines.map((line, i) => (
                              <text
                                key={i}
                                x={cx}
                                y={labelY + (lines.length === 2 ? i * 14 : 2)}
                                textAnchor="middle"
                                className="fill-foreground"
                                style={{ fontSize: 13, fontWeight: 600 }}
                              >
                                {line}
                              </text>
                            ))}
                          </g>
                        );
                      })()}

                      {/* Seats */}
                      {table.seats.map((seat, sIdx) => {
                        const { x, y } = seatPosition(sIdx, SEATS_PER_TABLE, cx, cy);
                        const open = seat.name === "Open seat";
                        const isSelected =
                          selected?.table.number === table.number && selected?.index === sIdx;
                        const initials = open
                          ? "+"
                          : seat.name
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((p) => p[0])
                              .join("")
                              .toUpperCase();
                        return (
                          <g
                            key={sIdx}
                            className="cursor-pointer"
                            onClick={() => setSelected({ table, seat, index: sIdx })}
                          >
                            <title>
                              {open ? `Table ${table.number} — Seat ${sIdx + 1} (open)` : `${seat.name}${seat.institution ? " · " + seat.institution : ""}`}
                            </title>
                            <circle
                              cx={x}
                              cy={y}
                              r={SEAT_R}
                              fill={open ? "hsl(var(--muted))" : "hsl(var(--primary))"}
                              fillOpacity={open ? 0.5 : 0.9}
                              stroke={isSelected ? "hsl(var(--ring))" : "hsl(var(--border))"}
                              strokeWidth={isSelected ? 3 : 1.5}
                            />
                            <text
                              x={x}
                              y={y + 4}
                              textAnchor="middle"
                              style={{ fontSize: 10, fontWeight: 600 }}
                              className={open ? "fill-muted-foreground" : "fill-primary-foreground"}
                            >
                              {initials}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-primary" /> Assigned
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-muted border border-border" /> Open seat
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Presentation className="h-3.5 w-3.5" /> Stage at top of room
              </span>
              <span className="inline-flex items-center gap-1.5">
                <DoorOpen className="h-3.5 w-3.5" /> Entrance at bottom
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Seat details — inline banner above roster, only when a seat is picked */}
        {selected && (
          <Card className="border-primary/40 bg-primary/5 print:hidden">
            <CardContent className="p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary">Table {selected.table.number}</Badge>
                <Badge variant="outline">Seat {selected.index + 1}</Badge>
                <span className="text-xs text-muted-foreground">{selected.table.theme}</span>
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-foreground">{selected.seat.name}</div>
                <div className="text-xs text-muted-foreground">
                  {[selected.seat.institution, selected.seat.role].filter(Boolean).join(" · ")}
                  {selected.seat.grants ? ` · ${selected.seat.grants}` : ""}
                </div>
              </div>
              {signOf(selected.seat.name) && (
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-foreground">
                  {ZODIAC_GLYPH[signOf(selected.seat.name)!]} {signOf(selected.seat.name)} · {ZODIAC_ELEMENT[signOf(selected.seat.name)!]}
                </span>
              )}
              {signOf(selected.seat.name) && (() => {
                const s = signOf(selected.seat.name)!;
                const tablemates = selected.table.seats
                  .filter((o, i) => i !== selected.index && o.name !== "Open seat")
                  .map((o) => ({ name: o.name, sign: signOf(o.name) }))
                  .filter((o) => o.sign);
                if (tablemates.length === 0) return null;
                const avg = tablemates.reduce((a, b) => a + zodiacCompatibility(s, b.sign!), 0) / tablemates.length;
                const label = avg >= 0.75 ? "High" : avg >= 0.35 ? "Mixed" : "Low";
                return (
                  <span className="text-xs text-muted-foreground">
                    Table zodiac fit: <span className="font-semibold text-foreground">{label}</span> ({(avg * 100).toFixed(0)}%)
                  </span>
                );
              })()}
              {selected.seat.dietary && (
                <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Utensils className="h-3 w-3" /> {selected.seat.dietary}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-xs"
                onClick={() => setSelected(null)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Compact roster per table for quick scanning — full-width, balanced grid */}
        <div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {SEATING_PLAN.map((table) => {
              const assigned = table.seats.filter((s) => s.name !== "Open seat").length;
              return (
                <Card key={table.number} className="border-primary/20 break-inside-avoid print:shadow-none print:border">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm flex items-start gap-2 min-w-0 flex-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {table.number}
                        </span>
                        <span className="leading-snug break-words">{table.theme}</span>
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {assigned}/{SEATS_PER_TABLE}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ol className="space-y-0.5 text-[11px]">
                      {table.seats.map((seat, i) => (
                        <li
                          key={i}
                          className={`flex gap-1.5 ${seat.name === "Open seat" ? "text-muted-foreground/60 italic" : "text-foreground"}`}
                        >
                          <span className="w-4 shrink-0 tabular-nums text-muted-foreground">{i + 1}.</span>
                          <span className="truncate">{seat.name}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}