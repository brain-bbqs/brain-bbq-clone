export interface TreeNode {
  name: string;
  children?: TreeNode[];
  meta?: {
    species?: string;
    goal?: string;
    algorithm?: string;
    grant?: string;
    pis?: string;
  };
}

export interface CategoryData {
  id: string;
  title: string;
  description: string;
  tree: TreeNode;
}

export const computationalCategories: CategoryData[] = [
  {
    id: "computer-vision",
    title: "1. Computer Vision & Continuous Kinematic Tracking",
    description:
      "Before we can decode the brain, we must precisely digitize the physical plant. The consortium leverages deep learning to solve the highly non-linear problem of mapping physical space across varied environments.",
    tree: {
      name: "Computer Vision & Kinematics",
      children: [
        {
          name: "3D Convolutional Neural Networks",
          meta: { species: "Mice & Crickets", goal: "Predator-prey dynamics", algorithm: "Spatiotemporal tracking across multi-perspective video", grant: "R34DA059512", pis: "Dunn, Field, Tadross" },
        },
        {
          name: "Deep Neural Networks (Multi-Animal 3D)",
          meta: { species: "Interacting Animals (Rats/Mice)", goal: "Close-contact social interaction", algorithm: "Fusing multi-camera images to infer 3D coordinates during visual occlusion", grant: "R34DA059506", pis: "Dunn, Olveczky" },
        },
        {
          name: "ANNs with 3D Articulated Mesh Models",
          meta: { species: "Cowbirds", goal: "Flocking and mating behavior", algorithm: "Predicting position, orientation, pose, and shape from images to an articulated mesh", grant: "R34DA059507", pis: "Aflatouni, Balasubramanian, Daniilidis, Schmidt" },
        },
        {
          name: "Visual Deep Learning Algorithms",
          meta: { species: "Wild Capuchins", goal: "Reward valuation; foraging", algorithm: "Automated recognition of individuals approaching smart testing stations in the wild", grant: "R34DA061925", pis: "Flagel, Beehner, Benitez" },
        },
        {
          name: "AI-Based Kinematic Tracking Models",
          meta: { species: "Rodents", goal: "Oromanual food-handling", algorithm: "Tracking fast, visually occluded elemental sub-movements", grant: "R34DA059723", pis: "Shepherd" },
        },
        {
          name: "Facial Feature Tracking",
          meta: { species: "Humans", goal: "Social emotive communication", algorithm: "Tracking facial emotive communication cues and categorization", grant: "R61MH138705" },
        },
        {
          name: "Field-Based Kinematic Measurement",
          meta: { species: "Sheep", goal: "Complex collective behavior", algorithm: "High-resolution spatiotemporal measurement of individual herd members in open environments", grant: "R34DA059514" },
        },
        {
          name: "Bioluminescent Optical Imaging Tracking",
          meta: { species: "Flies & Fish", goal: "Stimulus-guided navigation", algorithm: "Multi-resolution tracking of unconstrained behavior and limb kinematics using optical imaging", grant: "R34DA059500" },
        },
        {
          name: "Privacy-Preserving LiDAR/mmWave Sensing",
          meta: { species: "Humans", goal: "Attention in natural contexts", algorithm: "Fusing neural oscillations with LiDAR/mmWave to extract arousal features without standard video", grant: "R61MH138713" },
        },
      ],
    },
  },
  {
    id: "behavioral-segmentation",
    title: "2. Unsupervised & Semi-Supervised Behavioral Segmentation",
    description:
      "We must parse continuous streams of kinematics into discrete, meaningful syllables of behavior (motifs) without human bias.",
    tree: {
      name: "Behavioral Segmentation",
      children: [
        {
          name: "Semi-Supervised Hierarchical Multi-Timescale Models (So-Mo)",
          meta: { species: "Mice", goal: "Affiliative vs. agonistic interaction", algorithm: "Integrating video, breathing, and heart rate to extract low-dimensional spatiotemporal motifs", grant: "R34DA059718", pis: "Padilla Coreano, Saxena, Wesson" },
        },
        {
          name: "Topological Time Series Analysis",
          meta: { species: "Ferrets", goal: "Visuomotor communication", algorithm: "Mapping nonlinear state transitions across neural oscillations, body movements, and macro-behavior", grant: "R34DA061924", pis: "Frohlich, Zhang" },
        },
        {
          name: "Social Network Mathematical Models",
          meta: { species: "Cowbirds", goal: "Hierarchy and group cohesion", algorithm: "Quantifying the association between specific network states, discrete behavior, and neural activation", grant: "R34DA059507", pis: "Aflatouni, Balasubramanian, Daniilidis, Schmidt" },
        },
        {
          name: "Contextual Modeling",
          meta: { species: "Cichlid Fish", goal: "Reproduction", algorithm: "Modeling the influence of hierarchical status and male displays on social dynamics", grant: "R34DA059510", pis: "Dyer, McGrath" },
        },
        {
          name: "Active Inference Segmentation",
          meta: { species: "Mice", goal: "Spontaneous behavior under environmental stress", algorithm: "Fusing kinematics, vocalizations, and arousal states to segment behavioral dynamics across multiple timescales", grant: "R34DA059509", pis: "Grover, Kuang, Rubin, Yttri" },
        },
        {
          name: "Organism-Environment Segmentation Models",
          meta: { species: "New Model Systems", goal: "Organism-environment interactions", algorithm: "Expanding ML segmentation pipelines to capture complex organism-environment interactions", grant: "R34DA061984", pis: "Srivastava" },
        },
        {
          name: "Multimodal Synchrony Algorithms",
          meta: { species: "Humans", goal: "Social communication", algorithm: "Quantifying temporal patterns of multimodal dyadic communication (virtual vs in-person)", grant: "R34DA059716", pis: "Corcoran, Grinband, Parvaz" },
        },
      ],
    },
  },
  {
    id: "acoustic-attribution",
    title: "3. Acoustic Attribution & Signal Processing",
    description:
      "Vocalizations directly broadcast internal states, but parsing 'who said what' in a noisy, overlapping environment requires advanced source separation algorithms.",
    tree: {
      name: "Acoustic Attribution",
      children: [
        {
          name: "Sound Localization",
          meta: { species: "Multi-Animal (Gerbils)", goal: "Family communication", algorithm: "Localizing sounds with calibrated confidence intervals, using synchronized video for enhancement", grant: "R34DA059513", pis: "Sanes, Schneider, Williams" },
        },
        {
          name: "Vocal Deep-Learning Algorithms",
          meta: { species: "Wild Primates", goal: "Threat detection; Group cohesion", algorithm: "Tracking movements and detecting environmental challenges (e.g., predator encounters) via audio", grant: "R34DA061925", pis: "Flagel, Beehner, Benitez" },
        },
      ],
    },
  },
  {
    id: "neural-decoding",
    title: "4. Neural Encoding, Decoding & Latent Variable Models",
    description:
      "This is where the synchronization happens. These models bridge the implementation hardware to the computational goals.",
    tree: {
      name: "Neural Encoding & Decoding",
      children: [
        {
          name: "Interpretable Machine Learning",
          meta: { species: "Humans", goal: "Navigating anxiety & memory", algorithm: "Combining multimodal neural/smartphone data to continuously predict states", grant: "R61MH135405", pis: "Jacobs, Ortiz, Widge" },
        },
        {
          name: "Nonlinear Brain-Behavior Inference Frameworks",
          meta: { species: "Humans", goal: "Emotional functioning", algorithm: "Concurrent neural, physiological, and behavioral data to predict mental states", grant: "R61MH135407", pis: "Shanechi" },
        },
        {
          name: "Latent Variable Models & Dimensionality Reduction",
          meta: { species: "Humans / Mice", goal: "Effort-based decisions; Adversity", algorithm: "Revealing latent processes altered by developmental trauma", grant: "R61MH138966 & R34DA062119", pis: "Rozell & Wilbrecht" },
        },
        {
          name: "Encoding Regression Models",
          meta: { species: "Gerbils", goal: "Auditory processing in society", algorithm: "Predicting auditory cortical neural responses based on auditory and behavioral covariates", grant: "R34DA059513", pis: "Sanes, Schneider, Williams" },
        },
        {
          name: "Synchronized Neural-Peripheral Integration",
          meta: { species: "Humans", goal: "Approach-avoidance behavior", algorithm: "Synchronizing single-neuron/iEEG with autonomic physiological data in freely moving subjects", grant: "R61MH135106", pis: "Suthana" },
        },
        {
          name: "Real-World Experience Mapping",
          meta: { species: "Humans", goal: "Autobiographical memory", algorithm: "Integrating continuous audio-visual, GPS, and autonomic data with intracranial neural recordings", grant: "R61MH135109", pis: "Inman" },
        },
        {
          name: "Integrated Kinematic & OPM-MEG Tracking",
          meta: { species: "Humans (Pediatric)", goal: "Motor and associative learning", algorithm: "Synchronizing video-tracking with OPM-MEG to measure activity coherence", grant: "R61MH135114", pis: "Welsh, Roberts" },
        },
      ],
    },
  },
  {
    id: "generative-embodied",
    title: "5. Generative & Embodied Agent-Based Models",
    description:
      "These models simulate behavior by generating it according to internalized rules and biomechanical realities.",
    tree: {
      name: "Generative & Embodied Models",
      children: [
        {
          name: "Generative Models of Primate Social Behavior",
          meta: { species: "Marmosets", goal: "Mutual benefit vs. competition", algorithm: "Simulating naturalistic cooperative multi-agent resource competition/cooperation", grant: "1U01DA063534", pis: "Chang, Jadi, Nandy" },
        },
        {
          name: "Multi-Agent Strategy Learning",
          meta: { species: "Marmosets", goal: "Reinforcement learning optimization", algorithm: "Complex patterns to predict and execute social interactions", grant: "1U01DA063534", pis: "Chang, Jadi, Nandy, Saxena" },
        },
        {
          name: "Dynamic Bayesian Networks",
          meta: { species: "Marmosets", goal: "Probabilistic reasoning", algorithm: "Informing the structure/input of the RNNs to increase interpretability", grant: "1U01DA063534", pis: "Chang, Jadi, Nandy, Saxena" },
        },
        {
          name: "Embodied Agent-Based Frameworks (Musculoskeletal)",
          meta: { species: "Marmosets", goal: "Biomechanical constraints", algorithm: "Utilizing RNNs to drive musculoskeletal models, constraining behavior by physical laws", grant: "1U01DA063534", pis: "Chang, Jadi, Nandy, Saxena" },
        },
      ],
    },
  },
  {
    id: "data-ecosystems",
    title: "6. Data Ecosystems & Foundational Infrastructure",
    description:
      "To realize cross-species insights, models require highly standardized, harmonized architectures that allow AI pipelines to operate over disparate data sources.",
    tree: {
      name: "Data Ecosystems & Infrastructure",
      children: [
        {
          name: "BARD.CC",
          meta: { species: "All Species", goal: "Consortium scalability", algorithm: "Developing cloud-based data ecosystems, harmonization pipelines, and federated ML/AI infrastructure", grant: "U24MH136628", pis: "Ghosh, Cabrera, Kennedy" },
        },
        {
          name: "EMBER (Data Archive)",
          meta: { species: "All Species", goal: "Scientific reproducibility", algorithm: "Building a hybrid data archive and unified schema for cross-species behavioral/neural synchronization", grant: "R24MH136632" },
        },
      ],
    },
  },
];
