import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Receipt, TrendingUp, Calendar, Download } from "lucide-react";

interface Invoice {
  id: string;
  invoice_date: string;
  amount_usd: number;
  description: string;
  status: string;
  external_invoice_id: string | null;
  notes: string | null;
}

const SEED_DATA: Array<{ d: string; amt: number; desc: string }> = [
  { d: "2026-05-15", amt: 106.25, desc: "Pro 3" },
  { d: "2026-05-12", amt: 15.94, desc: "Build Credit Top-up Pro" },
  { d: "2026-05-01", amt: 31.98, desc: "Build Credit Top-up Pro" },
  { d: "2026-04-30", amt: 0, desc: "google/gemini-2.5-flash input tokens (+3 more)" },
  { d: "2026-04-28", amt: 50, desc: "Pro 3" },
  { d: "2026-04-15", amt: 50, desc: "Pro 2" },
  { d: "2026-04-08", amt: 25, desc: "Pro 2" },
  { d: "2026-03-31", amt: 0, desc: "google/gemini-3-flash-preview input tokens (+1 more)" },
  { d: "2026-03-15", amt: 25, desc: "Pro 1" },
  { d: "2026-03-10", amt: 15, desc: "Build Credit Top-up Pro" },
  { d: "2026-03-10", amt: 15, desc: "Build Credit Top-up Pro" },
  { d: "2026-03-05", amt: 15, desc: "Build Credit Top-up Pro" },
  { d: "2026-02-28", amt: 0, desc: "google/gemini-3-flash-preview input tokens (+1 more)" },
  { d: "2026-02-25", amt: 50, desc: "Pro 3" },
  { d: "2026-02-15", amt: 50, desc: "Pro 2" },
  { d: "2026-01-15", amt: 50, desc: "Pro 2" },
  { d: "2025-12-15", amt: 50, desc: "Pro 2" },
  { d: "2025-11-30", amt: 0, desc: "Cloud Usage" },
  { d: "2025-11-15", amt: 50, desc: "Pro 2" },
  { d: "2025-11-09", amt: 25, desc: "Pro 2" },
  { d: "2025-10-31", amt: 0, desc: "google/gemini-2.5-flash input tokens (+2 more)" },
  { d: "2025-10-15", amt: 25, desc: "Pro 1" },
];

export function LovableInvoicesPanel() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("lovable_invoices")
      .select("*")
      .order("invoice_date", { ascending: false });
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Invoice[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    if (rows.length === 0) return { total: 0, months: 0, avg: 0, byMonth: [] as Array<{ m: string; total: number }> };
    const byMonthMap = new Map<string, number>();
    let total = 0;
    for (const r of rows) {
      const m = r.invoice_date.slice(0, 7);
      byMonthMap.set(m, (byMonthMap.get(m) ?? 0) + Number(r.amount_usd));
      total += Number(r.amount_usd);
    }
    const byMonth = [...byMonthMap.entries()]
      .map(([m, t]) => ({ m, total: t }))
      .sort((a, b) => b.m.localeCompare(a.m));
    return { total, months: byMonth.length, avg: total / byMonth.length, byMonth };
  }, [rows]);

  const seed = async () => {
    const { error } = await supabase.from("lovable_invoices").insert(
      SEED_DATA.map((r) => ({ invoice_date: r.d, amount_usd: r.amt, description: r.desc })),
    );
    if (error) toast({ title: "Import failed", description: error.message, variant: "destructive" });
    else { toast({ title: `Imported ${SEED_DATA.length} invoices` }); load(); }
  };

  const add = async () => {
    if (!date || !amount || !desc) {
      toast({ title: "Fill date, amount, and description", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("lovable_invoices").insert({
      invoice_date: date, amount_usd: Number(amount), description: desc,
    });
    if (error) toast({ title: "Add failed", description: error.message, variant: "destructive" });
    else { setDate(""); setAmount(""); setDesc(""); load(); }
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("lovable_invoices").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  const exportCsv = () => {
    const header = "invoice_date,amount_usd,description,status\n";
    const body = rows
      .map((r) => `${r.invoice_date},${r.amount_usd},"${(r.description ?? "").replace(/"/g, '""')}",${r.status}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lovable-invoices.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading invoice history…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Lovable invoice history</h3>
          <p className="text-sm text-muted-foreground">
            Manually tracked since Lovable doesn't expose a billing API. Average and totals computed from rows below.
          </p>
        </div>
        <div className="flex gap-2">
          {rows.length === 0 && (
            <Button size="sm" onClick={seed}>
              <Download className="mr-2 h-4 w-4" /> Import history ({SEED_DATA.length})
            </Button>
          )}
          {rows.length > 0 && (
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard icon={<Receipt className="h-4 w-4" />} label="All-time total" value={`$${stats.total.toFixed(2)}`} hint={`${rows.length} invoices`} />
        <StatCard icon={<Calendar className="h-4 w-4" />} label="Months tracked" value={String(stats.months)} hint={stats.byMonth[stats.byMonth.length - 1]?.m ?? "—"} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Monthly average" value={`$${stats.avg.toFixed(2)}`} hint="Across all tracked months" />
      </div>

      {stats.byMonth.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly totals</CardTitle></CardHeader>
          <CardContent className="grid gap-1 md:grid-cols-2 lg:grid-cols-3 text-sm">
            {stats.byMonth.map((m) => {
              const max = Math.max(...stats.byMonth.map((x) => x.total));
              const pct = max > 0 ? (m.total / max) * 100 : 0;
              return (
                <div key={m.m} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground w-16">{m.m}</span>
                  <div className="flex-1 h-2 bg-muted rounded">
                    <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-xs text-foreground w-16 text-right">${m.total.toFixed(2)}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Add invoice</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-[140px_120px_1fr_auto] items-end">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Amount (USD)</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Pro 3" />
            </div>
            <Button onClick={add}><Plus className="mr-2 h-4 w-4" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Invoices</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet. Click "Import history" above to seed.</p>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground w-24">{r.invoice_date}</span>
                    <span className="font-mono text-foreground w-20">${Number(r.amount_usd).toFixed(2)}</span>
                    <span className="text-foreground truncate">{r.description}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => del(r.id)} aria-label="Delete invoice">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}