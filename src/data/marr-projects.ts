// BBQS project data mapped to Marr's three levels of analysis
// Computational: What problem is being solved?
// Algorithmic: What approaches/algorithms are used?
// Implementation: What specific tools/software are used?

export interface MarrProject {
  id: string;
  shortName: string;
  pi: string;
  species: string;
  color: string;
  computational: string[];   // What problem
  algorithmic: string[];     // What approach
  implementation: string[];  // What tool
}

export const MARR_PROJECTS: MarrProject[] = [
  {
    id: "R34DA059510",
    shortName: "Dyer – Cichlid Arena",
    pi: "Eva Dyer",
    species: "Cichlid",
    color: "#4fc3f7",
    computational: [
      "Multi-animal social behavior quantification",
      "Species differentiation",
      "Hierarchical social structure",
    ],
    algorithmic: [
      "Pose estimation",
      "Object detection",
      "Feature extraction",
      "Graph modeling",
      "Self-supervised learning",
      "Dimensionality reduction",
    ],
    implementation: [
      "DeepLabCut",
      "Computer vision networks",
      "PCA",
      "UMAP",
    ],
  },
  {
    id: "R34DA059509",
    shortName: "Grover – Mouse Multimodal",
    pi: "Pulkit Grover",
    species: "Mouse",
    color: "#81c784",
    computational: [
      "Behavioral segmentation",
      "Stress response quantification",
      "Gut-brain axis",
    ],
    algorithmic: [
      "Pose estimation",
      "Physiological signal analysis",
      "Active learning",
      "Multimodal classification",
    ],
    implementation: [
      "SLEAP",
      "KiloSort3",
      "A-SOID",
      "Neuropixels",
    ],
  },
  {
    id: "R34DA059513",
    shortName: "Sanes – Gerbil Vocal",
    pi: "Dan Sanes",
    species: "Gerbil",
    color: "#ffb74d",
    computational: [
      "Vocal attribution in multi-animal environments",
      "Social communication",
      "Neural-behavioral coupling",
    ],
    algorithmic: [
      "Pose estimation",
      "Source localization",
      "Deep learning",
      "Signal processing",
      "Encoding models",
      "Decoding models",
    ],
    implementation: [
      "SLEAP",
      "DeepSqueak",
      "Python",
      "Wireless neural recorders",
    ],
  },
  {
    id: "R34DA059507",
    shortName: "Aflatouni – Cowbird Aviary",
    pi: "Firooz Aflatouni",
    species: "Cowbird",
    color: "#ce93d8",
    computational: [
      "Multi-animal social behavior quantification",
      "Social communication",
      "Social network analysis",
    ],
    algorithmic: [
      "Pose estimation",
      "Object detection",
      "Source localization",
      "Social network analysis",
      "Dimensionality reduction",
    ],
    implementation: [
      "Computer vision networks",
      "RFID",
      "Machine learning",
      "PCA",
      "UMAP",
    ],
  },
  {
    id: "R34DA059718",
    shortName: "Padilla – Mouse Social Motifs",
    pi: "Nancy Padilla Coreano",
    species: "Mouse",
    color: "#f06292",
    computational: [
      "Social behavior motif discovery",
      "Autonomic-behavioral coupling",
    ],
    algorithmic: [
      "Pose estimation",
      "Physiological signal analysis",
      "Deep learning",
      "Hierarchical clustering",
      "Dimensionality reduction",
      "Dynamical systems modeling",
    ],
    implementation: [
      "So-Mo",
      "Multimodal autoencoder",
      "Neural networks",
      "PCA",
      "UMAP",
    ],
  },
  {
    id: "R34DA059506",
    shortName: "Dunn – 3D Social Tracking",
    pi: "Timothy Dunn",
    species: "Rats/Mice",
    color: "#a1887f",
    computational: [
      "3D social behavior quantification",
      "Multi-animal pose reconstruction",
    ],
    algorithmic: [
      "Pose estimation",
      "Deep learning",
      "Behavioral segmentation",
      "Dimensionality reduction",
      "Bayesian inference",
      "Dynamical systems modeling",
    ],
    implementation: [
      "Deep neural network (3D)",
      "Python",
      "PCA",
      "UMAP",
    ],
  },
  {
    id: "R34DA059512",
    shortName: "Dunn – 3D Prey Capture",
    pi: "Timothy Dunn",
    species: "Mouse",
    color: "#90a4ae",
    computational: [
      "Ecological behavior quantification",
      "Prey capture kinematics",
      "Disease phenotyping",
    ],
    algorithmic: [
      "Pose estimation",
      "Deep learning",
      "3D reconstruction",
    ],
    implementation: [
      "Convolutional neural network",
      "Python",
      "Multi-camera sync",
    ],
  },
  {
    id: "R34DA059716",
    shortName: "Corcoran – Human Dyadic",
    pi: "Cheryl Corcoran",
    species: "Human",
    color: "#4db6ac",
    computational: [
      "Interpersonal synchrony",
      "Emotion recognition",
      "Social communication",
    ],
    algorithmic: [
      "Facial expression analysis",
      "EEG hyperscanning",
      "Signal processing",
      "Network analysis",
      "Correlation analysis",
    ],
    implementation: [
      "PRAAT",
      "OpenSmile",
      "HUME-AI",
      "Tobii Glasses",
      "EEG",
    ],
  },
  {
    id: "R34DA059723",
    shortName: "Shepherd – Food Handling",
    pi: "Gordon Shepherd",
    species: "Mouse",
    color: "#dce775",
    computational: [
      "Fine motor coordination",
      "Sub-movement assembly",
      "Oromanual behavior",
    ],
    algorithmic: [
      "Pose estimation",
      "Physiological signal analysis",
      "EMG analysis",
    ],
    implementation: [
      "DeepLabCut",
      "EMG recording",
      "Intranasal thermistor",
    ],
  },
  {
    id: "R34DA059514",
    shortName: "Kemere – Sheep Flocking",
    pi: "Caleb Kemere",
    species: "Sheep",
    color: "#fff176",
    computational: [
      "Collective behavior quantification",
      "Internal state dynamics",
      "Field neuroscience",
    ],
    algorithmic: [
      "Signal processing",
      "Dimensionality reduction",
      "Dynamical systems modeling",
      "Behavioral prediction",
    ],
    implementation: [
      "Python",
      "GPS",
      "Wireless neural (implanted)",
      "SpikeGadgets",
    ],
  },
  {
    id: "R34DA059500",
    shortName: "Nagel – Navigation Imaging",
    pi: "Katherine Nagel",
    species: "Zebrafish/Fly",
    color: "#80deea",
    computational: [
      "Navigation in complex environments",
      "Stimulus-guided behavior",
      "Neural activity mapping",
    ],
    algorithmic: [
      "Pose estimation",
      "Neural activity modeling",
      "Physical modeling",
    ],
    implementation: [
      "Bioluminescent indicators",
      "Real-time tracking",
      "Custom apparatus",
    ],
  },
  {
    id: "R34DA061984",
    shortName: "Srivastava – Worm Env.",
    pi: "Mansi Srivastava",
    species: "Acoel Worm",
    color: "#c5e1a5",
    computational: [
      "Organism-environment interaction",
      "Regeneration behavior",
    ],
    algorithmic: [
      "Pose estimation",
      "Behavioral segmentation",
      "Synchronization",
      "Dimensionality reduction",
    ],
    implementation: [
      "DeepLabCut",
      "SLEAP",
      "Cellpose",
    ],
  },
  {
    id: "R34DA061924",
    shortName: "Zhang – Ferret Social",
    pi: "Mengsen Zhang",
    species: "Ferret",
    color: "#b39ddb",
    computational: [
      "Multi-scale neural-behavioral mapping",
      "Social interaction dynamics",
    ],
    algorithmic: [
      "Pose estimation",
      "Topological time series analysis",
      "Network analysis",
      "Cross-scale mapping",
      "Dimensionality reduction",
      "Dynamical systems modeling",
    ],
    implementation: [
      "DeepLabCut",
      "Accelerometers",
      "Electrophysiology",
    ],
  },
  {
    id: "R34DA061925",
    shortName: "Flagel – Capuchin AI Forest",
    pi: "Shelly Flagel",
    species: "Capuchin Monkey",
    color: "#ffcc80",
    computational: [
      "Wild primate behavior quantification",
      "Automated field data collection",
      "Social communication",
    ],
    algorithmic: [
      "Deep learning",
      "Pose estimation",
      "Bayesian inference",
      "Network analysis",
    ],
    implementation: [
      "Visual DL (individual ID)",
      "Vocal DL",
      "Smart testing stations",
    ],
  },
  {
    id: "R61MH135106",
    shortName: "Suthana – Human Biomarkers",
    pi: "Nanthia Suthana",
    species: "Human",
    color: "#ef9a9a",
    computational: [
      "Stress response quantification",
      "Approach-avoidance behavior",
      "Neural-peripheral coupling",
    ],
    algorithmic: [
      "Signal processing",
      "Decoding models",
      "Dimensionality reduction",
      "Dynamical systems modeling",
    ],
    implementation: [
      "iEEG",
      "Cortisol wearable",
      "VR/AR",
      "PCA",
      "UMAP",
    ],
  },
  {
    id: "R61MH135405",
    shortName: "Jacobs – CAMERA Platform",
    pi: "Joshua Jacobs",
    species: "Human",
    color: "#e57373",
    computational: [
      "Anxiety-memory state prediction",
      "Ecological momentary assessment",
      "Neural-behavioral coupling",
    ],
    algorithmic: [
      "Deep learning",
      "Facial expression analysis",
      "Physiological signal analysis",
      "Signal processing",
      "Encoding models",
      "Decoding models",
      "Bayesian inference",
    ],
    implementation: [
      "BCI2000",
      "iEEG",
      "Empatica EmbracePlus",
      "NLP",
      "Deep learning models",
    ],
  },
  {
    id: "R61MH135407",
    shortName: "Shanechi – Mental States",
    pi: "Maryam Shanechi",
    species: "Human",
    color: "#f48fb1",
    computational: [
      "Mental state estimation",
      "Emotion recognition",
      "Neural-behavioral coupling",
    ],
    algorithmic: [
      "Deep learning",
      "Facial expression analysis",
      "Physiological signal analysis",
      "Multimodal classification",
    ],
    implementation: [
      "iEEG",
      "Wearable skin-like sensor",
      "Multimodal RNN",
      "Virtual conversational agents",
    ],
  },
  {
    id: "R61MH138966",
    shortName: "Rozell – Effort-Based DM",
    pi: "Christopher Rozell",
    species: "Human",
    color: "#bcaaa4",
    computational: [
      "Effort-based decision making",
      "Brain-body interaction modeling",
    ],
    algorithmic: [
      "Latent variable modeling",
      "Dynamical systems modeling",
      "Multimodal classification",
    ],
    implementation: [
      "VR/AR",
      "Deep brain stimulation",
      "iEEG",
    ],
  },
  {
    id: "R61MH138713",
    shortName: "Lenartowicz – Attention States",
    pi: "Agatha Lenartowicz",
    species: "Human",
    color: "#80cbc4",
    computational: [
      "Attention state modeling",
      "Privacy-preserving sensing",
    ],
    algorithmic: [
      "Physiological signal analysis",
      "Encoding models",
      "Decoding models",
      "Deep learning",
      "Network analysis",
      "Signal processing",
    ],
    implementation: [
      "EEG",
      "LiDAR",
      "Millimeter wave sensing",
    ],
  },
  {
    id: "1U01DA063534",
    shortName: "Chang – Marmoset Social",
    pi: "Steve Chang",
    species: "Marmoset",
    color: "#ffe082",
    computational: [
      "Multi-animal social behavior quantification",
      "Cooperation and competition modeling",
    ],
    algorithmic: [
      "Reinforcement learning",
      "Dynamic Bayesian networks",
      "Dynamical systems modeling",
      "Encoding models",
      "Decoding models",
      "Network analysis",
    ],
    implementation: [
      "Multi-agent RL",
      "RNN",
      "Musculoskeletal models",
    ],
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
