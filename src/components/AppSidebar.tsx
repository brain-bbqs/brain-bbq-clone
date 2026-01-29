import { Link, useLocation } from "react-router-dom";
import {
  Home,
  FolderOpen,
  Calendar,
  Users,
  BookOpen,
  Bell,
  Map,
  Briefcase,
  CalendarDays,
  Info,
  FileText,
  FlaskConical,
} from "lucide-react";

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
  useSidebar,
} from "@/components/ui/sidebar";
import { ReportIssueDialog } from "@/components/ReportIssueDialog";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "About", url: "#", icon: Info },
];

const knowledgeBaseItems = [
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Working Groups", url: "/working-groups", icon: Users },
  { title: "Resources", url: "/resources", icon: BookOpen },
  { title: "Roadmap", url: "/roadmap", icon: Map },
];

const assertionsItems = [
  { title: "Assertions", url: "/assertions", icon: FileText },
];

const evidenceItems = [
  { title: "Evidence", url: "/evidence", icon: FlaskConical },
];

const communityItems = [
  { title: "SFN 2025", url: "/sfn-2025", icon: Calendar },
  { title: "Announcements", url: "/announcements", icon: Bell },
  { title: "Job Board", url: "#", icon: Briefcase },
  { title: "Calendar", url: "#", icon: CalendarDays },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const renderMenuItems = (items: typeof mainItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
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
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground text-sm leading-tight">
              BBQS
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Main</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(mainItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Knowledge Base</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(knowledgeBaseItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Assertions</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(assertionsItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Evidence</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(evidenceItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Community</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(communityItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <ReportIssueDialog />
      </SidebarFooter>
    </Sidebar>
  );
}
