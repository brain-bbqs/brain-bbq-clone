import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SummaryField } from "../SummaryField";
import { SummaryTabs } from "../SummaryTabs";
import { useEntitySummary } from "@/contexts/EntitySummaryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useInvestigatorOwnership } from "@/hooks/useInvestigatorOwnership";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, FileText, User, Pencil, Check, X, UserCheck, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Editable inline field
function EditableText({ value, onSave, placeholder, type = "text" }: {
  value: string;
  onSave: (val: string) => void;
  placeholder: string;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <div className="group flex items-center gap-1.5 min-h-[28px]">
        {value ? (
          type === "url" ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              {value} <ExternalLink className="h-3 w-3" />
            </a>
          ) : type === "email" ? (
            <a href={`mailto:${value}`} className="text-primary hover:underline">{value}</a>
          ) : (
            <span>{value}</span>
          )
        ) : (
          <span className="text-muted-foreground italic text-xs">{placeholder}</span>
        )}
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="h-7 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") { onSave(draft); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <button onClick={() => { onSave(draft); setEditing(false); }} className="text-primary hover:text-primary/80">
        <Check className="h-4 w-4" />
      </button>
      <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const PROFILE_FIELDS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "orcid", label: "ORCID" },
  { key: "scholar_id", label: "Google Scholar" },
  { key: "organizations", label: "University" },
  { key: "skills", label: "Skills" },
  { key: "research_areas", label: "Research Areas" },
] as const;

function calcCompleteness(data: any): number {
  const checks = [
    !!data.name,
    !!data.email,
    !!data.orcid,
    !!data.scholar_id,
    data.organizations?.length > 0,
    data.skills?.length > 0,
    data.research_areas?.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function InvestigatorSummary({ id }: { id: string }) {
  const { open } = useEntitySummary();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOwner, isClaimed, claim, isClaiming } = useInvestigatorOwnership(id);

  const { data, isLoading } = useQuery({
    queryKey: ["entity-investigator", id],
    queryFn: async () => {
      const { data: inv, error } = await supabase
        .from("investigators")
        .select("*, resource_id, user_id")
        .eq("id", id)
        .single();
      if (error) throw error;

      // Get organizations
      const { data: orgLinks } = await supabase
        .from("investigator_organizations")
        .select("organization_id")
        .eq("investigator_id", id);
      const orgIds = orgLinks?.map((o) => o.organization_id) || [];
      const { data: orgs } = orgIds.length
        ? await supabase.from("organizations").select("id, name, resource_id").in("id", orgIds)
        : { data: [] };

      // Get grants
      const { data: grantLinks } = await supabase
        .from("grant_investigators")
        .select("grant_id, role")
        .eq("investigator_id", id);
      const grantIds = grantLinks?.map((g) => g.grant_id).filter(Boolean) || [];
      const { data: grants } = grantIds.length
        ? await supabase.from("grants").select("id, grant_number, title, award_amount, resource_id").in("id", grantIds)
        : { data: [] };

      // Get species from projects linked to these grants
      const { data: projects } = grantIds.length
        ? await supabase.from("projects").select("study_species, grant_id").in("grant_id", grantIds)
        : { data: [] };
      const speciesSet = new Set<string>();
      projects?.forEach((p) => p.study_species?.forEach((s: string) => speciesSet.add(s)));

      return {
        ...inv,
        organizations: orgs || [],
        grantLinks: grantLinks || [],
        grants: grants || [],
        species: Array.from(speciesSet),
      };
    },
  });

  // Can edit if: user owns this investigator (via user_id link) OR email matches (legacy)
  const canEdit = isOwner || (user && data?.email && user.email?.toLowerCase() === data.email.toLowerCase());
  // Show claim button if: user is logged in, investigator is unclaimed, and user doesn't own it
  const canClaim = user && !isClaimed && !isOwner && !canEdit;

  const handleClaim = async () => {
    try {
      await claim();
      toast({ title: "Profile claimed!", description: "You can now edit this investigator profile." });
      queryClient.invalidateQueries({ queryKey: ["entity-investigator", id] });
    } catch (e: any) {
      toast({ title: "Claim failed", description: e.message || "Could not claim this profile.", variant: "destructive" });
    }
  };

  const updateField = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: any }) => {
      const { error } = await supabase
        .from("investigators")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-investigator", id] });
      toast({ title: "Updated", description: "Profile field saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save. Try again.", variant: "destructive" });
    },
  });

  const handleSave = useCallback((field: string, value: string) => {
    updateField.mutate({ field, value });
  }, [updateField]);

  if (isLoading) return <SummaryLoading />;
  if (!data) return <p className="p-6 text-muted-foreground">Investigator not found.</p>;

  const completeness = calcCompleteness(data);

  const summaryContent = (
    <div className="space-y-1">
      {/* Completeness bar */}
      <div className="mb-4 p-3 rounded-lg border border-border bg-muted/20">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Profile Completeness</span>
          <span className={`text-xs font-bold ${completeness === 100 ? "text-primary" : completeness >= 70 ? "text-yellow-500" : "text-destructive"}`}>
            {completeness}%
          </span>
        </div>
        <Progress value={completeness} className="h-2" />
        {completeness < 100 && canEdit && (
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Fill in the missing fields below to complete your profile.
          </p>
        )}
      </div>

      {/* Name */}
      <SummaryField label="Name">
        {canEdit ? (
          <EditableText value={data.name} onSave={(v) => handleSave("name", v)} placeholder="Enter full name" />
        ) : (
          <span className="font-medium">{data.name}</span>
        )}
      </SummaryField>

      {/* Email */}
      <SummaryField label="Email">
        {canEdit ? (
          <EditableText value={data.email || ""} onSave={(v) => handleSave("email", v)} placeholder="Enter email address" type="email" />
        ) : data.email ? (
          <a href={`mailto:${data.email}`} className="text-primary hover:underline">{data.email}</a>
        ) : (
          <span className="text-muted-foreground italic text-xs">Not provided</span>
        )}
      </SummaryField>

      {/* ORCID */}
      <SummaryField label="ORCID">
        {canEdit ? (
          <EditableText value={data.orcid || ""} onSave={(v) => handleSave("orcid", v)} placeholder="e.g. 0000-0002-1234-5678" type="url" />
        ) : data.orcid ? (
          <a href={`https://orcid.org/${data.orcid}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
            {data.orcid} <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-muted-foreground italic text-xs">Not provided</span>
        )}
      </SummaryField>

      {/* Google Scholar */}
      <SummaryField label="Google Scholar">
        {canEdit ? (
          <EditableText value={data.scholar_id || ""} onSave={(v) => handleSave("scholar_id", v)} placeholder="Enter Google Scholar user ID" type="url" />
        ) : data.scholar_id ? (
          <a href={`https://scholar.google.com/citations?user=${data.scholar_id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
            View Profile <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-muted-foreground italic text-xs">Not provided</span>
        )}
      </SummaryField>

      {/* Institutions */}
      <SummaryField label="University">
        {data.organizations.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {data.organizations.map((org) => (
              <Badge
                key={org.id}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => open({ type: "organization", id: org.id, resourceId: org.resource_id || undefined, label: org.name })}
              >
                {org.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground italic text-xs">No institutions linked</span>
        )}
      </SummaryField>

      {/* Species */}
      <SummaryField label="Species">
        {data.species.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {data.species.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        ) : (
          <span className="text-muted-foreground italic text-xs">No species data</span>
        )}
      </SummaryField>

      {/* Skills */}
      <SummaryField label="Skills">
        {data.skills && data.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        ) : (
          <span className="text-muted-foreground italic text-xs">No skills listed</span>
        )}
      </SummaryField>

      {/* Research Areas */}
      <SummaryField label="Research Areas">
        {data.research_areas && data.research_areas.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {data.research_areas.map((a: string) => <Badge key={a} variant="secondary">{a}</Badge>)}
          </div>
        ) : (
          <span className="text-muted-foreground italic text-xs">No research areas listed</span>
        )}
      </SummaryField>

      {/* Grants */}
      {data.grants.length > 0 && (
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Grants ({data.grants.length})</h3>
          <div className="space-y-2">
            {data.grants.map((g) => {
              const link = data.grantLinks.find((gl: any) => gl.grant_id === g.id);
              return (
                <div
                  key={g.id}
                  className="rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => open({ type: "grant", id: g.id, resourceId: g.resource_id || undefined, label: g.grant_number })}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{link?.role === "pi" ? "PI" : "Co-PI"}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{g.grant_number}</span>
                  </div>
                  <p className="text-sm font-medium mt-1 line-clamp-2">{g.title}</p>
                  {g.award_amount && (
                    <p className="text-xs text-muted-foreground mt-1">${Number(g.award_amount).toLocaleString()}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {canEdit && (
        <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-4">
          ✏️ You can edit fields above by hovering and clicking the pencil icon.
        </p>
      )}
    </div>
  );

  return (
    <div>
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{data.name}</h2>
            <p className="text-sm text-muted-foreground">
              Investigator
              {data.organizations.length > 0 && ` · ${data.organizations.map((o) => o.name).join(", ")}`}
            </p>
          </div>
          {isOwner && (
            <Badge variant="outline" className="gap-1 text-xs bg-primary/10 text-primary border-primary/30">
              <UserCheck className="h-3 w-3" /> Your Profile
            </Badge>
          )}
          {canClaim && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleClaim} disabled={isClaiming}>
              <UserPlus className="h-3.5 w-3.5" />
              {isClaiming ? "Claiming..." : "This is me"}
            </Button>
          )}
          <div className="text-right">
            <span className={`text-lg font-bold ${completeness === 100 ? "text-primary" : completeness >= 70 ? "text-yellow-500" : "text-destructive"}`}>
              {completeness}%
            </span>
            <p className="text-[10px] text-muted-foreground">Complete</p>
          </div>
        </div>
      </div>
      <SummaryTabs tabs={[
        { id: "summary", label: "Summary", icon: <FileText className="h-3.5 w-3.5" />, content: summaryContent },
      ]} />
    </div>
  );
}

function SummaryLoading() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
