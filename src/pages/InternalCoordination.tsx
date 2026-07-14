import { useUserTier } from "@/hooks/useUserTier";
import { PageMeta } from "@/components/PageMeta";
import NotFound from "./NotFound";
import { PersonalityBoard } from "@/components/social-force-field/PersonalityBoard";

export default function InternalCoordination() {
  const { isAdmin, isLoading } = useUserTier();
  if (isLoading) return null;
  if (!isAdmin) return <NotFound />;
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageMeta title="Admin" description="Admin" />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Coordination Instrumentation</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Admin-only. Big Five &amp; HEXACO trait signals derived from each investigator's grant
          &amp; publication text using the Roivainen (2022) age-of-acquisition adjective lexicon.
          Purpose is coordination, never evaluation. Do not share out.
        </p>
      </div>
      <PersonalityBoard />
    </div>
  );
}