import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SystemAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  source: string;
  error_code: string;
  message: string;
  details: Record<string, unknown> | null;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  email_sent: boolean;
  github_issue_url: string | null;
  github_issue_number: number | null;
}

const SEVERITY_STYLES: Record<SystemAlert["severity"], string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  warning: "bg-accent/10 text-accent-foreground border-accent/30",
  info: "bg-primary/10 text-primary border-primary/30",
};

export function SystemAlertsBanner() {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["system-alerts-unresolved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_alerts")
        .select("*")
        .eq("resolved", false)
        .order("severity", { ascending: false })
        .order("last_seen_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as SystemAlert[];
    },
    refetchInterval: 60_000, // poll every minute
  });

  const resolveAlert = async (alertId: string) => {
    const { error } = await supabase
      .from("system_alerts")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", alertId);
    if (error) {
      toast.error("Could not resolve alert: " + error.message);
      return;
    }
    toast.success("Alert marked resolved");
    queryClient.invalidateQueries({ queryKey: ["system-alerts-unresolved"] });
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="py-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking system alerts…
        </CardContent>
      </Card>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="py-4 flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">All systems healthy.</span>
          <span className="text-muted-foreground">No unresolved critical alerts.</span>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return (
    <Card className="mb-6 border-destructive/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {alerts.length} unresolved system alert{alerts.length === 1 ? "" : "s"}
              {criticalCount > 0 && (
                <Badge variant="destructive" className="ml-1">{criticalCount} critical</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Edge functions reported failures that need attention. Email notifications sent to the on-call recipient.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-md border p-3 text-sm ${SEVERITY_STYLES[alert.severity]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-xs">{alert.source}</Badge>
                  <Badge variant="outline" className="font-mono text-xs">{alert.error_code}</Badge>
                  <span className="text-xs opacity-70">
                    {alert.occurrence_count}× · last seen {formatDistanceToNow(new Date(alert.last_seen_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="font-medium break-words">{alert.message}</p>
                {alert.details && Object.keys(alert.details).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs opacity-70 hover:opacity-100">View details</summary>
                    <pre className="mt-2 text-xs bg-background/60 p-2 rounded overflow-x-auto">
                      {JSON.stringify(alert.details, null, 2)}
                    </pre>
                  </details>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-xs opacity-80">
                  <span>📧 Email {alert.email_sent ? "sent" : "skipped"}</span>
                  {alert.github_issue_url && (
                    <a
                      href={alert.github_issue_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline hover:no-underline"
                    >
                      GitHub issue #{alert.github_issue_number}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => resolveAlert(alert.id)}
              >
                Resolve
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}