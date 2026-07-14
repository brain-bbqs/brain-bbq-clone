import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ZODIAC_GLYPH, type ZodiacSign } from "@/lib/zodiac";

type Row = { id: string; name: string; birthday: string | null; zodiac_sign: ZodiacSign | null };

export function BirthdayAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [bulk, setBulk] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("investigators")
      .select("id, name, birthday, zodiac_sign")
      .order("name")
      .limit(500);
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => rows.filter((r) => r.name?.toLowerCase().includes(q.toLowerCase())),
    [rows, q],
  );
  const filled = rows.filter((r) => r.birthday).length;

  const saveOne = async (id: string, birthday: string | null) => {
    const { error } = await supabase.from("investigators").update({ birthday }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await load();
  };

  const applyBulk = async () => {
    setSaving(true);
    const lines = bulk.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    let ok = 0, miss = 0;
    for (const line of lines) {
      const parts = line.split(/[,\t]/).map((s) => s.trim());
      if (parts.length < 2) { miss++; continue; }
      const [name, date] = parts;
      const target = rows.find((r) => r.name?.toLowerCase() === name.toLowerCase());
      if (!target) { miss++; continue; }
      const { error } = await supabase.from("investigators").update({ birthday: date }).eq("id", target.id);
      if (error) miss++; else ok++;
    }
    setSaving(false);
    setBulk("");
    toast.success(`Applied ${ok}, unmatched ${miss}`);
    await load();
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Birthdays</span>
          <span className="text-xs text-muted-foreground font-normal">
            {filled} / {rows.length} entered
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search investigator" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="border border-border rounded-md max-h-80 overflow-y-auto">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 last:border-0 text-sm">
                  <span className="truncate flex-1">{r.name}</span>
                  {r.zodiac_sign && (
                    <span className="mx-2 text-xs text-muted-foreground">
                      {ZODIAC_GLYPH[r.zodiac_sign]} {r.zodiac_sign}
                    </span>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-7 gap-1 text-xs", !r.birthday && "text-muted-foreground")}>
                        <CalendarIcon className="h-3 w-3" />
                        {r.birthday ? format(new Date(r.birthday), "MMM d, yyyy") : "Set"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown-buttons"
                        fromYear={1930}
                        toYear={new Date().getFullYear()}
                        selected={r.birthday ? new Date(r.birthday) : undefined}
                        onSelect={(d) => d && saveOne(r.id, format(d, "yyyy-MM-dd"))}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-4 text-xs text-muted-foreground text-center">No matches</div>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Bulk paste (one per line: <code>Name, YYYY-MM-DD</code>)</div>
            <Textarea rows={10} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder="Jane Doe, 1985-06-14&#10;John Smith, 1979-11-02" />
            <Button className="mt-2" size="sm" disabled={saving || !bulk.trim()} onClick={applyBulk}>
              {saving ? "Applying…" : "Apply"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}