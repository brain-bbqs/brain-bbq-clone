import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Building2, FolderOpen, MessageSquare, History, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();

  // Fetch user's organization name
  const { data: orgName } = useQuery({
    queryKey: ["org-name", profile?.organization_id],
    enabled: !!profile?.organization_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", profile!.organization_id!)
        .maybeSingle();
      return data?.name || "Unknown";
    },
  });

  // Fetch editable projects (via org match)
  const { data: editableProjects = [] } = useQuery({
    queryKey: ["editable-projects", profile?.organization_id],
    enabled: !!profile?.organization_id,
    queryFn: async () => {
      // Get investigators at user's org
      const { data: invOrgs } = await supabase
        .from("investigator_organizations")
        .select("investigator_id")
        .eq("organization_id", profile!.organization_id!);
      if (!invOrgs?.length) return [];

      const invIds = invOrgs.map((io) => io.investigator_id);
      const { data: grantInvs } = await supabase
        .from("grant_investigators")
        .select("grant_number")
        .in("investigator_id", invIds);
      if (!grantInvs?.length) return [];

      const grantNumbers = [...new Set(grantInvs.map((gi) => gi.grant_number))];
      const { data: grants } = await supabase
        .from("grants")
        .select("grant_number, title")
        .in("grant_number", grantNumbers);
      return grants || [];
    },
  });

  // Fetch recent chat conversations
  const { data: chatHistory = [] } = useQuery({
    queryKey: ["user-chats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("id, title, updated_at")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Fetch recent edit history
  const { data: editHistory = [] } = useQuery({
    queryKey: ["user-edit-history", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const { data } = await supabase
        .from("edit_history")
        .select("id, grant_number, field_name, created_at")
        .eq("edited_by", user!.email!)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Profile header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                {profileLoading ? (
                  <Skeleton className="h-6 w-48" />
                ) : (
                  <>
                    <h1 className="text-xl font-semibold text-foreground">
                      {profile?.full_name || "No name set"}
                    </h1>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  </>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut().then(() => navigate("/auth"))}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardHeader>
        {orgName && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{orgName}</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Editable projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Your Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editableProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects linked to your organization yet.</p>
          ) : (
            <div className="space-y-2">
              {editableProjects.map((p: any) => (
                <div key={p.grant_number} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.grant_number}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Can Edit</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chatHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            <div className="space-y-2">
              {chatHistory.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <p className="text-sm text-foreground">{c.title || "Untitled conversation"}</p>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(c.updated_at), "MMM d, yyyy")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit history / data provenance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Data Provenance (Your Edits)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No edits recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {editHistory.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{e.field_name}</span> on {e.grant_number}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(e.created_at), "MMM d, yyyy HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
