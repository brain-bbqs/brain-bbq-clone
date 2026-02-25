import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const DISPLAY_FIELDS = [
  { key: "study_species", label: "Species", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "use_approaches", label: "Approaches", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "use_sensors", label: "Sensors", color: "bg-violet-100 text-violet-800 border-violet-200" },
  { key: "produce_data_modality", label: "Data Modality", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "produce_data_type", label: "Data Type", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { key: "use_analysis_types", label: "Analysis Types", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { key: "use_analysis_method", label: "Analysis Methods", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { key: "develope_software_type", label: "Software", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { key: "develope_hardware_type", label: "Hardware", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { key: "keywords", label: "Keywords", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { key: "website", label: "Website", color: "" },
  { key: "study_human", label: "Studies Humans", color: "" },
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
          {DISPLAY_FIELDS.map(({ key, label, color }) => {
            const val = (project as any)[key];
            const isHighlighted = highlightFields.includes(key);
            return (
              <TableRow key={key} className={isHighlighted ? "bg-accent/10" : ""}>
                <TableCell className="font-medium text-xs text-muted-foreground">{label}</TableCell>
                <TableCell>
                  {renderValue(val, isHighlighted, color)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function renderValue(val: any, highlighted: boolean, colorClass: string) {
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
          <Badge
            key={i}
            variant="outline"
            className={`text-xs border ${colorClass || "bg-secondary text-secondary-foreground"}`}
          >
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
