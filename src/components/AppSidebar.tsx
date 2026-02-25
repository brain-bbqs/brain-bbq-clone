import { Link, useLocation } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import bbqsLogoIcon from "@/assets/bbqs-logo-icon.png";
import { sidebarGroups } from "@/data/sidebar-config";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import type { NavItem } from "@/data/sidebar-config";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut, loading } = useAuth();

  const isActive = (path: string) => currentPath === path;

  const renderMenuItems = (items: NavItem[]) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          {item.disabled ? (
            <SidebarMenuButton
              tooltip={collapsed ? `${item.title} (coming soon)` : undefined}
              className="py-3 text-base opacity-40 cursor-not-allowed pointer-events-none"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-base">{item.title}</span>
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton
              asChild
              isActive={isActive(item.url)}
              tooltip={collapsed ? item.title : undefined}
              className="py-3 text-base hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              {item.url.startsWith("/") ? (
                <Link to={item.url}>
                  <item.icon className="h-5 w-5" />
                  <span className="text-base">{item.title}</span>
                </Link>
              ) : (
                <a href={item.url}>
                  <item.icon className="h-5 w-5" />
                  <span className="text-base">{item.title}</span>
                </a>
              )}
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-2">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-sidebar-accent/30">
              <img
                src={bbqsLogoIcon}
                alt="BBQS Logo"
                className="w-full h-full object-cover scale-[1.35]"
              />
            </div>
            {!collapsed && (
              <span className="font-semibold text-sidebar-foreground text-xs leading-tight">
                Brain Behavior Quantification & Synchronization
              </span>
            )}
          </Link>
          <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent rounded-md" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sidebarGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>{renderMenuItems(group.items)}</SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-2">
        {!loading && (
          user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </Button>
          ) : (
            <Link to="/auth">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogIn className="h-4 w-4" />
                {!collapsed && <span>Sign In</span>}
              </Button>
            </Link>
          )
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
