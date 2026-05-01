import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { AlertCircle, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserTier } from "@/hooks/useUserTier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "admin-pending-banner-dismissed-at";
const DISMISS_HOURS = 4;

export function AdminPendingBanner() {
  const { isCurator, isAdmin, isLoading } = useUserTier();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (!ts) return setDismissed(false);
      const ageMs = Date.now() - Number(ts);
      setDismissed(ageMs < DISMISS_HOURS * 60 * 60 * 1000);
    } catch {
      setDismissed(false);
    }
  }, []);

  const { data } = useQuery({
    queryKey: ["admin-pending-counts", isAdmin, isCurator],
    enabled: !isLoading && isCurator,
    refetchInterval: 120_000,
    staleTime: 60_000,
    queryFn: async () => {
      const [requests, pendingRoles, alerts] = await Promise.all([
        supabase
          .from("access_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("investigators")
          .select("id", { count: "exact", head: true })
          .not("pending_role", "is", null),
        isAdmin
          ? supabase
              .from("system_alerts")
              .select("id", { count: "exact", head: true })
              .eq("resolved", false)
          : Promise.resolve({ count: 0 } as { count: number | null }),
      ]);
      return {
        accessRequests: requests.count ?? 0,
        pendingRoles: pendingRoles.count ?? 0,
        systemAlerts: alerts.count ?? 0,
      };
    },
  });

  if (isLoading || !isCurator || dismissed || !data) return null;

  const items: { label: string; count: number; href: string }[] = [];
  if (data.accessRequests > 0)
    items.push({ label: "access request", count: data.accessRequests, href: "/admin?tab=access-requests" });
  if (data.pendingRoles > 0)
    items.push({ label: "role request", count: data.pendingRoles, href: "/admin?tab=users" });
  if (isAdmin && data.systemAlerts > 0)
    items.push({ label: "system alert", count: data.systemAlerts, href: "/admin?tab=alerts" });

  if (items.length === 0) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setDismissed(true);
  };

  return (
    <div className="border-b border-accent/40 bg-accent/10">
      <div className="px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <AlertCircle className="h-4 w-4 text-accent-foreground" />
          <span>Admin console:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-background/60 transition-colors"
            >
              <Badge variant="secondary" className="font-mono">{item.count}</Badge>
              <span className="text-foreground">
                pending {item.label}{item.count === 1 ? "" : "s"}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          onClick={dismiss}
          aria-label="Dismiss admin alert"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}