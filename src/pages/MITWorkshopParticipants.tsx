import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, LogIn, RefreshCw, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Participant = {
  name: string;
  institution: string;
  role: string;
  attendance?: string;
};

// Canonicalize institution variants (e.g. "Harvard" -> "Harvard University")
const INSTITUTION_ALIASES: Array<{ match: RegExp; canonical: string }> = [
  { match: /\bharvard\b/i, canonical: "Harvard University" },
  { match: /\bmit\b|massachusetts institute of technology/i, canonical: "Massachusetts Institute of Technology" },
  { match: /\bstanford\b/i, canonical: "Stanford University" },
  { match: /\byale\b/i, canonical: "Yale University" },
  { match: /\bprinceton\b/i, canonical: "Princeton University" },
  { match: /\bcolumbia\b/i, canonical: "Columbia University" },
  { match: /\bcornell\b/i, canonical: "Cornell University" },
  { match: /\bbrown\b/i, canonical: "Brown University" },
  { match: /\bduke\b/i, canonical: "Duke University" },
  { match: /\bnyu\b|new york university/i, canonical: "New York University" },
  { match: /\bucla\b|university of california,?\s*los angeles/i, canonical: "UCLA" },
  { match: /\bucsf\b|university of california,?\s*san francisco/i, canonical: "UCSF" },
  { match: /\bucsd\b|university of california,?\s*san diego/i, canonical: "UC San Diego" },
  { match: /\bucsc\b|university of california,?\s*santa cruz/i, canonical: "UC Santa Cruz" },
  { match: /\bucsb\b|university of california,?\s*santa barbara/i, canonical: "UC Santa Barbara" },
  { match: /\buc berkeley\b|university of california,?\s*berkeley|^berkeley$/i, canonical: "UC Berkeley" },
  { match: /\buc davis\b|university of california,?\s*davis/i, canonical: "UC Davis" },
  { match: /\buc irvine\b|university of california,?\s*irvine/i, canonical: "UC Irvine" },
  { match: /\bcaltech\b|california institute of technology/i, canonical: "Caltech" },
  { match: /\bcmu\b|carnegie mellon/i, canonical: "Carnegie Mellon University" },
  { match: /johns hopkins/i, canonical: "Johns Hopkins University" },
  { match: /\bupenn\b|university of pennsylvania|penn\b/i, canonical: "University of Pennsylvania" },
  { match: /university of chicago|\buchicago\b/i, canonical: "University of Chicago" },
  { match: /university of washington|\buw\b/i, canonical: "University of Washington" },
  { match: /university of michigan|\bumich\b/i, canonical: "University of Michigan" },
  { match: /university of texas.*austin|\but austin\b/i, canonical: "UT Austin" },
  { match: /\bemory\b/i, canonical: "Emory University" },
  { match: /\bnorthwestern\b/i, canonical: "Northwestern University" },
  { match: /\bbu\b|boston university/i, canonical: "Boston University" },
  { match: /allen institute/i, canonical: "Allen Institute" },
  { match: /salk institute/i, canonical: "Salk Institute" },
  { match: /howard hughes|\bhhmi\b/i, canonical: "HHMI" },
];

const canonicalizeInstitution = (raw: string): string => {
  const v = (raw || "").trim();
  if (!v) return "";
  for (const { match, canonical } of INSTITUTION_ALIASES) {
    if (match.test(v)) return canonical;
  }
  // Title-case fallback while preserving short acronyms
  return v
    .split(/\s+/)
    .map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w[0]?.toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
};

const roleColor = (role: string): string => {
  const r = (role || "").toLowerCase();
  if (/student|trainee|undergrad/.test(r))
    return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900";
  if (/postdoc|post-doc|post doc/.test(r))
    return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-900";
  if (/\bpi\b|principal|faculty|professor/.test(r))
    return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900";
  if (/staff|admin|coordinator|manager/.test(r))
    return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900";
  if (/industry|sponsor|partner/.test(r))
    return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900";
  return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
};

type SortKey = "name" | "institution" | "role";
type SortDir = "asc" | "desc";

const MITWorkshopParticipants = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("mit-workshop-participants");
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Failed to load");
      setParticipants(data.participants || []);
      setFetchedAt(data.fetched_at || null);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const normalized = useMemo(
    () =>
      participants.map((p) => ({
        ...p,
        institution: canonicalizeInstitution(p.institution),
      })),
    [participants]
  );

  const sorted = useMemo(() => {
    const arr = [...normalized];
    arr.sort((a, b) => {
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [normalized, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? (
      <ArrowUpDown className="h-3 w-3 opacity-50" />
    ) : sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );

  return (
    <>
      <PageMeta
        title="Participants — BBQS Workshop at MIT 2026"
        description="Registered participants for the 2nd Annual BBQS Workshop at MIT, July 15–17, 2026."
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Link to="/mit-workshop-2026" className="text-sm text-primary hover:underline">
                ← Back to MIT Workshop 2026
              </Link>
              <h1 className="text-3xl font-bold text-foreground mt-2 flex items-center gap-3">
                <Users className="h-7 w-7 text-primary" />
                Participants
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Live from the registration form. De-duplicated by email — updates automatically as new people register.
              </p>
            </div>
            {user && (
              <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            )}
          </div>

          {!authLoading && !user ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-muted-foreground">
                  Sign in to view the registered participants for the workshop.
                </p>
                <Button onClick={() => navigate("/auth")} size="sm" className="gap-2 shrink-0">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>
                      {loading && participants.length === 0
                        ? "Loading…"
                        : `${participants.length} registered ${participants.length === 1 ? "participant" : "participants"}`}
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
                  {loading && participants.length === 0 ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" /> Fetching latest registrations…
                    </div>
                  ) : participants.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No registrations yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <tr>
                            {([
                              ["name", "Name"],
                              ["institution", "Institution"],
                              ["role", "Role in BBQS"],
                            ] as [SortKey, string][]).map(([k, label]) => (
                              <th key={k} className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => toggleSort(k)}
                                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                                >
                                  {label}
                                  <SortIcon k={k} />
                                </button>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((p, i) => (
                            <tr key={`${p.name}-${i}`} className="border-t border-border hover:bg-muted/30">
                              <td className="px-3 py-2 font-medium text-foreground">{p.name || "—"}</td>
                              <td className="px-3 py-2 text-muted-foreground">{p.institution || "—"}</td>
                              <td className="px-3 py-2">
                                {p.role ? (
                                  <Badge variant="outline" className={`font-normal border ${roleColor(p.role)}`}>
                                    {p.role}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MITWorkshopParticipants;