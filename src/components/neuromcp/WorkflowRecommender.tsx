import { useState } from "react";
import { FlaskConical, ArrowRight, RotateCcw, Sparkles, Beaker, Radio, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const uniqueTools = [...new Set(tools)];
  const relatedProjects = findRelatedProjects(species, sensors, behaviors);
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

  if (hasNeural) {
    standards.push({
      name: "Neurodata Without Borders (NWB)",
      description: "Open standard for neurophysiology data including neural recordings, behavioral events, and stimuli.",
      relevance: "Your neural recordings (spike trains, LFP, EEG) should be stored in NWB format for reproducibility and sharing.",
    });
  }

  if (isHuman || hasNeural) {
    standards.push({
      name: "Brain Imaging Data Structure (BIDS)",
      description: "Standard for organizing neuroscience datasets to facilitate sharing and automated analysis.",
      relevance: isHuman
        ? "Organize your human neurophysiology sessions in BIDS-compatible directory structures."
        : "BIDS extensions (BIDS-animal) can structure your animal neural datasets.",
    });
  }

  if (behaviors.length > 0) {
    standards.push({
      name: "Neuro Behavior Ontology (NBO)",
      description: "Ontology of human and animal behaviors and behavioral phenotypes.",
      relevance: "Use NBO terms to annotate your behavioral categories for cross-study comparability.",
    });
  }

  if (hasVideo || hasAudio || hasNeural) {
    standards.push({
      name: "Hierarchical Event Descriptors (HED)",
      description: "Standardized tagging system for events and metadata in time-series experiments.",
      relevance: "Tag your experimental events (stimuli, behavioral onsets, trial markers) using HED for machine-readable metadata.",
    });
  }

  if (hasVideo) {
    standards.push({
      name: "ndx-pose (NWB Extension)",
      description: "NWB extension for storing pose estimation data from DeepLabCut, SLEAP, etc.",
      relevance: "Store your pose estimation outputs (keypoints, confidence scores) alongside neural data in NWB.",
    });
  }

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

const STEP_COLORS = [
  { bg: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-500/30", accent: "text-emerald-600 dark:text-emerald-400", icon: Beaker, pill: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" },
  { bg: "from-blue-500/10 to-indigo-500/10", border: "border-blue-500/30", accent: "text-blue-600 dark:text-blue-400", icon: Radio, pill: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20" },
  { bg: "from-violet-500/10 to-purple-500/10", border: "border-violet-500/30", accent: "text-violet-600 dark:text-violet-400", icon: Activity, pill: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20" },
];

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
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-5 mb-4 space-y-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Recommended Workflow</h3>
              <p className="text-[11px] text-muted-foreground">{selectedSpecies.join(", ")} · {selectedSensors.length} sensors · {selectedBehaviors.length} behaviors</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 h-7 text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Suggested Tools</p>
          <div className="flex flex-wrap gap-1.5">
            {result.tools.map(t => (
              <span key={t} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pipeline</p>
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{result.pipeline}</p>
        </div>

        {result.relatedProjects.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Related BBQS Projects</p>
            <div className="space-y-2">
              {result.relatedProjects.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">{p.title}</span>
                    <span className="text-muted-foreground"> — {p.pi} ({p.species})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tips</p>
          <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{result.tips}</p>
        </div>

        {result.standards.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommended Standards & Ontologies</p>
            <div className="grid gap-2">
              {result.standards.map((s, i) => (
                <div key={i} className="rounded-lg border border-border p-3 bg-background/60 hover:bg-background/80 transition-colors">
                  <p className="text-xs font-semibold text-foreground">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>
                  <p className="text-[11px] text-primary mt-1 italic">{s.relevance}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleDeepDive} className="w-full gap-2 text-sm h-9 bg-primary hover:bg-primary/90 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" /> Ask Hannah for deeper analysis
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
  const colors = STEP_COLORS[step];
  const StepIcon = colors.icon;

  return (
    <div className={cn(
      "rounded-xl border p-5 mb-4 bg-gradient-to-br transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
      colors.bg, colors.border
    )}>
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-500",
              i <= step ? "bg-primary" : "bg-muted-foreground/15"
            )}
          />
        ))}
      </div>

      <div className="flex items-center gap-2.5 mb-4">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", `bg-background/80`)}>
          <StepIcon className={cn("h-5 w-5", colors.accent)} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-foreground">Workflow Recommender</h3>
          <p className="text-[11px] text-muted-foreground">Step {step + 1} of 3</p>
        </div>
      </div>

      <p className={cn("text-sm font-medium mb-3", colors.accent)}>{current.title}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {current.options.map(opt => (
          <button
            key={opt}
            onClick={() => toggleSelection(opt, current.selected, current.setter)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
              current.selected.includes(opt)
                ? cn(colors.pill, "shadow-sm scale-[1.02]")
                : "bg-background/60 text-muted-foreground border-border hover:border-muted-foreground/30 hover:bg-background"
            )}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} className="text-xs h-8">
            Back
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleNext}
          disabled={current.selected.length === 0}
          className="gap-1.5 text-xs h-8 ml-auto shadow-sm"
        >
          {step < 2 ? "Next" : "Get Recommendation"} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
