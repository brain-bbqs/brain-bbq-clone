import bbqsLogoIcon from "@/assets/bbqs-logo-icon.png";

const HeroSection = () => {
  return (
    <section className="text-center">
      <div className="inline-flex flex-col items-center justify-center gap-4 bg-background/70 backdrop-blur-sm rounded-xl px-10 py-6 shadow-lg">
        <div className="w-36 h-36 rounded-full overflow-hidden bg-background/60 shadow-lg">
          <img 
            src={bbqsLogoIcon} 
            alt="BBQS Consortium"
            className="w-full h-full object-cover scale-[1.35]"
          />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            Brain Behavior
          </h1>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            Quantification & Synchronization
          </h1>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
