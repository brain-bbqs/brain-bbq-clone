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
  Lightbulb,
  Bot,
  FlaskConical,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const mainItems: NavItem[] = [
  { title: "Home", url: "/", icon: Home },
  { title: "About", url: "/about", icon: Info },
  { title: "Suggest a Feature", url: "/suggest-feature", icon: Lightbulb },
  { title: "My Profile", url: "/profile", icon: Users },
];

const assistantsItems: NavItem[] = [
  { title: "DANDI Assistant", url: "/dandi-assistant", icon: FlaskConical },
];

const toolsItems: NavItem[] = [
  { title: "Tutorials", url: "/tutorials", icon: BookOpen },
  { title: "Resources", url: "/resources", icon: Database },
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
  { label: "Assistants", items: assistantsItems },
  { label: "Tools", items: toolsItems },
  { label: "Knowledge Base", items: knowledgeBaseItems },
  { label: "Community", items: communityItems },
  { label: "Conferences", items: conferencesItems },
  { label: "Engineering", items: engineeringItems },
  { label: "Legal", items: legalItems },
];
