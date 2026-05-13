import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, Clock, Users, Target, Video, ExternalLink, Sparkles, Network, LogIn, Plane, HeartPulse, Microscope, Bird } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import bbqsLogoIcon from "@/assets/bbqs-logo-icon.png";
import heroBg from "@/assets/cross-species-hero-bg.jpg";
import heroVideo from "@/assets/cross-species-hero.mp4.asset.json";
import speciesSpectrum from "@/assets/cross-species-spectrum.jpg";
import synergyImage from "@/assets/cross-project-synergy.jpg";

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
          <video
            src={heroVideo.url}
            poster={heroBg}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background pointer-events-none" />
          {/* Glossy sheen overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-60 mix-blend-overlay"
            style={{
              background:
                "radial-gradient(120% 80% at 20% 0%, hsl(var(--background) / 0.8) 0%, transparent 50%), radial-gradient(80% 60% at 80% 100%, hsl(var(--accent) / 0.25) 0%, transparent 60%)",
            }}
            aria-hidden="true"
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
            <p className="mt-5 text-lg text-foreground/85 max-w-2xl mx-auto leading-relaxed font-medium [text-shadow:0_1px_2px_hsl(var(--background)/0.9)]">
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
          {/* Species Spectrum visual */}
          <Card className="overflow-hidden border-primary/20">
            <div className="relative bg-[hsl(var(--background))]">
              <img
                src={speciesSpectrum}
                alt="Species spectrum — fly, fish, mouse, macaque, human connected by neural waveforms"
                width={1920}
                height={1080}
                loading="lazy"
                className="w-full h-auto block"
              />
            </div>
            <CardContent className="pt-5 text-center">
              <p className="text-sm text-muted-foreground italic max-w-2xl mx-auto">
                From a fly's escape to a human's conversation — different bodies, shared signals.
                Cross-species synchronization is the search for the principles that hold across them all.
              </p>
            </CardContent>
          </Card>

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

          {/* Cross-project synergy */}
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-5 gap-0">
              <div className="md:col-span-2 bg-muted/30 flex items-center justify-center p-6">
                <img
                  src={synergyImage}
                  alt="Abstract network of connected nodes representing cross-project synergy"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  className="w-full h-auto max-w-xs"
                />
              </div>
              <div className="md:col-span-3 p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Cross-Project Synergy</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No single project sees the whole picture. The BBQS Consortium is a network — methods
                  developed for one species feed pipelines used by another; benchmarks built for one task
                  reshape how a different team frames theirs.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This event exists to make those connections visible: pairing experimentalists with
                  theorists, data with models, and individual deliverables with the shared infrastructure
                  that lets the whole consortium move forward together.
                </p>
              </div>
            </div>
          </Card>

          {/* About */}
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div
              className="absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-40 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.4), transparent 70%)" }}
              aria-hidden="true"
            />
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

          {/* A first: mixing fields */}
          <Card className="relative overflow-hidden border-accent/30 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div
              className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full opacity-40 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.35), transparent 70%)" }}
              aria-hidden="true"
            />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-accent" />
                A First — Bringing These Fields Together
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed space-y-5">
              <p>
                BBQS is, in many ways, the first time these communities have sat at the same table.
                Neuroscientists who record from single neurons, computational modelers who simulate
                circuits, machine-learning researchers who build pose-tracking pipelines, and{" "}
                <span className="font-medium text-foreground">ethologists</span> — the scientists who
                study animal behavior in its natural form — have historically worked in parallel,
                speaking different languages.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 pt-1">
                <ThemePillar
                  icon={<Microscope className="h-5 w-5 text-primary" />}
                  title="Neuroscience & ML"
                  body="Neural recordings, computational models, and modern machine-learning pipelines for behavior."
                />
                <ThemePillar
                  icon={<Bird className="h-5 w-5 text-primary" />}
                  title="Ethology"
                  body="Decades of careful observation of how animals actually behave — in the wild, in groups, over time."
                />
                <ThemePillar
                  icon={<Network className="h-5 w-5 text-primary" />}
                  title="Shared language"
                  body="A common vocabulary so a fly's escape, a mouse's bout, and a human's gesture can be compared."
                />
              </div>
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 flex gap-3 items-start">
                <HeartPulse className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Why this matters for human health</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Many of the conditions we care most about — autism, Parkinson's, depression, ADHD,
                    addiction — are first and most clearly visible in <em>behavior</em>. If we can quantify
                    behavior precisely across species and link it to brain activity, animal models stop
                    being rough analogies and start being measurable, translatable evidence. That is the
                    bridge from a fly's circuit to a person's clinic.
                  </p>
                </div>
              </div>
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
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-md">
                  <Clock className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">Three days at MIT</p>
                  <CardTitle className="text-2xl">Program Agenda</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground italic">
                <span className="font-semibold not-italic">Draft agenda</span>{" "}
                <span className="text-muted-foreground">— sessions will evolve as the event approaches and as community input shapes the program.</span>
              </div>
              <AgendaDay dayLabel="Day 01" date="Wed · Jul 15, 2026" subtitle="Convene & Connect" rows={day1} />
              <AgendaDay dayLabel="Day 02" date="Thu · Jul 16, 2026" subtitle="Build & Hack" rows={day2} />
              <AgendaDay dayLabel="Day 03" date="Fri · Jul 17, 2026" subtitle="Synthesize & Send Off" rows={day3} />
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

function AgendaDay({
  dayLabel,
  date,
  subtitle,
  rows,
}: {
  dayLabel: string;
  date: string;
  subtitle: string;
  rows: AgendaRow[];
}) {
  return (
    <div className="relative">
      {/* Day banner */}
      <div className="relative mb-5 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent px-5 py-4">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{dayLabel}</span>
          <span className="text-base font-semibold text-foreground">{date}</span>
          <span className="text-sm italic text-muted-foreground">{subtitle}</span>
        </div>
      </div>

      {/* Timeline */}
      <ol className="relative space-y-3 border-l-2 border-dashed border-primary/20 pl-5 ml-2">
        {rows.map(([start, end, session, location], i) => (
          <li key={i} className="group relative">
            {/* Dot */}
            <span
              className="absolute -left-[27px] top-4 h-3 w-3 rounded-full bg-gradient-to-br from-primary to-accent ring-4 ring-background shadow"
              aria-hidden="true"
            />
            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 py-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                {/* Time chip */}
                <div className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/15 px-2.5 py-1 text-xs font-mono font-semibold text-foreground tabular-nums w-fit">
                  <Clock className="h-3 w-3 text-primary" />
                  {start}<span className="text-muted-foreground">—</span>{end}
                </div>
                {/* Body */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{session}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {location}
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default CrossSpeciesSynchronization;