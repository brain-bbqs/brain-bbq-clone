import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserTier } from "@/hooks/useUserTier";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Lock, Mail, Check, X, UserPlus, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PageMeta } from "@/components/PageMeta";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Status = "pending" | "approved" | "dismissed";

// The onboarding agent (shares the *.brain-bbqs.org Supabase session cookie, so an
// admin clicking through lands already signed in). `?ask=<text>` pre-fills its
// composer — see the agent route's validateSearch.
const AGENT_URL = "https://agent.brain-bbqs.org";

interface AccessRequest {
  id: string;
  email: string;
  globus_name: string | null;
  globus_subject: string | null;
  message: string | null;
  status: Status;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  full_name?: string | null;
  institution?: string | null;
}

interface AdminAccessRequestsProps {
  embedded?: boolean;
}

export default function AdminAccessRequests({ embedded = false }: AdminAccessRequestsProps = {}) {
  const tier = useUserTier();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AccessRequest | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["access-requests"],
    enabled: tier.isCurator,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AccessRequest[];
    },
  });

  const sendApprovalEmail = async (to: string, name: string, note?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-access-approved-email",
        { body: { to, name, note } },
      );
      if (error || (data && data.success === false)) {
        console.error("Approval email failed:", error || data?.error);
        toast.warning(
          "Approved, but notification email failed to send. Please contact the requester manually.",
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error("Approval email exception:", err);
      toast.warning(
        "Approved, but notification email failed to send. Please contact the requester manually.",
      );
      return false;
    }
  };

  const setStatus = async (id: string, next: Status, notes?: string) => {
    setBusyId(id);
    try {
      const { error } = await supabase
        .from("access_requests")
        .update({
          status: next,
          reviewed_at: new Date().toISOString(),
          review_notes: notes ?? null,
        })
        .eq("id", id);
      if (error) throw error;
      toast.success(next === "approved" ? "Marked as approved" : "Dismissed");
      queryClient.invalidateQueries({ queryKey: ["access-requests"] });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update request");
    } finally {
      setBusyId(null);
    }
  };

  // "Approve" — LIGHTWEIGHT site access. Not everyone who signs in is a consortium
  // member; some just need to browse the KG site as a tier-3 member via their Globus
  // account. The Globus gate (email_is_consortium_member) only lets an email in if it
  // exists on an investigators record, so we create a MINIMAL one (name+email). This
  // is deliberately NOT onboarding: no mailing lists, no welcome email, no grant/role
  // — that's "Approve & onboard". Tier defaults to member (tier 3).
  const approveForBrowsing = async (r: AccessRequest) => {
    setBusyId(r.id);
    try {
      const name = (r.full_name || r.globus_name || r.email.split("@")[0] || "Unknown").trim();
      const email = r.email.toLowerCase();

      // Already on the roster (primary OR secondary email)? Then they can already sign in.
      const { data: existingByEmail } = await supabase
        .from("investigators")
        .select("id, name")
        .or(`email.ilike.${email},secondary_emails.cs.{${email}}`)
        .maybeSingle();

      let listedName = (existingByEmail?.name as string | undefined) ?? name;

      if (!existingByEmail) {
        const { error: invErr } = await supabase.from("investigators").insert({ name, email });
        if (invErr) {
          // Unique-NAME collision (a different person shares the name): disambiguate
          // with the email so the browse record is still created — no dialog, and
          // "Approve & onboard" can reconcile names later if needed.
          const isNameDup = invErr.code === "23505" && !(invErr.message ?? "").toLowerCase().includes("email");
          if (isNameDup) {
            const disambiguated = `${name} (${email})`;
            const { error: retryErr } = await supabase.from("investigators").insert({ name: disambiguated, email });
            if (retryErr) throw retryErr;
            listedName = disambiguated;
          } else {
            throw invErr;
          }
        }
      }

      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          review_notes: existingByEmail
            ? `Site access — already listed as "${listedName}" (tier 3)`
            : `Site access granted as "${listedName}" — tier 3, browse-only (not onboarded)`,
        })
        .eq("id", r.id);
      if (error) throw error;

      toast.success(`Approved for site access — ${listedName} can sign in via Globus (tier 3).`);
      await sendApprovalEmail(
        email,
        listedName,
        "You've been granted access to the BBQS knowledge graph site — sign in with your Globus account to browse.",
      );
      queryClient.invalidateQueries({ queryKey: ["access-requests"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Failed to approve site access");
    } finally {
      setBusyId(null);
    }
  };

  // "Approve & onboard" — FULL provisioning. Always hands off to the agent's onboarding
  // workflow (the single provisioning path: mailing lists + welcome + role), which
  // live-checks/reconciles an existing member and auto-clears this pending request on
  // completion (agent workflow.ts Step 1b). No DB write here — onboarding owns it.
  const approveAndOnboard = (r: AccessRequest) => {
    const name = (r.full_name || r.globus_name || r.email.split("@")[0] || "Unknown").trim();
    const email = r.email.toLowerCase();
    const url = `${AGENT_URL}/?ask=${encodeURIComponent(`Onboard ${name} (${email})`)}`;
    window.open(url, "_blank", "noopener");
    toast.info(
      "Opening full onboarding in the agent — complete the workflow there. This request clears automatically once they're provisioned.",
    );
  };

  const revokeAccess = async (r: AccessRequest) => {
    setBusyId(r.id);
    try {
      const email = r.email.toLowerCase();

      // Look up the investigator linked to this email (primary or secondary)
      const { data: inv } = await supabase
        .from("investigators")
        .select("id, name, user_id, secondary_emails")
        .or(`email.ilike.${email},secondary_emails.cs.{${email}}`)
        .maybeSingle();

      let note = "Access revoked by curator.";

      if (inv) {
        if (inv.user_id) {
          // They've signed in — don't delete the investigator record, just note it.
          note += ` Investigator "${inv.name}" remains in the directory (already signed in via Globus). Remove their user role separately if needed.`;
        } else {
          // Not yet linked to an auth user — safe to clean up.
          const isPrimary = true; // we don't know which matched; check secondary
          const secondaries = (inv.secondary_emails ?? []).map((e) => e.toLowerCase());
          if (secondaries.includes(email)) {
            // Remove just the secondary email
            const next = secondaries.filter((e) => e !== email);
            const { error: updErr } = await supabase
              .from("investigators")
              .update({ secondary_emails: next })
              .eq("id", inv.id);
            if (updErr) throw updErr;
            note += ` Removed ${email} from secondary emails on "${inv.name}".`;
          } else {
            // Email is the primary — delete the investigator (only allowed if user_id is null)
            const { error: delErr } = await supabase
              .from("investigators")
              .delete()
              .eq("id", inv.id);
            if (delErr) throw delErr;
            note += ` Removed "${inv.name}" from the investigators directory.`;
          }
        }
      } else {
        note += " No matching investigator entry found.";
      }

      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "dismissed",
          reviewed_at: new Date().toISOString(),
          review_notes: note,
        })
        .eq("id", r.id);
      if (error) throw error;

      toast.success("Access revoked");
      setRevokeTarget(null);
      queryClient.invalidateQueries({ queryKey: ["access-requests"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Failed to revoke access");
    } finally {
      setBusyId(null);
    }
  };

  if (tier.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!tier.isCurator) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Reviewer access required</h1>
            <p className="text-sm text-muted-foreground mb-6">
              This page is restricted to Tier 1 admins and Tier 2 curators.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  const renderRow = (r: AccessRequest, withActions: boolean) => (
    <TableRow key={r.id}>
      <TableCell>
        <div className="font-medium text-foreground">
          {r.full_name || r.globus_name || "—"}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Mail className="h-3 w-3" /> {r.email}
        </div>
        {r.institution && (
          <div className="text-xs text-muted-foreground mt-1">{r.institution}</div>
        )}
        {r.message && (
          <div className="text-xs text-muted-foreground mt-1 italic line-clamp-2 max-w-md">
            "{r.message}"
          </div>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(r.created_at), "MMM d, yyyy h:mm a")}
      </TableCell>
      <TableCell>
        {r.status === "pending" ? (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Pending
          </Badge>
        ) : r.status === "approved" ? (
          <Badge variant="secondary">
            Approved
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Dismissed
          </Badge>
        )}
      </TableCell>
      {withActions && (
        <TableCell className="text-right">
          <div className="inline-flex items-center gap-2">
            {busyId === r.id && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => approveForBrowsing(r)}
              disabled={busyId === r.id}
              title="Grant lightweight site access: creates a minimal record so they can sign in via Globus and browse the site as a tier-3 member. Does NOT run consortium onboarding (no mailing lists / welcome / role)."
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => approveAndOnboard(r)}
              disabled={busyId === r.id}
              title="Open the onboarding agent pre-filled to FULLY provision them (mailing lists + welcome + role). This request clears automatically when onboarding completes."
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Approve & onboard
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStatus(r.id, "dismissed")}
              disabled={busyId === r.id}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Dismiss
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );

  return (
    <div className={embedded ? "" : "max-w-6xl mx-auto px-4 py-8"}>
      {!embedded && (
        <PageMeta title="Access Requests — Admin" description="Review pending Globus sign-in attempts" />
      )}

      <div className="mb-6">
        {!embedded && (
          <h1 className="text-3xl font-bold text-foreground mb-1">Access Requests</h1>
        )}
        <p className="text-sm text-muted-foreground">
          Sign-up requests from the public form and Globus sign-in attempts from people whose
          email isn't on the consortium roster. <strong>Approve</strong> grants lightweight
          tier-3 site access (they can sign in via Globus and browse — for people who aren't
          consortium members). <strong>Approve &amp; onboard</strong> opens the agent to fully
          provision a consortium member (mailing lists, welcome email, role) and auto-clears the
          request when done.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dismissed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === "dismissed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="decided">Decided ({decided.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Awaiting decision
              </CardTitle>
              <CardDescription>
                <strong>Approve</strong> = lightweight tier-3 site access (Globus sign-in +
                browse; for non–consortium-members). <strong>Approve &amp; onboard</strong>
                opens the agent pre-filled with{" "}
                <code className="font-mono">Onboard &lt;name&gt; (&lt;email&gt;)</code> to fully
                provision a consortium member; that request clears automatically on completion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : pending.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No pending requests. ✨
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Person</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{pending.map((r) => renderRow(r, true))}</TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decided">
          <Card>
            <CardHeader>
              <CardTitle>Decided requests</CardTitle>
            </CardHeader>
            <CardContent>
              {decided.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No decided requests yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Person</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {decided.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="font-medium text-foreground">
                              {r.full_name || r.globus_name || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {r.email}
                            </div>
                            {r.institution && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {r.institution}
                              </div>
                            )}
                            {r.review_notes && (
                              <div className="text-xs text-muted-foreground mt-1 italic line-clamp-2 max-w-md">
                                {r.review_notes}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(r.created_at), "MMM d, yyyy h:mm a")}
                          </TableCell>
                          <TableCell>
                            {r.status === "approved" ? (
                              <Badge variant="secondary">Approved</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Dismissed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.status === "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRevokeTarget(r)}
                                disabled={busyId === r.id}
                              >
                                {busyId === r.id ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                )}
                                Revoke
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Revoke access?
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <span className="block">
                This will mark{" "}
                <strong>{revokeTarget?.full_name || revokeTarget?.globus_name || revokeTarget?.email}</strong>{" "}
                as dismissed and remove their invite from the investigators directory if they
                haven't signed in yet.
              </span>
              <span className="block text-xs text-muted-foreground">
                If the user has already signed in via Globus, their investigator profile is kept
                and you must remove their user role manually.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => revokeTarget && revokeAccess(revokeTarget)}
              disabled={busyId === revokeTarget?.id}
            >
              {busyId === revokeTarget?.id && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Revoke access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}