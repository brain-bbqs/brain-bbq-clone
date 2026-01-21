import { useState } from "react";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";

const Resources = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Placeholder resources - to be populated with actual data
  const resources = [
    {
      title: "Neurodata Without Borders (NWB)",
      description: "A data standard for neurophysiology data storage and sharing.",
      category: "Standards",
      species: ["All"],
      workingGroup: "WG-Standards",
      url: "https://www.nwb.org/",
    },
    {
      title: "DANDI Archive",
      description: "Distributed Archives for Neurophysiology Data Integration - a public archive for neurophysiology data.",
      category: "Data Platform",
      species: ["All"],
      workingGroup: "WG-Standards",
      url: "https://dandiarchive.org/",
    },
    {
      title: "BossDB",
      description: "Block Object Storage Service Database for large-scale neuroscience data.",
      category: "Data Platform",
      species: ["All"],
      workingGroup: "WG-Analytics",
      url: "https://bossdb.org/",
    },
    {
      title: "SLEAP",
      description: "Social LEAP Estimates Animal Poses - a deep learning framework for multi-animal pose tracking.",
      category: "Software",
      species: ["Mouse", "Rat", "Fly", "Other"],
      workingGroup: "WG-Analytics",
      url: "https://sleap.ai/",
    },
    {
      title: "DeepLabCut",
      description: "Markerless pose estimation of user-defined body parts with deep learning.",
      category: "Software",
      species: ["All"],
      workingGroup: "WG-Analytics",
      url: "http://www.mackenziemathislab.org/deeplabcut",
    },
  ];

  const filteredResources = resources.filter((resource) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      resource.title.toLowerCase().includes(searchLower) ||
      resource.description.toLowerCase().includes(searchLower) ||
      resource.category.toLowerCase().includes(searchLower) ||
      resource.species.some((s) => s.toLowerCase().includes(searchLower)) ||
      resource.workingGroup.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 py-8 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">Resources</h1>

        {/* Overview */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            This page provides a curated collection of resources relevant to BBQS projects and working groups. You'll find software tools and libraries for analysis, pre-trained ML models, multimodal datasets, evaluation benchmarks, academic publications, data platforms, and standards for consistent data sharing. Use the search below to filter resources by keywords, categories, target species, or working groups.
          </p>
        </section>

        {/* Search */}
        <section className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search resources by keyword, category, or animal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </section>

        {/* Resource List */}
        <section className="mb-12">
          {filteredResources.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No matching resources found. Try a different search term.
            </p>
          ) : (
            <div className="grid gap-4">
              {filteredResources.map((resource) => (
                <Card key={resource.title} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {resource.title}
                          </a>
                        </CardTitle>
                        <CardDescription className="mt-1">{resource.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">{resource.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="text-muted-foreground">Species:</span>
                      {resource.species.map((species) => (
                        <Badge key={species} variant="outline" className="text-xs">
                          {species}
                        </Badge>
                      ))}
                      <span className="text-muted-foreground ml-4">Working Group:</span>
                      <Badge variant="outline" className="text-xs">
                        {resource.workingGroup}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Contribution */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Contribution</h2>
          <p className="text-muted-foreground leading-relaxed">
            To add resources or update existing entries, please reach out to the BBQS team.
          </p>
        </section>

        {/* Future Plans */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Future Plans</h2>
          <p className="text-muted-foreground leading-relaxed">
            We are working on integrating a chatbot that will connect to a database of JSON-organized resources, making it even easier to find the information you need. We are also working on an ingestion tool that will make it easier to add and update entries! Stay tuned for updates.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Resources;
