import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/PageMeta";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="About" description="Learn about the BBQS consortium — mission, vision, and organizational structure for brain behavior quantification research." />
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-4">About</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The Brain Behavior Quantification and Synchronization (BBQS) program is a basic research effort to develop new tools and approaches in support of a more comprehensive mechanistic understanding of the neural basis of behavior.
          </p>
        </div>

        {/* Video Section */}
        <div className="mb-12">
          <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
            <iframe
              src="https://www.youtube.com/embed/UrvmYz41wsA"
              title="BBQS Program Overview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Goals Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Goals</h2>
          <p className="text-muted-foreground mb-4">The goals of the BBQS program are to:</p>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="text-primary mt-1.5">•</span>
              <span className="text-foreground">
                Develop tools for simultaneous, multimodal measurement of behavior within complex, dynamic physical and/or social environments and synchronize these data with simultaneously recorded neural activity.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1.5">•</span>
              <span className="text-foreground">
                Develop novel conceptual and computational models that capture dynamic behavior-environment relationships across multiple timescales and integrate correlated neural activity into the model.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1.5">•</span>
              <span className="text-foreground">
                Establish a cross-disciplinary consortium of researchers supported by a BBQS data coordination and artificial intelligence center.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1.5">•</span>
              <span className="text-foreground">
                Develop and disseminate new tools, ontologies, research designs, data archives, informatics tools, data standards, and ethical frameworks that will transform how mechanistic brain-behavioral research is conducted.
              </span>
            </li>
          </ul>
        </div>

        {/* Contact Section */}
        <div className="border-t border-border pt-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Contact us</h2>
          <p className="text-muted-foreground mb-4">
            Have questions or want to get involved? Reach out to us.
          </p>
          <a href="mailto:dcaic-admin@brain-bbqs.org">
            <Button variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              dcaic-admin@brain-bbqs.org
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
