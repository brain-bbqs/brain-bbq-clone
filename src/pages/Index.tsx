import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VisionSection from "@/components/VisionSection";
import MissionSection from "@/components/MissionSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6">
        <HeroSection />
        <VisionSection />
        <MissionSection />
      </main>
    </div>
  );
};

export default Index;
