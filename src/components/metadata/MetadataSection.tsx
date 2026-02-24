import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetadataSectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function MetadataSection({ title, icon: Icon, children, defaultOpen = true }: MetadataSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-5 py-3.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground flex-1">{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-5 py-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
