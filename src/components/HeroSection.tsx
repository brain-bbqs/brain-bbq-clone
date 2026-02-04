import bbqsLogo from "@/assets/bbqs-logo.png";

const HeroSection = () => {
  return (
    <section className="text-center">
      <div className="inline-flex items-center justify-center gap-4 bg-background/80 backdrop-blur-sm rounded-xl px-8 py-4 shadow-lg">
        <div className="w-14 h-14">
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
