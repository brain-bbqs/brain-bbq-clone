import HeroSection from "@/components/HeroSection";
import VisionSection from "@/components/VisionSection";
import MissionSection from "@/components/MissionSection";
import { PageMeta } from "@/components/PageMeta";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Home" description="BBQS — Brain Behavior Quantification and Synchronization. An NIH-funded consortium advancing computational neuroscience through shared tools, data, and cross-species behavioral analysis." />
      {/* Hero with Gradient Background */}
      <div className="relative h-[50vh] min-h-[400px]">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/20 via-accent/10 to-background" />

        {/* Hero Content - centered vertically */}
        <div className="relative z-10 px-6 h-full flex items-center justify-center">
          <HeroSection />
        </div>
      </div>

      {/* Content with solid background */}
      <main className="px-6 bg-background">
        <VisionSection />
        <MissionSection />
      </main>
    </div>
  );
};

export default Index;
