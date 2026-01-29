import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const WorkingGroups = () => {
  const workingGroups = [
    { name: "WG-Analytics", href: "#analytics" },
    { name: "WG-Devices", href: "#devices" },
    { name: "WG-Ethics, Legal, and Social Issues (WG-ELSI)", href: "#elsi" },
    { name: "WG-Standards", href: "#standards" },
  ];

  const chairs = [
    {
      group: "WG-Analytics",
      members: [
        { name: "Kristofer Bouchard", url: "https://biosciences.lbl.gov/profiles/kristofer-e-bouchard/" },
        { name: "Han Yi", url: "https://scholar.google.com/citations?user=MdrCoqAAAAAJ&hl=en" },
      ],
    },
    {
      group: "WG-Devices",
      members: [{ name: "TBD", url: null }],
    },
    {
      group: "WG-ELSI",
      members: [
        { name: "Laura Cabrera", url: "https://rockethics.psu.edu/people/laura-cabrera/" },
      ],
    },
    {
      group: "WG-Standards",
      members: [
        { name: "Oliver Ruebel", url: "https://dav.lbl.gov/~oruebel/" },
        { name: "Melissa Kline Struhl", url: "https://eccl.mit.edu/team-profiles/melissa-kline-struhl" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">Working Groups</h1>

        {/* Why Working Groups */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Why working groups?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Working groups are essential to the success of a consortium project, as they bring together a range of experts from different organizations to focus on specific tasks. Each group works on a particular area of the project, collaborating to find solutions and share knowledge. By dividing the project into smaller, more manageable parts, working groups help ensure that work moves forward smoothly and deadlines are met. Together, their efforts contribute to the overall goals of the project, ensuring it achieves its desired outcomes.
          </p>
        </section>

        {/* Active Working Groups */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Active Working Groups</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {workingGroups.map((group) => (
              <Card key={group.name} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <a 
                    href={group.href}
                    className="text-primary hover:underline font-medium"
                  >
                    {group.name}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Working Group Chairs */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Working Group Chairs</h2>
          <div className="space-y-4">
            {chairs.map((chair) => (
              <Card key={chair.group}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{chair.group}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {chair.members.map((member, index) => (
                      <span key={member.name}>
                        {member.url ? (
                          <a
                            href={member.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {member.name}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">{member.name}</span>
                        )}
                        {index < chair.members.length - 1 && <span className="text-muted-foreground">, </span>}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default WorkingGroups;
