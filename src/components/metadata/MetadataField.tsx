import { Badge } from "@/components/ui/badge";

interface MetadataFieldProps {
  label: string;
  value: string | string[] | boolean | number | null | undefined;
  type?: "text" | "tags" | "boolean" | "link";
}

export function MetadataField({ label, value, type = "text" }: MetadataFieldProps) {
  const isEmpty = value === null || value === undefined || value === "" ||
    (Array.isArray(value) && value.length === 0);

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground/50 italic">Not set</p>
      ) : type === "tags" && Array.isArray(value) ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      ) : type === "boolean" ? (
        <p className="text-sm text-foreground">{value ? "Yes" : "No"}</p>
      ) : type === "link" && typeof value === "string" ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
          {value}
        </a>
      ) : (
        <p className="text-sm text-foreground whitespace-pre-wrap">{String(value)}</p>
      )}
    </div>
  );
}
