import { Map, Overlay } from "pigeon-maps";
import { MapPin } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Venue = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type Hotel = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type HotelLocationMapProps = {
  venue: Venue;
  hotels: Hotel[];
};

type MapMarkerProps = {
  anchor: [number, number];
  href: string;
  label: string;
  markerText: string;
  primary?: boolean;
};

const getLocationLink = (lat: number, lng: number, zoom = 15) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;

const getShortHotelLabel = (name: string) =>
  name
    .replace("Courtyard Boston Cambridge", "Courtyard")
    .replace("Fairfield Inn Cambridge", "Fairfield Inn")
    .replace("Holiday Inn Cambridge", "Holiday Inn")
    .replace("Hyatt Regency Cambridge", "Hyatt Regency")
    .replace("Le Méridien Cambridge", "Le Méridien")
    .replace("Marriott Cambridge", "Marriott")
    .replace("Residence Inn Cambridge", "Residence Inn")
    .replace("Royal Sonesta Cambridge", "Royal Sonesta")
    .replace("Lark Hotels ", "")
    .replace(" Boston", "")
    .replace(" Cambridge", "");

function MapMarker({ anchor, href, label, markerText, primary = false }: MapMarkerProps) {
  return (
    <Overlay anchor={anchor} offset={[-18, -18]}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className="group flex items-center gap-2"
      >
        <span
          className={primary
            ? "inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-primary bg-primary px-2 text-xs font-bold text-primary-foreground shadow-sm"
            : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary bg-background text-xs font-bold text-primary shadow-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
          }
        >
          {markerText}
        </span>
        <span className="hidden rounded-full border border-border bg-background/95 px-2 py-1 text-[10px] font-medium leading-none text-foreground shadow-sm backdrop-blur md:inline-block">
          {label}
        </span>
      </a>
    </Overlay>
  );
}

export default function HotelLocationMap({ venue, hotels }: HotelLocationMapProps) {
  const center: [number, number] = [venue.lat, venue.lng];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Hotels &amp; Venue Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-hidden rounded-lg border">
          <Map
            height={420}
            defaultCenter={center}
            defaultZoom={13.5}
            minZoom={12}
            maxZoom={16}
            metaWheelZoom={false}
            twoFingerDrag={false}
          >
            <MapMarker
              anchor={center}
              href={getLocationLink(venue.lat, venue.lng)}
              label="MIT McGovern venue"
              markerText="MIT"
              primary
            />
            {hotels.map((hotel, index) => (
              <MapMarker
                key={hotel.name}
                anchor={[hotel.lat, hotel.lng]}
                href={getLocationLink(hotel.lat, hotel.lng)}
                label={hotel.name}
                markerText={`${index + 1}`}
              />
            ))}
          </Map>
        </div>
        <p className="text-xs text-muted-foreground">
          Click any numbered marker or list item to open that location in OpenStreetMap.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <a
            href={getLocationLink(venue.lat, venue.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 transition-colors hover:bg-muted/60"
          >
            <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              MIT
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">MIT McGovern</p>
              <p className="truncate text-xs text-muted-foreground">{venue.address}</p>
            </div>
          </a>
          {hotels.map((hotel, index) => (
            <a
              key={hotel.name}
              href={getLocationLink(hotel.lat, hotel.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 transition-colors hover:bg-muted/60"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary bg-background text-xs font-bold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{getShortHotelLabel(hotel.name)}</p>
                <p className="truncate text-xs text-muted-foreground">{hotel.address}</p>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
