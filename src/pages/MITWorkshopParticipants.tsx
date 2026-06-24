import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, LogIn, RefreshCw, Building2, Loader2 } from "lucide-react";
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

const MITWorkshopParticipants = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

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

  const grouped = participants.reduce<Record<string, Participant[]>>((acc, p) => {
    const k = p.institution || "Unknown affiliation";
    (acc[k] ||= []).push(p);
    return acc;
  }, {});
  const orgs = Object.keys(grouped).sort();

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
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Institution</th>
                            <th className="px-3 py-2">Role in BBQS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {participants.map((p, i) => (
                            <tr key={`${p.name}-${i}`} className="border-t border-border hover:bg-muted/30">
                              <td className="px-3 py-2 font-medium text-foreground">{p.name || "—"}</td>
                              <td className="px-3 py-2 text-muted-foreground">{p.institution || "—"}</td>
                              <td className="px-3 py-2">
                                {p.role ? (
                                  <Badge variant="secondary" className="font-normal">{p.role}</Badge>
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

              {orgs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-4 w-4 text-primary" />
                      By institution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                    {orgs.map((org) => (
                      <div key={org} className="rounded-md border border-border p-3">
                        <div className="font-medium text-sm text-foreground mb-1">{org}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {grouped[org].length} {grouped[org].length === 1 ? "person" : "people"}
                        </div>
                        <ul className="text-sm space-y-0.5">
                          {grouped[org].map((p, i) => (
                            <li key={i} className="text-muted-foreground">
                              <span className="text-foreground">{p.name}</span>
                              {p.role ? <span className="text-xs"> — {p.role}</span> : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MITWorkshopParticipants;