import { useState } from "react";
import { Database, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AdminPanelProps {
  accessToken: string;
}

export function AdminPanel({ accessToken }: AdminPanelProps) {
  const [isIngesting, setIsIngesting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const triggerIngestion = async () => {
    setIsIngesting(true);
    setLastResult(null);

    try {
      const response = await fetch(
        `https://vpexxhfpvghlejljwpvt.supabase.co/functions/v1/neuromcp-ingest`,
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
        message: `Ingested ${data.ingested || 0} items`,
      });
      toast.success(`Knowledge base updated: ${data.ingested || 0} items ingested`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ingestion failed";
      setLastResult({ success: false, message });
      toast.error(message);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="border border-dashed border-muted-foreground/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 bg-muted/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4 shrink-0" />
          <span className="font-medium">Admin: Knowledge Base</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
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
          <Button
            variant="outline"
            size="sm"
            onClick={triggerIngestion}
            disabled={isIngesting}
            className="gap-2 w-full sm:w-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isIngesting ? "animate-spin" : ""}`} />
            {isIngesting ? "Ingesting..." : "Sync NIH Data"}
          </Button>
        </div>
      </div>
    </div>
  );
}
