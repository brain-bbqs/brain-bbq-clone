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
  MessageSquare,
  LogIn,
  LogOut,
  Bot,
  Brain,
  Wrench,
  Sparkles,
  ScrollText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import bbqsLogo from "@/assets/bbqs-logo.png";
import bbqsLogoVideo from "@/assets/bbqs-logo-animated.mp4";

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
import { ReportIssueDialog } from "@/components/ReportIssueDialog";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "About", url: "/about", icon: Info },
];

const knowledgeBaseItems = [
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Publications", url: "/publications", icon: FileText },
  { title: "Tools", url: "/resources", icon: Wrench },
  { title: "Knowledge Graph", url: "/knowledge-graph", icon: FlaskConical },
];

const aiItems = [
  { title: "NeuroMCP", url: "/neuromcp", icon: Bot },
  { title: "Cross-Species Sync", url: "/ml-models", icon: Brain },
  { title: "Chat Archive", url: "/consortia-history", icon: MessageSquare },
];

const directoryItems = [
  { title: "Investigators", url: "/investigators", icon: Users },
  { title: "Working Groups", url: "/working-groups", icon: Users },
];

const communityItems = [
  { title: "Announcements", url: "/announcements", icon: Bell },
  { title: "Job Board", url: "#", icon: Briefcase },
  { title: "Calendar", url: "#", icon: CalendarDays },
];

const conferencesItems = [
  { title: "SFN 2025", url: "/sfn-2025", icon: Calendar },
];

const documentationItems = [
  { title: "Data Sharing Policy", url: "/data-sharing-policy", icon: ScrollText },
];

const developmentItems = [
  { title: "Roadmap", url: "/roadmap", icon: Map },
  { title: "Software Architecture", url: "/design-docs", icon: FileText },
  { title: "Agentic Framework", url: "/agentic-framework", icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut, loading } = useAuth();

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
        <div className="flex items-center justify-between px-2 py-2">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <video 
                src={bbqsLogoVideo} 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            {!collapsed && (
              <span className="font-semibold text-sidebar-foreground text-sm leading-tight">
                BBQS
              </span>
            )}
          </Link>
          <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent rounded-md" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Main</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(mainItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Artificial Intelligence</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(aiItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Knowledge Base</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(knowledgeBaseItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Directory</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(directoryItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Community</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(communityItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Conferences</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(conferencesItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Documentation</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(documentationItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Development</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(developmentItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-2">
        <ReportIssueDialog />
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
