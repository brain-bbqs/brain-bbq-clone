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
  Scale,
  Package,
  Globe,
  Database,
  Bug,
  History,
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
  { title: "Resources", url: "/resources", icon: Database },
  { title: "Metadata Assistant", url: "/metadata-assistant", icon: Package },
  { title: "Data Provenance", url: "/data-provenance", icon: History },
];

const knowledgeBaseItems: NavItem[] = [
  { title: "Explorer", url: "/knowledge-graph", icon: Globe },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Species", url: "/species", icon: Bug },
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

const engineeringItems: NavItem[] = [
  { title: "Roadmap", url: "/roadmap", icon: Map },
];

const legalItems: NavItem[] = [
  { title: "Data Sharing Policy", url: "/data-sharing-policy", icon: Scale },
];

export const sidebarGroups: NavGroup[] = [
  { label: "Main", items: mainItems },
  { label: "Knowledge Base", items: knowledgeBaseItems },
  { label: "Tools", items: toolsItems },
  { label: "Community", items: communityItems },
  { label: "Conferences", items: conferencesItems },
  { label: "Engineering", items: engineeringItems },
  { label: "Legal", items: legalItems },
];
