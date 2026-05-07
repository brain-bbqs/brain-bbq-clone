import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, Clock, Users, Target, Video, ExternalLink, Sparkles, Network, LogIn, Plane } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import bbqsLogoIcon from "@/assets/bbqs-logo-icon.png";

type AgendaRow = [string, string, string, string];

const day1: AgendaRow[] = [
  ["9:00", "10:00", "Coffee/Tea Morning Social — Snacks & Ice Breakers", "Atrium"],
  ["10:00", "10:15", "Highlight Last Year's BBQS Consortia — What's New? (Satra Ghosh). Cross-species and translation theme.", "Singleton"],
  ["10:15", "10:30", "Scientific and Technological Goals — NIH", "Singleton"],
  ["10:30", "11:30", "Perspective Cross-Species Panel — what is the unifying principle across neuroscience studies?", "Singleton"],
  ["11:30", "12:00", "BBQS Community Resource & Leadership Roll Call (facilitated by Nader & Sul).", "Singleton"],
  ["12:00", "2:00", "Task Force Working Lunch: Minds & Matches — assigned seating by BBQS perspective.", "Atrium"],
  ["2:00", "2:30", "Group Photo", "MIT Main Building & McGovern"],
  ["2:30", "4:00", "BBQS Project Pitch & discussion — parallel session selection and project leads.", "Singleton"],
  ["4:00", "6:00", "BBQS NeuroFair Poster and Demo Session: Devices, Data, and Ideas", "Atrium / Seminar 3189"],
];

const day2: AgendaRow[] = [
  ["7:00", "8:00", "Ultimate Frisbee", "MIT Athletic Field"],
  ["9:00", "10:00", "Coffee/Tea Social. Policy Formation Forum — Data Sharing & Usage Agreements.", "Atrium / Seminar 3189"],
  ["10:00", "11:00", "From AI Literacy to Liability: Failure Points and Sensitive Data in the Age of Coding Agents", "Singleton"],
  ["11:00", "12:00", "Build an AI-Powered Agentic Data Pipeline Workshop (Optional)", "Seminar 3189"],
  ["12:00", "2:00", "BBQS Projects Working Lunch (Zoom available)", "Atrium"],
  ["2:00", "3:00", "BBQS Unconference: Community-Led Topics & Lightning Discussions", "Singleton"],
  ["3:00", "4:30", "Live Hacking", "Singleton / Atrium / Seminar 3189"],
  ["4:00", "6:00", "Light Dinner Reception (Brain-Boosting Snacks)", "Atrium"],
  ["6:00", "6:30", "Walking and Talking Tour of MIT (Optional)", "MIT Campus"],
];

const day3: AgendaRow[] = [
  ["7:15", "8:00", "Sunrise Yoga / Pilates", "MIT Athletic Field"],
  ["9:00", "11:00", "Open Debate: Is BBQS the Future of Brain-Behavior Neuroscience?", "Singleton"],
  ["11:00", "12:00", "Young Investigator-led unconference, fireside chats (Zoom available)", "Seminar 3189"],
  ["12:00", "1:00", "Working Lunch: Live NeuroHack Labs — wrap-up of deliverables", "Atrium"],
  ["1:00", "2:30", "Project Outcomes & Consortium Handoff (Zoom available)", "Singleton"],
  ["2:30", "3:00", "Feedback, Reflection, Discussion and Closing (Zoom available)", "Singleton"],
];

const CrossSpeciesSynchronization = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <PageMeta
        title="Cross-Species Synchronization | BBQS Program Event"
        description="Cross-Species Synchronization — the 2026 BBQS Program event exploring unifying principles across brains, behaviors, and species. July 15–17, 2026 at MIT."
      />
      <div className="min-h-screen bg-background">
        {/* Themed hero */}
        <div className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-background" />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, hsl(var(--primary)) 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, hsl(var(--accent)) 1px, transparent 1.5px), radial-gradient(circle at 45% 80%, hsl(var(--primary)) 1px, transparent 1.5px)",
              backgroundSize: "120px 120px, 90px 90px, 150px 150px",
            }}
          />
          <div className="relative max-w-5xl mx-auto px-6 py-16 text-center">
            <img src={bbqsLogoIcon} alt="BBQS Logo" className="h-24 w-24 mb-6 mx-auto rounded-full shadow-lg" />
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs uppercase tracking-wider">
                BBQS Program Event
              </Badge>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                July 15–17, 2026
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Cross-Species <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Synchronization</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Toward a shared language for brains and behavior — uniting flies, fish, rodents, primates, and humans
              through quantification, synchronization, and open computational tools.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">July 15–17, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>MIT, Building 46 — Cambridge, MA</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Free to attend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
          {/* Theme */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Network className="h-5 w-5 text-primary" />
                Theme — Cross-Species Synchronization
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                Behavior unfolds across radically different bodies and brains, yet shared computational
                principles connect a fruit fly's escape, a mouse's foraging bout, a macaque's reach, and
                a human's conversation. <span className="font-medium text-foreground">Cross-Species
                Synchronization</span> is the through-line of the BBQS Program: aligning measurement,
                models, and metadata so discoveries in one species accelerate work in every other.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <ThemePillar
                  icon={<Target className="h-5 w-5 text-primary" />}
                  title="Unifying questions"
                  body="What invariants describe behavior across species? Where do they break down?"
                />
                <ThemePillar
                  icon={<Sparkles className="h-5 w-5 text-primary" />}
                  title="Shared technology"
                  body="Standards, ML/AI models, and ethical/legal frameworks the whole consortium can reuse."
                />
                <ThemePillar
                  icon={<Users className="h-5 w-5 text-primary" />}
                  title="Connected community"
                  body="Pair experimentalists, theorists, and data scientists across labs and species."
                />
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-primary" />
                About the Event
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                A working meeting, unconference, and hackathon for the BBQS Consortium and collaborators —
                with cross-species synchronization as the central organizing question. Coding is{" "}
                <span className="font-medium text-foreground">not</span> required to participate.
              </p>
              <p>
                Through panels, project pitches, working lunches, and live hacking, attendees will share
                updates across projects, address scientific and operational barriers, and shape future
                directions for BBQS research, coordination, and community building.
              </p>
            </CardContent>
          </Card>

          {/* Pre-workshop */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Video className="h-5 w-5 text-primary" />
                Pre-Event Virtual Session
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>
                <span className="font-medium text-foreground">Friday, July 10, 2026 · 12–4 PM ET</span> —
                BBQS Consortium project update. Each project gives a 5–10 minute presentation; slides shared
                via Google Drive. Brainhack ideas will be collected and voted on ahead of Day 2.
              </p>
              <a
                href="https://mit.zoom.us/meeting/register/D-RDlniDRbaPLys9DAdBaA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Register for the virtual session
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>

          {/* Agenda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-primary" />
                Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                <span className="font-semibold">Note:</span>{" "}
                <span className="text-muted-foreground">
                  Draft, working agenda — sessions will evolve as the event approaches and as community input shapes the program.
                </span>
              </div>
              <AgendaDay title="Day 1 — Wednesday, July 15, 2026" rows={day1} />
              <AgendaDay title="Day 2 — Thursday, July 16, 2026" rows={day2} />
              <AgendaDay title="Day 3 — Friday, July 17, 2026" rows={day3} />
            </CardContent>
          </Card>

          {/* Registration */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Registration:</span>{" "}
                Free to attend. Please register so we can plan accordingly.
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
              <div className="pt-2 border-t border-primary/10 flex flex-wrap gap-3">
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link to="/mit-workshop-2026/travel">
                    <Plane className="h-4 w-4" />
                    Travel & Hotels
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/mit-workshop-2026">
                    <CalendarIcon className="h-4 w-4" />
                    MIT Workshop logistics page
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

function ThemePillar({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function AgendaDay({ title, rows }: { title: string; rows: AgendaRow[] }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground mb-3">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-foreground">
            <tr>
              <th className="text-left font-semibold px-3 py-2 w-[80px]">Start</th>
              <th className="text-left font-semibold px-3 py-2 w-[80px]">End</th>
              <th className="text-left font-semibold px-3 py-2">Session</th>
              <th className="text-left font-semibold px-3 py-2 w-[200px]">Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([start, end, session, location], i) => (
              <tr key={i} className="border-t border-border align-top">
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{start}</td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{end}</td>
                <td className="px-3 py-2 text-foreground">{session}</td>
                <td className="px-3 py-2 text-muted-foreground">{location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CrossSpeciesSynchronization;