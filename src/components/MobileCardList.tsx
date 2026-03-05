import { ExternalLink } from "lucide-react";

interface MobileCardField {
  label: string;
  value: React.ReactNode;
}

interface MobileCardItem {
  id: string;
  title: string;
  titleHref?: string;
  fields: MobileCardField[];
  badges?: React.ReactNode;
}

interface MobileCardListProps {
  items: MobileCardItem[];
  emptyMessage?: string;
}

export function MobileCardList({ items, emptyMessage = "No items found" }: MobileCardListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-card border border-border rounded-lg p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            {item.titleHref ? (
              <a
                href={item.titleHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline text-sm inline-flex items-center gap-1"
              >
                {item.title}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            ) : (
              <span className="font-semibold text-foreground text-sm">{item.title}</span>
            )}
            {item.badges && <div className="flex gap-1 shrink-0">{item.badges}</div>}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {item.fields.map((field) => (
              <div key={field.label}>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {field.label}
                </span>
                <div className="text-xs text-foreground">{field.value || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
