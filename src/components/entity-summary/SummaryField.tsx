import { ReactNode } from "react";

interface SummaryFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function SummaryField({ label, children, className = "" }: SummaryFieldProps) {
  return (
    <div className={`grid grid-cols-[140px_1fr] gap-3 py-2.5 border-b border-border/50 last:border-0 ${className}`}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}
