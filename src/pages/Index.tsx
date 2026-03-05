import { Link } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import { PageMeta } from "@/components/PageMeta";
import {
  Users,
  Bot,
  Database,
  FolderOpen,
  Scale,
  Bell,
  Briefcase,
  CalendarDays,
  Calendar,
  FlaskConical,
  ScanSearch,
  Bug,
  FileText,
  History,
  Map,
  Lightbulb,
} from "lucide-react";

interface NavCard {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  links: { label: string; to: string }[];
}

const navCards: NavCard[] = [
  {
    title: "Community",
    description: "Connect with researchers, join working groups, and find opportunities.",
    icon: Users,
    color: "hsl(210 70% 55%)",
    links: [
      { label: "People", to: "/investigators" },
      { label: "Working Groups", to: "/working-groups" },
      { label: "Announcements", to: "/announcements" },
      { label: "Job Board", to: "/jobs" },
      { label: "Calendar", to: "/calendar" },
      { label: "SFN 2025", to: "/sfn-2025" },
    ],
  },
  {
    title: "Assistants",
    description: "AI-powered tools for metadata, data archives, and paper extraction.",
    icon: Bot,
    color: "hsl(280 50% 60%)",
    links: [
      { label: "DANDI Assistant", to: "/dandi-assistant" },
      { label: "BBQS Assistant (Beta)", to: "/metadata-assistant" },
      { label: "Paper Extractor (Beta)", to: "/paper-extractor" },
    ],
  },
  {
    title: "Tools",
    description: "Software, datasets, benchmarks, and resources for neuroscience research.",
    icon: Database,
    color: "hsl(38 90% 50%)",
    links: [
      { label: "Resources", to: "/resources" },
    ],
  },
  {
    title: "Knowledge Base",
    description: "Explore projects, species, publications, and data provenance.",
    icon: FolderOpen,
    color: "hsl(140 60% 45%)",
    links: [
      { label: "Projects", to: "/projects" },
      { label: "Species", to: "/species" },
      { label: "Publications", to: "/publications" },
      { label: "Data Provenance", to: "/data-provenance" },
    ],
  },
  {
    title: "Legal & Policy",
    description: "Data sharing agreements and compliance information.",
    icon: Scale,
    color: "hsl(0 0% 45%)",
    links: [
      { label: "Data Sharing Policy", to: "/data-sharing-policy" },
    ],
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Home"
        description="BBQS — Brain Behavior Quantification and Synchronization. An NIH-funded consortium advancing computational neuroscience through shared tools, data, and cross-species behavioral analysis."
      />

      {/* Hero */}
      <div className="relative h-[40vh] min-h-[320px]">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/20 via-accent/10 to-background" />
        <div className="relative z-10 px-6 h-full flex items-center justify-center">
          <HeroSection />
        </div>
      </div>

      {/* Navigation Cards */}
      <main className="px-4 sm:px-6 pb-16 -mt-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {navCards.map((card) => (
            <div
              key={card.title}
              className="group relative bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:border-primary/30"
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-4 right-4 h-1 rounded-b-full opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: card.color }}
              />

              <div className="flex items-start gap-3 mt-2 mb-3">
                <div
                  className="p-2 rounded-lg shrink-0"
                  style={{ backgroundColor: `${card.color}18` }}
                >
                  <card.icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-base">{card.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {card.links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
