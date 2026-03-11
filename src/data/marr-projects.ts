// BBQS project data mapped to Marr's three levels of analysis
// Computational: What problem is being solved?
// Algorithmic: What approaches/algorithms are used?
// Implementation: What specific tools/software are used?
// Auto-synced from public/bbqs_marr.yaml

export interface MarrProject {
  id: string;
  shortName: string;
  title?: string;
  pi: string;
  allPIs: string[];
  species: string;
  speciesList?: string[];
  speciesCommonName?: string;
  institution: string;
  color: string;
  computational: string[];   // What problem
  algorithmic: string[];     // What approach
  implementation: string[];  // What tool
  dataModalities: string[];
  experimentalApproaches: string[];
  keywords: string[];
}

export const MARR_PROJECTS: MarrProject[] = [
  {
    id: "R34DA059510",
    shortName: "Dyer – Cichlid Arena",
    pi: "Eva Dyer",
    allPIs: ["Dyer, Eva", "McGrath, Patrick T."],
    species: "Fish (Cichlids)",
    institution: "Georgia Institute of Technology",
    color: "#4fc3f7",
    computational: [
      "Social reproductive behaviors",
      "Hierarchical status navigation",
      "Collective conspecific interactions",
    ],
    algorithmic: [
      "High-dimensional contextual influence modeling",
      "State change tracking",
      "Computer vision tracking",
    ],
    implementation: [
      "Custom behavioral arena",
      "Multi-animal video recording",
      "Cameras",
    ],
    dataModalities: ["Video / Optical", "Behavioral tracking"],
    experimentalApproaches: ["Multi-animal observation", "Environmental context manipulation"],
    keywords: ["Social reproduction", "Hierarchical status", "Computer vision", "Conspecifics"],
  },
  {
    id: "R34DA059509",
    shortName: "Grover – Mouse Multimodal",
    pi: "Pulkit Grover",
    allPIs: ["Grover, Pulkit", "Kuang, Zheng", "Rubin, Jonathan E", "Yttri, Eric"],
    species: "Mice",
    institution: "Carnegie-Mellon University",
    color: "#81c784",
    computational: [
      "Adaptive behavior",
      "State-dependent physiological responses",
    ],
    algorithmic: [
      "Active learning algorithms",
      "Physiological state-to-behavioral output mapping",
      "Dynamic sampling algorithms",
    ],
    implementation: [
      "Multidimensional physiological sensors",
      "Synchronized behavioral and physiological monitoring",
    ],
    dataModalities: ["Behavioral tracking", "Physiological", "Neural"],
    experimentalApproaches: ["Active learning behavioral quantification", "Physiological state mapping"],
    keywords: ["Active learning", "Physiological monitoring", "Adaptive behavior", "State-dependent"],
  },
  {
    id: "R34DA059513",
    shortName: "Sanes – Gerbil Vocal",
    pi: "Dan Sanes",
    allPIs: ["Sanes, Dan Harvey", "Schneider, David Michael", "Williams, Alexander Henry"],
    species: "Rodents (Gerbils/Mice)",
    institution: "New York University",
    color: "#ffb74d",
    computational: [
      "Vocal communication",
      "Social signaling in naturalistic environments",
    ],
    algorithmic: [
      "Computational source separation",
      "Multimodal data fusion",
      "Cocktail party problem solving",
    ],
    implementation: [
      "Microphone arrays",
      "Continuous neural recordings",
      "Behavioral cameras",
      "Naturalistic arenas",
    ],
    dataModalities: ["Audio / Acoustic", "Video / Behavioral", "Neural"],
    experimentalApproaches: ["Naturalistic social observation", "Multimodal fusion", "Acoustic monitoring"],
    keywords: ["Vocalizations", "Source separation", "Multimodal fusion", "Cocktail party problem"],
  },
  {
    id: "R34DA059507",
    shortName: "Aflatouni – Cowbird Aviary",
    pi: "Firooz Aflatouni",
    allPIs: ["Aflatouni, Firooz", "Balasubramanian, Vijay", "Daniilidis, Kostas", "Schmidt, Marc F."],
    species: "Gregarious Songbirds",
    institution: "University of Pennsylvania",
    color: "#ce93d8",
    computational: [
      "Complex social interactions",
      "Flocking dynamics",
      "Vocal communication in 3D",
    ],
    algorithmic: [
      "3D multi-agent tracking algorithms",
      "Neural sequence modeling",
      "Keypoint extraction",
    ],
    implementation: [
      "Smart Aviary",
      "Distributed computer vision arrays",
      "Wireless neural loggers",
      "Microphones",
    ],
    dataModalities: ["Video / Optical", "Audio", "Neural"],
    experimentalApproaches: ["3D environment tracking", "Flocking dynamics observation"],
    keywords: ["Smart aviary", "3D tracking", "Songbirds", "Flocking dynamics", "Neural sequence"],
  },
  {
    id: "R34DA059718",
    shortName: "Padilla – Mouse Social Motifs",
    pi: "Nancy Padilla Coreano",
    allPIs: ["Padilla Coreano, Nancy", "Saxena, Shreya", "Wesson, Daniel W."],
    species: "Mice",
    institution: "University of Florida",
    color: "#f06292",
    computational: [
      "Social behavioral motif generation",
      "Biological rhythm regulation",
    ],
    algorithmic: [
      "Time-series behavioral segmentation",
      "Topological mapping of biological rhythms",
      "Dimensionality reduction",
    ],
    implementation: [
      "Neural and physiological recording devices",
      "High-resolution behavioral tracking cameras",
      "Physiological sensors",
    ],
    dataModalities: ["Physiological (Autonomic)", "Neural (Oscillations)", "Video / Behavioral"],
    experimentalApproaches: ["Biological rhythm monitoring", "Social interaction observation"],
    keywords: ["Biological rhythms", "Social motifs", "Autonomic", "Behavioral segmentation"],
  },
  {
    id: "R34DA059506",
    shortName: "Dunn – 3D Social Tracking",
    pi: "Timothy Dunn",
    allPIs: ["Dunn, Timothy William", "Olveczky, Bence P."],
    species: "Rats",
    institution: "Duke University",
    color: "#a1887f",
    computational: [
      "Precise social behavior execution",
      "Deep phenotyping",
    ],
    algorithmic: [
      "3D keypoint extraction",
      "Non-linear spatial transformations",
      "Computer vision",
    ],
    implementation: [
      "Multi-camera 3D arrays",
      "High-resolution 3D video capture",
    ],
    dataModalities: ["Video / Optical"],
    experimentalApproaches: ["Deep phenotyping", "Social interaction tracking"],
    keywords: ["3D tracking", "Deep phenotyping", "Computer vision", "Keypoint extraction"],
  },
  {
    id: "R34DA059512",
    shortName: "Dunn – 3D Prey Capture",
    pi: "Timothy Dunn",
    allPIs: ["Dunn, Timothy William", "Field, Gregory Darin", "Tadross, Michael R."],
    species: "Rodents",
    institution: "Duke University",
    color: "#90a4ae",
    computational: [
      "Navigation in dynamic environments",
      "Survival behavior",
    ],
    algorithmic: [
      "High-throughput 3D kinematics",
      "Dynamic state estimation",
      "Statistical behavioral modeling",
    ],
    implementation: [
      "Dynamic behavioral arenas",
      "3D cameras",
      "High-throughput video arrays",
    ],
    dataModalities: ["Video / Optical"],
    experimentalApproaches: ["High-throughput screening", "Dynamic environment navigation"],
    keywords: ["High-throughput", "3D measurement", "Rodent", "Dynamic environment", "Kinematics"],
  },
  {
    id: "R34DA059716",
    shortName: "Corcoran – Human Dyadic",
    pi: "Cheryl Corcoran",
    allPIs: ["Corcoran, Cheryl Mary", "Grinband, Jack", "Parvaz, Muhammad Adeel"],
    species: "Humans",
    institution: "Icahn School of Medicine at Mount Sinai",
    color: "#4db6ac",
    computational: [
      "Social communication",
      "Dyadic interpersonal synchronization",
      "Turn-taking",
    ],
    algorithmic: [
      "Temporal pattern analysis",
      "Multimodal alignment algorithms",
      "Time-series reduction",
    ],
    implementation: [
      "Pilot EEG hyperscanning",
      "Cameras",
      "Microphones",
      "Virtual interaction setup",
    ],
    dataModalities: ["Neural (EEG)", "Video (Facial expressions, gestures)", "Audio (Speech rates)"],
    experimentalApproaches: ["Dyadic conversation (virtual and in-person)", "Hyperscanning"],
    keywords: ["Dyadic conversation", "Hyperscanning", "Turn-taking", "EEG", "Multimodal synchronization"],
  },
  {
    id: "R34DA059723",
    shortName: "Shepherd – Food Handling",
    pi: "Gordon Shepherd",
    allPIs: ["Shepherd, Gordon M."],
    species: "Mice",
    institution: "Northwestern University at Chicago",
    color: "#dce775",
    computational: [
      "Foraging and food acquisition",
      "Fine motor manipulation",
    ],
    algorithmic: [
      "Oromanual kinematic analysis",
      "Respiratory-motor coupling algorithms",
      "Temporal micro-structure analysis",
    ],
    implementation: [
      "Multi-camera behavioral rigs",
      "EMG arrays",
      "Respiratory sensors",
      "High-speed cameras",
    ],
    dataModalities: ["Video / Optical", "Physiological (EMG, Respiratory)"],
    experimentalApproaches: ["Fine motor behavior capture", "Oromanual analysis"],
    keywords: ["Oromanual", "Food handling", "Fine motor", "Foraging", "Kinematics"],
  },
  {
    id: "R34DA059514",
    shortName: "Kemere – Sheep Flocking",
    pi: "Caleb Kemere",
    allPIs: ["Kemere, Caleb"],
    species: "Sheep",
    institution: "Rice University",
    color: "#fff176",
    computational: [
      "Complex collective behavior",
      "Herd navigation in naturalistic fields",
    ],
    algorithmic: [
      "Non-linear spatial transformations",
      "3D kinematics in herd context",
      "Egocentric computer vision analysis",
    ],
    implementation: [
      "Head-mounted visual sensors",
      "Robust freely-moving neural recordings",
      "Naturalistic field environments",
    ],
    dataModalities: ["Video / Optical (Egocentric)", "Neural"],
    experimentalApproaches: ["Field observation", "Agricultural herd tracking"],
    keywords: ["Sheep", "Collective behavior", "Herd navigation", "Head-mounted sensors"],
  },
  {
    id: "R34DA059500",
    shortName: "Nagel – Navigation Imaging",
    pi: "Katherine Nagel",
    allPIs: ["Nagel, Katherine", "Schoppik, David", "Shaner, Nathan Christopher", "Wang, Jane"],
    species: "Drosophila / Zebrafish",
    institution: "New York University School of Medicine",
    color: "#80deea",
    computational: [
      "Spatial navigation",
      "Environmental cue integration",
    ],
    algorithmic: [
      "State-space modeling",
      "Sensory-to-motor transformation mapping",
      "Population dynamics analysis",
    ],
    implementation: [
      "Microscopes (Multi-photon or miniaturized)",
      "Optical imaging",
      "Locomotor tracking",
      "VR setups",
    ],
    dataModalities: ["Optical Neural Imaging", "Behavioral tracking"],
    experimentalApproaches: ["Spatial navigation tasks", "Virtual reality or freely behaving optical imaging"],
    keywords: ["Optical imaging", "Genetic species", "Spatial navigation", "State-space modeling"],
  },
  {
    id: "R34DA061984",
    shortName: "Srivastava – Worm Env.",
    pi: "Mansi Srivastava",
    allPIs: ["Srivastava, Mansi"],
    species: "Hofstenia miamia (Panther worm)",
    institution: "Harvard University",
    color: "#c5e1a5",
    computational: [
      "Organism-environment interactions",
      "Sensory ecology",
    ],
    algorithmic: [
      "Ecological modeling",
      "Sensory processing algorithms",
      "Generalized tracking algorithms",
    ],
    implementation: [
      "Novel environmental sensing arrays",
      "Customized interaction tracking",
      "Species-specific custom rigs",
    ],
    dataModalities: ["Environmental sensing", "Neural", "Behavioral"],
    experimentalApproaches: ["Sensory ecology observation", "Pipeline establishment"],
    keywords: ["Organism-environment", "New model system", "Sensory ecology"],
  },
  {
    id: "R34DA061924",
    shortName: "Zhang – Ferret Social",
    pi: "Mengsen Zhang",
    allPIs: ["Frohlich, Flavio", "Zhang, Mengsen"],
    species: "Ferrets / Rodents",
    institution: "Michigan State University",
    color: "#b39ddb",
    computational: [
      "Social phase transitions",
      "Group cohesion",
      "Hierarchical dynamics",
    ],
    algorithmic: [
      "Multi-scale dynamic systems modeling",
      "Phase transition analysis",
      "Complex systems mapping",
      "Time-series dimensionality reduction",
    ],
    implementation: [
      "Scalable neural and behavioral arrays",
      "Multi-animal cameras",
      "Synchronized multi-animal telemetry",
      "Cohort arenas",
    ],
    dataModalities: ["Neural", "Behavioral", "Social metadata"],
    experimentalApproaches: ["Multi-scale social tracking", "Phase transition induction"],
    keywords: ["Dynamic transitions", "Social scales", "Complex systems", "Phase transitions"],
  },
  {
    id: "R34DA061925",
    shortName: "Flagel – Capuchin AI Forest",
    pi: "Shelly Flagel",
    allPIs: ["Flagel, Shelly Beth", "Beehner, Jacinta", "Benitez, Marcela Eugenia"],
    species: "Wild Primates",
    institution: "University of Michigan at Ann Arbor",
    color: "#ffcc80",
    computational: [
      "Survival and foraging in wild environments",
      "Social navigation in unstructured ecology",
    ],
    algorithmic: [
      "Wild-environment computer vision",
      "Robust behavioral feature extraction",
      "Edge-deployed ML models",
    ],
    implementation: [
      "Environmental camera networks ('AI Forest')",
      "Edge-computing nodes",
      "Remote video tracking",
    ],
    dataModalities: ["Video / Optical", "Environmental / Meteorological"],
    experimentalApproaches: ["Wild ecological observation", "Unobtrusive monitoring"],
    keywords: ["AI Forest", "Wild primates", "Computer vision", "Edge computing", "Ecological factors"],
  },
  {
    id: "R34DA062119",
    shortName: "Adversity and Resilience Consortium (PI: Linda Wilbrecht)",
    pi: "Linda Wilbrecht",
    allPIs: ["Wilbrecht, Linda E."],
    species: "Mice",
    institution: "University of California Berkeley",
    color: "#e0e0e0",
    computational: [
      "Experience-dependent adaptation",
      "Neurodevelopment across lifespan",
    ],
    algorithmic: [
      "Longitudinal data modeling",
      "Cross-site harmonization algorithms",
    ],
    implementation: [
      "Standardized multi-site recording equipment",
      "Multi-site standardized recording",
    ],
    dataModalities: ["Behavioral", "Neural"],
    experimentalApproaches: ["Longitudinal tracking", "Multi-site standardized protocol implementation"],
    keywords: ["International Development Project", "Ontogeny", "Harmonization", "Longitudinal"],
  },
  {
    id: "R61MH135106",
    shortName: "Suthana – Human Biomarkers",
    pi: "Nanthia Suthana",
    allPIs: ["Suthana, Nanthia A."],
    species: "Humans",
    institution: "University of California Los Angeles",
    color: "#ef9a9a",
    computational: [
      "Approach-avoidance behavior",
      "Peripheral biomarker integration",
    ],
    algorithmic: [
      "Biomarker synchronization algorithms",
      "Real-world spatial navigation models",
    ],
    implementation: [
      "Mobile EEG / iEEG",
      "Wearable cortisol sensors",
      "GPS trackers",
      "Smartphones",
    ],
    dataModalities: ["Neural (iEEG)", "Physiological (Wearables)", "Behavioral (GPS/Mobility)"],
    experimentalApproaches: ["Real-world navigation", "Ambulatory biomarker recording"],
    keywords: ["Biomarkers", "iEEG", "Cortisol", "Real-world navigation", "Wearables"],
  },
  {
    id: "R61MH135109",
    shortName: "Inman – CAPTURE",
    pi: "Cory Inman",
    allPIs: ["Inman, Cory S."],
    species: "Humans",
    institution: "University of Utah",
    color: "#ffab91",
    computational: [
      "Autobiographical memory formation",
      "Episodic encoding in real-world contexts",
    ],
    algorithmic: [
      "Contextual alignment algorithms",
      "Episodic chunking",
      "Memory encoding analysis",
    ],
    implementation: [
      "CAPTURE smartphone app",
      "Wearable AV cameras",
      "GPS trackers",
      "Ambulatory iEEG telemetry",
    ],
    dataModalities: ["Neural (iEEG)", "Video / Audio (Wearable)", "Location (GPS)"],
    experimentalApproaches: ["Real-world memory recording", "Ambulatory multimodal capture"],
    keywords: ["Autobiographical memory", "CAPTURE app", "iEEG", "Wearables", "Real-world spaces"],
  },
  {
    id: "R61MH135114",
    shortName: "Welsh – OPM-MEG",
    pi: "John Welsh",
    allPIs: ["Welsh, John P", "Roberts, Timothy P."],
    species: "Humans (Pediatric)",
    institution: "Seattle Children's Hospital",
    color: "#b0bec5",
    computational: [
      "Motor control in neurodevelopment",
      "Cognitive function in pediatric populations",
    ],
    algorithmic: [
      "Motion artifact removal algorithms",
      "Robust source localization in moving subjects",
      "Dynamic movement compensation",
    ],
    implementation: [
      "Optically Pumped Magnetometers (OPM-MEG)",
      "Movement trackers",
      "Pediatric-friendly scanning environments",
    ],
    dataModalities: ["Neural (OPM-MEG)", "Kinematic (Movement tracking)"],
    experimentalApproaches: ["Neurodevelopmental screening", "High-movement tolerance scanning"],
    keywords: ["OPM-MEG", "Pediatric", "Intellectual disability", "Motion tracking", "Artifact removal"],
  },
  {
    id: "R61MH135405",
    shortName: "Jacobs – CAMERA Platform",
    pi: "Joshua Jacobs",
    allPIs: ["Jacobs, Joshua", "Ortiz, Jorge", "Widge, Alik S", "Youngerman, Brett E."],
    species: "Humans",
    institution: "Columbia University Health Sciences",
    color: "#e57373",
    computational: [
      "Anxiety-memory state prediction",
      "Ecological stressor navigation",
    ],
    algorithmic: [
      "Continuous state prediction models",
      "Context-aware machine learning",
    ],
    implementation: [
      "CAMERA Platform",
      "Integrated wearables",
      "Contextual sensors",
      "Smartphone EMA",
    ],
    dataModalities: ["Physiological (Wearables)", "Contextual / Environmental", "Self-report (EMA)"],
    experimentalApproaches: ["Ecological momentary assessment (EMA)", "Real-world continuous measurement"],
    keywords: ["CAMERA Platform", "Anxiety", "Memory State", "Ecological Assessment", "Continuous Measurement"],
  },
  {
    id: "R61MH135407",
    shortName: "Shanechi – Mental States",
    pi: "Maryam Shanechi",
    allPIs: ["Shanechi, Maryam"],
    species: "Humans",
    institution: "University of Southern California",
    color: "#f48fb1",
    computational: [
      "Internal state regulation",
      "Behavioral adaptation",
    ],
    algorithmic: [
      "Dynamical modeling of nonlinear latent factors",
      "Advanced ML for mental state decoding",
    ],
    implementation: [
      "Novel multimodal sensing suites",
      "Multimodal synchronized logging",
    ],
    dataModalities: ["Neural", "Physiological", "Behavioral"],
    experimentalApproaches: ["Mental state decoding", "Multimodal sensing integration"],
    keywords: ["Mental states", "Nonlinear latent factors", "Multimodal sensing", "Machine learning"],
  },
  {
    id: "R61MH138966",
    shortName: "Rozell – Effort-Based DM",
    pi: "Christopher Rozell",
    allPIs: ["Rozell, Christopher John"],
    species: "Humans",
    institution: "Georgia Institute of Technology",
    color: "#bcaaa4",
    computational: [
      "Effort-based decision making",
      "Resource allocation and cost-benefit",
    ],
    algorithmic: [
      "Neuroeconomic modeling",
      "Computational algorithms of effort and reward",
    ],
    implementation: [
      "Multimodal brain-body platform",
      "Kinematic trackers",
      "Physiological monitors",
      "Physical exertion stations",
    ],
    dataModalities: ["Neural", "Kinematic (Body signals)", "Physiological"],
    experimentalApproaches: ["Physical exertion paradigms", "Effort-based decision tasks"],
    keywords: ["Effort-based decision making", "Brain-body interactions", "Physical exertion", "Neuroeconomics"],
  },
  {
    id: "R61MH138713",
    shortName: "Lenartowicz – Attention States",
    pi: "Agatha Lenartowicz",
    allPIs: ["Ertin, Emre", "Grammer, Jennie K.", "Lenartowicz, Agatha"],
    species: "Humans",
    institution: "University of California Los Angeles",
    color: "#80cbc4",
    computational: [
      "Attention state modeling",
      "Privacy-preserving environmental monitoring",
    ],
    algorithmic: [
      "Sensor fusion algorithms",
      "Oscillatory dynamics-spatial tracking bridge",
    ],
    implementation: [
      "Privacy-preserving LiDAR",
      "Millimeter wave (mmWave) sensing",
      "Neural oscillation recorders (EEG)",
    ],
    dataModalities: ["Neural (EEG)", "Physiological", "Spatial (LiDAR/mmWave)"],
    experimentalApproaches: ["Privacy-preserving naturalistic tracking", "Attention state monitoring"],
    keywords: ["LiDAR", "Millimeter wave", "Attention states", "Neural oscillations", "Privacy-preserving"],
  },
  {
    id: "R61MH138705",
    shortName: "Hirsch – Face-to-Face",
    pi: "Joy Hirsch",
    allPIs: ["Hirsch, Joy"],
    species: "Humans",
    institution: "Yale University",
    color: "#ffab40",
    computational: [
      "Live social interaction",
      "Facial communication and empathy",
    ],
    algorithmic: [
      "Real-time facial keypoint extraction",
      "Neural synchronization analysis",
      "Non-linear spatial transformations",
    ],
    implementation: [
      "High-resolution facial tracking arrays",
      "Neural monitoring",
      "Synchronous face-brain capture",
    ],
    dataModalities: ["Video (Facial)", "Neural"],
    experimentalApproaches: ["Live face-to-face dyadic interaction", "Micro-dynamic quantification"],
    keywords: ["Face-to-face interactions", "Facial keypoint extraction", "Social coupling", "Micro-dynamics"],
  },
  {
    id: "1U01DA063534",
    shortName: "Chang – Marmoset Social",
    pi: "Steve Chang",
    allPIs: ["Chang, Steve W. C.", "Jadi, Monika P.", "Nandy, Anirvan S.", "Saxena, Shreya"],
    species: "Marmosets",
    institution: "Yale University",
    color: "#ffe082",
    computational: [
      "Multi-agent social dynamics",
      "Cooperative foraging",
      "Physical constraint navigation",
    ],
    algorithmic: [
      "Multi-Agent RNNs",
      "Dynamic Bayesian Networks",
      "Embodied Agent-Based Models",
    ],
    implementation: [
      "Neural arrays",
      "Musculoskeletal physical tracking",
      "Naturalistic primate arenas",
    ],
    dataModalities: ["Behavioral (Musculoskeletal tracking)", "Neural"],
    experimentalApproaches: ["Naturalistic cooperation and competition tasks", "Multi-agent interaction"],
    keywords: ["Marmosets", "Cooperation", "Competition", "Recurrent Neural Networks", "Embodied framework"],
  },
  {
    id: "U24MH136628",
    shortName: "BARD.CC",
    pi: "Satrajit Ghosh",
    allPIs: ["Ghosh, Satrajit", "Cabrera, Laura", "Kennedy, David N."],
    species: "All Species (Infrastructure)",
    institution: "Massachusetts Institute of Technology",
    color: "#42a5f5",
    computational: [
      "Consortium scalability",
      "Cross-species translation",
    ],
    algorithmic: [
      "Federated ML/AI infrastructure",
      "Knowledge graphs (BrainKB)",
      "Metadata harmonization pipelines",
      "StructSense 2.0 extraction",
    ],
    implementation: [
      "Cloud-based ecosystems",
      "Distributed compute clusters",
      "BrainKB",
      "Neuro Model Context Protocols",
    ],
    dataModalities: ["Multi-modal (Aggregated across consortium)"],
    experimentalApproaches: ["Data coordination", "Infrastructure development", "Ontology building"],
    keywords: ["BARD.CC", "Federated ML", "Data Coordinating Center", "BrainKB", "Infrastructure"],
  },
  {
    id: "R24MH136632",
    shortName: "EMBER",
    pi: "Brock Wester",
    allPIs: ["Wester, Brock A."],
    species: "All Species (Infrastructure)",
    institution: "Johns Hopkins University",
    color: "#66bb6a",
    computational: [
      "Scientific reproducibility",
      "Unified mechanism discovery",
    ],
    algorithmic: [
      "Unified ontologies (NBO, HED, NWB)",
      "Data schema mapping",
      "JSON validation",
    ],
    implementation: [
      "Hybrid data archive",
      "Secure cloud-based sandboxes",
      "NWB",
      "BIDS",
    ],
    dataModalities: ["Multi-modal (Aggregated across consortium)"],
    experimentalApproaches: ["Data archiving", "Ontology standardization"],
    keywords: ["EMBER", "Data Archive", "NWB", "Ontologies", "Reproducibility"],
  },
];

// Build connection matrix based on shared Marr-level features
export function buildConnectionMatrix(
  projects: MarrProject[],
  level: "computational" | "algorithmic" | "implementation" | "all"
): number[][] {
  const n = projects.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let shared = 0;

      if (level === "computational" || level === "all") {
        shared += countOverlap(projects[i].computational, projects[j].computational);
      }
      if (level === "algorithmic" || level === "all") {
        shared += countOverlap(projects[i].algorithmic, projects[j].algorithmic);
      }
      if (level === "implementation" || level === "all") {
        shared += countOverlap(projects[i].implementation, projects[j].implementation);
      }

      matrix[i][j] = shared;
      matrix[j][i] = shared;
    }
  }

  return matrix;
}

function countOverlap(a: string[], b: string[]): number {
  const normalize = (s: string) => s.toLowerCase().trim();
  const setA = new Set(a.map(normalize));
  return b.filter(item => setA.has(normalize(item))).length;
}

// Get all unique features for a given Marr level
export function getUniqueFeatures(
  projects: MarrProject[],
  level: "computational" | "algorithmic" | "implementation"
): string[] {
  const features = new Set<string>();
  for (const p of projects) {
    for (const f of p[level]) {
      features.add(f);
    }
  }
  return [...features].sort();
}
