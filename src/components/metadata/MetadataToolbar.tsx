import { RotateCcw, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MetadataToolbarProps {
  hasChanges: boolean;
  changeCount: number;
  onDiscard: () => void;
  onCommit: () => void;
  isCommitting: boolean;
}

export function MetadataToolbar({ hasChanges, changeCount, onDiscard, onCommit, isCommitting }: MetadataToolbarProps) {
  if (!hasChanges) return null;

  return (
    <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border border-amber-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
      <p className="text-sm text-foreground">
        <span className="font-medium text-amber-600 dark:text-amber-400">{changeCount}</span>{" "}
        field{changeCount !== 1 ? "s" : ""} modified
      </p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={isCommitting}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Discard All
        </Button>
        <Button size="sm" onClick={onCommit} disabled={isCommitting}>
          {isCommitting ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5 mr-1.5" />
          )}
          Commit Changes
        </Button>
      </div>
    </div>
  );
}
