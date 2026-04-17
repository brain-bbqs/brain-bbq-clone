import { Sparkles, Check, X, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePendingChanges, type PendingChange } from "@/hooks/usePendingChanges";
import { findFieldByKey } from "@/data/questionnaire-fields";
import { formatDistanceToNow } from "date-fns";

interface Props {
  grantNumber: string;
  canReview: boolean;
}

function formatValue(v: any): string {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return v.length === 0 ? "(empty list)" : v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function PendingChangeRow({
  change, canReview, onAccept, onReject, accepting, rejecting,
}: {
  change: PendingChange;
  canReview: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  accepting: boolean;
  rejecting: boolean;
}) {
  const fieldDef = findFieldByKey(change.field_name);
  const label = fieldDef?.label ?? change.field_name;

  return (
    <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <Badge variant="outline" className="text-[10px] uppercase">
              {change.source}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Suggested {formatDistanceToNow(new Date(change.created_at), { addSuffix: true })}
            {change.proposed_by_email && ` · ${change.proposed_by_email}`}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 text-xs mb-3">
        <div className="flex gap-2">
          <span className="text-muted-foreground w-16 shrink-0">Current:</span>
          <span className="text-foreground/70 break-words">{formatValue(change.current_value)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-blue-700 dark:text-blue-400 w-16 shrink-0 font-medium">Proposed:</span>
          <span className="text-foreground font-medium break-words">{formatValue(change.proposed_value)}</span>
        </div>
        {change.rationale && (
          <div className="flex gap-2 pt-1">
            <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground italic">{change.rationale}</span>
          </div>
        )}
      </div>

      {canReview && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onAccept(change.id)}
            disabled={accepting || rejecting}
            className="h-7 text-xs"
          >
            {accepting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
            Accept
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onReject(change.id)}
            disabled={accepting || rejecting}
            className="h-7 text-xs"
          >
            {rejecting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <X className="h-3 w-3 mr-1" />}
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

export function PendingChangesPanel({ grantNumber, canReview }: Props) {
  const { pending, isLoading, accept, reject, isAccepting, isRejecting } = usePendingChanges(grantNumber);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground">
        Loading suggestions…
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Assistant Suggestions</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No pending suggestions. Use the BBQS Assistant to propose updates to this project's metadata.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Assistant Suggestions</h3>
          <Badge variant="secondary" className="text-xs">{pending.length}</Badge>
        </div>
      </div>
      <div className="space-y-2.5">
        {pending.map((c) => (
          <PendingChangeRow
            key={c.id}
            change={c}
            canReview={canReview}
            onAccept={accept}
            onReject={reject}
            accepting={isAccepting}
            rejecting={isRejecting}
          />
        ))}
      </div>
    </div>
  );
}
