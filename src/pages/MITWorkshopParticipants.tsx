import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, LogIn, RefreshCw, Loader2, ArrowUpDown, ArrowUp, ArrowDown, MapPin, GraduationCap, Building2, Award, X } from "lucide-react";
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

// Acronyms / words that should keep specific casing
const ACRONYMS = new Set([
  "MIT","UCLA","UCSF","UCSD","UCSC","UCSB","NYU","CMU","UPenn","UT","UC","HHMI","BBQS","PI","MPI","Co-PI","USA","UK","NIH","NSF","PhD","MD","II","III","IV",
]);

const toTitleCase = (raw: string): string => {
  const v = (raw || "").trim();
  if (!v) return "";
  return v
    .split(/(\s+|-|\/)/) // keep separators
    .map((token) => {
      if (/^(\s+|-|\/)$/.test(token)) return token;
      const upper = token.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      if (token.length <= 3 && token === upper && /[A-Z]/.test(token)) return token;
      // Handle O'Brien, McDonald minimally: just title-case first letter
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join("");
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

type SortKey = "name" | "institution" | "role" | "attendance";
type SortDir = "asc" | "desc";

const normalizeAttendance = (raw: string): "In person" | "Virtual" | "Unknown" => {
  const v = (raw || "").toLowerCase();
  if (!v) return "Unknown";
  if (/virtual|remote|online|zoom/.test(v)) return "Virtual";
  if (/in.?person|yes|attend|onsite|on-site/.test(v)) return "In person";
  return "Unknown";
};

const attendanceColor = (a: string) => {
  if (a === "In person") return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900";
  if (a === "Virtual") return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-900";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
};

const MITWorkshopParticipants = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activeFilter, setActiveFilter] = useState<null | "inPerson" | "young" | "nih" | "pis">(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
        name: toTitleCase(p.name),
        institution: canonicalizeInstitution(p.institution),
        role: toTitleCase(p.role),
        attendance: normalizeAttendance(p.attendance || ""),
      })),
    [participants]
  );

  const isYoung = (p: { role?: string }) => /phd student|ph\.d\.? student|graduate student|grad student|postdoc|post-doc|post doc|junior fellow|trainee|young investigator|fellow\b/i.test(p.role || "");
  const isPi = (p: { role?: string }) => /\bpi\b|principal investigator|faculty|professor|investigator/i.test(p.role || "");
  const isNih = (p: { institution?: string }) => /\bnih\b|national institutes of health|nimh|ninds|nida|niaaa|nichd|nia\b/i.test(p.institution || "");
  const isInPerson = (p: { attendance?: string }) => p.attendance === "In person";

  const filtered = useMemo(() => {
    if (!activeFilter) return normalized;
    const pred = {
      inPerson: isInPerson,
      young: isYoung,
      nih: isNih,
      pis: isPi,
    }[activeFilter];
    return normalized.filter(pred);
  }, [normalized, activeFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const stats = useMemo(() => {
    return {
      inPerson: normalized.filter(isInPerson).length,
      young: normalized.filter(isYoung).length,
      nih: normalized.filter(isNih).length,
      pis: normalized.filter(isPi).length,
    };
  }, [normalized]);

  const rowKey = (p: { name: string; institution: string }) => `${p.name}|${p.institution}`;
  const allVisibleSelected = sorted.length > 0 && sorted.every((p) => selected.has(rowKey(p)));
  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) sorted.forEach((p) => next.delete(rowKey(p)));
      else sorted.forEach((p) => next.add(rowKey(p)));
      return next;
    });
  };
  const toggleRow = (k: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

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
              {participants.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { key: "inPerson" as const, label: "Attending in person", value: stats.inPerson, Icon: MapPin, color: "text-emerald-600", ring: "ring-emerald-500/60" },
                    { key: "young" as const, label: "Young investigators", value: stats.young, Icon: GraduationCap, color: "text-blue-600", ring: "ring-blue-500/60" },
                    { key: "nih" as const, label: "From NIH", value: stats.nih, Icon: Building2, color: "text-purple-600", ring: "ring-purple-500/60" },
                    { key: "pis" as const, label: "PIs / Faculty", value: stats.pis, Icon: Award, color: "text-amber-600", ring: "ring-amber-500/60" },
                  ].map(({ key, label, value, Icon, color, ring }) => {
                    const active = activeFilter === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveFilter(active ? null : key)}
                        className={`text-left rounded-lg border bg-card transition-all hover:border-foreground/30 hover:shadow-sm ${active ? `ring-2 ${ring} border-transparent shadow-sm` : "border-border"}`}
                      >
                        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                            <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
                          </div>
                          <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
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
                  {(activeFilter || selected.size > 0) && (
                    <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-muted-foreground">
                      {activeFilter && (
                        <button
                          type="button"
                          onClick={() => setActiveFilter(null)}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          <X className="h-3 w-3" /> Clear filter
                        </button>
                      )}
                      {selected.size > 0 && (
                        <span className="ml-auto">
                          {selected.size} selected
                          <button
                            type="button"
                            onClick={() => setSelected(new Set())}
                            className="ml-2 underline hover:text-foreground"
                          >
                            clear
                          </button>
                        </span>
                      )}
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
                            <th className="px-3 py-2 w-8">
                              <input
                                type="checkbox"
                                aria-label="Select all visible"
                                checked={allVisibleSelected}
                                onChange={toggleSelectAllVisible}
                                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                              />
                            </th>
                            {([
                              ["name", "Name"],
                              ["institution", "Institution"],
                              ["role", "Role in BBQS"],
                              ["attendance", "Attendance"],
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
                            <tr key={`${p.name}-${i}`} className={`border-t border-border hover:bg-muted/30 ${selected.has(rowKey(p)) ? "bg-primary/5" : ""}`}>
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  aria-label={`Select ${p.name}`}
                                  checked={selected.has(rowKey(p))}
                                  onChange={() => toggleRow(rowKey(p))}
                                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                                />
                              </td>
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
                              <td className="px-3 py-2">
                                <Badge variant="outline" className={`font-normal border ${attendanceColor(p.attendance)}`}>
                                  {p.attendance}
                                </Badge>
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