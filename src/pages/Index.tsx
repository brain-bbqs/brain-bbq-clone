import HeroSection from "@/components/HeroSection";
import VisionSection from "@/components/VisionSection";
import MissionSection from "@/components/MissionSection";
import heroBackground from "@/assets/hero-background.mp4";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero with Video Background */}
      <div className="relative overflow-hidden h-[50vh] min-h-[400px]">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={heroBackground} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

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
