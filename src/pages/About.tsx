import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/PageMeta";
import VisionSection from "@/components/VisionSection";
import MissionSection from "@/components/MissionSection";

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

        {/* Vision & Mission */}
        <VisionSection />
        <MissionSection />

        {/* Video Section */}
        <div className="mb-12 mt-8">
          <a
            href="https://www.youtube.com/watch?v=UrvmYz41wsA"
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-video rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center hover:opacity-90 transition-opacity relative"
          >
            <img
              src="https://img.youtube.com/vi/UrvmYz41wsA/hqdefault.jpg"
              alt="BBQS Program Overview video thumbnail"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </a>
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
