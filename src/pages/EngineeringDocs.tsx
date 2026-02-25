import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Database, Brain, GitBranch, Layers, ShieldCheck, ArrowRight } from "lucide-react";

interface OntologyStandard {
  id: string;
  name: string;
  abbreviation: string | null;
  description: string;
  category: string;
  url: string | null;
}

interface CustomFieldUsage {
  id: string;
  field_name: string;
  field_value: string;
  category: string | null;
  usage_count: number;
  closest_canonical: string | null;
  levenshtein_distance: number | null;
  promoted: boolean;
}

const categoryLabel: Record<string, string> = {
  data_standard: "Data Standard",
  ontology: "Ontology",
  ethics_governance: "Ethics & Governance",
};

export default function EngineeringDocs() {
  const { data: ontologies = [] } = useQuery<OntologyStandard[]>({
    queryKey: ["ontology-standards"],
    queryFn: async () => {
      const { data } = await supabase.from("ontology_standards").select("*").order("category");
      return (data || []) as OntologyStandard[];
    },
  });

  const { data: customFields = [] } = useQuery<CustomFieldUsage[]>({
    queryKey: ["custom-field-usage"],
    queryFn: async () => {
      const { data } = await supabase
        .from("custom_field_usage")
        .select("*")
        .order("usage_count", { ascending: false })
        .limit(50);
      return (data || []) as CustomFieldUsage[];
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Engineering Documentation</h1>
            <p className="text-sm text-muted-foreground">Architecture, systems, and how the platform learns</p>
          </div>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["data-provenance", "self-autonomy", "ontologies", "custom-fields"]} className="space-y-4">

        {/* ─── Section 1: Data Provenance ─── */}
        <AccordionItem value="data-provenance" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">
            <span className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Data Provenance
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every metadata edit in the BBQS system is tracked with full provenance. When a user (or the AI assistant)
              modifies a project's metadata field, the system records:
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "Who", desc: "The authenticated user's email or 'ai-assistant'" },
                { label: "What", desc: "The field name, old value, and new value (JSON diff)" },
                { label: "When", desc: "Timestamp of the change" },
                { label: "Context", desc: "Chat context if the edit was made via AI conversation" },
              ].map((item) => (
                <Card key={item.label} className="bg-secondary/30">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium text-foreground">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>User edits a field via the BBQS Assistant chat or metadata table</li>
                <li>The frontend calls <code className="bg-muted px-1 rounded text-xs">useEditHistory.logChanges()</code> after a successful commit</li>
                <li>A row is inserted into the <code className="bg-muted px-1 rounded text-xs">edit_history</code> table with the diff</li>
                <li>Supabase Realtime broadcasts the insert to all connected clients</li>
                <li>The Data Provenance page and Profile page both query this table for audit trails</li>
              </ol>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium text-foreground mb-2">Database schema:</p>
              <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre">{`edit_history
├── id            uuid (PK)
├── project_id    uuid (FK → projects)
├── grant_number  text
├── field_name    text
├── old_value     jsonb
├── new_value     jsonb
├── edited_by     text (user email)
├── chat_context  jsonb (AI conversation context)
└── created_at    timestamptz`}</pre>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ─── Section 2: Self-Autonomy System ─── */}
        <AccordionItem value="self-autonomy" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Self-Autonomy &amp; Taxonomy Evolution
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The BBQS platform is designed to <strong>learn and evolve</strong> as researchers contribute metadata.
              Rather than requiring administrators to manually define every possible metadata value, the system
              uses a three-phase approach to organically grow its taxonomy.
            </p>

            <div className="space-y-3">
              <Card className="bg-secondary/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 shrink-0">Phase 1</Badge>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Canonical Taxonomy Seeding</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Initial metadata categories (species, approaches, sensors, data modalities, analysis methods)
                        are seeded into the <code className="bg-muted px-1 rounded">taxonomies</code> table from consortium standards
                        like BIDS, NWB, NBO, and HED. These form the canonical vocabulary.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 shrink-0">Phase 2</Badge>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Normalization &amp; Distance Matching</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        When users enter free-text metadata, the <code className="bg-muted px-1 rounded">normalize-tags</code> edge
                        function computes the Levenshtein distance against all canonical values. If the distance
                        is ≤ 2, the value is auto-corrected to the canonical form (typo fix). If the distance
                        is &gt; 4, the value is flagged as a novel term and tracked in <code className="bg-muted px-1 rounded">custom_field_usage</code>.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 shrink-0">Phase 3</Badge>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Auto-Promotion to Official Taxonomy</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        When a novel term's usage count reaches the promotion threshold (currently ≥ 3 uses across
                        projects), the system automatically promotes it into the <code className="bg-muted px-1 rounded">taxonomies</code> table
                        as an official value. This means the Knowledge Graph will now recognize it as a first-class
                        node, and future normalization runs will match against it.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium text-foreground mb-2">Decision flow:</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">User enters value</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="secondary">Exact match?</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="secondary">Fuzzy match (d ≤ 2)?</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="secondary">Track as custom</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="secondary">Usage ≥ 3 &amp; d ≥ 4?</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge className="bg-primary text-primary-foreground">Promote!</Badge>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ─── Section 3: Consortium Ontologies ─── */}
        <AccordionItem value="ontologies" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">
            <span className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Consortium Ontologies &amp; Standards
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The BBQS consortium relies on established standards and ontologies to ensure interoperability
              across all projects. These standards inform the canonical taxonomy and guide how new composite
              metadata values are validated.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              {ontologies.map((o) => (
                <Card key={o.id} className="bg-secondary/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {o.abbreviation ? `${o.abbreviation} — ${o.name}` : o.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px]">
                        {categoryLabel[o.category] || o.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">{o.description}</p>
                    {o.url && (
                      <a href={o.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-2 inline-block">
                        View documentation →
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ─── Section 4: Custom Field Tracker ─── */}
        <AccordionItem value="custom-fields" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Custom Field Usage Tracker
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This live table shows all non-canonical metadata values that researchers have contributed.
              Values approaching the promotion threshold will automatically become official taxonomy entries.
            </p>

            {customFields.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No custom fields tracked yet. Values will appear here as researchers add novel metadata.</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Value</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Uses</TableHead>
                      <TableHead className="text-xs">Nearest Canonical</TableHead>
                      <TableHead className="text-xs">Distance</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customFields.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="text-xs font-medium">{f.field_value}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.category || "—"}</TableCell>
                        <TableCell className="text-xs">{f.usage_count}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.closest_canonical || "—"}</TableCell>
                        <TableCell className="text-xs">{f.levenshtein_distance ?? "—"}</TableCell>
                        <TableCell>
                          {f.promoted ? (
                            <Badge className="bg-primary text-primary-foreground text-[10px]">Promoted</Badge>
                          ) : f.usage_count >= 3 ? (
                            <Badge variant="secondary" className="text-[10px]">Ready</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Tracking</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ─── Section 5: Adding Custom Metadata (Tutorial) ─── */}
        <AccordionItem value="custom-fields-tutorial" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Tutorial: Adding Custom Metadata Fields
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              One of the most powerful features of the BBQS platform is the ability for researchers to contribute
              new metadata fields that haven't been predefined. Here's how it works:
            </p>

            <div className="space-y-3">
              {[
                {
                  step: "1",
                  title: "Open the BBQS Assistant",
                  desc: "Navigate to the BBQS Assistant page and select your project from the grid.",
                },
                {
                  step: "2",
                  title: "Describe your metadata in natural language",
                  desc: "Tell the AI assistant about your project's unique characteristics. For example: \"We use a custom multi-electrode array with 512 channels\" or \"Our analysis involves a novel spike sorting algorithm called WaveClus3\".",
                },
                {
                  step: "3",
                  title: "The AI extracts structured fields",
                  desc: "The metadata-chat edge function parses your description and extracts structured key-value pairs. If a value matches an existing taxonomy (even approximately), it normalizes it automatically.",
                },
                {
                  step: "4",
                  title: "Novel values are tracked",
                  desc: "If your value doesn't match any existing canonical term (Levenshtein distance > 4), it's recorded in the custom_field_usage table with a count of 1.",
                },
                {
                  step: "5",
                  title: "Community validation through usage",
                  desc: "When 3 or more projects independently use the same novel value, the system recognizes it as a legitimate new term and auto-promotes it into the official taxonomy. It becomes a first-class node in the Knowledge Graph.",
                },
                {
                  step: "6",
                  title: "Ontology cross-referencing",
                  desc: "Promoted terms are cross-referenced against consortium ontologies (BIDS, NWB, NBO, HED) to generate composite labels and ensure alignment with established standards.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
