import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Announcements = () => {
  const announcements = [
    {
      month: "March 2026",
      title: "Children's Speech Recognition Challenge — $120K Prize Pool",
      content: "DrivenData has launched the \"On Top of Pasketti\" Children's Speech Recognition Challenge, focused on building open, high-quality ASR models for children's speech. Participants work with ~560K transcribed utterances (519 hours of child speech). Two tracks: Word-level ASR and Phonetic ASR. Open through April 6, 2026.",
      link: "https://kidsasr.drivendata.org/",
      linkText: "Learn more & participate",
      external: true,
    },
    {
      month: "March 2026",
      title: "Canada Impact+ Research Training Awards (CIRTA)",
      content: "McGill University is accepting nominations for the Canada Impact+ Research Training Awards — a one-time initiative to recruit international or returning Canadian doctoral students ($40K/yr × 3 years, 600 awards) and postdoctoral researchers ($70K/yr × 2 years, 400 awards). Priority areas include AI, health/biotech, clean tech, climate resilience, and more.",
      link: "/jobs",
      linkText: "View on Job Board",
      external: false,
    },
    {
      month: "November 2025",
      title: "SFN Annual Meeting 2025",
      content: "BBQS will be presenting at the Society for Neuroscience Annual Meeting in San Diego. Join us at Booth #3830 and #3831 or attend our symposium.",
      link: "/sfn-2025",
      linkText: "More details",
      external: false,
    },
    {
      month: "July 2025",
      title: "Consortia-Wide Workshop at MIT",
      content: "A 3-day Consortia-Wide Workshop will be held at MIT from July 15-17, 2025. Consortia members, please check your messages for signup information and further details.",
      link: null,
      linkText: null,
      external: false,
    },
    {
      month: "January 2025",
      title: "New BBQS Website Launch",
      content: "A new website for BBQS (this) was born. 🎊",
      link: null,
      linkText: null,
      external: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-2">BBQS Announcements</h1>
        <p className="text-muted-foreground mb-8">
          New hires, publications, awards, conferences, etc.
        </p>

        <div className="space-y-6">
          {announcements.map((announcement, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <p className="text-sm text-primary font-medium">{announcement.month}</p>
                <CardTitle className="text-xl">{announcement.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {announcement.content}
                  {announcement.link && (
                    <>
                      {" "}
                      <Link to={announcement.link} className="text-primary hover:underline">
                        {announcement.linkText}
                      </Link>
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
