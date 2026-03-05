import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SummaryField } from "../SummaryField";
import { SummaryTabs } from "../SummaryTabs";
import { EntityComments } from "../EntityComments";
import { useEntitySummary } from "@/contexts/EntitySummaryContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, FileText, MessageSquare, User } from "lucide-react";

export function InvestigatorSummary({ id }: { id: string }) {
  const { open } = useEntitySummary();

  const { data, isLoading } = useQuery({
    queryKey: ["entity-investigator", id],
    queryFn: async () => {
      const { data: inv, error } = await supabase
        .from("investigators")
        .select("*, resource_id")
        .eq("id", id)
        .single();
      if (error) throw error;

      // Get organizations
      const { data: orgLinks } = await supabase
        .from("investigator_organizations")
        .select("organization_id")
        .eq("investigator_id", id);
      const orgIds = orgLinks?.map((o) => o.organization_id) || [];
      const { data: orgs } = orgIds.length
        ? await supabase.from("organizations").select("id, name, resource_id").in("id", orgIds)
        : { data: [] };

      // Get grants
      const { data: grantLinks } = await supabase
        .from("grant_investigators")
        .select("grant_number, role")
        .eq("investigator_id", id);
      const grantNumbers = grantLinks?.map((g) => g.grant_number) || [];
      const { data: grants } = grantNumbers.length
        ? await supabase.from("grants").select("id, grant_number, title, award_amount, resource_id").in("grant_number", grantNumbers)
        : { data: [] };

      return { ...inv, organizations: orgs || [], grantLinks: grantLinks || [], grants: grants || [] };
    },
  });

  if (isLoading) return <SummaryLoading />;
  if (!data) return <p className="p-6 text-muted-foreground">Investigator not found.</p>;

  const summaryContent = (
    <div className="space-y-1">
      <SummaryField label="Name">{data.name}</SummaryField>
      {data.email && <SummaryField label="Email"><a href={`mailto:${data.email}`} className="text-primary hover:underline">{data.email}</a></SummaryField>}
      {data.orcid && (
        <SummaryField label="ORCID">
          <a href={`https://orcid.org/${data.orcid}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
            {data.orcid} <ExternalLink className="h-3 w-3" />
          </a>
        </SummaryField>
      )}
      {data.scholar_id && (
        <SummaryField label="Google Scholar">
          <a href={`https://scholar.google.com/citations?user=${data.scholar_id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
            Profile <ExternalLink className="h-3 w-3" />
          </a>
        </SummaryField>
      )}
      {data.organizations.length > 0 && (
        <SummaryField label="Institutions">
          <div className="flex flex-wrap gap-1.5">
            {data.organizations.map((org) => (
              <Badge
                key={org.id}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => open({ type: "organization", id: org.id, resourceId: org.resource_id || undefined, label: org.name })}
              >
                {org.name}
              </Badge>
            ))}
          </div>
        </SummaryField>
      )}
      {data.skills && data.skills.length > 0 && (
        <SummaryField label="Skills">
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        </SummaryField>
      )}
      {data.research_areas && data.research_areas.length > 0 && (
        <SummaryField label="Research Areas">
          <div className="flex flex-wrap gap-1.5">
            {data.research_areas.map((a: string) => <Badge key={a} variant="secondary">{a}</Badge>)}
          </div>
        </SummaryField>
      )}

      {/* Grants */}
      {data.grants.length > 0 && (
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Grants ({data.grants.length})</h3>
          <div className="space-y-2">
            {data.grants.map((g) => {
              const link = data.grantLinks.find((gl: any) => gl.grant_number === g.grant_number);
              return (
                <div
                  key={g.id}
                  className="rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => open({ type: "grant", id: g.id, resourceId: g.resource_id || undefined, label: g.grant_number })}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{link?.role === "pi" ? "PI" : "Co-PI"}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{g.grant_number}</span>
                  </div>
                  <p className="text-sm font-medium mt-1 line-clamp-2">{g.title}</p>
                  {g.award_amount && (
                    <p className="text-xs text-muted-foreground mt-1">${Number(g.award_amount).toLocaleString()}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{data.name}</h2>
            <p className="text-sm text-muted-foreground">Investigator</p>
          </div>
        </div>
      </div>
      <SummaryTabs tabs={[
        { id: "summary", label: "Summary", icon: <FileText className="h-3.5 w-3.5" />, content: summaryContent },
        { id: "comments", label: "Comments", icon: <MessageSquare className="h-3.5 w-3.5" />, content: data.resource_id ? <EntityComments resourceId={data.resource_id} /> : <p className="text-sm text-muted-foreground italic">Comments not available for this entity.</p> },
      ]} />
    </div>
  );
}

function SummaryLoading() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
