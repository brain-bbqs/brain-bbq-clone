import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { WalkthroughButton } from "@/components/WalkthroughButton";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>
        <WalkthroughButton />
      </div>
    </SidebarProvider>
  );
}
