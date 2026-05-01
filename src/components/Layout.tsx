import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PanelLeft } from "lucide-react";
import { EntitySummaryProvider } from "@/contexts/EntitySummaryContext";
import { EntitySummaryModal } from "@/components/entity-summary/EntitySummaryModal";
import { AdminPendingBanner } from "@/components/admin/AdminPendingBanner";

interface LayoutProps {
  children: React.ReactNode;
}

function FloatingTrigger() {
  const { state, isMobile, openMobile, toggleSidebar } = useSidebar();
  const show = isMobile ? !openMobile : state === "collapsed";
  if (!show) return null;
  return (
    <button
      onClick={toggleSidebar}
      className="fixed top-3 left-3 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent shadow-lg border border-border transition-all duration-200 hover:shadow-xl"
      title="Open sidebar"
    >
      <PanelLeft className="h-5 w-5" />
      <span className="text-xs font-medium hidden sm:inline">Menu</span>
    </button>
  );
}

export function Layout({ children }: LayoutProps) {
  useAnalytics();

  return (
    <EntitySummaryProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full overflow-x-hidden">
          <AppSidebar />
          <FloatingTrigger />
          <SidebarInset className="flex flex-col flex-1 min-w-0">
            <AdminPendingBanner />
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <EntitySummaryModal />
    </EntitySummaryProvider>
  );
}
