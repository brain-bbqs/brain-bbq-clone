const MissionSection = () => {
  const missions = [
    "Developing tools to capture and quantify behavior with high temporal resolution and across multiple dimensions",
    "Synchronizing with simultaneously recorded brain activity",
    "Building new conceptual and computational models that capture the complexity of behavior",
    "Establishing a cross-disciplinary consortium to develop, integrate, and disseminate tools, research designs, and ethical frameworks",
  ];

  return (
    <section className="max-w-3xl mx-auto py-4">
      <h2 className="text-2xl font-bold text-foreground mb-3">Mission</h2>
      <div className="border-t border-border mb-4" />
      
      <ul className="list-disc list-inside space-y-3">
        {missions.map((mission, index) => (
          <li key={index} className="text-foreground text-base">
            {mission}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default MissionSection;
