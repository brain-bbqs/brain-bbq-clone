import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hotel, MapPin, Train, Plane, Info, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";

const VENUE = {
  name: "McGovern Institute for Brain Research, MIT",
  address: "77 Massachusetts Ave, Cambridge, MA 02139",
  lat: 42.3616,
  lng: -71.0903,
};

const hotels = [
  {
    name: "Courtyard Boston Cambridge",
    address: "777 Memorial Drive, Cambridge MA 02139",
    lat: 42.3546, lng: -71.1044,
    dates: ["1/1/26–12/31/26"],
    rates: ["16% off BAR"],
    instructions: "Room Type 1 & 2 only. Code: MT2",
    blackout: ["4/17-4/19", "5/26-5/28", "6/28-6/29", "7/8-7/9", "10/16-10/17"],
    bookingUrl: "https://www.marriott.com/hotels/travel/boscb-courtyard-boston-cambridge/",
  },
  {
    name: "Fairfield Inn Cambridge",
    address: "215 Monsignor O'Brien Hwy, Cambridge, MA 02141",
    lat: 42.3699, lng: -71.0769,
    dates: ["1/1–3/7", "3/8–4/17", "4/18–9/6", "9/7–11/14", "11/15–12/31"],
    rates: ["$159/$179", "$199/$221", "$285/$307", "$285/$307", "$159/$179"],
    instructions: "Room Type 1 & 2 only. Code: MT2",
    blackout: ["4/18-4/19", "6/12-6/16", "6/18-6/23", "6/25-6/29", "7/8-7/9", "9/15-9/16", "9/27-9/28", "10/16-10/17"],
    bookingUrl: "https://www.marriott.com/hotels/travel/bosfm-fairfield-inn-and-suites-boston-cambridge/",
  },
  {
    name: "Holiday Inn Cambridge",
    address: "250 Monsignor O'Brien Hwy, Cambridge, MA 02141",
    lat: 42.3706, lng: -71.0761,
    dates: ["1/1–3/1", "3/2–9/7", "9/8–11/14", "11/15–12/31"],
    rates: ["$150", "$235", "$245", "$150"],
    instructions: "Standard Room only. Code: 100216750 or ask for MIT rate.",
    blackout: ["3/15-3/17", "3/26-3/28", "4/18-4/20", "5/16-5/18", "5/27-5/29", "6/12-6/13", "6/15-6/16", "6/18-6/19", "6/22-6/23", "6/26-6/29", "7/8-7/9", "9/15-9/16", "9/28-9/30", "10/16-10/17"],
    bookingUrl: "https://www.ihg.com/holidayinn/hotels/us/en/cambridge/boscb/hoteldetail",
  },
  {
    name: "Hotel Marlowe",
    address: "25 Edwin H Land Blvd., Cambridge, MA 02141",
    lat: 42.3692, lng: -71.0764,
    dates: ["1/1/26–12/31/26"],
    rates: ["25% off BAR"],
    instructions: "Deluxe rooms only. Code: 100216750",
    blackout: ["4/27-4/28", "5/5-5/6", "5/13", "5/18-5/20", "5/26-5/28", "6/9-6/11", "9/14-9/16", "9/28-9/29", "10/5-10/7", "10/27-10/28"],
    bookingUrl: "https://www.hilton.com/en/hotels/bosmhgi-hotel-marlowe/",
  },
  {
    name: "Hyatt Regency Cambridge",
    address: "575 Memorial Drive, Cambridge, MA 02139",
    lat: 42.3547, lng: -71.1063,
    dates: ["1/1/26–12/31/26"],
    rates: ["20% off BAR"],
    instructions: "Standard King/Double only. Code: 33395",
    blackout: ["4/18-4/20", "5/13-5/18", "5/26-5/30", "6/16-6/17", "6/29-6/30", "9/28-9/30", "10/16-10/18"],
    bookingUrl: "https://www.hyatt.com/hyatt-regency/en-US/bosrc-hyatt-regency-cambridge",
  },
  {
    name: "Le Méridien Cambridge",
    address: "20 Sidney St., Cambridge, MA 02139",
    lat: 42.3629, lng: -71.1035,
    dates: ["1/1/26–12/31/26"],
    rates: ["20% off BAR"],
    instructions: "Room Type 1 only. Code: MT2",
    blackout: ["4/19-4/21", "5/27-5/29", "6/12-6/14", "6/15-6/17", "6/18-6/20", "6/22-6/24", "6/25-6/27", "6/28-6/30", "7/8-7/10", "10/16-10/18"],
    bookingUrl: "https://www.marriott.com/hotels/travel/boscm-le-meridien-cambridge-mit/",
  },
  {
    name: "Marriott Cambridge",
    address: "50 Broadway, Cambridge, MA 02142",
    lat: 42.3626, lng: -71.0829,
    dates: ["1/1–3/1", "3/2–11/15", "11/16–12/31"],
    rates: ["$257/$277", "$429/$449", "$279/$299"],
    instructions: "Room Type 1 & 2 only. Code: MT2",
    blackout: ["5/28", "9/15-9/16"],
    bookingUrl: "https://www.marriott.com/hotels/travel/boscg-boston-marriott-cambridge/",
  },
  {
    name: "Residence Inn Cambridge",
    address: "120 Broadway, Cambridge, MA 02142",
    lat: 42.3630, lng: -71.0839,
    dates: ["1/1–3/1", "3/2–11/21", "11/22–12/31"],
    rates: ["$239", "$399", "$265"],
    instructions: "1–6 night rates. Lower for longer stays. Code: MT2",
    blackout: ["5/27-5/28"],
    bookingUrl: "https://www.marriott.com/hotels/travel/bosri-residence-inn-boston-cambridge/",
  },
  {
    name: "Royal Sonesta Cambridge",
    address: "40 Edwin H Land Blvd., Cambridge, MA 02142",
    lat: 42.3671, lng: -71.0778,
    dates: ["1/1/26–12/31/26"],
    rates: ["20% off BAR (cap $459)"],
    instructions: "All room types. Code: MIT",
    blackout: [],
    bookingUrl: "https://www.sonesta.com/royal-sonesta/ma/cambridge/royal-sonesta-boston",
  },
  {
    name: "Lark Hotels 907 Main",
    address: "907 Main Street, Cambridge, MA 02139",
    lat: 42.3639, lng: -71.1046,
    dates: ["1/1–2/28", "3/1–4/30", "5/1–10/31", "11/1–12/31"],
    rates: ["$110", "$189", "$309", "$229"],
    instructions: "Weekday only. Email olivia.keefe@larkhospitality.com for weekends. Code: MIT2026",
    blackout: ["Boston Marathon", "MIT Commencement", "World Cup", "Head of the Charles"],
    bookingUrl: "https://www.larkhotels.com/hotel/907-main/",
  },
  {
    name: "The Kendall Hotel",
    address: "350 Main St., Cambridge, MA 02142",
    lat: 42.3622, lng: -71.0861,
    dates: ["1/1/26–12/31/26"],
    rates: ["25% off BAR"],
    instructions: "All room types. Code: MIT7. Note: Destination Fee NOT waived.",
    blackout: ["4/17-4/21", "5/22-5/29", "10/16-10/23"],
    bookingUrl: "https://kendallhotel.com/",
  },
  {
    name: "The Whitney",
    address: "170 Charles Street, Boston, MA 02114",
    lat: 42.3599, lng: -71.0704,
    dates: ["1/1–3/31", "4/1–9/2", "9/3–11/15", "11/16–12/31"],
    rates: ["$309", "$369", "$389", "$309"],
    instructions: "Classic King only. Code: MIT or call 617-367-1866.",
    blackout: [],
    bookingUrl: "https://www.whitneyhotelboston.com/",
  },
];

function getWorkshopRate(hotel: typeof hotels[0]) {
  if (hotel.dates.length === 1) return hotel.rates[0];
  for (let i = 0; i < hotel.dates.length; i++) {
    const parts = hotel.dates[i].split("–");
    if (parts.length === 2) {
      const startMonth = parseInt(parts[0].split("/")[0]);
      const endMonth = parseInt(parts[1].split("/")[0]);
      if (startMonth <= 7 && endMonth >= 7) return hotel.rates[i];
    }
  }
  return hotel.rates[0];
}

function HotelMap() {
  // Build a Google Maps embed URL with all hotel markers
  const markers = hotels
    .map((h) => `markers=color:blue%7Clabel:H%7C${h.lat},${h.lng}`)
    .join("&");
  const venueMarker = `markers=color:red%7Clabel:V%7C${VENUE.lat},${VENUE.lng}`;
  const src = `https://www.google.com/maps/embed/v1/view?key=&center=${VENUE.lat},${VENUE.lng}&zoom=14`;

  // Use a static map image approach that needs no API key
  const staticSrc = `https://maps.google.com/maps?q=${VENUE.lat},${VENUE.lng}&z=14&output=embed`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Hotels &amp; Venue Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg overflow-hidden border h-[400px]">
          <iframe
            title="MIT Workshop Hotels Map"
            src={staticSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          🔴 Venue: {VENUE.name} · Click hotel cards below for individual directions
        </p>
      </CardContent>
    </Card>
  );
}

function HotelCard({ hotel }: { hotel: typeof hotels[0] }) {
  const workshopRate = getWorkshopRate(hotel);
  const hasJulyBlackout = hotel.blackout.some(b => b.includes("7/") || b.toLowerCase().includes("world cup"));
  const hasNoBlackout = hotel.blackout.length === 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{hotel.name}</h3>
                {hasNoBlackout && (
                  <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600 dark:text-green-400 gap-0.5">
                    <CheckCircle className="h-2.5 w-2.5" /> No blackouts
                  </Badge>
                )}
                {hasJulyBlackout && (
                  <Badge variant="destructive" className="text-[10px] gap-0.5">
                    <AlertTriangle className="h-2.5 w-2.5" /> July blackout
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{hotel.address}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge className="font-mono text-xs bg-primary text-primary-foreground">
                {workshopRate}
              </Badge>
              <div className="flex gap-1.5">
                <a
                  href={hotel.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  Book <ExternalLink className="h-2.5 w-2.5" />
                </a>
                <a
                  href={`https://www.google.com/maps/dir/${VENUE.lat},${VENUE.lng}/${hotel.lat},${hotel.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                >
                  Directions <MapPin className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-t pt-3">
            <div>
              <p className="font-medium text-foreground mb-1">Rate Periods</p>
              <div className="space-y-0.5">
                {hotel.dates.map((d, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{d}</span>
                    <span className="font-mono text-foreground">{hotel.rates[i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">How to Book</p>
              <p className="text-muted-foreground">{hotel.instructions}</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Blackout Dates</p>
              {hasNoBlackout ? (
                <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> None — available year-round
                </p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {hotel.blackout.map((b, i) => {
                    const isJuly = b.includes("7/") || b.toLowerCase().includes("world cup");
                    return (
                      <Badge
                        key={i}
                        variant={isJuly ? "destructive" : "outline"}
                        className="text-[10px] h-auto py-0 px-1.5"
                      >
                        {b}
                      </Badge>
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
        {/* Header */}
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
          <CardContent className="p-5 flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-foreground">{VENUE.name}</p>
              <p className="text-muted-foreground">{VENUE.address}</p>
              <p className="text-muted-foreground text-xs">Exact room TBD — details will be emailed to registrants.</p>
              <a
                href={`https://www.google.com/maps/place/${VENUE.lat},${VENUE.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
              >
                View on Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            </div>
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
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3 border">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p>MIT-negotiated "transient rates" for short stays (≤9 rooms). Rates subject to availability, <strong>tax not included</strong>.</p>
                <p>Destination Fee waived for all hotels <strong>except</strong> The Kendall Hotel.</p>
                <p className="text-muted-foreground/70">Updated: January 5, 2026</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.name} hotel={hotel} />
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
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Plane className="h-4 w-4 text-primary" /> By Air
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Fly into <strong>Boston Logan (BOS)</strong>, ~5 miles from MIT.</p>
                  <p>Taxi/rideshare: 15–30 min depending on traffic.</p>
                  <p>MBTA Blue Line → Red Line connects airport to Kendall/MIT.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Train className="h-4 w-4 text-primary" /> By Public Transit
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>MBTA Red Line</strong> to <strong>Kendall/MIT</strong> station.</p>
                  <p>MIT campus is a 2-minute walk from the station.</p>
                  <p>CharlieCard: $2.40/ride or $22.50 for a 7-day pass.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
