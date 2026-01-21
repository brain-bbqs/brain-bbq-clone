import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Announcements = () => {
  const announcements = [
    {
      month: "November 2025",
      title: "SFN Annual Meeting 2025",
      content: "BBQS will be presenting at the Society for Neuroscience Annual Meeting in San Diego. Join us at Booth #3830 and #3831 or attend our symposium.",
      link: "/sfn-2025",
      linkText: "More details",
    },
    {
      month: "July 2025",
      title: "Consortia-Wide Workshop at MIT",
      content: "A 3-day Consortia-Wide Workshop will be held at MIT from July 15-17, 2025. Consortia members, please check your messages for signup information and further details.",
      link: null,
      linkText: null,
    },
    {
      month: "January 2025",
      title: "New BBQS Website Launch",
      content: "A new website for BBQS (this) was born. 🎊",
      link: null,
      linkText: null,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 py-8 max-w-5xl mx-auto">
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
      </main>
    </div>
  );
};

export default Announcements;
