import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hotel, MapPin, Train, Plane, ExternalLink, DollarSign } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";

const hotels = [
  {
    name: "Boston Marriott Cambridge",
    address: "50 Broadway, Cambridge, MA 02142",
    distance: "0.3 miles from MIT",
    rate: "$229/night",
    code: "BBQS2026",
    bookingUrl: "",
    notes: "Group block available until June 15, 2026",
  },
  {
    name: "Le Méridien Boston Cambridge",
    address: "20 Sidney St, Cambridge, MA 02139",
    distance: "0.5 miles from MIT",
    rate: "$209/night",
    code: "BBQS26",
    bookingUrl: "",
    notes: "Complimentary breakfast included",
  },
  {
    name: "Hyatt Regency Cambridge",
    address: "575 Memorial Dr, Cambridge, MA 02139",
    distance: "0.8 miles from MIT",
    rate: "$199/night",
    code: "BBQS-MIT",
    bookingUrl: "",
    notes: "Charles River views, shuttle to MIT available",
  },
  {
    name: "Graduate Cambridge",
    address: "83 Massachusetts Ave, Cambridge, MA 02139",
    distance: "0.2 miles from MIT",
    rate: "$179/night",
    code: "",
    bookingUrl: "",
    notes: "Budget-friendly option, walk to venue",
  },
];

export default function MITWorkshopTravel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <>
      <PageMeta
        title="MIT Workshop 2026 – Travel & Hotels | BBQS"
        description="Discounted hotel rates and travel information for the BBQS MIT Workshop, July 15-17, 2026."
      />
      <div className="container max-w-4xl mx-auto py-10 px-4 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Travel &amp; Accommodations
          </h1>
          <p className="text-muted-foreground text-lg">
            2<sup>nd</sup> Annual BBQS Workshop · MIT · July 15–17, 2026
          </p>
        </div>

        {/* Venue */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Venue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">Massachusetts Institute of Technology</p>
            <p className="text-muted-foreground">77 Massachusetts Ave, Cambridge, MA 02139</p>
            <p className="text-muted-foreground">Exact room TBD — details will be emailed to registrants.</p>
          </CardContent>
        </Card>

        {/* Hotels */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
            <Hotel className="h-5 w-5 text-primary" />
            Discounted Hotel Rates
          </h2>
          <p className="text-sm text-muted-foreground">
            The following hotels have negotiated group rates for workshop attendees.
            Please mention the booking code when reserving.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {hotels.map((hotel) => (
              <Card key={hotel.name} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{hotel.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm">
                  <p className="text-muted-foreground">{hotel.address}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="h-3 w-3" /> {hotel.distance}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <DollarSign className="h-3 w-3" /> {hotel.rate}
                    </Badge>
                  </div>
                  {hotel.code && (
                    <p className="text-xs">
                      Booking code: <span className="font-mono font-semibold text-primary">{hotel.code}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{hotel.notes}</p>
                  {hotel.bookingUrl && (
                    <a
                      href={hotel.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Book Now <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Getting There */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
            <Train className="h-5 w-5 text-primary" />
            Getting There
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plane className="h-4 w-4 text-primary" /> By Air
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Fly into <strong>Boston Logan International Airport (BOS)</strong>, ~5 miles from MIT.</p>
                <p>Taxi/rideshare to Cambridge takes ~15-30 minutes depending on traffic.</p>
                <p>The MBTA Blue Line + Red Line connects the airport to Kendall/MIT station.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Train className="h-4 w-4 text-primary" /> By Public Transit
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Take the <strong>MBTA Red Line</strong> to <strong>Kendall/MIT</strong> station.</p>
                <p>MIT campus is a 2-minute walk from the station.</p>
                <p>A CharlieCard costs $2.40/ride or $22.50 for a 7-day pass.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <p className="text-xs text-muted-foreground text-center pt-4">
          Hotel rates and details are placeholders — please update with confirmed negotiated rates.
        </p>
      </div>
    </>
  );
}
