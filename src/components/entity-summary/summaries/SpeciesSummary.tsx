import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SummaryField } from "../SummaryField";
import { SummaryTabs } from "../SummaryTabs";
import { EntityComments } from "../EntityComments";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, MessageSquare, Bug } from "lucide-react";

export function SpeciesSummary({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["entity-species", id],
    queryFn: async () => {
      const { data: sp, error } = await supabase.from("species").select("*").eq("id", id).single();
      if (error) throw error;
      return sp;
    },
  });

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-4 w-full" /></div>;
  if (!data) return <p className="p-6 text-muted-foreground">Species not found.</p>;

  const summaryContent = (
    <div className="space-y-1">
      <SummaryField label="Scientific Name"><span className="italic font-medium">{data.name}</span></SummaryField>
      {data.common_name && <SummaryField label="Common Name">{data.common_name}</SummaryField>}
      {data.taxonomy_class && <SummaryField label="Class">{data.taxonomy_class}</SummaryField>}
      {data.taxonomy_order && <SummaryField label="Order">{data.taxonomy_order}</SummaryField>}
      {data.taxonomy_family && <SummaryField label="Family">{data.taxonomy_family}</SummaryField>}
      {data.taxonomy_genus && <SummaryField label="Genus">{data.taxonomy_genus}</SummaryField>}
    </div>
  );

  return (
    <div>
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bug className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground italic">{data.name}</h2>
            <p className="text-sm text-muted-foreground">Species{data.common_name ? ` · ${data.common_name}` : ""}</p>
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
