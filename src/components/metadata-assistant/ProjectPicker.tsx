import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ProjectPickerProps {
  value: string | null;
  onChange: (grantNumber: string) => void;
}

export function ProjectPicker({ value, onChange }: ProjectPickerProps) {
  const { data: grants } = useQuery({
    queryKey: ["grants-for-picker"],
    queryFn: async () => {
      const { data } = await supabase
        .from("grants")
        .select("grant_number, title")
        .order("grant_number");
      return data || [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects-completeness"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("grant_number, metadata_completeness");
      return data || [];
    },
  });

  const completenessMap = new Map(
    (projects || []).map(p => [p.grant_number, p.metadata_completeness ?? 0])
  );

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-card border-border">
        <SelectValue placeholder="Select a project to begin..." />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {(grants || []).map(g => (
          <SelectItem key={g.grant_number} value={g.grant_number}>
            <div className="flex items-center gap-2">
              <span className="truncate max-w-[280px]">{g.title}</span>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {completenessMap.get(g.grant_number) || 0}%
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
