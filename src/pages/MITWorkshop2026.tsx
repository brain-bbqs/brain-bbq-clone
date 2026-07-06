import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar as CalendarIcon, DollarSign, Clock, Users, ExternalLink, LogIn, Plane, Wifi, Video, Link2, Target, Coffee, Presentation, Utensils, Camera, Sparkles, Vote, MessageCircle, PartyPopper, ChefHat, Mic } from "lucide-react";
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
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
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

              <AgendaDayWithMenu
                title="Day 1 — Wednesday, July 15, 2026 · Social Coordination"
                menuDay="Day 1 — Wed, Jul 15"
                rows={[
                  ["9:00", "10:00", "Coffee/Tea Morning Social — Morning Snacks & Ice Breakers; setup posters.", "Atrium", "", "d1-coffee-am"],
                  ["10:00", "10:15", "Introduction with Scientific and Technological Goals.", "Singleton", "Yes", undefined, "TBD — NIH representative"],
                  ["10:15", "10:30", "Highlight Last Year's BBQS Consortia — What's New? Emphasizing cross-species and translation: Pose Estimation, Cross-Species Behavior, Statistical Modeling of Social Behavior — and the goal of crossing these.", "Singleton", "Yes", undefined, "Satra Ghosh (MIT)"],
                  ["10:30", "12:15", "Data Pipeline Blitz — the data they are generating, the tools they have built or are using, and the research questions at the end of their pipeline.", "Singleton", "Yes", undefined, "BBQS project leads (round-robin)"],
                  ["12:15", "12:30", "Group Photo", "MIT Main Building & McGovern", ""],
                  ["12:30", "2:00", "BBQS Working Lunch: Minds & Matches — Focus: encourage social collaboration and new innovation. Secondary goal: breed new scientific ideas about cross-species synchronization. Assigned seating based on BBQS perspective of their projects.", "Atrium", "", "d1-lunch"],
                  ["2:00", "4:00", "BBQS Project Pitch (review proposed ideas) & discussion followed by Brainhack sessions. Identify volunteers to lead any new projects; leads set up projects using the Brainhack planning template and post slides. Current themes: Statistical Modeling of Social Behavior; Pose Estimation; Cross-Species Group.", "Singleton", "Yes"],
                  ["4:00", "6:00", "BBQS NeuroFair Poster and Demo Session + Reception: Devices, Data, and Ideas.", "Atrium / Seminar 3189", "", "d1-happy"],
                ]}
              />

              <AgendaDayWithMenu
                title="Day 2 — Thursday, July 16, 2026 · Active Working"
                menuDay="Day 2 — Thu, Jul 16"
                rows={[
                  ["9:00", "10:00", "Coffee/Tea Morning Social.", "Atrium / Seminar 3189", "Yes", "d2-coffee-am"],
                  ["10:00", "11:30", "Report Back from Day 1 Brainhack sessions and overview of what's next.", "Singleton", "Yes", undefined, "Brainhack session leads"],
                  ["11:30", "12:30", "Parallel working sessions: (Option A) From AI Literacy to Liability: Failure Points and Sensitive Data in the Age of Coding Agents. (Option B) Office Hours with WG-ELSI; pre-voting discussion about data sharing. (Option C) Brainhack working sessions.", "Singleton / Atrium / Seminar 3189", "Yes", undefined, "A: Satra Ghosh · B: WG-ELSI chairs"],
                  ["12:30", "2:30", "BBQS Working Lunch: Brainhack working sessions.", "Atrium", "Yes", "d2-lunch"],
                  ["2:30", "4:00", "Parallel working sessions: (PIs Required) Policy Formation Forum — voting on Data Sharing Policy, Data Usage Agreements, and Governance, followed by a Grants and Budgets discussion. (Option B) Young Investigator-led unconference, TOPIC TBD. (Option C) Brainhack working sessions.", "Singleton / Atrium / Seminar 3189", "Yes", undefined, "PI representatives · YI unconference lead: TBD"],
                  ["4:00", "6:00", "Poster Session II — Light Snack Reception (Brain-Boosting Snacks).", "Atrium", "", "d2-happy"],
                ]}
              />

              <AgendaDayWithMenu
                title="Day 3 — Friday, July 17, 2026 · Reflection"
                menuDay="Day 3 — Fri, Jul 17"
                rows={[
                  ["9:00", "10:00", "Coffee/Tea Morning Social.", "Atrium", "", "d3-coffee-am"],
                  ["10:00", "11:30", "Brainhack Sessions (cont'd).", "Singleton", "Yes"],
                  ["11:30", "12:30", "BBQS Working Lunch: Brainhack — wrap-up of deliverables and documentation.", "Atrium", "", "d3-lunch"],
                  ["12:30", "2:45", "Final project reports and parallel session summaries — what's next (add Brainhack slides to this section). Open mic discussion and town hall.", "Singleton", "Yes", undefined, "Brainhack leads · Open mic"],
                  ["2:45", "3:00", "Closing.", "Singleton", "Yes", undefined, "BBQS organizers"],
                ]}
              />
            </CardContent>
          </Card>

          <SpeakersCard />

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

type AgendaRow = [string, string, string, string, string, string?, string?];
// [startTime, endTime, description, location, zoom, mealKey?, speaker?]

type Meal = {
  key: string;
  day: string;
  label: string;
  time: string;
  items: string[];
};

export const WORKSHOP_MENU: Meal[] = [
  { key: "d1-coffee-am", day: "Day 1 — Wed, Jul 15", label: "Coffee & Tea Service",     time: "8:00 AM",  items: ["Freshly brewed coffee", "Assorted teas"] },
  { key: "d1-coffee-mid", day: "Day 1 — Wed, Jul 15", label: "Coffee & Tea Service",    time: "11:45 AM", items: ["Freshly brewed coffee", "Assorted teas"] },
  { key: "d1-lunch",   day: "Day 1 — Wed, Jul 15", label: "BYO — Greek Mediterranean Feast", time: "11:45 AM",
    items: ["Greek Chicken", "Greek Steak Tips", "Falafel", "Lemon Rice", "Roasted Veggies", "Lettuce", "Assorted Toppings", "Dessert"] },
  { key: "d1-happy",   day: "Day 1 — Wed, Jul 15", label: "Happy Hour Reception", time: "3:15 PM",
    items: ["Charcuterie & Cheese Platter, Fruit & Crostini", "Veggie Platter — Hummus & Tzatziki, Pita Chips", "Spinach & Artichoke Dip, Pita Chips", "Pastry Cups with Cheese & Fig", "Veggie Samosas", "Stuffed Mushrooms", "Burger Sliders", "Chicken Skewers", "Steak Skewers", "Shrimp Skewers", "Cookies & Brownies"] },

  { key: "d2-coffee-am", day: "Day 2 — Thu, Jul 16", label: "Coffee & Tea Service",     time: "8:00 AM",  items: ["Freshly brewed coffee", "Assorted teas"] },
  { key: "d2-coffee-mid", day: "Day 2 — Thu, Jul 16", label: "Coffee & Tea Service",    time: "11:45 AM", items: ["Freshly brewed coffee", "Assorted teas"] },
  { key: "d2-lunch",   day: "Day 2 — Thu, Jul 16", label: "Italian Feast", time: "11:45 AM",
    items: ["Meatballs", "Chicken Cutlet", "Chicken Piccata", "Broccoli Alfredo", "Roasted Veggies", "Pasta", "Marinara", "Salads", "Garlic Bread", "Dessert"] },
  { key: "d2-happy",   day: "Day 2 — Thu, Jul 16", label: "Happy Hour Reception", time: "3:45 PM",
    items: ["Charcuterie & Cheese Platter, Fruit & Crostini", "Veggie Platter — Hummus & Tzatziki, Pita Chips", "Spinach & Artichoke Dip, Pita Chips", "Pastry Cups with Cheese & Fig", "Veggie Samosas", "Cheese Arancini Balls", "Chicken Sliders", "Vegan Sliders", "BBQ Chicken Skewers", "Steak Skewers", "Shrimp Cocktail", "Cookies & Brownies"] },

  { key: "d3-coffee-am", day: "Day 3 — Fri, Jul 17", label: "Coffee & Tea Service",     time: "8:00 AM",  items: ["Freshly brewed coffee", "Assorted teas"] },
  { key: "d3-lunch",   day: "Day 3 — Fri, Jul 17", label: "BYO Burrito Bowl", time: "10:45 AM",
    items: ["Chicken Chipotle", "Taco Beef", "Grilled Shrimp", "Vegan Taco Meat", "Rice", "Black Beans", "Assorted Toppings", "Dessert"] },
];

const MEAL_BY_KEY: Record<string, Meal> = Object.fromEntries(WORKSHOP_MENU.map((m) => [m.key, m]));

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

function AgendaDay({ title, rows }: { title: string; rows: AgendaRow[] }) {
  const items = withAmPm(rows);
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground mb-3">{title}</h3>
      <div className="rounded-xl border border-border/70 bg-gradient-to-b from-background to-muted/20 shadow-[0_1px_0_hsl(var(--foreground)/0.04),0_10px_30px_-15px_hsl(var(--foreground)/0.15)] ring-1 ring-white/40 dark:ring-white/5 divide-y divide-border/60 overflow-hidden">
        {items.map(({ row, start, end, duration }, i) => {
          const [, , session, location, zoom, mealKey, speaker] = row;
          const kind = classifySession(session);
          const Icon = kind.icon;
          const meal = mealKey ? MEAL_BY_KEY[mealKey] : undefined;
          return (
            <div
              key={i}
              className={`group relative flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 hover:bg-primary/[0.03] transition-colors ${kind.tint}`}
            >
              {/* Accent bar */}
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${kind.dot}`} aria-hidden />

              {/* Time column */}
              <div className="sm:w-[130px] shrink-0 pl-2">
                <div className="flex items-center gap-1.5 text-foreground font-semibold text-sm tabular-nums">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {start.label}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  → {end.label}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mt-1">
                  {formatDuration(duration)}
                </div>
              </div>

              {/* Session content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
                    <Icon className="h-3 w-3" />
                    {kind.label}
                  </Badge>
                  {zoom && (
                    <Badge variant="outline" className="gap-1 text-[10px] border-primary/30 text-primary">
                      <Video className="h-3 w-3" />
                      Zoom
                    </Badge>
                  )}
                  {meal && (
                    <Badge variant="outline" className="gap-1 text-[10px] border-orange-500/40 text-orange-700 dark:text-orange-300">
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
                <p className="text-sm text-foreground leading-relaxed">{session}</p>
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

// -------------------- Speakers card --------------------

type SpeakerEntry = { name: string; affiliation?: string; role: string; when: string };

const SPEAKERS: SpeakerEntry[] = [
  { name: "TBD", affiliation: "NIH",  role: "Introduction — Scientific & Technological Goals", when: "Wed Jul 15 · 10:00 AM" },
  { name: "Satra Ghosh", affiliation: "MIT", role: "Highlight: Last Year's BBQS Consortia — What's New?", when: "Wed Jul 15 · 10:15 AM" },
  { name: "BBQS Project Leads", role: "Data Pipeline Blitz (round-robin)", when: "Wed Jul 15 · 10:30 AM" },
  { name: "Brainhack Session Leads", role: "Report Back from Day 1", when: "Thu Jul 16 · 10:00 AM" },
  { name: "Satra Ghosh", affiliation: "MIT", role: "Option A — AI Literacy to Liability", when: "Thu Jul 16 · 11:30 AM" },
  { name: "WG-ELSI Chairs", role: "Option B — Office Hours, pre-voting data-sharing discussion", when: "Thu Jul 16 · 11:30 AM" },
  { name: "Consortium PIs", role: "Policy Formation Forum — voting + Grants/Budgets", when: "Thu Jul 16 · 2:30 PM" },
  { name: "Young Investigator lead (TBD)", role: "Young Investigator unconference", when: "Thu Jul 16 · 2:30 PM" },
  { name: "Brainhack Leads · Open Mic", role: "Final project reports & town hall", when: "Fri Jul 17 · 12:30 PM" },
];

function SpeakersCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Mic className="h-5 w-5 text-primary" />
          Speakers & Talks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
          Confirmed and placeholder speakers by agenda slot. TBD slots will be filled as they're confirmed —
          if you're presenting and don't see your name, let the organizers know.
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
  );
}

// -------------------- Agenda + Menu side-by-side --------------------

function AgendaDayWithMenu({ title, menuDay, rows }: { title: string; menuDay: string; rows: AgendaRow[] }) {
  const meals = WORKSHOP_MENU.filter((m) => m.day === menuDay);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <AgendaDay title={title} rows={rows} />
      </div>
      <aside className="lg:col-span-1">
        <div className="lg:sticky lg:top-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ChefHat className="h-4 w-4 text-orange-500" />
            Menu for this day
          </div>
          {meals.map((meal) => (
            <div key={meal.key} className="rounded-lg border border-border/70 p-3 bg-orange-500/[0.04]">
              <div className="text-xs font-semibold text-foreground">{meal.label}</div>
              <div className="text-[11px] text-muted-foreground mb-2">{meal.time}</div>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                {meal.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
