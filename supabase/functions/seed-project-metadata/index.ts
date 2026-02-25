import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extracted from BBQS_Computational_Landscape_Synthesis_1.pdf + NIH Reporter data
const PROJECT_METADATA = [
  {
    grant_number: "R34DA059512",
    study_species: ["Mouse", "Cricket"],
    use_approaches: ["Computer Vision", "Kinematic Tracking", "3D Reconstruction"],
    use_analysis_method: ["3D Convolutional Neural Networks", "Spatiotemporal tracking"],
    produce_data_modality: ["Multi-camera video", "3D coordinates"],
    use_sensors: ["Multi-camera arrays"],
    keywords: ["predator-prey dynamics", "3D tracking", "multi-perspective video"],
    metadata: { ethological_goals: ["Physical state estimation", "Predator-prey dynamics"], neural_network_architecture: "3D CNN", methodological_category: "Computer Vision & Kinematics" },
  },
  {
    grant_number: "R34DA059506",
    study_species: ["Rat", "Mouse"],
    use_approaches: ["Computer Vision", "3D Multi-Animal Tracking"],
    use_analysis_method: ["Deep Neural Networks", "Multi-camera fusion"],
    produce_data_modality: ["Multi-camera video", "3D coordinates"],
    use_sensors: ["Multi-camera arrays"],
    keywords: ["social interaction", "close-contact behavior", "3D tracking", "visual occlusion"],
    metadata: { ethological_goals: ["Close-contact social interaction quantification"], neural_network_architecture: "DNN (Multi-Animal 3D)", methodological_category: "Computer Vision & Kinematics" },
  },
  {
    grant_number: "R34DA059507",
    study_species: ["Cowbird"],
    use_approaches: ["Computer Vision", "3D Articulated Mesh Models", "Social Network Analysis", "Behavioral Segmentation"],
    use_analysis_method: ["ANNs with articulated mesh", "Social network mathematical models"],
    produce_data_modality: ["Multi-camera video", "3D pose", "Neural recordings"],
    use_sensors: ["Multi-camera arrays", "Wireless neural recorders"],
    keywords: ["flocking", "mating behavior", "hierarchy", "group cohesion", "articulated mesh"],
    metadata: { ethological_goals: ["Flocking and mating behavior", "Hierarchy and group cohesion"], neural_network_architecture: "ANN + Articulated Mesh", methodological_category: "Computer Vision & Kinematics" },
  },
  {
    grant_number: "R34DA061925",
    study_species: ["Capuchin Monkey"],
    use_approaches: ["Computer Vision", "Deep Learning", "Acoustic Attribution"],
    use_analysis_method: ["Visual deep-learning algorithms", "Vocal deep-learning algorithms"],
    produce_data_modality: ["Video", "Audio recordings"],
    use_sensors: ["Camera traps", "Smart testing stations", "Microphone arrays"],
    keywords: ["wild primates", "foraging", "reward valuation", "threat detection", "group cohesion"],
    metadata: { ethological_goals: ["Reward valuation", "Foraging behavior", "Threat detection", "Group cohesion"], methodological_category: "Computer Vision & Kinematics / Acoustic Attribution" },
  },
  {
    grant_number: "R34DA059723",
    study_species: ["Mouse"],
    use_approaches: ["Computer Vision", "Kinematic Tracking", "AI-Based Tracking"],
    use_analysis_method: ["AI kinematic tracking models"],
    produce_data_modality: ["High-speed video", "Kinematic data"],
    use_sensors: ["High-speed cameras"],
    keywords: ["oromanual food-handling", "fine motor behavior", "sub-movements", "visual occlusion"],
    metadata: { ethological_goals: ["Oromanual food-handling tracking"], methodological_category: "Computer Vision & Kinematics" },
  },
  {
    grant_number: "R34DA059718",
    study_species: ["Mouse"],
    use_approaches: ["Behavioral Segmentation", "Semi-Supervised Learning", "Multimodal Integration"],
    use_analysis_method: ["Semi-Supervised Hierarchical Multi-Timescale Models (So-Mo)", "Spatiotemporal motif extraction"],
    produce_data_modality: ["Video", "Breathing signals", "Heart rate"],
    use_sensors: ["Video cameras", "Autonomic sensors"],
    keywords: ["affiliative behavior", "agonistic interaction", "biological rhythms", "social motifs"],
    metadata: { ethological_goals: ["Affiliative vs. agonistic interaction", "Behavioral segmentation"], neural_network_architecture: "So-Mo (Hierarchical Multi-Timescale)", methodological_category: "Behavioral Segmentation" },
  },
  {
    grant_number: "R34DA061924",
    study_species: ["Ferret"],
    use_approaches: ["Behavioral Segmentation", "Topological Analysis"],
    use_analysis_method: ["Topological time series analysis", "Nonlinear state transition mapping"],
    produce_data_modality: ["Neural oscillations", "Body movement data", "Behavioral annotations"],
    use_sensors: ["Neural recording arrays", "Video cameras"],
    keywords: ["visuomotor communication", "state transitions", "topological analysis"],
    metadata: { ethological_goals: ["Visuomotor communication"], methodological_category: "Behavioral Segmentation" },
  },
  {
    grant_number: "R34DA059510",
    study_species: ["Cichlid"],
    use_approaches: ["Behavioral Segmentation", "Pose Estimation", "Graph Modeling"],
    use_analysis_method: ["DeepLabCut", "Self-supervised learning", "Dimensionality reduction", "Contextual modeling"],
    produce_data_modality: ["Video", "Pose data"],
    use_sensors: ["Camera arrays"],
    keywords: ["multi-animal social behavior", "species differentiation", "hierarchical social structure", "contextual modeling"],
    metadata: { ethological_goals: ["Multi-animal social behavior quantification", "Species differentiation", "Hierarchical social structure"], methodological_category: "Behavioral Segmentation" },
  },
  {
    grant_number: "R34DA059513",
    study_species: ["Gerbil"],
    use_approaches: ["Acoustic Attribution", "Source Separation", "Neural Encoding"],
    use_analysis_method: ["Sound localization", "Encoding regression models", "Confidence-calibrated classification"],
    produce_data_modality: ["Audio recordings", "Synchronized video", "Neural recordings"],
    use_sensors: ["Microphone arrays", "Video cameras", "Neural recording arrays"],
    keywords: ["vocal attribution", "family communication", "auditory processing", "multimodal fusion"],
    metadata: { ethological_goals: ["Family communication", "Vocal attribution", "Auditory processing in social context"], methodological_category: "Acoustic Attribution" },
  },
  {
    grant_number: "R61MH135405",
    study_species: ["Human"],
    use_approaches: ["Neural Decoding", "Latent State Inference", "Multimodal ML"],
    use_analysis_method: ["Interpretable ML (CAMERA)", "Multimodal feature combination", "State prediction"],
    produce_data_modality: ["iEEG", "Physiological data", "Smartphone behavioral data"],
    use_sensors: ["iEEG electrodes", "Physiological sensors", "Smartphones"],
    keywords: ["anxiety", "memory", "navigating", "biomarkers", "interpretable ML", "CAMERA platform"],
    metadata: { ethological_goals: ["Navigating anxiety & memory"], methodological_category: "Neural Encoding/Decoding & Latent State Inference" },
  },
  {
    grant_number: "R61MH135407",
    study_species: ["Human"],
    use_approaches: ["Neural Decoding", "Nonlinear Inference", "Brain-Behavior Modeling"],
    use_analysis_method: ["Nonlinear brain-behavior inference frameworks"],
    produce_data_modality: ["Neural data", "Physiological data", "Behavioral data"],
    use_sensors: ["Neural recording systems", "Physiological sensors"],
    keywords: ["emotional functioning", "mental states", "brain-behavior coupling"],
    metadata: { ethological_goals: ["Emotional functioning"], methodological_category: "Neural Encoding/Decoding & Latent State Inference" },
  },
  {
    grant_number: "R61MH138966",
    study_species: ["Human"],
    use_approaches: ["Latent Variable Models", "Dimensionality Reduction", "Brain-Body Modeling"],
    use_analysis_method: ["Latent variable models", "Dimensionality reduction"],
    produce_data_modality: ["Neural data", "Physiological data", "Behavioral data"],
    use_sensors: ["Neural recording systems", "Physiological sensors"],
    keywords: ["effort-based decisions", "brain-body interactions", "latent processes"],
    metadata: { ethological_goals: ["Effort-based decision making"], methodological_category: "Neural Encoding/Decoding & Latent State Inference" },
  },
  {
    grant_number: "R34DA062119",
    study_species: ["Mouse"],
    use_approaches: ["Latent Variable Models", "Developmental Neuroscience"],
    use_analysis_method: ["Latent variable models", "Dimensionality reduction"],
    produce_data_modality: ["Neural data", "Behavioral data"],
    use_sensors: ["Neural recording systems"],
    keywords: ["adversity", "developmental trauma", "latent processes"],
    metadata: { ethological_goals: ["Understanding adversity effects on behavior"], methodological_category: "Neural Encoding/Decoding & Latent State Inference" },
  },
  {
    grant_number: "1U01DA063534",
    study_species: ["Marmoset"],
    use_approaches: ["Generative Models", "Multi-Agent RL", "Embodied Simulation", "Dynamic Bayesian Networks"],
    use_analysis_method: ["Multi-agent reinforcement learning", "RNNs", "Dynamic Bayesian networks", "Musculoskeletal modeling"],
    produce_data_modality: ["Video", "Neural recordings", "Behavioral simulations"],
    use_sensors: ["Video cameras", "Neural recording arrays"],
    keywords: ["cooperation", "competition", "social interaction", "embodied agents", "generative models"],
    metadata: { ethological_goals: ["Mutual benefit vs. competition", "Strategy optimization", "Probabilistic reasoning"], neural_network_architecture: "RNN + Dynamic Bayesian Networks + Musculoskeletal", methodological_category: "Generative & Embodied Agent-Based Models" },
  },
  {
    grant_number: "R34DA059509",
    study_species: ["Mouse"],
    use_approaches: ["Pose Estimation", "Active Learning", "Multimodal Classification"],
    use_analysis_method: ["SLEAP", "KiloSort3", "A-SOID"],
    produce_data_modality: ["Video", "Physiological signals", "Neural recordings"],
    use_sensors: ["Video cameras", "Neuropixels", "Physiological sensors"],
    keywords: ["behavioral segmentation", "stress response", "gut-brain axis", "active learning"],
    metadata: { ethological_goals: ["Behavioral segmentation", "Stress response quantification", "Gut-brain axis"], methodological_category: "Behavioral Segmentation" },
  },
  {
    grant_number: "R34DA059514",
    study_species: ["Sheep"],
    use_approaches: ["Computer Vision", "Kinematic Tracking", "Social Network Analysis"],
    use_analysis_method: ["Pose estimation", "GPS tracking", "Network analysis"],
    produce_data_modality: ["Video", "GPS data", "Neural recordings"],
    use_sensors: ["Cameras", "GPS collars", "Wireless neural recorders"],
    keywords: ["flocking behavior", "field neuroscience", "complex social behaviors"],
    metadata: { ethological_goals: ["High-resolution neuro-behavioral quantification in the field"], methodological_category: "Computer Vision & Kinematics" },
  },
  {
    grant_number: "R34DA059500",
    study_species: ["Zebrafish", "Drosophila"],
    use_approaches: ["Optical Imaging", "Navigation Tracking"],
    use_analysis_method: ["Navigation models", "Optical imaging analysis"],
    produce_data_modality: ["Imaging data", "Behavioral trajectories"],
    use_sensors: ["Optical imaging systems"],
    keywords: ["navigation", "brain imaging", "genetic model organisms"],
    metadata: { ethological_goals: ["Navigation behavior"], methodological_category: "Computer Vision & Kinematics" },
  },
  {
    grant_number: "R34DA061984",
    study_species: ["Acoel Worm"],
    use_approaches: ["Environmental Tracking", "Behavioral Quantification"],
    use_analysis_method: ["Behavioral quantification models"],
    produce_data_modality: ["Video", "Environmental data"],
    use_sensors: ["Microscopy systems", "Environmental sensors"],
    keywords: ["organism-environment interactions", "new model system"],
    metadata: { ethological_goals: ["Organism-environment interaction quantification"], methodological_category: "Behavioral Segmentation" },
  },
  {
    grant_number: "R34DA059716",
    study_species: ["Human"],
    use_approaches: ["Facial Feature Tracking", "Emotive Categorization", "Behavioral Synchrony"],
    use_analysis_method: ["Facial feature classification", "Synchrony analysis"],
    produce_data_modality: ["Video", "Audio", "Behavioral annotations"],
    use_sensors: ["Video cameras", "Microphones"],
    keywords: ["interpersonal synchrony", "dyadic conversation", "social communication", "emotive dynamics"],
    metadata: { ethological_goals: ["Social communication", "Interpersonal behavioral synchrony"], methodological_category: "Computer Vision & Kinematics" },
  },
  {
    grant_number: "R61MH138713",
    study_species: ["Human"],
    use_approaches: ["Attention State Modeling", "Neural Decoding"],
    use_analysis_method: ["Attention state classification", "EEG analysis"],
    produce_data_modality: ["EEG", "Behavioral data"],
    use_sensors: ["EEG systems"],
    keywords: ["attention states", "cognitive control"],
    metadata: { ethological_goals: ["Attention state characterization"], methodological_category: "Neural Encoding/Decoding & Latent State Inference" },
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const results = [];

    for (const project of PROJECT_METADATA) {
      // Check if grant exists
      const { data: grant } = await supabase
        .from('grants')
        .select('id')
        .eq('grant_number', project.grant_number)
        .maybeSingle();

      const row: Record<string, any> = {
        grant_number: project.grant_number,
        study_species: project.study_species,
        use_approaches: project.use_approaches,
        use_analysis_method: project.use_analysis_method,
        produce_data_modality: project.produce_data_modality,
        use_sensors: project.use_sensors,
        keywords: project.keywords,
        metadata: project.metadata,
        last_edited_by: 'seed-script',
      };

      if (grant) {
        row.grant_id = grant.id;
      }

      // Calculate completeness
      const checkFields = ["study_species", "use_approaches", "use_sensors", "produce_data_modality", "use_analysis_method", "keywords"];
      const filled = checkFields.filter(f => {
        const v = row[f];
        return Array.isArray(v) && v.length > 0;
      });
      row.metadata_completeness = Math.round((filled.length / 11) * 100);

      const { data, error } = await supabase
        .from('projects')
        .upsert(row, { onConflict: 'grant_number' })
        .select('grant_number');

      results.push({ grant_number: project.grant_number, success: !error, error: error?.message });
    }

    return new Response(JSON.stringify({ seeded: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
