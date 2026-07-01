import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar as CalendarIcon, DollarSign, Clock, Users, ExternalLink, LogIn, Plane, Wifi, Video, Link2, Target, Coffee, Presentation, Utensils, Camera, Sparkles, Vote, MessageCircle, PartyPopper } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import bbqsLogoIcon from "@/assets/bbqs-logo-icon.png";

const MITWorkshop2026 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <PageMeta
        title="BBQS Workshop at MIT 2026 | Brain BBQS"
        description="2nd Annual Brain Behavior Quantification and Synchronization Workshop at MIT, July 15-17, 2026."
      />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />
          <div className="relative max-w-5xl mx-auto px-6 py-12">
            <img src={bbqsLogoIcon} alt="BBQS Logo" className="h-32 w-32 mb-6 mx-auto rounded-full" />
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="text-xs uppercase tracking-wider">
                Conference
              </Badge>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                Upcoming
              </Badge>
            </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight max-w-3xl">
              2<sup>nd</sup> Annual Brain Behavior Quantification and Synchronization Workshop at MIT
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">July 15–17, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>MIT, Cambridge MA — Brain &amp; Cognitive Science (BCS), Building 46</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>Free to attend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-primary" />
                About the Workshop
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                This workshop provides an opportunity for BBQS consortium members and affiliates
                to share their work, discuss common challenges, and identify priorities for the
                consortium moving forward. Through presentations and discussion, participants will
                exchange updates across projects, address scientific and operational barriers, and
                explore opportunities for collaboration.
              </p>
              <p>
                The session is intended to support collective problem-solving and help shape future
                directions for BBQS research, coordination, and community building.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-primary" />
                Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">Format</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unconference, working meeting, and hackathon — open to the full BBQS Consortium and collaborators. Coding is <span className="font-medium text-foreground">not</span> a requirement.
                  {" "}For some local-to-MIT history, see the{" "}
                  <a
                    href="https://en.wikipedia.org/wiki/Tech_Model_Railroad_Club"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Tech Model Railroad Club
                  </a>.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Goals
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                  <li><span className="font-medium text-foreground">Theme:</span> Towards cross-species synergy — questions and technologies.</li>
                  <li><span className="font-medium text-foreground">Resources for BBQS:</span> standards and best practices, ML/AI models, legal/ethical frameworks.</li>
                  <li><span className="font-medium text-foreground">AI Literacy:</span> efficient algorithm development; pairing neuroscientists (experimental, computational) with data scientists.</li>
                </ul>
              </div>

              <AgendaDay
                title="Day 1 — Wednesday, July 15, 2026 · Social Coordination"
                rows={[
                  ["9:00", "10:00", "Coffee/Tea Morning Social — Morning Snacks & Ice Breakers; setup posters.", "Atrium", ""],
                  ["10:00", "10:15", "Introduction with Scientific and Technological Goals (TBD-NIH).", "Singleton", "Yes"],
                  ["10:15", "10:30", "Highlight Last Year's BBQS Consortia — What's New? (Satra Ghosh). Emphasizing cross-species and translation: Pose Estimation, Cross-Species Behavior, Statistical Modeling of Social Behavior — and the goal of crossing these.", "Singleton", "Yes"],
                  ["10:30", "12:15", "Data Pipeline Blitz — the data they are generating, the tools they have built or are using, and the research questions at the end of their pipeline.", "Singleton", "Yes"],
                  ["12:15", "12:30", "Group Photo", "MIT Main Building & McGovern", ""],
                  ["12:30", "2:00", "BBQS Working Lunch: Minds & Matches — Focus: encourage social collaboration and new innovation. Secondary goal: breed new scientific ideas about cross-species synchronization. Assigned seating based on BBQS perspective of their projects.", "Atrium", ""],
                  ["2:00", "4:00", "BBQS Project Pitch (review proposed ideas) & discussion followed by Brainhack sessions. Identify volunteers to lead any new projects; leads set up projects using the Brainhack planning template and post slides. Current themes: Statistical Modeling of Social Behavior; Pose Estimation; Cross-Species Group.", "Singleton", "Yes"],
                  ["4:00", "6:00", "BBQS NeuroFair Poster and Demo Session + Reception: Devices, Data, and Ideas.", "Atrium / Seminar 3189", ""],
                ]}
              />

              <AgendaDay
                title="Day 2 — Thursday, July 16, 2026 · Active Working"
                rows={[
                  ["9:00", "10:00", "Coffee/Tea Morning Social.", "Atrium / Seminar 3189", "Yes"],
                  ["10:00", "11:30", "Report Back from Day 1 Brainhack sessions and overview of what's next.", "Singleton", "Yes"],
                  ["11:30", "12:30", "Parallel working sessions: (Option A — Satra) From AI Literacy to Liability: Failure Points and Sensitive Data in the Age of Coding Agents. (Option B — ELSI) Office Hours with WG-ELSI; pre-voting discussion about data sharing. (Option C) Brainhack working sessions.", "Singleton / Atrium / Seminar 3189", "Yes"],
                  ["12:30", "2:30", "BBQS Working Lunch: Brainhack working sessions.", "Atrium", "Yes"],
                  ["2:30", "4:00", "Parallel working sessions: (PIs Required) Policy Formation Forum — voting on Data Sharing Policy, Data Usage Agreements, and Governance, followed by a Grants and Budgets discussion. (Option B) Young Investigator-led unconference, TOPIC TBD. (Option C) Brainhack working sessions.", "Singleton / Atrium / Seminar 3189", "Yes"],
                  ["4:00", "6:00", "Poster Session II — Light Snack Reception (Brain-Boosting Snacks).", "Atrium", ""],
                ]}
              />

              <AgendaDay
                title="Day 3 — Friday, July 17, 2026 · Reflection"
                rows={[
                  ["9:00", "10:00", "Coffee/Tea Morning Social.", "Atrium", ""],
                  ["10:00", "11:30", "Brainhack Sessions (cont'd).", "Singleton", "Yes"],
                  ["11:30", "12:30", "BBQS Working Lunch: Brainhack — wrap-up of deliverables and documentation.", "Atrium", ""],
                  ["12:30", "2:45", "Final project reports and parallel session summaries — what's next (add Brainhack slides to this section). Open mic discussion and town hall.", "Singleton", "Yes"],
                  ["2:45", "3:00", "Closing.", "Singleton", "Yes"],
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-primary" />
                Venue & Travel
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <span className="font-semibold text-foreground">Where:</span> MIT, Cambridge MA — Brain &amp; Cognitive Science (BCS), Building 46.
              </p>
              <p>
                For more information about the Cambridge area, visit{" "}
                <a
                  href="https://www.cambridgema.gov/visitors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  this link
                </a>{" "}
                (this page is <span className="font-medium text-foreground">not</span> managed by BBQS). Please make your own travel arrangements.
                Hotels are pricey this time of year — you can ask the hotels directly if they have an MIT rate and whether it is available.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Link2 className="h-5 w-5 text-primary" />
                Key Links & Logistics
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {!user ? (
                <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-muted-foreground">
                    Sign in with Globus to reveal Wi-Fi, Zoom, and venue links for the workshop.
                  </p>
                  <Button onClick={() => navigate("/auth")} size="sm" className="gap-2 shrink-0">
                    <LogIn className="h-4 w-4" />
                    Sign in to view
                  </Button>
                </div>
              ) : (
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Wifi className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Wi-Fi:</span>{" "}
                    <a href="https://ist.mit.edu/start-guests" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      ist.mit.edu/start-guests
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Video className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Zoom:</span>{" "}
                    <a href="https://mit.zoom.us/j/91680232208" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      mit.zoom.us/j/91680232208
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ExternalLink className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Website:</span>{" "}
                    <a href="https://brain-bbqs.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      brain-bbqs.org
                    </a>
                  </span>
                </li>
              </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Registration:</span>{" "}
                There is no cost to attend. Please register below so we can plan accordingly.
              </p>
              {user ? (
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSeBLs7Fg6qaJcixGNwVhWe7_T8T055DRm0Ul2AZ4fdwpMOZ8Q/viewform?usp=sharing&ouid=116331824126940716187"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  Register Now
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <div className="space-y-2">
                  <Button onClick={() => navigate("/auth")} className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign in to Register
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Globus sign-in is required to access the registration form.
                  </p>
                </div>
              )}
              <div className="pt-2 border-t border-primary/10">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Travel & Hotels:</span>{" "}
                  View negotiated rates and travel logistics for the workshop.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 gap-2">
                  <Link to="/mit-workshop-2026/travel">
                    <Plane className="h-4 w-4" />
                    View Travel & Hotels
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default MITWorkshop2026;

type AgendaRow = [string, string, string, string, string];

function AgendaDay({ title, rows }: { title: string; rows: AgendaRow[] }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground mb-3">{title}</h3>
      <div className="overflow-x-auto rounded-xl border border-border/70 shadow-[0_1px_0_hsl(var(--foreground)/0.04),0_10px_30px_-15px_hsl(var(--foreground)/0.15)] bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm ring-1 ring-white/40 dark:ring-white/5">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-b from-muted/70 to-muted/30 text-foreground backdrop-blur-sm">
            <tr>
              <th className="text-left font-semibold px-3 py-2 w-[80px]">Start</th>
              <th className="text-left font-semibold px-3 py-2 w-[80px]">End</th>
              <th className="text-left font-semibold px-3 py-2">Session</th>
              <th className="text-left font-semibold px-3 py-2 w-[180px]">Location</th>
              <th className="text-left font-semibold px-3 py-2 w-[70px]">Zoom</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([start, end, session, location, zoom], i) => (
              <tr
                key={i}
                className="border-t border-border/60 align-top odd:bg-background/60 even:bg-muted/10 hover:bg-primary/[0.04] transition-colors"
              >
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{start}</td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{end}</td>
                <td className="px-3 py-2 text-foreground leading-relaxed">{session}</td>
                <td className="px-3 py-2 text-muted-foreground">{location}</td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{zoom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
