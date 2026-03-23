import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hotel, MapPin, Train, Plane, Info } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const hotels = [
  {
    name: "Courtyard Boston Cambridge",
    address: "777 Memorial Drive, Cambridge MA 02139",
    dates: "1/1/26–12/31/26",
    rate: "16% off Best Available Rate",
    instructions: "Room Type 1 and 2 only. Code: MT2",
    blackout: "4/17-4/19; 5/26-5/28; 6/28-6/29; 7/8-7/9; 10/16-10/17",
  },
  {
    name: "Fairfield Inn Cambridge",
    address: "215 Monsignor O'Brien Hwy, Cambridge, MA 02141",
    dates: "1/1–3/7 · 3/8–4/17 · 4/18–9/6 · 9/7–11/14 · 11/15–12/31",
    rate: "$159/$179 · $199/$221 · $285/$307 · $285/$307 · $159/$179",
    instructions: "Room Type 1 and 2 only. Code: MT2",
    blackout: "4/18-4/19; 6/12-6/16; 6/18-6/23; 6/25-6/29; 7/8-7/9; 9/15-9/16; 9/27-9/28; 10/16-10/17",
  },
  {
    name: "Holiday Inn Cambridge",
    address: "250 Monsignor O'Brien Hwy, Cambridge, MA 02141",
    dates: "1/1–3/1 · 3/2–9/7 · 9/8–11/14 · 11/15–12/31",
    rate: "$150 · $235 · $245 · $150",
    instructions: "Standard Room only. Code: 100216750 or ask for MIT rate.",
    blackout: "3/15-3/17; 3/26-3/28; 4/18-4/20; 5/16-5/18; 5/27-5/29; 6/12-6/13; 6/15-6/16; 6/18-6/19; 6/22-6/23; 6/26-6/29; 7/8-7/9; 9/15-9/16; 9/28-9/30; 10/16-10/17",
  },
  {
    name: "Hotel Marlowe",
    address: "25 Edwin H Land Blvd., Cambridge, MA 02141",
    dates: "1/1/26–12/31/26",
    rate: "25% off Best Available Rate",
    instructions: "Deluxe and Deluxe Rooms with View only. Code: 100216750",
    blackout: "4/27-4/28; 5/5-5/6; 5/13; 5/18-5/20; 5/26-5/28; 6/9-6/11; 9/14-9/16; 9/28-9/29; 10/5-10/7; 10/27-10/28",
  },
  {
    name: "Hyatt Regency Cambridge",
    address: "575 Memorial Drive, Cambridge, MA 02139",
    dates: "1/1/26–12/31/26",
    rate: "20% off Best Available Rate",
    instructions: "Standard King/Double or Double Double City/Riverside View only. Code: 33395",
    blackout: "4/18-4/20; 5/13-5/18; 5/26-5/30; 6/16-6/17; 6/29-6/30; 9/28-9/30; 10/16-10/18",
  },
  {
    name: "Le Méridien Cambridge",
    address: "20 Sidney St., Cambridge, MA 02139",
    dates: "1/1/26–12/31/26",
    rate: "20% off Best Available Rate",
    instructions: "Room Type 1 only. Code: MT2",
    blackout: "4/19-4/21; 5/27-5/29; 6/12-6/14; 6/15-6/17; 6/18-6/20; 6/22-6/24; 6/25-6/27; 6/28-6/30; 7/8-7/10; 10/16-10/18",
  },
  {
    name: "Marriott Cambridge",
    address: "50 Broadway, Cambridge, MA 02142",
    dates: "1/1–3/1 · 3/2–11/15 · 11/16–12/31",
    rate: "$257/$277 · $429/$449 · $279/$299",
    instructions: "Room Type 1 and 2 only. Code: MT2",
    blackout: "5/28; 9/15-9/16",
  },
  {
    name: "Residence Inn Cambridge",
    address: "120 Broadway, 6 Cambridge Center, Cambridge, MA 02142",
    dates: "1/1–3/1 · 3/2–11/21 · 11/22–12/31",
    rate: "$239 · $399 · $265",
    instructions: "Rates for 1–6 nights. Lower rates for longer stays — inquire with VPF. Code: MT2",
    blackout: "5/27-5/28",
  },
  {
    name: "Royal Sonesta Cambridge Boston",
    address: "40 Edwin H Land Blvd., Cambridge, MA 02142",
    dates: "1/1/26–12/31/26",
    rate: "20% off Best Available Rate (cap $459 for riverview)",
    instructions: "All room types. Code: MIT",
    blackout: "None",
  },
  {
    name: "Lark Hotels 907 Main",
    address: "907 Main Street, Cambridge, MA 02139",
    dates: "1/1–2/28 · 3/1–4/30 · 5/1–10/31 · 11/1–12/31",
    rate: "$110 · $189 · $309 · $229",
    instructions: "Weekday rates only. Email olivia.keefe@larkhospitality.com for weekends. Code: MIT2026",
    blackout: "Boston Marathon; MIT Commencement week; World Cup; Head of the Charles",
  },
  {
    name: "The Kendall Hotel",
    address: "350 Main St., Cambridge, MA 02142",
    dates: "1/1/26–12/31/26",
    rate: "25% off Best Available Rate",
    instructions: "All room types. Code: MIT7. Note: Destination Fee not waived.",
    blackout: "4/17-4/21; 5/22-5/29; 10/16-10/23",
  },
  {
    name: "The Whitney",
    address: "170 Charles Street, Boston, MA 02114",
    dates: "1/1–3/31 · 4/1–9/2 · 9/3–11/15 · 11/16–12/31",
    rate: "$309 · $369 · $389 · $309",
    instructions: "Classic King only. Code: MIT or call 617-367-1866.",
    blackout: "None",
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
            <p className="font-medium">McGovern Institute for Brain Research, MIT</p>
            <p className="text-muted-foreground">77 Massachusetts Ave, Cambridge, MA 02139</p>
            <p className="text-muted-foreground">Exact room TBD — details will be emailed to registrants.</p>
          </CardContent>
        </Card>

        {/* Hotels Table */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
            <Hotel className="h-5 w-5 text-primary" />
            2026 MIT Preferred Hotel Rates
          </h2>

          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <div className="space-y-1">
                  <p>These are MIT-negotiated "transient rates" for short stays (≤9 rooms). All rates are subject to availability and <strong>do not include tax</strong>.</p>
                  <p>Destination Fee is waived for all Preferred Hotels <strong>except</strong> The Kendall Hotel.</p>
                  <p className="text-muted-foreground/70">Updated: January 5, 2026</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">Hotel</TableHead>
                      <TableHead className="min-w-[180px]">Dates</TableHead>
                      <TableHead className="min-w-[200px]">Rate / Discount</TableHead>
                      <TableHead className="min-w-[200px]">Instructions</TableHead>
                      <TableHead className="min-w-[180px]">Blackout Dates</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotels.map((hotel) => (
                      <TableRow key={hotel.name}>
                        <TableCell className="font-medium">
                          <div>{hotel.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{hotel.address}</div>
                        </TableCell>
                        <TableCell className="text-xs whitespace-pre-line">
                          {hotel.dates.split(" · ").map((d, i) => (
                            <div key={i}>{d}</div>
                          ))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {hotel.rate.split(" · ").map((r, i) => (
                            <div key={i}>
                              <Badge variant="outline" className="font-mono text-xs mb-1">
                                {r}
                              </Badge>
                            </div>
                          ))}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {hotel.instructions}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {hotel.blackout}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
