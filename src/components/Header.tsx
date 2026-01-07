const Header = () => {
  const navLinks = [
    "About",
    "Projects", 
    "SFN 2025",
    "Working Groups",
    "Resources",
    "Announcements",
    "Job Board",
    "Calendar",
  ];

  return (
    <header className="bg-card border-b border-border px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent" />
          <span className="font-semibold text-foreground">
            Brain Behavior Quantification and Synchronization
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link}
            </a>
          ))}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="bg-secondary text-foreground text-sm px-3 py-1.5 rounded border border-border w-32 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              ⌘K
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
