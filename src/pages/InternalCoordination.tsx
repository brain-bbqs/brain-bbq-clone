import { useUserTier } from "@/hooks/useUserTier";
import { PageMeta } from "@/components/PageMeta";
import NotFound from "./NotFound";
import { PersonalityBoard } from "@/components/social-force-field/PersonalityBoard";
import { CohortHeatmap } from "@/components/social-force-field/CohortHeatmap";
import { BirthdayAdmin } from "@/components/social-force-field/BirthdayAdmin";
import { ZodiacDistribution } from "@/components/social-force-field/ZodiacDistribution";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function InternalCoordination() {
  const { isAdmin, isLoading } = useUserTier();
  const [model, setModel] = useState<"bigfive" | "hexaco">("hexaco");

  // Kick off background scoring if the table is empty. Silent.
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { count } = await supabase
        .from("personality_scores")
        .select("investigator_id", { count: "exact", head: true });
      if ((count ?? 0) === 0) {
        void supabase.functions.invoke("personality-score-worker", { body: {} });
      }
    })();
  }, [isAdmin]);

  if (isLoading) return null;
  if (!isAdmin) return <NotFound />;
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageMeta title="Admin" description="Admin" />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Cognitive Layer — R61 / R34 Mental Models</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Admin-only meso layer. Each cohort is anchored to a shared mental model defined by the
          consortium's grant mechanism (R61 translational neural devices, R34 animal behavior &amp;
          collective intelligence). Personality is derived from each investigator's grant &amp;
          publication text (Roivainen 2022 AoA adjective lexicon) and correlated to their attention
          signal on the platform. Coordination, not evaluation. Do not share out.
        </p>
        <div className="mt-3 inline-flex rounded-md border border-border overflow-hidden text-xs">
          <button
            onClick={() => setModel("hexaco")}
            className={`px-3 py-1 ${model === "hexaco" ? "bg-primary text-primary-foreground" : "bg-background"}`}
          >HEXACO</button>
          <button
            onClick={() => setModel("bigfive")}
            className={`px-3 py-1 ${model === "bigfive" ? "bg-primary text-primary-foreground" : "bg-background"}`}
          >Big Five</button>
        </div>
      </div>
      <CohortHeatmap cohort="R61" model={model} />
      <CohortHeatmap cohort="R34" model={model} />
      <ZodiacDistribution />
      <BirthdayAdmin />
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-2">Individual profiles</h2>
        <PersonalityBoard />
      </div>
    </div>
  );
}