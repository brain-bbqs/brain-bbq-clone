import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SummaryField } from "../SummaryField";
import { SummaryTabs } from "../SummaryTabs";
import { EntityComments } from "../EntityComments";
import { useEntitySummary } from "@/contexts/EntitySummaryContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, FileText, MessageSquare, Building } from "lucide-react";

export function OrganizationSummary({ id }: { id: string }) {
  const { open } = useEntitySummary();

  const { data, isLoading } = useQuery({
    queryKey: ["entity-organization", id],
    queryFn: async () => {
      const { data: org, error } = await supabase.from("organizations").select("*").eq("id", id).single();
      if (error) throw error;

      // Get investigators at this org
      const { data: invLinks } = await supabase
        .from("investigator_organizations")
        .select("investigator_id")
        .eq("organization_id", id);
      const invIds = invLinks?.map((i) => i.investigator_id) || [];
      const { data: investigators } = invIds.length
        ? await supabase.from("investigators").select("id, name, resource_id").in("id", invIds)
        : { data: [] };

      return { ...org, investigators: investigators || [] };
    },
  });

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-4 w-full" /></div>;
  if (!data) return <p className="p-6 text-muted-foreground">Organization not found.</p>;

  const summaryContent = (
    <div className="space-y-1">
      <SummaryField label="Name"><span className="font-medium">{data.name}</span></SummaryField>
      {data.url && (
        <SummaryField label="Website">
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
            {data.url} <ExternalLink className="h-3 w-3" />
          </a>
        </SummaryField>
      )}
      {data.investigators.length > 0 && (
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Investigators ({data.investigators.length})</h3>
          <div className="flex flex-wrap gap-2">
            {data.investigators.map((inv) => (
              <Badge
                key={inv.id}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => open({ type: "investigator", id: inv.id, resourceId: inv.resource_id || undefined, label: inv.name })}
              >
                {inv.name}
              </Badge>
            ))}
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
            <Building className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{data.name}</h2>
            <p className="text-sm text-muted-foreground">Organization</p>
          </div>
        </div>
      </div>
      <SummaryTabs tabs={[
        { id: "summary", label: "Summary", icon: <FileText className="h-3.5 w-3.5" />, content: summaryContent },
        { id: "comments", label: "Comments", icon: <MessageSquare className="h-3.5 w-3.5" />, content: data.resource_id ? <EntityComments resourceId={data.resource_id} /> : <p className="text-sm text-muted-foreground italic">Comments not available.</p> },
      ]} />
    </div>
  );
}
