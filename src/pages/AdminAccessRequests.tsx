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
import { Loader2, Lock, Mail, Check, X, UserPlus, AlertTriangle } from "lucide-react";
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

interface NameCollision {
  request: AccessRequest;
  existing: {
    id: string;
    name: string;
    email: string | null;
    secondary_emails: string[] | null;
  };
  email: string;
}

export default function AdminAccessRequests() {
  const tier = useUserTier();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [collision, setCollision] = useState<NameCollision | null>(null);

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

  const approveAndInvite = async (r: AccessRequest) => {
    setBusyId(r.id);
    try {
      const name = (r.full_name || r.globus_name || r.email.split("@")[0] || "Unknown").trim();
      const email = r.email.toLowerCase();

      // 1. Match by email (primary or secondary)
      const { data: existingByEmail } = await supabase
        .from("investigators")
        .select("id")
        .or(`email.ilike.${email},secondary_emails.cs.{${email}}`)
        .maybeSingle();

      let alreadyListed = !!existingByEmail;

      if (!existingByEmail) {
        // 2. Try insert; on name collision, prompt curator
        const { error: invErr } = await supabase
          .from("investigators")
          .insert({ name, email });

        if (invErr) {
          const isNameDup =
            invErr.code === "23505" &&
            (invErr.message?.includes("investigators_name_key") ||
              invErr.message?.toLowerCase().includes("name"));

          if (isNameDup) {
            const { data: nameMatch } = await supabase
              .from("investigators")
              .select("id, name, email, secondary_emails")
              .ilike("name", name)
              .maybeSingle();

            if (nameMatch) {
              setCollision({ request: r, existing: nameMatch, email });
              setBusyId(null);
              return;
            }
          }
          throw invErr;
        }
      }

      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          review_notes: alreadyListed
            ? "Already in investigators directory"
            : "Added to investigators directory",
        })
        .eq("id", r.id);
      if (error) throw error;

      toast.success(
        alreadyListed
          ? "Approved — already in investigators directory"
          : "Approved and invited. They can sign in via Globus now.",
      );
      queryClient.invalidateQueries({ queryKey: ["access-requests"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Failed to approve and invite");
    } finally {
      setBusyId(null);
    }
  };

  const linkAsSecondaryEmail = async () => {
    if (!collision) return;
    const { request, existing, email } = collision;
    setBusyId(request.id);
    try {
      const current = existing.secondary_emails ?? [];
      const next = Array.from(new Set([...current.map((e) => e.toLowerCase()), email]));

      const { error: updErr } = await supabase
        .from("investigators")
        .update({ secondary_emails: next })
        .eq("id", existing.id);
      if (updErr) throw updErr;

      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          review_notes: `Linked ${email} as secondary email on existing investigator "${existing.name}"`,
        })
        .eq("id", request.id);
      if (error) throw error;

      toast.success(`Linked ${email} to "${existing.name}". They can sign in via Globus now.`);
      setCollision(null);
      queryClient.invalidateQueries({ queryKey: ["access-requests"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Failed to link secondary email");
    } finally {
      setBusyId(null);
    }
  };

  const createWithDisambiguatedName = async () => {
    if (!collision) return;
    const { request, email } = collision;
    setBusyId(request.id);
    try {
      const baseName = (request.full_name || request.globus_name || email.split("@")[0]).trim();
      const institution = request.institution?.trim();
      const disambiguated = institution ? `${baseName} (${institution})` : `${baseName} (${email})`;

      const { error: invErr } = await supabase
        .from("investigators")
        .insert({ name: disambiguated, email });
      if (invErr) throw invErr;

      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          review_notes: `Added to investigators as "${disambiguated}" (name collision resolved)`,
        })
        .eq("id", request.id);
      if (error) throw error;

      toast.success(`Added as "${disambiguated}". They can sign in via Globus now.`);
      setCollision(null);
      queryClient.invalidateQueries({ queryKey: ["access-requests"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Failed to create investigator");
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
              variant="default"
              onClick={() => approveAndInvite(r)}
              disabled={busyId === r.id}
              title="Adds the person to the investigators directory and marks the request approved. They can then sign in via Globus."
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Approve & invite
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageMeta title="Access Requests — Admin" description="Review pending Globus sign-in attempts" />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Access Requests</h1>
        <p className="text-sm text-muted-foreground">
          Sign-up requests from the public form and Globus sign-in attempts from people whose
          email isn't on the consortium roster. "Approve &amp; invite" adds them to the
          investigators directory automatically — the next time they sign in via Globus, they'll
          get in.
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
                Click <strong>Approve &amp; invite</strong> to add the person to the{" "}
                <code className="font-mono">investigators</code> directory and mark the request
                approved. They can then sign in via Globus.
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>{decided.map((r) => renderRow(r, false))}</TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}