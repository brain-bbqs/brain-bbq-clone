import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X, Merge, Lock, Info } from "lucide-react";
import { toast } from "sonner";

type Decision = "pending" | "approved" | "rejected" | "aliased";

interface CandidateTerm {
  id: string;
  term: string;
  domain: "Devices" | "Species" | "Methods" | "Software" | "Data Modalities";
  field: string;
  occurrences: number;
  sources: string[];
  suggestedCanonical?: string;
  proposedOntology?: string;
  notes?: string;
}

const SEED: CandidateTerm[] = [
  { id: "d1", term: "Neuropixels 1.0", domain: "Devices", field: "device.model", occurrences: 47, sources: ["Grant U19-XYZ", "Manual: IMEC"], suggestedCanonical: "Neuropixels 1.0", proposedOntology: "NIF / OEN" },
  { id: "d2", term: "neuropixel probe", domain: "Devices", field: "device.model", occurrences: 12, sources: ["Publication PMID:123"], suggestedCanonical: "Neuropixels 1.0", proposedOntology: "NIF / OEN", notes: "Likely alias" },
  { id: "d3", term: "NP2.0", domain: "Devices", field: "device.model", occurrences: 9, sources: ["Methods evidence"], suggestedCanonical: "Neuropixels 2.0", proposedOntology: "NIF / OEN" },
  { id: "d4", term: "2P mesoscope", domain: "Devices", field: "device.type", occurrences: 6, sources: ["Grant R01-ABC"], suggestedCanonical: "Two-photon mesoscope", proposedOntology: "OEN" },
  { id: "d5", term: "miniscope v4", domain: "Devices", field: "device.model", occurrences: 18, sources: ["UCLA Miniscope docs"], suggestedCanonical: "UCLA Miniscope v4", proposedOntology: "OEN" },
  { id: "s1", term: "mus musculus", domain: "Species", field: "subject.species", occurrences: 210, sources: ["Grants"], suggestedCanonical: "Mus musculus", proposedOntology: "NCBI Taxonomy" },
  { id: "m1", term: "optogenetic silencing", domain: "Methods", field: "method.name", occurrences: 22, sources: ["Publications"], suggestedCanonical: "Optogenetic inhibition", proposedOntology: "NIFSTD" },
  { id: "sw1", term: "spikeinterface", domain: "Software", field: "software.name", occurrences: 33, sources: ["GitHub"], suggestedCanonical: "SpikeInterface", proposedOntology: "SciCrunch RRID" },
  { id: "dm1", term: "ephys", domain: "Data Modalities", field: "modality", occurrences: 88, sources: ["DANDI"], suggestedCanonical: "Extracellular electrophysiology", proposedOntology: "NWB modality" },
];

export default function OntologyApproval() {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [filter, setFilter] = useState("");
  const [activeDomain, setActiveDomain] = useState<string>("Devices");

  const domains = useMemo(
    () => Array.from(new Set(SEED.map((t) => t.domain))),
    []
  );

  const filtered = useMemo(() => {
    return SEED.filter(
      (t) =>
        t.domain === activeDomain &&
        (filter === "" ||
          t.term.toLowerCase().includes(filter.toLowerCase()) ||
          (t.suggestedCanonical ?? "").toLowerCase().includes(filter.toLowerCase()))
    );
  }, [filter, activeDomain]);

  const stats = useMemo(() => {
    const values = Object.values(decisions);
    return {
      approved: values.filter((v) => v === "approved").length,
      rejected: values.filter((v) => v === "rejected").length,
      aliased: values.filter((v) => v === "aliased").length,
      pending: SEED.length - values.length,
    };
  }, [decisions]);

  const decide = (id: string, d: Decision, term: string) => {
    if (!user) {
      toast.error("Sign in to save ontology decisions");
      return;
    }
    setDecisions((prev) => ({ ...prev, [id]: d }));
    toast.success(`${d === "approved" ? "Approved" : d === "rejected" ? "Rejected" : "Aliased"}: ${term}`);
  };

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ontology Approval</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Review candidate terms harvested from grants, publications, device manuals, and manual entries.
          Approve the canonical form, reject noise, or alias variants to an existing canonical term. Approved
          terms become part of the BBQS metadata vocabulary.
        </p>
      </div>

      {!user && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Preview mode</AlertTitle>
          <AlertDescription>
            You can browse candidate terms, but sign in to save approval decisions to the vocabulary.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold">{stats.pending}</div><div className="text-xs text-muted-foreground">Pending review</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-green-600">{stats.approved}</div><div className="text-xs text-muted-foreground">Approved</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-amber-600">{stats.aliased}</div><div className="text-xs text-muted-foreground">Aliased</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-red-600">{stats.rejected}</div><div className="text-xs text-muted-foreground">Rejected</div></CardContent></Card>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How composite ontologies work here</AlertTitle>
        <AlertDescription className="text-sm">
          BBQS has no single upstream ontology for many concepts (esp. devices). We pull candidate terms from
          text and structured sources, suggest a canonical form and a proposed external ontology (e.g. NIF, OEN,
          NCBI Taxonomy, SciCrunch RRID), and let curators decide. Approvals write to <code>metadata.vocab</code>{" "}
          and become the authoritative terms used when saving new records.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Input
          placeholder="Search candidate terms…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="sm:max-w-sm"
        />
      </div>

      <Tabs value={activeDomain} onValueChange={setActiveDomain}>
        <TabsList className="flex-wrap h-auto">
          {domains.map((d) => (
            <TabsTrigger key={d} value={d}>{d}</TabsTrigger>
          ))}
        </TabsList>

        {domains.map((d) => (
          <TabsContent key={d} value={d} className="space-y-3 mt-4">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground">No candidate terms match.</p>
            )}
            {filtered.map((t) => {
              const decision = decisions[t.id] ?? "pending";
              return (
                <Card key={t.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">"{t.term}"</CardTitle>
                        <CardDescription>
                          Field <code>{t.field}</code> · {t.occurrences} occurrences
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {t.proposedOntology && <Badge variant="outline">{t.proposedOntology}</Badge>}
                        {decision === "approved" && <Badge className="bg-green-600">Approved</Badge>}
                        {decision === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                        {decision === "aliased" && <Badge className="bg-amber-500">Aliased</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {t.suggestedCanonical && t.suggestedCanonical !== t.term && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Suggested canonical: </span>
                        <span className="font-medium">{t.suggestedCanonical}</span>
                      </div>
                    )}
                    {t.notes && <p className="text-xs text-muted-foreground italic">{t.notes}</p>}
                    <div className="text-xs text-muted-foreground">
                      Seen in: {t.sources.join(", ")}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="default" onClick={() => decide(t.id, "approved", t.term)}>
                        <Check className="h-4 w-4 mr-1" /> Approve as canonical
                      </Button>
                      {t.suggestedCanonical && t.suggestedCanonical !== t.term && (
                        <Button size="sm" variant="secondary" onClick={() => decide(t.id, "aliased", t.term)}>
                          <Merge className="h-4 w-4 mr-1" /> Alias to "{t.suggestedCanonical}"
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => decide(t.id, "rejected", t.term)}>
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}