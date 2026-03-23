import { useMemo, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Map, Overlay } from "pigeon-maps";

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

type MapPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  markerText: string;
  primary?: boolean;
};

type MapMarkerProps = {
  anchor: [number, number];
  label: string;
  markerText: string;
  onSelect: () => void;
  selected?: boolean;
  primary?: boolean;
};

const getLocationLink = (lat: number, lng: number, zoom = 15) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;

const getInitialZoom = (places: Array<{ lat: number; lng: number }>) => {
  const latitudes = places.map((place) => place.lat);
  const longitudes = places.map((place) => place.lng);
  const latSpan = Math.max(...latitudes) - Math.min(...latitudes);
  const lngSpan = Math.max(...longitudes) - Math.min(...longitudes);
  const span = Math.max(latSpan, lngSpan);

  if (span < 0.015) return 15;
  if (span < 0.03) return 14;
  if (span < 0.06) return 13;
  return 12;
};

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

function MapMarker({ anchor, label, markerText, onSelect, selected = false, primary = false }: MapMarkerProps) {
  return (
    <Overlay anchor={anchor} offset={[-20, -20]}>
      <button
        type="button"
        onClick={onSelect}
        aria-label={label}
        title={label}
        aria-pressed={selected}
        className="group relative"
      >
        <span
          className={primary
            ? "inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary text-xs font-bold text-primary-foreground shadow-sm transition-transform group-hover:scale-105"
            : selected
              ? "inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary text-xs font-bold text-primary-foreground shadow-sm transition-transform group-hover:scale-105"
              : "inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-bold text-primary shadow-sm transition-all group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground"
          }
        >
          {markerText}
        </span>
      </button>
    </Overlay>
  );
}

export default function HotelLocationMap({ venue, hotels }: HotelLocationMapProps) {
  const places = useMemo<MapPlace[]>(
    () => [
      {
        id: "venue",
        name: venue.name,
        address: venue.address,
        lat: venue.lat,
        lng: venue.lng,
        markerText: "MIT",
        primary: true,
      },
      ...hotels.map((hotel, index) => ({
        id: hotel.name,
        name: hotel.name,
        address: hotel.address,
        lat: hotel.lat,
        lng: hotel.lng,
        markerText: `${index + 1}`,
      })),
    ],
    [venue, hotels],
  );

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>("venue");

  const selectedPlace = places.find((place) => place.id === selectedPlaceId) ?? places[0];
  const center = useMemo<[number, number]>(() => {
    const latitudes = places.map((place) => place.lat);
    const longitudes = places.map((place) => place.lng);

    return [
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    ];
  }, [places]);
  const defaultZoom = useMemo(() => getInitialZoom(places), [places]);

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
            defaultZoom={defaultZoom}
            minZoom={11}
            maxZoom={16}
            metaWheelZoom={false}
            twoFingerDrag={false}
          >
            {places.map((place) => (
              <MapMarker
                key={place.id}
                anchor={[place.lat, place.lng]}
                label={place.name}
                markerText={place.markerText}
                onSelect={() => setSelectedPlaceId(place.id)}
                selected={selectedPlaceId === place.id}
                primary={place.primary}
              />
            ))}
            <Overlay anchor={[selectedPlace.lat, selectedPlace.lng]} offset={[0, -46]}>
              <div className="pointer-events-none -translate-x-1/2 -translate-y-full rounded-full border border-border bg-background/95 px-3 py-1 text-xs font-semibold leading-none text-foreground shadow-sm backdrop-blur">
                {selectedPlace.name}
              </div>
            </Overlay>
          </Map>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{selectedPlace.name}</p>
              <p className="text-xs text-muted-foreground">{selectedPlace.address}</p>
            </div>
            <a
              href={getLocationLink(selectedPlace.lat, selectedPlace.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 self-start rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Open in OpenStreetMap
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Click a number in the map or list to highlight that hotel, then use the OpenStreetMap link if you want directions.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => setSelectedPlaceId("venue")}
            className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-left transition-colors hover:bg-muted/60"
          >
            <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              MIT
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">MIT McGovern</p>
              <p className="truncate text-xs text-muted-foreground">{venue.address}</p>
            </div>
          </button>
          {hotels.map((hotel, index) => (
            <button
              type="button"
              key={hotel.name}
              onClick={() => setSelectedPlaceId(hotel.name)}
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-left transition-colors hover:bg-muted/60"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary bg-background text-xs font-bold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{getShortHotelLabel(hotel.name)}</p>
                <p className="truncate text-xs text-muted-foreground">{hotel.address}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
