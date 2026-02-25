import { Card, CardContent } from "@/components/ui/card";
import { GitBranch } from "lucide-react";

export default function DataProvenanceDocs() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <GitBranch className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Provenance</h1>
          <p className="text-sm text-muted-foreground">How every metadata edit is tracked with full audit history</p>
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every metadata edit in the BBQS system is tracked with full provenance. When a user (or the AI assistant)
          modifies a project's metadata field, the system records:
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {[
            { label: "Who", desc: "The authenticated user's email or 'ai-assistant'" },
            { label: "What", desc: "The field name, old value, and new value (JSON diff)" },
            { label: "When", desc: "Timestamp of the change" },
            { label: "Context", desc: "Chat context if the edit was made via AI conversation" },
          ].map((item) => (
            <Card key={item.label} className="bg-secondary/30">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
          <p className="font-medium text-foreground">How it works:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>User edits a field via the BBQS Assistant chat or metadata table</li>
            <li>The frontend calls <code className="bg-muted px-1 rounded text-xs">useEditHistory.logChanges()</code> after a successful commit</li>
            <li>A row is inserted into the <code className="bg-muted px-1 rounded text-xs">edit_history</code> table with the diff</li>
            <li>Supabase Realtime broadcasts the insert to all connected clients</li>
            <li>The Data Provenance page and Profile page both query this table for audit trails</li>
          </ol>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p className="font-medium text-foreground mb-2">Database schema:</p>
          <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre">{`edit_history
├── id            uuid (PK)
├── project_id    uuid (FK → projects)
├── grant_number  text
├── field_name    text
├── old_value     jsonb
├── new_value     jsonb
├── edited_by     text (user email)
├── chat_context  jsonb (AI conversation context)
└── created_at    timestamptz`}</pre>
        </div>
      </div>
    </div>
  );
}
