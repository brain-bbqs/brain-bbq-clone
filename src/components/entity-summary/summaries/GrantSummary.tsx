import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SummaryField } from "../SummaryField";
import { SummaryTabs } from "../SummaryTabs";
import { EntityComments } from "../EntityComments";
import { useEntitySummary } from "@/contexts/EntitySummaryContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, FileText, MessageSquare, FolderOpen, Microscope } from "lucide-react";
import { GrantMarrSection } from "./GrantMarrSection";

export function GrantSummary({ id }: { id: string }) {
  const { open } = useEntitySummary();

  const { data, isLoading } = useQuery({
    queryKey: ["entity-grant", id],
    queryFn: async () => {
      const { data: grant, error } = await supabase.from("grants").select("*").eq("id", id).single();
      if (error) throw error;

      // Get investigators
      const { data: invLinks } = await supabase
        .from("grant_investigators")
        .select("investigator_id, role")
        .eq("grant_number", grant.grant_number);
      const invIds = invLinks?.map((i) => i.investigator_id) || [];
      const { data: investigators } = invIds.length
        ? await supabase.from("investigators").select("id, name, resource_id").in("id", invIds)
        : { data: [] };

      // Get project metadata
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("grant_number", grant.grant_number)
        .maybeSingle();

      // Get publications - try project_publications join first, then fall back to nih_grants_cache
      let publications: any[] = [];
      if (project?.id) {
        const { data: pubLinks } = await supabase
          .from("project_publications")
          .select("publication_id")
          .eq("project_id", project.id);
        const pubIds = pubLinks?.map((p) => p.publication_id) || [];
        if (pubIds.length) {
          const { data: pubs } = await supabase
            .from("publications")
            .select("id, title, authors, year, journal, doi, citations, rcr, resource_id, pubmed_link")
            .in("id", pubIds)
            .order("year", { ascending: false });
          publications = pubs || [];
        }
      }

      // nih_grants_cache fallback removed (table dropped)

      return {
        ...grant,
        invLinks: invLinks || [],
        investigators: investigators || [],
        project,
        publications,
      };
    },
  });

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>;
  if (!data) return <p className="p-6 text-muted-foreground">Grant not found.</p>;

  const summaryContent = (
    <div className="space-y-1">
      <SummaryField label="Title"><span className="font-medium">{data.title}</span></SummaryField>
      <SummaryField label="Grant Number"><span className="font-mono">{data.grant_number}</span></SummaryField>
      {data.fiscal_year && <SummaryField label="Fiscal Year">{data.fiscal_year}</SummaryField>}
      {data.award_amount && <SummaryField label="Award Amount">${Number(data.award_amount).toLocaleString()}</SummaryField>}
      {data.nih_link && (
        <SummaryField label="NIH Reporter">
          <a href={data.nih_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
            View on NIH Reporter <ExternalLink className="h-3 w-3" />
          </a>
        </SummaryField>
      )}
      {data.project?.website && (
        <SummaryField label="Website">
          <a href={data.project.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
            {data.project.website} <ExternalLink className="h-3 w-3" />
          </a>
        </SummaryField>
      )}

      {/* Abstract */}
      {data.abstract && (
        <div className="pt-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Abstract</h3>
          <p className="text-sm text-foreground leading-relaxed">{data.abstract}</p>
        </div>
      )}

      {/* Investigators */}
      {data.investigators.length > 0 && (
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Investigators ({data.investigators.length})</h3>
          <div className="flex flex-wrap gap-2">
            {data.investigators.map((inv) => {
              const link = data.invLinks.find((l: any) => l.investigator_id === inv.id);
              return (
                <Badge
                  key={inv.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => open({ type: "investigator", id: inv.id, resourceId: inv.resource_id || undefined, label: inv.name })}
                >
                  {inv.name} ({link?.role === "pi" ? "PI" : "Co-PI"})
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Project metadata */}
      {data.project && (
        <div className="pt-4 space-y-2">
          {data.project.keywords?.length > 0 && (
            <SummaryField label="Keywords">
              <div className="flex flex-wrap gap-1.5">{data.project.keywords.map((k: string) => <Badge key={k} variant="secondary">{k}</Badge>)}</div>
            </SummaryField>
          )}
          {data.project.study_species?.length > 0 && (
            <SummaryField label="Species">
              <div className="flex flex-wrap gap-1.5">{data.project.study_species.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
            </SummaryField>
          )}
          {(data.project.metadata as any)?.use_approaches?.length > 0 && (
            <SummaryField label="Approaches">
              <div className="flex flex-wrap gap-1.5">{((data.project.metadata as any).use_approaches as string[]).map((a: string) => <Badge key={a} variant="secondary">{a}</Badge>)}</div>
            </SummaryField>
          )}
        </div>
      )}
    </div>
  );

  const publicationsContent = (
    <div className="space-y-3">
      {data.publications.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No publications linked to this grant yet.</p>
      ) : (
        data.publications.map((pub: any) => (
          <div key={pub.id} className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
            <button
              className="text-left w-full"
              onClick={() => open({ type: "publication", id: pub.id, resourceId: pub.resource_id || undefined, label: pub.title })}
            >
              <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{pub.title}</p>
            </button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
              {pub.journal && <span>{pub.journal}</span>}
              {pub.year && <span>{pub.year}</span>}
              {pub.citations > 0 && <span>{pub.citations} citations</span>}
              {pub.doi && (
                <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  DOI <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              {pub.pubmed_link && (
                <a href={pub.pubmed_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  PubMed <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
            {pub.authors && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{pub.authors}</p>}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div>
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{data.grant_number}</h2>
            <p className="text-sm text-muted-foreground">NIH Grant</p>
          </div>
        </div>
      </div>
      <SummaryTabs tabs={[
        { id: "summary", label: "Summary", icon: <FileText className="h-3.5 w-3.5" />, content: summaryContent },
        { id: "details", label: "Details", icon: <Microscope className="h-3.5 w-3.5" />, content: (
          data.project ? (
            <GrantMarrSection metadata={(data.project as any).metadata || {}} project={data.project} />
          ) : (
            <p className="text-sm text-muted-foreground italic">No project metadata available.</p>
          )
        )},
        { id: "publications", label: `Publications (${data.publications.length})`, icon: <FileText className="h-3.5 w-3.5" />, content: publicationsContent },
        { id: "comments", label: "Comments", icon: <MessageSquare className="h-3.5 w-3.5" />, content: data.resource_id ? <EntityComments resourceId={data.resource_id} /> : <p className="text-sm text-muted-foreground italic">Comments not available.</p> },
      ]} />
    </div>
  );
}
