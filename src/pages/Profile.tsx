import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Building2, FolderOpen, MessageSquare, History, LogOut, LogIn, Pencil, Check, X, Plus, Tag, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEntitySummary } from "@/contexts/EntitySummaryContext";
import { format } from "date-fns";
import { toast } from "sonner";

// Editable tag list component for skills / research areas
function EditableTagList({
  label,
  icon: Icon,
  items,
  onSave,
}: {
  label: string;
  icon: React.ElementType;
  items: string[];
  onSave: (updated: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const val = draft.trim();
    if (!val || items.includes(val)) { setDraft(""); return; }
    onSave([...items, val]);
    setDraft("");
    setAdding(false);
  };

  const removeItem = (item: string) => {
    onSave(items.filter((i) => i !== item));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        {!adding && (
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="gap-1 pr-1">
            {item}
            <button
              onClick={() => removeItem(item)}
              className="ml-0.5 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {items.length === 0 && !adding && (
          <span className="text-xs text-muted-foreground italic">None yet — click Add to get started</span>
        )}
      </div>
      {adding && (
        <div className="flex items-center gap-1.5 mt-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Add ${label.toLowerCase()}…`}
            className="h-7 text-sm flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") addItem();
              if (e.key === "Escape") { setAdding(false); setDraft(""); }
            }}
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={addItem}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAdding(false); setDraft(""); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, refetch } = useProfile();
  const navigate = useNavigate();
  const { open } = useEntitySummary();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setNameValue(profile?.full_name || "");
    setEditing(true);
  };

  const saveName = async () => {
    if (!user) return;
    setSaving(true);
    const trimmed = nameValue.trim();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: trimmed || null })
      .eq("id", user.id);
    if (error) {
      setSaving(false);
      toast.error("Failed to update name");
      return;
    }
    if (linkedInvestigator?.id && trimmed) {
      await supabase
        .from("investigators")
        .update({ name: trimmed })
        .eq("id", linkedInvestigator.id);
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    await refetch();
    setSaving(false);
    setEditing(false);
    toast.success("Name updated");
  };

  // Fetch linked investigator for this user (by email match)
  const { data: linkedInvestigator } = useQuery({
    queryKey: ["profile-investigator", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const { data } = await supabase
        .from("investigators")
        .select("id, skills, research_areas, email")
        .ilike("email", user!.email!)
        .maybeSingle();
      return data;
    },
  });

  // Mutation to update investigator skills / research_areas
  const updateInvestigator = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: string[] }) => {
      if (!linkedInvestigator) throw new Error("No linked investigator");
      const { error } = await supabase
        .from("investigators")
        .update({ [field]: value })
        .eq("id", linkedInvestigator.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-investigator", user?.email] });
      toast.success("Profile updated");
    },
    onError: () => {
      toast.error("Failed to update");
    },
  });

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

  // Fetch the user's own grants (via their linked investigator record)
  const { data: editableProjects = [] } = useQuery({
    queryKey: ["my-grants", linkedInvestigator?.id],
    enabled: !!linkedInvestigator?.id,
    queryFn: async () => {
      const { data: grantInvs } = await supabase
        .from("grant_investigators")
        .select("grant_id, role")
        .eq("investigator_id", linkedInvestigator!.id);
      if (!grantInvs?.length) return [];

      const grantIds = [...new Set(grantInvs.map((gi) => gi.grant_id).filter(Boolean))];
      if (!grantIds.length) return [];
      const { data: grants } = await supabase
        .from("grants")
        .select("id, grant_number, title, resource_id")
        .in("id", grantIds);
      const roleByGrant = new Map(grantInvs.map((gi) => [gi.grant_id, gi.role]));
      return (grants || []).map((g) => ({ ...g, role: roleByGrant.get(g.id) }));
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

  // Deep-link: scroll to #section once the page is rendered
  useEffect(() => {
    if (!user) return;
    const id = window.location.hash.replace(/^#/, "");
    if (!id) return;
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(t);
  }, [user, editableProjects.length, editHistory.length]);

  // Loading state
  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Signed-out state
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Sign in to view your profile</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Log in with your university email to access your projects, chat history, and metadata edits.
              </p>
            </div>
            <Button onClick={() => navigate("/auth")} className="mt-2">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openInvestigatorCard = async () => {
    if (!profile?.full_name) return;
    const lastName = profile.full_name.split(" ").pop() || "";
    const { data: inv } = await supabase
      .from("investigators")
      .select("id, resource_id")
      .ilike("name", `%${lastName}%`)
      .maybeSingle();
    if (inv) {
      open({ type: "investigator", id: inv.id, resourceId: inv.resource_id || undefined, label: profile.full_name });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Profile header */}
      <Card id="overview" className="scroll-mt-20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={openInvestigatorCard}
                className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
                title="View your investigator entity card"
              >
                <User className="h-7 w-7 text-primary" />
              </button>
              <div>
                {profileLoading ? (
                  <Skeleton className="h-6 w-48" />
                ) : editing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      placeholder="Enter your name"
                      className="h-8 w-56 text-sm"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && saveName()}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveName} disabled={saving}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openInvestigatorCard}
                        className="text-xl font-semibold text-primary hover:underline cursor-pointer"
                      >
                        {profile?.full_name || "No name set"}
                      </button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startEditing}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
            <button
              onClick={async () => {
                if (!profile?.organization_id) return;
                const { data: org } = await supabase
                  .from("organizations")
                  .select("id, resource_id")
                  .eq("id", profile.organization_id)
                  .maybeSingle();
                if (org) {
                  open({ type: "organization", id: org.id, resourceId: org.resource_id || undefined, label: orgName });
                }
              }}
              className="flex items-center gap-2 text-primary hover:underline cursor-pointer"
            >
              <Building2 className="h-4 w-4" />
              <span className="text-sm">{orgName}</span>
            </button>
          </CardContent>
        )}
      </Card>

      {/* Skills & Research Areas */}
      {linkedInvestigator && (
        <Card id="skills" className="scroll-mt-20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Skills &amp; Research Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <EditableTagList
              label="Skills"
              icon={Tag}
              items={linkedInvestigator.skills || []}
              onSave={(updated) => updateInvestigator.mutate({ field: "skills", value: updated })}
            />
            <EditableTagList
              label="Research Areas"
              icon={FlaskConical}
              items={linkedInvestigator.research_areas || []}
              onSave={(updated) => updateInvestigator.mutate({ field: "research_areas", value: updated })}
            />
          </CardContent>
        </Card>
      )}

      {/* Editable projects */}
      <Card id="projects" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Your Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editableProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">You're not listed on any grants yet.</p>
          ) : (
            <div className="space-y-2">
              {editableProjects.map((p: any) => (
                <button
                  key={p.id || p.grant_number}
                  onClick={() =>
                    open({ type: "grant", id: p.id, resourceId: p.resource_id || undefined, label: p.title || p.grant_number })
                  }
                  className="w-full flex items-center justify-between py-2 border-b border-border last:border-0 text-left hover:bg-accent/50 rounded px-2 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-primary hover:underline">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.grant_number}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {(() => {
                      switch (p.role) {
                        case "pi":
                        case "contact_pi": return "PI";
                        case "co_pi": return "Co-PI";
                        case "mpi": return "MPI";
                        case "collaborator": return "Collaborator";
                        case "trainee": return "Trainee";
                        case "staff": return "Staff";
                        default: return p.role || "Member";
                      }
                    })()}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit history / data provenance */}
      <Card id="edits" className="scroll-mt-20">
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