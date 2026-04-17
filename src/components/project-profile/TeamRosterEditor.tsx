import { useState } from "react";
import { Users, X, Search, UserPlus, Loader2 } from "lucide-react";
import { useTeamRoster, useInvestigatorSearch } from "@/hooks/useTeamRoster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ROLES = [
  { value: "pi", label: "PI (Lead/Contact)" },
  { value: "co_pi", label: "Co-PI" },
  { value: "mpi", label: "MPI" },
  { value: "collaborator", label: "Collaborator" },
  { value: "trainee", label: "Trainee" },
  { value: "staff", label: "Staff" },
];

const ROLE_LABELS: Record<string, string> = {
  pi: "PI", co_pi: "Co-PI", mpi: "MPI", collaborator: "Collab", trainee: "Trainee", staff: "Staff",
};

interface Props {
  grantId: string;
  canEdit: boolean;
}

export function TeamRosterEditor({ grantId, canEdit }: Props) {
  const { members, isLoading, addMember, updateRole, removeMember, isMutating } = useTeamRoster(grantId);
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingRole, setPendingRole] = useState("co_pi");
  const { data: searchResults = [] } = useInvestigatorSearch(query);

  const memberIds = new Set(members.map((m) => m.investigator_id));
  const filteredResults = searchResults.filter((r) => !memberIds.has(r.id));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Team Members</h3>
          <span className="text-xs text-muted-foreground">({members.length})</span>
        </div>
        {canEdit && (
          <Button
            size="sm"
            variant={showAdd ? "ghost" : "default"}
            onClick={() => { setShowAdd(!showAdd); setQuery(""); }}
          >
            {showAdd ? "Cancel" : (<><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add member</>)}
          </Button>
        )}
      </div>

      {/* Add member panel */}
      {showAdd && canEdit && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border space-y-2">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search investigators by name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-sm"
            />
            <Select value={pendingRole} onValueChange={setPendingRole}>
              <SelectTrigger className="w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {query.length >= 2 && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredResults.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2 py-1.5">No matches.</p>
              ) : (
                filteredResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      addMember({ investigatorId: r.id, role: pendingRole });
                      setQuery("");
                      setShowAdd(false);
                    }}
                    disabled={isMutating}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm flex items-center justify-between"
                    type="button"
                  >
                    <span>
                      <span className="font-medium">{r.name}</span>
                      {r.email && <span className="text-muted-foreground ml-2 text-xs">{r.email}</span>}
                    </span>
                    <UserPlus className="h-3.5 w-3.5 text-primary" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Roster list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading roster…
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No team members linked to this grant.</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.investigator_id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-background hover:bg-accent/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                {m.email && (
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                )}
              </div>
              {canEdit ? (
                <Select
                  value={m.role}
                  onValueChange={(role) => updateRole({ investigatorId: m.investigator_id, role })}
                  disabled={isMutating}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="text-xs">{ROLE_LABELS[m.role] || m.role}</Badge>
              )}
              {canEdit && (
                <button
                  onClick={() => {
                    if (confirm(`Remove ${m.name} from this project?`)) {
                      removeMember(m.investigator_id);
                    }
                  }}
                  disabled={isMutating}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remove from project"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
