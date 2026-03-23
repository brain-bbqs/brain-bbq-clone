import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hotel, MapPin, Train, Plane, Info, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const VENUE = {
  name: "McGovern Institute for Brain Research, MIT",
  address: "77 Massachusetts Ave, Cambridge, MA 02139",
  lat: 42.3616,
  lng: -71.0903,
};

const WORKSHOP_DATES = ["7/15", "7/16", "7/17"];

const hotels = [
  {
    name: "Courtyard Boston Cambridge",
    address: "777 Memorial Drive, Cambridge MA 02139",
    lat: 42.3546,
    lng: -71.1044,
    dates: ["1/1/26–12/31/26"],
    rates: ["16% off Best Available Rate"],
    instructions: "Room Type 1 and 2 only. Code: MT2",
    blackout: ["4/17-4/19", "5/26-5/28", "6/28-6/29", "7/8-7/9", "10/16-10/17"],
    bookingUrl: "https://www.marriott.com/hotels/travel/boscb-courtyard-boston-cambridge/",
    workshopAvailable: true,
  },
  {
    name: "Fairfield Inn Cambridge",
    address: "215 Monsignor O'Brien Hwy, Cambridge, MA 02141",
    lat: 42.3699,
    lng: -71.0769,
    dates: ["1/1–3/7", "3/8–4/17", "4/18–9/6", "9/7–11/14", "11/15–12/31"],
    rates: ["$159/$179", "$199/$221", "$285/$307", "$285/$307", "$159/$179"],
    instructions: "Room Type 1 and 2 only. Code: MT2",
    blackout: ["4/18-4/19", "6/12-6/16", "6/18-6/23", "6/25-6/29", "7/8-7/9", "9/15-9/16", "9/27-9/28", "10/16-10/17"],
    bookingUrl: "https://www.marriott.com/hotels/travel/bosfm-fairfield-inn-and-suites-boston-cambridge/",
    workshopAvailable: true,
  },
  {
    name: "Holiday Inn Cambridge",
    address: "250 Monsignor O'Brien Hwy, Cambridge, MA 02141",
    lat: 42.3706,
    lng: -71.0761,
    dates: ["1/1–3/1", "3/2–9/7", "9/8–11/14", "11/15–12/31"],
    rates: ["$150", "$235", "$245", "$150"],
    instructions: "Standard Room only. Code: 100216750 or ask for MIT rate.",
    blackout: ["3/15-3/17", "3/26-3/28", "4/18-4/20", "5/16-5/18", "5/27-5/29", "6/12-6/13", "6/15-6/16", "6/18-6/19", "6/22-6/23", "6/26-6/29", "7/8-7/9", "9/15-9/16", "9/28-9/30", "10/16-10/17"],
    bookingUrl: "https://www.ihg.com/holidayinn/hotels/us/en/cambridge/boscb/hoteldetail",
    workshopAvailable: true,
  },
  {
    name: "Hotel Marlowe",
    address: "25 Edwin H Land Blvd., Cambridge, MA 02141",
    lat: 42.3692,
    lng: -71.0764,
    dates: ["1/1/26–12/31/26"],
    rates: ["25% off Best Available Rate"],
    instructions: "Deluxe and Deluxe Rooms with View only. Code: 100216750",
    blackout: ["4/27-4/28", "5/5-5/6", "5/13", "5/18-5/20", "5/26-5/28", "6/9-6/11", "9/14-9/16", "9/28-9/29", "10/5-10/7", "10/27-10/28"],
    bookingUrl: "https://www.hilton.com/en/hotels/bosmhgi-hotel-marlowe/",
    workshopAvailable: true,
  },
  {
    name: "Hyatt Regency Cambridge",
    address: "575 Memorial Drive, Cambridge, MA 02139",
    lat: 42.3547,
    lng: -71.1063,
    dates: ["1/1/26–12/31/26"],
    rates: ["20% off Best Available Rate"],
    instructions: "Standard King/Double or Double Double City/Riverside View only. Code: 33395",
    blackout: ["4/18-4/20", "5/13-5/18", "5/26-5/30", "6/16-6/17", "6/29-6/30", "9/28-9/30", "10/16-10/18"],
    bookingUrl: "https://www.hyatt.com/hyatt-regency/en-US/bosrc-hyatt-regency-cambridge",
    workshopAvailable: true,
  },
  {
    name: "Le Méridien Cambridge",
    address: "20 Sidney St., Cambridge, MA 02139",
    lat: 42.3629,
    lng: -71.1035,
    dates: ["1/1/26–12/31/26"],
    rates: ["20% off Best Available Rate"],
    instructions: "Room Type 1 only. Code: MT2",
    blackout: ["4/19-4/21", "5/27-5/29", "6/12-6/14", "6/15-6/17", "6/18-6/20", "6/22-6/24", "6/25-6/27", "6/28-6/30", "7/8-7/10", "10/16-10/18"],
    bookingUrl: "https://www.marriott.com/hotels/travel/boscm-le-meridien-cambridge-mit/",
    workshopAvailable: true,
  },
  {
    name: "Marriott Cambridge",
    address: "50 Broadway, Cambridge, MA 02142",
    lat: 42.3626,
    lng: -71.0829,
    dates: ["1/1–3/1", "3/2–11/15", "11/16–12/31"],
    rates: ["$257/$277", "$429/$449", "$279/$299"],
    instructions: "Room Type 1 and 2 only. Code: MT2",
    blackout: ["5/28", "9/15-9/16"],
    bookingUrl: "https://www.marriott.com/hotels/travel/boscg-boston-marriott-cambridge/",
    workshopAvailable: true,
  },
  {
    name: "Residence Inn Cambridge",
    address: "120 Broadway, 6 Cambridge Center, Cambridge, MA 02142",
    lat: 42.3630,
    lng: -71.0839,
    dates: ["1/1–3/1", "3/2–11/21", "11/22–12/31"],
    rates: ["$239", "$399", "$265"],
    instructions: "Rates for 1–6 nights. Lower rates for longer stays — inquire with VPF. Code: MT2",
    blackout: ["5/27-5/28"],
    bookingUrl: "https://www.marriott.com/hotels/travel/bosri-residence-inn-boston-cambridge/",
    workshopAvailable: true,
  },
  {
    name: "Royal Sonesta Cambridge Boston",
    address: "40 Edwin H Land Blvd., Cambridge, MA 02142",
    lat: 42.3671,
    lng: -71.0778,
    dates: ["1/1/26–12/31/26"],
    rates: ["20% off BAR (cap $459 riverview)"],
    instructions: "All room types. Code: MIT",
    blackout: [],
    bookingUrl: "https://www.sonesta.com/royal-sonesta/ma/cambridge/royal-sonesta-boston",
    workshopAvailable: true,
  },
  {
    name: "Lark Hotels 907 Main",
    address: "907 Main Street, Cambridge, MA 02139",
    lat: 42.3639,
    lng: -71.1046,
    dates: ["1/1–2/28", "3/1–4/30", "5/1–10/31", "11/1–12/31"],
    rates: ["$110", "$189", "$309", "$229"],
    instructions: "Weekday rates only. Email olivia.keefe@larkhospitality.com for weekends. Code: MIT2026",
    blackout: ["Boston Marathon", "MIT Commencement week", "World Cup", "Head of the Charles"],
    bookingUrl: "https://www.larkhotels.com/hotel/907-main/",
    workshopAvailable: true,
  },
  {
    name: "The Kendall Hotel",
    address: "350 Main St., Cambridge, MA 02142",
    lat: 42.3622,
    lng: -71.0861,
    dates: ["1/1/26–12/31/26"],
    rates: ["25% off Best Available Rate"],
    instructions: "All room types. Code: MIT7. Note: Destination Fee not waived.",
    blackout: ["4/17-4/21", "5/22-5/29", "10/16-10/23"],
    bookingUrl: "https://kendallhotel.com/",
    workshopAvailable: true,
  },
  {
    name: "The Whitney",
    address: "170 Charles Street, Boston, MA 02114",
    lat: 42.3599,
    lng: -71.0704,
    dates: ["1/1–3/31", "4/1–9/2", "9/3–11/15", "11/16–12/31"],
    rates: ["$309", "$369", "$389", "$309"],
    instructions: "Classic King only. Code: MIT or call 617-367-1866.",
    blackout: [],
    bookingUrl: "https://www.whitneyhotelboston.com/",
    workshopAvailable: true,
  },
];

function getWorkshopRate(hotel: typeof hotels[0]) {
  // Workshop is July 15-17 — find which date range applies
  if (hotel.dates.length === 1) return hotel.rates[0];
  // For multi-period hotels, July falls in the summer range (usually index 2 or middle)
  // We'll show the rate that covers July
  const monthRanges = hotel.dates;
  for (let i = 0; i < monthRanges.length; i++) {
    const range = monthRanges[i];
    // Check if "7/" or "9/" boundaries include July
    const parts = range.split("–");
    if (parts.length === 2) {
      const startMonth = parseInt(parts[0].split("/")[0]);
      const endMonth = parseInt(parts[1].split("/")[0]);
      if (startMonth <= 7 && endMonth >= 7) return hotel.rates[i];
    }
  }
  return hotel.rates[0];
}

function HotelCard({ hotel, index }: { hotel: typeof hotels[0]; index: number }) {
  const workshopRate = getWorkshopRate(hotel);
  const hasNoBlackout = hotel.blackout.length === 0;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">{hotel.name}</h3>
                <a
                  href={hotel.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                >
                  Book <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{hotel.address}</p>
            </div>
            <Badge variant="secondary" className="shrink-0 font-mono text-xs">
              {workshopRate}
            </Badge>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Rate periods */}
            <div>
              <p className="font-medium text-muted-foreground mb-1">Rate Periods</p>
              <div className="space-y-0.5">
                {hotel.dates.map((d, i) => (
                  <div key={i} className="flex justify-between gap-1">
                    <span className="text-muted-foreground">{d}</span>
                    <Badge variant="outline" className="font-mono text-[10px] h-auto py-0 px-1.5">
                      {hotel.rates[i]}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking instructions */}
            <div>
              <p className="font-medium text-muted-foreground mb-1">How to Book</p>
              <p className="text-muted-foreground">{hotel.instructions}</p>
            </div>

            {/* Blackout dates */}
            <div>
              <p className="font-medium text-muted-foreground mb-1">Blackout Dates</p>
              {hasNoBlackout ? (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  <span>No blackout dates</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {hotel.blackout.map((b, i) => {
                    const isNearWorkshop = b.includes("7/") || b.toLowerCase().includes("world cup");
                    return (
                      <TooltipProvider key={i}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant={isNearWorkshop ? "destructive" : "outline"}
                              className={`text-[10px] h-auto py-0 px-1.5 ${isNearWorkshop ? "" : "text-muted-foreground"}`}
                            >
                              {isNearWorkshop && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                              {b}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isNearWorkshop
                              ? "⚠️ Near workshop dates (July 15-17)"
                              : "Does not conflict with workshop dates"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HotelMap() {
  // Build markers for the map
  const venueMarker = `markers=color:red%7Clabel:V%7C${VENUE.lat},${VENUE.lng}`;
  const hotelMarkers = hotels
    .map((h, i) => `markers=color:blue%7Clabel:${i + 1}%7C${h.lat},${h.lng}`)
    .join("&");

  // Use an OpenStreetMap embed as a free alternative
  const center = `${VENUE.lat},${VENUE.lng}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Hotel Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg overflow-hidden border">
          <iframe
            title="Hotels near MIT"
            width="100%"
            height="400"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.google.com/maps/d/embed?mid=1&z=14&ll=${center}`}
            referrerPolicy="no-referrer-when-downgrade"
          />
          {/* Fallback: OpenStreetMap with all hotel pins */}
          <iframe
            title="Hotels near MIT - Map"
            width="100%"
            height="450"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=-71.12,42.345,-71.065,42.375&layer=mapnik&marker=${VENUE.lat},${VENUE.lng}`}
          />
        </div>

        {/* Hotel legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
            <MapPin className="h-4 w-4 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-foreground">MIT McGovern Institute</p>
              <p className="text-muted-foreground">Workshop Venue</p>
            </div>
          </div>
          {hotels.map((hotel, i) => (
            <a
              key={hotel.name}
              href={`https://www.google.com/maps/dir/${VENUE.lat},${VENUE.lng}/${hotel.lat},${hotel.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors border"
            >
              <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                {i + 1}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{hotel.name}</p>
                <p className="text-muted-foreground">Get directions →</p>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

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
        description="MIT negotiated hotel rates and travel information for the BBQS MIT Workshop, July 15-17, 2026."
      />
      <div className="container max-w-6xl mx-auto py-10 px-4 space-y-8">
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
            <p className="font-medium">{VENUE.name}</p>
            <p className="text-muted-foreground">{VENUE.address}</p>
            <p className="text-muted-foreground">Exact room TBD — details will be emailed to registrants.</p>
            <a
              href={`https://www.google.com/maps/place/${VENUE.lat},${VENUE.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-1"
            >
              View on Google Maps <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        {/* Map */}
        <HotelMap />

        {/* Hotels */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
              <Hotel className="h-5 w-5 text-primary" />
              2026 MIT Preferred Hotel Rates
            </h2>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p>These are MIT-negotiated "transient rates" for short stays (≤9 rooms). All rates are subject to availability and <strong>do not include tax</strong>.</p>
                <p>Destination Fee is waived for all Preferred Hotels <strong>except</strong> The Kendall Hotel.</p>
                <p className="flex items-center gap-1">
                  <Badge variant="destructive" className="text-[10px] h-auto py-0 px-1.5">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> July
                  </Badge>
                  = blackout near workshop dates (July 15–17)
                </p>
                <p className="text-muted-foreground/70">Updated: January 5, 2026</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {hotels.map((hotel, i) => (
              <HotelCard key={hotel.name} hotel={hotel} index={i} />
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
                <p>Taxi/rideshare to Cambridge takes ~15–30 minutes depending on traffic.</p>
                <p>The MBTA Blue Line → Red Line connects the airport to Kendall/MIT station.</p>
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
      </div>
    </>
  );
}
