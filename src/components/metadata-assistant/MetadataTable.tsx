import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const DISPLAY_FIELDS = [
  { key: "study_species", label: "Species" },
  { key: "use_approaches", label: "Approaches" },
  { key: "use_sensors", label: "Sensors" },
  { key: "produce_data_modality", label: "Data Modality" },
  { key: "produce_data_type", label: "Data Type" },
  { key: "use_analysis_types", label: "Analysis Types" },
  { key: "use_analysis_method", label: "Analysis Methods" },
  { key: "develope_software_type", label: "Software" },
  { key: "develope_hardware_type", label: "Hardware" },
  { key: "keywords", label: "Keywords" },
  { key: "website", label: "Website" },
  { key: "study_human", label: "Studies Humans" },
];

interface MetadataTableProps {
  grantNumber: string;
  highlightFields?: string[];
}

export function MetadataTable({ grantNumber, highlightFields = [] }: MetadataTableProps) {
  const { data: project, isLoading } = useQuery({
    queryKey: ["project-metadata", grantNumber],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("grant_number", grantNumber)
        .maybeSingle();
      return data;
    },
    refetchInterval: 3000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-sm text-muted-foreground px-4 py-6">No metadata yet. Start chatting to populate fields.</p>;
  }

  return (
    <div className="overflow-auto max-h-[60vh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Field</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DISPLAY_FIELDS.map(({ key, label }) => {
            const val = (project as any)[key];
            const isHighlighted = highlightFields.includes(key);
            return (
              <TableRow key={key} className={isHighlighted ? "bg-accent/10" : ""}>
                <TableCell className="font-medium text-xs text-muted-foreground">{label}</TableCell>
                <TableCell>
                  {renderValue(val, isHighlighted)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function renderValue(val: any, highlighted: boolean) {
  if (val === null || val === undefined) {
    return <span className="text-muted-foreground/50 text-xs italic">Empty</span>;
  }
  if (typeof val === "boolean") {
    return <Badge variant={val ? "default" : "outline"}>{val ? "Yes" : "No"}</Badge>;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-muted-foreground/50 text-xs italic">Empty</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {val.map((v, i) => (
          <Badge key={i} variant={highlighted ? "default" : "secondary"} className="text-xs">
            {v}
          </Badge>
        ))}
      </div>
    );
  }
  if (typeof val === "string" && val.startsWith("http")) {
    return <a href={val} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">{val}</a>;
  }
  return <span className="text-sm">{String(val)}</span>;
}
