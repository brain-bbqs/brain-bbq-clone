import { useState, useMemo, useEffect } from "react";
import { MARR_PROJECTS } from "@/data/marr-projects";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Latin name mapping for species
const LATIN_NAMES: Record<string, string> = {
  "Cichlid": "Cichlidae",
  "Mouse": "Mus musculus",
  "Gerbil": "Meriones unguiculatus",
  "Cowbird": "Molothrus ater",
  "Rats/Mice": "Rattus / Mus",
  "Human": "Homo sapiens",
  "Sheep": "Ovis aries",
  "Zebrafish/Fly": "Danio rerio / Drosophila",
  "Acoel Worm": "Acoela",
  "Ferret": "Mustela putorius furo",
  "Capuchin Monkey": "Cebus capucinus",
  "Marmoset": "Callithrix jacchus",
};

// Wikipedia search terms for better image results
const WIKI_SEARCH_TERMS: Record<string, string> = {
  "Cichlid": "Cichlid fish",
  "Mouse": "House mouse",
  "Gerbil": "Mongolian gerbil",
  "Cowbird": "Brown-headed cowbird",
  "Rats/Mice": "Laboratory rat",
  "Human": "Human brain",
  "Sheep": "Domestic sheep",
  "Zebrafish/Fly": "Zebrafish",
  "Acoel Worm": "Acoelomorpha",
  "Ferret": "Ferret",
  "Capuchin Monkey": "Capuchin monkey",
  "Marmoset": "Common marmoset",
};

interface SpeciesCard {
  species: string;
  latinName: string;
  project: string;
  grantId: string;
  behaviors: string[];
  color: string;
}

const getProjectTitle = (shortName: string) => {
  const parts = shortName.split(" – ");
  return parts.length > 1 ? parts.slice(1).join(" – ").trim() : shortName;
};

const cards: SpeciesCard[] = MARR_PROJECTS.map((p) => ({
  species: p.species,
  latinName: LATIN_NAMES[p.species] || "",
  project: getProjectTitle(p.shortName),
  grantId: p.id,
  behaviors: p.computational,
  color: p.color,
}));

// Hook to fetch Wikipedia thumbnail for a species
function useWikiImage(species: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const searchTerm = WIKI_SEARCH_TERMS[species] || species;
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.thumbnail?.source) {
          // Request a larger image by modifying the thumb URL
          const largerUrl = data.originalimage?.source || data.thumbnail.source.replace(/\/\d+px-/, "/600px-");
          setImageUrl(largerUrl);
        }
      })
      .catch(() => {});
  }, [species]);

  return imageUrl;
}

function SpeciesCardComponent({ card, index }: { card: SpeciesCard; index: number }) {
  const imageUrl = useWikiImage(card.species);
  const cleanId = card.grantId.replace(/^\d(?=[A-Z])/, "");
  const nihUrl = `https://reporter.nih.gov/project-details/${cleanId}`;

  // Vary card heights for masonry effect
  const hasManyBehaviors = card.behaviors.length > 3;
  const imageHeight = index % 3 === 0 ? "h-56" : index % 3 === 1 ? "h-44" : "h-48";

  return (
    <div className="break-inside-avoid mb-4 group">
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        {/* Image */}
        <div className={`${imageHeight} relative overflow-hidden bg-secondary/30`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={card.species}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-20">🧬</span>
            </div>
          )}
          {/* Species name overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0 border-2 border-white/40" style={{ backgroundColor: card.color }} />
              <h3 className="text-lg font-bold text-white drop-shadow-md">{card.species}</h3>
            </div>
            <p className="text-white/70 text-xs italic mt-0.5 ml-5">{card.latinName}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Project link */}
          <a
            href={nihUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1.5 transition-colors leading-tight"
          >
            {card.project}
            <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />
          </a>

          {/* Behavior badges */}
          {card.behaviors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {card.behaviors.map((b) => (
                <Badge
                  key={b}
                  variant="secondary"
                  className="text-[10px] font-normal px-2 py-0.5"
                >
                  {b}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Species() {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter.trim()) return cards;
    const q = filter.toLowerCase();
    return cards.filter(
      (c) =>
        c.species.toLowerCase().includes(q) ||
        c.latinName.toLowerCase().includes(q) ||
        c.project.toLowerCase().includes(q) ||
        c.behaviors.some((b) => b.toLowerCase().includes(q))
    );
  }, [filter]);

  const speciesCount = useMemo(() => new Set(filtered.map((c) => c.species)).size, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Species</h1>
          <p className="text-muted-foreground mb-5">
            Explore the species studied across BBQS consortium projects and the behaviors being investigated.
          </p>
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by species, project, behavior..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {speciesCount} species · {filtered.length} projects
            </span>
          </div>
        </div>

        {/* Masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {filtered.map((card, i) => (
            <SpeciesCardComponent key={card.grantId} card={card} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No species match your filter</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
