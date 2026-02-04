import consortiumIllustration from "@/assets/bbqs-consortium-illustration.png";

const HeroSection = () => {
  return (
    <section className="text-center py-12">
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
        BBQS: Brain Behavior Quantification and Synchronization
      </h1>
      
      <div className="w-64 h-64 mx-auto mb-12">
        <img 
          src={consortiumIllustration} 
          alt="BBQS Consortium - Connected nodes representing brain behavior data synchronization"
          className="w-full h-full object-contain"
        />
      </div>
    </section>
  );
};

export default HeroSection;
