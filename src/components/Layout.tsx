import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { WalkthroughButton } from "@/components/WalkthroughButton";
import { useAnalytics } from "@/hooks/useAnalytics";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useAnalytics();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <SidebarTrigger className="h-7 w-7 absolute top-2 left-2 z-50" />
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>
        <WalkthroughButton />
      </div>
    </SidebarProvider>
  );
}
