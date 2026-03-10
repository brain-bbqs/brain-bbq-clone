// Cross-project synergy links extracted from the BBQS MARR-aligned YAML
// Each link represents an explicit cross_project_synergy reference
// Auto-synced from public/bbqs_marr.yaml

export interface SynergyNode {
  id: string;
  shortName: string;
  pi: string;
  species: string;
  color: string;
  grantType: "R34" | "R61" | "U01" | "U24" | "R24";
  l1Goal: string;
}

export interface SynergyLink {
  source: string;
  target: string;
  description: string;
  synergyType: "algorithmic" | "hardware" | "data" | "theoretical" | "infrastructure";
}

export const SYNERGY_NODES: SynergyNode[] = [
  { id: "R34DA059510", shortName: "Dyer – Arena", pi: "Eva Dyer", species: "Fish (Cichlids)", color: "#4fc3f7", grantType: "R34", l1Goal: "Social reproductive behaviors & hierarchical status" },
  { id: "R34DA059509", shortName: "Grover – Multimodal", pi: "Pulkit Grover", species: "Mice", color: "#81c784", grantType: "R34", l1Goal: "Adaptive behavior & state-dependent responses" },
  { id: "R34DA059513", shortName: "Sanes – Vocal", pi: "Dan Sanes", species: "Rodents (Gerbils/Mice)", color: "#ffb74d", grantType: "R34", l1Goal: "Vocal communication & social signaling" },
  { id: "R34DA059507", shortName: "Aflatouni – Aviary", pi: "Firooz Aflatouni", species: "Gregarious Songbirds", color: "#ce93d8", grantType: "R34", l1Goal: "Social communication & flocking dynamics" },
  { id: "R34DA059718", shortName: "Padilla – Motifs", pi: "Nancy Padilla Coreano", species: "Mice", color: "#f06292", grantType: "R34", l1Goal: "Social behavior motif generation & biological rhythms" },
  { id: "R34DA059506", shortName: "Dunn – 3D Social", pi: "Timothy Dunn", species: "Rats", color: "#a1887f", grantType: "R34", l1Goal: "Precise social behavior & deep phenotyping" },
  { id: "R34DA059512", shortName: "Dunn – Prey", pi: "Timothy Dunn", species: "Rodents", color: "#90a4ae", grantType: "R34", l1Goal: "Navigation & survival in dynamic environments" },
  { id: "R34DA059716", shortName: "Corcoran – Dyadic", pi: "Cheryl Corcoran", species: "Humans", color: "#4db6ac", grantType: "R34", l1Goal: "Interpersonal synchrony & turn-taking" },
  { id: "R34DA059723", shortName: "Shepherd – Food", pi: "Gordon Shepherd", species: "Mice", color: "#dce775", grantType: "R34", l1Goal: "Foraging & fine motor manipulation" },
  { id: "R34DA059514", shortName: "Kemere – Sheep", pi: "Caleb Kemere", species: "Sheep", color: "#fff176", grantType: "R34", l1Goal: "Collective behavior & herd navigation" },
  { id: "R34DA059500", shortName: "Nagel – Navigation", pi: "Katherine Nagel", species: "Drosophila / Zebrafish", color: "#80deea", grantType: "R34", l1Goal: "Spatial navigation & sensory integration" },
  { id: "R34DA061984", shortName: "Srivastava – Worm", pi: "Mansi Srivastava", species: "Hofstenia miamia", color: "#c5e1a5", grantType: "R34", l1Goal: "Organism-environment interactions" },
  { id: "R34DA061924", shortName: "Zhang – Ferret", pi: "Mengsen Zhang", species: "Ferrets / Rodents", color: "#b39ddb", grantType: "R34", l1Goal: "Social phase transitions & group dynamics" },
  { id: "R34DA061925", shortName: "Flagel – AI Forest", pi: "Shelly Flagel", species: "Wild Primates", color: "#ffcc80", grantType: "R34", l1Goal: "Wild primate behavior quantification" },
  { id: "R34DA062119", shortName: "Wilbrecht – IDP", pi: "Linda Wilbrecht", species: "Mice", color: "#e0e0e0", grantType: "R34", l1Goal: "Experience-dependent neurodevelopment" },
  { id: "R61MH135106", shortName: "Suthana – Biomarkers", pi: "Nanthia Suthana", species: "Humans", color: "#ef9a9a", grantType: "R61", l1Goal: "Approach-avoidance & spatial navigation" },
  { id: "R61MH135109", shortName: "Inman – CAPTURE", pi: "Cory Inman", species: "Humans", color: "#ffab91", grantType: "R61", l1Goal: "Autobiographical memory formation" },
  { id: "R61MH135114", shortName: "Welsh – OPM-MEG", pi: "John Welsh", species: "Humans (Pediatric)", color: "#b0bec5", grantType: "R61", l1Goal: "Motor control in neurodevelopment" },
  { id: "R61MH135405", shortName: "Jacobs – CAMERA", pi: "Joshua Jacobs", species: "Humans", color: "#e57373", grantType: "R61", l1Goal: "Anxiety & memory state prediction" },
  { id: "R61MH135407", shortName: "Shanechi – Mental", pi: "Maryam Shanechi", species: "Humans", color: "#f48fb1", grantType: "R61", l1Goal: "Mental state estimation & emotion" },
  { id: "R61MH138966", shortName: "Rozell – Effort DM", pi: "Christopher Rozell", species: "Humans", color: "#bcaaa4", grantType: "R61", l1Goal: "Effort-based decision making" },
  { id: "R61MH138713", shortName: "Lenartowicz – Attn", pi: "Agatha Lenartowicz", species: "Humans", color: "#80cbc4", grantType: "R61", l1Goal: "Attention state modeling" },
  { id: "R61MH138705", shortName: "Hirsch – Face", pi: "Joy Hirsch", species: "Humans", color: "#ffab40", grantType: "R61", l1Goal: "Live face-to-face interactions" },
  { id: "1U01DA063534", shortName: "Chang – Marmoset", pi: "Steve Chang", species: "Marmosets", color: "#ffe082", grantType: "U01", l1Goal: "Naturalistic cooperation & competition" },
  { id: "U24MH136628", shortName: "BARD.CC", pi: "Satrajit Ghosh", species: "Infrastructure", color: "#42a5f5", grantType: "U24", l1Goal: "Consortium scalability & cross-species translation" },
  { id: "R24MH136632", shortName: "EMBER", pi: "Brock Wester", species: "Infrastructure", color: "#66bb6a", grantType: "R24", l1Goal: "Scientific reproducibility & data harmonization" },
];

export const SYNERGY_LINKS: SynergyLink[] = [
  // From YAML cross_project_synergy fields
  { source: "R34DA059510", target: "R34DA061925", description: "Evolutionary modeling of social states baseline for AI Forest", synergyType: "theoretical" },
  { source: "R34DA059509", target: "R61MH135405", description: "Active learning loops optimize continuous monitoring in CAMERA platform", synergyType: "algorithmic" },
  { source: "R34DA059513", target: "R34DA059507", description: "Source attribution algorithms translatable to smart aviary", synergyType: "algorithmic" },
  { source: "R34DA059507", target: "R34DA061925", description: "3D kinematic tracking translates to AI Forest for wild primates", synergyType: "hardware" },
  { source: "R34DA059718", target: "R61MH135106", description: "Cross-species modeling of internal states via autonomic rhythms", synergyType: "theoretical" },
  { source: "R34DA059506", target: "R24MH136632", description: "Foundational validation dataset for EMBER behavioral ontologies (NBO)", synergyType: "data" },
  { source: "R34DA059512", target: "R61MH135106", description: "Dynamic environment algorithms aid human real-world navigation", synergyType: "algorithmic" },
  { source: "R34DA059716", target: "1U01DA063534", description: "EEG hyperscanning vs marmoset multi-agent RNN for turn-taking", synergyType: "algorithmic" },
  { source: "R34DA059723", target: "1U01DA063534", description: "Oromanual kinematics test case for embodied musculoskeletal frameworks", synergyType: "theoretical" },
  { source: "R34DA059514", target: "R61MH135106", description: "Hardware constraints & spatial algorithms inform human navigation", synergyType: "hardware" },
  { source: "R34DA059500", target: "R61MH135106", description: "Highest-resolution L3 data validates broader navigation algorithms", synergyType: "hardware" },
  { source: "R34DA061984", target: "U24MH136628", description: "Testing BARD.CC ability to handle novel metadata schemas", synergyType: "infrastructure" },
  { source: "R34DA061984", target: "R24MH136632", description: "Testing EMBER ability to handle novel ontologies", synergyType: "infrastructure" },
  { source: "R34DA061924", target: "1U01DA063534", description: "Multi-scale dynamic systems algorithms directly comparable", synergyType: "algorithmic" },
  { source: "R34DA061925", target: "1U01DA063534", description: "Stress-test laboratory algorithms for real-world robustness", synergyType: "algorithmic" },
  { source: "R34DA062119", target: "U24MH136628", description: "Data standardization alignment with BARD.CC", synergyType: "infrastructure" },
  { source: "R34DA062119", target: "R24MH136632", description: "Data standardization alignment with EMBER", synergyType: "infrastructure" },
  { source: "R61MH135106", target: "R34DA059718", description: "Human L3 validation for autonomic rhythm behavioral segmentation", synergyType: "theoretical" },
  { source: "R61MH135109", target: "U24MH136628", description: "Unstructured GPS/AV data stress-test for BARD.CC federation", synergyType: "data" },
  { source: "R61MH135114", target: "R61MH135106", description: "Motion-correction algorithms inform mobile EEG/iEEG pipelines", synergyType: "algorithmic" },
  { source: "R61MH135114", target: "R61MH135109", description: "Motion-correction algorithms inform mobile iEEG pipelines", synergyType: "algorithmic" },
  { source: "R61MH135405", target: "R61MH135109", description: "CAMERA platform algorithms cross-pollinated with CAPTURE app", synergyType: "algorithmic" },
  { source: "R61MH135407", target: "1U01DA063534", description: "Nonlinear latent extraction maps to marmoset continuous latents", synergyType: "algorithmic" },
  { source: "R61MH138966", target: "R34DA059723", description: "Foraging & resource allocation shared with oromanual food-handling", synergyType: "theoretical" },
  { source: "R61MH138713", target: "R34DA059507", description: "mmWave/LiDAR could track behavior in visually occluded environments", synergyType: "hardware" },
  { source: "R61MH138705", target: "R34DA059716", description: "Methodological overlap in dyadic interaction analysis", synergyType: "algorithmic" },
  { source: "R61MH138705", target: "1U01DA063534", description: "Facial keypoint extraction parallels marmoset social dynamics", synergyType: "algorithmic" },
  { source: "1U01DA063534", target: "R34DA059716", description: "Social latent extraction translated to human dyadic models", synergyType: "algorithmic" },
  { source: "U24MH136628", target: "R24MH136632", description: "BARD computes on data structured by EMBER", synergyType: "infrastructure" },
  { source: "R24MH136632", target: "U24MH136628", description: "EMBER structures data; BARD.CC computes on it", synergyType: "infrastructure" },
];

export const SYNERGY_TYPE_COLORS: Record<SynergyLink["synergyType"], string> = {
  algorithmic: "hsl(210, 70%, 55%)",
  hardware: "hsl(30, 80%, 55%)",
  data: "hsl(140, 60%, 45%)",
  theoretical: "hsl(280, 60%, 60%)",
  infrastructure: "hsl(0, 0%, 55%)",
};

export const GRANT_TYPE_SHAPES: Record<SynergyNode["grantType"], string> = {
  R34: "circle",
  R61: "diamond",
  U01: "star",
  U24: "square",
  R24: "square",
};
