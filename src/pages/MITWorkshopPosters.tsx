import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Presentation, RefreshCw, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Download, ExternalLink,
} from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type GrantRef = {
  activity_code: string;
  title: string;
  pis: string;
  grant_number: string | null;
  matched_title: string | null;
};

type Poster = {
  name: string;
  title: string;
  grants: GrantRef[];
};

type SortKey = "name" | "title";
type SortDir = "asc" | "desc";

const activityColor = (code: string) => {
  const c = code.toUpperCase();
  if (c.startsWith("R61") || c.startsWith("R33")) return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900";
  if (c.startsWith("R34")) return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900";
  if (c.startsWith("U01") || c.startsWith("U24")) return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-900";
  if (c.startsWith("R24")) return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900";
  return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
};

const MITWorkshopPosters = () => {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("mit-workshop-posters");
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Failed to load");
      setPosters(data.posters || []);
      setFetchedAt(data.fetched_at || null);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => {
    const arr = [...posters];
    arr.sort((a, b) => {
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [posters, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? <ArrowUpDown className="h-3 w-3 opacity-50" /> :
    sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;

  const downloadCsv = () => {
    if (sorted.length === 0) return;
    const esc = (v: string) => {
      const s = (v ?? "").toString();
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Presenter", "Poster Title", "Grants"];
    const csv = [header.join(",")]
      .concat(sorted.map((p) => [
        p.name,
        p.title,
        p.grants.map((g) => `${g.activity_code}: ${g.title}${g.grant_number ? ` [${g.grant_number}]` : ""}`).join(" | "),
      ].map(esc).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bbqs-mit-posters-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageMeta
        title="Poster Sessions — BBQS Workshop at MIT 2026"
        description="Poster session submissions for the 2nd Annual BBQS Workshop at MIT, July 15–17, 2026."
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Link to="/mit-workshop-2026" className="text-sm text-primary hover:underline">
                ← Back to MIT Workshop 2026
              </Link>
              <h1 className="text-3xl font-bold text-foreground mt-2 flex items-center gap-3">
                <Presentation className="h-7 w-7 text-primary" />
                Poster Sessions
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Live from the poster submission form. De-duplicated by presenter + title — updates automatically as new posters are submitted.
              </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={downloadCsv} disabled={sorted.length === 0} className="gap-2">
                  <Download className="h-4 w-4" /> Download CSV
                </Button>
                <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh
                </Button>
            </div>
          </div>

          <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>
                    {loading && posters.length === 0
                      ? "Loading…"
                      : `${posters.length} ${posters.length === 1 ? "poster" : "posters"}`}
                  </span>
                  {fetchedAt && (
                    <span className="text-xs font-normal text-muted-foreground">
                      Updated {new Date(fetchedAt).toLocaleString()}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm px-3 py-2 mb-4">
                    {error}
                  </div>
                )}
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-medium">
                          <button onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 hover:text-foreground">
                            Presenter <SortIcon k="name" />
                          </button>
                        </th>
                        <th className="px-3 py-2 font-medium">
                          <button onClick={() => toggleSort("title")} className="inline-flex items-center gap-1 hover:text-foreground">
                            Poster Title <SortIcon k="title" />
                          </button>
                        </th>
                        <th className="px-3 py-2 font-medium">Grant(s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((p, i) => (
                        <tr key={`${p.name}-${i}`} className="border-t border-border/60 align-top hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{p.name}</td>
                          <td className="px-3 py-2 text-foreground">{p.title}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-1.5">
                              {p.grants.map((g, gi) => {
                                const label = (
                                  <span className="inline-flex items-start gap-1.5">
                                    <Badge variant="outline" className={`shrink-0 ${activityColor(g.activity_code)}`}>
                                      {g.activity_code}
                                    </Badge>
                                    <span className="text-xs leading-snug">
                                      {g.title}
                                      {g.pis && <span className="text-muted-foreground"> — {g.pis}</span>}
                                    </span>
                                  </span>
                                );
                                return g.grant_number ? (
                                  <Link
                                    key={gi}
                                    to={`/projects/${encodeURIComponent(g.grant_number)}/profile`}
                                    className="group hover:text-primary"
                                    title={`View grant ${g.grant_number}`}
                                  >
                                    {label}
                                    <ExternalLink className="inline h-3 w-3 ml-1 opacity-0 group-hover:opacity-70" />
                                  </Link>
                                ) : (
                                  <span key={gi} className="text-muted-foreground">{label}</span>
                                );
                              })}
                              {p.grants.length === 0 && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {sorted.length === 0 && !loading && (
                        <tr>
                          <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                            No posters submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default MITWorkshopPosters;