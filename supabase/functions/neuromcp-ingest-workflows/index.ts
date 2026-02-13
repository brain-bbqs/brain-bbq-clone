import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bbqs.dev",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Consolidated BBQS project workflow data extracted from the spreadsheet
const BBQS_WORKFLOWS = [
  {
    source_id: "workflow_R34DA059510",
    title: "Cichlid Multi-Animal Behavior Arena (Dyer Lab)",
    pi: "Eva Dyer, Patrick McGrath",
    species: "Cichlid (Cichlidae)",
    sensors: "Multi-view cameras",
    data_modalities: "Video data, Multi-view video",
    approaches: "Pose estimation, Object detection, Feature extraction, Behavior tracking, Graph modeling, Self-supervised learning",
    software: "DeepLabCut (pose estimation), Computer vision networks, Dimensionality reduction",
    behaviors: "Locomotion, Social Interactions, Feeding, Exploratory Behavior, Emotional/Stress Responses, Reproductive Behaviors",
    analysis_methods: "Statistical analysis, Dimensionality reduction (PCA/tSNE/UMAP), Dynamical systems modeling, Encoding models, Decoding models",
    hardware: "Open arena (500 gallon), multi-view livestream, underwater housing",
    data_types: "Behavioral, Environmental, Social interaction, Neural, Annotation",
    workflow_pipeline: "Multi-view video recording → Manual annotation for object/feature detection → Computer vision networks (pose estimation, object detection, classification) → Behavioral signature identification → Lower dimensional representations",
  },
  {
    source_id: "workflow_R34DA059509",
    title: "Multimodal Mouse Behavioral Segmentation (Grover/Yttri Lab)",
    pi: "Pulkit Grover, Zheng Kuang, Jonathan Rubin, Eric Yttri",
    species: "Mouse (Mus musculus)",
    sensors: "Neuropixels, Selfie camera, Thermocam, Ultrasonic microphones, RNA sequencing, Heart rate sensors, Eye tracker",
    data_modalities: "Neural, Video data, Audio",
    approaches: "Pose estimation (SLEAP), Physiological signal analysis, Speech analysis, Behavior tracking",
    software: "SLEAP (pose estimation), KiloSort3 (neural data), A-SOID (behavioral classification), Intuitive GUI",
    behaviors: "Stress responses, Social interactions, Gut-brain axis",
    analysis_methods: "Pose estimation via SLEAP, Neural data via KiloSort3, Active learning (A-SOID), Multimodal classification",
    hardware: "Neuropixels probes, Thermal cameras, Ultrasonic microphones",
    data_types: "Physiological, Behavioral, Video, Neural",
    workflow_pipeline: "Multi-sensor recording (video, thermal, audio, neural) → Pose estimation via SLEAP → Neural spike sorting via KiloSort3 → Behavioral segmentation via A-SOID → Multimodal dynamics quantification",
  },
  {
    source_id: "workflow_R34DA059513",
    title: "Gerbil Vocalization & Social Behavior (Sanes Lab)",
    pi: "Dan Sanes, David Schneider, Alexander Williams",
    species: "Mongolian Gerbil (Meriones unguiculatus)",
    sensors: "Ultrasonic Microphones, Infrared Cameras, Wireless neural recorders, IMU",
    data_modalities: "Audio, Kinematic, Neural",
    approaches: "Speech analysis, Source localization, Pose estimation, Behavior tracking, Deep learning",
    software: "SLEAP (pose estimation), DeepSqueak (USV detection), Python (open source)",
    behaviors: "Locomotion, Gait Analysis, Vocalizations, Social Interactions, Exploratory Behavior, Reproductive Behaviors",
    analysis_methods: "Statistical analysis, Signal processing (Fourier/Wavelet), Dimensionality reduction, Dynamical systems modeling, Encoding/Decoding models, Correlation/Regression",
    hardware: "Large naturalistic environment, microphone array, camera array",
    data_types: "Audio, Social interaction, Behavioral, Neural, Visual, Multi-modal, Wearable sensor, Kinematic",
    workflow_pipeline: "Multi-animal environment recording (cameras + microphone arrays) → SLEAP pose estimation → DeepSqueak USV detection → Source localization → Wireless neural recording → Cross-modal integration",
  },
  {
    source_id: "workflow_R34DA059507",
    title: "Smart Aviary for Cowbird Social Behavior (Aflatouni/Schmidt Lab)",
    pi: "Firooz Aflatouni, Vijay Balasubramanian, Kostas Daniilidis, Marc Schmidt",
    species: "Cowbird (Molothrus ater)",
    sensors: "Cameras, RFID, Microphone arrays, Wireless neural recorder",
    data_modalities: "Visual, Physiological, Neural, Spatial",
    approaches: "Object detection, Pose estimation, Speech analysis, Source localization, Behavior tracking, Social network analysis",
    software: "Computer vision and ML for automated behavioral evaluation",
    behaviors: "Locomotion, Posture/Balance, Vocalizations, Social Interactions, Reproductive Behaviors",
    analysis_methods: "Dimensionality reduction (PCA/tSNE/UMAP)",
    hardware: "Smart aviary with cameras and microphones, wireless neural recording device with carbon fiber electrodes",
    data_types: "Audio, Behavioral, Visual, Video, Neural, Environmental, Annotation",
    workflow_pipeline: "Smart aviary multi-sensor capture (cameras + microphones + RFID) → Automated individual identification → Pose estimation → Vocalization source localization → Social network analysis → Neural recording correlation",
  },
  {
    source_id: "workflow_R34DA059718",
    title: "Social Motif Generator from Biological Rhythms (Padilla Coreano Lab)",
    pi: "Nancy Padilla Coreano, Shreya Saxena, Daniel Wesson",
    species: "Mouse (Mus musculus)",
    sensors: "Video cameras, Respiration sensors, Heart rate monitors, Accelerometers",
    data_modalities: "Visual, Physiological, Kinematic",
    approaches: "Pose estimation, Physiological signal analysis, Deep learning, Clustering, Behavior tracking",
    software: "So-Mo (social motif generation), Multimodal autoencoder, Hierarchical clustering, Neural networks",
    behaviors: "Social Interactions (grooming, play, aggression, mating)",
    analysis_methods: "Statistical analysis, Dimensionality reduction, Dynamical systems modeling, Encoding/Decoding models, Regression models",
    hardware: "Camera + respiration/heart rate sensors",
    data_types: "Behavioral, Video, Physiological, Multi-modal, Wearable sensor",
    workflow_pipeline: "Concurrent recording (video + respiration + HR + accelerometer) → Pose estimation → Physiological signal extraction → Multimodal autoencoder → Dynamical hierarchical clustering → Social motif identification",
  },
  {
    source_id: "workflow_R34DA059506",
    title: "3D Social Behavior Tracking (Dunn/Olveczky Lab - Social)",
    pi: "Timothy Dunn, Bence Olveczky",
    species: "Rats, Mouse (Rattus, Mus musculus)",
    sensors: "Synchronized cameras",
    data_modalities: "Kinematic, Visual",
    approaches: "Pose estimation, Deep learning, Behavior tracking",
    software: "Deep neural network for 3D kinematic tracking (open-source Python), Behavior parsing into modules",
    behaviors: "Locomotion, Gait Analysis, Posture/Balance, Social Interactions, Exploratory Behavior",
    analysis_methods: "Statistical analysis, Signal processing, Dimensionality reduction, Dynamical systems modeling, Time-frequency analysis, Bayesian inference, Encoding/Decoding models, Correlation/Regression",
    hardware: "Synchronized multi-camera experimental platform",
    data_types: "Social interaction, Video, Behavioral, Visual, Kinematic",
    workflow_pipeline: "Synchronized multi-camera video → Deep neural network 3D pose estimation → Whole-body kinematics extraction → Social behavior annotation → Behavioral module parsing → Quantitative analysis",
  },
  {
    source_id: "workflow_R34DA059512",
    title: "3D Prey Capture Tracking (Dunn/Field Lab - Ecological)",
    pi: "Timothy Dunn, Gregory Field, Michael Tadross",
    species: "Mouse (Mus musculus)",
    sensors: "Synchronized cameras",
    data_modalities: "Visual, Kinematic",
    approaches: "Pose estimation, Behavior tracking",
    software: "Convolutional NN for multi-perspective 3D tracking (open-source Python), Out-of-the-box generalization",
    behaviors: "Locomotion, Gait Analysis, Posture/Balance, Social Interactions, Exploratory Behavior",
    analysis_methods: "Statistical analysis, Signal processing, Dimensionality reduction, Dynamical systems modeling",
    hardware: "Scalable recording environment for cricket hunting paradigm",
    data_types: "Behavioral, Video, Visual, Stimulation, Kinematic",
    workflow_pipeline: "Multi-camera ecological recording → CNN multi-perspective processing → 3D coordinate inference → Kinematic trace extraction → Behavioral comparison (healthy vs disease models)",
  },
  {
    source_id: "workflow_R34DA059716",
    title: "Dyadic Conversation Synchrony (Corcoran Lab)",
    pi: "Cheryl Corcoran, Jack Grinband, Muhammad Parvaz",
    species: "Human (Homo sapiens)",
    sensors: "Tobii Glasses, Plethysmograph, EEG (hyperscanning), Heart rate sensors",
    data_modalities: "Audio, Visual, Neural",
    approaches: "Facial expression analysis, EEG hyperscanning, Emotion estimation (HUME-AI), Feature extraction, Correlation analysis",
    software: "PRAAT/OpenSmile (audio), HUME-AI (emotion), GUI-based analyses",
    behaviors: "Posture/Balance, Eye Movements, Facial Expressions, Vocalizations, Social Interactions, Emotional/Stress Responses",
    analysis_methods: "Statistical analysis, Signal processing, Dynamical systems modeling, Time-frequency analysis, Network analysis, Correlation/Regression",
    hardware: "Testing rooms for multimodal dyadic communication recording",
    data_types: "Multi-modal, Human, High temporal resolution, Audio, Neural, Video, Visual, Non-invasive",
    workflow_pipeline: "Multimodal dyadic recording (video + audio + EEG + eye-tracking + physiology) → PRAAT/OpenSmile audio analysis → HUME-AI emotion labels → Facial action unit extraction → EEG hyperscanning → Interpersonal synchrony quantification",
  },
  {
    source_id: "workflow_R34DA059723",
    title: "Oromanual Food-Handling (Shepherd Lab)",
    pi: "Gordon Shepherd",
    species: "Mouse (Mus musculus)",
    sensors: "Intranasal Thermistor, EMG, Acoustic microphones",
    data_modalities: "Visual, Kinematic, Physiological",
    approaches: "Physiological signal analysis, Pose estimation, EMG tracking",
    software: "DeepLabCut (tracking), Ethogramming, ML-based tracking",
    behaviors: "Locomotion, Feeding/Drinking, Exploratory Behavior",
    analysis_methods: "Statistical analysis, Signal processing, Time-frequency analysis, Correlation/Regression",
    hardware: "Videographic recording arena + robotic camera positioning system",
    data_types: "Physiological, Behavioral",
    workflow_pipeline: "High-speed video recording → DeepLabCut pose tracking → EMG recording (jaw/forelimb) → Breathing/olfactory signal extraction → Sub-movement identification → Goal-directed action assembly analysis",
  },
  {
    source_id: "workflow_R34DA059514",
    title: "Sheep Flocking Behavior (Kemere Lab)",
    pi: "Caleb Kemere",
    species: "Sheep (Ovis aries)",
    sensors: "First-person-view cameras, Microphones, Wireless neural, GPS",
    data_modalities: "Visual, Audio, Neural, Spatial",
    approaches: "Speech analysis, Behavior tracking",
    software: "Python for processing/analysis, Embedded systems for high spatio-temporal tracking",
    behaviors: "Locomotion, Gait Analysis, Posture/Balance, Eye Movements, Vocalizations, Social Interactions, Feeding, Exploratory Behavior",
    analysis_methods: "Statistical analysis, Signal processing, Dimensionality reduction, Dynamical systems modeling, Time-frequency analysis",
    hardware: "Head-mounted device (visual sensorium), completely implanted wirelessly powered neural recorder",
    data_types: "Neural, Environmental, Social interaction, Visual, Wearable sensor, Audio, Video, Behavioral",
    workflow_pipeline: "Field recording (FPV cameras + microphones + GPS + neural) → Visual sensorium capture → Individual behavioral prediction → Internal state dynamics modeling → Motivated behavior modeling",
  },
  {
    source_id: "workflow_R34DA059500",
    title: "Optical Imaging of Navigation (Nagel/Schoppik Lab)",
    pi: "Katherine Nagel, David Schoppik, Nathan Shaner, Jane Wang",
    species: "Zebrafish, Fruit fly, Crustacean (Danio rerio, Drosophila melanogaster, Parhyale hawaiensis)",
    sensors: "Video cameras, Neuroimaging sensors, Bioluminescent indicators",
    data_modalities: "Visual, Kinematic, Neural",
    approaches: "Pose estimation, Behavior tracking, Neural activity modeling",
    software: "Real-time behavioral tracking, Physical modeling",
    behaviors: "Locomotion, Navigation, Stimulus-guided behavior",
    analysis_methods: "Quantitative behavior analysis, Real-time tracking, High-resolution posture analysis, Limb kinematics",
    hardware: "Laminar flow chamber (underwater), behavioral apparatus",
    data_types: "Neural, Behavioral, Non-invasive",
    workflow_pipeline: "Bioluminescence-based neural imaging → Real-time behavioral tracking → Physical modeling of navigation → High-resolution posture analysis → Limb kinematics → Neural activity correlation",
  },
  {
    source_id: "workflow_R34DA061984",
    title: "Organism-Environment Interactions in Acoel Worms (Srivastava Lab)",
    pi: "Mansi Srivastava",
    species: "Acoel worm (Hofstenia miamia)",
    sensors: "Video cameras, Water-flow apparatus, Prey-tracking system",
    data_modalities: "Visual, Environmental, Behavioral",
    approaches: "Pose estimation, Tracking, Synchronization, Behavioral quantification",
    software: "DeepLabCut, SLEAP (pose estimation), Cellpose (animal tracking)",
    behaviors: "Locomotion, Feeding/Drinking, Exploratory Behavior, Regeneration",
    analysis_methods: "Pose estimation, Dimensionality reduction, Dynamical systems modeling, Statistical analysis",
    hardware: "Water flow environment",
    data_types: "Neural, Environmental, Behavioral, Video, Genetic",
    workflow_pipeline: "Video recording + environment sensing → DeepLabCut/SLEAP pose estimation → Cellpose animal tracking → Action sequence inference → Environment synchronization → Regeneration analysis",
  },
  {
    source_id: "workflow_R34DA061924",
    title: "Multi-Scale Social Dynamics in Ferrets (Zhang Lab)",
    pi: "Mengsen Zhang, Flavio Frohlich",
    species: "Ferret (Mustela putorius furo)",
    sensors: "Video cameras, Accelerometers, Electrophysiology",
    data_modalities: "Neural, Visual, Kinematic",
    approaches: "Time series analysis, Pose estimation, Behavior tracking, Machine learning, Annotation, Network analysis",
    software: "DeepLabCut (motion tracking), Topological time series analysis, Cross-scale mapping",
    behaviors: "Locomotion, Social Interactions",
    analysis_methods: "Statistical analysis, Signal processing, Dimensionality reduction, Dynamical systems modeling, Time-frequency analysis, Network analysis",
    hardware: "Simultaneous electrophysiology and video tracking setup",
    data_types: "Neural, Social interaction, Behavioral, Video, Annotation, Wearable sensor",
    workflow_pipeline: "Simultaneous electrophysiology + video + accelerometer recording → DeepLabCut motion tracking → Topological time series analysis → Cross-scale mapping (neurons → oscillations → movements → behavioral states) → Transition network construction",
  },
  {
    source_id: "workflow_R34DA061925",
    title: "AI Forest for Wild Primate Behavior (Flagel/Beehner Lab)",
    pi: "Shelly Flagel, Jacinta Beehner, Marcela Benitez",
    species: "White-faced Capuchin Monkey (Cebus imitator)",
    sensors: "Video cameras, Microphones",
    data_modalities: "Visual, Audio",
    approaches: "Deep learning, Behavior tracking, Automated data collection",
    software: "Visual DL for individual identification, Vocal DL for movement/environment tracking",
    behaviors: "Locomotion, Cognitive Tasks, Social Interactions, Feeding, Exploratory Behavior, Emotional/Stress Responses, Reproductive Behaviors",
    analysis_methods: "Statistical analysis, Dimensionality reduction, Bayesian inference, Network analysis, Correlation/Regression",
    hardware: "Smart testing stations in forest, automated data collection",
    data_types: "Environmental, Social interaction, Multi-modal, Visual, Remote collection, Behavioral",
    workflow_pipeline: "Automated forest recording (smart testing stations) → Visual DL individual identification → Vocal DL movement tracking → Self-paced experimental data collection → Multidimensional behavioral/environmental integration → Lifespan analysis",
  },
  {
    source_id: "workflow_R61MH135106",
    title: "Synchronized Neural & Peripheral Biomarkers in Humans (Suthana Lab)",
    pi: "Nanthia Suthana",
    species: "Human (Homo sapiens)",
    sensors: "iEEG, Motion tracking, Eye tracker, Cortisol/Epinephrine wearables",
    data_modalities: "Neural, Physiological, Kinematic, Biochemical",
    approaches: "Stress analysis, Approach-avoidance modeling, AR/VR",
    software: "Neural data analysis, VR/AR experiments, Open source",
    behaviors: "Locomotion, Eye Movements, Cognitive Tasks, Social Interactions, Exploratory Behavior, Emotional/Stress Responses, Sleep, Operant Conditioning",
    analysis_methods: "Statistical analysis, Signal processing, Dimensionality reduction, Time-frequency analysis, Decoding models, Correlation/Regression",
    hardware: "Platform for simultaneous single-neuron/iEEG + biochemical + biophysical recording in freely moving humans",
    data_types: "Neural, Behavioral, Physiological, Cognitive, Biochemical, Social, Self-report, Wearable",
    workflow_pipeline: "Synchronized multimodal recording (iEEG + biochemical wearables + biophysical sensors + eye tracking) → Neural data analysis → Biochemical timeseries → Approach-avoidance behavior quantification → Neuromodulation validation",
  },
  {
    source_id: "workflow_R61MH135405",
    title: "CAMERA Platform for Anxiety & Memory (Jacobs Lab)",
    pi: "Joshua Jacobs, Jorge Ortiz, Alik Widge, Brett Youngerman",
    species: "Human (Homo sapiens)",
    sensors: "iEEG, Smartphone sensors, Empatica EmbracePlus, Eye tracker, Heart rate, EDA, Skin temperature, Accelerometer",
    data_modalities: "Neural, Physiological, Visual, Audio",
    approaches: "Memory analysis, Emotion estimation, Speech analysis, Facial expression analysis, Pose estimation, Physiological signal analysis, Deep learning, Ecological momentary assessment",
    software: "BCI2000 (synchronization), Deep learning for audiovisual processing, ML for anxiety-memory prediction",
    behaviors: "Eye Movements, Cognitive Tasks, Social Interactions, Exploratory Behavior, Emotional/Stress Responses",
    analysis_methods: "Statistical analysis, Signal processing, Dimensionality reduction, Time-frequency analysis, Bayesian inference, Encoding/Decoding models, Correlation/Regression",
    hardware: "Multimodal sensor suite: iEEG + smartphone + wristband + eye tracker + cameras",
    data_types: "Neural, Physiological, Behavioral, Environmental, Multi-modal, Audio, Video, Self-report, Wearable, Clinical",
    workflow_pipeline: "BCI2000 synchronized multistream capture (iEEG + smartphone phenotyping + wristband physiology + audiovisual) → Hippocampal theta analysis → DL audiovisual processing (pose/facial/vocal) → NLP linguistic features → Ecological momentary assessment integration → ML anxiety-memory state prediction",
  },
];

// Common tool workflows that span multiple projects
const CROSS_PROJECT_WORKFLOWS = [
  {
    source_id: "common_workflow_pose_estimation",
    title: "Common Workflow: Video → Pose Estimation Pipeline",
    content: `COMMON WORKFLOW: Video to Pose Estimation
    
Tools: DeepLabCut, SLEAP, Cellpose
Used by: ~12 BBQS projects including Dyer (Cichlid), Grover (Mouse), Sanes (Gerbil), Dunn (Rats/Mice), Padilla Coreano (Mouse), Shepherd (Mouse), Srivastava (Worm), Zhang (Ferret), and more.

Pipeline Steps:
1. Record multi-view or single-view video of freely moving animals
2. Create training dataset with manual key-point annotations
3. Train DeepLabCut or SLEAP model on labeled frames
4. Run inference to extract 2D/3D pose trajectories
5. Post-process: smooth trajectories, interpolate missing points
6. Feed into downstream analysis (behavioral segmentation, dimensionality reduction)

Species-specific considerations:
- Fish (Cichlid): Underwater cameras, multi-view for 3D reconstruction
- Rodents (Mouse/Rat): Standard overhead or side cameras, SLEAP preferred for multi-animal
- Gerbils: Infrared cameras for dark environments
- Worms: Cellpose for whole-body tracking, DeepLabCut/SLEAP for pose
- Birds: Multi-camera aviary setup, challenging due to feathers
- Primates: Field conditions require robust tracking, DL for individual ID`,
  },
  {
    source_id: "common_workflow_audio_vocalization",
    title: "Common Workflow: Audio → Vocalization Analysis Pipeline",
    content: `COMMON WORKFLOW: Audio to Vocalization Analysis
    
Tools: DeepSqueak, PRAAT, OpenSmile, Custom source localization
Used by: Sanes (Gerbil), Aflatouni (Cowbird), Kemere (Sheep), Flagel (Capuchin), Corcoran (Human), Grover (Mouse)

Pipeline Steps:
1. Record audio with ultrasonic microphone array (animals) or standard microphones (humans)
2. For animals: Run DeepSqueak for USV detection and classification
3. For multi-animal: Apply source localization to attribute calls to individuals
4. Extract acoustic features (spectrograms, fundamental frequency, formants)
5. Classify call types and behavioral context
6. Correlate with simultaneous video/neural data

Key considerations:
- Ultrasonic range needed for rodent USVs (30-100+ kHz)
- Reverberant environments require beamforming/source separation
- Human speech uses PRAAT for prosody and OpenSmile for feature extraction
- HUME-AI available for emotion recognition from speech (Corcoran lab)`,
  },
  {
    source_id: "common_workflow_neural_recording",
    title: "Common Workflow: Neural Recording → Analysis Pipeline",
    content: `COMMON WORKFLOW: Neural Recording and Analysis
    
Tools: KiloSort3, MNE-Python, BCI2000, SpikeGadgets, OpenEphys
Used by: Grover (Mouse/Neuropixels), Sanes (Gerbil/wireless), Kemere (Sheep/implanted), Suthana (Human/iEEG), Jacobs (Human/iEEG), Shanechi (Human/iEEG), Rozell (Human/DBS), Zhang (Ferret)

Pipeline Steps:
1. Record neural data (Neuropixels, iEEG, wireless implants, or OPM-MEG)
2. Spike sorting via KiloSort3 (for single-unit data)
3. LFP/oscillation analysis via MNE-Python
4. Signal processing: Fourier transforms, wavelet analysis, spectrograms
5. Encoding models: relate neural activity to behavioral variables
6. Decoding models: predict behavior/mental state from neural data
7. Cross-frequency coupling, coherence analysis

Animal vs Human considerations:
- Animals: Neuropixels (mice), wireless recorders (gerbils, sheep, birds)
- Humans: iEEG from epilepsy patients, DBS, OPM-MEG
- Synchronization with behavioral data critical (BCI2000 for humans)`,
  },
  {
    source_id: "common_workflow_behavioral_segmentation",
    title: "Common Workflow: Behavioral Segmentation & Classification Pipeline",
    content: `COMMON WORKFLOW: Behavioral Segmentation and Classification
    
Tools: A-SOID, Ethogramming, Custom ML, Dimensionality reduction
Used by: Grover (A-SOID), Dyer (self-supervised), Padilla Coreano (So-Mo), Dunn (behavior parsing), Srivastava (action sequences)

Pipeline Steps:
1. Obtain pose trajectories from DeepLabCut/SLEAP
2. Extract kinematic features (velocities, angles, distances)
3. Dimensionality reduction (PCA, UMAP, tSNE) to visualize behavioral space
4. Unsupervised clustering to discover behavioral motifs
5. OR supervised classification with A-SOID (active learning approach)
6. Temporal analysis: identify behavioral sequences and transitions
7. Statistical comparison across conditions/genotypes

Recommended approach by data type:
- Single animal, simple behaviors: DeepLabCut → UMAP → manual labeling
- Multi-animal social: SLEAP → A-SOID (active learning)
- Multimodal (pose + physiology): Multimodal autoencoder → Hierarchical clustering (So-Mo)
- High-throughput: Self-supervised learning for embedding (Dyer lab approach)`,
  },
  {
    source_id: "common_workflow_multimodal_sync",
    title: "Common Workflow: Multimodal Data Synchronization Pipeline",
    content: `COMMON WORKFLOW: Multimodal Data Synchronization
    
Tools: BCI2000, Custom sync solutions, Timestamp alignment
Used by: Nearly all R61/R33 projects (Suthana, Jacobs, Shanechi, Rozell, Lenartowicz, Corcoran, Inman)

Pipeline Steps:
1. Identify all data streams to synchronize (neural, video, audio, physiology, behavioral)
2. Establish common clock/trigger signal across all recording devices
3. For human studies: BCI2000 as master synchronization framework
4. For animal studies: TTL pulses, shared clock signals
5. Time-stamp alignment and interpolation across different sampling rates
6. Quality control: verify synchronization accuracy
7. Create unified data structure for cross-modal analysis

Common challenges:
- Different sampling rates (neural: 30kHz, video: 30-120fps, physiology: 100-1000Hz)
- Clock drift in wireless devices
- Large data volumes (4TB/animal/day for some projects)
- Privacy-preserving alternatives to video (LiDAR, mmWave - Lenartowicz lab)`,
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const stats = { workflows: 0, cross_project: 0, errors: 0 };

    console.log("Starting workflow ingestion...");

    // 1. Ingest per-project workflow data
    for (const wf of BBQS_WORKFLOWS) {
      try {
        const content = `Project Workflow: ${wf.title}
PI(s): ${wf.pi}
Species: ${wf.species}
Sensors: ${wf.sensors}
Data Modalities: ${wf.data_modalities}
Approaches: ${wf.approaches}
Software/Tools: ${wf.software}
Behaviors Studied: ${wf.behaviors}
Analysis Methods: ${wf.analysis_methods}
Hardware: ${wf.hardware}
Data Types: ${wf.data_types}
Workflow Pipeline: ${wf.workflow_pipeline}`;

        const embedding = await generateEmbedding(content);

        await supabase.from("knowledge_embeddings").upsert({
          source_type: "workflow",
          source_id: wf.source_id,
          title: wf.title,
          content: content,
          metadata: {
            pi: wf.pi,
            species: wf.species,
            sensors: wf.sensors,
            software: wf.software,
            behaviors: wf.behaviors,
          },
          embedding: `[${embedding.join(",")}]`,
        }, { onConflict: "source_type,source_id" });

        stats.workflows++;
        console.log(`Ingested workflow: ${wf.title}`);
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error(`Workflow error ${wf.source_id}:`, err);
        stats.errors++;
      }
    }

    // 2. Ingest cross-project common workflows
    for (const cw of CROSS_PROJECT_WORKFLOWS) {
      try {
        const embedding = await generateEmbedding(cw.content);

        await supabase.from("knowledge_embeddings").upsert({
          source_type: "common_workflow",
          source_id: cw.source_id,
          title: cw.title,
          content: cw.content,
          metadata: { type: "cross_project_workflow" },
          embedding: `[${embedding.join(",")}]`,
        }, { onConflict: "source_type,source_id" });

        stats.cross_project++;
        console.log(`Ingested cross-project workflow: ${cw.title}`);
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error(`Cross-project error ${cw.source_id}:`, err);
        stats.errors++;
      }
    }

    console.log("Workflow ingestion complete:", stats);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Workflow ingestion error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
