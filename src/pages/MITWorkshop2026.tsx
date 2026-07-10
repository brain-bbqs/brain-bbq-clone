import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar as CalendarIcon, DollarSign, Clock, Users, ExternalLink, LogIn, Plane, Wifi, Video, Link2, Target, Coffee, Presentation, Utensils, Camera, Sparkles, Vote, MessageCircle, PartyPopper, ChefHat, Mic, LayoutGrid, ArrowRight, Radio, ChevronRight } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import bbqsLogoIcon from "@/assets/bbqs-logo-icon.png";
import { MEAL_BY_KEY } from "@/data/mit-workshop-2026";
import { useEffect, useMemo, useState } from "react";

// --- Live time helpers (America/New_York; workshop runs Jul 15–17, 2026) ---

type EtNow = { y: number; mo: number; d: number; minutes: number; isTest: boolean };

function readEtNow(): EtNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const y = get("year"), mo = get("month"), d = get("day");
  const minutes = get("hour") * 60 + get("minute");
  const inWindow = y === 2026 && mo === 7 && (d === 15 || d === 16 || d === 17);
  if (inWindow) return { y, mo, d, minutes, isTest: false };
  // Test mode: pretend today is July 15, 2026 (keep current wall-clock minutes so timeline animates).
  return { y: 2026, mo: 7, d: 15, minutes, isTest: true };
}

function useLiveEtNow(): EtNow {
  const [now, setNow] = useState<EtNow>(() => readEtNow());
  useEffect(() => {
    const tick = () => setNow(readEtNow());
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

// --- Agenda data (declared before component to avoid TDZ during render) ---
type AgendaRow = [string, string, string, string, string, string?, string?, ParallelOption[]?];
type ParallelOption = { label: string; title: string; location: string; speaker?: string };

const DAY1_ROWS: AgendaRow[] = [
  ["9:00", "10:00", "Coffee/Tea Morning Social — Morning Snacks & Ice Breakers; setup posters.", "Atrium", "", "d1-coffee-am"],
  ["10:00", "10:15", "Introduction with Scientific and Technological Goals.", "Singleton", "Yes", undefined, "TBD — NIH representative"],
  ["10:15", "10:30", "Highlight Last Year's BBQS Consortia — What's New? Emphasizing cross-species and translation: Pose Estimation, Cross-Species Behavior, Statistical Modeling of Social Behavior — and the goal of crossing these.", "Singleton", "Yes", undefined, "Satra Ghosh (MIT)"],
  ["10:30", "12:15", "Data Pipeline Blitz — the data they are generating, the tools they have built or are using, and the research questions at the end of their pipeline.", "Singleton", "Yes", undefined, "BBQS project leads (round-robin)"],
  ["12:15", "12:30", "Group Photo", "MIT Main Building & McGovern", ""],
  ["12:30", "2:00", "BBQS Working Lunch: Minds & Matches — Focus: encourage social collaboration and new innovation. Secondary goal: breed new scientific ideas about cross-species synchronization. Assigned seating based on BBQS perspective of their projects.", "Atrium", "", "d1-lunch"],
  ["2:00", "4:00", "BBQS Project Pitch (review proposed ideas) & discussion followed by Brainhack sessions. Identify volunteers to lead any new projects; leads set up projects using the Brainhack planning template and post slides. Current themes: Statistical Modeling of Social Behavior; Pose Estimation; Cross-Species Group.", "Singleton", "Yes"],
  ["4:00", "6:00", "BBQS NeuroFair Poster and Demo Session + Reception: Devices, Data, and Ideas.", "Atrium / Seminar 3189", "", "d1-happy"],
];
const DAY2_ROWS: AgendaRow[] = [
  ["9:00", "10:00", "Coffee/Tea Morning Social.", "Atrium / Seminar 3189", "Yes", "d2-coffee-am"],
  ["10:00", "11:30", "Report Back from Day 1 Brainhack sessions and overview of what's next.", "Singleton", "Yes", undefined, "Brainhack session leads"],
  ["11:30", "12:30", "Parallel working sessions — pick one; feel free to move between rooms.", "Singleton / Atrium / Seminar 3189", "Yes", undefined, undefined, [
    { label: "Option A", title: "From AI Literacy to Liability: Failure Points and Sensitive Data in the Age of Coding Agents.", location: "Singleton", speaker: "Satra Ghosh" },
    { label: "Option B", title: "Office Hours with WG-ELSI — discussion about data usage.", location: "Seminar 3189", speaker: "WG-ELSI chairs" },
    { label: "Option C", title: "Brainhack working sessions.", location: "Atrium" },
  ]],
  ["12:30", "2:00", "BBQS Working Lunch.", "Atrium", "Yes", "d2-lunch"],
  ["2:00", "3:00", "Parallel working sessions — pick one; feel free to move between rooms.", "Singleton / Atrium / Seminar 3189", "Yes", undefined, undefined, [
    { label: "Option A (PIs Required)", title: "Policy Formation Forum — voting on Data Sharing Policy, Data Usage Agreements, and Governance.", location: "Singleton", speaker: "PI representatives" },
    { label: "Option B", title: "Young Investigator-led unconference.", location: "Seminar 3189", speaker: "Megan Peters" },
    { label: "Option C", title: "Brainhack working sessions.", location: "Atrium" },
  ]],
  ["3:00", "4:00", "Discussion with the NIH — What do you want the NIH to know?", "Singleton", "Yes", undefined, "NIH representatives"],
  ["4:00", "6:00", "Poster Session II — Light Snack Reception (Brain-Boosting Snacks).", "Atrium", "", "d2-happy"],
];
const DAY3_ROWS: AgendaRow[] = [
  ["9:00", "10:00", "Coffee/Tea Morning Social.", "Atrium", "", "d3-coffee-am"],
  ["10:00", "11:30", "Brainhack Sessions (cont'd).", "Singleton", "Yes"],
  ["11:30", "12:30", "BBQS Working Lunch: Brainhack — wrap-up of deliverables and documentation.", "Atrium", "", "d3-lunch"],
  ["12:30", "2:45", "Final project reports and parallel session summaries — what's next (add Brainhack slides to this section). Open mic discussion and town hall.", "Singleton", "Yes", undefined, "Brainhack leads · Open mic"],
  ["2:45", "3:00", "Closing remarks.", "Singleton", "Yes", undefined, "Sully"],
];

const MITWorkshop2026 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = useLiveEtNow();
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
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <img src={bbqsLogoIcon} alt="BBQS Logo" className="h-20 w-20 sm:h-32 sm:w-32 mb-4 sm:mb-6 mx-auto rounded-full" />
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="text-xs uppercase tracking-wider">
                Conference
              </Badge>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                Upcoming
              </Badge>
            </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight max-w-3xl">
              2<sup>nd</sup> Annual Brain Behavior Quantification and Synchronization Workshop at MIT
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 sm:mt-6 text-sm sm:text-base text-muted-foreground">
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
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6">
          {/* Sub-page navigator */}
          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
            {[
              { to: "/mit-workshop-2026/travel", label: "Travel & Hotel", desc: "Getting there, hotels, transit", icon: Plane },
              { to: "/mit-workshop-2026/participants", label: "Participants", desc: "Who's attending", icon: Users },
              { to: "/mit-workshop-2026/speakers", label: "Speakers & Talks", desc: "Program & speakers", icon: Mic },
              { to: "/mit-workshop-2026/menu", label: "Menu", desc: "Daily catering & meals", icon: ChefHat },
              { to: "/mit-workshop-2026/seating", label: "Seating Chart", desc: "Floor plan & tables", icon: LayoutGrid },
              { to: "#logistics", label: "Wi-Fi & Logistics", desc: "Rooms, Wi-Fi, Zoom, Slack", icon: Wifi },
            ].map(({ to, label, desc, icon: Icon }) => (
              (to.startsWith("#") ? (
                <a
                  key={to}
                  href={to}
                  className="group rounded-xl border border-border/60 bg-card hover:border-primary/50 hover:shadow-md transition-all p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-foreground">{label}</div>
                    <div className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block">{desc}</div>
                  </div>
                </a>
              ) : (
              <Link
                key={to}
                to={to}
                className="group rounded-xl border border-border/60 bg-card hover:border-primary/50 hover:shadow-md transition-all p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-foreground">{label}</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block">{desc}</div>
                </div>
              </Link>
              ))
            ))}
          </div>

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
                <span className="ml-auto text-[11px] font-normal text-muted-foreground hidden sm:inline">
                  All times shown in Eastern Time (America/New_York)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-3 sm:px-6">
              <LiveNowBanner now={now} />
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">Format</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unconference, working meeting, and hackathon — open to the full BBQS Consortium and collaborators. Coding is <span className="font-medium text-foreground">not</span> a requirement.
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
                dayNumber={15}
                now={now}
                title="Day 1 — Wednesday, July 15, 2026 · Social Coordination"
                rows={DAY1_ROWS}
              />

              <AgendaDay
                dayNumber={16}
                now={now}
                title="Day 2 — Thursday, July 16, 2026 · Active Working"
                rows={DAY2_ROWS}
              />

              <AgendaDay
                dayNumber={17}
                now={now}
                title="Day 3 — Friday, July 17, 2026 · Reflection"
                rows={DAY3_ROWS}
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

          <Card id="logistics">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-primary" />
                Event Location & Rooms
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <span className="font-semibold text-foreground">Building 46</span> — MIT Brain &amp; Cognitive Sciences Complex.
                Entrances on both <span className="text-foreground">Main St</span> and <span className="text-foreground">Vassar St</span> should be open throughout the day.{" "}
                <a
                  href="https://whereis.mit.edu/?go=46"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View on MIT map
                </a>.
              </p>
              <p>The event will take place in:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-medium text-foreground">Singleton Auditorium</span> (46-3002)</li>
                <li><span className="font-medium text-foreground">Seminar Room</span> 46-3189</li>
                <li><span className="font-medium text-foreground">Atrium</span></li>
              </ul>
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
                    <span className="font-medium text-foreground">Wi-Fi — Eduroam:</span>{" "}
                    If your home institution participates in Eduroam, sign in with your home credentials to connect at MIT.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Wifi className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Wi-Fi — MIT GUEST:</span>{" "}
                    Connect and enter your email or mobile number. Without SMS/email access (e.g. international travelers),
                    choose <span className="text-foreground">"Request Access from Sponsor"</span> and enter your MIT host's email.{" "}
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
                  <MessageCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Slack:</span>{" "}
                    You should have received an invitation to the BBQS Slack workspace. If not, please fill in the onboarding form.
                    Sign in with your guest account (unless you are at MIT):{" "}
                    <a href="https://mit-brain-bbqs.slack.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      mit-brain-bbqs.slack.com
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ExternalLink className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Website & Calendar:</span>{" "}
                    <a href="https://brain-bbqs.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      brain-bbqs.org
                    </a>{" "}·{" "}
                    <a href="https://brain-bbqs.org/calendar/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      calendar
                    </a>{" "}·{" "}
                    <a href="https://youtube.com/@brain-bbqs" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      YouTube
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

type ParallelOption = { label: string; title: string; location?: string; speaker?: string };
type AgendaRow = [string, string, string, string, string, string?, string?, ParallelOption[]?];
// [startTime, endTime, description, location, zoom, mealKey?, speaker?, parallelOptions?]

// Convert "9:00" / "2:30" (assumed AM before 8, PM after) into minutes for duration + AM/PM display
function parseTime(t: string, isAfternoon: boolean): { minutes: number; label: string } {
  const [h, m] = t.split(":").map(Number);
  const hour24 = isAfternoon && h < 8 ? h + 12 : h;
  const minutes = hour24 * 60 + (m || 0);
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const label = `${h12}:${String(m || 0).padStart(2, "0")} ${suffix}`;
  return { minutes, label };
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

type SessionKind = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dot: string; // tailwind bg color for accent bar
  tint: string; // subtle background tint
};

const KINDS: Record<string, SessionKind> = {
  coffee:   { key: "coffee",   label: "Social",       icon: Coffee,       dot: "bg-amber-500",     tint: "bg-amber-500/5" },
  talk:     { key: "talk",     label: "Talk",         icon: Presentation, dot: "bg-primary",       tint: "bg-primary/5" },
  lunch:    { key: "lunch",    label: "Lunch",        icon: Utensils,     dot: "bg-orange-500",    tint: "bg-orange-500/5" },
  photo:    { key: "photo",    label: "Group Photo",  icon: Camera,       dot: "bg-sky-500",       tint: "bg-sky-500/5" },
  hack:     { key: "hack",     label: "Brainhack",    icon: Sparkles,     dot: "bg-violet-500",    tint: "bg-violet-500/5" },
  poster:   { key: "poster",   label: "Posters",      icon: Users,        dot: "bg-emerald-500",   tint: "bg-emerald-500/5" },
  policy:   { key: "policy",   label: "Policy",       icon: Vote,         dot: "bg-rose-500",      tint: "bg-rose-500/5" },
  townhall: { key: "townhall", label: "Open Mic",     icon: MessageCircle, dot: "bg-indigo-500",   tint: "bg-indigo-500/5" },
  closing:  { key: "closing",  label: "Closing",      icon: PartyPopper,  dot: "bg-pink-500",      tint: "bg-pink-500/5" },
};

function classifySession(text: string): SessionKind {
  const t = text.toLowerCase();
  if (t.includes("coffee") || t.includes("morning social")) return KINDS.coffee;
  if (t.includes("closing")) return KINDS.closing;
  if (t.includes("group photo")) return KINDS.photo;
  if (t.includes("lunch")) return KINDS.lunch;
  if (t.includes("poster")) return KINDS.poster;
  if (t.includes("policy") || t.includes("voting")) return KINDS.policy;
  if (t.includes("open mic") || t.includes("town hall")) return KINDS.townhall;
  if (t.includes("brainhack") || t.includes("hack")) return KINDS.hack;
  return KINDS.talk;
}

// Rows before this index are AM; from this index onward, times < 8 are PM.
// We detect the crossover per-day using the first row whose start time is smaller than the previous row.
function withAmPm(rows: AgendaRow[]) {
  let afternoon = false;
  let prev = -1;
  return rows.map((row) => {
    const [startStr, endStr] = row;
    const startH = parseInt(startStr.split(":")[0], 10);
    if (startH < prev) afternoon = true;
    prev = startH;
    const start = parseTime(startStr, afternoon);
    // End might also be afternoon even if start was AM (e.g., 10:30 → 12:15)
    const endH = parseInt(endStr.split(":")[0], 10);
    const endAfternoon = afternoon || (endH < startH);
    const end = parseTime(endStr, endAfternoon);
    return { row, start, end, duration: Math.max(1, end.minutes - start.minutes) };
  });
}

function AgendaDay({ title, rows, dayNumber, now }: { title: string; rows: AgendaRow[]; dayNumber: number; now: EtNow }) {
  const items = withAmPm(rows);
  registerDay(dayNumber, items);
  const isToday = now.y === 2026 && now.mo === 7 && now.d === dayNumber;
  const activeIndex = isToday
    ? items.findIndex((it) => now.minutes >= it.start.minutes && now.minutes < it.end.minutes)
    : -1;
  const upcomingIndex = isToday && activeIndex === -1
    ? items.findIndex((it) => now.minutes < it.start.minutes)
    : -1;
  const isPast = !isToday && (now.d > dayNumber || (now.d === dayNumber && items.every((it) => now.minutes >= it.end.minutes)));
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">{title}</h3>
        {isToday && (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Today
          </Badge>
        )}
        {isPast && (
          <Badge variant="outline" className="text-muted-foreground">Wrapped</Badge>
        )}
      </div>
      <div className="rounded-xl border border-border/70 bg-gradient-to-b from-background to-muted/20 shadow-[0_1px_0_hsl(var(--foreground)/0.04),0_10px_30px_-15px_hsl(var(--foreground)/0.15)] ring-1 ring-white/40 dark:ring-white/5 divide-y divide-border/60 overflow-hidden">
        {items.map(({ row, start, end, duration }, i) => {
          const [, , session, location, zoom, mealKey, speaker, options] = row;
          const kind = classifySession(session);
          const Icon = kind.icon;
          const meal = mealKey ? MEAL_BY_KEY[mealKey] : undefined;
          const isActive = i === activeIndex;
          const isNext = i === upcomingIndex;
          const isDone = isToday && now.minutes >= end.minutes;
          // Progress through the currently-live block (0..1)
          const progress = isActive ? Math.min(1, Math.max(0, (now.minutes - start.minutes) / Math.max(1, end.minutes - start.minutes))) : 0;
          return (
            <div
              key={i}
              id={isActive ? "live-now-session" : undefined}
              className={`group relative flex flex-col sm:flex-row gap-2 sm:gap-4 p-3 sm:p-4 transition-colors ${
                isActive
                  ? "bg-red-500/[0.06] ring-2 ring-red-500/40 rounded-md z-10"
                  : isNext
                    ? "bg-primary/[0.05]"
                    : isDone
                      ? "opacity-60"
                      : "hover:bg-primary/[0.03] " + kind.tint
              }`}
            >
              {/* Accent bar */}
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${isActive ? "bg-red-500" : kind.dot}`} aria-hidden />

              {isActive && (
                <>
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-70" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    Happening now
                  </span>
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-0.5 bg-red-500/70 transition-all"
                    style={{ width: `${progress * 100}%` }}
                  />
                </>
              )}
              {isNext && (
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <ChevronRight className="h-3 w-3" />
                  Up next
                </span>
              )}

              {/* Time column */}
              <div className="sm:w-[130px] shrink-0 pl-2 flex flex-row sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0">
                <div className="flex items-center gap-1.5 text-foreground font-semibold text-sm tabular-nums">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {start.label}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums sm:mt-0.5">
                  → {end.label}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 sm:mt-1">
                  {formatDuration(duration)}
                </div>
              </div>

              {/* Session content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
                    <Icon className="h-3 w-3" />
                    {kind.label}
                  </Badge>
                  {options && options.length > 0 && (
                    <Badge variant="outline" className="gap-1 text-[10px] border-violet-500/40 text-violet-700 dark:text-violet-300">
                      <Sparkles className="h-3 w-3" />
                      {options.length} parallel options
                    </Badge>
                  )}
                  {zoom && (
                    <Badge variant="outline" className="gap-1 text-[10px] border-primary/30 text-primary">
                      <Video className="h-3 w-3" />
                      Zoom
                    </Badge>
                  )}
                  {meal && (
                    <Badge variant="outline" className="gap-1 text-[10px] border-orange-500/40 text-orange-700 dark:text-orange-300 hidden sm:inline-flex">
                      <ChefHat className="h-3 w-3" />
                      {meal.label}
                    </Badge>
                  )}
                  {speaker && (
                    <Badge variant="outline" className="gap-1 text-[10px] border-primary/30 text-primary">
                      <Mic className="h-3 w-3" />
                      {speaker}
                    </Badge>
                  )}
                </div>
                <p className={`text-sm text-foreground leading-relaxed ${isActive ? "font-medium" : ""}`}>{session}</p>
                {options && options.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    {options.map((opt) => (
                      <div
                        key={opt.label}
                        className="rounded-lg border border-violet-500/30 bg-violet-500/[0.04] p-3 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] font-semibold border-violet-500/50 text-violet-700 dark:text-violet-300">
                            {opt.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground leading-snug">{opt.title}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-auto">
                          {opt.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {opt.location}
                            </span>
                          )}
                          {opt.speaker && (
                            <span className="inline-flex items-center gap-1">
                              <Mic className="h-3 w-3" />
                              {opt.speaker}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{location}</span>
                </div>
                {meal && (
                  <details className="mt-2 group/menu">
                    <summary className="cursor-pointer text-xs text-orange-700 dark:text-orange-300 hover:underline inline-flex items-center gap-1">
                      <Utensils className="h-3 w-3" />
                      View menu ({meal.items.length} items)
                    </summary>
                    <ul className="mt-2 ml-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground list-disc pl-5">
                      {meal.items.map((it) => <li key={it}>{it}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Live-now banner ----------------

const DAY1_ROWS: AgendaRow[] = [
  ["9:00", "10:00", "Coffee/Tea Morning Social — Morning Snacks & Ice Breakers; setup posters.", "Atrium", "", "d1-coffee-am"],
  ["10:00", "10:15", "Introduction with Scientific and Technological Goals.", "Singleton", "Yes", undefined, "TBD — NIH representative"],
  ["10:15", "10:30", "Highlight Last Year's BBQS Consortia — What's New? Emphasizing cross-species and translation: Pose Estimation, Cross-Species Behavior, Statistical Modeling of Social Behavior — and the goal of crossing these.", "Singleton", "Yes", undefined, "Satra Ghosh (MIT)"],
  ["10:30", "12:15", "Data Pipeline Blitz — the data they are generating, the tools they have built or are using, and the research questions at the end of their pipeline.", "Singleton", "Yes", undefined, "BBQS project leads (round-robin)"],
  ["12:15", "12:30", "Group Photo", "MIT Main Building & McGovern", ""],
  ["12:30", "2:00", "BBQS Working Lunch: Minds & Matches — Focus: encourage social collaboration and new innovation. Secondary goal: breed new scientific ideas about cross-species synchronization. Assigned seating based on BBQS perspective of their projects.", "Atrium", "", "d1-lunch"],
  ["2:00", "4:00", "BBQS Project Pitch (review proposed ideas) & discussion followed by Brainhack sessions. Identify volunteers to lead any new projects; leads set up projects using the Brainhack planning template and post slides. Current themes: Statistical Modeling of Social Behavior; Pose Estimation; Cross-Species Group.", "Singleton", "Yes"],
  ["4:00", "6:00", "BBQS NeuroFair Poster and Demo Session + Reception: Devices, Data, and Ideas.", "Atrium / Seminar 3189", "", "d1-happy"],
];
const DAY2_ROWS: AgendaRow[] = [
  ["9:00", "10:00", "Coffee/Tea Morning Social.", "Atrium / Seminar 3189", "Yes", "d2-coffee-am"],
  ["10:00", "11:30", "Report Back from Day 1 Brainhack sessions and overview of what's next.", "Singleton", "Yes", undefined, "Brainhack session leads"],
  ["11:30", "12:30", "Parallel working sessions — pick one; feel free to move between rooms.", "Singleton / Atrium / Seminar 3189", "Yes", undefined, undefined, [
    { label: "Option A", title: "From AI Literacy to Liability: Failure Points and Sensitive Data in the Age of Coding Agents.", location: "Singleton", speaker: "Satra Ghosh" },
    { label: "Option B", title: "Office Hours with WG-ELSI — discussion about data usage.", location: "Seminar 3189", speaker: "WG-ELSI chairs" },
    { label: "Option C", title: "Brainhack working sessions.", location: "Atrium" },
  ]],
  ["12:30", "2:00", "BBQS Working Lunch.", "Atrium", "Yes", "d2-lunch"],
  ["2:00", "3:00", "Parallel working sessions — pick one; feel free to move between rooms.", "Singleton / Atrium / Seminar 3189", "Yes", undefined, undefined, [
    { label: "Option A (PIs Required)", title: "Policy Formation Forum — voting on Data Sharing Policy, Data Usage Agreements, and Governance.", location: "Singleton", speaker: "PI representatives" },
    { label: "Option B", title: "Young Investigator-led unconference.", location: "Seminar 3189", speaker: "Megan Peters" },
    { label: "Option C", title: "Brainhack working sessions.", location: "Atrium" },
  ]],
  ["3:00", "4:00", "Discussion with the NIH — What do you want the NIH to know?", "Singleton", "Yes", undefined, "NIH representatives"],
  ["4:00", "6:00", "Poster Session II — Light Snack Reception (Brain-Boosting Snacks).", "Atrium", "", "d2-happy"],
];
const DAY3_ROWS: AgendaRow[] = [
  ["9:00", "10:00", "Coffee/Tea Morning Social.", "Atrium", "", "d3-coffee-am"],
  ["10:00", "11:30", "Brainhack Sessions (cont'd).", "Singleton", "Yes"],
  ["11:30", "12:30", "BBQS Working Lunch: Brainhack — wrap-up of deliverables and documentation.", "Atrium", "", "d3-lunch"],
  ["12:30", "2:45", "Final project reports and parallel session summaries — what's next (add Brainhack slides to this section). Open mic discussion and town hall.", "Singleton", "Yes", undefined, "Brainhack leads · Open mic"],
  ["2:45", "3:00", "Closing remarks.", "Singleton", "Yes", undefined, "Sully"],
];

// Eagerly populate the live-schedule cache so the LiveNowBanner works on first render.
registerDay(15, withAmPm(DAY1_ROWS));
registerDay(16, withAmPm(DAY2_ROWS));
registerDay(17, withAmPm(DAY3_ROWS));

function fmtMinutes(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// Duplicated day source of truth is expensive to maintain — the banner instead
// walks the DOM after render is not clean either. Simpler: mirror the schedule
// by re-declaring day/date pairs, and re-use the same rows via a global registry.
// To keep this file self-contained without a second copy of the agenda rows,
// we compute the live session by re-parsing the same rows passed to AgendaDay
// via a module-scope cache that AgendaDay populates on render.

const LIVE_CACHE = new Map<number, { start: number; end: number; label: string; kind: SessionKind; location: string }[]>();

// We hook into AgendaDay via a side effect. Instead of refactoring, expose a
// registration helper that AgendaDay calls. (See `withAmPm` above.)
// The banner then reads from LIVE_CACHE.
function registerDay(dayNumber: number, items: ReturnType<typeof withAmPm>) {
  LIVE_CACHE.set(
    dayNumber,
    items.map(({ row, start, end }) => ({
      start: start.minutes,
      end: end.minutes,
      label: row[2],
      kind: classifySession(row[2]),
      location: row[3],
    })),
  );
}

function LiveNowBanner({ now }: { now: EtNow }) {
  const day = LIVE_CACHE.get(now.d);
  const active = day?.find((it) => now.minutes >= it.start && now.minutes < it.end);
  const upcoming = !active ? day?.find((it) => now.minutes < it.start) : undefined;
  const label = active ? "Happening now" : upcoming ? "Up next" : "Nothing scheduled right now";
  const item = active || upcoming;
  const Icon = item?.kind.icon ?? Clock;
  return (
    <div className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sticky top-2 z-20 backdrop-blur">
      <div className="flex items-center gap-2 sm:min-w-[140px]">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${active ? "bg-red-500 opacity-70" : "bg-primary opacity-40"}`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${active ? "bg-red-500" : "bg-primary"}`} />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 dark:text-red-400">
            {label}
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {fmtMinutes(now.minutes)} ET · Jul {now.d}
            {now.isTest && <span className="ml-1 text-amber-600 dark:text-amber-400">· test mode</span>}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {item ? (
          <div className="flex items-start gap-2">
            <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-2">{item.label}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {fmtMinutes(item.start)} → {fmtMinutes(item.end)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.location}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">The workshop schedule has wrapped for the day.</p>
        )}
      </div>
      {active && (
        <a
          href="#live-now-session"
          className="text-xs font-semibold text-primary hover:underline shrink-0 self-start sm:self-auto"
        >
          Jump to session →
        </a>
      )}
    </div>
  );
}

