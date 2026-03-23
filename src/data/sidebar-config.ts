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
  Shield,
  Package,
  Globe,
  Database,
  Bug,
  History,
  Lightbulb,
  Bot,
  FlaskConical,
  Hotel,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  disabled?: boolean;
  authRequired?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const mainItems: NavItem[] = [
  { title: "Home", url: "/", icon: Home },
  { title: "About", url: "/about", icon: Info },
  { title: "Tutorials", url: "/tutorials", icon: BookOpen },
  { title: "My Profile", url: "/profile", icon: Users, authRequired: true },
];

const assistantsItems: NavItem[] = [
  { title: "EMBER Assistant", url: "/dandi-assistant", icon: FlaskConical, authRequired: true },
  { title: "Metadata Assistant (Beta)", url: "/metadata-assistant", icon: Bot, authRequired: true },
  
];

const toolsItems: NavItem[] = [
  { title: "Resources", url: "/resources", icon: Database },
  { title: "State Privacy Map", url: "/state-privacy", icon: Shield },
];

const knowledgeBaseItems: NavItem[] = [
  
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Grants", url: "/grants", icon: Globe, authRequired: true },
  { title: "Species", url: "/species", icon: Bug },
  { title: "Publications", url: "/publications", icon: FileText },
  { title: "Data Provenance", url: "/data-provenance", icon: History },
];

const communityItems: NavItem[] = [
  { title: "People", url: "/investigators", icon: Users },
  { title: "Working Groups", url: "/working-groups", icon: Users },
  { title: "Announcements", url: "/announcements", icon: Bell },
  { title: "Job Board", url: "/jobs", icon: Briefcase },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
];

const conferencesItems: NavItem[] = [
  { title: "MIT Workshop 2026", url: "/mit-workshop-2026", icon: Calendar },
  { title: "  Travel & Hotels", url: "/mit-workshop-2026/travel", icon: Hotel, authRequired: true },
  { title: "SFN 2025", url: "/sfn-2025", icon: Calendar },
];

const engineeringItems: NavItem[] = [
  { title: "Roadmap", url: "/roadmap", icon: Map, authRequired: true },
  { title: "Give Feedback", url: "/suggest-feature", icon: Lightbulb },
];

const legalItems: NavItem[] = [
  { title: "Data Sharing Policy", url: "/data-sharing-policy", icon: Scale },
];

export const sidebarGroups: NavGroup[] = [
  { label: "Main", items: mainItems },
  { label: "Community", items: communityItems },
  { label: "Assistants", items: assistantsItems },
  { label: "Tools", items: toolsItems },
  { label: "Knowledge Base", items: knowledgeBaseItems },
  { label: "Conferences", items: conferencesItems },
  { label: "Engineering", items: engineeringItems },
  { label: "Legal", items: legalItems },
];
