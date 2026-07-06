import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Printer, Utensils, DoorOpen, Presentation } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { SEATING_PLAN, SEATS_PER_TABLE, TABLE_COUNT, TOTAL_SEATS, type Seat, type SeatingTable } from "@/data/mit-workshop-seating";

/** Layout tuning (SVG user units). 4-4-2 row layout. */
const ROW_LAYOUT = [4, 4, 2];
const CELL_W = 320;
const CELL_H = 300;
const MARGIN_X = 60;
const MARGIN_TOP = 140; // room for stage
const MARGIN_BOTTOM = 90; // room for entrance
const TABLE_R = 58;
const SEAT_R = 20;
const SEAT_ORBIT = TABLE_R + 28;

const MAX_COLS = Math.max(...ROW_LAYOUT);
const SVG_W = MARGIN_X * 2 + CELL_W * MAX_COLS;
const SVG_H = MARGIN_TOP + MARGIN_BOTTOM + CELL_H * ROW_LAYOUT.length;

function seatPosition(index: number, total: number, cx: number, cy: number) {
  // Distribute seats evenly around the table, starting at the top.
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return { x: cx + SEAT_ORBIT * Math.cos(angle), y: cy + SEAT_ORBIT * Math.sin(angle), angle };
}

function tableCenter(idx: number) {
  // Walk ROW_LAYOUT to find (row, col) for a linear table index.
  let remaining = idx;
  let row = 0;
  for (; row < ROW_LAYOUT.length; row++) {
    if (remaining < ROW_LAYOUT[row]) break;
    remaining -= ROW_LAYOUT[row];
  }
  const col = remaining;
  const rowCount = ROW_LAYOUT[row];
  // Center each row horizontally within the SVG.
  const rowWidth = CELL_W * rowCount;
  const rowStart = (SVG_W - rowWidth) / 2;
  return {
    cx: rowStart + CELL_W * col + CELL_W / 2,
    cy: MARGIN_TOP + CELL_H * row + CELL_H / 2,
  };
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

                {/* Stage / podium */}
                <g>
                  <rect
                    x={SVG_W / 2 - 180}
                    y={40}
                    width={360}
                    height={56}
                    rx={8}
                    fill="hsl(var(--primary))"
                    opacity={0.12}
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                  />
                  <text
                    x={SVG_W / 2}
                    y={73}
                    textAnchor="middle"
                    className="fill-primary font-semibold"
                    style={{ fontSize: 16 }}
                  >
                    STAGE / PODIUM
                  </text>
                </g>

                {/* Entrance */}
                <g>
                  <rect
                    x={SVG_W / 2 - 60}
                    y={SVG_H - 60}
                    width={120}
                    height={26}
                    rx={4}
                    fill="hsl(var(--muted))"
                    stroke="hsl(var(--border))"
                  />
                  <text
                    x={SVG_W / 2}
                    y={SVG_H - 42}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: 11, letterSpacing: 1 }}
                  >
                    ENTRANCE
                  </text>
                </g>

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
                        const pillW = Math.min(CELL_W - 24, 260);
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {SEATING_PLAN.map((table) => {
              const assigned = table.seats.filter((s) => s.name !== "Open seat").length;
              return (
                <Card key={table.number} className="border-primary/20 break-inside-avoid print:shadow-none print:border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {table.number}
                        </span>
                        <span className="truncate">{table.theme}</span>
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