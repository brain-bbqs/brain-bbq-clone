import { useState } from "react";
import { Database, RefreshCw, CheckCircle, AlertCircle, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AdminPanelProps {
  accessToken: string;
}

export function AdminPanel({ accessToken }: AdminPanelProps) {
  const [isIngesting, setIsIngesting] = useState(false);
  const [isIngestingWorkflows, setIsIngestingWorkflows] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const triggerIngestion = async () => {
    setIsIngesting(true);
    setLastResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neuromcp-ingest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ action: "ingest" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ingestion failed");
      }

      setLastResult({
        success: true,
        message: `Ingested: ${data.stats?.projects || 0} projects, ${data.stats?.publications || 0} pubs, ${data.stats?.investigators || 0} PIs`,
      });
      toast.success("Knowledge base updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ingestion failed";
      setLastResult({ success: false, message });
      toast.error(message);
    } finally {
      setIsIngesting(false);
    }
  };

  const triggerWorkflowIngestion = async () => {
    setIsIngestingWorkflows(true);
    setLastResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neuromcp-ingest-workflows`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ action: "ingest" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Workflow ingestion failed");
      }

      setLastResult({
        success: true,
        message: `Ingested: ${data.stats?.workflows || 0} workflows, ${data.stats?.cross_project || 0} common pipelines`,
      });
      toast.success("Workflow knowledge base updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workflow ingestion failed";
      setLastResult({ success: false, message });
      toast.error(message);
    } finally {
      setIsIngestingWorkflows(false);
    }
  };

  return (
    <div className="border border-dashed border-muted-foreground/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 bg-muted/20">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4 shrink-0" />
          <span className="font-medium">Admin: Knowledge Base</span>
        </div>
        
        {lastResult && (
          <div className="flex items-center gap-1.5 text-xs">
            {lastResult.success ? (
              <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
            <span className={lastResult.success ? "text-primary" : "text-destructive"}>
              {lastResult.message}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerIngestion}
            disabled={isIngesting || isIngestingWorkflows}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isIngesting ? "animate-spin" : ""}`} />
            {isIngesting ? "Syncing..." : "Sync NIH Data"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerWorkflowIngestion}
            disabled={isIngesting || isIngestingWorkflows}
            className="gap-2"
          >
            <FlaskConical className={`h-3.5 w-3.5 ${isIngestingWorkflows ? "animate-spin" : ""}`} />
            {isIngestingWorkflows ? "Ingesting..." : "Sync Workflows"}
          </Button>
        </div>
      </div>
    </div>
  );
}
