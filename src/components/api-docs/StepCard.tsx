import { cn } from "@/lib/utils";

export function StepCard({ step, number, color }: { step: { title: string; description: string; detail?: string }; number: number; color: string }) {
  return (
    <div className="flex gap-4">
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-[hsl(0_0%_100%)]", color)}>
        {number}
      </div>
      <div className="flex-1 pb-6">
        <h4 className="text-sm font-semibold text-foreground mb-1">{step.title}</h4>
        <p className="text-xs text-muted-foreground">{step.description}</p>
        {step.detail && (
          <p className="text-xs text-muted-foreground mt-1 italic">{step.detail}</p>
        )}
      </div>
    </div>
  );
}
