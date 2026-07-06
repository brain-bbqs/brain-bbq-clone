import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Clock } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { SPEAKERS } from "@/data/mit-workshop-2026";

export default function MITWorkshopSpeakers() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <>
      <PageMeta
        title="MIT Workshop 2026 – Speakers & Talks | BBQS"
        description="Speakers and talks for the BBQS MIT Workshop, July 15-17, 2026."
      />
      <div className="container max-w-4xl mx-auto py-6 sm:py-10 px-3 sm:px-4 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Mic className="h-7 w-7 text-primary" /> Speakers & Talks
          </h1>
          <p className="text-muted-foreground">
            2<sup>nd</sup> Annual BBQS Workshop · MIT · July 15–17, 2026
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Confirmed & placeholder speakers by agenda slot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              TBD slots will be filled as they're confirmed — if you're presenting and don't see your name, let the organizers know.
            </p>
            <ul className="divide-y divide-border/60 rounded-lg border border-border/70 overflow-hidden">
              {SPEAKERS.map((s, i) => (
                <li key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 hover:bg-muted/40">
                  <div className="sm:w-56 shrink-0">
                    <div className="text-sm font-medium text-foreground">{s.name}</div>
                    {s.affiliation && <div className="text-xs text-muted-foreground">{s.affiliation}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">{s.role}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {s.when}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}