import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ExternalLink, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddProjectDialogProps {
  onProjectAdded: (grantNumber: string) => void;
}

type LookupResult = {
  status: "exists_locally" | "created_from_reporter" | "not_found";
  grant_number: string;
  grant?: {
    title?: string;
    abstract?: string;
    fiscal_year?: number;
    award_amount?: number;
    contact_pi?: string;
    institution?: string;
    nih_link?: string;
  } | null;
  populated_fields?: string[];
  missing_fields?: string[];
  reporter_seeded?: string[];
  message?: string;
};

const FIELD_LABELS: Record<string, string> = {
  study_species: "Species",
  keywords: "Keywords",
  website: "Website",
  data_types: "Data types",
  sensors: "Sensors / modalities",
  analysis_methods: "Analysis methods",
  analysis_types: "Analysis types",
};

export function AddProjectDialog({ onProjectAdded }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [grantInput, setGrantInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reset = () => { setGrantInput(""); setResult(null); setError(null); setLoading(false); };

  const submit = async () => {
    setError(null); setResult(null);
    const trimmed = grantInput.trim();
    if (!trimmed) { setError("Please enter a grant number."); return; }
    if (!/^[A-Za-z0-9\s-]{6,25}$/.test(trimmed)) {
      setError("Invalid format. Example: R34DA059510");
      return;
    }
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("add-project-by-grant", {
        body: { grant_number: trimmed },
      });
      if (fnErr) {
        // Edge function error often arrives via fnErr.context.json()
        let msg = fnErr.message || "Lookup failed";
        try {
          const ctx = (fnErr as any).context;
          if (ctx?.json) {
            const j = await ctx.json();
            if (j?.error) msg = j.error;
            if (j?.message) msg = j.message;
          }
        } catch { /* ignore */ }
        setError(msg);
        return;
      }
      setResult(data as LookupResult);

      // Refresh picker caches if we mutated the DB
      if ((data as LookupResult).status === "created_from_reporter") {
        queryClient.invalidateQueries({ queryKey: ["grants-for-picker"] });
        queryClient.invalidateQueries({ queryKey: ["projects-completeness"] });
        toast({
          title: "Project added",
          description: `${(data as LookupResult).grant_number} registered from NIH RePORTER.`,
        });
      }
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const continueToAssistant = () => {
    if (!result) return;
    onProjectAdded(result.grant_number);
    setOpen(false);
    setTimeout(reset, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTimeout(reset, 200); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add by NIH grant ID
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a project from NIH RePORTER</DialogTitle>
          <DialogDescription>
            Enter the NIH grant number. We'll check whether it's already in the consortium
            and pull title, PI, institution, abstract, and award details from RePORTER.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="grant-num" className="text-xs">NIH grant number</Label>
              <Input
                id="grant-num"
                placeholder="e.g. R34DA059510"
                value={grantInput}
                onChange={(e) => setGrantInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                disabled={loading}
                autoFocus
                maxLength={25}
              />
            </div>
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {result && result.status === "exists_locally" && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="space-y-2">
              <p className="text-sm font-medium">Already in the consortium</p>
              {result.grant?.title && <p className="text-xs text-muted-foreground">{result.grant.title}</p>}
              <FieldSummary populated={result.populated_fields ?? []} missing={result.missing_fields ?? []} />
            </AlertDescription>
          </Alert>
        )}

        {result && result.status === "created_from_reporter" && (
          <Alert>
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="space-y-2">
              <p className="text-sm font-medium">Registered from NIH RePORTER</p>
              {result.grant?.title && <p className="text-xs text-foreground">{result.grant.title}</p>}
              {result.grant?.contact_pi && (
                <p className="text-xs text-muted-foreground">
                  PI: {result.grant.contact_pi}
                  {result.grant.institution ? ` · ${result.grant.institution}` : ""}
                </p>
              )}
              {result.grant?.nih_link && (
                <a
                  href={result.grant.nih_link} target="_blank" rel="noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  View on RePORTER <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <div className="pt-1">
                <p className="text-[11px] text-muted-foreground mb-1">
                  Pre-filled from RePORTER: title, abstract, PI, institution, award.
                </p>
                <FieldSummary populated={[]} missing={result.missing_fields ?? []} />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {result && result.status === "not_found" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {result.message || "Grant number not found on NIH RePORTER."}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
              <Button onClick={submit} disabled={loading || !grantInput.trim()}>
                {loading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Looking up…</> : "Look up"}
              </Button>
            </>
          ) : result.status === "not_found" ? (
            <Button variant="outline" onClick={() => { setResult(null); }}>Try another</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => { setResult(null); setGrantInput(""); }}>Add another</Button>
              <Button onClick={continueToAssistant}>Open in assistant</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldSummary({ populated, missing }: { populated: string[]; missing: string[] }) {
  return (
    <div className="space-y-1.5">
      {populated.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[11px] text-muted-foreground mr-1">Populated:</span>
          {populated.map((f) => (
            <Badge key={f} variant="secondary" className="text-[10px]">{FIELD_LABELS[f] ?? f}</Badge>
          ))}
        </div>
      )}
      {missing.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[11px] text-muted-foreground mr-1">To complete:</span>
          {missing.map((f) => (
            <Badge key={f} variant="outline" className="text-[10px]">{FIELD_LABELS[f] ?? f}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
