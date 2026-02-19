import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESOURCES = [
  // Software
  { name: "idtracker.ai", description: "Multi-animal identity tracking and maintenance across video recordings", url: "https://idtracker.ai/latest/", type: "software", category: "Software", algorithm: "Multi-animal identity tracking and maintenance across video recordings", computational: "Deep learning-based individual identification without markers (up to 100 animals)", neuralNetworkArchitecture: "CNN (Convolutional Neural Network)", mlPipeline: "Supervised learning with identity re-identification", implementation: "Python", species: "Multi-species (general purpose)", neuroMcpStatus: "not-started", containerized: false },
  { name: "SimBA", description: "Supervised behavioral classification from pose data", url: "https://github.com/sgoldenlab/simba", type: "software", category: "Software", algorithm: "Supervised behavioral classification from pose data", computational: "Machine learning classifiers trained on user-annotated behaviors", neuralNetworkArchitecture: "N/A (uses traditional ML classifiers)", mlPipeline: "Supervised learning; user annotates behaviors → trains classifier (Random Forest, XGBoost, etc.) → predicts on new data", implementation: "Python", species: "Multi-species (general purpose)", neuroMcpStatus: "not-started", containerized: true },
  { name: "Bonsai", description: "Real-time heterogeneous data stream synchronization and processing", url: "https://bonsai-rx.org/", type: "software", category: "Software", algorithm: "Real-time heterogeneous data stream synchronization and processing", computational: "Visual dataflow programming with reactive extensions", neuralNetworkArchitecture: "N/A (infrastructure tool)", mlPipeline: "N/A (infrastructure tool)", implementation: ".NET", species: "Multi-species (general purpose)", neuroMcpStatus: "not-started", containerized: false },
  { name: "LabStreamingLayer", description: "Multi-source data streaming and temporal synchronization", url: "https://labstreaminglayer.org/", type: "software", category: "Software", algorithm: "Multi-source data streaming and temporal synchronization", computational: "Network-based middleware for time-stamped data alignment", neuralNetworkArchitecture: "N/A (infrastructure tool)", mlPipeline: "N/A (infrastructure tool)", implementation: "C++", species: "Multi-species (general purpose)", neuroMcpStatus: "not-started", containerized: false },
  { name: "Open Ephys", description: "Electrophysiology data acquisition and real-time processing", url: "https://open-ephys.org/", type: "software", category: "Software", algorithm: "Electrophysiology data acquisition and real-time processing", computational: "Modular signal processing pipeline for neural recordings", neuralNetworkArchitecture: "N/A (hardware/acquisition tool)", mlPipeline: "N/A (hardware/acquisition tool)", implementation: "C++", species: "Multi-species (general purpose)", neuroMcpStatus: "not-started", containerized: false },
  { name: "DeepLabCut", description: "Markerless pose estimation of user-defined body parts across species", url: "https://deeplabcut.github.io/DeepLabCut/", type: "software", category: "Software", algorithm: "Markerless pose estimation of user-defined body parts across species", computational: "Transfer learning with ResNet-based CNNs for keypoint detection", neuralNetworkArchitecture: "CNN (ResNet-50, ResNet-101, EfficientNet variants)", mlPipeline: "Transfer learning: Pre-trained ImageNet weights → fine-tune on user-labeled frames (~200 frames) → predict keypoints on new videos → optional active learning iteration", implementation: "Python", species: "Multi-species (mice, rats, primates, horses, birds, fish, humans, etc.)", neuroMcpStatus: "not-started", containerized: true },
  { name: "SLEAP", description: "Multi-animal pose tracking without markers", url: "https://sleap.ai/", type: "software", category: "Software", algorithm: "Multi-animal pose tracking without markers", computational: "Deep learning (top-down and bottom-up approaches) for body landmark estimation", neuralNetworkArchitecture: "CNN (LEAP CNN, UNet, ResNet backbones)", mlPipeline: "Supervised learning: User labels frames → trains centroid + instance models → predicts poses → tracks identities across frames", implementation: "Python", species: "Multi-species (general purpose)", neuroMcpStatus: "not-started", containerized: true },
  { name: "DeepPoseKit", description: "Animal pose estimation from video", url: "https://github.com/jgraving/DeepPoseKit", type: "software", category: "Software", algorithm: "Animal pose estimation from video", computational: "Deep learning with stacked hourglass networks or DenseNet", neuralNetworkArchitecture: "CNN (Stacked Hourglass, DenseNet)", mlPipeline: "Supervised learning: User annotates keypoints → trains encoder-decoder network → predicts on new frames", implementation: "Python", species: "Multi-species (general purpose)", neuroMcpStatus: "not-started", containerized: false },
  { name: "JAABA", description: "Automated behavior classification from video features", url: "https://jaaba.sourceforge.net/", type: "software", category: "Software", algorithm: "Automated behavior classification from video features", computational: "Supervised machine learning (Gentle AdaBoost) on per-frame features", neuralNetworkArchitecture: "N/A (uses boosting, not neural networks)", mlPipeline: "Supervised learning: Extract per-frame features (motion, posture) → user annotates behaviors → trains Gentle AdaBoost classifier → predicts behavior labels → iterative refinement", implementation: "MATLAB", species: "Drosophila (fruit flies) - originally developed; adaptable to others", neuroMcpStatus: "not-started", containerized: false },
  { name: "MARS", description: "Automated social behavior classification in mouse pairs", url: "https://github.com/neuroethology/MARS", type: "software", category: "Software", algorithm: "Automated social behavior classification in mouse pairs", computational: "Deep learning for pose estimation + temporal action recognition", neuralNetworkArchitecture: "CNN + LSTM/Temporal Convolutional Networks", mlPipeline: "Two-stage: (1) Pose estimation (CNN) → (2) Action classification (temporal model on pose sequences)", implementation: "Python", species: "Mouse (Mus musculus)", neuroMcpStatus: "not-started", containerized: false },
  { name: "BENTO", description: "Multimodal data synchronization and visualization for neurobehavioral analysis", url: "https://github.com/annkennedy/bento", type: "software", category: "Software", algorithm: "Multimodal data synchronization and visualization for neurobehavioral analysis", computational: "Time-aligned integration of video, pose, neural, and audio streams", neuralNetworkArchitecture: "N/A (visualization/analysis tool)", mlPipeline: "N/A (visualization/analysis tool)", implementation: "MATLAB", species: "Multi-species (general purpose)", neuroMcpStatus: "not-started", containerized: false },
  { name: "MoSeq", description: "Unsupervised behavioral segmentation into reusable action syllables", url: "https://dattalab.github.io/moseq2-website/", type: "software", category: "Software", algorithm: "Unsupervised behavioral segmentation into reusable action syllables", computational: "Autoregressive hidden Markov models on 3D depth-video motion features", neuralNetworkArchitecture: "N/A (uses AR-HMM, not neural networks)", mlPipeline: "Unsupervised learning: Extract 3D pose from depth video → PCA dimensionality reduction → AR-HMM identifies behavioral syllables → characterize syllable usage", implementation: "Python", species: "Mouse (Mus musculus) - primarily; adaptable to small rodents", neuroMcpStatus: "not-started", containerized: false },
  { name: "OpenPose", description: "Real-time multi-person 2D pose estimation (body, hands, face)", url: "https://github.com/CMU-Perceptual-Computing-Lab/openpose", type: "software", category: "Software", algorithm: "Real-time multi-person 2D pose estimation (body, hands, face)", computational: "Part Affinity Fields (PAFs) with CNNs for keypoint detection and association", neuralNetworkArchitecture: "CNN (VGG-19 or MobileNet backbone with multi-stage refinement)", mlPipeline: "Supervised learning: Pre-trained on COCO/MPII datasets → predicts confidence maps for keypoints + PAFs for limb connections", implementation: "C++", species: "Human (Homo sapiens)", neuroMcpStatus: "not-started", containerized: true },
  { name: "OpenFace", description: "Facial behavior analysis: landmarks, head pose, gaze, action units", url: "https://github.com/TadasBaltrusaitis/OpenFace", type: "software", category: "Software", algorithm: "Facial behavior analysis: landmarks, head pose, gaze, action units", computational: "Constrained Local Neural Fields (CLNF) and regression models for facial features", neuralNetworkArchitecture: "CNN (for some components) + CLNF (hybrid model)", mlPipeline: "Pre-trained models: Facial landmark detection → head pose estimation → eye gaze tracking → AU intensity estimation", implementation: "C++", species: "Human (Homo sapiens)", neuroMcpStatus: "not-started", containerized: true },
  { name: "DeepSqueak", description: "Ultrasonic vocalization (USV) detection and analysis in rodents", url: "https://github.com/DrCoffey/DeepSqueak", type: "software", category: "Software", algorithm: "Ultrasonic vocalization (USV) detection and analysis in rodents", computational: "CNN-based audio event detection with tonality features", neuralNetworkArchitecture: "CNN (operates on spectrogram images)", mlPipeline: "Supervised learning: Convert audio to spectrograms → CNN detects USV regions → classify call types", implementation: "MATLAB", species: "Mouse (Mus musculus), Rat (Rattus norvegicus)", neuroMcpStatus: "pending", containerized: false },
  { name: "Anipose", description: "3D pose estimation from multi-camera views", url: "https://anipose.readthedocs.io/", type: "software", category: "Software", algorithm: "3D pose estimation from multi-camera views", computational: "Triangulation and calibration algorithms for 3D reconstruction from 2D poses", neuralNetworkArchitecture: "N/A (uses geometric methods; can integrate with DLC/SLEAP for 2D poses)", mlPipeline: "N/A (geometric triangulation; ML used only if 2D poses from DLC/SLEAP)", implementation: "Python", species: "Multi-species (general purpose)", neuroMcpStatus: "not-started", containerized: false },
  // ML Models
  { name: "DLC Model Zoo", description: "Pre-trained pose estimation for diverse species", url: "https://huggingface.co/mwmathis", type: "ml_model", category: "ML Models", algorithm: "Pre-trained pose estimation for diverse species", computational: "Transfer learning models (ResNet backbones) trained on species-specific datasets", neuralNetworkArchitecture: "CNN (ResNet-50, ResNet-101, EfficientNet variants)", mlPipeline: "Pre-trained models ready for transfer learning or direct inference", implementation: "Python", species: "Quadrupeds, mice, birds, humans, macaques, primates, horses", neuroMcpStatus: "not-started", containerized: false },
  { name: "DLC Organization", description: "Centralized repository of pose estimation models and demos", url: "https://huggingface.co/DeepLabCut", type: "ml_model", category: "ML Models", algorithm: "Centralized repository of pose estimation models and demos", computational: "Pre-trained neural networks for animal pose across species", neuralNetworkArchitecture: "CNN (various ResNet and EfficientNet architectures)", mlPipeline: "Pre-trained models for direct use or fine-tuning", implementation: "Python", species: "Quadrupeds, birds, humans, multi-species", neuroMcpStatus: "not-started", containerized: false },
  { name: "CEBRA", description: "Dimensionality reduction revealing hidden structures in neural time series", url: "https://cebra.ai/", type: "ml_model", category: "ML Models", algorithm: "Dimensionality reduction revealing hidden structures in neural time series", computational: "Contrastive learning with auxiliary behavioral variables for consistent embeddings", neuralNetworkArchitecture: "CNN or MLP encoders (customizable)", mlPipeline: "Self-supervised/semi-supervised contrastive learning", implementation: "Python", species: "Multi-species (general purpose for neural data)", neuroMcpStatus: "not-started", containerized: false },
  // Datasets
  { name: "SuperAnimal-Quadruped-80K", description: "Large-scale training data for quadruped pose models", url: "https://huggingface.co/datasets/DeepLabCut/SuperAnimal-Quadruped-80K", type: "dataset", category: "Datasets", algorithm: "Large-scale training data for quadruped pose models", computational: "Aggregated labeled images for transfer learning", neuralNetworkArchitecture: "N/A (dataset)", mlPipeline: "Training dataset: 80K labeled images for supervised pose estimation model training", implementation: "Dataset", species: "Quadrupeds (dogs, cats, horses, etc.)", neuroMcpStatus: "not-started", containerized: false },
  { name: "SuperAnimal-TopViewMouse-5K", description: "Training data for top-view mouse pose estimation", url: "https://huggingface.co/datasets/DeepLabCut/SuperAnimal-TopViewMouse-5K", type: "dataset", category: "Datasets", algorithm: "Training data for top-view mouse pose estimation", computational: "Labeled mouse images for model training", neuralNetworkArchitecture: "N/A (dataset)", mlPipeline: "Training dataset: 5K labeled images for supervised pose estimation", implementation: "Dataset", species: "Mouse (Mus musculus)", neuroMcpStatus: "not-started", containerized: false },
  // Benchmarks
  { name: "DLC Benchmarks", description: "Standardized evaluation of pose estimation accuracy across scenarios", url: "https://benchmark.deeplabcut.org/", type: "benchmark", category: "Benchmarks", algorithm: "Standardized evaluation of pose estimation accuracy across scenarios", computational: "Ground-truth labeled test sets (TRI-MOUSE, PARENTING-MOUSE, etc.)", neuralNetworkArchitecture: "N/A (evaluation benchmark)", mlPipeline: "Test/validation datasets with ground truth for model evaluation (PCK, RMSE metrics)", implementation: "Web", species: "Mouse (Mus musculus), Marmoset, Fish, Horse", neuroMcpStatus: "not-started", containerized: false },
  { name: "Animal Pose Leaderboard", description: "Comparative ranking of pose estimation methods", url: "https://paperswithcode.com/task/animal-pose-estimation", type: "benchmark", category: "Benchmarks", algorithm: "Comparative ranking of pose estimation methods", computational: "Standardized metrics (PCK, RMSE) across benchmark datasets", neuralNetworkArchitecture: "N/A (evaluation platform)", mlPipeline: "Standardized evaluation protocol for comparing model performance", implementation: "Web", species: "Multi-species (varies by benchmark)", neuroMcpStatus: "not-started", containerized: false },
  { name: "DLC Leaderboard", description: "Performance comparison for DLC-based approaches", url: "https://huggingface.co/spaces/DeepLabCut/Leaderboard", type: "benchmark", category: "Benchmarks", algorithm: "Performance comparison for DLC-based approaches", computational: "Benchmark-specific accuracy metrics", neuralNetworkArchitecture: "N/A (evaluation platform)", mlPipeline: "Standardized evaluation for DLC variants", implementation: "Web", species: "Multi-species (varies by benchmark)", neuroMcpStatus: "not-started", containerized: false },
  // Protocols
  { name: "DLC 3D Pose Protocol", description: "Multi-camera 3D pose estimation methodology", url: "https://www.nature.com/articles/s41596-019-0176-0", type: "protocol", category: "Protocols", algorithm: "Multi-camera 3D pose estimation methodology", computational: "Triangulation of 2D poses with camera calibration", neuralNetworkArchitecture: "CNN (for 2D pose); geometric methods for 3D", mlPipeline: "Protocol: Train 2D pose models per camera → calibrate cameras → triangulate to 3D coordinates", implementation: "Protocol", species: "Multi-species (general methodology)", neuroMcpStatus: "not-started", containerized: false },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let inserted = 0;
    let skipped = 0;

    for (const r of RESOURCES) {
      // Check if already exists by name
      const { data: existing } = await supabase
        .from("resources")
        .select("id")
        .eq("name", r.name)
        .eq("resource_type", r.type)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("resources").insert({
        name: r.name,
        description: r.description,
        external_url: r.url,
        resource_type: r.type,
        metadata: {
          algorithm: r.algorithm,
          computational: r.computational,
          neuralNetworkArchitecture: r.neuralNetworkArchitecture,
          mlPipeline: r.mlPipeline,
          implementation: r.implementation,
          species: r.species,
          neuroMcpStatus: r.neuroMcpStatus,
          containerized: r.containerized,
          category: r.category,
        },
      });

      if (error) {
        console.error(`Failed to insert ${r.name}:`, error);
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted, skipped, total: RESOURCES.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
