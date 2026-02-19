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
  Bot,
  
  Wrench,
  Sparkles,
  Code,
  Plug,
  Scale,
  Package,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const mainItems: NavItem[] = [
  { title: "Home", url: "/", icon: Home },
  { title: "About", url: "/about", icon: Info },
];

const crossSpeciesItems: NavItem[] = [
  { title: "Explorer", url: "/knowledge-graph", icon: FlaskConical },
];

const aiItems: NavItem[] = [
  { title: "NeuroMCP", url: "/neuromcp", icon: Bot },
  { title: "Chat Archive", url: "/consortia-history", icon: MessageSquare },
];

const knowledgeBaseItems: NavItem[] = [
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Publications", url: "/publications", icon: FileText },
  { title: "Tools", url: "/resources", icon: Wrench },
];

const communityItems: NavItem[] = [
  { title: "Investigators", url: "/investigators", icon: Users },
  { title: "Working Groups", url: "/working-groups", icon: Users },
  { title: "Announcements", url: "/announcements", icon: Bell },
  { title: "Job Board", url: "#", icon: Briefcase },
  { title: "Calendar", url: "#", icon: CalendarDays },
];

const conferencesItems: NavItem[] = [
  { title: "SFN 2025", url: "/sfn-2025", icon: Calendar },
];

const softwareDocItems: NavItem[] = [
  { title: "Public API", url: "/api-docs", icon: Code },
  { title: "MCP Server", url: "/mcp-docs", icon: Plug },
  { title: "Build MCP", url: "/mcp-tutorial", icon: Package },
  { title: "MCP Registry", url: "/mcp-registry", icon: Globe },
];

const engineeringItems: NavItem[] = [
  { title: "Roadmap", url: "/roadmap", icon: Map },
  { title: "Software Architecture", url: "/design-docs", icon: FileText },
  { title: "Agentic Framework", url: "/agentic-framework", icon: Sparkles },
];

const legalItems: NavItem[] = [
  { title: "Data Sharing Policy", url: "/data-sharing-policy", icon: Scale },
];

export const sidebarGroups: NavGroup[] = [
  { label: "Main", items: mainItems },
  { label: "Cross-Species", items: crossSpeciesItems },
  { label: "Artificial Intelligence", items: aiItems },
  { label: "Knowledge Base", items: knowledgeBaseItems },
  { label: "Community", items: communityItems },
  { label: "Conferences", items: conferencesItems },
  { label: "Developer Tools", items: softwareDocItems },
  { label: "Engineering", items: engineeringItems },
  { label: "Legal", items: legalItems },
];
