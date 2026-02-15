import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { WalkthroughButton } from "@/components/WalkthroughButton";
import { GlobalSearch } from "@/components/GlobalSearch";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card">
            <SidebarTrigger className="h-7 w-7" />
            <div className="flex-1 max-w-sm">
              <GlobalSearch />
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>
        <WalkthroughButton />
      </div>
    </SidebarProvider>
  );
}
