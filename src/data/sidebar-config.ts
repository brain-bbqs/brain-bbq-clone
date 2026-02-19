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
  Container,
  Wrench,
  Sparkles,
  Code,
  Plug,
  Scale,
  Package,
  Globe,
  Database,
  BarChart3,
  Brain,
  Bug,
  Sigma,
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

const toolsItems: NavItem[] = [
  { title: "Software", url: "/resources", icon: Wrench },
  { title: "Datasets", url: "/datasets", icon: Database },
  { title: "Benchmarks", url: "/benchmarks", icon: BarChart3 },
  { title: "ML Models", url: "/ml-models", icon: Brain },
  { title: "Protocols", url: "/protocols", icon: BookOpen },
];

const scienceItems: NavItem[] = [
  { title: "Species", url: "/species", icon: Bug },
  { title: "Computational Models", url: "/computational-models", icon: Sigma },
];

const aiItems: NavItem[] = [
  { title: "NeuroMCP", url: "/neuromcp", icon: Bot },
  { title: "Neurodocker Agent", url: "#", icon: Container },
  { title: "Data Harmonizer", url: "#", icon: Database },
  { title: "Chat Archive", url: "/consortia-history", icon: MessageSquare },
];

const knowledgeBaseItems: NavItem[] = [
  { title: "Explorer", url: "/knowledge-graph", icon: Globe },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Publications", url: "/publications", icon: FileText },
];

const communityItems: NavItem[] = [
  { title: "People", url: "/investigators", icon: Users },
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
  { label: "Knowledge Base", items: knowledgeBaseItems },
  { label: "Tools", items: toolsItems },
  { label: "Science", items: scienceItems },
  { label: "AI Microservices", items: aiItems },
  { label: "Community", items: communityItems },
  { label: "Conferences", items: conferencesItems },
  { label: "Developer Tools", items: softwareDocItems },
  { label: "Engineering", items: engineeringItems },
  { label: "Legal", items: legalItems },
];
