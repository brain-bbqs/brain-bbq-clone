import { useState } from "react";
import { Loader2, Plus, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddProjectByGrantDialogProps {
  /** Optional custom trigger; defaults to an outline "+ Add Project" button. */
  trigger?: React.ReactNode;
  /** Called when a grant is successfully added or already exists. */
  onAdded?: (grantNumber: string) => void;
}

type AddResult = {
  ok: boolean;
  status?: "exists_locally" | "created_from_reporter" | "not_found";
  grant_number?: string;
  grant?: {
    title?: string;
    contact_pi?: string;
    institution?: string;
    fiscal_year?: number;
    award_amount?: number;
    nih_link?: string;
  } | null;
  populated_fields?: string[];
  missing_fields?: string[];
  reporter_seeded?: string[];
  message?: string;
  error?: string;
};

export function AddProjectByGrantDialog({ trigger, onAdded }: AddProjectByGrantDialogProps) {
  const [open, setOpen] = useState(false);
  const [grantNumber, setGrantNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AddResult | null>(null);
  const { toast } = useToast();

  const reset = () => {
    setGrantNumber("");
    setResult(null);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = grantNumber.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleaned) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("add-project-by-grant", {
        body: { grant_number: cleaned },
      });
      if (error) throw error;
      const r = data as AddResult;
      setResult(r);
      if (r.ok && r.status !== "not_found") {
        toast({
          title: r.status === "created_from_reporter" ? "Project added" : "Project already exists",
          description: cleaned,
        });
        onAdded?.(cleaned);
      } else if (!r.ok) {
        toast({ title: "Couldn't add project", description: r.error || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      const msg = err?.message || "Request failed";
      setResult({ ok: false, error: msg });
      toast({ title: "Couldn't add project", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add project from NIH RePORTER</DialogTitle>
          <DialogDescription>
            Enter an NIH award number (e.g. <code className="text-xs">R34DA059510</code>). We'll
            look it up on RePORTER and seed the grant, contact PI, and institution.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="grant-number">Grant number</Label>
            <Input
              id="grant-number"
              value={grantNumber}
              onChange={(e) => setGrantNumber(e.target.value)}
              placeholder="R34DA059510"
              autoFocus
              autoComplete="off"
              disabled={loading}
            />
          </div>

          {result && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              {result.status === "created_from_reporter" && result.grant && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Added {result.grant_number}
                  </div>
                  <p className="text-foreground">{result.grant.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {result.grant.contact_pi} · {result.grant.institution} · FY{result.grant.fiscal_year}
                  </p>
                  {result.grant.nih_link && (
                    <a
                      href={result.grant.nih_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View on RePORTER <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
              {result.status === "exists_locally" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-blue-600 font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Already in BBQS
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.grant_number} is already registered.
                    {result.missing_fields?.length
                      ? ` ${result.missing_fields.length} questionnaire field(s) still empty.`
                      : ""}
                  </p>
                </div>
              )}
              {result.status === "not_found" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-600 font-medium">
                    <AlertCircle className="h-4 w-4" /> Not found on RePORTER
                  </div>
                  <p className="text-xs text-muted-foreground">{result.message}</p>
                </div>
              )}
              {!result.ok && result.error && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-destructive font-medium">
                    <AlertCircle className="h-4 w-4" /> Error
                  </div>
                  <p className="text-xs text-muted-foreground">{result.error}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Close
            </Button>
            <Button type="submit" disabled={loading || !grantNumber.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Looking up…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}