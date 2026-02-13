import { useState } from "react";
import { FlaskConical, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StandardRecommendation {
  name: string;
  description: string;
  relevance: string;
}

interface WorkflowResult {
  pipeline: string;
  tools: string[];
  relatedProjects: { pi: string; species: string; title: string }[];
  tips: string;
  standards: StandardRecommendation[];
}

const SPECIES_OPTIONS = [
  "Mouse", "Rat", "Gerbil", "Zebrafish", "Fruit Fly", "Cichlid",
  "Cowbird", "Sheep", "Ferret", "Capuchin Monkey", "Marmoset",
  "Worm", "Crustacean", "Human",
];

const SENSOR_OPTIONS = [
  "Video cameras", "Ultrasonic microphones", "Neuropixels",
  "iEEG / ECoG", "EEG", "Wireless neural", "Eye tracker",
  "Heart rate / ECG", "Respiration sensor", "Accelerometer / IMU",
  "EMG", "Thermal camera", "RFID", "GPS", "Smartphone sensors",
  "Wearable biochemical", "OPM-MEG", "Microphone array",
];

const BEHAVIOR_OPTIONS = [
  "Locomotion & Movement", "Social Interactions", "Vocalizations & Speech",
  "Feeding & Drinking", "Exploratory Behavior", "Emotional & Stress Responses",
  "Gait Analysis", "Eye Movements", "Cognitive & Memory Tasks",
  "Posture & Balance", "Reproductive Behaviors", "Sleep & Rest",
];

const WORKFLOW_DB: Record<string, { tools: string[]; pipeline: string; tips: string }> = {
  "video+pose": {
    tools: ["DeepLabCut", "SLEAP", "Cellpose"],
    pipeline: "Video Recording → Pose Estimation → Kinematic Feature Extraction → Behavioral Segmentation",
    tips: "Use SLEAP for multi-animal tracking, DeepLabCut for single-animal precision. Cellpose works well for whole-body organism tracking (worms, cells).",
  },
  "audio+vocalization": {
    tools: ["DeepSqueak", "PRAAT", "OpenSmile", "HUME-AI"],
    pipeline: "Audio Recording → USV Detection (DeepSqueak) → Source Localization → Acoustic Feature Extraction → Classification",
    tips: "For rodent USVs, use DeepSqueak. For human speech, PRAAT/OpenSmile. HUME-AI for emotion recognition. Microphone arrays enable source localization in multi-animal environments.",
  },
  "neural+analysis": {
    tools: ["KiloSort3", "MNE-Python", "SpikeGadgets", "OpenEphys"],
    pipeline: "Neural Recording → Spike Sorting (KiloSort3) → LFP Analysis (MNE-Python) → Encoding/Decoding Models",
    tips: "KiloSort3 for Neuropixels spike sorting. MNE-Python for EEG/MEG/iEEG analysis. BCI2000 for real-time synchronization with behavioral data.",
  },
  "multimodal+sync": {
    tools: ["BCI2000", "Custom TTL sync", "Timestamp alignment"],
    pipeline: "Multi-Stream Capture → Clock Synchronization → Sampling Rate Alignment → Unified Data Structure → Cross-Modal Analysis",
    tips: "For human studies, BCI2000 is the gold standard. For animal studies, use shared TTL pulses. Plan for different sampling rates (neural: 30kHz, video: 30-120fps).",
  },
  "behavior+segmentation": {
    tools: ["A-SOID", "UMAP", "PCA", "tSNE", "So-Mo"],
    pipeline: "Pose Data → Feature Extraction → Dimensionality Reduction (UMAP) → Clustering/Classification (A-SOID) → Temporal Sequence Analysis",
    tips: "A-SOID uses active learning for efficient labeling. So-Mo is specialized for social motif discovery. Start with UMAP visualization to understand your behavioral space.",
  },
  "physiology+wearable": {
    tools: ["MNE-Python", "Custom signal processing", "Accelerometer analysis", "EMG recording"],
    pipeline: "Wearable/Physiological Recording → Signal Processing (filtering, artifact removal) → Feature Extraction (time/frequency domain) → Correlation with Behavioral Events → Statistical Analysis",
    tips: "For accelerometer/IMU data, extract movement kinematics and activity levels. Combine with video for ground-truth behavioral labels. Heart rate and respiration can reveal internal states during social interactions.",
  },
  "eye+tracking": {
    tools: ["Tobii Pro", "Eye tracker analysis", "Fixation detection", "Saccade analysis"],
    pipeline: "Eye Tracking Recording → Fixation/Saccade Detection → Gaze Pattern Analysis → Attention Mapping → Behavioral Correlation",
    tips: "For eye movement studies, combine with video or neural data for richer context. EEG hyperscanning can reveal neural correlates of gaze behavior in social interactions.",
  },
};

function recommendWorkflow(
  species: string[],
  sensors: string[],
  behaviors: string[]
): WorkflowResult {
  const hasVideo = sensors.some(s => s.toLowerCase().includes("video") || s.toLowerCase().includes("camera"));
  const hasAudio = sensors.some(s => s.toLowerCase().includes("microphone") || s.toLowerCase().includes("audio"));
  const hasNeural = sensors.some(s => ["neuropixels", "ieeg", "eeg", "wireless neural", "opm-meg"].some(n => s.toLowerCase().includes(n)));
  const hasPhysiology = sensors.some(s => ["heart rate", "respiration", "accelerometer", "emg", "thermal"].some(n => s.toLowerCase().includes(n)));
  const hasVocalization = behaviors.some(b => b.toLowerCase().includes("vocalization") || b.toLowerCase().includes("speech"));
  const hasSocial = behaviors.some(b => b.toLowerCase().includes("social"));

  const tools: string[] = [];
  const pipelineSteps: string[] = [];
  const allTips: string[] = [];

  if (hasVideo) {
    const wf = WORKFLOW_DB["video+pose"];
    tools.push(...wf.tools);
    pipelineSteps.push(wf.pipeline);
    allTips.push(wf.tips);
  }
  if (hasAudio || hasVocalization) {
    const wf = WORKFLOW_DB["audio+vocalization"];
    tools.push(...wf.tools);
    pipelineSteps.push(wf.pipeline);
    allTips.push(wf.tips);
  }
  if (hasNeural) {
    const wf = WORKFLOW_DB["neural+analysis"];
    tools.push(...wf.tools);
    pipelineSteps.push(wf.pipeline);
    allTips.push(wf.tips);
  }
  if ((hasVideo || hasAudio || hasNeural || hasPhysiology) && sensors.length >= 2) {
    const wf = WORKFLOW_DB["multimodal+sync"];
    tools.push(...wf.tools);
    pipelineSteps.push(wf.pipeline);
    allTips.push(wf.tips);
  }
  if (hasVideo && (hasSocial || behaviors.length >= 2)) {
    const wf = WORKFLOW_DB["behavior+segmentation"];
    tools.push(...wf.tools);
    pipelineSteps.push(wf.pipeline);
    allTips.push(wf.tips);
  }
  if (hasPhysiology) {
    const wf = WORKFLOW_DB["physiology+wearable"];
    tools.push(...wf.tools);
    pipelineSteps.push(wf.pipeline);
    allTips.push(wf.tips);
  }
  const hasEyeTracking = sensors.some(s => s.toLowerCase().includes("eye")) || behaviors.some(b => b.toLowerCase().includes("eye"));
  if (hasEyeTracking) {
    const wf = WORKFLOW_DB["eye+tracking"];
    tools.push(...wf.tools);
    pipelineSteps.push(wf.pipeline);
    allTips.push(wf.tips);
  }

  // Deduplicate tools
  const uniqueTools = [...new Set(tools)];

  // Find related projects
  const relatedProjects = findRelatedProjects(species, sensors, behaviors);

  // Recommend data standards
  const standards = recommendStandards(species, sensors, behaviors, hasNeural, hasVideo, hasAudio, hasPhysiology);

  return {
    pipeline: pipelineSteps.join("\n\n→ Then: ") || "No specific pipeline matched. Try asking Hannah for a custom recommendation.",
    tools: uniqueTools,
    relatedProjects,
    tips: allTips.join("\n\n") || "Ask Hannah for detailed guidance on your specific setup.",
    standards,
  };
}

function recommendStandards(
  species: string[],
  sensors: string[],
  behaviors: string[],
  hasNeural: boolean,
  hasVideo: boolean,
  hasAudio: boolean,
  hasPhysiology: boolean
): StandardRecommendation[] {
  const standards: StandardRecommendation[] = [];
  const isHuman = species.some(s => s.toLowerCase() === "human");

  // NWB — always recommended for neural data
  if (hasNeural) {
    standards.push({
      name: "Neurodata Without Borders (NWB)",
      description: "Open standard for neurophysiology data including neural recordings, behavioral events, and stimuli.",
      relevance: "Your neural recordings (spike trains, LFP, EEG) should be stored in NWB format for reproducibility and sharing.",
    });
  }

  // BIDS — recommended for neuroimaging / human EEG
  if (isHuman || hasNeural) {
    standards.push({
      name: "Brain Imaging Data Structure (BIDS)",
      description: "Standard for organizing neuroscience datasets to facilitate sharing and automated analysis.",
      relevance: isHuman
        ? "Organize your human neurophysiology sessions in BIDS-compatible directory structures."
        : "BIDS extensions (BIDS-animal) can structure your animal neural datasets.",
    });
  }

  // NBO — always relevant for behavior studies
  if (behaviors.length > 0) {
    standards.push({
      name: "Neuro Behavior Ontology (NBO)",
      description: "Ontology of human and animal behaviors and behavioral phenotypes.",
      relevance: "Use NBO terms to annotate your behavioral categories for cross-study comparability.",
    });
  }

  // HED — for event-rich experiments
  if (hasVideo || hasAudio || hasNeural) {
    standards.push({
      name: "Hierarchical Event Descriptors (HED)",
      description: "Standardized tagging system for events and metadata in time-series experiments.",
      relevance: "Tag your experimental events (stimuli, behavioral onsets, trial markers) using HED for machine-readable metadata.",
    });
  }

  // ndx-pose for pose data
  if (hasVideo) {
    standards.push({
      name: "ndx-pose (NWB Extension)",
      description: "NWB extension for storing pose estimation data from DeepLabCut, SLEAP, etc.",
      relevance: "Store your pose estimation outputs (keypoints, confidence scores) alongside neural data in NWB.",
    });
  }

  // DANDI for sharing
  if (hasNeural || (isHuman && hasPhysiology)) {
    standards.push({
      name: "DANDI Archive",
      description: "Public archive for publishing neurophysiology datasets in NWB format.",
      relevance: "Publish your finalized datasets on DANDI for NIH compliance and community access.",
    });
  }

  return standards;
}

function findRelatedProjects(species: string[], sensors: string[], behaviors: string[]) {
  const projects = [
    { pi: "Eva Dyer", species: "Cichlid", title: "Multi-Animal Behavior Arena", keywords: ["video", "pose", "social", "fish"] },
    { pi: "Pulkit Grover / Eric Yttri", species: "Mouse", title: "Multimodal Behavioral Segmentation", keywords: ["neuropixels", "sleap", "a-soid", "mouse", "stress"] },
    { pi: "Dan Sanes", species: "Gerbil", title: "Vocalization & Social Behavior", keywords: ["audio", "microphone", "vocalization", "gerbil", "deepsqueak"] },
    { pi: "Firooz Aflatouni / Marc Schmidt", species: "Cowbird", title: "Smart Aviary Social Behavior", keywords: ["video", "audio", "bird", "cowbird", "rfid", "social", "accelerometer", "imu", "eye"] },
    { pi: "Nancy Padilla Coreano", species: "Mouse", title: "Social Motif Generator", keywords: ["respiration", "heart", "physiology", "social", "mouse", "accelerometer", "imu"] },
    { pi: "Timothy Dunn", species: "Rats/Mice", title: "3D Social Behavior Tracking", keywords: ["video", "3d", "pose", "social", "rat", "mouse", "locomotion", "gait"] },
    { pi: "Cheryl Corcoran", species: "Human", title: "Dyadic Conversation Synchrony", keywords: ["eeg", "human", "speech", "emotion", "social", "eye", "facial", "heart"] },
    { pi: "Gordon Shepherd", species: "Mouse", title: "Oromanual Food-Handling", keywords: ["emg", "deeplabcut", "feeding", "mouse", "thermistor"] },
    { pi: "Caleb Kemere", species: "Sheep", title: "Sheep Flocking Behavior", keywords: ["gps", "wireless", "neural", "sheep", "field", "imu", "accelerometer"] },
    { pi: "Katherine Nagel / David Schoppik", species: "Zebrafish/Fly", title: "Optical Navigation Imaging", keywords: ["zebrafish", "fly", "bioluminescence", "navigation", "eye", "locomotion"] },
    { pi: "Mansi Srivastava", species: "Acoel Worm", title: "Organism-Environment Interactions", keywords: ["worm", "deeplabcut", "sleap", "environment", "regeneration"] },
    { pi: "Mengsen Zhang", species: "Ferret", title: "Multi-Scale Social Dynamics", keywords: ["ferret", "electrophysiology", "accelerometer", "imu", "social", "topology"] },
    { pi: "Shelly Flagel", species: "Capuchin Monkey", title: "AI Forest for Wild Primates", keywords: ["primate", "monkey", "field", "deep learning", "remote", "cognitive"] },
    { pi: "Nanthia Suthana", species: "Human", title: "Neural & Peripheral Biomarkers", keywords: ["ieeg", "human", "wearable", "biochemical", "stress", "vr", "eye", "accelerometer"] },
    { pi: "Joshua Jacobs", species: "Human", title: "CAMERA Platform (Anxiety/Memory)", keywords: ["ieeg", "human", "smartphone", "anxiety", "memory", "multimodal", "eye", "heart", "accelerometer"] },
    { pi: "Cory Inman", species: "Human", title: "CAPTURE App (Memory)", keywords: ["ieeg", "human", "gps", "accelerometer", "imu", "eye", "memory", "smartphone"] },
    { pi: "Agatha Lenartowicz", species: "Human", title: "Attention State Tracking", keywords: ["eeg", "human", "eye", "attention", "accelerometer", "heart"] },
  ];

  const speciesLower = species.map(s => s.toLowerCase());
  const sensorLower = sensors.map(s => s.toLowerCase());
  const behaviorLower = behaviors.map(b => b.toLowerCase());
  const allTerms = [...speciesLower, ...sensorLower, ...behaviorLower];

  return projects
    .map(p => {
      const score = p.keywords.filter(k => allTerms.some(t => t.includes(k) || k.includes(t))).length;
      return { ...p, score };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

export function WorkflowRecommender({ onAskHannah }: { onAskHannah: (question: string) => void }) {
  const [step, setStep] = useState(0);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([]);
  const [result, setResult] = useState<WorkflowResult | null>(null);

  const toggleSelection = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      const recommendation = recommendWorkflow(selectedSpecies, selectedSensors, selectedBehaviors);
      setResult(recommendation);
      setStep(3);
    }
  };

  const handleReset = () => {
    setStep(0);
    setSelectedSpecies([]);
    setSelectedSensors([]);
    setSelectedBehaviors([]);
    setResult(null);
  };

  const handleDeepDive = () => {
    const question = `I'm working with ${selectedSpecies.join(", ")} using ${selectedSensors.join(", ")}. I'm interested in studying ${selectedBehaviors.join(", ")}. What's the best workflow pipeline and which BBQS projects should I look at for reference?`;
    onAskHannah(question);
  };

  if (step === 3 && result) {
    return (
      <div className="border border-border rounded-lg p-4 mb-4 space-y-4 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Recommended Workflow</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 h-7 text-xs">
            <RotateCcw className="h-3 w-3" /> Start over
          </Button>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">SUGGESTED TOOLS</p>
          <div className="flex flex-wrap gap-1.5">
            {result.tools.map(t => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">PIPELINE</p>
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{result.pipeline}</p>
        </div>

        {result.relatedProjects.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">RELATED BBQS PROJECTS</p>
            <div className="space-y-1.5">
              {result.relatedProjects.map((p, i) => (
                <div key={i} className="text-xs">
                  <span className="font-medium text-foreground">{p.title}</span>
                  <span className="text-muted-foreground"> — {p.pi} ({p.species})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">TIPS</p>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{result.tips}</p>
        </div>

        {result.standards.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">RECOMMENDED STANDARDS & ONTOLOGIES</p>
            <div className="space-y-2.5">
              {result.standards.map((s, i) => (
                <div key={i} className="border border-border rounded-md p-2.5 bg-background/50">
                  <p className="text-xs font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  <p className="text-xs text-primary mt-1 italic">{s.relevance}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button size="sm" onClick={handleDeepDive} className="w-full gap-2 text-xs h-8">
          <Sparkles className="h-3 w-3" /> Ask Hannah for deeper analysis
        </Button>
      </div>
    );
  }

  const stepConfig = [
    { title: "What species are you working with?", options: SPECIES_OPTIONS, selected: selectedSpecies, setter: setSelectedSpecies },
    { title: "What sensors / data sources do you have?", options: SENSOR_OPTIONS, selected: selectedSensors, setter: setSelectedSensors },
    { title: "What behaviors are you studying?", options: BEHAVIOR_OPTIONS, selected: selectedBehaviors, setter: setSelectedBehaviors },
  ];

  const current = stepConfig[step];

  return (
    <div className="border border-border rounded-lg p-4 mb-4 bg-card/50">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Workflow Recommender</h3>
        <span className="text-xs text-muted-foreground ml-auto">Step {step + 1}/3</span>
      </div>

      <p className="text-sm text-foreground mb-3">{current.title}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {current.options.map(opt => (
          <Badge
            key={opt}
            variant={current.selected.includes(opt) ? "default" : "outline"}
            className={cn(
              "cursor-pointer text-xs transition-colors",
              current.selected.includes(opt)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            )}
            onClick={() => toggleSelection(opt, current.selected, current.setter)}
          >
            {opt}
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} className="text-xs h-7">
            Back
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleNext}
          disabled={current.selected.length === 0}
          className="gap-1 text-xs h-7 ml-auto"
        >
          {step < 2 ? "Next" : "Get Recommendation"} <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
