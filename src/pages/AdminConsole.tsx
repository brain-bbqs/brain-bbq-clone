import { useSearchParams, Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageMeta } from "@/components/PageMeta";
import { SystemAlertsBanner } from "@/components/admin/SystemAlertsBanner";
import { ShieldCheck, UserPlus, AlertTriangle, FolderPlus, Wallet, Sparkles, Activity, Network, Tags, FileSearch, Radar } from "lucide-react";
import AdminUsers from "./AdminUsers";
import AdminAccessRequests from "./AdminAccessRequests";
import { AddProjectByGrantDialog } from "@/components/admin/AddProjectByGrantDialog";
import { BudgetsPanel } from "@/components/admin/BudgetsPanel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const VALID_TABS = ["alerts", "budgets", "users", "access-requests", "add-project", "harvester"] as const;
type TabKey = (typeof VALID_TABS)[number];

export default function AdminConsole() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") as TabKey | null;
  const tab: TabKey = requested && VALID_TABS.includes(requested) ? requested : "alerts";

  const onChange = (v: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", v);
    setParams(next, { replace: true });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageMeta title="Admin Console" description="System alerts, user roles, and access requests" />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Admin Console</h1>
        <p className="text-sm text-muted-foreground">
          Centralized administration: monitor system alerts, manage user tiers, and review access requests.
        </p>
      </div>

      <Tabs value={tab} onValueChange={onChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="alerts" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            System Alerts
          </TabsTrigger>
          <TabsTrigger value="budgets" className="gap-1.5">
            <Wallet className="h-4 w-4" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            User Roles
          </TabsTrigger>
          <TabsTrigger value="access-requests" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Access Requests
          </TabsTrigger>
          <TabsTrigger value="add-project" className="gap-1.5">
            <FolderPlus className="h-4 w-4" />
            Add Project
          </TabsTrigger>
          <TabsTrigger value="harvester" className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            Harvester
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-0">
          <SystemAlertsBanner />
          <p className="text-sm text-muted-foreground mt-4">
            Active alerts are shown above. When there are no unresolved alerts, this section is empty.
          </p>
        </TabsContent>

        <TabsContent value="budgets" className="mt-0">
          <BudgetsPanel />
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <AdminUsers embedded />
        </TabsContent>

        <TabsContent value="access-requests" className="mt-0">
          <AdminAccessRequests embedded />
        </TabsContent>

        <TabsContent value="add-project" className="mt-0">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Add a project by NIH award ID</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Look up an NIH RePORTER award number (e.g. <code className="text-xs">R34DA059510</code>)
              and seed the grant, contact PI, and institution into BBQS. Project questionnaire fields
              remain empty for the team to complete.
            </p>
            <AddProjectByGrantDialog
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add project from RePORTER
                </Button>
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="harvester" className="mt-0">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Knowledge graph harvester</h2>
              <p className="text-sm text-muted-foreground">
                Admin shortcuts for the multi-hop methods harvester. All links open in a new tab so you can keep this console handy.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { to: "/admin/harvester", icon: Sparkles, title: "Harvester control", desc: "Kick off batch runs, manage the queue, pause/resume the background tick." },
                { to: "/admin/kg-live", icon: Activity, title: "Live graph", desc: "Real-time force-directed view of hops as the harvester discovers nodes." },
                { to: "/admin/kg-heatmap", icon: Network, title: "KG heatmap", desc: "Grants × hardware, orgs × device-class, translational bridge orgs." },
                { to: "/admin/kg-curate", icon: Tags, title: "Curate keywords", desc: "Approve novel terms, merge synonyms, fix relationships." },
                { to: "/grants/methods-evidence", icon: FileSearch, title: "Methods evidence", desc: "Browse extracted device / metric / setting evidence rows." },
                { to: "/admin/access-requests", icon: Radar, title: "Access requests", desc: "Jump straight to pending consortium access requests." },
              ].map(({ to, icon: Icon, title, desc }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex gap-3 rounded-md border border-border bg-background p-3 hover:border-primary hover:bg-accent/40 transition-colors"
                >
                  <Icon className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground group-hover:text-primary">{title}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                    <div className="text-[10px] font-mono text-muted-foreground/70 mt-1">{to}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}