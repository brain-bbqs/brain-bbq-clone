import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAnalytics } from "@/hooks/useAnalytics";

interface LayoutProps {
  children: React.ReactNode;
}

function FloatingTrigger() {
  const { state, isMobile, openMobile } = useSidebar();
  // Show on desktop when collapsed, or on mobile when sheet is closed
  const show = isMobile ? !openMobile : state === "collapsed";
  if (!show) return null;
  return (
    <SidebarTrigger className="fixed top-3 left-3 z-50 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent rounded-md shadow-md" />
  );
}

export function Layout({ children }: LayoutProps) {
  useAnalytics();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <FloatingTrigger />
        <SidebarInset className="flex flex-col flex-1">
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
