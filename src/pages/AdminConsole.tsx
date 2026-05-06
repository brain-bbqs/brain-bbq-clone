import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageMeta } from "@/components/PageMeta";
import { SystemAlertsBanner } from "@/components/admin/SystemAlertsBanner";
import { ShieldCheck, UserPlus, AlertTriangle } from "lucide-react";
import AdminUsers from "./AdminUsers";
import AdminAccessRequests from "./AdminAccessRequests";

const VALID_TABS = ["alerts", "users", "access-requests"] as const;
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
          <TabsTrigger value="users" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            User Roles
          </TabsTrigger>
          <TabsTrigger value="access-requests" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Access Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-0">
          <SystemAlertsBanner />
          <p className="text-sm text-muted-foreground mt-4">
            Active alerts are shown above. When there are no unresolved alerts, this section is empty.
          </p>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <AdminUsers embedded />
        </TabsContent>

        <TabsContent value="access-requests" className="mt-0">
          <AdminAccessRequests embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}