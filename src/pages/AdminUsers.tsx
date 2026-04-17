import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Lock, Shield, ShieldCheck, User as UserIcon, Loader2, Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserTier } from "@/hooks/useUserTier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PageMeta } from "@/components/PageMeta";

type AssignableRole = "admin" | "curator" | "member";

interface SignedInUserRow {
  kind: "signed_in";
  id: string; // auth user id
  email: string;
  full_name: string | null;
  created_at: string;
  role: AssignableRole;
  is_linked_investigator: boolean;
}

interface InvitedInvestigatorRow {
  kind: "invited";
  id: string; // investigator id
  email: string | null;
  full_name: string;
  research_areas: string[] | null;
}

const TIER_META: Record<AssignableRole, { label: string; tier: number; color: string; icon: any }> = {
  admin:   { label: "Admin",   tier: 1, color: "bg-destructive/10 text-destructive border-destructive/30", icon: ShieldCheck },
  curator: { label: "Curator", tier: 2, color: "bg-primary/10 text-primary border-primary/30",             icon: Shield },
  member:  { label: "Member",  tier: 3, color: "bg-muted text-muted-foreground border-border",             icon: UserIcon },
};

export default function AdminUsers() {
  const tierInfo = useUserTier();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-list-v2"],
    enabled: tierInfo.isAdmin,
    queryFn: async () => {
      const [profilesRes, rolesRes, investigatorsRes] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, created_at"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("investigators").select("id, name, email, user_id, research_areas"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (investigatorsRes.error) throw investigatorsRes.error;

      const roleMap = new Map<string, AssignableRole>();
      (rolesRes.data ?? []).forEach((r: any) => {
        const existing = roleMap.get(r.user_id);
        if (!existing || r.role === "admin" || (r.role === "curator" && existing === "member")) {
          roleMap.set(r.user_id, r.role);
        }
      });

      const linkedUserIds = new Set(
        (investigatorsRes.data ?? [])
          .filter((i: any) => i.user_id)
          .map((i: any) => i.user_id),
      );

      const signedIn: SignedInUserRow[] = (profilesRes.data ?? []).map((p: any) => ({
        kind: "signed_in",
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        created_at: p.created_at,
        role: roleMap.get(p.id) ?? "member",
        is_linked_investigator: linkedUserIds.has(p.id),
      }));

      const invited: InvitedInvestigatorRow[] = (investigatorsRes.data ?? [])
        .filter((i: any) => !i.user_id)
        .map((i: any) => ({
          kind: "invited",
          id: i.id,
          email: i.email,
          full_name: i.name,
          research_areas: i.research_areas,
        }));

      return { signedIn, invited };
    },
  });

  const signedIn = data?.signedIn ?? [];
  const invited = data?.invited ?? [];

  const filteredSignedIn = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return signedIn;
    return signedIn.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.full_name ?? "").toLowerCase().includes(q),
    );
  }, [signedIn, search]);

  const filteredInvited = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invited;
    return invited.filter(
      (u) =>
        (u.email ?? "").toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q),
    );
  }, [invited, search]);

  const handleRoleChange = async (userId: string, newRole: AssignableRole) => {
    setSavingId(userId);
    try {
      // Remove existing admin/curator rows for this user
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .in("role", ["admin", "curator"]);

      // Always ensure a 'member' row exists (Tier 3 baseline)
      await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: "member" }, { onConflict: "user_id,role" });

      // Add elevated role if needed
      if (newRole !== "member") {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }

      toast.success(`Role updated to ${TIER_META[newRole].label}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users-list-v2"] });
      queryClient.invalidateQueries({ queryKey: ["user-tier"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  // ---- Access gate ----
  if (tierInfo.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!tierInfo.isAdmin) {
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

  // ---- Counts ----
  const counts = signedIn.reduce(
    (acc, u) => ({ ...acc, [u.role]: (acc[u.role] ?? 0) + 1 }),
    {} as Record<AssignableRole, number>,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageMeta title="User Roles — Admin" description="Manage user access tiers" />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">User Roles</h1>
        <p className="text-sm text-muted-foreground">
          Assign access tiers across the consortium. Changes take effect immediately.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(["admin", "curator", "member"] as AssignableRole[]).map((r) => {
          const meta = TIER_META[r];
          const Icon = meta.icon;
          return (
            <Card key={r}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tier {meta.tier} — {meta.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{counts[r] ?? 0}</div>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Invited (not signed in)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invited.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      <Tabs defaultValue="signed_in">
        <TabsList>
          <TabsTrigger value="signed_in">
            Signed-in users ({filteredSignedIn.length})
          </TabsTrigger>
          <TabsTrigger value="invited">
            Invited investigators ({filteredInvited.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signed_in">
          <Card>
            <CardHeader>
              <CardTitle>Signed-in users</CardTitle>
              <CardDescription>
                Anyone who has logged in via Globus. Every user is granted Tier 3 (Member) by default.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Investigator linked</TableHead>
                        <TableHead>Current tier</TableHead>
                        <TableHead className="text-right">Change role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSignedIn.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No users found.
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredSignedIn.map((u) => {
                        const meta = TIER_META[u.role];
                        return (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="font-medium text-foreground">
                                {u.full_name || "—"}
                              </div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </TableCell>
                            <TableCell>
                              {u.is_linked_investigator ? (
                                <Badge variant="secondary">Linked</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Unlinked
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={meta.color}>
                                T{meta.tier} · {meta.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center gap-2">
                                {savingId === u.id && (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                                <Select
                                  value={u.role}
                                  onValueChange={(v) => handleRoleChange(u.id, v as AssignableRole)}
                                  disabled={savingId === u.id}
                                >
                                  <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Tier 1 — Admin</SelectItem>
                                    <SelectItem value="curator">Tier 2 — Curator</SelectItem>
                                    <SelectItem value="member">Tier 3 — Member</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invited">
          <Card>
            <CardHeader>
              <CardTitle>Invited investigators</CardTitle>
              <CardDescription>
                Consortium members in the investigators directory who haven't yet signed in via Globus.
                They will be auto-linked the first time they log in with a matching email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvited.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No invited investigators found.
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredInvited.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium text-foreground">
                            {u.full_name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.email || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-muted-foreground">
                              Awaiting first sign-in
                            </Badge>
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

      <p className="text-xs text-muted-foreground mt-6">
        Every authenticated user is automatically granted Tier 3 (Member) on first sign-in. Invited
        investigators appear here once added to the <code className="font-mono">investigators</code>{" "}
        directory and will be auto-linked to their auth account on their first Globus login.
      </p>
    </div>
  );
}
