import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar as CalendarIcon, DollarSign, Clock, Users } from "lucide-react";
import PageMeta from "@/components/PageMeta";

const MITWorkshop2026 = () => {
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
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="text-xs uppercase tracking-wider">
                Conference
              </Badge>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                Upcoming
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight max-w-3xl">
              2nd Annual Brain Behavior Quantification and Synchronization Workshop at MIT
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">July 15–17, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>McGovern Institute for Brain Research, MIT</span>
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
            <CardContent>
              <p className="text-muted-foreground italic">Detailed agenda forthcoming.</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Registration:</span>{" "}
                There is no cost to attend. Additional registration details will be shared here as they become available.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default MITWorkshop2026;
