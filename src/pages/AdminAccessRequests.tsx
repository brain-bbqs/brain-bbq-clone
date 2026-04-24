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
import { Loader2, Lock, Mail, Check, X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PageMeta } from "@/components/PageMeta";

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
}

export default function AdminAccessRequests() {
  const tier = useUserTier();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["access-requests"],
    enabled: tier.isAdmin,
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

  if (tier.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!tier.isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Admin access required</h1>
            <p className="text-sm text-muted-foreground mb-6">
              This page is restricted to Tier 1 administrators.
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
        <div className="font-medium text-foreground">{r.globus_name || "—"}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Mail className="h-3 w-3" /> {r.email}
        </div>
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
              onClick={() => setStatus(r.id, "approved", "Added to investigators roster")}
              disabled={busyId === r.id}
              title="Mark as approved (add the person to the investigators table separately, then they can sign in)"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Approve
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
          Sign-in attempts from people whose email isn't on the consortium roster. To grant
          access, add them to the investigators directory — the next time they sign in with
          Globus they'll get in automatically.
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
                Approving here only marks the request as handled. The person still needs to be
                added to the <code className="font-mono">investigators</code> table before they
                can sign in.
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