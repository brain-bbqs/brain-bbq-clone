import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Coins, TrendingUp, Users } from "lucide-react";

interface CreditEvent {
  id: string;
  event_type: "topup" | "adjustment" | "refund";
  credits: number;
  usd_amount: number;
  occurred_at: string;
  notes: string | null;
}

interface UserUsage {
  id: string;
  user_id: string | null;
  user_label: string | null;
  period_month: string;
  credits_used: number;
  usd_equivalent: number;
  notes: string | null;
}

const monthStartISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export function LovableCreditsPanel() {
  const [events, setEvents] = useState<CreditEvent[]>([]);
  const [usage, setUsage] = useState<UserUsage[]>([]);
  const [period, setPeriod] = useState<string>(monthStartISO());

  const load = async () => {
    const [{ data: e }, { data: u }] = await Promise.all([
      supabase.from("lovable_credit_events").select("*")
        .order("occurred_at", { ascending: false }).limit(100),
      supabase.from("lovable_user_usage").select("*")
        .order("credits_used", { ascending: false }).limit(200),
    ]);
    setEvents((e ?? []) as CreditEvent[]);
    setUsage((u ?? []) as UserUsage[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("lovable-credits-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "lovable_credit_events" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "lovable_user_usage" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const periodEvents = useMemo(() => {
    const start = new Date(period);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return events.filter((e) => {
      const t = new Date(e.occurred_at);
      return t >= start && t < end;
    });
  }, [events, period]);

  const periodUsage = useMemo(
    () => usage.filter((u) => u.period_month === period),
    [usage, period],
  );

  const toppedUp = periodEvents
    .filter((e) => e.event_type === "topup")
    .reduce((s, e) => s + Number(e.credits || 0), 0);
  const toppedUpUsd = periodEvents
    .filter((e) => e.event_type === "topup")
    .reduce((s, e) => s + Number(e.usd_amount || 0), 0);
  const adjustments = periodEvents
    .filter((e) => e.event_type !== "topup")
    .reduce((s, e) => s + Number(e.usd_amount || 0), 0);
  const usedCredits = periodUsage.reduce((s, u) => s + Number(u.credits_used || 0), 0);
  const usedUsd = periodUsage.reduce((s, u) => s + Number(u.usd_equivalent || 0), 0);
  const remainingCredits = toppedUp - usedCredits;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">Lovable credits & usage</h3>
          <p className="text-xs text-muted-foreground">
            Track top-ups and per-user credit consumption. Updates in realtime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Period</Label>
          <Input
            type="month"
            value={period.slice(0, 7)}
            onChange={(e) => setPeriod(`${e.target.value}-01`)}
            className="h-8 w-[140px]"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={<Coins className="h-4 w-4" />} label="Topped up"
          primary={`${toppedUp.toFixed(0)} cr`} secondary={`$${toppedUpUsd.toFixed(2)}`} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Used"
          primary={`${usedCredits.toFixed(0)} cr`} secondary={`$${usedUsd.toFixed(2)}`} />
        <StatCard icon={<Coins className="h-4 w-4" />} label="Remaining"
          primary={`${remainingCredits.toFixed(0)} cr`}
          secondary={remainingCredits < 0 ? "over budget" : "available"}
          warn={remainingCredits < 0} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Active users"
          primary={`${periodUsage.length}`}
          secondary={`${adjustments >= 0 ? "+" : ""}$${adjustments.toFixed(2)} adj.`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopUpsCard events={periodEvents} period={period} onChange={load} />
        <UserUsageCard rows={periodUsage} period={period} onChange={load} />
      </div>
    </div>
  );
}

function StatCard({
  icon, label, primary, secondary, warn,
}: { icon: React.ReactNode; label: string; primary: string; secondary: string; warn?: boolean }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className={`text-xl font-semibold mt-1 ${warn ? "text-destructive" : "text-foreground"}`}>
          {primary}
        </div>
        <div className="text-xs text-muted-foreground">{secondary}</div>
      </CardContent>
    </Card>
  );
}

function TopUpsCard({
  events, period, onChange,
}: { events: CreditEvent[]; period: string; onChange: () => void }) {
  const [type, setType] = useState<"topup" | "adjustment" | "refund">("topup");
  const [credits, setCredits] = useState("");
  const [usd, setUsd] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!credits && !usd) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const occurred = new Date(period);
    occurred.setDate(Math.min(new Date().getDate(), 28));
    const { error } = await supabase.from("lovable_credit_events").insert({
      event_type: type,
      credits: Number(credits) || 0,
      usd_amount: Number(usd) || 0,
      notes: notes || null,
      occurred_at: occurred.toISOString(),
      created_by: u?.user?.id ?? null,
    });
    setSaving(false);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { setCredits(""); setUsd(""); setNotes(""); onChange(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("lovable_credit_events").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else onChange();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Top-ups & adjustments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="topup">Top-up</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
            <Label className="text-xs">Credits</Label>
            <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} className="h-9" />
          </div>
          <div className="col-span-3">
            <Label className="text-xs">USD</Label>
            <Input type="number" value={usd} onChange={(e) => setUsd(e.target.value)} className="h-9" />
          </div>
          <div className="col-span-3 flex items-end">
            <Button size="sm" className="w-full" onClick={add} disabled={saving}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <div className="col-span-12">
            <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-9" />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto border-t border-border pt-2">
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No events for this month.</p>
          ) : events.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant={e.event_type === "topup" ? "default" : "outline"} className="text-[10px]">
                  {e.event_type}
                </Badge>
                <span className="text-muted-foreground shrink-0">
                  {new Date(e.occurred_at).toLocaleDateString()}
                </span>
                {e.notes && <span className="truncate text-muted-foreground">— {e.notes}</span>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono">{Number(e.credits).toFixed(0)} cr</span>
                <span className="font-mono">${Number(e.usd_amount).toFixed(2)}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => remove(e.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UserUsageCard({
  rows, period, onChange,
}: { rows: UserUsage[]; period: string; onChange: () => void }) {
  const [label, setLabel] = useState("");
  const [credits, setCredits] = useState("");
  const [usd, setUsd] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!label || (!credits && !usd)) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("lovable_user_usage").insert({
      user_label: label,
      period_month: period,
      credits_used: Number(credits) || 0,
      usd_equivalent: Number(usd) || 0,
      created_by: u?.user?.id ?? null,
    });
    setSaving(false);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { setLabel(""); setCredits(""); setUsd(""); onChange(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("lovable_user_usage").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else onChange();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Per-user credit usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-4">
            <Label className="text-xs">User / label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-9" placeholder="alice@bbqs.org" />
          </div>
          <div className="col-span-3">
            <Label className="text-xs">Credits</Label>
            <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} className="h-9" />
          </div>
          <div className="col-span-3">
            <Label className="text-xs">USD</Label>
            <Input type="number" value={usd} onChange={(e) => setUsd(e.target.value)} className="h-9" />
          </div>
          <div className="col-span-2 flex items-end">
            <Button size="sm" className="w-full" onClick={add} disabled={saving}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto border-t border-border pt-2">
          {rows.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No usage logged for this month.</p>
          ) : rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
              <span className="truncate font-medium">{r.user_label ?? r.user_id ?? "—"}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono">{Number(r.credits_used).toFixed(0)} cr</span>
                <span className="font-mono">${Number(r.usd_equivalent).toFixed(2)}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => remove(r.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}