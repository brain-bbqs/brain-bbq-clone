import bbqsLogo from "@/assets/bbqs-logo.png";

const HeroSection = () => {
  return (
    <section className="text-center py-6">
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="w-16 h-16">
          <img 
            src={bbqsLogo} 
            alt="BBQS Consortium"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Brain Behavior Quantification & Synchronization
        </h1>
      </div>
    </section>
  );
};

export default HeroSection;
