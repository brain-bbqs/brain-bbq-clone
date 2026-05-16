import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar as CalendarIcon, DollarSign, Clock, Users, ExternalLink, LogIn, Plane, Wifi, Video, Link2, Target } from "lucide-react";
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
              <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                <span className="font-semibold">Note:</span>{" "}
                <span className="text-muted-foreground">
                  This is a draft, working agenda. Sessions will remain ongoing and dynamic — expect updates as the workshop approaches and as community input shapes the program.
                </span>
              </div>

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

              <div>
                <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" /> Pre-Workshop Virtual Session
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Friday, July 10, 2026 · 12–4 PM ET</span> — BBQS Consortium project update.
                  A representative from each project gives a 5–10 minute presentation; slides shared in Google Drive.
                  Ahead of the meeting, we will circulate a method to collect and vote on Brainhack ideas (final selection on Day 2).
                </p>
                <a
                  href="https://mit.zoom.us/meeting/register/D-RDlniDRbaPLys9DAdBaA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Register for the virtual session
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <AgendaDay
                title="Day 1 — Wednesday, July 15, 2026"
                rows={[
                  ["9:00", "10:00", "Coffee/Tea Morning Social — Snacks & Ice Breakers", "Atrium"],
                  ["10:00", "10:15", "Highlight Last Year's BBQS Consortia — What's New? (Satra Ghosh). Exciting things to look forward to and social events. Emphasizing a theme of cross-species and translation.", "Singleton"],
                  ["10:15", "10:30", "Scientific and Technological Goals — NIH", "Singleton"],
                  ["10:30", "11:30", "Perspective Cross-Species Panel Discussion — what is the fundamental unifying principle across different neuroscience studies?", "Singleton"],
                  ["11:30", "12:00", "BBQS Community Resource & Leadership Roll Call — brief intros highlighting domains of expertise and available resources; identify potential project leads and points of contact across BBQS (facilitated by Nader & Sul).", "Singleton"],
                  ["12:00", "2:00", "BBQS Task Force Working Lunch: Minds & Matches — encourage social collaboration and new innovation; secondary goal: breed new scientific ideas about cross-species synchronization. Assigned seating based on BBQS perspective of their projects.", "Atrium"],
                  ["2:00", "2:30", "Group Photo", "MIT Main Building & McGovern"],
                  ["2:30", "4:00", "BBQS Project Pitch & discussion — review proposed ideas & choose parallel sessions; identify volunteers to lead projects; define goals; gather information and share back via slides in BBQS Google Drive folder; GitHub workflow for project submission into the consortia.", "Singleton"],
                  ["4:00", "6:00", "BBQS NeuroFair Poster and Demo Session: Devices, Data, and Ideas", "Atrium / Seminar 3189"],
                ]}
              />

              <AgendaDay
                title="Day 2 — Thursday, July 16, 2026"
                rows={[
                  ["7:00", "8:00", "Ultimate Frisbee", "MIT Athletic Field"],
                  ["9:00", "10:00", "Coffee/Tea Morning Social. Policy Formation Forum — voting on Data Sharing Policy and Data Usage Agreements (break-out for PIs).", "Atrium / Seminar 3189"],
                  ["10:00", "11:00", "From AI Literacy to Liability: Failure Points and Sensitive Data in the Age of Coding Agents", "Singleton"],
                  ["11:00", "12:00", "Build an AI-Powered Agentic Data Pipeline: Ingestion, ML Analysis, and Reporting Workshop (Optional)", "Seminar 3189"],
                  ["12:00", "2:00", "BBQS Projects Working Lunch (Zoom available)", "Atrium"],
                  ["2:00", "3:00", "BBQS Unconference: Community-Led Topics & Lightning Discussions", "Singleton"],
                  ["3:00", "4:30", "Live Hacking", "Singleton / Atrium / Seminar 3189"],
                  ["4:00", "6:00", "Light Dinner Reception (Brain-Boosting Snacks)", "Atrium"],
                  ["6:00", "6:30", "Walking and Talking Tour of MIT (Optional)", "MIT Campus"],
                ]}
              />

              <AgendaDay
                title="Day 3 — Friday, July 17, 2026"
                rows={[
                  ["7:15", "8:00", "Sunrise Yoga / Pilates", "MIT Athletic Field"],
                  ["9:00", "11:00", "Open Debate: Is BBQS the Future of Brain-Behavior Neuroscience? — 10 min framing of the perspective paper and big question (\"What should BBQS ultimately be for?\"); 75 min moderated open debate, actively inviting opposing views; 40 min audience town hall / open mic, collecting phrases live for the paper.", "Singleton"],
                  ["11:00", "12:00", "Young Investigator-led unconference, fireside chats (Zoom available)", "Seminar 3189"],
                  ["12:00", "1:00", "BBQS Working Lunch: Live NeuroHack Labs — wrap-up of deliverables and documentation", "Atrium"],
                  ["1:00", "2:30", "BBQS Project Outcomes & Consortium Handoff — final project reports and parallel session summaries; confirm project leads and next-step milestones; capture goals, findings, and open questions in shared BBQS slides; walk through the GitHub Organization workflow for consortium project submission (Zoom available).", "Singleton"],
                  ["2:30", "3:00", "Feedback, Reflection, Discussion and Closing (Zoom available)", "Singleton"],
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

type AgendaRow = [string, string, string, string];

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
              <th className="text-left font-semibold px-3 py-2 w-[180px]">Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([start, end, session, location], i) => (
              <tr key={i} className="border-t border-border align-top">
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{start}</td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{end}</td>
                <td className="px-3 py-2 text-foreground leading-relaxed">{session}</td>
                <td className="px-3 py-2 text-muted-foreground">{location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
