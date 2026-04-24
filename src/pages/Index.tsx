// Deploy test: 2026-03-18T02
import { Link } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import { PageMeta } from "@/components/PageMeta";
import {
  Users,
  Bot,
  Database,
  FolderOpen,
  Scale,
  Wrench,
  ChevronRight,
  MessageSquare,
  Sparkles,
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
      { label: "EMBER Assistant", to: "/dandi-assistant" },
      { label: "Metadata Assistant (Beta)", to: "/metadata-assistant" },
      
    ],
  },
  {
    title: "Tools & Tutorials",
    description: "Software, datasets, benchmarks, resources, and learning materials.",
    icon: Database,
    color: "hsl(38 90% 50%)",
    links: [
      { label: "Resources", to: "/resources" },
      { label: "Tutorials", to: "/tutorials" },
    ],
  },
  {
    title: "Knowledge Base",
    description: "Explore projects, species, publications, and data provenance.",
    icon: FolderOpen,
    color: "hsl(140 60% 45%)",
    links: [
      { label: "People", to: "/investigators" },
      { label: "Projects", to: "/projects" },
      { label: "Grants", to: "/grants" },
      { label: "RFA-NS-25-016 (NOFO)", to: "https://grants.nih.gov/grants/guide/rfa-files/RFA-NS-25-016.html" },
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
  {
    title: "Engineering",
    description: "Track development progress, suggest features, and view the roadmap.",
    icon: Wrench,
    color: "hsl(200 60% 50%)",
    links: [
      { label: "Roadmap", to: "/roadmap" },
      { label: "Suggest a Feature", to: "/feature-suggestions" },
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


      {/* BBQS Assistant CTA */}
      <section className="px-4 sm:px-6 mt-8">
        <div className="max-w-5xl mx-auto">
          <a
            href="https://bbqs-assistant.lovable.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 hover:border-primary/60 hover:shadow-xl transition-all duration-200"
          >
            <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="p-4 rounded-2xl bg-primary/15 shrink-0">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    New
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Talk to the BBQS Assistant
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 leading-relaxed">
                  Ask questions about projects, publications, investigators, and workflows across the consortium.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary px-4 py-2 rounded-lg border border-primary/40 bg-background/60 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                Open Assistant
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Navigation Cards */}
      <main className="px-4 sm:px-6 pb-16 mt-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {navCards.map((card) => (
            <div
              key={card.title}
              className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-200 hover:border-primary/30"
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-5 right-5 h-1.5 rounded-b-full opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: card.color }}
              />

              <div className="flex items-start gap-4 mt-3 mb-4">
                <div
                  className="p-3 rounded-xl shrink-0"
                  style={{ backgroundColor: `${card.color}20` }}
                >
                  <card.icon className="h-6 w-6" style={{ color: card.color }} />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-lg">{card.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {card.links.map((link) => {
                  const isExternal = link.to.startsWith("http");
                  const sharedClassName = "inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-lg border transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.03] cursor-pointer";
                  const sharedStyle = {
                    borderColor: `${card.color}40`,
                    color: card.color,
                    backgroundColor: `${card.color}08`,
                  };
                  const handlers = {
                    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
                      e.currentTarget.style.backgroundColor = `${card.color}22`;
                      e.currentTarget.style.borderColor = card.color;
                      e.currentTarget.style.color = card.color;
                    },
                    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
                      e.currentTarget.style.backgroundColor = `${card.color}08`;
                      e.currentTarget.style.borderColor = `${card.color}40`;
                    },
                  };

                  return isExternal ? (
                    <a
                      key={link.to}
                      href={link.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={sharedClassName}
                      style={sharedStyle}
                      {...handlers}
                    >
                      {link.label}
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </a>
                  ) : (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={sharedClassName}
                      style={sharedStyle}
                      {...handlers}
                    >
                      {link.label}
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
